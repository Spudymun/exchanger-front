# Redis Connections Architecture

## 📊 Обзор

В проекте используется **3 Redis соединения**, что является **правильной и оптимальной архитектурой** для нашего случая.

---

## 🔍 Фактическое распределение соединений

### 1. Session Management (1 соединение)

**Файл**: `packages/session-management/src/factories/user-manager-factory.ts`

```typescript
private static async createSessionAdapter(
  redisConfig: RedisConfiguration,
  context: ApplicationContext
): Promise<SessionAdapter> {
  const redis = new Redis(redisConfig.url, {
    maxRetriesPerRequest: redisConfig.maxRetries || SESSION_CONSTANTS.REDIS.MAX_RETRIES,
  });

  return new RedisSessionAdapter(redis, context);
}
```

**Назначение**:

- Хранение сессий пользователей (`session:{sessionId}`)
- Контекстные префиксы (`web:session:*` / `admin:session:*`)

**Гарантия singleton**:

```typescript
// UserManagerFactory использует кеширование
private static cachedUserManager: UserManagerInterface | null = null;

public static async create(config?: ManagerConfiguration): Promise<UserManagerInterface> {
  if (this.cachedUserManager && this.cachedConfig === configKey) {
    return this.cachedUserManager; // ✅ Переиспользование
  }
  // Создание только при первом вызове
}
```

**Точка инициализации**: `apps/web/src/server/trpc/context.ts`

```typescript
// Вызывается в каждом запросе, но UserManager кешируется
const userManager = await UserManagerFactory.createForWeb();
```

---

### 2. Order Expiration - Commands (1 соединение)

**Файл**: `packages/exchange-core/src/services/order-expiration-service.ts`

```typescript
async initialize(): Promise<void> {
  // Основное подключение для операций
  this.redis = new Redis(redisUrl, {
    lazyConnect: false,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      return Math.min(times * 50, 2000);
    },
  });
}
```

**Назначение**:

- `SET order:expire:{orderId}` - установка TTL ключей
- `CONFIG SET notify-keyspace-events "Ex"` - настройка уведомлений
- `DEL order:expire:{orderId}` - удаление ключей
- `TTL order:expire:{orderId}` - проверка времени жизни

**Гарантия singleton**:

```typescript
// packages/exchange-core/src/server.ts
let expirationService: OrderExpirationService | null = null;

export async function getExpirationService(): Promise<OrderExpirationService> {
  if (!expirationService) {
    expirationService = new OrderExpirationService();
    await expirationService.initialize();
  }
  return expirationService; // ✅ Переиспользование
}
```

---

### 3. Order Expiration - Pub/Sub Listener (1 соединение)

**Файл**: `packages/exchange-core/src/services/order-expiration-service.ts`

```typescript
async initialize(): Promise<void> {
  // Отдельное подключение для Pub/Sub (требование Redis)
  this.listenerRedis = new Redis(redisUrl, {
    lazyConnect: false,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      return Math.min(times * 50, 2000);
    },
  });

  // Подписка на keyspace notifications
  await this.listenerRedis.config('SET', 'notify-keyspace-events', 'Ex');
  await this.listenerRedis.psubscribe('__keyevent@0__:expired');

  this.listenerRedis.on('pmessage', (pattern, channel, message) => {
    // Обработка истечения ключей
  });
}
```

**Назначение**:

- Подписка на события истечения Redis ключей (`__keyevent@0__:expired`)
- Мгновенная реакция на истечение TTL (не ждать 5 минут cron)
- Pub/Sub режим блокирует соединение для обычных команд

---

## ✅ Почему это правильная архитектура

### 1. Официальные требования ioredis

**Источник**: [ioredis официальная документация](https://github.com/redis/ioredis#pubsub)

> **"It's worth noticing that a connection (aka a Redis instance) can't play both roles at the same time."**
>
> "When a client issues `subscribe()` or `psubscribe()`, it enters the 'subscriber' mode. From that point, only commands that modify the subscription set are valid."

**Вывод**: Pub/Sub **требует отдельное соединение**.

### 2. Ответ автора ioredis

**Issue #1845**: "Is there ever a need for multiple Cluster instances?"

**Ответ luin (автор ioredis)**:

> "A single instance should be enough in a typical web application."

**Применение**: У нас **одно** соединение для обычных команд + **одно** для Pub/Sub = правильно.

### 3. Connection Pooling не требуется

**Issue #996**: "Will this project consider support connection pool?"

- **Статус**: Closed as `wontfix`
- **Причина**: ioredis использует **мультиплексирование** через одно TCP соединение
- **Пайплайнинг**: Несколько команд отправляются параллельно без блокировки

---

## 🎯 Обязательные требования при таком подходе

### ✅ 1. Singleton Pattern (КРИТИЧНО)

**Что проверить**:

```typescript
// ❌ НЕПРАВИЛЬНО - создание в каждом запросе
app.get('/api/data', async (req, res) => {
  const redis = new Redis(process.env.REDIS_URL); // Утечка соединений!
  const data = await redis.get('key');
  res.json(data);
});

// ✅ ПРАВИЛЬНО - singleton через замыкание или кеширование
let redisInstance: Redis | null = null;
function getRedis() {
  if (!redisInstance) {
    redisInstance = new Redis(process.env.REDIS_URL);
  }
  return redisInstance;
}
```

**Наша реализация**:

- ✅ `UserManagerFactory` - кеширование через статическое поле
- ✅ `getExpirationService()` - замыкание с проверкой
- ✅ `getCleanupCron()` - замыкание с проверкой

### ✅ 2. Graceful Shutdown

**Обязательно**: Закрывать соединения при остановке сервера.

```typescript
// apps/web/src/server/cleanup.ts (пример для будущего)
export async function gracefulShutdown() {
  console.log('Starting graceful shutdown...');

  // 1. Остановить cron
  const cron = await getCleanupCron();
  cron.stop();

  // 2. Закрыть Redis соединения
  const expirationService = await getExpirationService();
  await expirationService.disconnect();

  // 3. Закрыть Prisma
  await prisma.$disconnect();

  console.log('Graceful shutdown completed');
}

// В приложении
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

**Текущий статус**: ⚠️ TODO - добавить `disconnect()` методы.

### ✅ 3. Error Handling

**Обязательно**: Обрабатывать ошибки подключения.

```typescript
// ✅ У нас есть
this.redis = new Redis(redisUrl, {
  enableOfflineQueue: true,      // Кеширование команд при разрыве
  maxRetriesPerRequest: 3,       // Попытки повтора
  retryStrategy: (times: number) => {
    return Math.min(times * 50, 2000); // Exponential backoff
  },
});

// ✅ У нас есть fallback
catch (error) {
  this.logger.warn('Failed to initialize Redis, using MemorySessionAdapter fallback', {
    error: error instanceof Error ? error.message : String(error),
  });
  return new MemorySessionAdapter(context);
}
```

### ✅ 4. Connection Monitoring

**Рекомендуется**: Логировать состояние соединений.

```typescript
// Пример для добавления
redis.on('connect', () => {
  logger.info('REDIS_CONNECTED', { service: 'session-management' });
});

redis.on('error', error => {
  logger.error('REDIS_ERROR', {
    service: 'session-management',
    error: error.message,
  });
});

redis.on('close', () => {
  logger.warn('REDIS_CONNECTION_CLOSED', { service: 'session-management' });
});
```

**Текущий статус**: ⚠️ TODO - добавить event listeners.

### ✅ 5. Тестирование соединений

**Health Check**: Проверять доступность Redis.

```typescript
// scripts/health-check.ps1 - УЖЕ ЕСТЬ
Test-Component -Name "Redis Connection" -Points 1 -TestScript {
    docker exec exchanger-redis redis-cli PING
}
```

---

## 📝 Текущая архитектура в схеме

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────┐
                              │                     │
                              ▼                     ▼
┌──────────────────────────────────┐  ┌────────────────────────────────┐
│   UserManagerFactory             │  │   OrderExpirationService       │
│   (singleton через кеш)          │  │   (singleton через замыкание)  │
└──────────────────────────────────┘  └────────────────────────────────┘
                │                                    │
                │ (создает 1 раз)                   │ (создает 1 раз)
                ▼                                    ├─────────────┐
      ┌─────────────────┐                           ▼             ▼
      │ Redis Instance  │              ┌─────────────────┐  ┌──────────────────┐
      │   (sessions)    │              │ Redis Instance  │  │ Redis Instance   │
      └─────────────────┘              │   (commands)    │  │   (pub/sub)      │
             │                         └─────────────────┘  └──────────────────┘
             │                                  │                     │
             └──────────────────────────────────┼─────────────────────┘
                                                │
                                                ▼
                                    ┌─────────────────────┐
                                    │   Redis Server      │
                                    │   (Docker)          │
                                    └─────────────────────┘
```

---

## 🔧 Рекомендации по поддержке

### 1. Мониторинг количества соединений

```bash
# Проверить активные соединения к Redis
docker exec exchanger-redis redis-cli CLIENT LIST

# Ожидаемый результат: 3 соединения
# - 1 для session-management
# - 1 для order-expiration commands
# - 1 для order-expiration pub/sub
```

### 2. Логирование создания соединений

```typescript
// Добавить в каждое место создания Redis
logger.info('REDIS_INSTANCE_CREATED', {
  service: 'session-management',
  purpose: 'sessions',
  url: redisUrl.replace(/\/\/.*@/, '//***@'), // Скрыть пароль
});
```

### 3. Graceful Shutdown Handler

**TODO**: Создать файл `apps/web/src/server/graceful-shutdown.ts`:

```typescript
import { getCleanupCron } from './utils/cleanup-cron-singleton';
import { getExpirationService } from '@repo/exchange-core';
import { prisma } from '@repo/session-management';

export async function gracefulShutdown(): Promise<void> {
  console.log('🛑 Starting graceful shutdown...');

  try {
    // 1. Остановить cron jobs
    const cron = await getCleanupCron();
    cron.stop();
    console.log('✅ Cron stopped');

    // 2. Закрыть Redis соединения
    const expirationService = await getExpirationService();
    await expirationService.disconnect();
    console.log('✅ Redis connections closed');

    // 3. Закрыть Prisma
    await prisma.$disconnect();
    console.log('✅ Prisma disconnected');

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Register handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // nodemon restart
```

### 4. Добавить disconnect() методы

**TODO**: В `order-expiration-service.ts`:

```typescript
/**
 * Graceful shutdown - закрыть все Redis соединения
 */
async disconnect(): Promise<void> {
  if (this.redis) {
    await this.redis.quit();
    this.redis = null;
  }

  if (this.listenerRedis) {
    await this.listenerRedis.quit();
    this.listenerRedis = null;
  }

  logger.info('ORDER_EXPIRATION_SERVICE_DISCONNECTED');
}
```

---

## ⚠️ Антипаттерны (что НЕ делать)

### ❌ 1. Создание Redis в каждом запросе

```typescript
// ❌ НЕПРАВИЛЬНО
app.get('/api/session', async (req, res) => {
  const redis = new Redis(process.env.REDIS_URL);
  const session = await redis.get(`session:${req.sessionId}`);
  // Соединение НЕ закрыто - утечка памяти!
});
```

### ❌ 2. Создание нескольких Pub/Sub listeners

```typescript
// ❌ НЕПРАВИЛЬНО - несколько подписчиков на одно событие
const redis1 = new Redis();
redis1.psubscribe('__keyevent@0__:expired');

const redis2 = new Redis();
redis2.psubscribe('__keyevent@0__:expired'); // Дублирование!
```

### ❌ 3. Использование одного соединения для Pub/Sub и команд

```typescript
// ❌ НЕПРАВИЛЬНО
const redis = new Redis();
await redis.psubscribe('channel'); // Теперь в subscriber mode
await redis.set('key', 'value'); // ❌ ERROR! Только subscription команды разрешены
```

### ❌ 4. Игнорирование ошибок соединения

```typescript
// ❌ НЕПРАВИЛЬНО
const redis = new Redis(process.env.REDIS_URL);
// Нет error handler - приложение упадет при разрыве соединения
```

---

## 📚 Источники и документация

1. **ioredis официальная документация**: https://github.com/redis/ioredis
2. **Redis Pub/Sub**: https://redis.io/topics/pubsub
3. **ioredis Issue #996** (Connection Pool): https://github.com/redis/ioredis/issues/996
4. **ioredis Issue #1845** (Multiple instances): https://github.com/redis/ioredis/issues/1845

---

## 🎯 Чеклист для поддержки архитектуры

- [x] Singleton pattern для всех Redis соединений
- [x] Отдельное соединение для Pub/Sub
- [x] Кеширование UserManager через UserManagerFactory
- [x] Retry strategy с exponential backoff
- [x] Fallback на MemorySessionAdapter при недоступности Redis
- [ ] Graceful shutdown handler (TODO)
- [ ] disconnect() методы в сервисах (TODO)
- [ ] Connection monitoring через event listeners (TODO)
- [ ] Health check для Redis соединений (частично есть)
- [ ] Логирование создания/закрытия соединений (TODO)

---

## 🔄 История изменений

### 2025-10-12

- ✅ Изменено `enableOfflineQueue: false` → `true` для устойчивости к временным разрывам
- ✅ Добавлен `retryStrategy` с exponential backoff
- ✅ Увеличено `maxRetriesPerRequest` с 1 до 3

### 2025-10-11

- ✅ Создан OrderExpirationService с двумя соединениями (commands + pub/sub)
- ✅ Добавлен singleton pattern через `getExpirationService()`
- ✅ Реализован fallback механизм через OrderCleanupCron

---

## 💡 Итоговый вывод

**Текущая архитектура с 3 Redis соединениями является правильной и оптимальной:**

1. ✅ Соответствует официальным рекомендациям ioredis
2. ✅ Использует singleton pattern для предотвращения утечек
3. ✅ Разделяет Pub/Sub и обычные команды (требование Redis)
4. ✅ Имеет fallback механизмы при недоступности Redis
5. ✅ Использует retry strategy для устойчивости

**Необходимо добавить**:

- Graceful shutdown handler
- Connection monitoring
- Логирование жизненного цикла соединений
