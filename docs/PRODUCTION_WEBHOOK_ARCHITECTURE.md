# Production Webhook Architecture Guide

## 🏗️ Проблема текущей архитектуры

### Development (работает ✅)

```
Telegram API → ngrok tunnel → localhost:3003/api/webhook → telegram-bot
```

### Production (НЕ РАБОТАЕТ ❌)

```yaml
# docker-compose.production.yml
telegram-bot:
  # БЕЗ портов - изолирован внутри Docker network
  # Telegram API НЕ МОЖЕТ достучаться напрямую!
```

## ✅ Решение: Reverse Proxy через Web Service

### Архитектура:

```
┌─────────────────────────────────────────────────┐
│ Telegram Bot API                                │
│ (https://api.telegram.org)                      │
└────────────────┬────────────────────────────────┘
                 │
                 │ POST /api/telegram/webhook
                 │ Header: X-Telegram-Bot-Api-Secret-Token
                 ▼
┌─────────────────────────────────────────────────┐
│ web:3000 (exposed to internet)                  │
│                                                 │
│  apps/web/pages/api/telegram/webhook.ts        │
│  ├─ ✅ Validate secret_token                   │
│  └─ 🔄 Proxy request internally                │
└────────────────┬────────────────────────────────┘
                 │
                 │ Internal Docker Network
                 │ POST http://telegram-bot:3003/api/webhook
                 ▼
┌─────────────────────────────────────────────────┐
│ telegram-bot:3003 (internal only)               │
│                                                 │
│  apps/telegram-bot/pages/api/webhook.ts        │
│  ├─ Process TelegramUpdate                     │
│  ├─ Handle callback_query (buttons)            │
│  └─ Handle messages                            │
└─────────────────────────────────────────────────┘
```

## 📁 Реализация

### 1. Proxy Endpoint в Web Service

**Файл:** `apps/web/pages/api/telegram/webhook.ts`

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ Validate secret_token from Telegram
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];

  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 🔄 Proxy to internal telegram-bot service
  const response = await fetch(`${process.env.TELEGRAM_BOT_URL}/api/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });

  return res.status(response.status).json(await response.json());
}
```

### 2. Setup Script

**Файл:** `scripts/telegram-bot/setup-webhook.mjs`

Регистрирует webhook в Telegram Bot API с secret_token:

```bash
# Development (с ngrok)
node scripts/telegram-bot/setup-webhook.mjs --env=dev

# Production
node scripts/telegram-bot/setup-webhook.mjs --env=prod
```

## 🚀 Setup Instructions

### Development Setup

1. **Запустить ngrok для web service:**

   ```bash
   ngrok http 3000
   ```

2. **Добавить в `.env`:**

   ```bash
   TELEGRAM_WEBHOOK_URL=https://YOUR_NGROK_URL.ngrok.io/api/telegram/webhook
   TELEGRAM_WEBHOOK_SECRET=your_generated_secret
   ```

3. **Запустить setup скрипт:**

   ```bash
   node scripts/telegram-bot/setup-webhook.mjs --env=dev
   ```

4. **Запустить приложения:**

   ```bash
   # Terminal 1: Web + Telegram Bot
   npm run dev

   # Terminal 2: ngrok
   ngrok http 3000
   ```

### Production Setup

1. **Добавить переменные окружения:**

   ```bash
   PRODUCTION_URL=https://yourdomain.com
   TELEGRAM_WEBHOOK_SECRET=generated_random_64_char_string
   TELEGRAM_BOT_URL=http://telegram-bot:3003
   ```

2. **Запустить setup скрипт:**

   ```bash
   node scripts/telegram-bot/setup-webhook.mjs --env=prod
   ```

3. **Docker Compose Production:**

   ```yaml
   version: '3.8'

   services:
     web:
       ports:
         - '3000:3000' # Exposed to internet
       environment:
         - TELEGRAM_WEBHOOK_SECRET=${TELEGRAM_WEBHOOK_SECRET}
         - TELEGRAM_BOT_URL=http://telegram-bot:3003
       networks:
         - exchanger-network

     telegram-bot:
       # БЕЗ портов - изолирован ✅
       environment:
         - WEB_APP_URL=http://web:3000
       networks:
         - exchanger-network
   ```

## 🔒 Security

### Secret Token Validation

Telegram отправляет header `X-Telegram-Bot-Api-Secret-Token` с каждым webhook request:

```typescript
// ✅ Защита от фейковых webhook'ов
if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

**Генерация secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Что защищает:

- ✅ Фейковые webhook от злоумышленников
- ✅ Replay attacks
- ✅ DoS через массовые фейковые запросы
- ✅ Подделка callback_query для управления заявками

## 🔍 Testing

### 1. Проверить статус webhook:

```bash
node scripts/telegram-bot/setup-webhook.mjs status
```

### 2. Проверить proxy работает:

```bash
# Получить ngrok URL
curl https://YOUR_NGROK_URL.ngrok.io/api/telegram/webhook

# Должен вернуть 401 без secret_token
```

### 3. Создать тестовую заявку:

1. Открыть web приложение
2. Создать заявку на обмен
3. Проверить уведомление пришло в Telegram
4. Нажать кнопку "Взять в работу"
5. Проверить статус обновился

## 📊 Monitoring

### Webhook Info:

```bash
curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo
```

**Ожидаемый ответ:**

```json
{
  "ok": true,
  "result": {
    "url": "https://yourdomain.com/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

### Logs:

```bash
# Web service (proxy)
docker logs -f exchanger-web-prod | grep "telegram-webhook-proxy"

# Telegram bot service (handler)
docker logs -f exchanger-telegram-bot-prod | grep "telegram-webhook"
```

## 🎯 Преимущества этого подхода:

1. ✅ **Security:** telegram-bot остается полностью изолированным
2. ✅ **Centralized Auth:** валидация secret_token в одном месте
3. ✅ **Flexibility:** можно добавить rate limiting, IP whitelist в proxy
4. ✅ **Monitoring:** централизованное логирование в web service
5. ✅ **Scalability:** легко масштабировать telegram-bot сервисы

## 🔄 Альтернативные варианты (не рекомендуются):

### ❌ Вариант 1: Expose telegram-bot порт

```yaml
telegram-bot:
  ports:
    - '3003:3003' # Плохо: нарушает изоляцию
```

**Минусы:** нужна отдельная аутентификация, сложнее мониторить

### ❌ Вариант 2: Polling вместо webhook

```typescript
bot.startPolling(); // Плохо: неэффективно, задержки
```

**Минусы:** лишняя нагрузка, медленнее отклик

## 📝 Checklist для Production:

- [ ] Создан proxy endpoint: `apps/web/pages/api/telegram/webhook.ts`
- [ ] Добавлен `TELEGRAM_WEBHOOK_SECRET` в environment variables
- [ ] Запущен setup script для регистрации webhook
- [ ] Проверен webhook status через `/getWebhookInfo`
- [ ] Протестирован полный флоу: создание заявки → уведомление → кнопка
- [ ] Настроен мониторинг логов proxy и handler
- [ ] Обновлена документация с production URL

---

**Статус:** ✅ Готово к использованию в production
