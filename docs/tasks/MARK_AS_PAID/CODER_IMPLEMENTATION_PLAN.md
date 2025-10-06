# 🔧 План реализации кнопки "Оплатил" - Agent-coder

**Дата создания:** 06 октября 2025  
**Роль:** Agent-coder (с фокусом на рефакторинг и паттерны)  
**Базовый анализ:** [impact-analysis-mark-as-paid-button.md](./impact-analysis-mark-as-paid-button.md)  
**Архитектурное решение:** [architectural-solution-mark-as-paid-button.md](./architectural-solution-mark-as-paid-button.md)  
**Статус:** ✅ ГОТОВ К РЕАЛИЗАЦИИ

---

## 📋 EXECUTIVE SUMMARY

### Цель плана реализации

Предоставить **пошаговую инструкцию для внедрения функционала "Оплатил"** через:

- ✅ **Минимальные изменения** существующей кодовой базы
- ✅ **Максимальное переиспользование** референсных паттернов (`cancelOrder`)
- ✅ **Следование code style** установленному в проекте
- ✅ **Избегание copy-paste** через рефакторинг общей логики
- ✅ **100% интеграция** в существующую архитектуру

### Референсный паттерн

**`user.orders.cancelOrder`** - эталон безопасности и архитектурной правильности:

- **Файл:** `apps/web/src/server/trpc/routers/user/orders.ts` (строки 136-167)
- **Подход:** Копирование структуры с адаптацией под новый статус
- **Гарантия:** 100% консистентность с существующим кодом

### Архитектурная философия

```
НЕ ИЗОБРЕТАТЬ → ПЕРЕИСПОЛЬЗОВАТЬ → АДАПТИРОВАТЬ → ИНТЕГРИРОВАТЬ
```

---

## 🎯 SCOPE ЗАДАЧИ

### Что будет изменено

| Файл/Пакет                                                  | Действие                                           | Тип изменения     | Сложность  |
| ----------------------------------------------------------- | -------------------------------------------------- | ----------------- | ---------- |
| `packages/constants/src/user.ts`                            | Добавить константу `MARKABLE_AS_PAID_STATUSES`     | Новая константа   | 🟢 Простое |
| `packages/constants/src/user.ts`                            | Добавить `USER_SUCCESS_MESSAGES.ORDER_MARKED_PAID` | Новая константа   | 🟢 Простое |
| `packages/constants/src/telegram.ts`                        | Добавить иконки для "paid" статуса                 | Новые константы   | 🟢 Простое |
| `packages/constants/src/telegram.ts`                        | Добавить `HEADERS.ORDER_PAID`                      | Новая константа   | 🟢 Простое |
| `packages/constants/src/telegram.ts`                        | Добавить `TEMPLATES.ORDER_PAID_MESSAGE`            | Новая функция     | 🟡 Среднее |
| `apps/web/src/server/trpc/routers/user/orders.ts`           | Добавить `sendPaidNotification`                    | Новая функция     | 🟡 Среднее |
| `apps/web/src/server/trpc/routers/user/orders.ts`           | Добавить `markAsPaid` mutation                     | Новый endpoint    | 🟡 Среднее |
| `apps/telegram-bot/pages/api/notify-operators.ts`           | Расширить `NotificationPayload` type               | Изменение типа    | 🟢 Простое |
| `apps/telegram-bot/pages/api/notify-operators.ts`           | Добавить обработку `order_paid`                    | Новая ветка if    | 🟢 Простое |
| `apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx` | Добавить `markAsPaidMutation`                      | Новый mutation    | 🟡 Среднее |
| `apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx` | Заменить `handleMarkAsPaid` заглушку               | Изменение функции | 🟢 Простое |
| `apps/web/messages/ru/order-page.json`                      | Добавить локализацию для "paid" статуса            | Новые переводы    | 🟢 Простое |
| `apps/web/messages/en/order-page.json`                      | Добавить локализацию для "paid" статуса            | Новые переводы    | 🟢 Простое |

### Что НЕ будет изменено

❌ **Запрещено согласно Rule 25 (ФОКУС НА ЦЕЛИ):**

- UI компонент `OrderActions` (кнопка уже существует и работает)
- Существующая логика `cancelOrder` (не рефакторим референс)
- Валидационные функции `validateUserAccess`, `validateOrderAccess` (переиспользуем как есть)
- Логика `orderManager.update` (универсальная, не требует изменений)
- Структура `TELEGRAM_OPERATOR_MESSAGES` (только добавление новых констант)
- Любые другие компоненты вне scope задачи

---

## 📐 ФАЗА 1: КОНСТАНТЫ И КОНФИГУРАЦИЯ

### 1.1 User-level константы (Backend)

**Файл:** `packages/constants/src/user.ts`

**Место вставки:** После строки 66 (`export const CANCELLABLE_ORDER_STATUSES = ['pending', 'processing'] as const;`)

**Изменение 1.1.1:** Добавить константу для валидации статусов

```typescript
// Статусы, в которых можно отметить заказ как оплаченный
export const MARKABLE_AS_PAID_STATUSES = ['pending'] as const;
```

**Обоснование:**

- Паттерн: Точная копия `CANCELLABLE_ORDER_STATUSES`
- Логика: Только `pending` заказы могут быть отмечены как оплаченные
- Расположение: Рядом с `CANCELLABLE_ORDER_STATUSES` для консистентности

**Место вставки:** После строки 58 (`ORDER_CANCELLED: 'Заявка успешно отменена',`)

**Изменение 1.1.2:** Добавить success message

```typescript
export const USER_SUCCESS_MESSAGES = {
  PASSWORD_CHANGED: 'Пароль успешно изменен',
  PROFILE_UPDATED: 'Настройки профиля обновлены',
  ORDER_CANCELLED: 'Заявка успешно отменена',
  ORDER_MARKED_PAID: 'Платеж успешно отмечен', // 🆕 ДОБАВЛЯЕМ
  VERIFICATION_SENT: 'Код подтверждения отправлен на ваш email',
  ACCOUNT_DELETED: 'Аккаунт успешно удален',
} as const;
```

**Обоснование:**

- Паттерн: Консистентный с существующими success messages
- Место: Логическая близость с `ORDER_CANCELLED`
- Текст: Краткий, понятный пользователю

---

### 1.2 Telegram-level константы (Notifications)

**Файл:** `packages/constants/src/telegram.ts`

**Место вставки 1:** После строки 44 (`USER_ACTION: '👤',`)

**Изменение 1.2.1:** Добавить иконки для "paid" статуса

```typescript
export const TELEGRAM_OPERATOR_MESSAGES = {
  ICONS: {
    NEW_ORDER: '🆕',
    REUSED_WALLET: '🔄',
    FRESH_WALLET: '✅',
    WARNING: '⚠️',
    MONEY: '💰',
    EMAIL: '📧',
    DIAMOND: '💎',
    LOCATION: '📍',
    STATUS: '🔄',
    PRIORITY_NORMAL: '⚡',
    PRIORITY_HIGH: '🔴',
    SEARCH: '🔍',
    CHART: '📊',
    SUCCESS: '✅',
    TAKE_ORDER: '✅',
    DETAILS: '📋',
    RATE_BINANCE: '🟡',
    RATE_COINGECKO: '🦎',
    RATE_FALLBACK: '⚠️',
    RATE_MOCK: '🔧',
    CANCELLED: '❌',
    USER_ACTION: '👤',
    // 🆕 НОВЫЕ ИКОНКИ для статуса "оплачено"
    PAID: '💳',
    PAYMENT_CONFIRMED: '✅',
  },
  // ...остальной код без изменений
```

**Обоснование:**

- `PAID: '💳'` - иконка кредитной карты для указания оплаты
- `PAYMENT_CONFIRMED: '✅'` - галочка для подтверждения
- Консистентность: Следуем паттерну `CANCELLED: '❌'`

**Место вставки 2:** После строки 56 (`ORDER_CANCELLED: (orderId: string) => ...`)

**Изменение 1.2.2:** Добавить заголовок для уведомления

```typescript
  HEADERS: {
    NEW_ORDER: (orderId: string) => `💰 Новая заявка #${orderId}`,
    FRESH_WALLET_ASSIGNED: '✅ **Выделен свободный кошелек**',
    REUSED_WALLET_ASSIGNED: '⚠️ **Переиспользован занятый кошелек**',
    ORDER_CANCELLED: (orderId: string) => `❌ Заявка #${orderId} отменена пользователем`,
    // 🆕 НОВЫЙ ЗАГОЛОВОК для оплаты
    ORDER_PAID: (orderId: string) => `💳 Заявка #${orderId} оплачена пользователем`,
  },
```

**Обоснование:**

- Паттерн: Точная копия `ORDER_CANCELLED` с заменой иконки и текста
- Иконка: `💳` (кредитная карта) вместо `❌`
- Текст: "оплачена" вместо "отменена"

**Место вставки 3:** После строки 137 (закрывающая скобка `ORDER_CANCELLED_MESSAGE`)

**Изменение 1.2.3:** Добавить шаблон сообщения

```typescript
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

    // 🆕 НОВЫЙ ШАБЛОН для уведомления об оплате
    ORDER_PAID_MESSAGE: (order: {
      id: string;
      email: string;
      cryptoAmount: string;
      currency: string;
      uahAmount: string;
    }) => [
      `💳 **Заявка оплачена пользователем**`,
      ``,
      `📋 Заявка: #${order.id}`,
      `📧 Email: ${order.email}`,
      `💎 Сумма: ${order.cryptoAmount} ${order.currency}`,
      `💰 Эквивалент: ${order.uahAmount} UAH`,
      `✅ Статус: PENDING → PAID`,
      `👤 Инициатор: Пользователь`,
      ``,
      `⚡ Действие: Проверьте поступление средств и начните обработку`,
    ].join('\n'),
  },
} as const;
```

**Обоснование:**

- Паттерн: 100% копия структуры `ORDER_CANCELLED_MESSAGE`
- Изменения:
  - Иконка заголовка: `💳` вместо `❌`
  - Текст заголовка: "оплачена" вместо "отменена"
  - Добавлена строка `✅ Статус: PENDING → PAID` для ясности
  - Изменен call-to-action: "Проверьте поступление средств и начните обработку"
- Сохранены: Структура, форматирование, порядок полей

---

## 📐 ФАЗА 2: BACKEND API (tRPC)

### 2.1 Notification Helper Function

**Файл:** `apps/web/src/server/trpc/routers/user/orders.ts`

**Место вставки:** После строки 71 (закрывающая скобка `sendCancellationNotification`)

**Изменение 2.1.1:** Добавить функцию отправки уведомления об оплате

```typescript
/**
 * 🆕 TASK: Отправка уведомления операторам об оплате заявки пользователем
 * Паттерн скопирован из sendCancellationNotification выше
 */
async function sendPaidNotification(order: Order, userEmail: string) {
  const telegramBotUrl = process.env.TELEGRAM_BOT_URL;
  if (!telegramBotUrl) {
    console.warn('TELEGRAM_BOT_URL not configured, skipping paid notification');
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
          status: 'paid', // 🔄 ИЗМЕНЕНО: 'paid' вместо 'cancelled'
        },
        // ⚠️ ВАЖНО: depositAddress ОБЯЗАТЕЛЕН в payload схеме
        depositAddress: order.depositAddress || 'N/A',
        walletType: 'fresh', // Неважно для оплаты, но обязательно по схеме
        // 🆕 НОВЫЙ флаг для определения типа уведомления
        notificationType: 'order_paid', // 🔄 ИЗМЕНЕНО: 'order_paid' вместо 'order_cancelled'
      }),
    });

    console.log(`✅ Telegram notification sent for paid order ${order.id}`);
  } catch (error) {
    console.error('Failed to send Telegram paid notification', {
      orderId: order.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // НЕ прерываем выполнение - оплата заявки успешна даже без уведомления
  }
}
```

**Обоснование:**

- Паттерн: 100% копия `sendCancellationNotification` (строки 36-71)
- Изменения (всего 3):
  1. Имя функции: `sendPaidNotification` вместо `sendCancellationNotification`
  2. `status: 'paid'` вместо `status: 'cancelled'`
  3. `notificationType: 'order_paid'` вместо `'order_cancelled'`
- Сохранены: Структура, error handling, логирование, комментарии
- Важно: `depositAddress` и `walletType` обязательны по существующей схеме

---

### 2.2 API Endpoint (tRPC Mutation)

**Файл:** `apps/web/src/server/trpc/routers/user/orders.ts`

**Место вставки:** После строки 167 (закрывающая скобка `cancelOrder` mutation)

**Изменение 2.2.1:** Добавить imports для новых констант

**Место:** В начале файла, строка 1, изменить существующий import

```typescript
// БЫЛО:
import { USER_SUCCESS_MESSAGES, CANCELLABLE_ORDER_STATUSES, ORDER_STATUSES } from '@repo/constants';

// СТАНЕТ:
import {
  USER_SUCCESS_MESSAGES,
  CANCELLABLE_ORDER_STATUSES,
  MARKABLE_AS_PAID_STATUSES, // 🆕 ДОБАВЛЯЕМ
  ORDER_STATUSES,
} from '@repo/constants';
```

**Изменение 2.2.2:** Добавить mutation `markAsPaid`

**Место вставки:** После строки 167 (после закрывающей скобки `cancelOrder` mutation)

```typescript
  // Отменить заявку (если возможно)
  cancelOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // ...существующий код cancelOrder...
    }),

  // 🆕 НОВЫЙ ENDPOINT: Отметить заявку как оплаченную
  markAsPaid: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Валидация доступа пользователя (Level 2 Security)
      const user = await validateUserAccess(ctx.user.id);

      // Валидация владения заказом (Level 3 Security)
      const order = await validateOrderAccess(input.orderId, user.email);

      // 🆕 ИДЕМПОТЕНТНОСТЬ: Если заказ уже оплачен - возвращаем success без изменений
      if (order.status === ORDER_STATUSES.PAID) {
        console.log(`ℹ️ Заявка ${order.id} уже имеет статус PAID, возвращаем idempotent success`);
        return {
          id: order.id,
          status: order.status,
          message: USER_SUCCESS_MESSAGES.ORDER_MARKED_PAID,
        };
      }

      // Проверяем, можно ли отметить заявку как оплаченную
      if (
        !MARKABLE_AS_PAID_STATUSES.includes(
          order.status as (typeof MARKABLE_AS_PAID_STATUSES)[number]
        )
      ) {
        throw createBadRequestError(
          `Order cannot be marked as paid in current status: ${order.status}`
        );
      }

      // Изменяем статус на PAID
      const updatedOrder = await orderManager.update(order.id, {
        status: ORDER_STATUSES.PAID,
      });

      if (!updatedOrder) {
        throw createInternalServerError('Order update failed');
      }

      console.log(`💳 Заявка ${order.id} отмечена как оплаченная пользователем ${user.email}`);

      // 🆕 TASK: Отправка уведомления операторам об оплате
      await sendPaidNotification(updatedOrder, user.email);

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        message: USER_SUCCESS_MESSAGES.ORDER_MARKED_PAID,
      };
    }),
});
```

**Обоснование:**

- Паттерн: Точная копия структуры `cancelOrder` (строки 136-167)
- Отличия:
  1. Имя: `markAsPaid` вместо `cancelOrder`
  2. Константа валидации: `MARKABLE_AS_PAID_STATUSES` вместо `CANCELLABLE_ORDER_STATUSES`
  3. Целевой статус: `ORDER_STATUSES.PAID` вместо `ORDER_STATUSES.CANCELLED`
  4. Success message: `ORDER_MARKED_PAID` вместо `ORDER_CANCELLED`
  5. Notification: `sendPaidNotification` вместо `sendCancellationNotification`
  6. **НОВОЕ:** Блок идемпотентности для `status === 'paid'`
- Сохранены: Трехуровневая валидация, структура error handling, логирование

**Ключевая особенность - Идемпотентность:**

```typescript
// Если уже paid - возвращаем success без изменений БД
if (order.status === ORDER_STATUSES.PAID) {
  return { id: order.id, status: order.status, message: USER_SUCCESS_MESSAGES.ORDER_MARKED_PAID };
}
```

- Гарантирует безопасность при двойном клике
- Нет ошибки если пользователь жмет повторно
- Консистентный UX: success даже при повторном вызове

---

## 📐 ФАЗА 3: TELEGRAM BOT INTEGRATION

### 3.1 Payload Type Extension

**Файл:** `apps/telegram-bot/pages/api/notify-operators.ts`

**Место вставки:** Строка 19, изменение существующего type

**Изменение 3.1.1:** Расширить `NotificationPayload` interface

```typescript
// БЫЛО:
interface NotificationPayload {
  order: {
    id: string;
    email: string;
    cryptoAmount: string;
    currency: string;
    uahAmount: string;
    status?: string;
    createdAt?: string;
  };
  depositAddress: string;
  walletType: 'fresh' | 'reused';
  notificationType?: 'new_order' | 'order_cancelled'; // 🔄 ИЗМЕНИМ
}

// СТАНЕТ:
interface NotificationPayload {
  order: {
    id: string;
    email: string;
    cryptoAmount: string;
    currency: string;
    uahAmount: string;
    status?: string;
    createdAt?: string;
  };
  depositAddress: string;
  walletType: 'fresh' | 'reused';
  notificationType?: 'new_order' | 'order_cancelled' | 'order_paid'; // 🆕 ДОБАВИЛИ 'order_paid'
}
```

**Обоснование:**

- Минимальное изменение: Добавление одного union type
- Обратная совместимость: Существующий код продолжит работать
- TypeScript safety: Компилятор проверит все места использования

---

### 3.2 Message Handler Extension

**Файл:** `apps/telegram-bot/pages/api/notify-operators.ts`

**Место вставки:** После строки 120, внутри функции `createOperatorMessage`

**Изменение 3.2.1:** Добавить обработку нового типа уведомления

```typescript
/**
 * Создание сообщения для операторов
 */
function createOperatorMessage(payload: NotificationPayload): string {
  const { order, depositAddress, walletType, notificationType } = payload;

  // 🆕 TASK: Обработка уведомления об отмене заявки
  if (notificationType === 'order_cancelled') {
    return TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.ORDER_CANCELLED_MESSAGE(order);
  }

  // 🆕 НОВОЕ: Обработка уведомления об оплате заявки
  if (notificationType === 'order_paid') {
    return TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.ORDER_PAID_MESSAGE(order);
  }

  // Существующая логика для новых заявок
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

- Паттерн: Консистентен с существующей обработкой `order_cancelled` (строка 117-119)
- Место вставки: Сразу после обработки `order_cancelled` для логической группировки
- Early return: Следует паттерну существующих проверок
- Fallback: Если `notificationType` не указан, работает существующая логика

---

## 📐 ФАЗА 4: FRONTEND INTEGRATION

### 4.1 tRPC Mutation Hook

**Файл:** `apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx`

**Место вставки:** После строки 33 (после определения `cancelOrderMutation`)

**Изменение 4.1.1:** Добавить mutation для "Mark as Paid"

```typescript
// 🆕 Mutation для отмены заказа
const cancelOrderMutation = trpc.user.orders.cancelOrder.useMutation({
  onSuccess: () => {
    notifications.success(t('actions.orderCancelled'), t('actions.orderCancelledDescription'));
    // Инвалидируем кэш для обновления статуса заказа
    utils.exchange.getOrderStatus.invalidate({ orderId });
  },
  onError: (error: unknown) => {
    notifications.handleApiError(error, t('actions.orderCancelError'));
  },
});

// 🆕 НОВЫЙ: Mutation для отметки заказа как оплаченного
const markAsPaidMutation = trpc.user.orders.markAsPaid.useMutation({
  onSuccess: () => {
    notifications.success(t('actions.orderMarkedPaid'), t('actions.orderMarkedPaidDescription'));
    // Инвалидируем кэш для обновления статуса заказа
    utils.exchange.getOrderStatus.invalidate({ orderId });
  },
  onError: (error: unknown) => {
    notifications.handleApiError(error, t('actions.orderMarkPaidError'));
  },
});
```

**Обоснование:**

- Паттерн: 100% копия структуры `cancelOrderMutation`
- Изменения (всего 3):
  1. Имя mutation: `markAsPaid` вместо `cancelOrder`
  2. Success translations keys: `orderMarkedPaid` и `orderMarkedPaidDescription`
  3. Error translation key: `orderMarkPaidError`
- Сохранены: Логика invalidation cache, структура notifications, error handling

---

### 4.2 Event Handler Implementation

**Файл:** `apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx`

**Место вставки:** Строка 54-59, замена существующей заглушки

**Изменение 4.2.1:** Заменить TODO заглушку на реальную реализацию

```typescript
// БЫЛО (заглушка):
const handleMarkAsPaid = () => {
  // eslint-disable-next-line no-console -- Временный debug для визуального демо
  console.log('User marked order as paid:', orderId);
  // eslint-disable-next-line no-warning-comments -- Заглушка для визуального демо
  // TODO: Implement tRPC mutation для обновления статуса
};

// СТАНЕТ (реальная реализация):
const handleMarkAsPaid = () => {
  markAsPaidMutation.mutate({ orderId });
};
```

**Обоснование:**

- Паттерн: Точная копия `handleCancelOrder` (строка 61-63)
- Консистентность: Единый подход для всех действий пользователя
- Простота: Делегирование логики в mutation hook

---

## 📐 ФАЗА 5: ЛОКАЛИЗАЦИЯ (i18n)

### 5.1 Русская локализация

**Файл:** `apps/web/messages/ru/order-page.json`

**Место вставки:** После строки 58, внутри объекта `actions`

**Изменение 5.1.1:** Добавить переводы для действия "оплачено"

```json
{
  "OrderStatus": {
    "actions": {
      "markAsPaid": "Оплатил",
      "cancelOrder": "Отменить заявку",
      "cancelConfirmTitle": "Отменить заявку?",
      "cancelConfirmMessage": "Вы уверены, что хотите отменить эту заявку? Это действие нельзя отменить.",
      "confirmCancel": "Да, отменить",
      "cancelAction": "Нет, оставить заявку",
      "orderCancelled": "Заявка отменена",
      "orderCancelledDescription": "Ваша заявка успешно отменена",
      "orderCancelError": "Не удалось отменить заявку",
      // 🆕 НОВЫЕ ПЕРЕВОДЫ для статуса "оплачено"
      "orderMarkedPaid": "Платеж отмечен",
      "orderMarkedPaidDescription": "Мы уведомили операторов о вашем платеже. Обработка начнется в ближайшее время.",
      "orderMarkPaidError": "Не удалось отметить платеж"
    }
  }
}
```

**Обоснование:**

- `orderMarkedPaid` - Краткое подтверждение действия (аналог `orderCancelled`)
- `orderMarkedPaidDescription` - Информирование о следующем шаге (что произошло после действия)
- `orderMarkPaidError` - Сообщение об ошибке (аналог `orderCancelError`)
- Тональность: Позитивная, информативная, успокаивающая пользователя

---

### 5.2 Английская локализация

**Файл:** `apps/web/messages/en/order-page.json`

**Место вставки:** После строки 58, внутри объекта `actions`

**Изменение 5.2.1:** Добавить переводы для действия "paid"

```json
{
  "OrderStatus": {
    "actions": {
      "markAsPaid": "I Paid",
      "cancelOrder": "Cancel Order",
      "cancelConfirmTitle": "Cancel order?",
      "cancelConfirmMessage": "Are you sure you want to cancel this order? This action cannot be undone.",
      "confirmCancel": "Yes, Cancel",
      "cancelAction": "No, Keep Order",
      "orderCancelled": "Order cancelled",
      "orderCancelledDescription": "Your order has been successfully cancelled",
      "orderCancelError": "Failed to cancel order",
      // 🆕 NEW TRANSLATIONS for "paid" status
      "orderMarkedPaid": "Payment marked",
      "orderMarkedPaidDescription": "We have notified the operators about your payment. Processing will start shortly.",
      "orderMarkPaidError": "Failed to mark payment"
    }
  }
}
```

**Обоснование:**

- `orderMarkedPaid` - Short confirmation (analogue of `orderCancelled`)
- `orderMarkedPaidDescription` - Informing about next step (what happened after action)
- `orderMarkPaidError` - Error message (analogue of `orderCancelError`)
- Tone: Positive, informative, reassuring

---

## ✅ ЧЕКЛИСТ ФИНАЛЬНОЙ ПРОВЕРКИ

### Pre-commit Checklist

- [ ] **TypeScript компиляция:** `npm run build` проходит без ошибок
- [ ] **ESLint:** `npm run lint` не выдает warnings
- [ ] **Prettier:** Код отформатирован согласно проекту
- [ ] **Imports:** Все новые константы корректно импортированы
- [ ] **Typing:** Нет `any` типов, все типы явные
- [ ] **Комментарии:** Добавлены 🆕 маркеры для новых изменений
- [ ] **Консистентность:** Код следует существующему style guide

### Integration Checklist

- [ ] **Backend endpoint:** `user.orders.markAsPaid` доступен через tRPC
- [ ] **Frontend mutation:** `markAsPaidMutation` корректно создан
- [ ] **Event handler:** `handleMarkAsPaid` вызывает mutation
- [ ] **Cache invalidation:** `utils.exchange.getOrderStatus.invalidate` работает
- [ ] **Notifications:** Success и error toast уведомления отображаются
- [ ] **Локализация:** Переводы работают на ru и en

### Security Checklist

- [ ] **Authentication:** `protectedProcedure` требует валидную сессию
- [ ] **User validation:** `validateUserAccess` проверяет пользователя
- [ ] **Ownership validation:** `validateOrderAccess` проверяет владение
- [ ] **Status validation:** `MARKABLE_AS_PAID_STATUSES` проверяет допустимость
- [ ] **Идемпотентность:** Повторный вызов для `paid` статуса возвращает success
- [ ] **Atomicity:** Изменяется ТОЛЬКО поле `status` на `paid`

### Telegram Checklist

- [ ] **Payload type:** `order_paid` добавлен в `NotificationPayload`
- [ ] **Handler:** `createOperatorMessage` обрабатывает `order_paid`
- [ ] **Template:** `ORDER_PAID_MESSAGE` создает корректное сообщение
- [ ] **Icons:** Иконки `PAID` и `PAYMENT_CONFIRMED` используются
- [ ] **Fallback:** Если `TELEGRAM_BOT_URL` не задан - warning в логах, не ошибка

### Business Logic Checklist

- [ ] **`pending` → `paid`:** Успешное изменение статуса
- [ ] **`paid` → `paid`:** Идемпотентный success без DB update
- [ ] **`processing` → `paid`:** Error 400 "cannot be marked as paid"
- [ ] **`completed` → `paid`:** Error 400 "cannot be marked as paid"
- [ ] **`cancelled` → `paid`:** Error 400 "cannot be marked as paid"
- [ ] **`failed` → `paid`:** Error 400 "cannot be marked as paid"

### E2E User Flow Checklist

- [ ] **1. User clicks "Оплатил":** Button trigger `handleMarkAsPaid`
- [ ] **2. Mutation sends request:** `markAsPaidMutation.mutate({ orderId })`
- [ ] **3. Backend validates:** User access → Order ownership → Status
- [ ] **4. DB updates:** `orderManager.update` changes `status` to `paid`
- [ ] **5. Telegram notifies:** `sendPaidNotification` отправляет уведомление
- [ ] **6. Frontend refreshes:** Cache invalidation обновляет UI
- [ ] **7. Success toast:** User видит "Платеж отмечен"
- [ ] **8. Status badge:** Order status badge показывает "Оплачено"

---

## 🎯 ПРИОРИТЕТЫ РЕАЛИЗАЦИИ

### Порядок выполнения

1. **ФАЗА 1** - Константы (15 мин)
   - User constants
   - Telegram constants
   - Простые текстовые изменения

2. **ФАЗА 2** - Backend API (30-45 мин)
   - `sendPaidNotification` функция
   - `markAsPaid` mutation
   - Критическая бизнес-логика

3. **ФАЗА 3** - Telegram Integration (15-20 мин)
   - Type extension
   - Handler modification
   - Простое добавление веток

4. **ФАЗА 4** - Frontend Integration (20-30 мин)
   - Mutation hook
   - Event handler
   - UI связывание

5. **ФАЗА 5** - Локализация (10 мин)
   - Русские переводы
   - Английские переводы
   - Финальные тексты

**Общее время реализации:** 1.5 - 2 часа чистого кодинга

---

## 🔍 ПОТЕНЦИАЛЬНЫЕ ПРОБЛЕМЫ И РЕШЕНИЯ

### Проблема 1: TypeScript ошибка импорта константы

**Симптом:**

```
Module '"@repo/constants"' has no exported member 'MARKABLE_AS_PAID_STATUSES'
```

**Причина:** Не пересобран пакет `@repo/constants` после добавления константы

**Решение:**

```powershell
# В корне монорепо
npm run build --workspace=packages/constants
# Или полная сборка всех пакетов
npm run build
```

---

### Проблема 2: tRPC endpoint не доступен на frontend

**Симптом:**

```
Property 'markAsPaid' does not exist on type 'user.orders'
```

**Причина:** TypeScript не видит новый endpoint в сгенерированных типах

**Решение:**

```powershell
# Перезапуск dev сервера для регенерации типов
npm run dev
```

---

### Проблема 3: Telegram уведомление не отправляется

**Симптом:** В логах `TELEGRAM_BOT_URL not configured, skipping paid notification`

**Причина:** Переменная окружения не установлена (нормально для development)

**Решение:** Это **НЕ ошибка**, а expected behavior:

- В development: Уведомления пропускаются с warning
- В production: `.env` должен содержать `TELEGRAM_BOT_URL`
- Endpoint работает независимо от успешности уведомления

---

### Проблема 4: Cache не инвалидируется после mutation

**Симптом:** Status badge не обновляется после клика на "Оплатил"

**Причина:** React Query cache не инвалидирован

**Решение:** Проверить строку в `onSuccess`:

```typescript
utils.exchange.getOrderStatus.invalidate({ orderId });
```

Если не помогает:

```typescript
// Более агрессивная инвалидация
await utils.exchange.getOrderStatus.invalidate({ orderId });
await utils.exchange.getOrderStatus.refetch({ orderId });
```

---

### Проблема 5: Идемпотентность не работает

**Симптом:** Второй клик на "Оплатил" выдает ошибку

**Причина:** Проверка `if (order.status === ORDER_STATUSES.PAID)` выполняется ПОСЛЕ валидации

**Решение:** Убедиться что проверка идемпотентности **ДО** проверки `MARKABLE_AS_PAID_STATUSES`:

```typescript
// ✅ ПРАВИЛЬНЫЙ ПОРЯДОК:
const order = await validateOrderAccess(input.orderId, user.email);

// 1. Сначала идемпотентность
if (order.status === ORDER_STATUSES.PAID) {
  return { id: order.id, status: order.status, message: USER_SUCCESS_MESSAGES.ORDER_MARKED_PAID };
}

// 2. Потом валидация статуса
if (!MARKABLE_AS_PAID_STATUSES.includes(order.status)) {
  throw createBadRequestError(...);
}
```

---

## 📚 РЕФЕРЕНСНЫЕ МАТЕРИАЛЫ

### Ключевые файлы для изучения

| Файл                                                        | Строки  | Паттерн                        | Зачем изучать                      |
| ----------------------------------------------------------- | ------- | ------------------------------ | ---------------------------------- |
| `apps/web/src/server/trpc/routers/user/orders.ts`           | 136-167 | `cancelOrder` mutation         | Эталон безопасности и структуры    |
| `apps/web/src/server/trpc/routers/user/orders.ts`           | 36-71   | `sendCancellationNotification` | Паттерн Telegram уведомлений       |
| `apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx` | 21-33   | `cancelOrderMutation`          | Паттерн frontend mutation          |
| `packages/constants/src/telegram.ts`                        | 121-137 | `ORDER_CANCELLED_MESSAGE`      | Шаблон Telegram сообщений          |
| `packages/constants/src/user.ts`                            | 66      | `CANCELLABLE_ORDER_STATUSES`   | Паттерн status validation констант |

### Архитектурные принципы проекта

**Из `ai-agent-rules.yml`:**

- **Rule 25:** ФОКУС ТОЛЬКО НА ЦЕЛИ - не трогаем код вне scope задачи
- **Rule 20:** ЗАПРЕТ НА ИЗБЫТОЧНОСТЬ - максимально переиспользуем существующее
- **Rule 21:** ОСОЗНАННОЕ УДАЛЕНИЕ - ничего не удаляем без полного анализа
- **Rule 24:** ЖЕЛЕЗОБЕТОННОЕ ЗНАНИЕ СТРУКТУРЫ - следуем `PROJECT_STRUCTURE_MAP.md`

**Применительно к задаче:**

- ✅ Копируем паттерн `cancelOrder` - не изобретаем велосипед
- ✅ Переиспользуем существующие функции валидации
- ✅ Следуем существующему code style
- ✅ Минимальные изменения существующих файлов

---

## 🚀 FINALIZE & DEPLOY

### Development Testing

```powershell
# 1. Запуск development сервера
npm run dev

# 2. Проверка компиляции
npm run build

# 3. Проверка линтинга
npm run lint

# 4. (Опционально) Запуск тестов
npm run test
```

### Manual Testing Scenarios

1. **Happy Path:**
   - Создать заказ (status = `pending`)
   - Перейти на страницу заказа
   - Нажать "Оплатил"
   - Проверить: Success toast + Status badge = "Оплачено"

2. **Идемпотентность:**
   - На заказе со status = `paid`
   - Нажать "Оплатил" повторно
   - Проверить: Success toast (без ошибки)

3. **Валидация статуса:**
   - На заказе со status = `processing` или `completed`
   - Нажать "Оплатил"
   - Проверить: Error toast "Cannot be marked as paid"

4. **Security:**
   - Попытаться отметить чужой заказ через API
   - Проверить: 403 Forbidden

### Production Checklist

- [ ] `.env.production` содержит `TELEGRAM_BOT_URL`
- [ ] Telegram bot app запущен и доступен
- [ ] Database миграции применены (если были изменения схемы)
- [ ] Monitoring настроен для нового endpoint
- [ ] Error tracking (Sentry) отслеживает `markAsPaid` errors

---

## 📊 METRICS & SUCCESS CRITERIA

### Технические метрики

- **Response time:** `markAsPaid` endpoint < 500ms (аналогично `cancelOrder`)
- **Error rate:** < 1% (после прогрева)
- **Telegram delivery rate:** > 95% (с учетом network issues)

### Бизнес метрики

- **User adoption:** % заказов где пользователь нажал "Оплатил"
- **False positives:** % случаев где статус `paid` но деньги не пришли
- **Operator response time:** Время до начала обработки после клика "Оплатил"

### User Experience метрики

- **Click-to-feedback time:** Время от клика до success toast < 1 секунда
- **UI update time:** Время обновления status badge < 2 секунды
- **Error clarity:** Понятность error messages для пользователей

---

## ✨ ЗАКЛЮЧЕНИЕ

Этот план обеспечивает:

✅ **Минимальные изменения** - только то, что необходимо для задачи  
✅ **Максимальное переиспользование** - копирование проверенных паттернов  
✅ **Архитектурная консистентность** - следование существующим принципам  
✅ **Безопасность** - трехуровневая валидация как в `cancelOrder`  
✅ **Идемпотентность** - защита от двойного клика и race conditions  
✅ **Интеграция** - полная интеграция с существующей инфраструктурой

**Референсный подход:** "Если `cancelOrder` работает правильно, то `markAsPaid` с той же структурой тоже будет работать правильно"

**Время реализации:** 1.5 - 2 часа чистого кодинга + 30 минут тестирования = **≈ 2.5 часа total**

---

_Документ создан Agent-coder с фокусом на интеграцию в существующую кодовую базу через переиспользование паттернов_
