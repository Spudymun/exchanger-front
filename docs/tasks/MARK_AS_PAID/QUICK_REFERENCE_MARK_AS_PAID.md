# ⚡ Быстрая справка: Реализация "Оплатил"

## 📋 Чек-лист для Agent-coder

### Phase 1: Backend (2-3 часа)

- [ ] **1.1 Константы** (`packages/constants/src/user.ts`)

  ```typescript
  export const MARKABLE_AS_PAID_STATUSES = ['pending'] as const;

  export const USER_SUCCESS_MESSAGES = {
    // ... existing
    ORDER_MARKED_PAID: 'Платеж успешно отмечен',
  } as const;
  ```

- [ ] **1.2 Telegram шаблоны** (`packages/constants/src/telegram.ts`)

  ```typescript
  ICONS: {
    // ... existing
    PAID: '💳',
    PAYMENT_CONFIRMED: '✅',
  },

  HEADERS: {
    // ... existing
    ORDER_PAID: (orderId: string) => `💳 Заявка #${orderId} оплачена пользователем`,
  },

  TEMPLATES: {
    // ... existing
    ORDER_PAID_MESSAGE: (order) => [ /* см. архитектурное решение */ ],
  },
  ```

- [ ] **1.3 Notification helper** (`apps/web/src/server/trpc/routers/user/orders.ts`)

  ```typescript
  async function sendPaidNotification(order: Order, userEmail: string) {
    // Скопировать sendCancellationNotification
    // Изменить: notificationType: 'order_paid'
    // Изменить: status: 'paid'
  }
  ```

- [ ] **1.4 Endpoint** (`apps/web/src/server/trpc/routers/user/orders.ts`)
  ```typescript
  markAsPaid: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await validateUserAccess(ctx.user.id);
      const order = await validateOrderAccess(input.orderId, user.email);

      // Идемпотентность
      if (order.status === ORDER_STATUSES.PAID) {
        return { id: order.id, status: order.status, message: USER_SUCCESS_MESSAGES.ORDER_MARKED_PAID };
      }

      // Валидация
      if (!MARKABLE_AS_PAID_STATUSES.includes(order.status)) {
        throw createBadRequestError('Order cannot be marked as paid in current status');
      }

      // Update
      const updatedOrder = await orderManager.update(order.id, { status: ORDER_STATUSES.PAID });
      if (!updatedOrder) throw createInternalServerError('Order update failed');

      // Notify
      await sendPaidNotification(updatedOrder, user.email);

      return { id: updatedOrder.id, status: updatedOrder.status, message: USER_SUCCESS_MESSAGES.ORDER_MARKED_PAID };
    }),
  ```

### Phase 2: Telegram (1-2 часа)

- [ ] **2.1 Payload type** (`apps/telegram-bot/pages/api/notify-operators.ts`)

  ```typescript
  interface NotificationPayload {
    // ... existing fields
    notificationType?: 'new_order' | 'order_cancelled' | 'order_paid';
  }
  ```

- [ ] **2.2 Handler** (`apps/telegram-bot/pages/api/notify-operators.ts`)
  ```typescript
  function createOperatorMessage(payload: NotificationPayload): string {
    const { notificationType } = payload;

    if (notificationType === 'order_cancelled') {
      return TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.ORDER_CANCELLED_MESSAGE(order);
    }

    // 🆕 ДОБАВИТЬ
    if (notificationType === 'order_paid') {
      return TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.ORDER_PAID_MESSAGE(order);
    }

    // ... existing logic
  }
  ```

### Phase 3: Frontend (1-1.5 часа)

- [ ] **3.1 Mutation** (`apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx`)

  ```typescript
  const markAsPaidMutation = trpc.user.orders.markAsPaid.useMutation({
    onSuccess: () => {
      notifications.success(t('actions.orderMarkedPaid'), t('actions.orderMarkedPaidDescription'));
      utils.exchange.getOrderStatus.invalidate({ orderId });
    },
    onError: error => {
      notifications.handleApiError(error, t('actions.orderMarkPaidError'));
    },
  });
  ```

- [ ] **3.2 Handler** (`apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx`)

  ```typescript
  const handleMarkAsPaid = () => {
    markAsPaidMutation.mutate({ orderId });
  };
  ```

- [ ] **3.3 Локализация**
  - `apps/web/messages/ru/order-page.json`:
    ```json
    {
      "OrderStatus": {
        "actions": {
          "orderMarkedPaid": "Платеж отмечен",
          "orderMarkedPaidDescription": "Мы уведомили операторов о вашем платеже. Обработка начнется в ближайшее время.",
          "orderMarkPaidError": "Не удалось отметить платеж"
        }
      }
    }
    ```
  - `apps/web/messages/en/order-page.json`: (аналогично на английском)

### Phase 4: Testing (2-3 часа)

#### Security Tests

- [ ] Попытка изменить чужой заказ → 403
- [ ] Попытка без auth → 401
- [ ] Передача дополнительных параметров → игнорируются

#### Business Logic Tests

- [ ] pending → paid (success)
- [ ] paid → paid (idempotent success)
- [ ] processing → paid (error 400)

#### Integration Tests

- [ ] E2E: Click → DB update → Telegram → UI update
- [ ] Telegram fallback (TELEGRAM_BOT_URL not set)

#### Race Conditions

- [ ] Двойной клик → оба успешны
- [ ] User + Operator одновременно → Last-write-wins

---

## 🎯 Критические точки

⚠️ **КРИТИЧНО:**

1. Скопировать структуру `cancelOrder` на 100%
2. Добавить идемпотентность для `status === 'paid'`
3. Telegram notification в `try-catch` без `throw`
4. Использовать `ORDER_STATUSES.PAID`, не хардкодить
5. Локализация ru + en

---

## 📚 Референсные файлы

**Security pattern:**

- `apps/web/src/server/trpc/routers/user/orders.ts:136-167` (cancelOrder)

**Notification pattern:**

- `apps/web/src/server/trpc/routers/user/orders.ts:36-71` (sendCancellationNotification)

**Mutation pattern:**

- `apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx:21-33` (cancelOrderMutation)

**Telegram templates:**

- `packages/constants/src/telegram.ts:115-133` (ORDER_CANCELLED_MESSAGE)

---

## ✅ Final Check

- [ ] TypeScript compilation clean
- [ ] ESLint no warnings
- [ ] All tests passed
- [ ] Telegram notification works
- [ ] UI auto-updates
- [ ] Localization ru + en
- [ ] Idempotency tested
- [ ] Error messages user-friendly

---

**Полное архитектурное решение:** [architectural-solution-mark-as-paid-button.md](architectural-solution-mark-as-paid-button.md)

**Impact Analysis:** [impact-analysis-mark-as-paid-button.md](impact-analysis-mark-as-paid-button.md)
