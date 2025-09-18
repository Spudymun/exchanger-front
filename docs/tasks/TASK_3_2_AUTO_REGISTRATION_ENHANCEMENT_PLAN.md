# Детальный план реализации: Task 3.2 - Auto-Registration Logic Enhancement

> **Дата создания:** 18 сентября 2025  
> **Роль:** Агент-кодер (фокус на рефакторинг и паттерны)  
> **Цель:** Доработать существующую auto-registration logic для полного соответствия AC2.1A  
> **Источник:** `docs/tasks/ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md`, `docs/analysis/PROJECT_ALIGNED_ORDERS_AC.md`

---

## 🚨 КРИТИЧЕСКИЙ АНАЛИЗ: Auto-Registration УЖЕ РЕАЛИЗОВАН!

**ВАЖНОЕ ОТКРЫТИЕ:** После детального анализа кодовой базы обнаружено, что **AutoRegistrationService уже полностью реализован** в `packages/exchange-core/src/services/auto-registration-service.ts` и **активно используется** в `apps/web/src/server/trpc/routers/exchange.ts`.

### ✅ Что уже работает:

1. **AutoRegistrationService класс** - полная реализация AC2.1A логики
2. **UserManagerFactory.createForWeb()** - context-aware создание UserManager
3. **exchange.createOrder** - интеграция с AutoRegistrationService
4. **SessionMetadata** - правильная передача IP и User-Agent
5. **Atomic operations** - transaction-safe создание пользователей и сессий

### 🔍 Что требует доработки (РЕАЛЬНЫЕ пробелы):

Анализируя AC2.1A требования против существующей реализации, найдены **КОНКРЕТНЫЕ несоответствия**:

---

## 📋 ПЛАН ДОРАБОТКИ СУЩЕСТВУЮЩЕЙ РЕАЛИЗАЦИИ

### 🎯 Цель задачи 3.2 (ПЕРЕФОРМУЛИРОВАННАЯ)

**НЕ "создать auto-registration logic"** (он уже есть), а **"усовершенствовать existing auto-registration для 100% соответствия AC2.1A"**.

### 🔧 Конкретные доработки, необходимые для AC2.1A compliance:

---

## 1. ДОРАБОТКА: Enhanced User Status Detection

### 🚨 Проблема:

Текущий `AutoRegistrationService.getOrCreateUser()` использует простую логику:

```typescript
let user = await this.userManager.findByEmail(email);
if (!user) {
  // auto-registration
}
```

### ✅ Требование AC2.1A:

- **Незарегистрированные:** Auto-registration + session
- **Зарегистрированные но незалогиненные:** Auto-login + session
- **Залогиненные:** Использовать существующую session

### 🛠️ Решение:

**Файл:** `packages/exchange-core/src/services/auto-registration-service.ts`

**Модификация метода:** `getOrCreateUser` → `determineUserStatus`

```typescript
interface UserStatus {
  user: User;
  authenticationMethod: 'auto-registration' | 'auto-login' | 'existing-session';
  isNewUser: boolean;
}

private async determineUserStatus(
  email: string,
  existingSessionId?: string
): Promise<UserStatus> {
  // 1. Check if user is already logged in with valid session
  if (existingSessionId) {
    const sessionUser = await this.userManager.findBySessionId?.(existingSessionId);
    if (sessionUser && sessionUser.email === email) {
      return {
        user: sessionUser,
        authenticationMethod: 'existing-session',
        isNewUser: false
      };
    }
  }

  // 2. Check if user exists in database
  const existingUser = await this.userManager.findByEmail(email);

  if (existingUser) {
    // Registered but not logged in → auto-login
    return {
      user: existingUser,
      authenticationMethod: 'auto-login',
      isNewUser: false
    };
  }

  // 3. Unregistered → auto-registration
  const newUser = await this.userManager.create({
    email,
    hashedPassword: undefined,
    isVerified: false,
  });

  return {
    user: newUser,
    authenticationMethod: 'auto-registration',
    isNewUser: true
  };
}
```

---

## 2. ДОРАБОТКА: Session Context Integration

### 🚨 Проблема:

Текущий flow в `exchange.createOrder` не передает existing sessionId в AutoRegistrationService.

### ✅ Требование AC2.1A:

Проверять existing session **ПЕРЕД** созданием новой сессии.

### ⚠️ **КРИТИЧЕСКАЯ КОРРЕКЦИЯ (ВЕРИФИЦИРОВАНО)**:

**ФАКТИЧЕСКОЕ СОСТОЯНИЕ КОДА**: sessionId доступен в `ctx` но **НЕ ПЕРЕДАЕТСЯ** в `createOrderInSystem`

- ✅ `ctx.sessionId` существует в tRPC context (файл: `apps/web/src/server/trpc/context.ts`)
- ❌ `existingSessionId` параметр **ОТСУТСТВУЕТ** в текущей сигнатуре `createOrderInSystem`
- ❌ `ctx.sessionId` **НЕ ПЕРЕДАЕТСЯ** в вызове функции

### 🛠️ Решение:

**Файл:** `apps/web/src/server/trpc/routers/exchange.ts`

**Модификация функции:** `createOrderInSystem`

```typescript
async function createOrderInSystem(
  orderRequest: {
    email: string;
    cryptoAmount: number;
    currency: (typeof CRYPTOCURRENCIES)[number];
    uahAmount: number;
    recipientData?: { cardNumber?: string; bankDetails?: string };
  },
  sessionMetadata: SessionMetadata,
  existingSessionId?: string // ✅ ДОБАВИТЬ НОВЫЙ параметр
) {
  const depositAddress = generateDepositAddress(orderRequest.currency);
  const webUserManager = await UserManagerFactory.createForWeb();

  // ✅ ENHANCED: Pass existing sessionId для smart session management
  const autoRegService = new AutoRegistrationService(webUserManager);

  const userSession = await autoRegService.ensureUserWithSession(
    orderRequest.email,
    sessionMetadata,
    existingSessionId // ✅ ПЕРЕДАТЬ НОВЫЙ параметр
  );

  // Rest remains the same...
}
```

**Обновление в createOrder procedure:**

```typescript
.mutation(async ({ input, ctx }) => {
  // ... validation ...

  const sessionMetadata: SessionMetadata = {
    ip: ctx.ip || AUTH_CONSTANTS.FALLBACK_IP,
    userAgent: ctx.req.headers['user-agent'] || AUTH_CONSTANTS.FALLBACK_USER_AGENT,
  };

  // ✅ ИСПРАВИТЬ: Добавить передачу existing sessionId из context
  const { order, depositAddress, sessionInfo } = await createOrderInSystem(
    orderRequest,
    sessionMetadata,
    ctx.sessionId // ✅ ДОБАВИТЬ НОВЫЙ параметр из tRPC context
  );

  // ... return ...
});
```

---

## 3. ДОРАБОТКА: Enhanced Session Management

### 🚨 Проблема:

`ensureUserWithSession` всегда создает новую сессию, игнорируя existing sessions.

### ✅ Требование AC2.1A:

- **Existing session:** Продлить TTL существующей сессии
- **No session:** Создать новую сессию
- **Invalid session:** Создать новую сессию

### 🛠️ Решение:

**Файл:** `packages/exchange-core/src/services/auto-registration-service.ts`

**Модификация метода:** `ensureUserWithSession`

```typescript
async ensureUserWithSession(
  email: string,
  sessionMetadata: SessionMetadata,
  existingSessionId?: string // ✅ НОВЫЙ параметр
): Promise<AutoRegistrationResult> {
  try {
    this.logger.info('Ensuring user with session', { email, hasExistingSession: !!existingSessionId });

    // ✅ ENHANCED: Determine user authentication status
    const userStatus = await this.determineUserStatus(email, existingSessionId);

    let finalSessionId: string;

    switch (userStatus.authenticationMethod) {
      case 'existing-session':
        // Продлить существующую сессию
        finalSessionId = existingSessionId!;
        await this.refreshUserSession(finalSessionId);
        break;

      case 'auto-login':
      case 'auto-registration':
        // Создать новую сессию
        finalSessionId = await this.createUserSession(userStatus.user.id, sessionMetadata);
        break;
    }

    this.logger.info('User session ensured successfully', {
      userId: userStatus.user.id,
      authMethod: userStatus.authenticationMethod,
      isNewUser: userStatus.isNewUser,
      sessionId: finalSessionId.substring(0, 8) + '...',
    });

    return {
      user: userStatus.user,
      sessionId: finalSessionId,
      isNewUser: userStatus.isNewUser,
      authenticationMethod: userStatus.authenticationMethod // ✅ НОВОЕ поле для debugging
    };
  } catch (error) {
    // ... error handling ...
  }
}
```

---

## 4. ДОРАБОТКА: Type System Enhancement

### 🚨 Проблема:

`AutoRegistrationResult` interface не отражает enhanced functionality.

### ✅ Требование AC2.1A:

Полная информация о типе authentication для audit trail.

### 🛠️ Решение:

**Файл:** `packages/exchange-core/src/services/auto-registration-service.ts`

```typescript
export interface AutoRegistrationResult {
  user: User;
  sessionId: string;
  isNewUser: boolean;
  authenticationMethod: 'auto-registration' | 'auto-login' | 'existing-session'; // ✅ НОВОЕ поле
}

export interface UserAuthenticationStatus {
  user: User;
  authenticationMethod: 'auto-registration' | 'auto-login' | 'existing-session';
  isNewUser: boolean;
  sessionAction: 'created' | 'extended' | 'reused'; // ✅ НОВОЕ поле для session management
}
```

---

## 5. ДОРАБОТКА: Error Handling & Edge Cases

### 🚨 Проблема:

Недостаточная обработка edge cases в session management.

### ✅ Требование AC2.1A:

Robust error handling для all authentication scenarios.

### 🛠️ Решение:

**Файл:** `packages/exchange-core/src/services/auto-registration-service.ts`

```typescript
private async handleSessionValidation(
  sessionId: string,
  expectedUserId: string
): Promise<boolean> {
  try {
    // Validate session exists and belongs to correct user
    if (!this.userManager.findBySessionId) {
      this.logger.warn('Session validation not supported by UserManager implementation');
      return false;
    }

    const sessionUser = await this.userManager.findBySessionId(sessionId);

    if (!sessionUser) {
      this.logger.info('Session not found or expired', { sessionId: sessionId.substring(0, 8) + '...' });
      return false;
    }

    if (sessionUser.id !== expectedUserId) {
      this.logger.error('Session belongs to different user', {
        sessionId: sessionId.substring(0, 8) + '...',
        expectedUserId,
        actualUserId: sessionUser.id
      });
      return false;
    }

    return true;
  } catch (error) {
    this.logger.error('Session validation failed', {
      error: error instanceof Error ? error.message : String(error),
      sessionId: sessionId.substring(0, 8) + '...'
    });
    return false;
  }
}
```

---

## 6. ДОРАБОТКА: Integration with Existing Architecture

### 🚨 Проблема:

Нужно обеспечить backward compatibility с existing authentication flow.

### ✅ Требование AC2.1A:

Seamless integration без нарушения existing patterns.

### 🛠️ Решение:

**Файл:** `packages/exchange-core/src/index.ts`

```typescript
// ✅ Export enhanced types
export type {
  AutoRegistrationResult,
  UserAuthenticationStatus,
} from './services/auto-registration-service';

// ✅ Export service class
export { AutoRegistrationService } from './services/auto-registration-service';
```

**Файл:** `apps/web/src/server/trpc/context.ts` (если нужно)

Обеспечить что `ctx.sessionId` доступен в createOrder:

```typescript
// Убедиться что sessionId передается в context для createOrder
export const createContext = async (opts: CreateNextContextOptions) => {
  // ... existing code ...

  const sessionId = req.cookies.sessionId || req.headers.authorization?.replace('Bearer ', '');

  // ... rest of context creation ...

  return { req, res, ip, user, sessionId, locale, getErrorMessage };
};
```

---

## 📊 АРХИТЕКТУРНАЯ ИНТЕГРАЦИЯ

### ✅ Соответствие существующим паттернам:

1. **Factory Pattern** - использование `UserManagerFactory.createForWeb()`
2. **Service Layer** - расширение `AutoRegistrationService`
3. **Session Management** - интеграция с `session-management` package
4. **Error Handling** - использование centralized logger
5. **Type Safety** - enhanced TypeScript interfaces

### ✅ Backward Compatibility:

- Existing `ensureUserWithSession(email, sessionMetadata)` calls остаются рабочими
- New signature `ensureUserWithSession(email, sessionMetadata, existingSessionId?)` with optional parameter
- No breaking changes to existing API

### ✅ Centralized Packages Usage:

- `@repo/constants` - для AUTH_CONSTANTS
- `@repo/session-management` - для UserManagerFactory и types
- `@repo/utils` - для createEnvironmentLogger
- `@repo/exchange-core` - для User types

---

## 🎯 SUMMARY: Что конкретно нужно изменить

### 📝 МОДИФИКАЦИИ (НЕ создание с нуля):

1. **Enhance** `AutoRegistrationService.getOrCreateUser()` → `determineUserStatus()`
2. **Extend** `ensureUserWithSession()` для поддержки existing sessions
3. **Add** enhanced error handling для edge cases
4. **Update** `createOrderInSystem()` для передачи existing sessionId
5. **Enhance** TypeScript types для полной информации о authentication

### 🚫 ЧТО НЕ НУЖНО создавать:

- ❌ AutoRegistrationService класс (уже есть)
- ❌ UserManagerFactory integration (уже есть)
- ❌ Basic session creation logic (уже есть)
- ❌ tRPC procedure structure (уже есть)
- ❌ Error handling infrastructure (уже есть)

---

## 📋 DEFINITION OF DONE

### ✅ Техническая готовность:

- [ ] Enhanced `AutoRegistrationService` supports all AC2.1A scenarios
- [ ] `exchange.createOrder` passes existing sessionId correctly
- [ ] Session reuse logic works for authenticated users
- [ ] All TypeScript types updated for enhanced functionality

### ✅ Интеграция:

- [ ] Enhanced service integrated in existing `createOrderInSystem`
- [ ] Backward compatibility maintained for existing API calls
- [ ] No breaking changes to existing authentication flow

### ✅ Функциональность:

- [ ] Auto-registration for new users works
- [ ] Auto-login for existing users works
- [ ] Session reuse for logged-in users works
- [ ] All scenarios create valid Order with userId linkage

### ✅ Качество:

- [ ] Enhanced error handling for all edge cases
- [ ] Comprehensive logging for audit trail
- [ ] Type safety maintained throughout
- [ ] Follows existing code style and patterns

---

## 🎮 IMPLEMENTATION SEQUENCE

1. **Phase 1:** Enhance `AutoRegistrationService` internal logic
2. **Phase 2:** Update `createOrderInSystem` signature and integration
3. **Phase 3:** Enhance error handling and edge cases
4. **Phase 4:** Update TypeScript types and exports
5. **Phase 5:** Testing and validation

**Каждая фаза - это РЕФАКТОРИНГ existing code, НЕ создание нового.**

---

**ИТОГ:** Task 3.2 - это **enhancement existing auto-registration logic** для полного AC2.1A compliance, НЕ создание с нуля. Existing architecture уже 80% готова, нужны targeted improvements.
