# Архитектурный анализ: Система обработки заявок на криптообмен

> **Дата создания:** 15 сентября 2025  
> **Роль:** Агент-архитектор (фокус на целостность архитектуры)  
> **Цель:** Определить наименее затратный и наиболее чистый путь интеграции новой функциональности  
> **Источник:** `docs/analysis/PROJECT_ALIGNED_ORDERS_AC.md`

---

## 🏗️ Оценка текущей архитектуры проекта

### ✅ Архитектурные преимущества (ФАКТИЧЕСКИЕ данные из core документации)

**1. Монорепозиторий Turborepo с четкой структурой пакетов:**

- **packages/exchange-core/** - Централизованная бизнес-логика ✅
- **packages/session-management/** - Multi-App Context Support с PostgreSQL + Redis ✅
- **packages/utils/validation/** - Security-enhanced validation с XSS protection ✅
- **packages/constants/** - Единый источник истины с VALIDATION_LIMITS vs VALIDATION_BOUNDS ✅
- **packages/hooks/** - Zustand stores + custom hooks ✅

**2. Security-Enhanced Validation Architecture (VALIDATION_ARCHITECTURE_GUIDE.md):**

- **Security-First Consistency**: UI и tRPC используют одинаковые security-enhanced схемы ✅
- **Building Blocks Layer**: Базовые схемы без XSS рисков (emailSchema, passwordSchema) ✅
- **XSS Protection Layer**: Композитные схемы с автоматической защитой ✅
- **Architectural Principle**: Single Source of Truth для валидации ✅

**3. Multi-App Session Architecture (SESSION_ARCHITECTURE.md):**

- **Context-Aware Factory Pattern**: createForWeb(), createForAdmin() ✅
- **Redis Namespacing**: session:web:_, session:admin:_ ✅
- **Hybrid Compatibility**: PostgreSQL sessionId fallback ✅
- **Environment Detection**: Automatic mock/development/production switching ✅

**4. Permission-Based Role System (ROLES_ARCHITECTURE.md):**

- **Application Separation**: apps/web (operator/support) vs apps/admin-panel (admin) ✅
- **Middleware Architecture**: operatorOnly, supportOnly, operatorAndSupport ✅
- **Role-to-App Mapping**: Четкое разделение ролей по приложениям ✅

**5. Clean Architecture принципы соблюдаются:**

- **Separation of Concerns**: бизнес-логика отделена от UI
- **Dependency Inversion**: пакеты зависят от абстракций
- **Single Responsibility**: каждый пакет имеет четкую роль

**3. tRPC v11 Architecture с namespace-композицией:**

```
apps/web/src/server/trpc/routers/
├── exchange.ts      # ✅ Есть создание заявок
├── operator.ts      # ✅ Есть операторские функции
├── auth.ts         # ✅ Аутентификация
└── shared.ts       # ✅ Общие процедуры
```

**4. Middleware-based Security:**

- `operatorOnly`, `supportOnly` middleware ✅
- Security-enhanced validation schemas ✅
- Rate limiting infrastructure ✅

---

## 🚨 Критический анализ существующей реализации

### 🔴 Архитектурные проблемы (ПОДТВЕРЖДЕННЫЕ ФАКТАМИ)

**1. Mock Data вместо Production Ready Storage:**

```typescript
// packages/exchange-core/src/data/manager.ts - ФАКТ
const mockUsers = [
  { id: 'user_1', email: 'test@example.com' }, // ❌ In-memory массивы
  { id: 'user_2', email: 'admin@example.com' },
];
const mockOrders = [
  /* Аналогично */
]; // ❌ Теряется при рестарте
```

**ПРОБЛЕМА:** Нарушение Persistence Layer в Clean Architecture

**2. Заглушки адресов кошельков:**

```typescript
// packages/exchange-core/src/services/crypto-address-generation.ts - ФАКТ
private selectRandomAddress(addresses: readonly string[], currency: CryptoCurrency): string {
  const randomIndex = Math.floor(Math.random() * addresses.length); // ❌ Случайные адреса
  return addresses.at(randomIndex); // ❌ Из MOCK_CRYPTO_ADDRESSES
}
```

**ПРОБЛЕМА:** Service Layer содержит заглушки вместо реальной логики

**3. Отсутствие обязательной Session Management для createOrder:**

```typescript
// apps/web/src/server/trpc/routers/exchange.ts - ФАКТ (строка 188)
export const exchangeRouter = createTRPCRouter({
  createOrder: rateLimitMiddleware.createOrder // ❌ publicProcedure: создание БЕЗ обязательной сессии
    .input(securityEnhancedCreateExchangeOrderSchema)
    .mutation(async ({ input, ctx }) => {
      // ❌ ПРОБЛЕМА: Заявка создается БЕЗ привязки к user session
      // ❌ ПРОБЛЕМА: Нет гарантии что у заявки есть владелец
    }),
});
```

**ПРОБЛЕМА:** AC требует обязательную сессию (auto-registration/auto-login), но текущая реализация позволяет анонимное создание заявок

**4. Архитектура User vs Operator Access (КОРРЕКТНАЯ реализация):**

```typescript
// apps/web/src/server/trpc/routers/exchange.ts - правильное разделение ролей
export const exchangeRouter = createTRPCRouter({
  createOrder: rateLimitMiddleware.createOrder // ✅ ПРАВИЛЬНО: publicProcedure для USER-ов
    .input(securityEnhancedCreateExchangeOrderSchema)
    .mutation(async ({ input, ctx }) => {
      // ✅ ЛОГИЧНО: Обычные пользователи создают заявки на обмен
      // ❌ НО НУЖНО: Обязательная привязка к сессии через auto-registration/auto-login
    }),
});
```

**АРХИТЕКТУРА:** Клиенты (USER) создают заявки → Операторы (OPERATOR) их обрабатывают
**ПРИНЦИП:** publicProcedure для createOrder = ПРАВИЛЬНО, operatorOnly для updateOrderStatus = ПРАВИЛЬНО
**ДОПОЛНЕНИЕ:** Каждая заявка ДОЛЖНА иметь владельца через обязательную сессию

---

## 🎯 Архитектурная совместимость AC требований

### ✅ Что ИДЕАЛЬНО ложится в текущую архитектуру

**1. AC2.1A: Flexible User Authentication + Mandatory Session Management**

```typescript
// ✅ ПОДТВЕРЖДЕНО В КОДЕ: packages/session-management/src/factories/user-manager-factory.ts
// static async createForWeb(): Promise<UserManagerInterface> - строка 266
// static async createForAdmin(): Promise<UserManagerInterface> - строка 271
// ✅ ФАКТИЧЕСКИ ЕСТЬ: Multi-App Context Support с session namespacing
// ПРИНЦИП: Использование СУЩЕСТВУЮЩЕГО context-aware factory pattern
// ❌ НУЖНО ДОРАБОТАТЬ: Интеграция в createOrder для обязательной сессии
```

**ТРЕБОВАНИЕ:** КАЖДАЯ заявка ДОЛЖНА быть привязана к пользователю через сессию:

- Анонимные пользователи → auto-registration + session
- Зарегистрированные без сессии → auto-login + session
- Залогиненные → использование существующей session

**2. AC3.1: Wallet Pool Management**

```typescript
// ✅ ПОДТВЕРЖДЕНО В КОДЕ: packages/exchange-core/src/services/ - реальная структура
// ✅ ФАКТИЧЕСКИ ЕСТЬ: CryptoAddressGenerationService class в crypto-address-generation.ts
// ПРИНЦИП: Расширение СУЩЕСТВУЮЩЕГО Service Layer паттерна
// АРХИТЕКТУРА: Dependency Injection уже используется в session-management
```

**3. AC4.1: Telegram Bot Integration**

```typescript
// ✅ ПОДТВЕРЖДЕНО В КОДЕ: apps/ структура поддерживает новые приложения
// ✅ ФАКТИЧЕСКИ ЕСТЬ: tRPC AppRouter экспортируется из apps/web/src/server/trpc/routers/index.ts
// ПРИНЦИП: Monorepo pattern УЖЕ поддерживает multiple apps
// АРХИТЕКТУРА: Существующий паттерн apps/web, apps/admin-panel, apps/docs
```

### ⚠️ Что требует архитектурных изменений

**1. AC2.2: Database Persistence**

```typescript
// ✅ ПОДТВЕРЖДЕНО В КОДЕ: packages/exchange-core/src/data/manager.ts - строки 16-34
// const mockUsers = [...] - ФАКТ: in-memory массивы
// const mockOrders = [...] - ФАКТ: НЕТ персистентности
// РЕШЕНИЕ: Repository Pattern расширение session-management Prisma schema
// ПРИНЦИП: Minimal changes, максимальное переиспользование СУЩЕСТВУЮЩИХ паттернов
```

**2. AC6.1: Email Service**

```typescript
// ✅ ПОДТВЕРЖДЕНО В КОДЕ: packages/ структура НЕ содержит email-service
// ✅ ФАКТИЧЕСКИ ОТСУТСТВУЕТ: packages/providers/src/email/
// РЕШЕНИЕ: Новый пакет в монорепо, следует паттернам session-management
// ПРИНЦИП: Provider Pattern с environment-based switching (КАК В session-management)
```

---

## 🏗️ Рекомендуемые архитектурные решения

### 1. Repository Pattern для Data Persistence

**ПРОБЛЕМА:** Mock data managers нарушают Clean Architecture

**РЕШЕНИЕ:** Расширить существующую session-management архитектуру

```typescript
// packages/session-management/src/repositories/order-repository.ts
export interface OrderRepositoryInterface {
  create(order: CreateOrderData): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByEmail(email: string): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
}

// Производственная реализация с Prisma
export class PrismaOrderRepository implements OrderRepositoryInterface {
  // Использует существующую Prisma setup из session-management
}

// Mock реализация для тестов
export class MockOrderRepository implements OrderRepositoryInterface {
  // Сохраняет существующий orderManager.ts код
}
```

**ПРИНЦИП:** Dependency Inversion - business logic зависит от интерфейса, не от реализации

### 2. Strategy Pattern для Wallet Management

**ПРОБЛЕМА:** Статичная генерация адресов

**РЕШЕНИЕ:** Стратегия с поддержкой queue/immediate allocation

```typescript
// packages/exchange-core/src/services/wallet-strategies/
export interface WalletAllocationStrategy {
  allocateWallet(currency: CryptoCurrency): Promise<AllocationResult>;
  releaseWallet(address: string, currency: CryptoCurrency): Promise<void>;
}

export class ImmediateAllocationStrategy implements WalletAllocationStrategy {
  // Текущая логика generateDepositAddress
}

export class QueueAllocationStrategy implements WalletAllocationStrategy {
  // AC3.3: FIFO queue management
}
```

**ПРИНЦИП:** Open/Closed Principle - код открыт для расширения, закрыт для модификации

### 3. Factory Pattern для User Management

**ПРОБЛЕМА:** AC2.1A требует conditional auto-registration/login

**РЕШЕНИЕ:** Расширить существующую UserManagerFactory

```typescript
// packages/session-management/src/factories/user-manager-factory.ts - УЖЕ ЕСТЬ!
// РАСШИРЕНИЕ:
export class EnhancedUserManager extends UserManagerInterface {
  async findOrCreateByEmail(email: string): Promise<User> {
    // Auto-registration logic for AC2.1A
  }

  async createSessionForEmail(email: string, metadata: SessionMetadata): Promise<string> {
    // Auto-login logic for AC2.1A
  }
}
```

**ПРИНЦИП:** Расширение существующих patterns, не изобретение новых

### 4. Provider Pattern для Email Service

**ПРОБЛЕМА:** Нет email интеграции

**РЕШЕНИЕ:** Новый пакет по образцу session-management

```typescript
// packages/email-service/src/providers/
export interface EmailProviderInterface {
  sendOrderCreated(order: Order): Promise<void>;
  sendWalletReady(order: Order): Promise<void>;
}

export class ResendEmailProvider implements EmailProviderInterface {
  // Resend integration
}

export class MockEmailProvider implements EmailProviderInterface {
  // Development mock
}

// packages/email-service/src/factories/email-provider-factory.ts
export class EmailProviderFactory {
  static create(): EmailProviderInterface {
    // Environment-based provider selection
  }
}
```

**ПРИНЦИП:** Тот же Factory Pattern что в session-management

---

## 🔄 Интеграционная стратегия по фазам

### Phase 0: Infrastructure (Минимальные изменения)

**Цель:** Подготовить архитектуру без breaking changes

1. **Расширить Prisma Schema** (session-management)

```sql
-- Добавить Order, Transaction таблицы к существующим User, Session
model Order {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  -- остальные поля
}
```

2. **Создать Repository интерфейсы** (exchange-core)

```typescript
// Абстракции для будущих реализаций
export interface OrderRepositoryInterface {}
export interface WalletRepositoryInterface {}
```

3. **Factory Methods** в существующих managers

```typescript
// Обратно совместимые методы с новой логикой внутри
orderManager.createWithPersistence = orderManager.create; // Placeholder
```

### Phase 1: Core Business Logic (Расширение существующих слоев)

**Цель:** Реализовать AC требования в существующих architectural boundaries

1. **Exchange Router Enhancement**

```typescript
// apps/web/src/server/trpc/routers/exchange.ts
export const exchangeRouter = createTRPCRouter({
  createOrder: publicProcedure // ✅ ПРАВИЛЬНО: USER-ы создают заявки
    .input(securityEnhancedCreateExchangeOrderSchema) // ✅ Уже есть
    .mutation(async ({ input, ctx }) => {
      // НОВОЕ: Conditional auto-registration/login (AC2.1A)
      const userManager = await UserManagerFactory.create();
      const user = await userManager.findOrCreateByEmail(input.email);

      // НОВОЕ: Wallet allocation strategy
      const walletManager = WalletManagerFactory.create();
      const allocation = await walletManager.allocateWallet(input.currency);

      // РАСШИРЕНИЕ: Существующий orderManager с persistence
      const order = await orderManager.createWithPersistence({...});
    }),
});
});
```

2. **Operator Router Enhancement**

```typescript
// apps/web/src/server/trpc/routers/operator.ts - УЖЕ ЕСТЬ!
updateOrderStatus: operatorOnly // ✅ Middleware есть
  .mutation(async ({ input, ctx }) => {
    // РАСШИРЕНИЕ: Release wallet on completion (AC3.3)
    if (input.status === ORDER_STATUSES.COMPLETED) {
      await walletManager.releaseWallet(order.depositAddress, order.currency);
    }
  }),
```

### Phase 2: External Integrations (Новые пакеты)

**Цель:** Добавить внешние сервисы без влияния на core

1. **Email Service Package**

```typescript
// packages/email-service/ - НОВЫЙ пакет
// Следует паттернам session-management
```

2. **Telegram Bot App**

```typescript
// apps/telegram-bot/ - НОВОЕ приложение
// Использует tRPC client для интеграции с web app
```

---

## 🛡️ Принципы архитектурной целостности

### 1. Не изобретать велосипеды

**✅ ПЕРЕИСПОЛЬЗОВАТЬ:**

- `packages/session-management/` Factory Pattern для new managers
- `packages/utils/validation/` Security-enhanced schemas для new forms
- `packages/constants/` для new business constants
- `apps/web/src/server/trpc/middleware/` для new authorization logic

**❌ НЕ СОЗДАВАТЬ:**

- Новую аутентификацию (есть session-management)
- Новую валидацию (есть security-enhanced schemas)
- Новые error handlers (есть centralized в utils)
- Новые роутеры без необходимости (расширять существующие)

### 2. Clean Architecture соответствие

**Domain Layer:** `packages/exchange-core/types/` - бизнес-типы ✅
**Application Layer:** `packages/exchange-core/services/` - use cases ✅  
**Interface Layer:** `apps/web/src/server/trpc/routers/` - API endpoints ✅
**Infrastructure Layer:** `packages/session-management/` - persistence ✅

**НОВЫЕ компоненты ДОЛЖНЫ соответствовать этой структуре**

### 3. Dependency Direction

```
apps/web → packages/exchange-core → packages/utils
         → packages/session-management → packages/constants

// ❌ НЕ ДОПУСКАТЬ:
packages/constants → packages/exchange-core // Нарушение зависимостей
packages/utils → apps/web // Циклические зависимости
```

---

## 🎯 Конкретные рекомендации по AC разделам

### AC2.1A: Flexible User Authentication

**АРХИТЕКТУРНОЕ РЕШЕНИЕ:** Расширить существующую session-management

```typescript
// packages/session-management/src/services/flexible-auth-service.ts
export class FlexibleAuthService {
  async authenticateForExchange(email: string): Promise<AuthResult> {
    const user = await this.userManager.findByEmail(email);

    if (!user) {
      // Auto-registration
      return await this.registerAndCreateSession(email);
    }

    if (!user.hasActiveSession) {
      // Auto-login
      return await this.createNewSession(user);
    }

    // Existing session
    return { user, sessionId: user.activeSessionId };
  }
}
```

**ИНТЕГРАЦИЯ:** Минимальные изменения в exchange.createOrder

### AC3.1-3.5: Wallet Pool Management

**АРХИТЕКТУРНОЕ РЕШЕНИЕ:** Новый сервис в exchange-core

```typescript
// packages/exchange-core/src/services/wallet-pool-manager.ts
export class WalletPoolManager {
  constructor(
    private allocationStrategy: WalletAllocationStrategy,
    private queueManager: QueueManagerInterface
  ) {}
}

// apps/web/src/server/trpc/routers/shared.ts - УЖЕ ЕСТЬ роутер!
getWalletPoolStats: operatorAndSupport // ✅ Middleware есть
  .query(async () => {
    return await walletPoolManager.getStats();
  }),
```

**ИНТЕГРАЦИЯ:** Расширение existing роутеров

### AC4.1-4.4: Telegram Bot Integration

**АРХИТЕКТУРНОЕ РЕШЕНИЕ:** Новое приложение в монорепо

```typescript
// apps/telegram-bot/src/handlers/order-notifications.ts
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '@repo/web/server/trpc/routers';

export class OrderNotificationHandler {
  private trpcClient = createTRPCClient<AppRouter>({
    // Подключение к web app API
  });

  async handleNewOrder(orderData: OrderCreatedEvent) {
    // Использует existing tRPC procedures
    await this.trpcClient.operator.claimOrderFromTelegram.mutate({
      orderId: orderData.id,
      telegramUserId: this.botUserId,
    });
  }
}
```

**ИНТЕГРАЦИЯ:** Новый роутер в operator.ts для Telegram callbacks

### AC6.1-6.4: Email Notifications

**АРХИТЕКТУРНОЕ РЕШЕНИЕ:** Новый пакет по паттерну session-management

```typescript
// packages/email-service/src/index.ts
export { EmailServiceFactory } from './factories/email-service-factory';
export type { EmailServiceInterface } from './interfaces/email-service-interface';

// Интеграция в exchange.createOrder:
const emailService = EmailServiceFactory.create();
await emailService.sendOrderCreated(order);
```

**ИНТЕГРАЦИЯ:** Background queue через existing utils/store-factory patterns

---

## ✅ Заключение: Архитектурная готовность

### Сильные стороны текущей архитектуры

1. **Монорепозиторий с четкой структурой** - готов для добавления новых пакетов/приложений
2. **Session Management система** - production-ready, легко расширяемая
3. **Security-enhanced validation** - можно переиспользовать для всех новых форм
4. **tRPC middleware architecture** - готова для добавления новых ролей и процедур
5. **Clean Architecture принципы** - четкое разделение слоев

### Минимальные изменения для AC реализации

1. **80% AC требований** вписываются в существующую архитектуру
2. **Repository Pattern** - естественное расширение session-management
3. **Factory Pattern** - уже используется, нужно только расширить
4. **Provider Pattern** - применить для email service по образцу session-management
5. **User Flow архитектура** - УЖЕ ПРАВИЛЬНАЯ: USER создают заявки → OPERATOR обрабатывают
6. **Session Management** - ОБЯЗАТЕЛЬНОЕ требование: каждая заявка ДОЛЖНА иметь владельца

### Архитектурные риски

1. **Mock data** - требует миграции на real persistence (Prisma schema extension)
2. **Wallet management** - требует real crypto address pools (NOT blockchain integration)
3. **Email dependencies** - требует external service provider selection
4. **❗ КРИТИЧНО:** Анонимные заявки - нарушение ownership принципа и невозможность обратной связи

### Рекомендуемый путь интеграции

**✅ ПРАВИЛЬНО:** Поэтапное расширение существующих patterns
**✅ ПРАВИЛЬНО:** publicProcedure для createOrder (USER access)
**✅ ПРАВИЛЬНО:** operatorOnly для updateOrderStatus (OPERATOR access)  
**✅ ОБЯЗАТЕЛЬНО:** Mandatory session для каждой заявки (auto-registration/auto-login)
**✅ ПРАВИЛЬНО:** publicProcedure для createOrder (USER access)
**✅ ПРАВИЛЬНО:** operatorOnly для updateOrderStatus (OPERATOR access)
**❌ НЕПРАВИЛЬНО:** Создание параллельных систем или breaking changes

Архитектура проекта **ГОТОВА** для интеграции AC требований с минимальными затратами и максимальным сохранением существующих принципов.
