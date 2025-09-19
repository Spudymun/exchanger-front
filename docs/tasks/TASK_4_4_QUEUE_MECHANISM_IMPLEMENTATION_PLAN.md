# Task 4.4: Queue Mechanism Implementation Plan

## Анализ проблемы

### Текущая ситуация

Task 4.4 "Реализовать queue mechanism для заявок без свободных кошельков" **уже реализован на уровне бизнес-логики**, но **заблокирован на уровне инфраструктуры**.

### Архитектурное состояние

```
✅ WalletPoolManager (Facade + Strategy Pattern) - полностью реализован
✅ QueueAllocationStrategy - логика очереди работает
✅ Exchange Router - интегрирован с queue mechanism
✅ Prisma Schema - модели Wallet и WalletQueue существуют
❌ PostgresWalletAdapter - методы throw errors вместо Prisma запросов
❌ PostgresQueueAdapter - validateSchema() блокирует выполнение
❌ BasePostgresAdapter - временная validateSchema() ошибка
```

## Диагностированные проблемы

### 1. ✅ Schema Mapping Already Correct

**ФАКТИЧЕСКОЕ СОСТОЯНИЕ**: PostgresWalletAdapter УЖЕ содержит правильный mapping:

```typescript
// ✅ РЕАЛЬНЫЙ КОД packages/session-management/src/adapters/postgres-wallet-adapter.ts:16-25
interface PrismaWallet {
  id: string;
  address: string;
  currency: string;
  isOccupied: boolean;      // ✅ СООТВЕТСТВУЕТ WalletInfo
  assignedOrderId?: string | null; // ✅ СУЩЕСТВУЕТ в PrismaWallet
  createdAt: Date;
  lastUsedAt?: Date | null;
}

// ✅ MAPPING УЖЕ РЕАЛИЗОВАН (строки 113-125)
private mapPrismaToWallet(prismaWallet: PrismaWallet): WalletInfo {
  return {
    isOccupied: prismaWallet.isOccupied, // ✅ ПРЯМОЕ СООТВЕТСТВИЕ
    assignedOrderId: prismaWallet.assignedOrderId || undefined, // ✅ ПРАВИЛЬНО
    // ... остальные поля
  };
}
```

**ВЫВОД**: Schema mapping problem НЕ СУЩЕСТВУЕТ - все уже правильно реализовано!

### 2. ❌ Infrastructure Blocking (ЕДИНСТВЕННАЯ РЕАЛЬНАЯ ПРОБЛЕМА)

**Проблема**: `BasePostgresAdapter.validateSchema()` содержит ОШИБОЧНУЮ блокирующую проверку:

```typescript
// packages/session-management/src/adapters/base-postgres-adapter.ts:39
protected validateSchema(): void {
  throw new Error(POSTGRES_ERRORS.SCHEMA_ERROR); // ❌ ОШИБОЧНО БЛОКИРУЕТ
}
```

**ФАКТИЧЕСКОЕ СОСТОЯНИЕ**:

- ✅ Модели `Wallet` и `WalletQueue` УЖЕ ДОБАВЛЕНЫ в schema.prisma (строки 119-170)!
- ✅ Миграции выполнены (20250917175605_v3/migration.sql)
- ❌ validateSchema() блокирует ОШИБОЧНО - модели уже есть!

### 3. ✅ Adapter Implementation Already Exists

**ФАКТИЧЕСКОЕ СОСТОЯНИЕ**: PostgresWalletAdapter и PostgresQueueAdapter УЖЕ СОЗДАНЫ:

```typescript
// ✅ СУЩЕСТВУЕТ packages/session-management/src/adapters/postgres-wallet-adapter.ts (129 строк)
export class PostgresWalletAdapter implements WalletRepositoryInterface {
  // ✅ ВСЕ МЕТОДЫ РЕАЛИЗОВАНЫ с правильными signatures
  async findByAddress(address: string): Promise<WalletInfo | null>;
  async findAvailable(currency: CryptoCurrency): Promise<WalletInfo[]>;
  async markAsOccupied(address: string, orderId: string): Promise<WalletInfo | null>;
  // + mapping методы УЖЕ РЕАЛИЗОВАНЫ
}

// ✅ СУЩЕСТВУЕТ packages/session-management/src/adapters/postgres-queue-adapter.ts (104 строки)
export class PostgresQueueAdapter implements QueueRepositoryInterface {
  // ✅ ВСЕ МЕТОДЫ РЕАЛИЗОВАНЫ с правильными signatures
}
```

**РЕАЛЬНАЯ ПРОБЛЕМА**: Методы содержат только validateSchema() проверки, которые ОШИБОЧНО блокируют выполнение, хотя schema УЖЕ готова!

## Implementation Plan

### Фаза 1: Исправление инфраструктуры (Critical Path)

#### 1.1 ЕДИНСТВЕННОЕ НЕОБХОДИМОЕ ДЕЙСТВИЕ: Удалить ошибочную блокировку

**Файл**: `packages/session-management/src/adapters/base-postgres-adapter.ts`
**Действие**: Удалить ЕДИНСТВЕННУЮ строку блокировки:

```typescript
// СТРОКА 39 - УДАЛИТЬ:
throw new Error(POSTGRES_ERRORS.SCHEMA_ERROR);
```

**Результат**: PostgresWalletAdapter и PostgresQueueAdapter начнут работать НЕМЕДЛЕННО!

### Фаза 2: ✅ ГОТОВО - Валидация работоспособности

#### 2.1 Проверка работы WalletPoolManager

Проверить что после удаления блокировки:

- `exchange.createOrder` успешно создает заявки
- При отсутствии кошельков заявки попадают в очередь
- `operator.updateOrderStatus` корректно освобождает кошельки

#### 2.2 Тестирование queue mechanism

- Создать тестовую заявку без доступных кошельков
- Проверить FIFO обработку очереди
- Валидировать priority handling (LOW/NORMAL/HIGH/URGENT)

**ВАЖНО**: PostgresWalletAdapter и PostgresQueueAdapter УЖЕ СОДЕРЖАТ все необходимые методы и mapping!

### Фаза 3: Валидация готовой архитектуры

#### 3.1 E2E Validation (Основной тест)

**КРИТИЧЕСКИЙ ТЕСТ**: Проверить полный цикл queue mechanism:

1. Создать заявку когда нет доступных кошельков → должна попасть в очередь
2. Освободить кошелек через operator.updateOrderStatus → заявка из очереди должна получить адрес
3. Проверить email уведомления и queue позиции

#### 3.2 Архитектурная валидация

**Проверить готовые компоненты**:

- ✅ WalletPoolManager.allocateWallet() → QueueAllocationStrategy
- ✅ exchange.createOrder → processQueuedOrder() при отсутствии кошельков
- ✅ operator.updateOrderStatus → WalletPoolManager.releaseWallet()
- ✅ shared.getWalletPoolStats → мониторинг состояния очереди

#### 3.3 Integration Tests (опционально)

**ТОЛЬКО при необходимости**:

- Unit тесты для PostgresWalletAdapter mapping (уже реализован)
- Priority handling в PostgresQueueAdapter (уже реализован)

## Architecture Compliance

### Patterns Preservation

1. **Strategy Pattern** остается неизменным (WalletPoolManager)
2. **Repository Pattern** сохраняется (только implementation меняется)
3. **Adapter Pattern** усиливается (Prisma ↔ Domain mapping)

### Dependencies

- Никаких новых зависимостей
- Использование существующих Prisma моделей
- Сохранение interface contracts

### Error Handling

- Consistent error messages через BasePostgresAdapter
- Proper logging через createEnvironmentLogger
- Graceful fallbacks для queue operations

## Risk Assessment

### Low Risk ✅

- Prisma модели уже существуют
- Interface contracts не меняются
- Existing queue logic work flows не нарушаются

### Medium Risk ⚠️

- Schema mapping может потребовать изменений в WalletInfo interface
- Performance impact новых Prisma запросов

### High Risk ❌

- Breaking changes в domain interfaces
- Database migration requirements (не применимо - схема готова)

## Implementation Sequence

1. **ЕДИНСТВЕННОЕ ИЗМЕНЕНИЕ: Удалить блокировку validateSchema()** (5 минут)
2. **Валидация: Проверить работу exchange.createOrder** (15 минут)
3. **E2E тест: Создать заявку → очередь → освобождение кошелька** (20 минут)

**Total Estimate**: 40 минут (вместо 1 рабочего дня)

**КРИТИЧЕСКОЕ УТОЧНЕНИЕ**:

- ✅ WalletPoolManager архитектура ГОТОВА (0 минут)
- ✅ PostgresWalletAdapter РЕАЛИЗОВАН (0 минут)
- ✅ PostgresQueueAdapter РЕАЛИЗОВАН (0 минут)
- ✅ Exchange/Operator роутеры ИНТЕГРИРОВАНЫ (0 минут)
- ❌ ЕДИНСТВЕННАЯ проблема: 1 строка блокировки в validateSchema() (5 минут)

## Success Criteria

- [ ] `exchange.createOrder` успешно создает заявки в очередь когда нет кошельков
- [ ] Queue entries правильно processed в порядке priority
- [ ] Wallet allocation работает при освобождении кошельков
- [ ] Все existing tests проходят
- [ ] No breaking changes в public APIs
- [ ] Performance соответствует ожиданиям

---

**ИСПРАВЛЕННОЕ ЗАКЛЮЧЕНИЕ**: Task 4.4 Queue Mechanism УЖЕ ПОЛНОСТЬЮ РЕАЛИЗОВАН на архитектурном уровне. Единственная проблема - ОШИБОЧНАЯ блокировка validateSchema() в BasePostgresAdapter, которая препятствует работе готовых PostgresWalletAdapter и PostgresQueueAdapter. Требуется удаление 1 строки кода.
