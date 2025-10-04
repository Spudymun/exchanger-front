# Диаграмма последовательности: Отмена заявки пользователем

## 🔄 Полный цикл отмены заявки

```mermaid
sequenceDiagram
    participant User as 👤 Пользователь
    participant Browser as 🌐 Browser
    participant OrderPage as 📄 OrderPageClient
    participant Dialog as 💬 OrderActions Dialog
    participant tRPC as 🔌 tRPC Client
    participant API as ⚙️ user.orders.cancelOrder
    participant DB as 🗄️ PostgreSQL
    participant TelegramAPI as 📲 Telegram Bot API
    participant Operators as 👥 Операторы

    Note over User,Operators: PHASE 1: User Interaction

    User->>Browser: Открывает страницу заказа /order/[orderId]
    Browser->>OrderPage: Render OrderPageClient
    OrderPage->>tRPC: useOrderStatus(orderId) - fetch current status
    tRPC-->>OrderPage: Order data (status: 'pending')
    OrderPage->>Dialog: Render OrderActions (if status === 'pending')

    User->>Dialog: Клик "Отменить заказ"
    Dialog->>Dialog: setIsCancelDialogOpen(true)
    Dialog->>User: Показать диалог подтверждения

    Note over User,Dialog: Диалог содержит:<br/>- Заголовок<br/>- Предупреждение<br/>- Кнопки: "Да, отменить" / "Нет, вернуться"

    alt Пользователь подтверждает отмену
        User->>Dialog: Клик "Да, отменить"
        Dialog->>OrderPage: handleCancelConfirm() → onCancelOrder()
        OrderPage->>OrderPage: handleCancelOrder()

        Note over OrderPage,API: PHASE 2: Backend Processing

        OrderPage->>tRPC: cancelOrderMutation.mutate({ orderId })
        tRPC->>API: POST /api/trpc/user.orders.cancelOrder

        Note over API: Middleware: protectedProcedure<br/>(проверка сессии)

        API->>API: validateUserAccess(ctx.user.id)
        API->>API: validateOrderAccess(orderId, user.email)

        alt Order status NOT in ['pending', 'processing']
            API-->>tRPC: Error: "Order cannot be cancelled"
            tRPC-->>OrderPage: onError
            OrderPage->>Browser: notifications.handleApiError()
            Browser->>User: ❌ Error notification
        else Order status OK
            API->>DB: UPDATE orders SET status='cancelled' WHERE id=orderId
            DB-->>API: Updated order data

            Note over API,TelegramAPI: PHASE 3: Telegram Notification

            API->>TelegramAPI: sendCancellationNotification(order, user.email)

            Note over TelegramAPI: Payload:<br/>- order: { id, email, crypto, fiat }<br/>- depositAddress<br/>- notificationType: 'order_cancelled'

            TelegramAPI->>TelegramAPI: createOperatorMessage(payload)
            TelegramAPI->>TelegramAPI: getAuthorizedOperators()

            loop Для каждого оператора
                TelegramAPI->>Operators: POST https://api.telegram.org/bot.../sendMessage
                Operators-->>TelegramAPI: Message sent
            end

            TelegramAPI-->>API: Notification complete (или graceful fail)

            Note over API: Telegram ошибка НЕ блокирует<br/>успешную отмену заявки

            API-->>tRPC: { id, status: 'cancelled', message }

            Note over OrderPage: PHASE 4: UI Update

            tRPC->>OrderPage: onSuccess(data)
            OrderPage->>Browser: notifications.success('Заявка отменена')
            OrderPage->>tRPC: utils.exchange.getOrderStatus.invalidate({ orderId })
            tRPC->>API: Refetch order status
            API->>DB: SELECT * FROM orders WHERE id=orderId
            DB-->>API: Order with status='cancelled'
            API-->>tRPC: Updated order data
            tRPC-->>OrderPage: Cache updated
            OrderPage->>Browser: Re-render with new status
            Browser->>User: ✅ Success notification + Updated UI
        end

    else Пользователь отменяет диалог
        User->>Dialog: Клик "Нет, вернуться"
        Dialog->>Dialog: setIsCancelDialogOpen(false)
        Dialog->>Browser: Закрыть диалог
        Browser->>User: Возврат к странице заказа
    end
```

---

## 📊 Диаграмма состояний заказа

```mermaid
stateDiagram-v2
    [*] --> PENDING: Заказ создан

    PENDING --> PROCESSING: Оператор взял в работу
    PENDING --> CANCELLED: Пользователь отменил (user.orders.cancelOrder)

    PROCESSING --> COMPLETED: Оператор завершил обработку
    PROCESSING --> CANCELLED: Пользователь отменил (user.orders.cancelOrder)
    PROCESSING --> FAILED: Ошибка обработки

    COMPLETED --> [*]: Финальное состояние
    CANCELLED --> [*]: Финальное состояние
    FAILED --> [*]: Финальное состояние

    note right of CANCELLED
        Отмена возможна только из:
        - PENDING
        - PROCESSING

        НЕ возможна из:
        - COMPLETED
        - CANCELLED (уже отменен)
        - FAILED
    end note
```

---

## 🔒 Security Flow

```mermaid
flowchart TD
    A[User clicks Cancel] --> B{Authenticated?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{User owns order?}
    D -->|No| E[403 Forbidden]
    D -->|Yes| F{Status cancellable?}
    F -->|No| G[400 Bad Request:<br/>Cannot cancel in current status]
    F -->|Yes| H[Update DB:<br/>status = CANCELLED]
    H --> I{Telegram URL configured?}
    I -->|No| J[Skip notification]
    I -->|Yes| K[Send Telegram notification]
    K --> L{Notification sent?}
    L -->|Yes| M[Log success]
    L -->|No| N[Log error<br/>Continue execution]
    J --> O[Return success response]
    M --> O
    N --> O
    O --> P[Invalidate cache]
    P --> Q[Show success notification]

    style H fill:#90EE90
    style O fill:#90EE90
    style C fill:#FFB6C1
    style E fill:#FFB6C1
    style G fill:#FFB6C1
    style N fill:#FFA500
```

---

## 📱 Telegram Message Flow

```mermaid
flowchart LR
    A[sendCancellationNotification] --> B[Fetch to /api/notify-operators]
    B --> C[validatePayload]
    C --> D[createOperatorMessage]
    D --> E{notificationType?}
    E -->|order_cancelled| F[TEMPLATES.ORDER_CANCELLED_MESSAGE]
    E -->|new_order| G[TEMPLATES.FRESH/REUSED_WALLET_MESSAGE]
    F --> H[Format message with:<br/>❌ Icon<br/>Order ID<br/>User email<br/>Crypto amount<br/>Fiat amount]
    H --> I[getAuthorizedOperators]
    I --> J[Loop operators]
    J --> K[Send to Telegram API]
    K --> L[Operator receives notification]

    style F fill:#FFE4B5
    style H fill:#FFE4B5
    style L fill:#90EE90
```

---

## 🎯 Component Interaction

```mermaid
graph TB
    A[OrderPageClient.tsx] --> B[handleCancelOrder]
    B --> C[cancelOrderMutation.mutate]
    C --> D[tRPC: user.orders.cancelOrder]

    A --> E[OrderStatus component]
    E --> F[OrderActionsSection]
    F --> G[OrderActions component]
    G --> H[Cancel Button]
    H --> I[Dialog open]
    I --> J[Confirm Button]
    J --> K[handleCancelConfirm]
    K --> L[onCancelOrder callback]
    L --> B

    D --> M[API: cancelOrder endpoint]
    M --> N[validateUserAccess]
    M --> O[validateOrderAccess]
    M --> P[Check CANCELLABLE_ORDER_STATUSES]
    M --> Q[orderManager.update]
    Q --> R[PostgreSQL UPDATE]
    M --> S[sendCancellationNotification]
    S --> T[POST /api/notify-operators]
    T --> U[Telegram Bot]

    D --> V[onSuccess callback]
    V --> W[notifications.success]
    V --> X[utils.invalidate]
    X --> Y[Refetch order data]
    Y --> Z[UI update]

    style A fill:#E6F3FF
    style G fill:#FFE6E6
    style M fill:#E6FFE6
    style T fill:#FFF4E6
```

---

## 🔄 Cache Invalidation Flow

```mermaid
sequenceDiagram
    participant Mutation as cancelOrderMutation
    participant Cache as React Query Cache
    participant API as tRPC API
    participant UI as OrderPage UI

    Note over Mutation,UI: After successful cancellation

    Mutation->>Cache: onSuccess triggered
    Mutation->>Cache: utils.exchange.getOrderStatus.invalidate({ orderId })
    Cache->>Cache: Mark query as stale
    Cache->>API: Refetch getOrderStatus({ orderId })
    API-->>Cache: Fresh order data (status: 'cancelled')
    Cache->>UI: Trigger re-render with new data
    UI->>UI: Update OrderStatus component
    UI->>UI: Hide OrderActions (cancelled status)
    UI->>UI: Show cancelled badge

    Note over UI: User sees:<br/>✅ Success notification<br/>❌ Cancelled status<br/>No action buttons
```

---

## 📝 Error Handling Flow

```mermaid
flowchart TD
    A[cancelOrderMutation.mutate] --> B{Request successful?}
    B -->|Yes| C[onSuccess]
    B -->|No| D[onError]

    C --> E[Show success notification]
    C --> F[Invalidate cache]
    C --> G[UI updates automatically]

    D --> H{Error type?}
    H -->|Network Error| I[Show: 'Network error'<br/>Suggest: Retry]
    H -->|401 Unauthorized| J[Show: 'Session expired'<br/>Action: Redirect to login]
    H -->|403 Forbidden| K[Show: 'Access denied'<br/>Reason: Not your order]
    H -->|400 Bad Request| L[Show: 'Cannot cancel'<br/>Reason: Invalid status]
    H -->|500 Server Error| M[Show: 'Server error'<br/>Action: Contact support]

    I --> N[notifications.handleApiError]
    J --> N
    K --> N
    L --> N
    M --> N

    N --> O[Display error toast]
    O --> P[User stays on page]

    style C fill:#90EE90
    style D fill:#FFB6C1
    style N fill:#FFA500
```

---

## 💾 Database Transaction

```sql
-- Транзакция отмены заказа
BEGIN;

-- 1. Проверка существования заказа
SELECT id, status, user_email
FROM orders
WHERE id = $orderId
  AND user_email = $userEmail
FOR UPDATE; -- Блокировка строки

-- 2. Проверка статуса (в коде TypeScript)
-- CANCELLABLE_ORDER_STATUSES = ['pending', 'processing']

-- 3. Обновление статуса (если проверки прошли)
UPDATE orders
SET
    status = 'cancelled',
    updated_at = NOW()
WHERE id = $orderId
RETURNING *;

COMMIT;

-- В случае ошибки:
-- ROLLBACK;
```

---

## 🔌 API Contract

### Request:

```typescript
POST /api/trpc/user.orders.cancelOrder

Headers:
  Content-Type: application/json
  Cookie: sessionId=...

Body:
{
  "orderId": "cm41g6tjb0006kl8o56j1dytv"
}
```

### Success Response (200):

```typescript
{
  "result": {
    "data": {
      "id": "cm41g6tjb0006kl8o56j1dytv",
      "status": "cancelled",
      "message": "Order cancelled successfully"
    }
  }
}
```

### Error Responses:

```typescript
// 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Not authenticated"
  }
}

// 403 Forbidden
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied to this order"
  }
}

// 400 Bad Request
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Order cannot be cancelled in current status"
  }
}
```

---

## 📊 Метрики и мониторинг

### Ключевые метрики:

1. **Cancellation Rate:**
   - % отмененных заказов от общего числа
   - Разбивка по статусам (pending vs processing)

2. **Cancellation Time:**
   - Среднее время от создания до отмены
   - Распределение по временным интервалам

3. **Notification Success Rate:**
   - % успешных Telegram уведомлений
   - Время доставки уведомления

4. **Error Rate:**
   - Частота ошибок при отмене
   - Типы ошибок (auth, validation, db)

### Логирование:

```typescript
// Frontend
console.log('User cancelled order:', orderId);

// Backend
logger.info('ORDER_CANCELLED_BY_USER', {
  orderId,
  userId: user.id,
  userEmail: user.email,
  previousStatus: order.status,
  timestamp: new Date().toISOString(),
});

// Telegram
logger.info('CANCELLATION_NOTIFICATION_SENT', {
  orderId,
  operatorsNotified: 5,
  success: true,
});
```

---

**Диаграммы готовы для использования в документации и презентациях.**
