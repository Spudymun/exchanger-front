# Telegram Notifications Retry Fix

## Проблема

### Симптомы

- BullMQ jobs помечались как `COMPLETED`, хотя уведомления в Telegram не отправлялись
- В логах были ошибки отправки (`TELEGRAM_NOTIFY_OPERATOR_FAILED`), но retry не происходил
- Задания не попадали в DELAYED/FAILED состояние для повторных попыток

### Пример из логов

```
2025-10-19T23:36:53.386Z INFO[telegram-notify-operators] TELEGRAM_NOTIFY_ALL_OPERATORS_COMPLETE
{
  "notifiedCount": 0,
  "errorCount": 2,
  "totalOperators": 2,
  "successRate": "0.0%"
}
2025-10-19T23:36:53.395Z INFO[telegram-notification-worker] JOB_COMPLETED ❌
```

### Root Cause

#### 1. Ошибки перехватывались и не пробрасывались

В `apps/telegram-bot/pages/api/notify-operators.ts` функция `notifyOperator()` **перехватывала** все ошибки Telegram API и возвращала `false` вместо того чтобы **бросить исключение**:

```typescript
// ❌ БЫЛО:
} catch (error) {
  logger.warn('Failed to notify operator', {...});
  return false; // ← Ошибка поглощалась
}
```

#### 2. HTTP endpoint всегда возвращал 200 OK

Функция `processNotifications()` **всегда возвращала HTTP 200**, даже если `notifiedCount === 0`:

```typescript
// ❌ БЫЛО:
res.status(HTTP_STATUS.OK).json({
  success: true, // ← Всегда true!
  notifiedCount: 0,
  errorCount: 2,
});
```

#### 3. Worker видел успешный ответ

Worker в `apps/telegram-bot/src/workers/telegram-notification-worker.ts` проверял только `response.ok`:

```typescript
if (!response.ok) {
  throw new Error(`Telegram API error`);
}
// ✅ response.ok === true → Job помечался COMPLETED
```

### Последствия

- **Потерянные уведомления**: Операторы не получали критически важные уведомления о заказах
- **False positive**: Система считала что уведомления отправлены, хотя это не так
- **Невозможность отладки**: BullMQ Dashboard показывал COMPLETED вместо FAILED

---

## Решение

### 1. Пробрасывание ошибок Telegram API

**Файл**: `apps/telegram-bot/pages/api/notify-operators.ts`

**Изменение в `notifyOperator()`**:

```typescript
// ✅ СТАЛО:
} catch (error) {
  logger.error('TELEGRAM_NOTIFY_OPERATOR_EXCEPTION', {...});
  throw error; // ← Пробрасываем ошибку дальше
}
```

**Результат**: Любая ошибка от Telegram API (неправильный chat_id, token, network error) теперь **пробрасывается** до worker'а.

### 2. Promise.allSettled для broadcast

**Изменение в `sendOperatorNotifications()`**:

```typescript
// ✅ СТАЛО:
const results = await Promise.allSettled(
  operatorIds.map((operatorId) => notifyOperator(...))
);

const errorCount = results.filter((r) => r.status === 'rejected').length;

// ✅ Если хотя бы один оператор не получил уведомление → бросаем ошибку
if (errorCount > 0) {
  const firstError = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
  throw new Error(
    `Failed to notify ${errorCount} of ${operatorIds.length} operators: ${firstError.reason}`
  );
}
```

**Результат**:

- Все операторы получают уведомления **параллельно** (быстрее)
- Если **хотя бы один** не получил → **весь батч retry**
- Гарантируется доставка **всем** операторам

### 3. Worker автоматически обрабатывает ошибки

Worker **уже корректно настроен** на retry:

```typescript
// apps/telegram-bot/src/workers/telegram-notification-worker.ts
} catch (error) {
  logger.error('JOB_FAILED', {...});
  throw error; // ← BullMQ автоматически retry через backoff
}
```

**BullMQ автоматически**:

- Помечает job как `FAILED`
- Добавляет в очередь с **exponential backoff** (1s → 2s → 4s → 8s → 16s)
- После 5 попыток → `Dead Letter Queue` (manual intervention)

---

## Настройки Retry

### Константы BullMQ

**Файл**: `packages/constants/src/telegram-queue.ts`

```typescript
export const TELEGRAM_QUEUE_CONSTANTS = {
  RETRY: {
    MAX_ATTEMPTS: 5,
    BACKOFF: {
      TYPE: 'exponential',
      DELAY_MS: 1000, // Начальная задержка: 1 секунда
    },
  },
} as const;
```

### Таймлайн повторных попыток

| Attempt | Delay | Total Time |
| ------- | ----- | ---------- |
| 1       | 0s    | 0s         |
| 2       | 1s    | 1s         |
| 3       | 2s    | 3s         |
| 4       | 4s    | 7s         |
| 5       | 8s    | 15s        |
| DLQ     | ∞     | Final      |

---

## Тестирование

### 1. Проверка с неправильными Chat ID

```bash
# В .env временно установить неправильные ID
AUTHORIZED_TELEGRAM_OPERATORS=123456789,987654321

# Перезапустить telegram-bot
docker-compose up -d --force-recreate telegram-bot

# Создать тестовый заказ в web app
# → Проверить BullMQ Dashboard (localhost:3010)
```

**Ожидаемый результат**:

- Job должен попасть в **DELAYED** (retry)
- После 5 попыток → **FAILED**
- В логах: `TELEGRAM_NOTIFY_OPERATOR_EXCEPTION`

### 2. Проверка с правильными Chat ID

```bash
# В .env установить реальные ID
AUTHORIZED_TELEGRAM_OPERATORS=621882329,8068430102
TELEGRAM_ORDERS_CHAT_ID=-1003037178274

docker-compose up -d --force-recreate telegram-bot
```

**Ожидаемый результат**:

- Job сразу **COMPLETED**
- Уведомления приходят в Telegram
- В логах: `Operator notified successfully`

---

## Мониторинг

### Логи Worker

```bash
# Проверить логи worker'а
docker logs exchanger-telegram-bot --tail 100 | grep "JOB_"

# Проверить ошибки Telegram API
docker logs exchanger-telegram-bot --tail 200 | grep "TELEGRAM_API_ERROR"
```

### BullMQ Dashboard

URL: http://localhost:3010/queue/telegram-notifications

**Метрики**:

- **COMPLETED**: Успешно отправленные уведомления
- **DELAYED**: В процессе retry (1-5 попыток)
- **FAILED**: Достигли MAX_ATTEMPTS, требуется вмешательство
- **ACTIVE**: Обрабатываются прямо сейчас

---

## Lessons Learned

### 1. **Не глушить ошибки в API endpoints для очередей**

Если endpoint используется worker'ом из очереди, **любая ошибка должна пробрасываться** для корректного retry.

### 2. **HTTP 200 не всегда означает успех**

В нашем случае `{ success: true, notifiedCount: 0 }` был ложно-положительным результатом.

### 3. **Promise.allSettled для broadcast**

Когда нужно отправить уведомления нескольким получателям:

- `Promise.all()` - прервётся на первой ошибке
- `Promise.allSettled()` - попробует всех, потом проверим результаты

### 4. **BullMQ Dashboard - критичный инструмент мониторинга**

Без dashboard'а мы бы не заметили, что jobs помечаются COMPLETED при ошибках.

---

## Связанные файлы

- `apps/telegram-bot/pages/api/notify-operators.ts` - HTTP endpoint для отправки уведомлений
- `apps/telegram-bot/src/workers/telegram-notification-worker.ts` - BullMQ Worker
- `packages/constants/src/telegram-queue.ts` - Константы очереди
- `packages/utils/src/telegram-queue/telegram-queue-producer.ts` - Producer (добавление jobs)
- `.env` - Переменные окружения (Chat IDs, операторы)
- `docker-compose.yml` - Проброс переменных в контейнер

---

## Дата исправления

2025-10-20

## Автор

AI Agent + Developer Review
