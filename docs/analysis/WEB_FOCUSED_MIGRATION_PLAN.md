# WEB-Focused Migration Plan: Переход на новую архитектуру БД

> **Дата**: 11 сентября 2025  
> **Статус**: КОНКРЕТНЫЙ ПЛАН ИЗМЕНЕНИЙ  
> **Фокус**: ТОЛЬКО WEB приложение с заделом на будущее  
> **Этап разработки**: Можем создавать заново без миграции

## 🎯 СТРАТЕГИЯ: WEB-First с Future-Proof архитектурой

### Ключевые принципы:

- ✅ **ФОКУС ТОЛЬКО на WEB** - admin/telegram игнорируются
- ✅ **Архитектура готова к расширению** - легко добавить admin/telegram позже
- ✅ **Создаем заново** - без миграции существующих данных
- ✅ **Минимальные изменения** - максимальное переиспользование кода

## 📋 КОНКРЕТНЫЕ ИЗМЕНЕНИЯ

### 1. НОВАЯ СТРУКТУРА БАЗ ДАННЫХ

#### 1.1 PostgreSQL Databases (Dev/Prod)

```sql
-- Создаем только 2 БД вместо 4
CREATE DATABASE exchanger_identity;  -- Общая идентификация
CREATE DATABASE exchanger_web;       -- WEB приложение

-- exchanger_admin и exchanger_bot создадим позже при необходимости
```

#### 1.2 Schema Identity Database

```sql
-- exchanger_identity/schema.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL,
  application_context VARCHAR(50) NOT NULL DEFAULT 'web', -- Готовность к admin/telegram
  session_data JSONB,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission VARCHAR(100) NOT NULL,
  application_context VARCHAR(50) NOT NULL DEFAULT 'web', -- Готовность к расширению
  granted_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_user_perm FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, permission, application_context)
);

-- Индексы
CREATE INDEX idx_sessions_app_context ON sessions(application_context, user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_user_permissions_context ON user_permissions(application_context, user_id);
```

#### 1.3 Schema Web Database

```sql
-- exchanger_web/schema.sql
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

CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  rate DECIMAL(18, 8) NOT NULL,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,

  UNIQUE(from_currency, to_currency, valid_from)
);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. НОВАЯ СТРУКТУРА REDIS

#### 2.1 Redis Namespaces (только WEB)

```
Redis Instance (Single Container)
├── identity:session:web:abc123...      ← Веб-сессии (ТОЛЬКО WEB)
├── identity:user:web:user_456          ← Кэш веб-пользователей
├── cache:web:rates:usd_uah            ← Кэш курсов для веба
├── cache:web:orders:user_123          ← Кэш ордеров для веба
└── cache:web:analytics:daily          ← Кэш аналитики для веба

-- Готовность к будущему расширению:
-- identity:session:admin:*   (добавим позже)
-- identity:session:telegram:* (добавим позже)
```

#### 2.2 TTL Strategy (только WEB)

```typescript
const REDIS_TTL = {
  // Сессии WEB
  SESSION_WEB: 24 * 60 * 60, // 24 часа
  USER_CACHE_WEB: 60 * 60, // 1 час

  // Веб-кэш
  EXCHANGE_RATES: 5 * 60, // 5 минут
  ORDER_CACHE: 30 * 60, // 30 минут
  ANALYTICS_CACHE: 15 * 60, // 15 минут

  // Готовность к расширению:
  // SESSION_ADMIN: 24 * 60 * 60,    (добавим позже)
  // SESSION_TELEGRAM: 24 * 60 * 60, (добавим позже)
} as const;
```

### 3. ИЗМЕНЕНИЯ В КОДЕ

#### 3.1 Обновление констант (packages/constants)

**Файл: `packages/constants/src/session.ts`**

```typescript
export const SESSION_CONSTANTS = {
  ENVIRONMENTS: {
    MOCK: 'mock',
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
  } as const,

  // ✅ НОВОЕ: Application contexts с готовностью к расширению
  APPLICATION_CONTEXTS: {
    WEB: 'web',
    // ADMIN: 'admin',     // Добавим позже
    // TELEGRAM: 'telegram', // Добавим позже
  } as const,

  REDIS: {
    // ✅ НОВОЕ: Namespace prefixes
    IDENTITY_PREFIX: 'identity:',
    CACHE_PREFIX: 'cache:',

    // ✅ ИЗМЕНЕНО: Теперь формируется динамически
    // OLD: SESSION_PREFIX: 'session:',
    // NEW: identity:session:{context}:

    MAX_RETRIES: 3,
  } as const,

  // ✅ НОВОЕ: TTL constants
  TTL: {
    SESSION: 24 * 60 * 60, // 24 часа
    USER_CACHE: 60 * 60, // 1 час
    EXCHANGE_RATES: 5 * 60, // 5 минут
    ORDERS: 30 * 60, // 30 минут
    ANALYTICS: 15 * 60, // 15 минут
  } as const,

  DATABASE: {
    MAX_CONNECTIONS: 10,
    CONNECTION_TIMEOUT: 5000,
  } as const,
} as const;

// ✅ НОВЫЕ типы
export type ApplicationContext =
  (typeof SESSION_CONSTANTS.APPLICATION_CONTEXTS)[keyof typeof SESSION_CONSTANTS.APPLICATION_CONTEXTS];

export type SessionEnvironment =
  (typeof SESSION_CONSTANTS.ENVIRONMENTS)[keyof typeof SESSION_CONSTANTS.ENVIRONMENTS];
```

#### 3.2 Новые адаптеры с контекстом

**Файл: `packages/session-management/src/adapters/contextual-identity-adapter.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import type { User, CreateUserData, ApplicationContext } from '../types/index.js';

/**
 * ✅ НОВЫЙ: Адаптер с контекстной изоляцией для identity базы
 * Готов к расширению на admin/telegram
 */
export class ContextualIdentityAdapter {
  constructor(
    private identityDb: PrismaClient,
    private context: ApplicationContext = 'web' // Default WEB
  ) {}

  async findSession(sessionId: string): Promise<SessionData | null> {
    // Автоматическая фильтрация по контексту приложения
    const session = await this.identityDb.session.findFirst({
      where: {
        id: sessionId,
        applicationContext: this.context, // Жесткая привязка к WEB
        expiresAt: { gt: new Date() },
      },
    });

    return session ? (session.sessionData as SessionData) : null;
  }

  async createSession(userId: string, sessionData: SessionData): Promise<Session> {
    return this.identityDb.session.create({
      data: {
        id: generateSessionId(),
        userId,
        applicationContext: this.context, // Всегда WEB
        sessionData: sessionData as any,
        expiresAt: new Date(Date.now() + SESSION_CONSTANTS.TTL.SESSION * 1000),
      },
    });
  }

  async findUserPermissions(userId: string): Promise<Permission[]> {
    // Только разрешения для WEB приложения
    return this.identityDb.userPermission.findMany({
      where: {
        userId,
        applicationContext: this.context, // Изоляция по WEB контексту
      },
    });
  }

  // Готовность к расширению: метод легко адаптируется для admin/telegram
}
```

**Файл: `packages/session-management/src/adapters/contextual-redis-adapter.ts`**

```typescript
import { Redis } from 'ioredis';
import { SESSION_CONSTANTS } from '@repo/constants';
import type { SessionAdapter, SessionData, ApplicationContext } from '../types/index.js';

/**
 * ✅ НОВЫЙ: Redis адаптер с namespace изоляцией
 * Готов к расширению на admin/telegram
 */
export class ContextualRedisAdapter implements SessionAdapter {
  constructor(
    private redis: Redis,
    private context: ApplicationContext = 'web' // Default WEB
  ) {}

  private getSessionKey(sessionId: string): string {
    // ✅ НОВЫЙ формат: identity:session:web:abc123
    return `${SESSION_CONSTANTS.REDIS.IDENTITY_PREFIX}session:${this.context}:${sessionId}`;
  }

  private getUserCacheKey(userId: string): string {
    // ✅ НОВЫЙ формат: identity:user:web:user_456
    return `${SESSION_CONSTANTS.REDIS.IDENTITY_PREFIX}user:${this.context}:${userId}`;
  }

  async get(sessionId: string): Promise<SessionData | null> {
    try {
      const key = this.getSessionKey(sessionId);
      const data = await this.redis.get(key);

      if (!data) return null;

      const parsed = JSON.parse(data) as SessionData;

      // Проверка TTL
      if (parsed.expires_at < Date.now()) {
        await this.delete(sessionId);
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  async set(sessionId: string, data: SessionData, ttl: number): Promise<void> {
    try {
      const key = this.getSessionKey(sessionId);
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      throw new Error(
        `Failed to store session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      const key = this.getSessionKey(sessionId);
      await this.redis.del(key);
    } catch {
      // Delete errors are non-critical
    }
  }

  // ✅ НОВЫЙ: Кэширование пользователей с контекстом
  async cacheUser(userId: string, userData: any, ttl: number): Promise<void> {
    try {
      const key = this.getUserCacheKey(userId);
      await this.redis.setex(key, ttl, JSON.stringify(userData));
    } catch {
      // Cache errors are non-critical
    }
  }

  async getCachedUser(userId: string): Promise<any | null> {
    try {
      const key = this.getUserCacheKey(userId);
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // Готовность к расширению: легко адаптируется для admin/telegram
}
```

#### 3.3 Обновленная фабрика (ТОЛЬКО WEB)

**Файл: `packages/session-management/src/factories/web-focused-factory.ts`**

```typescript
import { SESSION_CONSTANTS } from '@repo/constants';
import { userManager as mockUserManager } from '@repo/exchange-core';

import { ContextualIdentityAdapter } from '../adapters/contextual-identity-adapter';
import { ContextualRedisAdapter } from '../adapters/contextual-redis-adapter';
import { WebUserManager } from '../managers/web-user-manager';

/**
 * ✅ НОВАЯ: WEB-focused фабрика с готовностью к расширению
 */
export class WebFocusedUserManagerFactory {
  private static cachedWebInstance: WebUserManager | null = null;

  /**
   * Создает UserManager ТОЛЬКО для WEB приложения
   */
  static async createWebStack(config: WebStackConfiguration = {}): Promise<WebUserManager> {
    // Используем кэш для production производительности
    if (this.cachedWebInstance && process.env.NODE_ENV === 'production') {
      return this.cachedWebInstance;
    }

    const environment = config.environment || getEnvironment();

    if (environment === SESSION_CONSTANTS.ENVIRONMENTS.MOCK) {
      return mockUserManager as WebUserManager; // Type assertion для совместимости
    }

    // Создаем адаптеры только для WEB контекста
    const identityAdapter = new ContextualIdentityAdapter(
      getIdentityPrismaClient(config.identity),
      'web' // Жестко задаем WEB контекст
    );

    const webAdapter = new WebDatabaseAdapter(getWebPrismaClient(config.web));

    const redisAdapter = new ContextualRedisAdapter(
      getRedisClient(config.redis),
      'web' // Жестко задаем WEB контекст
    );

    const webManager = new WebUserManager(identityAdapter, webAdapter, redisAdapter);

    // Кэшируем для производительности
    this.cachedWebInstance = webManager;

    return webManager;
  }

  /**
   * ✅ ГОТОВНОСТЬ К РАСШИРЕНИЮ: Методы для будущего
   * Пока заглушки, но структура готова
   */
  static async createAdminStack(): Promise<never> {
    throw new Error('Admin stack not implemented yet - WEB focus only');
  }

  static async createTelegramStack(): Promise<never> {
    throw new Error('Telegram stack not implemented yet - WEB focus only');
  }
}

interface WebStackConfiguration {
  environment?: SessionEnvironment;
  identity?: {
    url: string;
    maxConnections?: number;
  };
  web?: {
    url: string;
    maxConnections?: number;
  };
  redis?: {
    url: string;
    maxRetries?: number;
  };
}
```

### 4. ENVIRONMENT VARIABLES

#### 4.1 Новые переменные окружения

```bash
# .env.development
# ✅ НОВЫЕ: Раздельные подключения БД
DATABASE_IDENTITY_URL="postgresql://exchanger_user:exchanger_password@localhost:5432/exchanger_identity"
DATABASE_WEB_URL="postgresql://exchanger_user:exchanger_password@localhost:5432/exchanger_web"

# Готовность к расширению (пока закомментированы):
# DATABASE_ADMIN_URL="postgresql://exchanger_user:exchanger_password@localhost:5432/exchanger_admin"
# DATABASE_BOT_URL="postgresql://exchanger_user:exchanger_password@localhost:5432/exchanger_bot"

# Redis остается прежним
REDIS_URL="redis://localhost:6379"

# ✅ НОВОЕ: Контекст приложения (опционально)
APP_CONTEXT="web"
```

#### 4.2 Production variables

```bash
# .env.production
DATABASE_IDENTITY_URL="${DATABASE_IDENTITY_URL}"
DATABASE_WEB_URL="${DATABASE_WEB_URL}"
REDIS_URL="${REDIS_URL}"
APP_CONTEXT="web"
```

### 5. DOCKER CONFIGURATION

#### 5.1 Обновленный docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database (Multiple databases)
  postgres:
    image: postgres:15-alpine
    container_name: exchanger-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-exchanger_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-exchanger_password}
      # ✅ НОВОЕ: Multiple databases creation
      POSTGRES_MULTIPLE_DATABASES: 'exchanger_identity,exchanger_web'
    ports:
      - '${POSTGRES_PORT:-5432}:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      # ✅ НОВЫЕ: Отдельные init scripts
      - ./docker/postgres/init-identity.sql:/docker-entrypoint-initdb.d/01-init-identity.sql:ro
      - ./docker/postgres/init-web.sql:/docker-entrypoint-initdb.d/02-init-web.sql:ro
      - ./docker/postgres/create-multiple-dbs.sh:/docker-entrypoint-initdb.d/00-create-dbs.sh:ro
    networks:
      - exchanger-network
    healthcheck:
      test:
        [
          'CMD-SHELL',
          'pg_isready -U ${POSTGRES_USER:-exchanger_user} -d exchanger_identity && pg_isready -U ${POSTGRES_USER:-exchanger_user} -d exchanger_web',
        ]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis остается прежним
  redis:
    image: redis:7-alpine
    container_name: exchanger-redis
    restart: unless-stopped
    ports:
      - '${REDIS_PORT:-6379}:6379'
    volumes:
      - redis_data:/data
      - ./docker/redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - exchanger-network
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
# Остальные сервисы без изменений...
```

#### 5.2 Script для создания множественных БД

**Файл: `docker/postgres/create-multiple-dbs.sh`**

```bash
#!/bin/bash
# ✅ НОВЫЙ: Script для создания нескольких БД

set -e
set -u

function create_database() {
    local database=$1
    echo "Creating database '$database'"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE DATABASE $database;
        GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;
EOSQL
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
    echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
        create_database $db
    done
    echo "Multiple databases created"
fi
```

### 6. INTEGRATION POINTS (WEB приложение)

#### 6.1 Обновление tRPC context

**Файл: `apps/web/src/server/trpc/context.ts`**

```typescript
import { WebFocusedUserManagerFactory } from '@repo/session-management';

export async function createTRPCContext(opts: CreateTRPCContextOptions) {
  const { req, res } = opts;

  // ✅ ИЗМЕНЕНО: Используем новую WEB-focused фабрику
  const userManager = await WebFocusedUserManagerFactory.createWebStack({
    identity: { url: process.env.DATABASE_IDENTITY_URL! },
    web: { url: process.env.DATABASE_WEB_URL! },
    redis: { url: process.env.REDIS_URL! },
  });

  // Остальная логика остается прежней
  const sessionId = req.cookies.sessionId;
  const user = sessionId ? await userManager.validateSession(sessionId) : null;

  return {
    req,
    res,
    user,
    userManager,
  };
}
```

#### 6.2 Обновление auth router

**Файл: `apps/web/src/server/trpc/routers/auth.ts`**

```typescript
// ✅ БЕЗ ИЗМЕНЕНИЙ: Существующий код остается работать
// Изменения только внутри session-management package
```

## 📊 ПРЕИМУЩЕСТВА WEB-FOCUSED ПОДХОДА

### ✅ Немедленные выгоды:

1. **Фокус на важном**: Вся энергия на WEB приложение
2. **Простота внедрения**: Минимальные изменения в существующем коде
3. **Production готовность**: Изоляция сессий и данных
4. **Производительность**: Оптимизированный Redis namespace

### ✅ Future-Proof архитектура:

1. **Готовность к расширению**: Admin/Telegram добавляются без переписывания
2. **Контекстная изоляция**: Безопасность между приложениями
3. **Масштабируемость**: Каждое приложение независимо
4. **Отдельные БД**: Возможность разного масштабирования

## 🚀 ПЛАН ВНЕДРЕНИЯ

### Этап 1: Инфраструктура (1-2 дня)

- [ ] Создать init scripts для identity/web БД
- [ ] Обновить docker-compose с multiple databases
- [ ] Настроить environment variables
- [ ] Протестировать подключения

### Этап 2: Constants & Types (0.5 дня)

- [ ] Обновить `packages/constants/src/session.ts`
- [ ] Добавить новые типы `ApplicationContext`
- [ ] Обновить TTL константы

### Этап 3: Адаптеры (1-2 дня)

- [ ] Создать `ContextualIdentityAdapter`
- [ ] Создать `ContextualRedisAdapter`
- [ ] Создать `WebDatabaseAdapter`
- [ ] Unit тесты для адаптеров

### Этап 4: Factory & Manager (1 день)

- [ ] Создать `WebFocusedUserManagerFactory`
- [ ] Создать `WebUserManager`
- [ ] Integration тесты

### Этап 5: Integration (0.5 дня)

- [ ] Обновить tRPC context
- [ ] Протестировать auth flow
- [ ] E2E тестирование

### Этап 6: Documentation (0.5 дня)

- [ ] Обновить README
- [ ] Создать migration guide для будущих admin/telegram
- [ ] Performance benchmarks

**ИТОГО: 5-6 дней разработки**

## 🎯 ГОТОВНОСТЬ К РАСШИРЕНИЮ

Когда понадобится добавить admin/telegram:

1. **Добавить БД**: `exchanger_admin`, `exchanger_bot`
2. **Расширить константы**: Добавить `ADMIN`, `TELEGRAM` в `APPLICATION_CONTEXTS`
3. **Создать адаптеры**: Копировать и адаптировать существующие
4. **Добавить фабрики**: `createAdminStack()`, `createTelegramStack()`
5. **Environment variables**: Добавить `DATABASE_ADMIN_URL`, `DATABASE_BOT_URL`

**Время на добавление: 1-2 дня на каждое приложение.**

---

**Готов начать реализацию? Какой этап хотите разобрать детальнее?**
