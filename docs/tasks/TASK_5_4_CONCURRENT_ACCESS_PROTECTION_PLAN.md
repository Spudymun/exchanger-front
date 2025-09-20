# Детальный план реализации: Task 5.4 - Concurrent Access Protection для takeOrder

> **Дата создания:** 20 сентября 2025  
> **Роль:** Агент-кодер (фокус на рефакторинг и паттерны)  
> **Цель:** Интегрировать concurrent access protection в существующую архитектуру как пазл  
> **Источник:** `docs/tasks/ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md` Task 5.4  
> **Архитектура:** Минимальные изменения, максимальное переиспользование существующих паттернов

---

## 🚨 КРИТИЧЕСКАЯ ПРОБЛЕМА: Race Condition в takeOrder

### 📊 Фактический анализ проблемы

**ДОКАЗАННАЯ УЯЗВИМОСТЬ:**

```typescript
// ПРОБЛЕМНЫЙ КОД: packages/session-management/src/adapters/postgres-order-adapter.ts (строки 161-175)
async assignToOperator(orderId: string, operatorId: string): Promise<Order | null> {
  const prismaOrder = await this.prisma.order.update({
    where: { id: orderId }, // ❌ НЕТ проверки status=PENDING && assignedOperatorId=NULL
    data: {
      assignedOperatorId: operatorId,
      assignedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}
```

**RACE CONDITION SCENARIO:**

1. **Operator A** и **Operator B** одновременно вызывают `takeOrder` для заявки `order_123`
2. Оба видят заявку со статусом `PENDING` и `assignedOperatorId: null`
3. **Operator A** вызывает `assignToOperator(order_123, operatorA_id)`
4. **Operator B** вызывает `assignToOperator(order_123, operatorB_id)` **одновременно**
5. **Результат:** Заявка назначена `operatorB_id` (последний UPDATE побеждает)
6. **Проблема:** `operatorA` думает что взял заявку, но она назначена `operatorB`

**БИЗНЕС-ВЛИЯНИЕ:**

- ❌ Конфликты между операторами
- ❌ Потеря заявок и нарушение SLA
- ❌ Невозможность отследить кто РЕАЛЬНО обрабатывает заявку
- ❌ Нарушение принципа "одна заявка = один оператор"

---

## 🎯 Архитектурное решение

### Принцип: Optimistic Concurrency Control через Prisma

**СТРАТЕГИЯ:** Использовать Prisma `update` с compound `where` conditions для атомарной проверки и обновления.

**ПРЕИМУЩЕСТВА:**

- ✅ **Минимальные изменения** - рефакторинг одного метода
- ✅ **Переиспользование паттернов** - уже есть P2025 error handling
- ✅ **Архитектурная целостность** - соответствует существующим adapter patterns
- ✅ **Production-ready** - полагается на database-level atomicity
- ✅ **Соответствие проекту** - нет existing Redis locking infrastructure, database solution оптимально

**АРХИТЕКТУРНАЯ СОВМЕСТИМОСТЬ:**

- ✅ Существующий `PostgresOrderAdapter` pattern
- ✅ Existing error handling через `P2025` (найден в строке 386)
- ✅ Audit log creation через `createAuditLog()`
- ✅ tRPC error propagation через `createBadRequestError()`
- ✅ **ВЕРИФИЦИРОВАНО:** Нет existing Redis locking - database solution архитектурно правильный

---

## 🔧 ДЕТАЛЬНЫЙ ПЛАН ИНТЕГРАЦИИ

### Phase 1: Рефакторинг PostgresOrderAdapter.assignToOperator

**Файл:** `packages/session-management/src/adapters/postgres-order-adapter.ts`  
**Строки:** 161-185  
**Тип изменения:** Рефакторинг existing method

#### 1.1 Текущий проблемный код:

```typescript
// ТЕКУЩИЙ КОД (строки 161-175)
async assignToOperator(orderId: string, operatorId: string): Promise<Order | null> {
  try {
    this.logger.info('Assigning order to operator', { orderId, operatorId });

    const prismaOrder = await this.prisma.order.update({
      where: { id: orderId }, // ❌ ПРОБЛЕМА: отсутствуют atomic conditions
      data: {
        assignedOperatorId: operatorId,
        assignedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create audit log...
    return this.mapPrismaToOrder(prismaOrder as any);
  } catch (error) {
    // Existing error handling...
  }
}
```

#### 1.2 Новый concurrent-safe код:

```typescript
// НОВЫЙ КОД (интеграция concurrent access protection)
async assignToOperator(orderId: string, operatorId: string): Promise<Order | null> {
  try {
    this.logger.info('Assigning order to operator with concurrent protection', {
      orderId,
      operatorId
    });

    // ✅ РЕШЕНИЕ: Atomic update с проверкой conditions
    const prismaOrder = await this.prisma.order.update({
      where: {
        id: orderId,
        status: 'PENDING',           // ✅ Только PENDING заявки
        assignedOperatorId: null,    // ✅ Только неназначенные заявки
      },
      data: {
        assignedOperatorId: operatorId,
        status: 'PROCESSING',        // ✅ УЛУЧШЕНИЕ: Немедленно меняем статус
        assignedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Existing audit log creation
    await this.createAuditLog({
      orderId,
      action: 'ASSIGNED_TO_OPERATOR',
      oldValue: null,
      newValue: operatorId,
      performedBy: operatorId,
    });

    this.logger.info('Order assigned successfully with concurrent protection', {
      orderId,
      operatorId
    });

    return this.mapPrismaToOrder(prismaOrder as any);
  } catch (error) {
    // ✅ РАСШИРЕНИЕ: Enhanced error handling для concurrent conflicts
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      // P2025 = Record not found или condition не выполнен
      this.logger.warn('Concurrent assignment attempt detected', {
        orderId,
        operatorId,
        reason: 'Order already assigned or not in PENDING status',
      });

      // Возвращаем null для обработки в tRPC layer
      return null;
    }

    this.logger.error('PostgresOrderAdapter.assignToOperator failed', {
      error: error instanceof Error ? error.message : String(error),
      orderId,
      operatorId,
    });

    return null;
  }
}
```

**АРХИТЕКТУРНОЕ ОБОСНОВАНИЕ:**

- **Atomic Database Operation:** `WHERE` conditions выполняются атомарно на уровне PostgreSQL
- **Existing Error Pattern:** Переиспользуем существующий P2025 handling (строка 386)
- **Consistent Logging:** Расширяем existing logging pattern с concurrent context
- **Backward Compatibility:** Метод возвращает тот же `Order | null` contract
- **✅ ВЕРИФИЦИРОВАНО:** Database-level решение оптимально - в проекте НЕТ Redis locking infrastructure

### Phase 2: Обновление tRPC Operator Router Error Handling

**Файл:** `apps/web/src/server/trpc/routers/operator.ts`  
**Строки:** 67-85  
**Тип изменения:** Расширение existing error handling

#### 2.1 Текущий код takeOrder:

```typescript
// ТЕКУЩИЙ КОД (строки 78-85)
// ✅ ИСПРАВЛЕНИЕ: Используем assignToOperator вместо простого update для корректного audit tracking
const updatedOrder = await orderManager.assignToOperator(input.orderId, ctx.user.id);

if (!updatedOrder) {
  throw createOrderError('update_failed');
}

console.log(`📋 Заявка ${input.orderId} взята в обработку оператором ${ctx.user.email}`);
```

#### 2.2 Расширенный error handling для concurrent conflicts:

```typescript
// РАСШИРЕННЫЙ КОД (интеграция concurrent access protection)
// ✅ ИСПРАВЛЕНИЕ: Используем assignToOperator с concurrent protection
const updatedOrder = await orderManager.assignToOperator(input.orderId, ctx.user.id);

if (!updatedOrder) {
  // ✅ НОВОЕ: Enhanced error messaging для concurrent conflicts
  this.logger.warn('Order assignment failed - likely concurrent access', {
    orderId: input.orderId,
    operatorId: ctx.user.id,
    operatorEmail: ctx.user.email,
  });

  throw createBadRequestError(
    await ctx.getErrorMessage('server.errors.business.orderAlreadyAssigned')
  );
}

console.log(`📋 Заявка ${input.orderId} взята в обработку оператором ${ctx.user.email}`);
```

**ИНТЕГРАЦИЯ ТРЕБОВАНИЙ:**

- **Enhanced Logging:** Добавляем context о concurrent access attempts
- **User-Friendly Errors:** Specific error message для конфликтов назначения
- **Existing Patterns:** Переиспользуем `createBadRequestError()` и i18n error messages

### Phase 3: Добавление i18n Error Messages

**Файл:** `apps/web/messages/en.json` и `apps/web/messages/ru.json`

#### 3.1 Новые i18n ключи:

```json
// apps/web/messages/en.json
{
  "server": {
    "errors": {
      "business": {
        "orderAlreadyAssigned": "Order has already been assigned to another operator"
      }
    }
  }
}

// apps/web/messages/ru.json
{
  "server": {
    "errors": {
      "business": {
        "orderAlreadyAssigned": "Заявка уже взята другим оператором"
      }
    }
  }
}
```

**АРХИТЕКТУРНАЯ ИНТЕГРАЦИЯ:**

- ✅ Consistent i18n Pattern: Соответствует existing error message structure
- ✅ Business Error Classification: Размещено в `business` namespace
- ✅ Multi-language Support: Поддержка English и Russian

---

## 🧪 TESTING STRATEGY

### Сценарии для тестирования

**1. Успешное назначение (Normal Case):**

```typescript
// Scenario: Operator берет заявку в штатном режиме
// Expected: Order assigned successfully, audit log created
```

**2. Concurrent Assignment Conflict (Race Condition):**

```typescript
// Scenario: Два оператора одновременно берут одну заявку
// Expected: Один успешный, один получает "already assigned" error
```

**3. Order Already Assigned:**

```typescript
// Scenario: Operator пытается взять уже назначенную заявку
// Expected: "already assigned" error
```

**4. Order Not PENDING:**

```typescript
// Scenario: Operator пытается взять заявку со статусом PROCESSING/COMPLETED
// Expected: "not in correct status" error
```

### Manual Testing Checklist

```bash
# 1. Проверить normal assignment flow
# 2. Симулировать concurrent requests (Postman/curl одновременно)
# 3. Проверить error messages в UI
# 4. Убедиться что audit logs создаются правильно
# 5. Проверить что P2025 errors обрабатываются корректно
```

---

## 📊 ИЗМЕРЕНИЕ ЭФФЕКТИВНОСТИ

### Success Criteria

**1. Concurrent Protection Effectiveness:**

- ✅ 0 случаев двойного назначения одной заявки
- ✅ 100% atomic assignments на database level
- ✅ Proper error handling для concurrent conflicts

**2. Performance Impact:**

- ✅ Время отклика takeOrder не увеличилось >5%
- ✅ Database query efficiency сохранена (compound WHERE не добавляет overhead)
- ✅ Audit log creation не замедлилась
- ✅ **УЛУЧШЕНИЕ:** Меньше статусных переходов за счет immediate PROCESSING status

**3. User Experience:**

- ✅ Clear error messages при concurrent conflicts
- ✅ Consistent behavior в multi-operator environment
- ✅ No phantom assignments или lost orders

### Monitoring Metrics

```typescript
// Логирование для мониторинга:
// 1. Successful assignments
// 2. Concurrent conflict attempts
// 3. P2025 error frequency
// 4. Assignment timing metrics
```

---

## 🔄 ROLLBACK STRATEGY

### Если что-то пойдет не так

**1. Code Rollback:**

```typescript
// Вернуть assignToOperator к простому UPDATE:
where: {
  id: orderId;
} // Убрать compound conditions
```

**2. Error Handling Rollback:**

```typescript
// Вернуть к generic error handling:
throw createOrderError('update_failed'); // Убрать concurrent-specific error
```

**3. Database Integrity:**

- ✅ Никаких database schema changes
- ✅ Existing audit logs остаются валидными
- ✅ No data migration required

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Database Layer

- [ ] Рефакторинг `PostgresOrderAdapter.assignToOperator()` с compound WHERE
- [ ] Enhanced P2025 error handling для concurrent conflicts
- [ ] Enhanced logging с concurrent access context
- [ ] Testing изменений на database level

### Phase 2: tRPC Layer

- [ ] Расширение error handling в `operator.takeOrder`
- [ ] Добавление specific error для concurrent conflicts
- [ ] Integration testing с enhanced error flow
- [ ] Testing error propagation к client

### Phase 3: i18n Integration

- [ ] Добавление error messages в en.json/ru.json
- [ ] Testing локализации error messages
- [ ] Verification i18n key resolution

### Phase 4: Validation & Deployment

- [ ] Manual testing всех concurrent scenarios
- [ ] Performance testing для regression detection
- [ ] Documentation обновления для operators
- [ ] Production deployment с monitoring

---

## 🎯 ARCHITECTURAL COMPLIANCE

### Rule 25 (МАКСИМАЛЬНЫЙ ПРИОРИТЕТ): ФОКУС НА ЦЕЛИ

- ✅ **Только целевые изменения:** Затрагиваем только takeOrder concurrent protection
- ✅ **Минимальный scope:** Рефакторинг одного метода + error handling
- ✅ **Без побочных улучшений:** Не оптимизируем performance или UI

### Rule 20: ЗАПРЕТ ИЗБЫТОЧНОСТИ

- ✅ **Переиспользование паттернов:** P2025 error handling уже существует
- ✅ **Existing audit system:** Используем существующую `createAuditLog()`
- ✅ **tRPC error patterns:** Переиспользуем `createBadRequestError()`
- ✅ **ВЕРИФИЦИРОВАНО:** Не создаем дублирование - Redis locking НЕ СУЩЕСТВУЕТ в проекте

### Rule 24: ЗНАНИЕ СТРУКТУРЫ

- ✅ **Архитектурная интеграция:** Соответствует PostgresOrderAdapter patterns
- ✅ **Package boundaries:** Изменения только в session-management и web app
- ✅ **Dependency flow:** Сохраняем существующий tRPC → exchange-core → session-management
- ✅ **ВЕРИФИЦИРОВАНО:** Проверено отсутствие Redis locking infrastructure - database solution правильный

### Rule 2: СТРУКТУРИРОВАННЫЙ ПОДХОД

- ✅ **Понимание проблемы:** Race condition analysis проведен
- ✅ **Архитектурный анализ:** Database-level solution выбран
- ✅ **План реализации:** Детальные steps с файлами и строками кода

---

## 🚀 READY FOR IMPLEMENTATION

Этот план готов к реализации как **специалист, пришедший в проект в первый день**:

- **📋 Конкретные файлы и строки** для изменений
- **🔧 Точные code changes** с before/after
- **🏗️ Архитектурная совместимость** с existing patterns
- **🧪 Testing strategy** для validation
- **📊 Success criteria** для measurement
- **🔄 Rollback plan** для risk mitigation

**Next Step:** Начать с Phase 1 - рефакторинг `PostgresOrderAdapter.assignToOperator()` для добавления compound WHERE conditions.
