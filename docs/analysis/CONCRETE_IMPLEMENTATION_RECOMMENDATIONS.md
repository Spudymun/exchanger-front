# Финальная архитектура Redis + PostgreSQL для множественных приложений

> **Дата**: 11 сентября 2025  
> **Статус**: ФИНАЛИЗИРОВАННАЯ АРХИТЕКТУРА  
> **Основа**: Детальное обсуждение изоляции сессий и взаимодействия компонентов

## 🏗️ Финальная архитектура баз данных

### PostgreSQL: Схема с общей идентификацией

```
┌─────────────────────┐  ┌─────────────────────┐
│  exchanger_identity │  │   exchanger_web     │
│      (SHARED)       │  │    (WEB ONLY)       │
│                     │  │                     │
│ ┌─────────────────┐ │  │ ┌─────────────────┐ │
│ │ users           │ │  │ │ orders          │ │
│ │ sessions        │ │  │ │ payments        │ │
│ │ permissions     │ │  │ │ exchange_rates  │ │
│ │ user_profiles   │ │  │ │ analytics       │ │
│ └─────────────────┘ │  │ │ transactions    │ │
└─────────────────────┘  │ └─────────────────┘ │
                         └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│  exchanger_admin    │  │   exchanger_bot     │
│   (ADMIN ONLY)      │  │    (BOT ONLY)       │
│                     │  │                     │
│ ┌─────────────────┐ │  │ ┌─────────────────┐ │
│ │ admin_settings  │ │  │ │ conversations   │ │
│ │ audit_logs      │ │  │ │ messages        │ │
│ │ reports         │ │  │ │ notifications   │ │
│ │ system_metrics  │ │  │ │ bot_state       │ │
│ │ configurations  │ │  │ │ user_commands   │ │
│ └─────────────────┘ │  │ └─────────────────┘ │
└─────────────────────┘  └─────────────────────┘
```

### Redis: Схема пространств имен

```
Redis Instance (Single Container)
├── identity:session:web:abc123...      ← Веб-сессии
├── identity:session:admin:def789...    ← Админ-сессии
├── identity:session:telegram:ghi012... ← Телеграм-сессии
├── identity:user:web:user_456          ← Кэш веб-пользователей
├── identity:user:admin:admin_123       ← Кэш админов
├── identity:user:telegram:bot_345      ← Кэш телеграм-пользователей
├── cache:web:rates:usd_uah            ← Кэш курсов для веба
├── cache:admin:metrics:daily          ← Кэш метрик для админки
└── cache:telegram:commands:help       ← Кэш команд для бота
```

## 📋 Детальная схема баз данных

### 1. Base Identity Database (`exchanger_identity`)

```sql
-- Общая база идентификации и сессий
CREATE DATABASE exchanger_identity;

-- Таблица пользователей (общая)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица сессий с контекстом приложения
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL,
  application_context VARCHAR(50) NOT NULL, -- 'web', 'admin', 'telegram'
  session_data JSONB,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Таблица разрешений (общая)
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission VARCHAR(100) NOT NULL,
  application_context VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_user_perm FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, permission, application_context)
);

-- Индексы для производительности
CREATE INDEX idx_sessions_app_context ON sessions(application_context, user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_user_permissions_context ON user_permissions(application_context, user_id);
```

### 2. Web Application Database (`exchanger_web`)

```sql
-- База бизнес-логики веб-приложения
CREATE DATABASE exchanger_web;

-- Ордера на обмен
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Ссылка на exchanger_identity.users
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  exchange_rate DECIMAL(18, 8) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Платежи
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  user_id UUID NOT NULL,
  payment_method VARCHAR(100) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Курсы валют
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  rate DECIMAL(18, 8) NOT NULL,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,

  UNIQUE(from_currency, to_currency, valid_from)
);

-- Аналитика
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Admin Panel Database (`exchanger_admin`)

```sql
-- База администрирования
CREATE DATABASE exchanger_admin;

-- Настройки системы
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID NOT NULL, -- Ссылка на exchanger_identity.users
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Логи аудита
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL, -- Ссылка на exchanger_identity.users
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Отчеты
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  parameters JSONB,
  generated_by UUID NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  file_path VARCHAR(500)
);

-- Метрики системы
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(255) NOT NULL,
  metric_value DECIMAL(18, 8),
  tags JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Telegram Bot Database (`exchanger_bot`)

```sql
-- База телеграм-бота
CREATE DATABASE exchanger_bot;

-- Диалоги пользователей
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  user_id UUID, -- Ссылка на exchanger_identity.users (если привязан)
  state VARCHAR(100) DEFAULT 'idle',
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(telegram_user_id)
);

-- Сообщения
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  message_id BIGINT NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- 'text', 'photo', 'document', etc.
  content JSONB NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Уведомления
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Ссылка на exchanger_identity.users
  telegram_user_id BIGINT,
  message TEXT NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Состояние бота
CREATE TABLE bot_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Команды пользователей
CREATE TABLE user_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  command VARCHAR(255) NOT NULL,
  parameters JSONB,
  executed_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Redis: Пространства имен и TTL

### Схема ключей Redis

```typescript
// Типы ключей Redis
type RedisKey =
  // Сессии
  | `identity:session:${ApplicationContext}:${string}` // TTL: 24h
  | `identity:user:${ApplicationContext}:${string}` // TTL: 1h

  // Кэш данных приложений
  | `cache:web:rates:${string}` // TTL: 5min
  | `cache:web:orders:${string}` // TTL: 30min
  | `cache:admin:metrics:${string}` // TTL: 15min
  | `cache:admin:reports:${string}` // TTL: 1h
  | `cache:telegram:conversations:${string}` // TTL: 24h
  | `cache:telegram:commands:${string}`; // TTL: 1h

type ApplicationContext = 'web' | 'admin' | 'telegram';
```

### TTL (Time To Live) стратегии

```typescript
const REDIS_TTL = {
  // Сессии
  SESSION: 24 * 60 * 60, // 24 часа
  USER_CACHE: 60 * 60, // 1 час

  // Веб-кэш
  EXCHANGE_RATES: 5 * 60, // 5 минут
  ORDER_CACHE: 30 * 60, // 30 минут

  // Админ-кэш
  ADMIN_METRICS: 15 * 60, // 15 минут
  ADMIN_REPORTS: 60 * 60, // 1 час

  // Телеграм-кэш
  TELEGRAM_CONVERSATIONS: 24 * 60 * 60, // 24 часа
  TELEGRAM_COMMANDS: 60 * 60, // 1 час
} as const;
```

## 🔄 Механизмы взаимодействия Redis ↔ PostgreSQL

### 1. Двухуровневая система хранения сессий

```typescript
class SessionStorage {
  constructor(
    private redis: Redis,
    private identityDb: PrismaClient,
    private appContext: ApplicationContext
  ) {}

  async createSession(userId: string, sessionData: SessionData): Promise<Session> {
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + REDIS_TTL.SESSION * 1000);

    // 1. Сохраняем в PostgreSQL (персистентное хранилище)
    const session = await this.identityDb.session.create({
      data: {
        id: sessionId,
        userId,
        applicationContext: this.appContext,
        sessionData: sessionData as any,
        expiresAt,
      },
    });

    // 2. Кэшируем в Redis (быстрый доступ)
    const redisKey = `identity:session:${this.appContext}:${sessionId}`;
    await this.redis.setex(
      redisKey,
      REDIS_TTL.SESSION,
      JSON.stringify({
        ...sessionData,
        userId,
        expiresAt: expiresAt.toISOString(),
      })
    );

    return session;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const redisKey = `identity:session:${this.appContext}:${sessionId}`;

    // 1. Проверяем Redis (быстро)
    const cached = await this.redis.get(redisKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. Fallback на PostgreSQL (медленнее, но надежно)
    const session = await this.identityDb.session.findFirst({
      where: {
        id: sessionId,
        applicationContext: this.appContext,
        expiresAt: { gt: new Date() },
      },
    });

    if (session) {
      // Восстанавливаем кэш
      await this.redis.setex(
        redisKey,
        REDIS_TTL.SESSION,
        JSON.stringify({
          ...session.sessionData,
          userId: session.userId,
          expiresAt: session.expiresAt.toISOString(),
        })
      );

      return session.sessionData as SessionData;
    }

    return null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const redisKey = `identity:session:${this.appContext}:${sessionId}`;

    // Удаляем из обоих хранилищ
    await Promise.all([
      this.redis.del(redisKey),
      this.identityDb.session.delete({
        where: {
          id: sessionId,
          applicationContext: this.appContext,
        },
      }),
    ]);
  }
}
```

### 2. Синхронизация пользовательских данных

```typescript
class UserCache {
  constructor(
    private redis: Redis,
    private identityDb: PrismaClient,
    private appContext: ApplicationContext
  ) {}

  async getUserData(userId: string): Promise<UserData | null> {
    const redisKey = `identity:user:${this.appContext}:${userId}`;

    // Проверяем кэш
    const cached = await this.redis.get(redisKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Загружаем из базы
    const user = await this.identityDb.user.findUnique({
      where: { id: userId },
      include: {
        permissions: {
          where: { applicationContext: this.appContext },
        },
      },
    });

    if (user) {
      const userData = {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        permissions: user.permissions.map(p => p.permission),
        lastActive: new Date().toISOString(),
      };

      // Кэшируем на час
      await this.redis.setex(redisKey, REDIS_TTL.USER_CACHE, JSON.stringify(userData));

      return userData;
    }

    return null;
  }

  async invalidateUserCache(userId: string): Promise<void> {
    // Очищаем кэш во всех контекстах приложений
    const keys = [
      `identity:user:web:${userId}`,
      `identity:user:admin:${userId}`,
      `identity:user:telegram:${userId}`,
    ];

    await this.redis.del(...keys);
  }
}
```

### 3. Кэширование специфичных данных приложений

```typescript
class ApplicationCache {
  constructor(
    private redis: Redis,
    private appDb: PrismaClient, // Специфичная база приложения
    private appContext: ApplicationContext
  ) {}

  // Пример для веб-приложения: кэш курсов валют
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
    const redisKey = `cache:web:rates:${fromCurrency}_${toCurrency}`;

    const cached = await this.redis.get(redisKey);
    if (cached) {
      return parseFloat(cached);
    }

    // Загружаем из базы веб-приложения
    const rate = await this.appDb.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
      orderBy: { validFrom: 'desc' },
    });

    if (rate) {
      await this.redis.setex(redisKey, REDIS_TTL.EXCHANGE_RATES, rate.rate.toString());

      return rate.rate.toNumber();
    }

    return null;
  }

  // Пример для админ-панели: кэш метрик
  async getSystemMetrics(metricName: string): Promise<SystemMetric[]> {
    const redisKey = `cache:admin:metrics:${metricName}`;

    const cached = await this.redis.get(redisKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const metrics = await this.appDb.systemMetric.findMany({
      where: {
        metricName,
        recordedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Последние 24 часа
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    await this.redis.setex(redisKey, REDIS_TTL.ADMIN_METRICS, JSON.stringify(metrics));

    return metrics;
  }
}
```

## 🛡️ Изоляция и безопасность

### 1. Адаптеры с контекстной изоляцией

```typescript
interface DatabaseAdapter {
  readonly context: ApplicationContext;
}

class IdentityAdapter implements DatabaseAdapter {
  readonly context: ApplicationContext;

  constructor(
    private db: PrismaClient,
    context: ApplicationContext
  ) {
    this.context = context;
  }

  async findSession(sessionId: string): Promise<Session | null> {
    // Автоматическая фильтрация по контексту приложения
    return this.db.session.findFirst({
      where: {
        id: sessionId,
        applicationContext: this.context, // Жесткая привязка к контексту!
        expiresAt: { gt: new Date() },
      },
    });
  }

  async findUserPermissions(userId: string): Promise<Permission[]> {
    // Только разрешения для текущего приложения
    return this.db.userPermission.findMany({
      where: {
        userId,
        applicationContext: this.context, // Изоляция по контексту!
      },
    });
  }
}

class WebAdapter implements DatabaseAdapter {
  readonly context = 'web' as const;

  constructor(private db: PrismaClient) {}

  async findUserOrders(userId: string): Promise<Order[]> {
    // Только ордера веб-приложения
    return this.db.order.findMany({
      where: { userId },
    });
  }
}

class AdminAdapter implements DatabaseAdapter {
  readonly context = 'admin' as const;

  constructor(private db: PrismaClient) {}

  async findAuditLogs(adminId: string): Promise<AuditLog[]> {
    // Только логи админки
    return this.db.auditLog.findMany({
      where: { adminId },
    });
  }
}
```

### 2. Фабрика с изоляцией доступа

```typescript
class DatabaseFactory {
  private static instances = new Map<
    ApplicationContext,
    {
      identity: IdentityAdapter;
      application: DatabaseAdapter;
      redis: Redis;
    }
  >();

  static createWebStack(): DatabaseStack {
    if (!this.instances.has('web')) {
      this.instances.set('web', {
        identity: new IdentityAdapter(identityDbClient, 'web'),
        application: new WebAdapter(webDbClient),
        redis: redisClient,
      });
    }

    return this.instances.get('web')!;
  }

  static createAdminStack(): DatabaseStack {
    if (!this.instances.has('admin')) {
      this.instances.set('admin', {
        identity: new IdentityAdapter(identityDbClient, 'admin'),
        application: new AdminAdapter(adminDbClient),
        redis: redisClient,
      });
    }

    return this.instances.get('admin')!;
  }

  static createTelegramStack(): DatabaseStack {
    if (!this.instances.has('telegram')) {
      this.instances.set('telegram', {
        identity: new IdentityAdapter(identityDbClient, 'telegram'),
        application: new TelegramAdapter(telegramDbClient),
        redis: redisClient,
      });
    }

    return this.instances.get('telegram')!;
  }
}
```

## 🔄 Практические схемы взаимодействия

### Сценарий 1: Создание сессии веб-пользователя

```
[Web Client] ──login──▶ [Web Server]
                            │
                            ▼
[Web Server] ──create session──▶ [DatabaseFactory.createWebStack()]
                                      │
                                      ├─▶ [IdentityAdapter('web')]
                                      │        │
                                      │        ▼
                                      │   [PostgreSQL: exchanger_identity]
                                      │   INSERT INTO sessions (
                                      │     id, user_id,
                                      │     application_context='web',
                                      │     session_data, expires_at
                                      │   )
                                      │
                                      └─▶ [Redis]
                                           SET identity:session:web:abc123
                                           TTL 24h
```

### Сценарий 2: Проверка сессии админа

```
[Admin Client] ──request──▶ [Admin Server]
                               │
                               ▼
[Admin Server] ──verify session──▶ [DatabaseFactory.createAdminStack()]
                                       │
                                       ├─▶ [Redis]
                                       │   GET identity:session:admin:def789
                                       │   ├─ HIT: return cached data
                                       │   └─ MISS: ──▶ [IdentityAdapter('admin')]
                                       │                     │
                                       │                     ▼
                                       │                [PostgreSQL: exchanger_identity]
                                       │                SELECT * FROM sessions
                                       │                WHERE id='def789'
                                       │                  AND application_context='admin'
                                       │                  AND expires_at > NOW()
                                       │
                                       └─▶ [Result: Может получить только админ-сессии]
```

### Сценарий 3: Попытка несанкционированного доступа

```
[Web Server] ──try access admin session──▶ [DatabaseFactory.createWebStack()]
                                              │
                                              ├─▶ [Redis]
                                              │   GET identity:session:web:admin_session_id
                                              │   └─ MISS (нет такого ключа в web namespace)
                                              │
                                              └─▶ [IdentityAdapter('web')]
                                                      │
                                                      ▼
                                                  [PostgreSQL: exchanger_identity]
                                                  SELECT * FROM sessions
                                                  WHERE id='admin_session_id'
                                                    AND application_context='web' ← FAIL!
                                                    AND expires_at > NOW()
                                                  └─ EMPTY RESULT
```

## 🎯 Итоговые преимущества архитектуры

### ✅ Достигнутая изоляция:

1. **Redis**: Пространства имен по приложениям
2. **PostgreSQL**: Фильтрация по `application_context` + отдельные базы
3. **Код**: Фабрики и адаптеры с жесткой привязкой к контексту

### ✅ Производительность:

1. **Redis**: Быстрый доступ к часто используемым данным
2. **PostgreSQL**: Надежное персистентное хранилище
3. **Кэширование**: Автоматическое восстановление кэша при промахах

### ✅ Безопасность:

1. **Физическая изоляция**: Отдельные базы для бизнес-логики
2. **Логическая изоляция**: Контекст приложения в общих данных
3. **Программная изоляция**: Адаптеры не могут получить чужие данные

### ✅ Масштабируемость:

1. **Горизонтальное масштабирование**: Каждое приложение независимо
2. **Вертикальное масштабирование**: Разные стратегии для разных баз
3. **Кэширование**: Снижение нагрузки на PostgreSQL

## 🔄 План миграции

### Этап 1: Создание новых баз данных

1. Создать `exchanger_identity`, `exchanger_web`, `exchanger_admin`, `exchanger_bot`
2. Настроить отдельных пользователей баз данных
3. Мигрировать данные из текущей единой базы

### Этап 2: Обновление Redis схемы

1. Добавить пространства имен в ключи
2. Обновить TTL стратегии
3. Мигрировать существующие сессии

### Этап 3: Обновление кода

1. Создать адаптеры с контекстной изоляцией
2. Обновить фабрики
3. Обновить приложения для использования новых адаптеров
