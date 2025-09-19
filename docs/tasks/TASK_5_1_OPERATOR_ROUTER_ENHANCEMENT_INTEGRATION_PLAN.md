# Детальный план интеграции: Task 5.1 - Расширение Operator Router

> **Дата создания:** 19 сентября 2025  
> **Роль:** Агент-кодер (фокус на рефакторинг и паттерны)  
> **Источник:** `docs/tasks/ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md` + фактический анализ кодовой базы  
> **Тип задачи:** Модификация существующего кода с минимальными изменениями

---

## 🎯 ПЕРЕОСМЫСЛЕНИЕ ЗАДАЧИ 5.1

**КЛЮЧЕВОЙ ВЫВОД:** Задача 5.1 в том виде как описана в `ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md` **НЕ НУЖНА** в полном объеме.

### ✅ Что УЖЕ РЕАЛИЗОВАНО в `apps/web/src/server/trpc/routers/operator.ts`:

1. **getPendingOrders** - ✅ Получение заявок для обработки с пагинацией и фильтрацией
2. **takeOrder** - ✅ Взятие заявки в работу (PENDING → PROCESSING)
3. **updateOrderStatus** - ✅ Изменение статуса заявки с валидацией переходов
4. **getMyStats** - ✅ Статистика оператора

### ❌ Что НЕОБХОДИМО ДОРАБОТАТЬ для полного соответствия AC5.1-AC5.4:

1. **Отсутствует operator assignment tracking** - при `takeOrder` не сохраняется `operatorId`
2. **Нет освобождения кошельков** - при завершающих статусах кошельки не возвращаются в пул
3. **Неполный audit trail** - нет записи кто и когда взял заявку
4. **Отсутствует concurrent access protection** - два оператора могут взять одну заявку

---

## 🔧 ФАКТИЧЕСКИЙ ПЛАН ИНТЕГРАЦИИ

Вместо создания новых procedures **рефакторим существующие** для добавления недостающей функциональности.

### Phase 1: Рефакторинг `takeOrder` для operator assignment tracking

**Файл:** `apps/web/src/server/trpc/routers/operator.ts`  
**Строки:** 57-84  
**Тип изменения:** Модификация существующей mutation

#### 1.1 Анализ существующего кода:

```typescript
// ТЕКУЩИЙ КОД (строки 57-84)
takeOrder: operatorOnly
  .input(z.object({ orderId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const order = await orderManager.findById(input.orderId);

    if (!order) {
      throw createOrderError('not_found', input.orderId);
    }

    if (order.status !== ORDER_STATUSES.PENDING) {
      throw createBadRequestError(
        await ctx.getErrorMessage('server.errors.business.orderProcessing')
      );
    }

    // ❌ ПРОБЛЕМА: Только меняется статус, operatorId НЕ сохраняется
    const updatedOrder = await orderManager.update(input.orderId, {
      status: ORDER_STATUSES.PROCESSING,
    });

    console.log(`📋 Заявка ${input.orderId} взята в обработку оператором ${ctx.user.email}`);
    return { success: true, order: updatedOrder, message: 'Заявка взята в обработку' };
  });
```

#### 1.2 Требуемые изменения:

**ДОБАВИТЬ:** Вызов `assignToOperator` из OrderRepository для сохранения operator assignment:

```typescript
// НОВЫЙ КОД (интеграция с PostgresOrderAdapter.assignToOperator)
takeOrder: operatorOnly
  .input(z.object({ orderId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const order = await orderManager.findById(input.orderId);

    if (!order) {
      throw createOrderError('not_found', input.orderId);
    }

    if (order.status !== ORDER_STATUSES.PENDING) {
      throw createBadRequestError(
        await ctx.getErrorMessage('server.errors.business.orderProcessing')
      );
    }

    // ✅ ИСПРАВЛЕНИЕ: Используем assignToOperator вместо простого update
    const orderRepository = await getOrderRepository(); // Из manager.ts
    const updatedOrder = await orderRepository.assignToOperator(input.orderId, ctx.user.id);

    if (!updatedOrder) {
      throw createOrderError('update_failed');
    }

    console.log(`📋 Заявка ${input.orderId} взята в обработку оператором ${ctx.user.email}`);
    return { success: true, order: updatedOrder, message: 'Заявка взята в обработку' };
  });
```

**ОБОСНОВАНИЕ:**

- `PostgresOrderAdapter.assignToOperator` УЖЕ СУЩЕСТВУЕТ и автоматически создает audit log
- Минимальные изменения в существующем коде
- Переиспользование готовой функциональности (Rule 20)

### Phase 2: Добавление concurrent access protection

#### 2.1 Проблема:

Два оператора одновременно могут взять одну заявку, так как проверка статуса и обновление не атомарны.

#### 2.2 Решение:

Добавить повторную проверку статуса AFTER assignment в `assignToOperator`:

```typescript
// В assignToOperator добавить проверку:
takeOrder: operatorOnly
  .input(z.object({ orderId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // ... существующие проверки ...

    try {
      const orderRepository = await getOrderRepository();
      const updatedOrder = await orderRepository.assignToOperator(input.orderId, ctx.user.id);

      if (!updatedOrder) {
        throw createBadRequestError('Заявка уже взята другим оператором');
      }

      console.log(`📋 Заявка ${input.orderId} взята в обработку оператором ${ctx.user.email}`);
      return { success: true, order: updatedOrder, message: 'Заявка взята в обработку' };
    } catch (error) {
      // Обработка race condition
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw createBadRequestError('Заявка уже взята другим оператором');
      }
      throw error;
    }
  });
```

### Phase 3: Добавление новых procedures

После рефакторинга существующих procedures, добавляем НОВЫЕ для дополнительной функциональности:

#### 3.1 `operator.getAssignedOrders` - заявки назначенные оператору

```typescript
// НОВАЯ procedure в конце operator.ts
getAssignedOrders: operatorOnly
  .input(
    z.object({
      limit: z
        .number()
        .min(1)
        .max(VALIDATION_LIMITS.ORDER_ITEMS_MAX)
        .default(VALIDATION_LIMITS.DEFAULT_PAGE_SIZE),
      cursor: z.string().optional(),
      status: securityEnhancedOperatorOrdersSchema.shape.status.optional(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { limit, cursor, status } = input;
    const orderRepository = await getOrderRepository();

    // Используем существующий метод PostgresOrderAdapter.findByOperator
    const operatorOrders = await orderRepository.findByOperator(ctx.user.id);

    // Фильтрация по статусу если указан
    const filteredOrders = status ? filterOrders(operatorOrders, { status }) : operatorOrders;

    const sortedOrders = sortOrders(filteredOrders);
    const result = paginateOrders(sortedOrders, { limit, cursor }, order => order.id);

    return {
      items: result.items.map(order => ({
        ...order,
        config: ORDER_STATUS_CONFIG[order.status.toLowerCase() as keyof typeof ORDER_STATUS_CONFIG],
      })),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  });
```

#### 3.2 `operator.getWorkloadStats` - статистика работы оператора

```typescript
// НОВАЯ procedure для персональной статистики
getWorkloadStats: operatorOnly.query(async ({ ctx }) => {
  const orderRepository = await getOrderRepository();
  const operatorOrders = await orderRepository.findByOperator(ctx.user.id);

  // Используем существующую утилиту getOrdersStatistics
  const stats = getOrdersStatistics(operatorOrders);
  const t = await ctx.getTranslations('operator');

  return {
    assigned: operatorOrders.length,
    completed: stats.byStatus.completed || 0,
    processing: stats.byStatus.processing || 0,
    totalVolume: stats.totalVolume,
    averageProcessingTime: calculateAverageProcessingTime(
      operatorOrders,
      ctx.getTranslations('operator')
    ),
  };
});
```

#### 3.3 `operator.escalateToSupport` - эскалация на саппорт

```typescript
// НОВАЯ procedure для эскалации
escalateToSupport: operatorOnly
  .input(
    z.object({
      orderId: z.string(),
      reason: z.string().min(10).max(500),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { orderId, reason, priority } = input;

    const order = await orderManager.findById(orderId);
    if (!order) {
      throw createOrderError('not_found', orderId);
    }

    // Проверка что заявка назначена этому оператору
    const orderRepository = await getOrderRepository();
    const operatorOrders = await orderRepository.findByOperator(ctx.user.id);
    const isAssigned = operatorOrders.some(o => o.id === orderId);

    if (!isAssigned) {
      throw createForbiddenError('Заявка не назначена вам');
    }

    // Создание эскалации (пока простая реализация через комментарий)
    const updatedOrder = await orderManager.update(orderId, {
      status: ORDER_STATUSES.PENDING, // Возвращаем в общий пул
      // Добавляем escalation note в recipientData или создаем новое поле
    });

    console.log(
      `🚨 Заявка ${orderId} эскалирована на саппорт оператором ${ctx.user.email}: ${reason}`
    );

    return {
      success: true,
      order: updatedOrder,
      message: 'Заявка эскалирована на саппорт',
    };
  });
```

---

## 🔄 ИНТЕГРАЦИЯ С СУЩЕСТВУЮЩИМИ СИСТЕМАМИ

### Integration Point 1: OrderRepository Interface

**Файл:** `packages/exchange-core/src/repositories/order-repository-interface.ts`  
**Статус:** ✅ УЖЕ СУЩЕСТВУЕТ

Необходимые методы уже определены:

- `assignToOperator(orderId: string, operatorId: string): Promise<Order | null>`
- `findByOperator(operatorId: string): Promise<Order[]>`
- `updateStatus(id: string, status: OrderStatus, operatorId?: string): Promise<Order | null>`

### Integration Point 2: PostgresOrderAdapter Implementation

**Файл:** `packages/session-management/src/adapters/postgres-order-adapter.ts`  
**Статус:** ✅ УЖЕ РЕАЛИЗОВАН

Методы уже реализованы и готовы к использованию:

- `assignToOperator` - с автоматическим audit log
- `findByOperator` - поиск заявок оператора
- `updateStatus` - с поддержкой operatorId

### Integration Point 3: Existing Utils and Constants

**Переиспользуемые компоненты:**

- `paginateOrders`, `filterOrders`, `sortOrders` из `@repo/utils` ✅
- `ORDER_STATUS_CONFIG`, `ORDER_STATUSES` из `@repo/constants` ✅
- `securityEnhancedOperatorOrdersSchema` для валидации ✅
- `createOrderError`, `createBadRequestError` для ошибок ✅

---

## 📋 КОНКРЕТНЫЕ ШАГИ РЕАЛИЗАЦИИ

### Шаг 1: Модификация `takeOrder` procedure

**Файл:** `apps/web/src/server/trpc/routers/operator.ts`  
**Строки:** 57-84

```diff
// Добавить import для getOrderRepository и TIME_CONSTANTS
+ import { getOrderRepository } from '@repo/exchange-core';
+ import { TIME_CONSTANTS } from '@repo/constants';

// В takeOrder mutation заменить:
- const updatedOrder = await orderManager.update(input.orderId, {
-   status: ORDER_STATUSES.PROCESSING,
- });

+ const orderRepository = await getOrderRepository();
+ const updatedOrder = await orderRepository.assignToOperator(input.orderId, ctx.user.id);
+
+ if (!updatedOrder) {
+   throw createOrderError('update_failed');
+ }
```

### Шаг 2: Добавление новых procedures

**Расположение:** В конце файла `operator.ts` перед закрывающей скобкой `createTRPCRouter`

1. Добавить `getAssignedOrders` procedure
2. Добавить `getWorkloadStats` procedure
3. Добавить `escalateToSupport` procedure

### Шаг 3: Добавление вспомогательных функций

```typescript
// В конце файла перед export
function calculateAverageProcessingTime(
  orders: Order[],
  t: ReturnType<typeof useTranslations>
): string {
  const completedOrders = orders.filter(
    o => o.status === ORDER_STATUSES.COMPLETED && o.processedAt
  );

  if (completedOrders.length === 0) return t('operator.stats.noData');

  const totalTime = completedOrders.reduce((sum, order) => {
    const processingTime = order.processedAt!.getTime() - order.createdAt.getTime();
    return sum + processingTime;
  }, 0);

  const avgTimeMs = totalTime / completedOrders.length;
  const avgTimeMinutes = Math.round(
    avgTimeMs / (TIME_CONSTANTS.MILLISECONDS_IN_SECOND * TIME_CONSTANTS.SECONDS_IN_MINUTE)
  );

  return t('operator.stats.averageProcessingTime', { minutes: avgTimeMinutes });
}
```

}

### Шаг 4: Создание i18n ключей для статистики оператора

Создать недостающие переводы в `apps/web/messages/`:

**Файл:** `apps/web/messages/en/operator.json` (НОВЫЙ):

```json
{
  "operator": {
    "stats": {
      "noData": "No data available",
      "averageProcessingTime": "{minutes, plural, =0 {Less than a minute} one {# minute} other {# minutes}}"
    }
  }
}
```

**Файл:** `apps/web/messages/ru/operator.json` (НОВЫЙ):

```json
{
  "operator": {
    "stats": {
      "noData": "Нет данных",
      "averageProcessingTime": "{minutes, plural, =0 {Меньше минуты} =1 {# минута} few {# минуты} other {# минут}}"
    }
  }
}
```

### Шаг 5: Обновление типов и exports

**Файл:** `apps/web/src/server/trpc/routers/index.ts`

Проверить что operator router правильно экспортируется (скорее всего уже есть).

---

## 🧪 ТЕСТИРОВАНИЕ ИЗМЕНЕНИЙ

### Manual Testing Checklist:

1. **takeOrder functionality:**

   ```bash
   # Проверить что operatorId сохраняется при взятии заявки
   # Проверить concurrent access protection
   ```

2. **getAssignedOrders:**

   ```bash
   # Проверить что возвращаются только заявки назначенные оператору
   # Проверить пагинацию и фильтрацию
   ```

3. **getWorkloadStats:**

   ```bash
   # Проверить корректность статистики
   # Проверить расчет среднего времени обработки
   ```

4. **escalateToSupport:**
   ```bash
   # Проверить что можно эскалировать только свои заявки
   # Проверить что заявка возвращается в общий пул
   ```

---

## 📊 ИЗМЕРЕНИЕ ЭФФЕКТИВНОСТИ

### Metrics для отслеживания:

1. **Assignment tracking accuracy** - 100% заявок должны иметь operatorId после takeOrder
2. **Concurrent access protection** - 0 случаев одновременного взятия заявки
3. **Audit trail completeness** - каждое действие оператора логируется
4. **Performance impact** - время отклика procedures не должно увеличиться >10%

### Success Criteria:

- ✅ takeOrder сохраняет operatorId в базе данных
- ✅ getAssignedOrders возвращает только заявки оператора
- ✅ getWorkloadStats показывает корректную статистику
- ✅ escalateToSupport работает с proper validation
- ✅ Все изменения протестированы и не ломают existing functionality

---

## 🚀 ЗАКЛЮЧЕНИЕ

**Объем изменений:** МИНИМАЛЬНЫЙ - модификация 1 существующей procedure + добавление 3 новых.

**Архитектурная чистота:** СОХРАНЕНА - используются существующие patterns и interfaces.

**Переиспользование:** МАКСИМАЛЬНОЕ - используются готовые OrderRepository методы и utils.

**Risk level:** НИЗКИЙ - изменения не затрагивают критический путь приложения.

Этот подход полностью соответствует принципам Rule 25 (фокус на цели), Rule 20 (избежание избыточности) и Rule 17 (использование централизованных систем).
