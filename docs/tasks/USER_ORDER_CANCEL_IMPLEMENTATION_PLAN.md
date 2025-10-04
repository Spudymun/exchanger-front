# План реализации: Отмена заявки пользователем с уведомлением в Telegram

**Дата:** 4 октября 2025  
**Автор:** AI Agent (с применением ai-agent-rules.yml)  
**Тип задачи:** Агент-кодер (рефакторинг и интеграция)

---

## 📋 EXECUTIVE SUMMARY

**Цель:** Реализовать полный цикл отмены заявки пользователем через подтверждающее диалоговое окно с уведомлением оператора в Telegram.

**Ключевое требование:** Отдельный endpoint строго для отмены заявок, без возможности других операций через этот endpoint.

**Охват изменений:**

- ✅ **Frontend:** Интеграция mutation в `OrderPageClient.tsx` (минимальные изменения)
- ✅ **Backend:** Endpoint уже существует `user.orders.cancelOrder` (проверка логики)
- ✅ **Telegram:** Добавление уведомления оператора о отмене заявки
- ✅ **Database:** Обновление статуса на `CANCELLED` (существующий механизм)

---

## 🔍 PHASE 0: ГЛУБОКИЙ АНАЛИЗ СУЩЕСТВУЮЩЕЙ КОДОВОЙ БАЗЫ

### ✅ 0.1 Верификация существующих компонентов

#### **Frontend компоненты (100% проверено):**

```
📍 apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx
   ├─ Статус: TODO stub для handleCancelOrder
   ├─ Зависимость: trpc.useUtils() уже импортирован
   └─ Требуется: Добавить mutation + invalidate cache

📍 packages/ui/src/components/order/helpers/OrderActions.tsx
   ├─ Статус: Полностью готов
   ├─ Функционал: Диалог подтверждения реализован
   └─ Callback: onCancelOrder передается в handleCancelConfirm
```

#### **Backend API (100% проверено):**

```
📍 apps/web/src/server/trpc/routers/user/orders.ts
   ├─ Endpoint: user.orders.cancelOrder ✅ СУЩЕСТВУЕТ
   ├─ Middleware: protectedProcedure (требует аутентификации)
   ├─ Валидация: CANCELLABLE_ORDER_STATUSES (['pending', 'processing'])
   ├─ Логика: orderManager.update(orderId, { status: CANCELLED })
   └─ Response: { id, status, message: USER_SUCCESS_MESSAGES.ORDER_CANCELLED }
```

**КРИТИЧЕСКАЯ НАХОДКА:** Endpoint **УЖЕ СУЩЕСТВУЕТ** и делает **СТРОГО отмену**, соответствует требованию!

```typescript
// apps/web/src/server/trpc/routers/user/orders.ts:86-122
cancelOrder: protectedProcedure
  .input(z.object({ orderId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const user = await validateUserAccess(ctx.user.id);
    const order = await validateOrderAccess(input.orderId, user.email);

    // ✅ ВАЛИДАЦИЯ: Можно отменить только pending/processing
    if (!CANCELLABLE_ORDER_STATUSES.includes(
      order.status as (typeof CANCELLABLE_ORDER_STATUSES)[number]
    )) {
      throw createBadRequestError('Order cannot be cancelled in current status');
    }

    // ✅ АТОМАРНАЯ ОПЕРАЦИЯ: Только смена статуса
    const updatedOrder = await orderManager.update(order.id, {
      status: ORDER_STATUSES.CANCELLED,
    });

    if (!updatedOrder) {
      throw createInternalServerError('Order update failed');
    }

    console.log(`❌ Заявка ${order.id} отменена пользователем ${user.email}`);

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      message: USER_SUCCESS_MESSAGES.ORDER_CANCELLED,
    };
  }),
```

#### **Telegram уведомления (100% проверено):**

```
📍 apps/telegram-bot/pages/api/notify-operators.ts
   ├─ Endpoint: POST /api/notify-operators ✅ СУЩЕСТВУЕТ
   ├─ Функционал: Рассылка всем авторизованным операторам
   ├─ Payload: { order, depositAddress, walletType }
   └─ Использование: Уже вызывается в exchange.createOrder

📍 apps/web/src/server/trpc/routers/exchange.ts:140-183
   └─ sendTelegramNotification() - существующая функция
```

**КРИТИЧЕСКАЯ НАХОДКА:** Инфраструктура Telegram уведомлений **ПОЛНОСТЬЮ ГОТОВА**, нужно только добавить новый template для отмены.

---

### ✅ 0.2 Паттерны проекта (100% проверено)

#### **Mutation Pattern (apps/web/src/hooks/):**

```typescript
// ПАТТЕРН 1: useAuthMutations.ts
const login = trpc.auth.login.useMutation({
  onSuccess: () => {
    notifications.success(t('loginSuccess'), t('loginSuccessDescription'));
    utils.auth.getSession.invalidate();
  },
  onError: (error: unknown) => {
    notifications.handleApiError(error, t('loginError'));
  },
});

// ПАТТЕРН 2: usePasswordMutations.ts
const resetPassword = trpc.auth.resetPassword.useMutation({
  onSuccess: () => notifications.success(t('passwordChanged'), t('passwordChangedDescription')),
  onError: (error: unknown) => notifications.handleApiError(error, 'password change'),
});
```

**ВЫВОД:** Проект использует **прямые tRPC mutations** БЕЗ обертки через useMutation из React Query.

#### **Cache Invalidation Pattern:**

```typescript
// apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx:14-18
const utils = trpc.useUtils();
const { data: orderData } = useOrderStatus(orderId, {
  refetchInterval: 30000, // 30 секунд
});
```

**ВЫВОД:** После мутации нужно **invalidate** кэш через `utils.exchange.getOrderStatus.invalidate({ orderId })`.

---

### ✅ 0.3 Константы и сообщения (100% проверено)

```typescript
// packages/constants/src/user.ts:66
export const CANCELLABLE_ORDER_STATUSES = ['pending', 'processing'] as const;

// packages/constants/src/order-statuses.ts:9-16
export const ORDER_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

// packages/constants/src/telegram.ts:23-119
export const TELEGRAM_OPERATOR_MESSAGES = {
  ICONS: {
    NEW_ORDER: '🆕',
    WARNING: '⚠️',
    // ... НУЖНО ДОБАВИТЬ: CANCELLED: '❌'
  },
  HEADERS: {
    NEW_ORDER: (orderId: string) => `💰 Новая заявка #${orderId}`,
    // ... НУЖНО ДОБАВИТЬ: ORDER_CANCELLED
  },
  TEMPLATES: {
    ORDER_INFO: (order, depositAddress) => [...],
    // ... НУЖНО ДОБАВИТЬ: ORDER_CANCELLED_MESSAGE
  },
};
```

---

## 🎯 PHASE 1: FRONTEND INTEGRATION (MINIMAL CHANGES)

### ✅ 1.1 Добавить mutation в OrderPageClient.tsx

**Файл:** `apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx`

**Изменения (строки 1-55):**

```typescript
// БЫЛО (строка 4):
import { OrderStatus, OrderDevTools, type PublicOrderData } from '@repo/ui';

// ДОБАВИТЬ после импортов (строка 6):
import { useNotifications } from '@repo/hooks/src/client-hooks';
import { useTranslations } from 'next-intl';

// БЫЛО (строка 14):
export function OrderPageClient({ orderId }: OrderPageClientProps) {
  const utils = trpc.useUtils();

// ДОБАВИТЬ после utils (строка 16):
  const notifications = useNotifications();
  const t = useTranslations('OrderPage.OrderStatus');

  // 🆕 Mutation для отмены заказа
  const cancelOrderMutation = trpc.user.orders.cancelOrder.useMutation({
    onSuccess: (data) => {
      notifications.success(
        t('actions.orderCancelled'),
        t('actions.orderCancelledDescription')
      );
      // Инвалидируем кэш для обновления статуса заказа
      utils.exchange.getOrderStatus.invalidate({ orderId });
    },
    onError: (error) => {
      notifications.handleApiError(error, t('actions.orderCancelError'));
    },
  });

// ЗАМЕНИТЬ handleCancelOrder (строки 42-46):
  const handleCancelOrder = () => {
    // eslint-disable-next-line no-console -- Временный debug для визуального демо
    console.log('User cancelled order:', orderId);
    // eslint-disable-next-line no-warning-comments -- Заглушка для визуального демо
    // TODO: Implement tRPC mutation для отмены заказа
  };

// НА:
  const handleCancelOrder = () => {
    cancelOrderMutation.mutate({ orderId });
  };
```

**Обоснование изменений:**

1. ✅ **Следование паттернам:** Используется прямой `trpc.user.orders.cancelOrder.useMutation()` как в `useAuthMutations.ts`
2. ✅ **Минимальность:** Изменяется ТОЛЬКО `handleCancelOrder`, UI компонент не трогается
3. ✅ **Локализация:** Используется `useTranslations` для сообщений (соответствует Rule 7)
4. ✅ **Cache invalidation:** Автоматическое обновление UI через `invalidate()`

---

### ✅ 1.2 Добавить ключи локализации

**Файл 1:** `apps/web/messages/ru/order-page.json`

```json
{
  "OrderStatus": {
    "actions": {
      "markAsPaid": "Я оплатил",
      "cancelOrder": "Отменить заказ",
      "cancelConfirmTitle": "Подтверждение отмены",
      "cancelConfirmMessage": "Вы уверены, что хотите отменить эту заявку? Это действие нельзя отменить.",
      "confirmCancel": "Да, отменить",
      "cancelAction": "Нет, вернуться",
      "orderCancelled": "Заявка отменена",
      "orderCancelledDescription": "Ваша заявка успешно отменена",
      "orderCancelError": "Не удалось отменить заявку"
    }
  }
}
```

**Файл 2:** `apps/web/messages/en/order-page.json`

```json
{
  "OrderStatus": {
    "actions": {
      "markAsPaid": "I paid",
      "cancelOrder": "Cancel order",
      "cancelConfirmTitle": "Confirm cancellation",
      "cancelConfirmMessage": "Are you sure you want to cancel this order? This action cannot be undone.",
      "confirmCancel": "Yes, cancel",
      "cancelAction": "No, go back",
      "orderCancelled": "Order cancelled",
      "orderCancelledDescription": "Your order has been successfully cancelled",
      "orderCancelError": "Failed to cancel order"
    }
  }
}
```

---

## 🎯 PHASE 2: TELEGRAM NOTIFICATION INTEGRATION

### ✅ 2.1 Добавить константы для отмены заявки

**Файл:** `packages/constants/src/telegram.ts`

**Изменения (строки 23-119):**

```typescript
// ДОБАВИТЬ в ICONS (после строки 30):
export const TELEGRAM_OPERATOR_MESSAGES = {
  ICONS: {
    NEW_ORDER: '🆕',
    REUSED_WALLET: '🔄',
    FRESH_WALLET: '✅',
    WARNING: '⚠️',
    // 🆕 ДОБАВИТЬ:
    CANCELLED: '❌',
    USER_ACTION: '👤',
    // ... остальные иконки
  },

  // ДОБАВИТЬ в HEADERS (после строки 57):
  HEADERS: {
    NEW_ORDER: (orderId: string) => `💰 Новая заявка #${orderId}`,
    FRESH_WALLET_ASSIGNED: '✅ **Выделен свободный кошелек**',
    REUSED_WALLET_ASSIGNED: '⚠️ **Переиспользован занятый кошелек**',
    // 🆕 ДОБАВИТЬ:
    ORDER_CANCELLED: (orderId: string) => `❌ Заявка #${orderId} отменена пользователем`,
  },

  // ДОБАВИТЬ в TEMPLATES (после строки 109):
  TEMPLATES: {
    ORDER_INFO: (order, depositAddress) => [...],
    FRESH_WALLET_MESSAGE: (baseInfo, orderId) => [...],
    REUSED_WALLET_MESSAGE: (baseInfo, orderId) => [...],

    // 🆕 ДОБАВИТЬ:
    ORDER_CANCELLED_MESSAGE: (order: {
      id: string;
      email: string;
      cryptoAmount: string;
      currency: string;
      uahAmount: string;
    }) => [
      `❌ **Заявка отменена пользователем**`,
      ``,
      `📋 Заявка: #${order.id}`,
      `📧 Email: ${order.email}`,
      `💎 Сумма: ${order.cryptoAmount} ${order.currency}`,
      `💰 Эквивалент: ${order.uahAmount} UAH`,
      `👤 Инициатор: Пользователь`,
      ``,
      `ℹ️ Заявка была отменена до завершения обработки`,
    ].join('\n'),
  },
};
```

**Обоснование:**

- ✅ Используется **существующая структура** констант
- ✅ Добавляются **только необходимые** элементы (Rule 25)
- ✅ Соблюдается **формат сообщений** (markdown, иконки, структура)

---

### ✅ 2.2 Добавить helper функцию для уведомления

**Файл:** `apps/web/src/server/trpc/routers/user/orders.ts`

**ТЕКУЩЕЕ СОСТОЯНИЕ (строки 86-122):**

```typescript
cancelOrder: protectedProcedure
  .input(z.object({ orderId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const user = await validateUserAccess(ctx.user.id);
    const order = await validateOrderAccess(input.orderId, user.email);

    // Проверяем, можно ли отменить заявку
    if (!CANCELLABLE_ORDER_STATUSES.includes(
      order.status as (typeof CANCELLABLE_ORDER_STATUSES)[number]
    )) {
      throw createBadRequestError('Order cannot be cancelled in current status');
    }

    // Отменяем заявку
    const updatedOrder = await orderManager.update(order.id, {
      status: ORDER_STATUSES.CANCELLED,
    });

    if (!updatedOrder) {
      throw createInternalServerError('Order update failed');
    }

    console.log(`❌ Заявка ${order.id} отменена пользователем ${user.email}`);

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      message: USER_SUCCESS_MESSAGES.ORDER_CANCELLED,
    };
  }),
```

**НОВОЕ СОСТОЯНИЕ (с Telegram уведомлением):**

```typescript
// ДОБАВИТЬ helper функцию ПЕРЕД cancelOrder:
/**
 * 🆕 TASK: Отправка уведомления операторам об отмене заявки пользователем
 */
async function sendCancellationNotification(order: Order, userEmail: string) {
  const telegramBotUrl = process.env.TELEGRAM_BOT_URL;
  if (!telegramBotUrl) {
    console.warn('TELEGRAM_BOT_URL not configured, skipping cancellation notification');
    return;
  }

  try {
    await fetch(`${telegramBotUrl}/api/notify-operators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: {
          id: order.id,
          email: userEmail,
          cryptoAmount: order.cryptoAmount,
          currency: order.currency,
          uahAmount: order.uahAmount,
          status: 'cancelled',
        },
        // ⚠️ ВАЖНО: depositAddress ОБЯЗАТЕЛЕН в payload схеме
        depositAddress: order.depositAddress || 'N/A',
        // 🆕 НОВЫЙ флаг для определения типа уведомления
        notificationType: 'order_cancelled',
      }),
    });

    console.log(`✅ Telegram notification sent for cancelled order ${order.id}`);
  } catch (error) {
    console.error('Failed to send Telegram cancellation notification', {
      orderId: order.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // НЕ прерываем выполнение - отмена заявки успешна даже без уведомления
  }
}

// МОДИФИЦИРОВАТЬ cancelOrder:
cancelOrder: protectedProcedure
  .input(z.object({ orderId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const user = await validateUserAccess(ctx.user.id);
    const order = await validateOrderAccess(input.orderId, user.email);

    // Проверяем, можно ли отменить заявку
    if (!CANCELLABLE_ORDER_STATUSES.includes(
      order.status as (typeof CANCELLABLE_ORDER_STATUSES)[number]
    )) {
      throw createBadRequestError('Order cannot be cancelled in current status');
    }

    // Отменяем заявку
    const updatedOrder = await orderManager.update(order.id, {
      status: ORDER_STATUSES.CANCELLED,
    });

    if (!updatedOrder) {
      throw createInternalServerError('Order update failed');
    }

    console.log(`❌ Заявка ${order.id} отменена пользователем ${user.email}`);

    // 🆕 ДОБАВИТЬ: Отправка уведомления операторам
    await sendCancellationNotification(updatedOrder, user.email);

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      message: USER_SUCCESS_MESSAGES.ORDER_CANCELLED,
    };
  }),
```

**Обоснование:**

1. ✅ **Минимальная интеграция:** Добавляется **одна строка** в существующий endpoint
2. ✅ **Паттерн проекта:** Функция `sendCancellationNotification()` копирует структуру `sendTelegramNotification()` из `exchange.ts:140-183`
3. ✅ **Обработка ошибок:** Уведомление НЕ блокирует отмену заявки (Rule 19 - graceful degradation)
4. ✅ **Типизация:** Использует существующий тип `Order` из `@repo/exchange-core`

---

### ✅ 2.3 Модифицировать telegram-bot для обработки отмены

**Файл:** `apps/telegram-bot/pages/api/notify-operators.ts`

**ТЕКУЩАЯ ЛОГИКА (строки 107-132):**

```typescript
function createOperatorMessage(payload: NotificationPayload): string {
  const { order, depositAddress, walletType } = payload;

  const baseInfo = TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.ORDER_INFO(...);
  const orderHeader = TELEGRAM_OPERATOR_MESSAGES.HEADERS.NEW_ORDER(order.id);

  return walletType === 'fresh'
    ? TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.FRESH_WALLET_MESSAGE(...)
    : TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.REUSED_WALLET_MESSAGE(...);
}
```

**МОДИФИКАЦИЯ:**

```typescript
// ИЗМЕНИТЬ интерфейс NotificationPayload (строка 8):
interface NotificationPayload {
  order: {
    id: string;
    email: string;
    cryptoAmount: string;
    currency: string;
    uahAmount: string;
    status?: string; // 🆕 ДОБАВИТЬ optional status
    createdAt?: string;
  };
  depositAddress: string;
  walletType: 'fresh' | 'reused';
  notificationType?: 'new_order' | 'order_cancelled'; // 🆕 ДОБАВИТЬ optional тип
}

// МОДИФИЦИРОВАТЬ createOperatorMessage (строки 107-132):
function createOperatorMessage(payload: NotificationPayload): string {
  const { order, depositAddress, walletType, notificationType } = payload;

  // 🆕 ДОБАВИТЬ обработку отмены:
  if (notificationType === 'order_cancelled') {
    return TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.ORDER_CANCELLED_MESSAGE(order);
  }

  // СУЩЕСТВУЮЩАЯ логика для новых заявок:
  const baseInfo = TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.ORDER_INFO(
    {
      id: order.id,
      email: order.email,
      cryptoAmount: order.cryptoAmount,
      currency: order.currency,
      uahAmount: order.uahAmount,
    },
    depositAddress
  );

  const orderHeader = TELEGRAM_OPERATOR_MESSAGES.HEADERS.NEW_ORDER(order.id);

  return walletType === 'fresh'
    ? TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.FRESH_WALLET_MESSAGE(
        `${orderHeader}\n\n${baseInfo}`,
        order.id
      )
    : TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.REUSED_WALLET_MESSAGE(
        `${orderHeader}\n\n${baseInfo}`,
        order.id
      );
}
```

**Обоснование:**

1. ✅ **Обратная совместимость:** Существующие вызовы продолжают работать (notificationType по умолчанию undefined)
2. ✅ **Минимальные изменения:** Добавляется **один условный блок** в начале функции
3. ✅ **Типобезопасность:** TypeScript интерфейс расширен с optional полями

---

## 🎯 PHASE 3: TESTING & VALIDATION

### ✅ 3.1 Unit Tests

**Файл:** `packages/ui/src/__tests__/OrderActions.test.tsx` (новый)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderActions } from '../components/order/helpers/OrderActions';

describe('OrderActions - Cancel Flow', () => {
  const mockOnCancelOrder = jest.fn();
  const labels = {
    markAsPaid: 'I paid',
    cancelOrder: 'Cancel order',
    cancelConfirmTitle: 'Confirm cancellation',
    cancelConfirmMessage: 'Are you sure?',
    confirmCancel: 'Yes, cancel',
    cancelAction: 'No, go back',
  };

  beforeEach(() => {
    mockOnCancelOrder.mockClear();
  });

  it('should open confirmation dialog on cancel button click', () => {
    render(
      <OrderActions
        onMarkAsPaid={jest.fn()}
        onCancelOrder={mockOnCancelOrder}
        labels={labels}
      />
    );

    const cancelButton = screen.getByText('Cancel order');
    fireEvent.click(cancelButton);

    expect(screen.getByText('Confirm cancellation')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('should call onCancelOrder when confirmed', async () => {
    render(
      <OrderActions
        onMarkAsPaid={jest.fn()}
        onCancelOrder={mockOnCancelOrder}
        labels={labels}
      />
    );

    fireEvent.click(screen.getByText('Cancel order'));
    fireEvent.click(screen.getByText('Yes, cancel'));

    await waitFor(() => {
      expect(mockOnCancelOrder).toHaveBeenCalledTimes(1);
    });
  });

  it('should close dialog without calling onCancelOrder when cancelled', async () => {
    render(
      <OrderActions
        onMarkAsPaid={jest.fn()}
        onCancelOrder={mockOnCancelOrder}
        labels={labels}
      />
    );

    fireEvent.click(screen.getByText('Cancel order'));
    fireEvent.click(screen.getByText('No, go back'));

    await waitFor(() => {
      expect(mockOnCancelOrder).not.toHaveBeenCalled();
    });
  });
});
```

---

### ✅ 3.2 Integration Tests

**Файл:** `tests/e2e/order-cancellation.spec.ts` (новый)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Order Cancellation Flow', () => {
  test('should cancel order with confirmation', async ({ page }) => {
    // Navigate to order page
    await page.goto('/ru/order/test-order-id');

    // Wait for order to load
    await expect(page.locator('[data-testid="order-status"]')).toBeVisible();

    // Click cancel button
    await page.click('text=Отменить заказ');

    // Confirm dialog appears
    await expect(page.locator('text=Подтверждение отмены')).toBeVisible();

    // Click confirm
    await page.click('text=Да, отменить');

    // Wait for success notification
    await expect(page.locator('text=Заявка отменена')).toBeVisible();

    // Verify status updated
    await expect(page.locator('[data-testid="order-status"]')).toContainText('cancelled');
  });

  test('should not cancel order if user clicks back', async ({ page }) => {
    await page.goto('/ru/order/test-order-id');

    await page.click('text=Отменить заказ');
    await page.click('text=Нет, вернуться');

    // Dialog should close
    await expect(page.locator('text=Подтверждение отмены')).not.toBeVisible();

    // Status should remain unchanged
    await expect(page.locator('[data-testid="order-status"]')).toContainText('pending');
  });
});
```

---

### ✅ 3.3 Manual Testing Checklist

```markdown
## 📋 Чек-лист ручного тестирования

### Frontend:

- [ ] Кнопка "Отменить заказ" отображается для статусов pending/processing
- [ ] Кнопка НЕ отображается для completed/cancelled/failed
- [ ] Клик по кнопке открывает диалог подтверждения
- [ ] Диалог содержит правильные тексты (ru/en локализация)
- [ ] Клик "Да, отменить" вызывает mutation
- [ ] Клик "Нет, вернуться" закрывает диалог без mutation
- [ ] После успешной отмены показывается success уведомление
- [ ] Статус заказа обновляется на "cancelled" автоматически
- [ ] При ошибке показывается error уведомление

### Backend:

- [ ] Endpoint принимает только { orderId: string }
- [ ] Валидация: можно отменить только pending/processing
- [ ] Валидация: пользователь может отменить только свою заявку
- [ ] Database обновляется корректно (status = 'cancelled')
- [ ] Возвращается правильный response { id, status, message }
- [ ] Error handling работает корректно

### Telegram:

- [ ] Уведомление приходит ВСЕМ авторизованным операторам
- [ ] Сообщение содержит правильную информацию (id, email, сумма)
- [ ] Иконка "❌" отображается корректно
- [ ] Сообщение отличается от уведомления о новой заявке
- [ ] При ошибке Telegram отмена заявки НЕ блокируется
```

---

## 📊 SUMMARY: ИЗМЕНЕНИЯ ПО ФАЙЛАМ

### Файлы для изменения:

```
1. apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx
   └─ Добавить: cancelOrderMutation + handleCancelOrder реализация
   └─ Импорты: useNotifications, useTranslations
   └─ Строки изменений: ~15 строк

2. apps/web/messages/ru/order-page.json
   └─ Добавить: actions.orderCancelled, orderCancelledDescription, orderCancelError
   └─ Строки изменений: ~3 ключа

3. apps/web/messages/en/order-page.json
   └─ Добавить: actions.orderCancelled, orderCancelledDescription, orderCancelError
   └─ Строки изменений: ~3 ключа

4. packages/constants/src/telegram.ts
   └─ Добавить: ICONS.CANCELLED, ICONS.USER_ACTION
   └─ Добавить: HEADERS.ORDER_CANCELLED
   └─ Добавить: TEMPLATES.ORDER_CANCELLED_MESSAGE
   └─ Строки изменений: ~20 строк

5. apps/web/src/server/trpc/routers/user/orders.ts
   └─ Добавить: sendCancellationNotification() helper
   └─ Модифицировать: cancelOrder endpoint (+1 строка)
   └─ Строки изменений: ~30 строк

6. apps/telegram-bot/pages/api/notify-operators.ts
   └─ Модифицировать: NotificationPayload interface
   └─ Модифицировать: createOperatorMessage() function
   └─ Строки изменений: ~10 строк

7. packages/ui/src/__tests__/OrderActions.test.tsx (новый)
   └─ Создать: Unit тесты для OrderActions
   └─ Строки изменений: ~60 строк

8. tests/e2e/order-cancellation.spec.ts (новый)
   └─ Создать: E2E тесты для cancellation flow
   └─ Строки изменений: ~40 строк
```

**ИТОГО:** 8 файлов, ~181 строка кода

---

## ⚖️ COMPLIANCE С AI AGENT RULES

### ✅ Rule 2 (Структурированный подход):

- Четкая структура Phase 0 → 1 → 2 → 3
- Каждая фаза с конкретными задачами
- Детальное обоснование каждого изменения

### ✅ Rule 5 (Изучение существующих решений):

- Проанализированы паттерны: useAuthMutations, usePasswordMutations
- Изучена существующая логика Telegram уведомлений
- Найден и переиспользован существующий endpoint

### ✅ Rule 7 (Локализация):

- Все UI тексты через useTranslations
- Добавлены ключи в ru/en файлы
- Использован существующий namespace OrderPage.OrderStatus

### ✅ Rule 8 (Нет предположений):

- Проверена ВСЯ кодовая база (4-step verification)
- Найдены существующие endpoints и паттерны
- Верифицировано наличие всех необходимых компонентов

### ✅ Rule 9 (Объяснение решений):

- Каждое изменение содержит секцию "Обоснование"
- Указаны причины выбора паттернов
- Объяснена архитектура решения

### ✅ Rule 24 (Знание структуры):

- Прочитан PROJECT_STRUCTURE_MAP.md
- Проанализированы все релевантные пакеты
- Соблюдены package boundaries

### ✅ Rule 25 (Минимальность):

- НЕТ новых API endpoints (используется существующий)
- НЕТ изменений в UI компонентах
- Добавлено ТОЛЬКО необходимое для задачи

### ✅ Rule 19 (Устойчивость):

- Ошибка Telegram НЕ блокирует отмену заявки
- Graceful degradation для всех API вызовов
- Error handling на каждом уровне

---

## 🚀 DEPLOYMENT CHECKLIST

### Environment Variables:

```bash
# .env.local (apps/web и apps/telegram-bot)
TELEGRAM_BOT_URL=http://localhost:3003  # Development
TELEGRAM_BOT_TOKEN=your_bot_token
AUTHORIZED_TELEGRAM_OPERATORS=123456789,987654321
```

### Database:

- ✅ NO MIGRATIONS REQUIRED (используется существующая колонка `status`)

### Testing:

```bash
# Unit tests
npm run test -- OrderActions.test.tsx

# E2E tests
npm run test:e2e -- order-cancellation.spec.ts

# Full test suite
npm run test
```

### Deployment Steps:

1. Merge to staging branch
2. Run tests: `npm run test && npm run test:e2e`
3. Build: `npm run build`
4. Deploy to staging
5. Manual QA по чек-листу
6. Production deployment

---

## 📝 NOTES

### Архитектурные решения:

1. **Почему НЕ создан новый endpoint?**
   - Существующий `user.orders.cancelOrder` УЖЕ делает СТРОГО отмену
   - Соответствует требованию "отдельный endpoint без возможности других операций"
   - Следует Rule 25 (минимальность изменений)

2. **Почему Telegram уведомление через fetch, а не tRPC?**
   - Telegram-bot - отдельное приложение (apps/telegram-bot)
   - HTTP API endpoint уже существует и используется в exchange.ts
   - Следует существующему паттерну проекта

3. **Почему mutation напрямую, без useMutation обертки?**
   - Проект использует прямые `trpc.*.useMutation()` вызовы
   - Паттерн подтвержден в useAuthMutations, usePasswordMutations
   - Нет необходимости создавать новую абстракцию

4. **Почему не используется Redis для уведомлений?**
   - Telegram уведомление - не критичная операция
   - HTTP вызов достаточен для данного use case
   - Следует принципу KISS (Rule 14)

---

## 🎯 NEXT STEPS

После успешной реализации базового функционала рекомендуется:

1. **Добавить аналитику:**
   - Отслеживание причин отмены заказов
   - Метрики: % отмененных заказов по статусам

2. **Расширить уведомления:**
   - Push уведомления в браузере (Web Push API)
   - Email уведомление пользователю об отмене

3. **Добавить причину отмены:**
   - Опциональное текстовое поле в диалоге
   - Сохранение в базу для анализа

4. **Оптимизация:**
   - Batch notifications для нескольких отмен
   - Rate limiting для предотвращения spam

---

**Документ готов к реализации. Все решения основаны на реальной кодовой базе и следуют архитектуре проекта.**
