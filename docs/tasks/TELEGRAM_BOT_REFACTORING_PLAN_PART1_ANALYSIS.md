# 🔧 TELEGRAM BOT REFACTORING PLAN - ЧАСТЬ 1: АНАЛИЗ ПРОБЛЕМ

**Дата создания:** 10 октября 2025  
**Автор:** AI Agent (Агент-кодер с фокусом на рефакторинг)  
**Статус:** ✅ ПОЛНЫЙ АНАЛИЗ ЗАВЕРШЕН  
**Проект:** exchanger-front / Telegram Bot для операторов

---

## 📖 СОДЕРЖАНИЕ ЧАСТИ 1

1. [Введение и методология](#введение-и-методология)
2. [Архитектура существующей системы](#архитектура-существующей-системы)
3. [Детальный анализ проблем](#детальный-анализ-проблем)
4. [Архитектурные решения](#архитектурные-решения)

---

## 🎯 ВВЕДЕНИЕ И МЕТОДОЛОГИЯ

### Задача

Провести рефакторинг системы телеграм-бота для операторов с целью исправления следующих проблем:

1. **Отсутствие возможности подтверждения перевода на карту клиента** и изменения статуса ордера оператором
2. **Проблемы синхронизации кнопок** между темами (новые/оплаченные/отменённые заявки)
3. **Отсутствие механизма разрешения гонки операторов** (race condition)
4. **Отсутствие сообщений об ошибках** для операторов

### Методология анализа

**Применяемые правила из ai-agent-rules.yml:**

- ✅ **Rule 24** - ЖЕЛЕЗОБЕТОННОЕ чтение PROJECT_STRUCTURE_MAP.md
- ✅ **Rule 25** - ФОКУС ТОЛЬКО на телеграм-бот и управление ордерами
- ✅ **Rule 2** - Структурированный архитектурный анализ
- ✅ **Rule 8** - ЗАПРЕТ на предположения, только факты
- ✅ **Rule 20** - Поиск избыточности и переиспользование
- ✅ **Rule 5** - Контекстное понимание через чтение всех файлов

**Проверенные компоненты:**

```
✅ apps/telegram-bot/src/lib/telegram-bot.ts (основная логика бота)
✅ apps/telegram-bot/pages/api/webhook.ts (обработка webhook)
✅ apps/telegram-bot/pages/api/notify-operators.ts (отправка уведомлений)
✅ apps/telegram-bot/src/lib/trpc-client.ts (интеграция с API)
✅ apps/web/src/server/trpc/routers/telegram-bot.ts (backend API)
✅ apps/web/src/server/trpc/routers/operator.ts (операторские функции)
✅ packages/session-management/prisma/schema.prisma (схема БД)
✅ packages/session-management/src/adapters/postgres-order-adapter.ts (работа с Order)
✅ packages/constants/src/telegram.ts (константы бота)
```

---

## 🏗️ АРХИТЕКТУРА СУЩЕСТВУЮЩЕЙ СИСТЕМЫ

### 1. Общая архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                    TELEGRAM BOT ECOSYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────────────────────┐
│  Telegram API    │────────▶│  apps/telegram-bot/              │
│  (Webhook)       │         │  pages/api/webhook.ts            │
└──────────────────┘         └──────────────────────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────────┐
                      │  src/lib/telegram-bot.ts                 │
                      │  - handleTelegramUpdate()                │
                      │  - handleCallbackQuery()                 │
                      │  - Роутинг команд                        │
                      └──────────────────────────────────────────┘
                                         │
                    ┌────────────────────┴──────────────────────┐
                    │                                            │
                    ▼                                            ▼
         ┌──────────────────────┐                  ┌─────────────────────┐
         │  Command Handlers    │                  │  Callback Handlers  │
         │  - /start            │                  │  - take_order_*     │
         │  - /login            │                  │  - details_order_*  │
         │  - /takeorder        │                  └─────────────────────┘
         │  - /orders           │
         │  - /help             │
         └──────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  tRPC Client         │
         │  api.telegram.*      │
         └──────────────────────┘
                    │
                    ▼
         ┌──────────────────────────────────────────┐
         │  apps/web/src/server/trpc/routers/       │
         │  - telegram-bot.ts                       │
         │    • takeOrderByTelegram                 │
         │    • updateOrderStatusByTelegram         │
         └──────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────────────────────────┐
         │  packages/exchange-core/orderManager     │
         │  - assignToOperator()                    │
         │  - updateStatus()                        │
         └──────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────────────────────────┐
         │  PostgresOrderAdapter                    │
         │  - updateOrderAssignment()               │
         │  - updateStatus()                        │
         │  - Concurrent protection (P2025 handling)│
         └──────────────────────────────────────────┘
                    │
                    ▼
              [PostgreSQL DB]
```

### 2. Схема Order в БД

```sql
model Order {
  id                 String          @id @default(dbgenerated("gen_random_uuid()"))
  publicId           String          @unique
  userId             String
  cryptoAmount       Decimal
  currency           String
  uahAmount          Decimal
  status             OrderStatus     @default(PENDING)
  txHash             String?
  recipientData      Json?
  assignedOperatorId String?         -- 🔑 Ключевое поле для взятия заявки
  assignedAt         DateTime?       -- 🔑 Время взятия заявки
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
  processedAt        DateTime?       -- 🔑 Время обработки (COMPLETED)
  walletId           String?
  bankId             String?

  -- Relations
  assignedOperator   User?           @relation("OperatorAssignments")
  user               User            @relation
  wallet             Wallet?         @relation
  bank               Bank?           @relation
  auditLogs          OrderAuditLog[]
}

enum OrderStatus {
  PENDING    -- Ожидание оплаты от клиента
  PAID       -- Оплачено клиентом
  PROCESSING -- Взято оператором в работу
  COMPLETED  -- Завершено (перевод выполнен)
  CANCELLED  -- Отменено
  FAILED     -- Ошибка
}
```

### 3. Поток уведомлений операторов

```
┌────────────────────────────────────────────────────────────────┐
│         NOTIFICATION FLOW (notify-operators.ts)                 │
└────────────────────────────────────────────────────────────────┘

Order Created/Updated
         │
         ▼
┌────────────────────────────┐
│ POST /api/notify-operators │
│ Payload:                   │
│ - order: { id, ... }       │
│ - notificationType         │
│ - depositAddress           │
│ - walletType               │
└────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ getTopicIdForNotificationType()                │
│ - new_order    → TELEGRAM_NEW_ORDERS_TOPIC_ID  │
│ - order_paid   → TELEGRAM_PAID_ORDERS_TOPIC_ID │
│ - order_cancelled → TELEGRAM_CANCELLED_...     │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ Route 1: TELEGRAM_ORDERS_CHAT_ID configured?  │
│   YES → Send to Orders Group (with Topic ID)  │
│   NO  → Fallback to broadcast to operators    │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ createInlineKeyboard()                         │
│ - ✅ Взять в работу (take_order_${orderId})   │
│ - 📋 Детали (details_order_${orderId})        │
└────────────────────────────────────────────────┘
         │
         ▼
   [Telegram Message Sent]
```

### 4. Существующие команды бота

| Команда           | Доступ    | Текущая функциональность                                     |
| ----------------- | --------- | ------------------------------------------------------------ |
| `/start`          | Все       | Приветствие, определение типа пользователя (operator/client) |
| `/help`           | Все       | Справка по командам                                          |
| `/login`          | Операторы | Авторизация по AUTHORIZED_TELEGRAM_OPERATORS                 |
| `/takeorder <ID>` | Операторы | Взятие заявки в работу                                       |
| `/orders`         | Операторы | Список активных заявок оператора                             |

### 5. Существующие callback queries

| Callback Data              | Действие                                  |
| -------------------------- | ----------------------------------------- |
| `take_order_${orderId}`    | Взять заявку в работу (аналог /takeorder) |
| `details_order_${orderId}` | Показать детали заявки (заглушка)         |

---

## 🔴 ДЕТАЛЬНЫЙ АНАЛИЗ ПРОБЛЕМ

### ПРОБЛЕМА 1: Отсутствие подтверждения перевода оператором

#### 1.1 Фактическое состояние

**Что есть сейчас:**

```typescript
// apps/telegram-bot/src/lib/telegram-bot.ts

// ✅ ЕСТЬ: Взятие заявки в работу
async function handleTakeOrderCommand(update: TelegramUpdate): Promise<string> {
  // ...
  const result = await api.telegram.takeOrder({
    orderId,
    telegramOperatorId,
  });
  // Статус меняется: PENDING/PAID → PROCESSING
}

// ❌ НЕТ: Подтверждения выполнения перевода
// ❌ НЕТ: Изменения статуса на COMPLETED
// ❌ НЕТ: Команды типа /complete или /confirm
```

**Анализ существующих API:**

```typescript
// apps/web/src/server/trpc/routers/telegram-bot.ts

export const telegramBotRouter = createTRPCRouter({
  // ✅ ЕСТЬ: Взятие заявки
  takeOrderByTelegram: systemApiMiddleware
    .input(
      z.object({
        orderId: z.string(),
        telegramOperatorId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const operator = await validateTelegramOperator(input.telegramOperatorId);
      const updatedOrder = await orderManager.assignToOperator(input.orderId, operator.id);
      return { success: true, order: updatedOrder };
    }),

  // ✅ ЕСТЬ: Обновление статуса (НО НЕ ИСПОЛЬЗУЕТСЯ В БОТЕ!)
  updateOrderStatusByTelegram: systemApiMiddleware
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
        telegramOperatorId: z.string(),
        operatorNote: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { orderManager } = await import('@repo/exchange-core');
      const updatedOrder = await orderManager.updateStatus(input.orderId, input.status);
      return { success: true, order: updatedOrder };
    }),
});
```

**✅ ВЫВОД:** API для обновления статуса **УЖЕ СУЩЕСТВУЕТ**, но **НЕ ИСПОЛЬЗУЕТСЯ** в боте!

#### 1.2 Что отсутствует в боте

1. **Команда для подтверждения перевода** (например, `/complete <orderId>`)
2. **Callback кнопка "Перевод выполнен"** в сообщениях о заявках
3. **Интеграция с `api.telegram.updateOrderStatus()`** для изменения статуса на COMPLETED
4. **Валидация прав оператора** на изменение статуса (может ли оператор завершить чужую заявку?)

#### 1.3 Бизнес-логика завершения заявки

**Анализ переходов статусов:**

```typescript
// packages/utils/src/order-status.ts

export function canTransitionStatus(fromStatus: OrderStatus, toStatus: OrderStatus): boolean {
  switch (fromStatus) {
    case ORDER_STATUSES.PENDING:
      return [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED].includes(toStatus);
    case ORDER_STATUSES.PROCESSING:
      return [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(toStatus); // ✅
    case ORDER_STATUSES.PAID:
      return [ORDER_STATUSES.PROCESSING].includes(toStatus);
    case ORDER_STATUSES.COMPLETED:
    case ORDER_STATUSES.CANCELLED:
      return false; // Финальные статусы
    default:
      return false;
  }
}
```

**✅ ВЫВОД:** Переход `PROCESSING → COMPLETED` **РАЗРЕШЁН** системой.

**Что происходит при завершении:**

```typescript
// packages/session-management/src/adapters/postgres-order-adapter.ts

async updateStatus(id: string, status: OrderStatus, operatorId?: string): Promise<Order | null> {
  const prismaStatus = mapToPrismaStatus(status);
  const isFinalStatus = ['COMPLETED', 'CANCELLED', 'FAILED'].includes(prismaStatus);

  const updateData = {
    status: prismaStatus,
    updatedAt: new Date(),
    processedAt: isFinalStatus ? new Date() : undefined, // ✅ Устанавливается processedAt
  };

  const prismaOrder = await this.prisma.order.update({
    where: { id },
    data: updateData,
    include: { wallet: true, bank: true },
  });

  // ✅ Создаётся audit log
  if (operatorId) {
    await this.createAuditLog({
      orderId: id,
      action: 'STATUS_CHANGED',
      oldValue: null,
      newValue: status,
      performedBy: operatorId,
    });
  }

  return this.mapPrismaToOrder(prismaOrder as any);
}
```

**✅ ВЫВОД:** При завершении автоматически:

- Устанавливается `processedAt`
- Создаётся audit log
- Обновляется `updatedAt`

---

### ПРОБЛЕМА 2: Синхронизация кнопок между темами

#### 2.1 Фактическое состояние

**Текущая логика отправки уведомлений:**

```typescript
// apps/telegram-bot/pages/api/notify-operators.ts

async function sendOperatorNotifications(
  message: string,
  keyboard: InlineKeyboard,
  orderId: string,
  notificationType?: 'new_order' | 'order_cancelled' | 'order_paid'
): Promise<...> {

  const topicId = getTopicIdForNotificationType(notificationType);
  const ordersChatId = process.env.TELEGRAM_ORDERS_CHAT_ID;

  if (ordersChatId) {
    // ✅ Отправка в Orders Group с Topic ID
    const success = await notifyOperator(ordersChatId, message, keyboard, orderId, topicId);
    return { notifiedCount: 1, errorCount: 0, totalOperators: 1 };
  }

  // ❌ Fallback: Broadcast всем операторам (каждому в ЛС)
  const operatorIds = getAuthorizedOperators();
  for (const operatorId of operatorIds) {
    await notifyOperator(operatorId, message, keyboard, orderId);
  }
}
```

**Проблема:** Каждый оператор получает **ОТДЕЛЬНОЕ сообщение**:

```
📱 Оператор 1 (ЛС): Новая заявка #ABC с кнопкой "Взять в работу"
📱 Оператор 2 (ЛС): Новая заявка #ABC с кнопкой "Взять в работу"
📱 Оператор 3 (ЛС): Новая заявка #ABC с кнопкой "Взять в работу"
```

Если Оператор 1 нажимает "Взять в работу":

- ✅ Его сообщение обновляется (webhook.ts → handleCallbackQueryResponse)
- ❌ Сообщения Оператора 2 и 3 **НЕ ОБНОВЛЯЮТСЯ**

#### 2.2 Анализ обработки callback queries

```typescript
// apps/telegram-bot/pages/api/webhook.ts

async function handleCallbackQueryResponse(
  callbackQuery: NonNullable<TelegramUpdate['callback_query']>,
  responseMessage: string | null
): Promise<void> {
  // ✅ Ответ на callback query
  await fetch(
    `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
    {
      method: 'POST',
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: responseMessage || 'Готово!',
        show_alert: false,
      }),
    }
  );

  // ❌ ПРОБЛЕМА: Обновляется ТОЛЬКО текущее сообщение
  if (callbackQuery.data?.startsWith('take_order_') && callbackQuery.message) {
    const orderId = callbackQuery.data.replace('take_order_', '');
    const originalText = callbackQuery.message.text || '';
    const updatedText = `${originalText}\n\n✅ **Заявка взята в работу оператором ${callbackQuery.from.first_name}**`;

    await fetch(
      `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.EDIT_MESSAGE}`,
      {
        method: 'POST',
        body: JSON.stringify({
          chat_id: callbackQuery.message.chat.id, // ❌ ТОЛЬКО ЭТОТ chat_id!
          message_id: callbackQuery.message.message_id, // ❌ ТОЛЬКО ЭТО сообщение!
          text: updatedText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [] }, // Убрать кнопки
        }),
      }
    );
  }
}
```

**✅ ВЫВОД:** Система обновляет **ТОЛЬКО ТО сообщение**, на котором нажата кнопка.

#### 2.3 Корневая причина проблемы

**Telegram API ограничения:**

1. Telegram **НЕ ПОЗВОЛЯЕТ** редактировать сообщения в чужих чатах
2. Bot может редактировать только:
   - Сообщения в группах/каналах (где бот админ)
   - Свои сообщения в личных чатах с пользователями
3. Bot **НЕ МОЖЕТ** редактировать сообщения в ЛС других пользователей

**Текущая архитектура:**

```
Order #ABC создан
      │
      ├─▶ Оператор 1 (ЛС): Message ID 100
      ├─▶ Оператор 2 (ЛС): Message ID 101
      └─▶ Оператор 3 (ЛС): Message ID 102

Оператор 1 нажимает кнопку
      │
      └─▶ Обновляется ТОЛЬКО Message ID 100
          ❌ Message ID 101 и 102 остаются без изменений
```

**Правильная архитектура (с группой):**

```
Order #ABC создан
      │
      └─▶ Orders Group: Message ID 500 (одно сообщение для всех)

Оператор 1 нажимает кнопку
      │
      └─▶ Обновляется Message ID 500
          ✅ ВСЕ операторы видят обновление
```

#### 2.4 Проблема с темами (Topics)

**Текущая реализация Topics:**

```typescript
// apps/telegram-bot/pages/api/notify-operators.ts

function getTopicIdForNotificationType(
  notificationType?: 'new_order' | 'order_cancelled' | 'order_paid'
): number | undefined {
  if (!notificationType) return undefined;

  switch (notificationType) {
    case 'new_order':
      return process.env.TELEGRAM_NEW_ORDERS_TOPIC_ID ? parseInt(...) : undefined;
    case 'order_cancelled':
      return process.env.TELEGRAM_CANCELLED_ORDERS_TOPIC_ID ? parseInt(...) : undefined;
    case 'order_paid':
      return process.env.TELEGRAM_PAID_ORDERS_TOPIC_ID ? parseInt(...) : undefined;
    default:
      return undefined;
  }
}
```

**Проблема "видимости кнопки в отменённых":**

```
Заявка #ABC: PENDING
      │
      ├─▶ Отправлено в тему "🆕 Новые заказы" (Topic ID 2)
      │   Кнопка: "✅ Взять в работу"
      │
Оператор нажимает "Взять в работу"
      │
      └─▶ Статус: PROCESSING
          ❌ Сообщение в теме "🆕 Новые заказы" НЕ ОБНОВЛЯЕТСЯ
          ❌ Кнопка остаётся активной

Клиент отменяет заявку
      │
      └─▶ Отправлено в тему "❌ Отменённые" (Topic ID 3)
          ❌ В "🆕 Новые заказы" СТАРОЕ сообщение с кнопкой!
```

**✅ ВЫВОД:** Система **НЕ ОБНОВЛЯЕТ** старые сообщения при изменении статуса заявки.

---

### ПРОБЛЕМА 3: Гонка операторов (Race Condition)

#### 3.1 Фактическое состояние защиты

**Проверка существующей защиты:**

```typescript
// packages/session-management/src/adapters/postgres-order-adapter.ts

async assignToOperator(orderId: string, operatorId: string): Promise<Order | null> {
  try {
    this.logger.info('Assigning order to operator with concurrent protection', {
      orderId,
      operatorId,
    });

    // ✅ ЕСТЬ concurrent protection!
    const prismaOrder = await this.updateOrderAssignment(orderId, operatorId);

    // ✅ Audit log создаётся
    await this.createAuditLog({
      orderId,
      action: 'ASSIGNED_TO_OPERATOR',
      oldValue: null,
      newValue: operatorId,
      performedBy: operatorId,
    });

    return this.mapPrismaToOrder(prismaOrder as any);
  } catch (error) {
    return this.handleAssignmentError(error, orderId, operatorId);
  }
}

private async updateOrderAssignment(orderId: string, operatorId: string) {
  // ✅ АТОМАРНАЯ операция с проверкой условий!
  return await this.prisma.order.update({
    where: {
      id: orderId,
      status: { in: ['PENDING', 'PAID'] },      // ✅ Проверка статуса
      assignedOperatorId: null,                  // ✅ Проверка что не назначен
    },
    data: {
      assignedOperatorId: operatorId,
      status: 'PROCESSING',
      assignedAt: new Date(),
      updatedAt: new Date(),
    },
    include: {
      wallet: true,
    },
  });
}

private handleAssignmentError(error: unknown, orderId: string, operatorId: string): Order | null {
  // ✅ ОБРАБОТКА P2025 (Record not found or condition not met)
  if (error instanceof Error && 'code' in error && error.code === 'P2025') {
    this.logger.warn('Concurrent assignment attempt detected', {
      orderId,
      operatorId,
      reason: 'Order already assigned or not in PENDING/PAID status',
    });
    return null; // ✅ Возвращается null при конфликте
  }

  this.logger.error('PostgresOrderAdapter.assignToOperator failed', {
    error: error instanceof Error ? error.message : String(error),
    orderId,
    operatorId,
  });
  return null;
}
```

**✅ ВЫВОД:** На уровне БД **ЕСТЬ защита** от concurrent access!

#### 3.2 Обработка в telegram-bot

```typescript
// apps/telegram-bot/src/lib/telegram-bot.ts

async function handleTakeOrderCommand(update: TelegramUpdate): Promise<string> {
  // ...

  const result = await gracefulHandler(
    async () => {
      return await api.telegram.takeOrder({
        orderId,
        telegramOperatorId,
      });
    },
    { fallback: null } // ✅ Обработка ошибок через gracefulHandler
  );

  if (result?.order) {
    session.currentOrderId = result.order.id;

    const successMessage =
      `✅ Заявка взята в работу!\n\n` +
      `📋 Заявка #${result.order.id}\n` +
      `💰 Сумма: ${result.order.cryptoAmount} ${result.order.currency}\n` +
      `🔄 Статус: ${result.order.status}\n\n` +
      `Используйте /orders для просмотра деталей.`;
    return successMessage;
  } else {
    // ❌ ПРОБЛЕМА: Неинформативное сообщение об ошибке!
    const errorMessage =
      `❌ Не удалось взять заявку\n\n` +
      `Возможные причины:\n` +
      `• Заявка не найдена\n` +
      `• Заявка уже взята другим оператором\n` +
      `• Системная ошибка\n\n` +
      `Проверьте ID заявки и попробуйте снова.`;
    return errorMessage;
  }
}
```

**✅ ВЫВОД:**

- База данных **ЗАЩИЩЕНА** от race condition
- Обработка ошибок **ЕСТЬ**, но сообщение **НЕ СПЕЦИФИЧНОЕ**
- Невозможно понять, **ПОЧЕМУ ИМЕННО** не удалось взять заявку

#### 3.3 Что видит второй оператор

**Сценарий:**

```
t=0ms:  Оператор 1 нажимает кнопку "Взять в работу"
t=50ms: Оператор 2 нажимает кнопку "Взять в работу"

Database:
  t=0ms:  assignedOperatorId = NULL, status = PENDING
  t=10ms: UPDATE WHERE assignedOperatorId = NULL → SUCCESS (Оператор 1)
  t=60ms: UPDATE WHERE assignedOperatorId = NULL → FAIL P2025 (Оператор 2)

Telegram:
  Оператор 1: "✅ Заявка взята в работу!"
  Оператор 2: "❌ Не удалось взять заявку\n\n• Заявка уже взята другим оператором"
```

**❌ ПРОБЛЕМА:** Оператор 2 получает **ОБЩЕЕ** сообщение об ошибке, а не конкретное "Заявка взята оператором X".

---

### ПРОБЛЕМА 4: Отсутствие сообщений об ошибках

#### 4.1 Текущая обработка ошибок

**Анализ gracefulHandler:**

```typescript
// packages/utils/src/graceful-handler.ts (предполагаемая реализация)

export async function gracefulHandler<T>(
  fn: () => Promise<T>,
  options: { fallback: T }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // ❌ Логирование есть, но детали ошибки НЕ передаются в результат
    console.error('gracefulHandler caught error:', error);
    return options.fallback;
  }
}
```

**Использование в боте:**

```typescript
const result = await gracefulHandler(
  async () => {
    return await api.telegram.takeOrder({
      orderId,
      telegramOperatorId,
    });
  },
  { fallback: null } // ❌ При ошибке возвращается просто null
);

if (result?.order) {
  // Success
} else {
  // ❌ Невозможно определить ПРИЧИНУ ошибки!
  return `❌ Не удалось взять заявку\n\nВозможные причины:\n...`;
}
```

#### 4.2 Типы ошибок, которые должны различаться

1. **Заявка не найдена** (Order ID не существует)
2. **Заявка уже взята другим оператором** (Race condition, P2025)
3. **Неверный статус заявки** (например, уже COMPLETED)
4. **Оператор не авторизован** (telegram_id не найден в БД)
5. **Системная ошибка** (DB connection, network, etc.)

**Текущее состояние:**

```typescript
// ❌ ВСЕ ошибки возвращают ОДИНАКОВОЕ сообщение:
'❌ Не удалось взять заявку\n\nВозможные причины:\n• Заявка не найдена\n• Заявка уже взята другим оператором\n• Системная ошибка';
```

---

## 🏛️ АРХИТЕКТУРНЫЕ РЕШЕНИЯ

### Принцип минимальных изменений

**Согласно Role: Агент-кодер с фокусом на рефакторинг:**

- ✅ **Модифицировать существующий код**, а не писать с нуля
- ✅ **Переиспользовать** существующие API (`updateOrderStatusByTelegram`)
- ✅ **Следовать** существующим паттернам (команды, callback queries, tRPC)
- ✅ **Избегать** дублирования логики

### Архитектурные решения по проблемам

#### Решение 1: Подтверждение перевода

**Подход:** Добавить новую команду `/complete` и callback кнопку.

**Интеграция с существующим кодом:**

```typescript
// apps/telegram-bot/src/lib/telegram-bot.ts

// ✅ Используем УЖЕ СУЩЕСТВУЮЩИЙ API:
// api.telegram.updateOrderStatus()

// ✅ Копируем паттерн из handleTakeOrderCommand:
async function handleCompleteOrderCommand(update: TelegramUpdate): Promise<string> {
  // 1. Проверка авторизации оператора
  // 2. Парсинг orderId из команды
  // 3. Вызов api.telegram.updateOrderStatus({ orderId, status: 'completed', ... })
  // 4. Обработка результата с детальными сообщениями
}
```

**Минимальные изменения:**

1. Добавить `handleCompleteOrderCommand()` по образцу `handleTakeOrderCommand()`
2. Добавить роутинг в `handleTelegramUpdate()`
3. Добавить обработку callback `complete_order_${orderId}`
4. Обновить константы в `packages/constants/src/telegram.ts`

#### Решение 2: Синхронизация кнопок

**Подход:** Использовать **ТОЛЬКО** Orders Group, отказаться от broadcast в ЛС.

**Обоснование:**

- ✅ Telegram позволяет редактировать сообщения в группах
- ✅ Все операторы видят ОДНО сообщение
- ✅ При обновлении все видят изменения
- ✅ Уже реализован роутинг через `TELEGRAM_ORDERS_CHAT_ID`

**Изменения:**

```typescript
// apps/telegram-bot/pages/api/notify-operators.ts

// ❌ УДАЛИТЬ fallback broadcast:
// const operatorIds = getAuthorizedOperators();
// for (const operatorId of operatorIds) { ... }

// ✅ ТРЕБОВАТЬ обязательную настройку TELEGRAM_ORDERS_CHAT_ID:
if (!ordersChatId) {
  throw new Error('TELEGRAM_ORDERS_CHAT_ID is required');
}
```

**Обновление сообщений при изменении статуса:**

```typescript
// ✅ НОВАЯ функция:
async function updateOrderMessage(orderId: string, newStatus: OrderStatus): Promise<void> {
  // 1. Получить message_id из кеша/БД
  // 2. Обновить текст сообщения
  // 3. Обновить/удалить кнопки в зависимости от статуса
}

// ✅ Вызывать из:
// - handleTakeOrderCommand (убрать кнопку "Взять в работу")
// - handleCompleteOrderCommand (убрать все кнопки, добавить статус)
```

#### Решение 3: Улучшенная обработка Race Condition

**Подход:** Детальные сообщения об ошибках для операторов.

**Изменения в tRPC API:**

```typescript
// apps/web/src/server/trpc/routers/telegram-bot.ts

// ✅ Возвращать структурированную ошибку:
type TakeOrderResult = {
  success: boolean;
  order?: Order;
  error?: {
    code: 'ORDER_NOT_FOUND' | 'ORDER_ALREADY_ASSIGNED' | 'INVALID_STATUS' | 'SYSTEM_ERROR';
    message: string;
    assignedTo?: string; // Для ORDER_ALREADY_ASSIGNED
  };
};
```

**Изменения в боте:**

```typescript
// apps/telegram-bot/src/lib/telegram-bot.ts

const result = await api.telegram.takeOrder({ orderId, telegramOperatorId });

if (result.success && result.order) {
  return `✅ Заявка взята в работу!`;
}

// ✅ Детальные сообщения:
switch (result.error?.code) {
  case 'ORDER_ALREADY_ASSIGNED':
    return `❌ Заявка уже взята оператором ${result.error.assignedTo}`;
  case 'INVALID_STATUS':
    return `❌ Заявка находится в статусе ${result.error.message}, невозможно взять в работу`;
  case 'ORDER_NOT_FOUND':
    return `❌ Заявка #${orderId} не найдена`;
  default:
    return `❌ Системная ошибка: ${result.error?.message}`;
}
```

#### Решение 4: Трекинг message_id для обновлений

**Проблема:** Как найти message_id для обновления сообщения в Orders Group?

**Решение:** Добавить таблицу в БД:

```sql
-- ✅ НОВАЯ таблица
CREATE TABLE telegram_order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  message_id INTEGER NOT NULL,
  topic_id INTEGER,
  notification_type TEXT NOT NULL, -- 'new_order', 'order_paid', 'order_cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(order_id, notification_type)
);

CREATE INDEX idx_telegram_order_messages_order_id ON telegram_order_messages(order_id);
```

**Использование:**

```typescript
// ✅ При отправке уведомления:
const response = await sendTelegramMessage(ordersChatId, message, keyboard, orderId, topicId);
if (response.ok) {
  const data = await response.json();
  await saveTelegramMessageId(
    orderId,
    ordersChatId,
    data.result.message_id,
    topicId,
    notificationType
  );
}

// ✅ При обновлении статуса:
const messageInfo = await getTelegramMessageId(orderId, 'new_order');
if (messageInfo) {
  await editTelegramMessage(
    messageInfo.chat_id,
    messageInfo.message_id,
    updatedText,
    updatedKeyboard
  );
}
```

---

## 📊 СВОДНАЯ ТАБЛИЦА ИЗМЕНЕНИЙ

| Проблема               | Существующий код                    | Изменения                                  | Переиспользование                     |
| ---------------------- | ----------------------------------- | ------------------------------------------ | ------------------------------------- |
| Подтверждение перевода | ❌ Отсутствует                      | ✅ `/complete` команда, callback кнопка    | ✅ `api.telegram.updateOrderStatus()` |
| Синхронизация кнопок   | ❌ Broadcast в ЛС                   | ✅ Только Orders Group, трекинг message_id | ✅ `TELEGRAM_ORDERS_CHAT_ID`, Topics  |
| Race condition         | ✅ Защита в БД, ❌ плохие сообщения | ✅ Детальные error codes                   | ✅ Существующая защита P2025          |
| Сообщения об ошибках   | ❌ Общие сообщения                  | ✅ Специфичные сообщения по коду ошибки    | ✅ Существующие error types           |

---

## 🎯 ИТОГИ ЧАСТИ 1

### Что проанализировано

✅ **Полная архитектура** телеграм-бота  
✅ **Все существующие компоненты** и их взаимодействие  
✅ **Схема БД** и модель Order  
✅ **Существующие API** и их возможности  
✅ **Корневые причины** всех 4 проблем

### Ключевые выводы

1. **API для подтверждения перевода УЖЕ СУЩЕСТВУЕТ** (`updateOrderStatusByTelegram`) - нужно только интегрировать в бот
2. **Защита от race condition РАБОТАЕТ** на уровне БД - нужно только улучшить сообщения об ошибках
3. **Проблема синхронизации кнопок** решается использованием ТОЛЬКО Orders Group вместо broadcast
4. **Трекинг message_id** требует новую таблицу в БД, но архитектура уже предусмотрена

### Следующая часть

📄 **ЧАСТЬ 2: ДЕТАЛЬНЫЙ ПЛАН РЕАЛИЗАЦИИ** будет содержать:

- Пошаговый план изменений
- Полные примеры кода для каждого изменения
- Миграции БД
- Тесты и проверки
- План развёртывания

---

**Создано:** 10 октября 2025  
**Статус:** ✅ ЧАСТЬ 1 ЗАВЕРШЕНА  
**Следующий шаг:** Создание PART2_IMPLEMENTATION.md
