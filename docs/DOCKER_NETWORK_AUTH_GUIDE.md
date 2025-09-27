# Docker Network Authentication Guide

## 📋 Обзор

Система аутентификации для внутренних вызовов в Docker сети, заменяющая API_SECRET_KEY аутентификацию для изолированных контейнеров.

## 🎯 Проблема

**ИСХОДНАЯ СИТУАЦИЯ:**

- `systemApiMiddleware` требовал `API_SECRET_KEY` для всех системных вызовов
- Telegram-bot в Docker сети не имел внешнего доступа
- Архитектурное противоречие: Docker изоляция vs API key аутентификация

## ✅ РЕШЕНИЕ: Docker Network Authentication

### Принцип работы

```typescript
// apps/web/src/server/trpc/middleware/docker-network-auth.ts

1. ПРОВЕРКА IP АДРЕСА:
   - Docker internal IPs: 172.16-31.x.x
   - Development mode: unknown IP разрешен

2. ПРОВЕРКА ЗАГОЛОВКОВ:
   - Docker service names в Host header
   - Внутренние Docker маршруты

3. FALLBACK К API_SECRET_KEY:
   - Для внешних системных вызовов
   - Обратная совместимость
```

### Архитектура безопасности

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   External      │    │   Docker         │    │   Web App       │
│   Requests      │    │   Network        │    │   (port 3000)   │
│                 │    │                  │    │                 │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ ❌ IP: Public    │───▶│ 🔒 API_SECRET_KEY │───▶│ ✅ Authorized    │
│ 🔑 Auth: API Key │    │    Required      │    │    System Call  │
└─────────────────┘    └──────────────────┘    └─────────────────┘

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Telegram Bot    │    │   Docker         │    │   Web App       │
│ (container)     │    │   Network        │    │   (port 3000)   │
│                 │    │                  │    │                 │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ ✅ IP: 172.x.x.x │───▶│ ✅ Docker Network │───▶│ ✅ Authorized    │
│ 🏠 Auth: Network │    │    Auth          │    │    System Call  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Техническая реализация

### 1. Docker Network Middleware

```typescript
export const dockerNetworkMiddleware = publicProcedure.use(async ({ ctx, next }) => {
  const ip = ctx.ip;

  // Development: разрешить local requests
  if (process.env.NODE_ENV === 'development' && (!ip || ip === 'unknown')) {
    return next({ ctx: { ...ctx, isSystemCall: true, authMethod: 'docker-network-dev' } });
  }

  // Production: проверить Docker network IP
  if (ip && isDockerNetworkIP(ip)) {
    return next({ ctx: { ...ctx, isSystemCall: true, authMethod: 'docker-network-ip' } });
  }

  // Fallback: API_SECRET_KEY для внешних вызовов
  const apiKey = ctx.req.headers.authorization?.replace('Bearer ', '');
  if (apiKey && apiKey === process.env.API_SECRET_KEY) {
    return next({ ctx: { ...ctx, isSystemCall: true, authMethod: 'api-secret-key' } });
  }

  throw createUnauthorizedError('Access denied: not from Docker network or invalid API key');
});
```

### 2. Docker IP Detection

```typescript
function isDockerNetworkIP(ip: string): boolean {
  const dockerNetworkPatterns = [
    /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/, // Custom networks
    /^172\.17\.\d+\.\d+$/, // Default bridge
    /^::ffff:172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/, // IPv6 mapped
  ];
  return dockerNetworkPatterns.some(pattern => pattern.test(ip));
}
```

### 3. Integration

```typescript
// auth.ts - экспорт нового middleware
export { dockerNetworkMiddleware, systemApiMiddleware } from './docker-network-auth';

// telegram-bot.ts - используется без изменений
export const telegramBotRouter = createTRPCRouter({
  takeOrderByTelegram: systemApiMiddleware
    .input(z.object({ orderId: z.string(), telegramOperatorId: z.string() }))
    .mutation(async ({ input }) => {
      /* implementation */
    }),
});
```

## 🐳 Docker Configuration

### docker-compose.yml

```yaml
services:
  web:
    container_name: exchanger-web
    ports:
      - '3000:3000' # Внешний доступ
    networks:
      - exchanger-network

  telegram-bot:
    container_name: exchanger-telegram-bot
    # БЕЗ портов - только внутренний доступ
    networks:
      - exchanger-network
    environment:
      - WEB_APP_URL=http://web:3000
      - API_SECRET_KEY=fallback_key_here # Для совместимости

networks:
  exchanger-network:
    driver: bridge # Создает изолированную сеть с внутренними IP
```

## 🔍 Методы аутентификации

### 1. **docker-network-ip** (Основной)

- **Когда**: Production режим, IP из Docker сети
- **Проверка**: `172.16-31.x.x` диапазон
- **Безопасность**: Высокая для изолированной Docker сети

### 2. **docker-network-dev** (Development)

- **Когда**: Development режим, локальные запросы
- **Проверка**: `ip === 'unknown'` или отсутствует
- **Безопасность**: Только для development

### 3. **api-secret-key** (Fallback)

- **Когда**: Внешние системные вызовы
- **Проверка**: `Authorization: Bearer {API_SECRET_KEY}`
- **Безопасность**: Требует секретный ключ

## ✅ Преимущества решения

### Безопасность

- ✅ **Изоляция сети**: Только Docker контейнеры имеют доступ
- ✅ **Автоматическая аутентификация**: Без управления ключами
- ✅ **Fallback механизм**: API_SECRET_KEY для внешних вызовов
- ✅ **Development friendly**: Поддержка local development

### Архитектура

- ✅ **Соответствие принципам**: Docker network isolation
- ✅ **Обратная совместимость**: systemApiMiddleware alias
- ✅ **Расширяемость**: Легко добавить новые проверки
- ✅ **Централизация**: Один middleware для всех системных вызовов

### Операционные

- ✅ **Простота деплоя**: Нет управления API ключами
- ✅ **Масштабируемость**: Работает с любым количеством контейнеров
- ✅ **Мониторинг**: Логирование метода аутентификации
- ✅ **Debug friendly**: Понятные error messages

## 🧪 Тестирование

### Development режим

```bash
# Telegram bot → Web app
curl -X POST http://localhost:3000/api/trpc/telegramBot.takeOrderByTelegram \
  -H "Content-Type: application/json" \
  -d '{"orderId": "test-id", "telegramOperatorId": "123"}'

# Должен пройти с authMethod: 'docker-network-dev'
```

### Docker режим

```bash
# Внутри telegram-bot контейнера
curl -X POST http://web:3000/api/trpc/telegramBot.takeOrderByTelegram \
  -H "Content-Type: application/json" \
  -d '{"orderId": "test-id", "telegramOperatorId": "123"}'

# Должен пройти с authMethod: 'docker-network-ip'
```

### Внешний вызов

```bash
# С внешнего IP с API ключом
curl -X POST http://localhost:3000/api/trpc/telegramBot.takeOrderByTelegram \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_secret_key" \
  -d '{"orderId": "test-id", "telegramOperatorId": "123"}'

# Должен пройти с authMethod: 'api-secret-key'
```

## 🔧 Troubleshooting

### Проблема: "Access denied: not from Docker network"

**Диагностика:**

```typescript
// Добавить логирование в middleware
console.log('IP:', ctx.ip);
console.log('Headers:', ctx.req.headers);
console.log('Environment:', process.env.NODE_ENV);
```

**Решения:**

1. Проверить что контейнеры в одной сети
2. Проверить что IP попадает в Docker диапазон
3. Добавить API_SECRET_KEY для fallback

### Проблема: Development режим не работает

**Решение:**

```bash
# Установить NODE_ENV=development
export NODE_ENV=development

# Или в .env файле
NODE_ENV=development
```

## 📊 Мониторинг и логирование

### Метрики для отслеживания

- Количество запросов по методам аутентификации
- Процент успешных Docker network аутентификаций
- Количество fallback к API_SECRET_KEY
- Количество заблокированных запросов

### Логи для анализа

```typescript
logger.info('DOCKER_NETWORK_AUTH', {
  ip: ctx.ip,
  authMethod: ctx.authMethod,
  headers: ctx.req.headers.host,
  success: true,
});
```

---

## 🎯 Результат

Система Docker Network Authentication обеспечивает:

- ✅ **Безопасную** аутентификацию внутренних Docker сервисов
- ✅ **Простую** интеграцию без управления API ключами
- ✅ **Гибкую** поддержку различных режимов (dev/prod)
- ✅ **Совместимую** fallback систему для внешних вызовов

Telegram bot теперь может безопасно вызывать API web приложения через изолированную Docker сеть без необходимости в API_SECRET_KEY.
