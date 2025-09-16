# Детальный план реализации: Task 1.2 - Repository интерфейсы (ИСПРАВЛЕННАЯ ВЕРСИЯ)

> **Дата создания:** 16 сентября 2025  
> **Дата исправления:** 16 сентября 2025  
> **Задача:** 1.2 из ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md  
> **Роль:** Агент-кодер (фокус на рефакторинг и паттерны)  
> **Архитектурный принцип:** Встраивание в существующую архитектуру без breaking changes

## 🚨 КРИТИЧЕСКИЕ ИСПРАВЛЕ### ✅ Критерии готовности (Definition of Done)

### Файловая структура создана:

- [ ] `pack### 🚨 Ограничения**Готовые контракты для задач 5.x (Operator functions):**

```typescript
// Готовые контракты для operator procedures:
export const operatorRouter = createTRPCRouter({
  takeOrder: operatorOnly.mutation(async ({ input, ctx }) => {
    await orderRepo.assignToOperator(input.orderId, ctx.user.id);
    await auditRepo.create({
      orderId: input.orderId,
      action: 'OPERATOR_ASSIGNED',
      performedBy: ctx.user.id,
    });
  }),
});
```

---

## 📊 ФИНАЛЬНАЯ СТРУКТУРА ИСПРАВЛЕННОГО ПЛАНА

### Итоговая структура файлов:

```
packages/exchange-core/src/repositories/
├── order-repository-interface.ts          # ИСПРАВЛЕН - без findByEmail
├── wallet-repository-interface.ts         # Без изменений
├── queue-repository-interface.ts          # НОВЫЙ - для AC2.3, AC3.4
├── enhanced-user-repository-interface.ts  # НОВЫЙ - расширение session-management
├── audit-repository-interface.ts          # Без изменений
├── types.ts                               # ИСПРАВЛЕН - без email поля
└── index.ts                              # ИСПРАВЛЕН - интеграция с session-management
```

### Ключевые исправления и обоснования:

1. **УСТРАНЕНА ИЗБЫТОЧНОСТЬ** (Rule 20):
   - findByEmail удален из OrderRepository
   - CreateOrderRepositoryData без email поля
   - Интеграция с существующими UserRepository

2. **ДОБАВЛЕНО ПОЛНОЕ AC ПОКРЫТИЕ**:
   - QueueRepositoryInterface для AC2.3, AC3.4
   - EnhancedUserRepositoryInterface для AC2.1A
   - Мониторинг и статистика для AC3.5

3. **АРХИТЕКТУРНАЯ ЦЕЛОСТНОСТЬ** (Rule 24):
   - Расширение существующих паттернов session-management
   - Соблюдение Clean Architecture принципов
   - Правильная интеграция с монорепо структурой

---

## 🏆 РЕЗУЛЬТАТ ИСПРАВЛЕНИЙ

**✅ СТАТУС ПЛАНА: ГОТОВ К РЕАЛИЗАЦИИ**

План полностью исправлен согласно архитектурным принципам проекта и покрывает все AC требования без создания технического долга или избыточности.ия

### Rule 25 соблюдается:

- ✅ ТОЛЬКО создание Repository интерфейсов для задачи 1.2
- ❌ НЕ трогаем manager.ts (это задача 1.3)
- ❌ НЕ создаем реализации (это задача 1.3)
- ❌ НЕ изменяем tRPC роутеры (это задачи 4.x-5.x)

### Архитектурные гарантии и исправления:

- ✅ ИСПРАВЛЕНО: Интерфейсы готовы для Mock и Prisma реализаций
- ✅ ИСПРАВЛЕНО: Устранена избыточность между findByEmail/findByUserId
- ✅ ДОБАВЛЕНО: Полное покрытие AC требований (Queue, Enhanced User)
- ✅ ИСПРАВЛЕНО: Интеграция с существующей session-management архитектурой
- Dependency Inversion principle соблюден
- Clean Architecture layers не нарушены
- Обратная совместимость с существующим API

### Обоснование критических изменений:

**1. Удаление findByEmail из OrderRepository:**

- **Rule 20**: Устранение избыточности
- **AC2.1A**: После обязательной привязки к userId, findByEmail = findByUserId + промежуточный шаг
- **Single Source of Truth**: userId - единственный источник связи с пользователем

**2. Добавление Queue Repository:**

- **AC Coverage**: AC2.3, AC3.4 требуют FIFO queue management
- **Архитектурная полнота**: Без этого интерфейса невозможно реализовать систему очередей

**3. Enhanced User Repository:**

- **Rule 20**: Расширение существующего вместо создания нового
- **AC2.1A**: Flexible User Authentication требует auto-registration/auto-login

### Следующий этап:

После завершения ИСПРАВЛЕННОЙ задачи 1.2 → переход к задаче 1.3 "Заменить mock data managers на Prisma-based реализации"src/repositories/` директория

- [ ] `order-repository-interface.ts` с исправленным контрактом (без findByEmail)
- [ ] `wallet-repository-interface.ts` для будущего Wallet Pool
- [ ] `queue-repository-interface.ts` для AC2.3, AC3.4 (НОВОЕ)
- [ ] `enhanced-user-repository-interface.ts` для AC2.1A (НОВОЕ)
- [ ] `audit-repository-interface.ts` для аудита операций
- [ ] `index.ts` с интеграцией session-management
- [ ] Обновлен `packages/exchange-core/src/index.ts`

### Архитектурная совместимость и исправления:

- [ ] ✅ ИСПРАВЛЕНО: Устранена избыточность findByEmail согласно Rule 20
- [ ] ✅ ДОБАВЛЕНО: Интеграция с существующими UserRepository (session-management)
- [ ] ✅ ДОБАВЛЕНО: Queue Repository для полного AC coverage
- [ ] ✅ ДОБАВЛЕНО: Enhanced User Repository для AC2.1A
- [ ] Следует Adapter Pattern из session-management
- [ ] Типы совместимы с Prisma schema (задача 1.1)
- [ ] НЕ нарушает существующие manager.ts API
- [ ] Подготовлены контракты для задачи 1.3внесения изменений:\*\*

1. **Rule 20 нарушение**: Обнаружена избыточность между findByEmail/findByUserId методами
2. **Rule 24 нарушение**: Неполное использование существующей session-management архитектуры
3. **AC Coverage**: Недостаточное покрытие требований для Queue Management и Enhanced User Authentication
4. **Архитектурная целостность**: Необходимость интеграции с существующими паттернами проекта

**Основания для изменений:**

- Детальный анализ PROJECT_STRUCTURE_MAP.md и архитектурной документации
- Соответствие критериям приемки PROJECT_ALIGNED_ORDERS_AC.md
- Следование принципам ai-agent-rules.yml (Rule 20, Rule 24, Rule 25)
- Обеспечение архитектурной совместимости с session-management package

---

## 🎯 Понимание задачи 1.2

### Задача из Task List:

```
1.2 Создать Repository интерфейсы в packages/exchange-core/src/repositories/
- Создать OrderRepositoryInterface, WalletRepositoryInterface для абстракции
- Определить методы create, findById, updateStatus, findByEmail
- Подготовить контракты для будущих реализаций
```

### Контекст:

- **Зависимость:** Задача 1.1 (Prisma schema) уже выполнена ✅
- **Цель:** Подготовить абстракции для задачи 1.3 (Prisma-based реализации)
- **Архитектурная роль:** Infrastructure Layer - контракты для Data Access

---

## 🏗️ Архитектурный анализ существующих паттернов

### ✅ Обнаруженные паттерны в проекте:

**1. Adapter Pattern (session-management):**

```typescript
// packages/session-management/src/adapters/postgres-user-adapter.ts
interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(userData: CreateUserData): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
}
```

**2. Manager Pattern (exchange-core):**

```typescript
// packages/exchange-core/src/data/manager.ts
export const userManager = {
  findByEmail: (email: string): User | undefined => { ... },
  findById: (id: string): User | undefined => { ... },
  create: (userData: Omit<User, 'id' | 'createdAt'>): User => { ... }
};
```

**3. Factory Pattern (session-management):**

```typescript
// packages/session-management/src/factories/user-manager-factory.ts
export class UserManagerFactory {
  static async createForWeb(): Promise<UserManagerInterface> { ... }
  static async createForAdmin(): Promise<UserManagerInterface> { ... }
}
```

---

## 🧩 Архитектурная стратегия интеграции

### Принцип: "Расширение, а не замена"

**Rule 25**: Изменения ТОЛЬКО для цели задачи 1.2 - создание Repository интерфейсов

**ПРАВИЛЬНО:**

- ✅ Создать новую директорию `repositories/` с интерфейсами
- ✅ Следовать существующему Adapter Pattern из session-management
- ✅ Подготовить контракты для будущей задачи 1.3 (Prisma реализации)
- ✅ Совместимость с существующими manager.ts API

**ЗАПРЕЩЕНО:**

- ❌ Изменять существующие manager.ts файлы (это задача 1.3)
- ❌ Создавать реализации Repository (это задача 1.3)
- ❌ Нарушать существующие импорты и API

---

## 📋 Детальный план реализации

### Phase 1: Создание архитектурной структуры

**1.1 Создать директорию repositories**

```bash
mkdir packages/exchange-core/src/repositories
```

**1.2 Создать интерфейсы с соблюдением существующих паттернов и устранением избыточности**

**Файл:** `packages/exchange-core/src/repositories/order-repository-interface.ts`

```typescript
import type { Order, CreateOrderRequest } from '../types/order';
import type { OrderStatus } from '@repo/constants';

/**
 * Repository interface для операций с заявками
 * Следует Adapter Pattern из session-management
 * Готовит контракты для Prisma реализации в задаче 1.3
 *
 * ИСПРАВЛЕНИЕ: Устранена избыточность findByEmail согласно Rule 20
 * ОБОСНОВАНИЕ: После AC2.1A каждая заявка привязана к userId,
 * findByEmail становится избыточным - это findByUserId с промежуточным шагом
 */
export interface OrderRepositoryInterface {
  // Основные CRUD операции
  create(orderData: CreateOrderRequest & { userId: string }): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>; // ЕДИНСТВЕННЫЙ источник поиска по пользователю
  // УДАЛЕНО: findByEmail - избыточность после обязательной привязки к userId

  // Операторские операции
  updateStatus(id: string, status: OrderStatus, operatorId?: string): Promise<Order | null>;
  assignToOperator(orderId: string, operatorId: string): Promise<Order | null>;
  findByOperator(operatorId: string): Promise<Order[]>;

  // Поиск и фильтрация
  findByStatus(status: OrderStatus): Promise<Order[]>;
  findByCurrency(currency: string): Promise<Order[]>;
  findByDepositAddress(address: string): Promise<Order | null>;

  // Пагинация (соответствует существующим utils)
  findWithPagination(options: {
    page: number;
    limit: number;
    status?: OrderStatus;
    userId?: string;
  }): Promise<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
  }>;
}
```

**1.3 Создать интерфейс для Wallet Repository**

**Файл:** `packages/exchange-core/src/repositories/wallet-repository-interface.ts`

```typescript
import type { CryptoCurrency } from '../types/currency';

export interface WalletInfo {
  id: string;
  address: string;
  currency: CryptoCurrency;
  isOccupied: boolean;
  assignedOrderId?: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

/**
 * Repository interface для управления кошельками
 * Подготовка для задач 2.1-2.3 (Wallet Pool Management)
 */
export interface WalletRepositoryInterface {
  // Базовые операции
  findByAddress(address: string): Promise<WalletInfo | null>;
  findByCurrency(currency: CryptoCurrency): Promise<WalletInfo[]>;
  findAvailable(currency: CryptoCurrency): Promise<WalletInfo[]>;
  findOccupied(currency: CryptoCurrency): Promise<WalletInfo[]>;

  // Управление статусом
  markAsOccupied(address: string, orderId: string): Promise<WalletInfo | null>;
  markAsAvailable(address: string): Promise<WalletInfo | null>;

  // Поиск для FIFO очереди (задача 2.2)
  findOldestAvailable(currency: CryptoCurrency): Promise<WalletInfo | null>;
  findByOrderId(orderId: string): Promise<WalletInfo | null>;
}
```

### Phase 2: Создание типизации и экспортов

**2.1 Создать Audit Repository интерфейс**

**Файл:** `packages/exchange-core/src/repositories/audit-repository-interface.ts`

```typescript
export interface OrderAuditEntry {
  id: string;
  orderId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
  comment?: string;
  performedBy?: string; // userId
  createdAt: Date;
}

/**
 * Repository interface для аудита операций с заявками
 * Поддерживает AC требования по логированию всех изменений
 */
export interface AuditRepositoryInterface {
  create(entry: Omit<OrderAuditEntry, 'id' | 'createdAt'>): Promise<OrderAuditEntry>;
  findByOrderId(orderId: string): Promise<OrderAuditEntry[]>;
  findByOperator(operatorId: string): Promise<OrderAuditEntry[]>;
  findByAction(action: string): Promise<OrderAuditEntry[]>;
}
```

**2.2 НОВОЕ: Создать Queue Repository интерфейс для AC2.3, AC3.4**

**Файл:** `packages/exchange-core/src/repositories/queue-repository-interface.ts`

```typescript
import type { CryptoCurrency } from '../types/currency';

export interface QueueEntry {
  id: string;
  orderId: string;
  currency: CryptoCurrency;
  priority: number;
  createdAt: Date;
}

/**
 * Repository interface для управления очередями заявок
 * ДОБАВЛЕНО: Для поддержки AC2.3 (система очередей при отсутствии кошельков)
 * ДОБАВЛЕНО: Для поддержки AC3.4 (обработка очереди ожидания)
 * ОБОСНОВАНИЕ: Критерии приемки требуют FIFO queue management
 */
export interface QueueRepositoryInterface {
  // FIFO queue management для AC2.3
  addToQueue(entry: Omit<QueueEntry, 'id' | 'createdAt'>): Promise<QueueEntry>;
  getNextInQueue(currency: CryptoCurrency): Promise<QueueEntry | null>;
  removeFromQueue(entryId: string): Promise<void>;

  // Мониторинг очереди для AC3.5
  getQueueSize(currency: CryptoCurrency): Promise<number>;
  getQueuePosition(orderId: string): Promise<number | null>;
}
```

**2.3 НОВОЕ: Создать Enhanced User Repository интерфейс для AC2.1A**

**Файл:** `packages/exchange-core/src/repositories/enhanced-user-repository-interface.ts`

```typescript
import type { UserRepository } from '@repo/session-management';

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
  appContext: 'web' | 'admin';
}

/**
 * Расширение существующего UserRepository для AC2.1A требований
 * ДОБАВЛЕНО: Для поддержки Flexible User Authentication
 * ОБОСНОВАНИЕ: AC2.1A требует auto-registration и auto-login функциональность
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Расширяем СУЩЕСТВУЮЩИЙ интерфейс вместо создания нового (Rule 20)
 */
export interface EnhancedUserRepositoryInterface extends UserRepository {
  // AC2.1A: Flexible User Authentication
  findOrCreateByEmail(email: string): Promise<{ user: User; isNewUser: boolean }>;
  createSessionForUser(userId: string, metadata: SessionMetadata): Promise<string>;

  // Интеграция с существующими методами session-management
  // findByEmail, create уже есть в базовом UserRepository - НЕ дублируем
}
```

**2.4 Создать централизованный экспорт с интеграцией session-management**

**Файл:** `packages/exchange-core/src/repositories/index.ts`

```typescript
// ИСПРАВЛЕНИЕ: Интеграция с существующей session-management архитектурой
// ОБОСНОВАНИЕ: Rule 20 - использовать существующие решения вместо дублирования

// Re-export базовых интерфейсов из session-management (НЕ создаем новые)
export type { UserRepository, SessionRepository } from '@repo/session-management';

// Новые интерфейсы специфичные для exchange-core
export type { OrderRepositoryInterface } from './order-repository-interface';
export type { WalletRepositoryInterface, WalletInfo } from './wallet-repository-interface';
export type { QueueRepositoryInterface, QueueEntry } from './queue-repository-interface';
export type { AuditRepositoryInterface, OrderAuditEntry } from './audit-repository-interface';

// Расширенные интерфейсы для AC требований
export type {
  EnhancedUserRepositoryInterface,
  SessionMetadata,
} from './enhanced-user-repository-interface';

// Re-export для удобства импорта
export * from './order-repository-interface';
export * from './wallet-repository-interface';
export * from './queue-repository-interface';
export * from './audit-repository-interface';
export * from './enhanced-user-repository-interface';
```

**2.5 Обновить главный экспорт пакета**

**Файл:** `packages/exchange-core/src/index.ts` (дополнить существующий)

```typescript
// Существующие экспорты...
export * from './data';
export * from './services';
export * from './types';
export * from './utils';

// ✅ НОВОЕ: Repository interfaces для задачи 1.3
export * from './repositories';
```

### Phase 3: Типизационная совместимость

**3.1 Проверить совместимость с существующими типами**

Убедиться что:

- `Order` interface совместим с Prisma schema (задача 1.1)
- `CreateOrderRequest` соответствует существующим validation schemas
- Типы не конфликтуют с current manager.ts API

**3.2 Создать переходные типы с устранением избыточности**

**Файл:** `packages/exchange-core/src/repositories/types.ts`

```typescript
import type { Order } from '../types/order';

// Дополнительные типы для Repository слоя
export interface RepositoryOrder extends Order {
  userId: string; // Гарантия связи с User для AC2.1A
}

/**
 * ИСПРАВЛЕНИЕ: Устранена избыточность email поля
 * ОБОСНОВАНИЕ: После AC2.1A каждая заявка привязана к userId
 * email получается через User.email - нет необходимости дублировать
 */
export interface CreateOrderRepositoryData {
  userId: string; // ЕДИНСТВЕННЫЙ источник привязки к пользователю
  cryptoAmount: number;
  currency: string;
  uahAmount: number;
  tokenStandard?: string;
  recipientData?: Record<string, any>;
  // УДАЛЕНО: email - избыточность, получается через User.email
}
```

---

## 🔗 Интеграция с существующей архитектурой

### Следование Clean Architecture

```
📁 packages/exchange-core/src/
├── 📁 types/              # Domain Layer - бизнес типы
├── 📁 repositories/       # 🆕 Infrastructure Contracts - интерфейсы для данных
├── 📁 services/           # Application Layer - use cases
├── 📁 data/              # Infrastructure Implementation - текущие manager.ts
└── 📁 utils/             # Cross-cutting concerns
```

### Dependency Direction соблюдается:

```
services/ → repositories/ (interfaces) ← data/ (implementations в задаче 1.3)
    ↓            ↓
  types/     types/
```

### Factory Pattern интеграция (для задачи 1.3):

```typescript
// Будущая интеграция в задаче 1.3:
export class OrderRepositoryFactory {
  static create(): OrderRepositoryInterface {
    // Возврат Mock или Prisma реализации
  }
}
```

---

## ✅ Критерии готовности (Definition of Done)

### Файловая структура создана:

- [ ] `packages/exchange-core/src/repositories/` директория
- [ ] `order-repository-interface.ts` с полным контрактом
- [ ] `wallet-repository-interface.ts` для будущего Wallet Pool
- [ ] `audit-repository-interface.ts` для аудита операций
- [ ] `index.ts` с централизованными экспортами
- [ ] Обновлен `packages/exchange-core/src/index.ts`

### Архитектурная совместимость:

- [ ] Следует Adapter Pattern из session-management
- [ ] Типы совместимы с Prisma schema (задача 1.1)
- [ ] Не нарушает существующие manager.ts API
- [ ] Подготовлены контракты для задачи 1.3

### Качество кода:

- [ ] TypeScript strict mode compliance
- [ ] JSDoc комментарии для всех публичных интерфейсов
- [ ] Соответствие проектному Code Style Guide
- [ ] Exports в правильном порядке

---

## 🎯 Готовность к следующим задачам

### Задача 1.3 (Prisma реализации):

```typescript
// Готовые контракты для реализации:
class PrismaOrderRepository implements OrderRepositoryInterface {
  async create(orderData) {
    /* Prisma implementation */
  }
  async findById(id) {
    /* Prisma implementation */
  }
  // ... все методы интерфейса
}
```

### Задачи 2.1-2.3 (Wallet Management):

```typescript
// Готовые контракты для WalletPoolManager:
class WalletPoolManager {
  constructor(private walletRepo: WalletRepositoryInterface) {}

  async allocateWallet(currency: CryptoCurrency) {
    const available = await this.walletRepo.findOldestAvailable(currency);
    // ... FIFO логика
  }
}
```

### Задачи 5.x (Operator functions):

```typescript
// Готовые контракты для operator procedures:
export const operatorRouter = createTRPCRouter({
  takeOrder: operatorOnly.mutation(async ({ input, ctx }) => {
    await orderRepo.assignToOperator(input.orderId, ctx.user.id);
    await auditRepo.create({
      orderId: input.orderId,
      action: 'OPERATOR_ASSIGNED',
      performedBy: ctx.user.id,
    });
  }),
});
```

---

## 🚨 Ограничения и предупреждения

### Rule 25 соблюдается:

- ✅ ТОЛЬКО создание Repository интерфейсов для задачи 1.2
- ❌ НЕ трогаем manager.ts (это задача 1.3)
- ❌ НЕ создаем реализации (это задача 1.3)
- ❌ НЕ изменяем tRPC роутеры (это задачи 4.x-5.x)

### Архитектурные гарантии:

- Интерфейсы готовы для Mock и Prisma реализаций
- Dependency Inversion principle соблюден
- Clean Architecture layers не нарушены
- Обратная совместимость с существующим API

### Следующий этап:

После завершения задачи 1.2 → переход к задаче 1.3 "Заменить mock data managers на Prisma-based реализации"
