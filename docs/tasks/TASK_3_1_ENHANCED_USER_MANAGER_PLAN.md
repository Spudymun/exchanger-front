# ИСПРАВЛЕННЫЙ план реализации задачи 3.1: Расширение UserManagerFactory для flexible authentication

> **Создано:** 18 сентября 2025  
> **ИСПРАВЛЕНО:** 18 сентября 2025 - убрано дублирование, следование архитектуре проекта  
> \*\*ПОВТОРНО ИСПРА---

## 🎯 РЕЗУЛЬТАТ: Минимальная реализация БЕЗ архитектурных нарушений

### Что получаем:

1. **✅ Соответствие AC2.1A** - flexible authentication через AutoRegistrationService.ensureUserWithSession
2. **✅ Обязательный userId для заявок** - через session management
3. **✅ Multi-App Context Support** - через UserManagerFactory.createForWeb()
4. **✅ Соблюдение Rule 20** - НЕТ дублирования, только экспорт и интеграция
5. **✅ Архитектурная консистентность** - используем существующие patterns
6. **✅ Соблюдение Rule 24** - проверена реальная структура проекта

### Количество изменений:

- **Новые файлы:** 1 (`packages/exchange-core/src/utils/user-session-helpers.ts`)
- **Новые экспорты:** 2 (AutoRegistrationService, user-session-helpers)
- **Измененные файлы:** 2 (services/index.ts, exchange router)
- **Новые типы:** 2 (`UserSessionStatus`, `UserStatusAnalysis`)

### Совместимость:

- ✅ Все существующие API остаются без изменений
- ✅ Обратная совместимость на 100%
- ✅ Постепенное внедрение (можно применять поэтапно)
- ✅ Нет breaking changes
- ✅ Фактически проверенная архитектурная интеграция

---

## ✅ Plan Execution Checklist

- [ ] Phase 1: Экспорт AutoRegistrationService из пакета exchange-core
- [ ] Phase 2: Обновить exchange router для session management с Multi-App Context
- [ ] Phase 3: Создать helper функции для анализа статуса пользователя

**Оценка времени реализации:** 2-3 часа (проверена реальная архитектура)тября 2025 - проверена реальная архитектура проекта, убраны архитектурные ошибки

> **Задача:** ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md → 3.1  
> **Роль:** Агент-кодер (фокус на рефакторинг и паттерны)  
> **Архитектура:** Next.js 15 + tRPC + Turborepo + Session Management Package

---

## 🎯 Понимание задачи

### 📝 Задача 3.1 из ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md

**Задача:** Расширить логику для flexible authentication

**Требования:**

- Обеспечить обязательную привязку заявок к пользователю через сессию
- Определение статуса пользователя: незарегистрированный/зарегистрированный/залогиненный
- Подготовка логики для условной регистрации/авторизации

**Проблема:** Заявки создаются с auto-registration но БЕЗ СЕССИИ, нет гарантии что у заявки есть владелец для связи  
**Цель:** Обеспечить ОБЯЗАТЕЛЬНУЮ привязку каждой заявки к пользователю через сессию

## 🏗️ **АРХИТЕКТУРНАЯ СИТУАЦИЯ (ПРОВЕРЕНО ФАКТИЧЕСКИ)**

**✅ ЧТО УЖЕ ЕСТЬ:**

- UserManagerFactory экспортируется из `@repo/session-management` ✅
- AutoRegistrationService существует в `packages/exchange-core/src/services/` ✅
- ProductionUserManager имеет метод `createSession()` ✅
- Exchange router уже делает auto-registration ✅

**❌ ЧТО НЕ ХВАТАЕТ:**

- AutoRegistrationService НЕ экспортируется из пакета ❌
- Exchange router НЕ создает сессии после auto-registration ❌
- Нет метода createAutoRegistrationService в UserManagerFactory ❌

**✅ ПРАВИЛЬНОЕ РЕШЕНИЕ:** Минимальные изменения для интеграции session management

---

## 📋 МИНИМАЛИСТИЧНЫЙ план реализации (БЕЗ ИЗБЫТОЧНОСТИ)

### Phase 1: Экспорт AutoRegistrationService из пакета

**Цель:** Сделать AutoRegistrationService доступным для использования в exchange router

**1.1 Добавить экспорт в services/index.ts**

**Файл:** `packages/exchange-core/src/services/index.ts`

```typescript
export * from './id-generation';
export * from './crypto-address-generation';

// Wallet Pool Management (Task 2.1)
export * from './wallet-pool-manager';
export * from './wallet-pool-manager-factory';

// Wallet Strategies
export * from './wallet-strategies/wallet-allocation-strategy';
export * from './wallet-strategies/immediate-allocation-strategy';
export * from './wallet-strategies/queue-allocation-strategy';

// ✅ НОВЫЙ экспорт для Task 3.1
export * from './auto-registration-service';
```

### Phase 2: Интеграция session management в exchange router

**Цель:** Заменить простую auto-registration на полноценную с сессиями

**2.1 Обновить exchange router для создания сессий**

**Файл:** `apps/web/src/server/trpc/routers/exchange.ts`

```typescript
// ✅ Добавить импорты
import { UserManagerFactory } from '@repo/session-management';
import { AutoRegistrationService } from '@repo/exchange-core';

// ✅ ЗАМЕНИТЬ createOrderInSystem функцию
async function createOrderInSystem(
  orderRequest: {
    email: string;
    cryptoAmount: number;
    currency: (typeof CRYPTOCURRENCIES)[number];
    uahAmount: number;
    recipientData?: { cardNumber?: string; bankDetails?: string };
  },
  sessionMetadata: { ip: string; userAgent: string }
) {
  const depositAddress = generateDepositAddress(orderRequest.currency);

  // ✅ НОВОЕ: Создаем UserManager для web контекста (Multi-App support)
  const webUserManager = await UserManagerFactory.createForWeb();

  // ✅ НОВОЕ: Создаем AutoRegistrationService
  const autoRegService = new AutoRegistrationService(webUserManager);

  // ✅ НОВОЕ: Используем ensureUserWithSession вместо простой auto-registration
  const userSession = await autoRegService.ensureUserWithSession(
    orderRequest.email,
    sessionMetadata
  );

  const order = await orderManager.create({
    userId: userSession.user.id, // ✅ ГАРАНТИРОВАННЫЙ userId из сессии
    email: orderRequest.email, // ✅ Требуется для CreateOrderRequest interface
    cryptoAmount: orderRequest.cryptoAmount,
    currency: orderRequest.currency,
    uahAmount: orderRequest.uahAmount,
    recipientData: orderRequest.recipientData,
  });

  return {
    order,
    depositAddress,
    sessionInfo: {
      sessionId: userSession.sessionId,
      isNewUser: userSession.isNewUser,
    },
  };
}

export const exchangeRouter = createTRPCRouter({
  createOrder: rateLimitMiddleware.createOrder
    .input(/* existing schema */)
    .mutation(async ({ input, ctx }) => {
      // ... existing validation logic

      const orderRequest = prepareOrderRequest(input);

      // ✅ НОВОЕ: Подготовка session metadata
      const sessionMetadata = {
        ip: ctx.ip || '127.0.0.1',
        userAgent: ctx.req.headers['user-agent'] || 'Unknown',
      };

      // ✅ ОБНОВЛЕННЫЙ вызов с session metadata
      const { order, depositAddress, sessionInfo } = await createOrderInSystem(
        orderRequest,
        sessionMetadata
      );

      return {
        orderId: order.id,
        depositAddress,
        cryptoAmount: input.cryptoAmount,
        uahAmount: orderRequest.uahAmount,
        currency: input.currency,
        status: order.status,
        createdAt: order.createdAt,
        // ✅ ДОПОЛНИТЕЛЬНАЯ информация о сессии
        sessionInfo: {
          isNewUser: sessionInfo.isNewUser,
          sessionId: sessionInfo.sessionId,
        },
      };
    }),

  // ✅ Остальные procedures остаются без изменений
});
```

### Phase 3: Создание utility функций (если нужно)

**Цель:** Добавить вспомогательные функции для определения статуса пользователя

**3.1 Создать helper функции для статуса пользователя**

**Файл:** `packages/exchange-core/src/utils/user-session-helpers.ts`

```typescript
import type { User } from '../types';

/**
 * ✅ Определяет статус пользователя для flexible authentication
 * НЕ ДУБЛИРУЕТ AutoRegistrationService - просто helper для анализа
 */
export type UserSessionStatus = 'unregistered' | 'registered' | 'authenticated';

export interface UserStatusAnalysis {
  status: UserSessionStatus;
  user?: User;
  hasActiveSession?: boolean;
}

/**
 * Анализирует результат ensureUserWithSession для определения статуса
 */
export function analyzeUserStatus(
  user: User | undefined,
  isNewUser: boolean,
  hasSessionId: boolean
): UserStatusAnalysis {
  if (!user) {
    return { status: 'unregistered' };
  }

  if (isNewUser) {
    return {
      status: 'unregistered', // Был создан только что
      user,
      hasActiveSession: hasSessionId,
    };
  }

  return {
    status: hasSessionId ? 'authenticated' : 'registered',
    user,
    hasActiveSession: hasSessionId,
  };
}
```

**3.2 Добавить экспорт helper функций**

**Файл:** `packages/exchange-core/src/utils/index.ts` (или создать если нет)

```typescript
// Существующие exports
export * from './calculations';
export * from './crypto';
export * from './data-sanitizers';
export * from './composite-validators';
export * from './type-guards';
export * from './access-validators';
export * from './user-role-helpers';

// ✅ НОВЫЙ экспорт
export * from './user-session-helpers';
```

---

## 🎯 РЕЗУЛЬТАТ: Минимальная реализация без архитектурных нарушений

### Что получаем:

1. **✅ Соответствие AC2.1A** - flexible authentication через существующий AutoRegistrationService
2. **✅ Обязательный userId для заявок** - через ensureUserWithSession
3. **✅ Три статуса пользователя** - unregistered/registered/authenticated
4. **✅ Соблюдение Rule 20** - НЕТ дублирования существующего функционала
5. **✅ Архитектурная консистентность** - используем существующие patterns

### Количество изменений:

- **Новые файлы:** 1 (`packages/exchange-core/src/types/user-session-status.ts`)
- **Новые методы:** 2 (`getUserSessionStatus()`, `createAutoRegistrationService()`)
- **Измененные файлы:** 3 (AutoRegistrationService, UserManagerFactory, exchange router)
- **Новые типы:** 2 (`UserSessionStatus`, `UserSessionStatusResult`)

### Совместимость:

- ✅ Все существующие API остаются без изменений
- ✅ Обратная совместимость на 100%
- ✅ Постепенное внедрение (можно применять поэтапно)
- ✅ Нет breaking changes

---

## � Plan Execution Checklist

- [ ] Phase 1: Создать тип UserSessionStatus
- [ ] Phase 2: Добавить метод getUserSessionStatus в AutoRegistrationService
- [ ] Phase 3: Добавить factory метод createAutoRegistrationService
- [ ] Phase 4: Обновить exchange router для использования session management
- [ ] Phase 5: Документация и тестирование

**Оценка времени реализации:** 4-6 часов (вместо 12-16 часов по оригинальному плану)
