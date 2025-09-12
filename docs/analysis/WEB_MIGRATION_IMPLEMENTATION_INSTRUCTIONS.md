# ПЛАН МИГРАЦИИ К MULTI-DATABASE АРХИТЕКТУРЕ

> **Дата**: 11 сентября 2025  
> **Статус**: ПРАВИЛЬНЫЙ ПЛАН МИГРАЦИИ (ИСПРАВЛЕННАЯ ВЕРСИЯ)  
> **Основано на**: Реальном анализе кодовой базы  
> **Цель**: Мигрировать к архитектуре с 4 БД (identity/web/admin/bot) + Redis namespace

## 🎯 ЦЕЛЬ МИГРАЦИИ: Расширение архитектуры без поломки

### Целевая архитектура:

```
┌─────────────────────┐  ┌─────────────────────┐
│  exchanger_identity │  │   exchanger_web     │
│      (SHARED)       │  │    (WEB ONLY)       │
│                     │  │                     │
│ ┌─────────────────┐ │  │ ┌─────────────────┐ │
│ │ users           │ │  │ │ web_sessions    │ │
│ │ sessions        │ │  │ │ web_user_cache  │ │
│ │ permissions     │ │  │ │                 │ │
│ └─────────────────┘ │  │ └─────────────────┘ │
└─────────────────────┘  └─────────────────────┘
```

### Redis namespace схема:

```
├── identity:session:web:abc123...      ← Веб-сессии
├── identity:user:web:user_456          ← Кэш веб-пользователей
```

## 🎯 ПРИНЦИПЫ МИГРАЦИИ: БЕЗ ПОЛОМКИ

1. ✅ **Сохранить все работающие механизмы** - MIGRATION_STRATEGIES, ENVIRONMENTS
2. ✅ **Backward compatibility** - старый код продолжает работать
3. ✅ **Постепенный переход** - используем существующие стратегии миграции
4. ✅ **Расширение, не замена** - добавляем возможности, не удаляем

---

## ЭТАП 1: Расширение констант (БЕЗ ПОЛОМКИ СУЩЕСТВУЮЩИХ)

### 1.1 Добавление новых констант в `packages/constants/src/session.ts`

**✅ РАСШИРИТЬ СУЩЕСТВУЮЩИЙ КОД:**

```typescript
export const SESSION_CONSTANTS = {
  // ✅ СОХРАНЯЕМ существующую структуру ENVIRONMENTS
  ENVIRONMENTS: {
    MOCK: 'mock',
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
  } as const,

  // ✅ СОХРАНЯЕМ существующие MIGRATION_STRATEGIES
  MIGRATION_STRATEGIES: {
    MOCK_ONLY: 'mock-only',
    PRODUCTION_ONLY: 'production-only',
    GRADUAL: 'gradual',
    WRITE_THROUGH: 'mock-with-write-through',
  } as const,

  REDIS: {
    SESSION_PREFIX: 'session:', // ✅ СОХРАНЯЕМ работающий префикс
    MAX_RETRIES: 3,
    // ✅ ДОБАВЛЯЕМ новые префиксы для multi-app архитектуры
    IDENTITY_SESSION_PREFIX: 'identity:session:',
    IDENTITY_USER_PREFIX: 'identity:user:',
  } as const,

  DATABASE: {
    MAX_CONNECTIONS: 10,
    CONNECTION_TIMEOUT: 5000,
    // ✅ ДОБАВЛЯЕМ новые константы БД (не заменяем старые)
    IDENTITY_DB_NAME: 'exchanger_identity',
    WEB_DB_NAME: 'exchanger_web',
  } as const,

  // ✅ ДОБАВЛЯЕМ новые TTL константы
  TTL: {
    SESSION_DEFAULT: 24 * 60 * 60, // 24 часа
    USER_CACHE: 60 * 60, // 1 час
  } as const,
} as const;

// ✅ ДОБАВЛЯЕМ новые типы (не заменяем старые)
export type ApplicationContext = 'web';
export type DatabaseType = 'identity' | 'web';

// ✅ СОХРАНЯЕМ существующие типы
export type SessionEnvironment =
  (typeof SESSION_CONSTANTS.ENVIRONMENTS)[keyof typeof SESSION_CONSTANTS.ENVIRONMENTS];

export type SessionMigrationStrategy =
  (typeof SESSION_CONSTANTS.MIGRATION_STRATEGIES)[keyof typeof SESSION_CONSTANTS.MIGRATION_STRATEGIES];
```

---

## ЭТАП 2: Расширение RedisSessionAdapter (Backward Compatible)

### 2.1 Добавление поддержки контекстов в `packages/session-management/src/adapters/redis-session-adapter.ts`

**✅ РАСШИРИТЬ СУЩЕСТВУЮЩИЙ КОД:**

```typescript
import { SESSION_CONSTANTS, type ApplicationContext } from '@repo/constants';
import { Redis } from 'ioredis';

import type { SessionAdapter, SessionData } from '../types/index.js';

export class RedisSessionAdapter implements SessionAdapter {
  // ✅ ОБРАТНАЯ СОВМЕСТИМОСТЬ: context опционален
  constructor(
    private redis: Redis,
    private context?: ApplicationContext
  ) {}

  // ✅ РАСШИРЯЕМ метод generateSessionKey с backward compatibility
  private generateSessionKey(sessionId: string): string {
    // Если контекст указан - используем новую схему
    if (this.context) {
      return `${SESSION_CONSTANTS.REDIS.IDENTITY_SESSION_PREFIX}${this.context}:${sessionId}`;
    }
    // Иначе используем старую схему (backward compatibility)
    return `${SESSION_CONSTANTS.REDIS.SESSION_PREFIX}${sessionId}`;
  }

  // ✅ ДОБАВЛЯЕМ новый метод для генерации cache ключей
  private generateCacheKey(type: string, key: string): string {
    if (this.context) {
      return `${SESSION_CONSTANTS.REDIS.CACHE_PREFIX}${this.context}:${type}:${key}`;
    }
    return `cache:${type}:${key}`;
  }

  // ✅ СОХРАНЯЕМ все существующие методы без изменений
  async get(sessionId: string): Promise<SessionData | null> {
    try {
      const key = this.generateSessionKey(sessionId);
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
      const key = this.generateSessionKey(sessionId);
      await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
      throw new Error(
        `Failed to store session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      const key = this.generateSessionKey(sessionId);
      await this.redis.del(key);
    } catch {
      // Delete errors are non-critical
    }
  }

  async extend(sessionId: string, ttl: number): Promise<void> {
    try {
      const key = this.generateSessionKey(sessionId);
      await this.redis.expire(key, ttl);
    } catch {
      // Extension errors are non-critical
    }
  }
}
```

---

## ЭТАП 3: Расширение UserManagerFactory (Сохраняем работающий код)

### 3.1 Добавление поддержки multi-database в `packages/session-management/src/factories/user-manager-factory.ts`

**✅ РАСШИРИТЬ СУЩЕСТВУЮЩИЙ ИНТЕРФЕЙС:**

```typescript
// ✅ ДОБАВЛЯЕМ новый интерфейс, СОХРАНЯЕМ старый
export interface MultiDatabaseConfiguration {
  environment?: ManagerEnvironment;
  databases?: {
    identity?: string; // URL для identity БД
    web?: string; // URL для web БД
  };
  redis?: {
    url: string;
    maxRetries?: number;
  };
  context?: ApplicationContext;
}

// ✅ РАСШИРЯЕМ существующий ManagerConfiguration
export interface ManagerConfiguration {
  environment?: ManagerEnvironment;
  database?: {
    url: string;
    maxConnections?: number;
  };
  redis?: {
    url: string;
    maxRetries?: number;
  };
  // ✅ ДОБАВЛЯЕМ опциональную поддержку multi-database
  multiDatabase?: MultiDatabaseConfiguration['databases'];
  context?: ApplicationContext;
}
```

**✅ ДОБАВИТЬ НОВЫЙ МЕТОД createMultiDatabase (не заменяем существующие):**

```typescript
export class UserManagerFactory {
  // ✅ СОХРАНЯЕМ все существующие методы

  // ✅ ДОБАВЛЯЕМ новый метод для multi-database архитектуры
  static async createMultiDatabase(
    config: MultiDatabaseConfiguration = {}
  ): Promise<UserManagerInterface> {
    const environment = config.environment || getEnvironment();

    // Проверяем есть ли конфигурация для multi-database
    if (config.databases?.identity) {
      return await this.createMultiDatabaseManager(config);
    }

    // Fallback на существующий механизм
    return await this.create(config as ManagerConfiguration);
  }

  // ✅ НОВЫЙ метод для создания multi-database manager
  private static async createMultiDatabaseManager(
    config: MultiDatabaseConfiguration
  ): Promise<UserManagerInterface> {
    if (!config.databases?.identity) {
      throw new Error('Identity database URL is required for multi-database configuration');
    }

    const identityAdapter = await this.createDatabaseAdapterForUrl(config.databases.identity);
    const context = config.context || 'web';
    const sessionAdapter = await this.createSessionAdapterWithContext(config.redis!, context);

    return new ProductionUserManager(identityAdapter, sessionAdapter);
  }

  // ✅ НОВЫЙ helper метод
  private static async createDatabaseAdapterForUrl(url: string): Promise<DatabaseAdapter> {
    const prismaConfig: PrismaClientConfig = {
      url,
      maxConnections: SESSION_CONSTANTS.DATABASE.MAX_CONNECTIONS,
      connectionTimeout: SESSION_CONSTANTS.DATABASE.CONNECTION_TIMEOUT,
    };

    const prisma = getPrismaClient(prismaConfig);

    return {
      users: new PostgreSQLUserAdapter(prisma),
    };
  }

  // ✅ НОВЫЙ метод создания session adapter с контекстом
  private static async createSessionAdapterWithContext(
    redisConfig: NonNullable<MultiDatabaseConfiguration['redis']>,
    context: ApplicationContext
  ): Promise<SessionAdapter> {
    const { Redis } = await import('ioredis');
    const redis = new Redis(redisConfig.url, {
      maxRetriesPerRequest: redisConfig.maxRetries || SESSION_CONSTANTS.REDIS.MAX_RETRIES,
    });

    return new RedisSessionAdapter(redis, context);
  }

  // ✅ РАСШИРЯЕМ createForContext для поддержки multi-database
  static async createForContext(context?: ApplicationContext): Promise<UserManagerInterface> {
    // Проверяем есть ли переменные для multi-database
    const identityUrl = process.env.DATABASE_IDENTITY_URL;

    if (identityUrl) {
      // Используем новую multi-database архитектуру
      return await this.createMultiDatabase({
        databases: {
          identity: identityUrl,
          web: process.env.DATABASE_WEB_URL,
        },
        redis: {
          url: process.env.REDIS_URL!,
        },
        context,
      });
    }

    // Fallback на существующий механизм
    return await this.create();
  }
}
```

---

## ЭТАП 4: Постепенная миграция переменных окружения

### 4.1 Добавление новых переменных (СОХРАНЯЕМ старые)

**✅ ДОБАВИТЬ В `.env.local` (рядом со старыми):**

```bash
# ✅ СУЩЕСТВУЮЩИЕ переменные (СОХРАНЯЕМ)
DATABASE_URL="postgresql://user:password@localhost:5432/exchanger_db"
REDIS_URL="redis://localhost:6379"
REDIS_MAX_RETRIES=3

# ✅ НОВЫЕ переменные для multi-database архитектуры (ДОБАВЛЯЕМ)
DATABASE_IDENTITY_URL="postgresql://user:password@localhost:5432/exchanger_identity"
DATABASE_WEB_URL="postgresql://user:password@localhost:5432/exchanger_web"

# ✅ Остальные переменные без изменений
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### 4.2 Обновление `docker-compose.yml` (добавляем скрипт инициализации)

**✅ РАСШИРИТЬ секцию postgres:**

```yaml
postgres:
  image: postgres:15-alpine
  container_name: exchanger-postgres
  restart: unless-stopped
  environment:
    POSTGRES_DB: ${POSTGRES_DB:-exchanger_db} # ✅ СОХРАНЯЕМ старую БД
    POSTGRES_USER: ${POSTGRES_USER:-exchanger_user}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-exchanger_password}
    POSTGRES_HOST_AUTH_METHOD: trust
  ports:
    - '${POSTGRES_PORT:-5432}:5432'
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro # ✅ СОХРАНЯЕМ старый
    - ./docker/postgres/init-multi-dbs.sql:/docker-entrypoint-initdb.d/02-multi-dbs.sql:ro # ✅ ДОБАВЛЯЕМ новый
  networks:
    - exchanger-network
```

### 4.3 Создание скрипта для создания дополнительных БД

**✅ СОЗДАТЬ НОВЫЙ ФАЙЛ:** `docker/postgres/init-multi-dbs.sql`

```sql
-- ✅ СОЗДАЕМ ДОПОЛНИТЕЛЬНЫЕ БД для multi-database архитектуры
-- Основная БД exchanger_db уже создана в init.sql

-- Создаем Identity БД (если не существует)
SELECT 'CREATE DATABASE exchanger_identity'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'exchanger_identity')\gexec

-- Создаем Web БД (если не существует)
SELECT 'CREATE DATABASE exchanger_web'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'exchanger_web')\gexec

-- Даем права пользователю на новые БД
DO $$
BEGIN
  -- Identity БД
  IF EXISTS (SELECT 1 FROM pg_database WHERE datname = 'exchanger_identity') THEN
    EXECUTE 'GRANT ALL PRIVILEGES ON DATABASE exchanger_identity TO ' || current_user;
  END IF;

  -- Web БД
  IF EXISTS (SELECT 1 FROM pg_database WHERE datname = 'exchanger_web') THEN
    EXECUTE 'GRANT ALL PRIVILEGES ON DATABASE exchanger_web TO ' || current_user;
  END IF;
END $$;

\echo '✅ Multi-database setup completed'
```

---

## ЭТАП 5: Создание Prisma схем для новых БД

### 5.1 Создание схемы для Identity БД

**✅ СОЗДАТЬ НОВЫЙ ФАЙЛ:** `packages/session-management/prisma/identity.prisma`

```prisma
// ✅ СХЕМА ДЛЯ IDENTITY БД (shared across all applications)
generator client {
  provider = "prisma-client-js"
  output   = "../generated/identity-client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_IDENTITY_URL")
}

model User {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email          String    @unique @db.VarChar(255)
  hashedPassword String?   @map("hashed_password") @db.Text
  isVerified     Boolean   @default(false) @map("is_verified")
  role           UserRole  @default(USER)
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  lastLoginAt    DateTime? @map("last_login_at") @db.Timestamptz(6)
  sessionId      String?   @map("session_id") @db.VarChar(255)

  // Relations
  sessions    Session[]
  permissions UserPermission[]

  // Indexes
  @@index([email])
  @@index([sessionId])
  @@index([role])
  @@index([createdAt])
  @@map("users")
}

model Session {
  id                String          @id @db.VarChar(255)
  userId            String          @map("user_id") @db.Uuid
  applicationContext ApplicationType @default(WEB) @map("application_context")
  data              Json?           @db.JsonB
  expiresAt         DateTime        @map("expires_at") @db.Timestamptz(6)
  createdAt         DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  lastActivity      DateTime        @default(now()) @map("last_activity") @db.Timestamptz(6)
  ipAddress         String?         @map("ip_address") @db.Inet
  userAgent         String?         @map("user_agent") @db.Text
  revoked           Boolean         @default(false)
  revokedAt         DateTime?       @map("revoked_at") @db.Timestamptz(6)

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([userId])
  @@index([applicationContext, userId])
  @@index([expiresAt])
  @@index([createdAt])
  @@index([revoked])
  @@map("sessions")
}

model UserPermission {
  id                String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId            String          @map("user_id") @db.Uuid
  permission        String          @db.VarChar(100)
  applicationContext ApplicationType @default(WEB) @map("application_context")
  grantedAt         DateTime        @default(now()) @map("granted_at") @db.Timestamptz(6)
  grantedBy         String?         @map("granted_by") @db.Uuid
  expiresAt         DateTime?       @map("expires_at") @db.Timestamptz(6)

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, permission, applicationContext])
  @@index([applicationContext, userId])
  @@index([permission])
  @@map("user_permissions")
}

enum UserRole {
  USER     @map("user")
  ADMIN    @map("admin")
}

enum ApplicationType {
  WEB      @map("web")
}
```

### 5.2 Создание схемы для Web БД

**✅ СОЗДАТЬ НОВЫЙ ФАЙЛ:** `packages/session-management/prisma/web.prisma`

```prisma
// ✅ СХЕМА ДЛЯ WEB БД (ТОЛЬКО веб-специфичные данные сессий)
generator client {
  provider = "prisma-client-js"
  output   = "../generated/web-client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_WEB_URL")
}

// ТОЛЬКО веб-специфичные данные сессий
model WebSession {
  id           String   @id @db.VarChar(255)
  userId       String   @map("user_id") @db.Uuid // Reference to identity.users
  data         Json?    @db.JsonB
  preferences  Json?    @db.JsonB // Веб-специфичные настройки
  theme        String?  @db.VarChar(20)
  language     String?  @db.VarChar(10)
  expiresAt    DateTime @map("expires_at") @db.Timestamptz(6)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  lastActivity DateTime @default(now()) @map("last_activity") @db.Timestamptz(6)

  @@index([userId])
  @@index([expiresAt])
  @@map("web_sessions")
}

// Веб-специфичный кэш данных
model WebUserCache {
  userId    String   @id @map("user_id") @db.Uuid
  data      Json     @db.JsonB
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("web_user_cache")
}
```

---

## ЭТАП 6: Настройка Prisma клиентов и миграция данных

### 6.1 Создание Prisma клиентов для новых БД

**✅ СОЗДАТЬ НОВЫЙ ФАЙЛ:** `packages/session-management/src/clients/index.ts`

```typescript
// ✅ РАСШИРЯЕМ существующую систему новыми клиентами
import { PrismaClient as IdentityClient } from '../generated/identity-client';
import { PrismaClient as WebClient } from '../generated/web-client';
import { PrismaClient as ExistingClient } from '@prisma/client'; // ✅ СОХРАНЯЕМ старый

// ✅ НОВЫЕ клиенты для multi-database
export const identityClient = new IdentityClient({
  datasources: {
    db: {
      url: process.env.DATABASE_IDENTITY_URL,
    },
  },
});

export const webClient = new WebClient({
  datasources: {
    db: {
      url: process.env.DATABASE_WEB_URL,
    },
  },
});

// ✅ СОХРАНЯЕМ старый клиент для backward compatibility
export const legacyClient = new ExistingClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // ✅ Старая переменная остается
    },
  },
});

// ✅ Типы для упрощения использования
export type IdentityDatabase = typeof identityClient;
export type WebDatabase = typeof webClient;
export type LegacyDatabase = typeof legacyClient;

// ✅ Unified interface для работы с разными БД
export interface DatabaseClients {
  identity: IdentityDatabase;
  web: WebDatabase;
  legacy?: LegacyDatabase; // ✅ Опциональный для backward compatibility
}
```

### 6.2 Обновление package.json с миграционными скриптами

**✅ ДОБАВИТЬ В:** `packages/session-management/package.json`

```json
{
  "scripts": {
    "db:generate:identity": "prisma generate --schema=./prisma/identity.prisma",
    "db:generate:web": "prisma generate --schema=./prisma/web.prisma",
    "db:push:identity": "prisma db push --schema=./prisma/identity.prisma",
    "db:push:web": "prisma db push --schema=./prisma/web.prisma",
    "db:setup:multi": "npm run db:generate:identity && npm run db:generate:web && npm run db:push:identity && npm run db:push:web"
  }
}
```

---

## ЭТАП 7: Команды для применения миграции

### 7.1 Подготовка окружения

```powershell
# ✅ Остановка существующих контейнеров
docker-compose down -v

# ✅ Запуск с новой конфигурацией
docker-compose up -d postgres redis

# ✅ Ожидание готовности БД
Start-Sleep -Seconds 15

# ✅ Проверка создания БД
docker exec exchanger-postgres psql -U exchanger_user -d exchanger_identity -c "SELECT 1;"
docker exec exchanger-postgres psql -U exchanger_user -d exchanger_web -c "SELECT 1;"
```

### 7.2 Генерация Prisma клиентов и применение схем

```powershell
# ✅ Переход в session-management пакет
cd packages/session-management

# ✅ Генерация клиентов для новых БД
npm run db:generate:identity
npm run db:generate:web

# ✅ Применение схем к БД
npm run db:push:identity
npm run db:push:web

# ✅ Проверка генерации типов
npx tsc --noEmit
```

### 7.3 Тестирование web приложения

```powershell
# ✅ Запуск web приложения
cd ../../apps/web
npm run dev

# ✅ Открываем http://localhost:3000
# ✅ Проверяем что аутентификация работает
# ✅ Проверяем создание новых сессий

# ✅ Проверяем в Redis новую структуру ключей
docker exec exchanger-redis redis-cli KEYS "*identity:session:*"
```

---

## 🔍 ПРОВЕРКА РЕЗУЛЬТАТА МИГРАЦИИ

### Ожидаемые изменения:

1. **✅ 2 База данных созданы**: `exchanger_identity`, `exchanger_web`
2. **✅ Prisma клиенты работают**: Identity и Web клиенты генерируются без ошибок
3. **✅ Новая структура Redis ключей**: `identity:session:web:sessionId` вместо `session:sessionId`
4. **✅ UserManagerFactory поддерживает multi-database**: Автоматически выбирает архитектуру по переменным окружения
5. **✅ Backward compatibility**: Приложение работает как с новой, так и со старой архитектурой

### Проверочные команды:

```powershell
# ✅ Проверка структуры БД
docker exec exchanger-postgres psql -U exchanger_user -l

# ✅ Проверка таблиц в Identity БД
docker exec exchanger-postgres psql -U exchanger_user -d exchanger_identity -c "\dt"

# ✅ Проверка таблиц в Web БД
docker exec exchanger-postgres psql -U exchanger_user -d exchanger_web -c "\dt"

# ✅ Проверка ключей в Redis
docker exec exchanger-redis redis-cli KEYS "*"

# ✅ Проверка работы TypeScript
cd packages/session-management && npx tsc --noEmit
cd ../../apps/web && npx tsc --noEmit
```

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ ПО МИГРАЦИИ

### Безопасность данных:

1. **📦 Обязательный бэкап**: Сделать дамп текущей БД перед миграцией
2. **🔍 Тестирование на копии**: Сначала протестировать на dev/staging окружении
3. **🚀 Поэтапное развертывание**: В production применять изменения поэтапно

### Мониторинг после миграции:

1. **📊 Производительность**: Проверить время отклика аутентификации
2. **🔐 Сессии**: Убедиться что сессии создаются и валидируются корректно
3. **💾 Redis**: Мониторить использование памяти Redis
4. **🗄️ Postgres**: Проверить нагрузку на новые БД

### Rollback план:

1. **🔄 Переменные окружения**: Удалить `DATABASE_IDENTITY_URL`, `DATABASE_WEB_URL`
2. **🗂️ Fallback**: UserManagerFactory автоматически вернется к старой архитектуре
3. **📦 Данные**: Восстановить из бэкапа при необходимости

---

## 📝 ИТОГОВЫЙ ПЛАН РЕАЛИЗАЦИИ

**⏱️ Время выполнения**: ~1.5 часа

### Этап 1 (30 мин): Подготовка инфраструктуры

- Обновление констант и Redis адаптера
- Настройка Docker для двух БД

### Этап 2 (45 мин): Настройка Prisma и схем

- Создание схем для Identity и Web БД
- Генерация клиентов и применение миграций

### Этап 3 (15 мин): Обновление Session Management

- Расширение UserManagerFactory для multi-database

### 🎯 Результат:

Working multi-database архитектура с:

- **Identity БД**: Централизованная аутентификация (users, sessions, permissions)
- **Web БД**: Веб-специфичные данные сессий (web_sessions, web_user_cache)
- **Redis namespace**: `identity:session:web:sessionId`
- **Backward compatibility**: Плавный переход без поломки
