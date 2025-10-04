# Quick Start: Реализация отмены заявки пользователем

> **Краткая инструкция для быстрого старта. Полная документация в `USER_ORDER_CANCEL_IMPLEMENTATION_PLAN.md`**

---

## ⚡ TL;DR

**Что делаем:** Интегрируем существующий endpoint `user.orders.cancelOrder` в OrderPageClient + добавляем Telegram уведомление

**Охват:** 6 файлов для изменения, ~180 строк кода

**Сложность:** Low (используются существующие паттерны)

---

## 🎯 Список изменений

### 1️⃣ Frontend: OrderPageClient.tsx

```typescript
// apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx

// ДОБАВИТЬ импорты:
import { useNotifications } from '@repo/hooks/src/client-hooks';
import { useTranslations } from 'next-intl';

// ДОБАВИТЬ в компонент:
const notifications = useNotifications();
const t = useTranslations('OrderPage.OrderStatus');

const cancelOrderMutation = trpc.user.orders.cancelOrder.useMutation({
  onSuccess: data => {
    notifications.success(t('actions.orderCancelled'), t('actions.orderCancelledDescription'));
    utils.exchange.getOrderStatus.invalidate({ orderId });
  },
  onError: error => {
    notifications.handleApiError(error, t('actions.orderCancelError'));
  },
});

// ЗАМЕНИТЬ handleCancelOrder:
const handleCancelOrder = () => {
  cancelOrderMutation.mutate({ orderId });
};
```

---

### 2️⃣ Локализация: добавить ключи

**ru/order-page.json:**

```json
{
  "OrderStatus": {
    "actions": {
      "orderCancelled": "Заявка отменена",
      "orderCancelledDescription": "Ваша заявка успешно отменена",
      "orderCancelError": "Не удалось отменить заявку"
    }
  }
}
```

**en/order-page.json:**

```json
{
  "OrderStatus": {
    "actions": {
      "orderCancelled": "Order cancelled",
      "orderCancelledDescription": "Your order has been successfully cancelled",
      "orderCancelError": "Failed to cancel order"
    }
  }
}
```

---

### 3️⃣ Константы: Telegram сообщения

```typescript
// packages/constants/src/telegram.ts

// В ICONS добавить:
CANCELLED: '❌',
USER_ACTION: '👤',

// В HEADERS добавить:
ORDER_CANCELLED: (orderId: string) => `❌ Заявка #${orderId} отменена пользователем`,

// В TEMPLATES добавить:
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
```

---

### 4️⃣ Backend: Telegram уведомление

```typescript
// apps/web/src/server/trpc/routers/user/orders.ts

// ДОБАВИТЬ helper функцию ПЕРЕД cancelOrder:
async function sendCancellationNotification(order: Order, userEmail: string) {
  const telegramBotUrl = process.env.TELEGRAM_BOT_URL;
  if (!telegramBotUrl) {
    console.warn('TELEGRAM_BOT_URL not configured, skipping cancellation notification');
    return;
  }

  try {
    await fetch(`${telegramBotUrl}/api/notify-operators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: {
          id: order.id,
          email: userEmail,
          cryptoAmount: order.cryptoAmount,
          currency: order.currency,
          uahAmount: order.uahAmount,
          status: 'cancelled',
        },
        depositAddress: order.depositAddress || 'N/A',
        notificationType: 'order_cancelled',
      }),
    });

    console.log(`✅ Telegram notification sent for cancelled order ${order.id}`);
  } catch (error) {
    console.error('Failed to send Telegram cancellation notification', {
      orderId: order.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// В cancelOrder ДОБАВИТЬ после console.log (строка ~115):
await sendCancellationNotification(updatedOrder, user.email);
```

---

### 5️⃣ Telegram Bot: обработка уведомления

```typescript
// apps/telegram-bot/pages/api/notify-operators.ts

// ИЗМЕНИТЬ интерфейс NotificationPayload (строка 8):
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
  notificationType?: 'new_order' | 'order_cancelled'; // 🆕 ДОБАВИТЬ
}

// В createOperatorMessage (строка 107) ДОБАВИТЬ в начало:
function createOperatorMessage(payload: NotificationPayload): string {
  const { order, depositAddress, walletType, notificationType } = payload;

  // 🆕 ДОБАВИТЬ:
  if (notificationType === 'order_cancelled') {
    return TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.ORDER_CANCELLED_MESSAGE(order);
  }

  // СУЩЕСТВУЮЩАЯ логика для новых заявок...
}
```

---

## ✅ Чек-лист реализации

```markdown
### Phase 1: Frontend (15 минут)

- [ ] Добавить imports в OrderPageClient.tsx
- [ ] Добавить cancelOrderMutation
- [ ] Заменить handleCancelOrder
- [ ] Добавить ключи локализации (ru + en)

### Phase 2: Backend (20 минут)

- [ ] Добавить константы в telegram.ts
- [ ] Добавить sendCancellationNotification в orders.ts
- [ ] Добавить вызов уведомления в cancelOrder
- [ ] Модифицировать notify-operators.ts

### Phase 3: Testing (30 минут)

- [ ] npm run build (проверка компиляции)
- [ ] Запустить dev сервер
- [ ] Создать тестовую заявку
- [ ] Проверить отмену через UI
- [ ] Проверить уведомление в Telegram
- [ ] Проверить обработку ошибок

### Phase 4: Commit

- [ ] git add .
- [ ] git commit -m "feat(order): add user order cancellation with Telegram notification"
- [ ] git push
```

---

## 🚀 Запуск для тестирования

```bash
# 1. Установить зависимости (если нужно)
npm install

# 2. Проверить environment variables
# .env.local должен содержать:
TELEGRAM_BOT_URL=http://localhost:3003
TELEGRAM_BOT_TOKEN=your_bot_token
AUTHORIZED_TELEGRAM_OPERATORS=123456789,987654321

# 3. Запустить dev серверы
npm run dev

# 4. Открыть в браузере
# http://localhost:3000/ru/order/[test-order-id]
```

---

## 🔍 Быстрая проверка работы

### 1. Создать тестовую заявку:

```bash
# В браузере:
http://localhost:3000/ru/exchange
# Заполнить форму и создать заявку
```

### 2. Открыть страницу заявки:

```bash
# URL из предыдущего шага
http://localhost:3000/ru/order/[orderId]
```

### 3. Проверить кнопку отмены:

- [x] Кнопка "Отменить заказ" видна
- [x] Клик открывает диалог подтверждения
- [x] Клик "Да, отменить" выполняет mutation
- [x] Показывается success уведомление
- [x] Статус обновляется на "cancelled"

### 4. Проверить Telegram уведомление:

- [x] Оператор получил сообщение
- [x] Сообщение содержит правильные данные
- [x] Иконка "❌" отображается

---

## 🐛 Troubleshooting

### Проблема: Mutation не вызывается

**Решение:**

```typescript
// Проверить в DevTools → Network
// Должен быть запрос: POST /api/trpc/user.orders.cancelOrder
// Если запроса нет - проверить импорт trpc и useUtils
```

### Проблема: Telegram уведомление не приходит

**Решение:**

```bash
# 1. Проверить TELEGRAM_BOT_URL в .env.local
echo $TELEGRAM_BOT_URL

# 2. Проверить логи telegram-bot
# В консоли должно быть:
# "TELEGRAM_NOTIFY_ALL_OPERATORS_START"

# 3. Проверить AUTHORIZED_TELEGRAM_OPERATORS
# Ваш Telegram ID должен быть в списке
```

### Проблема: TypeScript ошибки

**Решение:**

```bash
# Пересобрать пакеты
npm run build

# Проверить типы
npx tsc --noEmit
```

---

## 📚 Полная документация

- **Детальный план:** `docs/tasks/USER_ORDER_CANCEL_IMPLEMENTATION_PLAN.md`
- **Диаграммы:** `docs/tasks/USER_ORDER_CANCEL_SEQUENCE_DIAGRAM.md`
- **API Docs:** `docs/core/API_DOCS.md` (раздел user.orders.cancelOrder)
- **AI Rules:** `docs/ai-agent/ai-agent-rules.yml`

---

## 💡 Tips

1. **Используй существующие паттерны:**
   - `useAuthMutations.ts` - пример mutation patterns
   - `exchange.ts` - пример Telegram notification

2. **Следуй правилам:**
   - Rule 25: Минимальность изменений
   - Rule 7: Все тексты через локализацию
   - Rule 19: Graceful degradation для Telegram

3. **Тестируй постепенно:**
   - Сначала frontend (без backend)
   - Потом backend (без Telegram)
   - Затем Telegram уведомление

---

**Время на реализацию: ~1 час**
**Сложность: Low**
**Риски: Минимальные (используются существующие компоненты)**
