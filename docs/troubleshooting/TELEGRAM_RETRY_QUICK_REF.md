# Telegram Notifications - Краткая шпаргалка

## 🐛 Проблема

Jobs в BullMQ помечались как **COMPLETED**, хотя уведомления **не отправлялись** в Telegram из-за неправильных Chat ID.

## ✅ Исправление

### 1. **Пробрасывание ошибок Telegram API**

```typescript
// apps/telegram-bot/pages/api/notify-operators.ts

// ❌ БЫЛО:
catch (error) {
  logger.warn('Failed...');
  return false; // Глушило ошибку
}

// ✅ СТАЛО:
catch (error) {
  logger.error('Failed...');
  throw error; // Пробрасывает для retry
}
```

### 2. **Promise.allSettled для broadcast**

```typescript
// ✅ СТАЛО:
const results = await Promise.allSettled(
  operatorIds.map(id => notifyOperator(id, ...))
);

if (results.some(r => r.status === 'rejected')) {
  throw new Error('Failed to notify some operators');
}
```

## 🔁 Retry логика

| Attempt | Delay | Behavior            |
| ------- | ----- | ------------------- |
| 1       | 0s    | Первая попытка      |
| 2       | 1s    | Exponential backoff |
| 3       | 2s    | ...                 |
| 4       | 4s    | ...                 |
| 5       | 8s    | Последняя попытка   |
| DLQ     | ∞     | Manual intervention |

## 📊 Мониторинг

```bash
# Логи worker'а
docker logs exchanger-telegram-bot --tail 50 | grep "JOB_"

# BullMQ Dashboard
open http://localhost:3010/queue/telegram-notifications
```

## 🧪 Тест

```bash
# 1. Неправильные ID → должны быть DELAYED/FAILED
AUTHORIZED_TELEGRAM_OPERATORS=123456789,987654321

# 2. Правильные ID → должны быть COMPLETED
AUTHORIZED_TELEGRAM_OPERATORS=621882329,8068430102
```

## 📁 Файлы

- `apps/telegram-bot/pages/api/notify-operators.ts` - API endpoint
- `apps/telegram-bot/src/workers/telegram-notification-worker.ts` - Worker
- `.env` - Chat IDs
- `docs/troubleshooting/TELEGRAM_NOTIFICATIONS_RETRY_FIX.md` - Полная документация
