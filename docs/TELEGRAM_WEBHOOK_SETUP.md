# Telegram Bot Webhook Setup Guide

## 📋 Обзор

Данное руководство описывает процесс настройки webhook для Telegram бота в проекте ExchangeGO. Webhook необходим для обработки callback queries (нажатий кнопок) от пользователей в Telegram.

## 🎯 Цель

Настроить двустороннюю связь между Telegram ботом и нашим приложением:

- **Отправка уведомлений** → от приложения к Telegram
- **Обработка кнопок** → от Telegram к приложению

## 🔧 Архитектура

```
[Пользователь] → [Telegram] → [ngrok] → [localhost:3003] → [webhook.ts]
     ↑                                                            ↓
[Telegram API] ← [localhost:3003] ← [telegram-bot.ts] ← [handleTelegramUpdate]
```

## 📚 Компоненты системы

### 1. **Telegram Bot API**

- **URL**: `https://api.telegram.org/bot{TOKEN}/`
- **Методы**: `setWebhook`, `sendMessage`, `answerCallbackQuery`
- **Токен**: `8080670068:AAG94FIreDoNJ_xc4aLFkxg0yKdSc-aV0cE`

### 2. **ngrok Tunnel**

- **Назначение**: Предоставляет внешний HTTPS URL для localhost
- **Текущий URL**: `https://5c9af761033a.ngrok-free.app`
- **Перенаправление**: `https://5c9af761033a.ngrok-free.app` → `http://localhost:3003`

### 3. **Webhook Endpoint**

- **Файл**: `apps/telegram-bot/pages/api/webhook.ts`
- **URL**: `/api/webhook`
- **Метод**: `POST`
- **Обрабатывает**: callback_query, message

### 4. **Telegram Bot Handler**

- **Файл**: `apps/telegram-bot/src/lib/telegram-bot.ts`
- **Функция**: `handleTelegramUpdate()`
- **Обрабатывает**: команды, callback queries

## 🚀 Пошаговая настройка

### Шаг 1: Запуск ngrok

```bash
# Установить ngrok
# Скачать с https://ngrok.com/

# Запустить тоннель для порта 3003
ngrok http 3003
```

**Результат**: Получаете URL вида `https://xxxxxxxx.ngrok-free.app`

### Шаг 2: Настройка webhook в Telegram

#### Вариант A: Через браузер

```
https://api.telegram.org/bot8080670068:AAG94FIreDoNJ_xc4aLFkxg0yKdSc-aV0cE/setWebhook?url=https://YOUR_NGROK_URL.ngrok-free.app/api/webhook
```

### Пример:

```
https://api.telegram.org/bot8080670068:AAG94FIreDoNJ_xc4aLFkxg0yKdSc-aV0cE/setWebhook?url=https://YOUR_NGROK_URL.ngrok-free.app/api/webhook
```

#### Вариант B: Через PowerShell

```powershell
Invoke-RestMethod -Uri "https://api.telegram.org/bot8080670068:AAG1LtOO0INbJFOXhj5--WHWRvImewP866E/setWebhook?url=https://853b1a14d4ba.ngrok-free.app/api/webhook" -Method Post
```

#### Вариант C: Через curl

```bash
curl -X POST "https://api.telegram.org/bot8080670068:AAG94FIreDoNJ_xc4aLFkxg0yKdSc-aV0cE/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_NGROK_URL.ngrok-free.app/api/webhook"}'
```

**Ожидаемый ответ**:

```json
{
  "ok": true,
  "result": true,
  "description": "webhook was set"
}
```

### Шаг 3: Запуск приложений

```bash
# Терминал 1: Web приложение
cd apps/web
npm run dev  # localhost:3000

# Терминал 2: Telegram bot
cd apps/telegram-bot
npm run dev  # localhost:3003

# Терминал 3: ngrok (если еще не запущен)
ngrok http 3003
```

## 🔍 Тестирование

### 1. Проверка webhook статуса

```
https://api.telegram.org/bot8080670068:AAG94FIreDoNJ_xc4aLFkxg0yKdSc-aV0cE/getWebhookInfo
```

### 2. Создание заявки

1. Открыть `http://localhost:3000`
2. Создать заявку на обмен
3. Получить уведомление в Telegram

### 3. Тестирование кнопок

1. Нажать "✅ Взять в работу" в Telegram
2. Проверить логи в терминале `telegram-bot`
3. Убедиться что статус заявки изменился

## 📊 Логирование

### Успешная обработка callback:

```
[DEBUG] Received webhook update
[INFO] Callback query processed
[DEBUG] Order status updated
```

### Ошибки:

```
[ERROR] Invalid webhook payload
[WARN] Unauthorized callback query
[ERROR] Failed to update order status
```

## 🛠️ Структура данных

### Callback Query от Telegram:

```json
{
  "update_id": 123456789,
  "callback_query": {
    "id": "callback_query_id",
    "from": {
      "id": 621882329,
      "first_name": "User"
    },
    "message": {
      "message_id": 123,
      "chat": {
        "id": 621882329,
        "type": "private"
      }
    },
    "data": "take_order_1c8390a7-ac59-445e-b754-618985df433d"
  }
}
```

### Формат callback_data:

- **Взять заявку**: `take_order_{orderId}`
- **Детали заявки**: `order_details_{orderId}`
- **Завершить заявку**: `complete_order_{orderId}`
- **Отменить заявку**: `cancel_order_{orderId}`

## ⚙️ Конфигурация

### Environment Variables:

```bash
# apps/telegram-bot/.env
TELEGRAM_BOT_TOKEN=8080670068:AAG1LtOO0INbJFOXhj5--WHWRvImewP866E
TELEGRAM_BOT_USERNAME=exchangego_operators_bot
AUTHORIZED_TELEGRAM_OPERATORS=621882329
WEB_APP_URL=http://localhost:3000
NODE_ENV=development
PORT=3003
```

### Turbo.json configuration:

```json
{
  "tasks": {
    "dev": {
      "env": ["TELEGRAM_BOT_TOKEN", "AUTHORIZED_TELEGRAM_OPERATORS"]
    }
  }
}
```

## 🔧 Troubleshooting

### Проблема: Кнопки не работают

**Решение**: Проверить что webhook настроен правильно:

```
https://api.telegram.org/bot8080670068:AAG94FIreDoNJ_xc4aLFkxg0yKdSc-aV0cE/getWebhookInfo
```

### Проблема: ngrok URL изменился

**Решение**: Обновить webhook с новым URL:

```bash
# Получить новый URL из ngrok
# Выполнить setWebhook с новым URL
```

### Проблема: "chat not found"

**Решение**: Пользователь должен написать боту `/start` перед получением уведомлений.

### Проблема: 502 Bad Gateway

**Решение**: Убедиться что `localhost:3003` запущен и доступен.

## 📝 Дополнительные команды

### Удалить webhook:

```
https://api.telegram.org/bot8080670068:AAG94FIreDoNJ_xc4aLFkxg0yKdSc-aV0cE/deleteWebhook
```

### Получить информацию о боте:

```
https://api.telegram.org/bot8080670068:AAG94FIreDoNJ_xc4aLFkxg0yKdSc-aV0cE/getMe
```

### Получить обновления напрямую (для отладки):

```
https://api.telegram.org/bot8080670068:AAG94FIreDoNJ_xc4aLFkxg0yKdSc-aV0cE/getUpdates
```

## 🔒 Безопасность

### Рекомендации:

1. **Не публиковать токен бота** в открытых репозиториях
2. **Использовать HTTPS** для webhook URL (ngrok предоставляет)
3. **Валидировать callback queries** перед обработкой
4. **Проверять авторизацию оператора** перед выполнением действий

### Проверка подлинности запроса:

```typescript
// Опционально: проверка секрета webhook
const secretToken = req.headers['x-telegram-bot-api-secret-token'];
if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

## 📈 Мониторинг

### Метрики для отслеживания:

- Количество входящих webhook запросов
- Время обработки callback queries
- Процент успешных обновлений статуса заявок
- Количество ошибок аутентификации

### Логи для мониторинга:

```typescript
logger.info('WEBHOOK_STATS', {
  totalRequests: count,
  successRate: percentage,
  averageProcessingTime: ms,
});
```

---

## 🎯 Результат

После выполнения всех шагов вы получите:

- ✅ Работающие уведомления о новых заявках
- ✅ Интерактивные кнопки в Telegram
- ✅ Обработку действий операторов
- ✅ Обновление статусов заявок через Telegram

Система готова к использованию в режиме development с возможностью масштабирования для production.
