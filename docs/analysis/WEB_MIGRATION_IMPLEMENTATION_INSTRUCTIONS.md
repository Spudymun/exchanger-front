# ПЛАН МИГРАЦИИ К MULTI-APP АРХИТЕКТУРЕ

> **Дата**: 12 сентября 2025  
> **Статус**: ИСПРАВЛЕННЫЙ ПЛАН НА ОСНОВЕ РЕАЛЬНОЙ АРХИТЕКТУРЫ  
> **Основано на**: Тщательном анализе существующей кодовой базы  
> **Цель**: Добавить поддержку изоляции сессий по приложениям (web, admin-panel) в существующую архитектуру

## 🎯 ЦЕЛЬ МИГРАЦИИ: Расширение существующей session архитектуры для multi-app

### Текущая архитектура (РАБОТАЕТ):

```
┌─────────────────────┐  ┌─────────────────────┐
│      PostgreSQL     │  │        Redis        │
│   (одна БД)         │  │   (глобальные       │
│                     │  │    ключи)           │
│ ┌─────────────────┐ │  │ ┌─────────────────┐ │
│ │ users           │ │  │ │ session:abc123  │ │
│ │ sessions        │ │  │ │ session:def456  │ │
│ └─────────────────┘ │  │ └─────────────────┘ │
└─────────────────────┘  └─────────────────────┘
```

### Целевая архитектура (ДОБАВЛЯЕМ application context):

```
┌─────────────────────┐  ┌─────────────────────┐
│      PostgreSQL     │  │        Redis        │
│   (та же БД +       │  │   (namespace по     │
│    app context)     │  │    приложениям)     │
│                     │  │                     │
│ ┌─────────────────┐ │  │ ┌─────────────────┐ │
│ │ users           │ │  │ │ session:web:123 │ │
│ │ sessions +      │ │  │ │ session:admin:45│ │
│ │ appContext      │ │  │ │                 │ │
│ └─────────────────┘ │  │ └─────────────────┘ │
└─────────────────────┘  └─────────────────────┘
```

## 🎯 ПРИНЦИПЫ МИГРАЦИИ: EXTEND, DON'T REPLACE

1. ✅ **Сохранить ВСЕ работающие механизмы** - UserManagerFactory, RedisSessionAdapter, ProductionUserManager
2. ✅ **100% Backward compatibility** - существующий код web приложения НЕ изменяется
3. ✅ **Минимальные изменения** - только добавляем application context support
4. ✅ **НЕ создавать новые БД** - расширяем существующую Prisma схему
5. ✅ **НЕ ломать Redis** - добавляем namespace, сохраняем fallback

---

## ЭТАП 1: Добавление Application Context в константы

### 1.1 Расширение констант в `packages/constants/src/session.ts`

**✅ ДОБАВИТЬ К СУЩЕСТВУЮЩИМ КОНСТАНТАМ:**

```typescript
export const SESSION_CONSTANTS = {
  // ✅ СОХРАНЯЕМ все существующие константы без изменений
  ENVIRONMENTS: {
    MOCK: 'mock',
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
  } as const,

  MIGRATION_STRATEGIES: {
    MOCK_ONLY: 'mock-only',
    PRODUCTION_ONLY: 'production-only',
    GRADUAL: 'gradual',
    WRITE_THROUGH: 'mock-with-write-through',
  } as const,

  REDIS: {
    SESSION_PREFIX: 'session:', // ✅ СОХРАНЯЕМ для backward compatibility
    MAX_RETRIES: 3,
    // ✅ ДОБАВЛЯЕМ новые prefixes для multi-app namespace
    APP_SESSION_PREFIX: 'session:', // Base prefix
    WEB_SESSION_PREFIX: 'session:web:',
    ADMIN_SESSION_PREFIX: 'session:admin:',
  } as const,

  DATABASE: {
    MAX_CONNECTIONS: 10,
    CONNECTION_TIMEOUT: 5000,
  } as const,

  // ✅ НОВЫЕ константы для application context
  APPLICATION_CONTEXT: {
    WEB: 'web',
    ADMIN: 'admin',
  } as const,
} as const;

// ✅ СОХРАНЯЕМ все существующие типы
export type SessionEnvironment =
  (typeof SESSION_CONSTANTS.ENVIRONMENTS)[keyof typeof SESSION_CONSTANTS.ENVIRONMENTS];

export type SessionMigrationStrategy =
  (typeof SESSION_CONSTANTS.MIGRATION_STRATEGIES)[keyof typeof SESSION_CONSTANTS.MIGRATION_STRATEGIES];

// ✅ ДОБАВЛЯЕМ новый тип для application context
export type ApplicationContext =
  (typeof SESSION_CONSTANTS.APPLICATION_CONTEXT)[keyof typeof SESSION_CONSTANTS.APPLICATION_CONTEXT];
```

### 1.2 Обновление `packages/constants/src/user.ts`

**✅ ДОБАВИТЬ export для ApplicationContext:**

```typescript
// ✅ СУЩЕСТВУЮЩИЙ КОД остается без изменений
export const APP_SCOPE = {
  ADMIN_PANEL: 'admin-panel',
  WEB_APP: 'web',
} as const;

// ✅ ДОБАВЛЯЕМ связь между APP_SCOPE и SESSION APPLICATION_CONTEXT
export const APP_SCOPE_TO_SESSION_CONTEXT = {
  [APP_SCOPE.WEB_APP]: 'web',
  [APP_SCOPE.ADMIN_PANEL]: 'admin',
} as const;

// ✅ ДОБАВЛЯЕМ utility function для преобразования
export function getSessionContextFromAppScope(appScope: AppScope): string {
  return APP_SCOPE_TO_SESSION_CONTEXT[appScope];
}

// ✅ Re-export ApplicationContext для удобства
export type { ApplicationContext } from './session';
```

---

## ЭТАП 2: Расширение Prisma схемы для Application Context

### 2.1 Обновление `packages/session-management/prisma/schema.prisma`

**✅ ДОБАВИТЬ поле applicationContext в Session модель:**

```prisma
// ✅ СОХРАНЯЕМ все существующие модели без изменений

model Session {
  id           String    @id @db.VarChar(255)
  userId       String    @map("user_id") @db.Uuid
  data         Json?     @db.JsonB
  expiresAt    DateTime  @map("expires_at") @db.Timestamptz(6)
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  lastActivity DateTime  @default(now()) @map("last_activity") @db.Timestamptz(6)
  ipAddress    String?   @map("ip_address") @db.Inet
  userAgent    String?   @map("user_agent") @db.Text
  revoked      Boolean   @default(false)
  revokedAt    DateTime? @map("revoked_at") @db.Timestamptz(6)

  // ✅ НОВОЕ поле для application context с default 'web' для backward compatibility
  applicationContext ApplicationType @default(WEB) @map("application_context")

  // Relations остаются без изменений
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // ✅ ОБНОВЛЯЕМ indexes - добавляем applicationContext
  @@index([userId])
  @@index([applicationContext, userId]) // ✅ НОВЫЙ индекс для изоляции по приложениям
  @@index([expiresAt])
  @@index([createdAt])
  @@index([revoked])
  @@map("sessions")
}

// ✅ СОХРАНЯЕМ все существующие enums, ДОБАВЛЯЕМ ApplicationType
enum UserRole {
  USER     @map("user")
  ADMIN    @map("admin")
  OPERATOR @map("operator")
  SUPPORT  @map("support")
}

// ✅ НОВЫЙ enum для application context
enum ApplicationType {
  WEB      @map("web")
  ADMIN    @map("admin")
}
```

---

## ЭТАП 3: Расширение RedisSessionAdapter для Context Support

### 3.1 Обновление `packages/session-management/src/adapters/redis-session-adapter.ts`

**✅ ДОБАВИТЬ опциональный context параметр:**

```typescript
import { SESSION_CONSTANTS, type ApplicationContext } from '@repo/constants';
import { Redis } from 'ioredis';

import type { SessionAdapter, SessionData } from '../types/index.js';

export class RedisSessionAdapter implements SessionAdapter {
  // ✅ РАСШИРЯЕМ конструктор - добавляем опциональный context
  constructor(
    private redis: Redis,
    private context?: ApplicationContext // ✅ ОПЦИОНАЛЬНЫЙ для backward compatibility
  ) {}

  // ✅ НОВЫЙ метод для генерации context-aware ключей
  private generateSessionKey(sessionId: string): string {
    if (this.context) {
      // Новая схема: session:web:abc123 или session:admin:abc123
      return `${SESSION_CONSTANTS.REDIS.APP_SESSION_PREFIX}${this.context}:${sessionId}`;
    }
    // ✅ FALLBACK на старую схему для backward compatibility
    return `${SESSION_CONSTANTS.REDIS.SESSION_PREFIX}${sessionId}`;
  }

  // ✅ ВСЕ ОСТАЛЬНЫЕ МЕТОДЫ ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ - только используют новый generateSessionKey

  async get(sessionId: string): Promise<SessionData | null> {
    try {
      const key = this.generateSessionKey(sessionId);
      const data = await this.redis.get(key);

      if (!data) return null;

      const parsed = JSON.parse(data) as SessionData;

      // Проверка TTL остается без изменений
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

## ЭТАП 4: Расширение UserManagerFactory для Context Support

### 4.1 Обновление `packages/session-management/src/factories/user-manager-factory.ts`

**✅ ДОБАВИТЬ поддержку context в Factory:**

```typescript
// ✅ СОХРАНЯЕМ все существующие импорты, ДОБАВЛЯЕМ ApplicationContext
import { SESSION_CONSTANTS, type ApplicationContext } from '@repo/constants';
import { userManager as mockUserManager } from '@repo/exchange-core';

import { PostgreSQLUserAdapter } from '../adapters/postgres-user-adapter';
import { RedisSessionAdapter } from '../adapters/redis-session-adapter';
import { ProductionUserManager } from '../managers/production-user-manager';

// ... остальные импорты остаются без изменений

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
  // ✅ ДОБАВЛЯЕМ опциональный context
  context?: ApplicationContext;
}

export class UserManagerFactory {
  // ✅ ВСЕ СУЩЕСТВУЮЩИЕ МЕТОДЫ ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ
  private static cachedUserManager: UserManagerInterface | null = null;
  private static cachedConfig: string | null = null;

  // ✅ СУЩЕСТВУЮЩИЙ метод create остается ПОЛНОСТЬЮ без изменений
  static async create(config: ManagerConfiguration = {}): Promise<UserManagerInterface> {
    // Вся существующая логика остается идентичной
    const configKey = JSON.stringify(config);
    if (this.cachedUserManager && this.cachedConfig === configKey) {
      return this.cachedUserManager;
    }

    const environment = config.environment || getEnvironment();
    this.logEnvironmentDebug(environment, config);
    const userManager = await this.createManagerByEnvironment(environment, config);

    this.cachedUserManager = userManager;
    this.cachedConfig = configKey;

    return userManager;
  }

  // ✅ РАСШИРЯЕМ createForContext для поддержки application context
  static async createForContext(context?: ApplicationContext): Promise<UserManagerInterface> {
    // Если context не передан - используем стандартный create (backward compatibility)
    if (!context) {
      return await this.create();
    }

    // Создаем конфигурацию с указанным context
    return await this.create({
      context,
    });
  }

  // ✅ НОВЫЙ convenience метод для web приложения
  static async createForWeb(): Promise<UserManagerInterface> {
    return await this.createForContext(SESSION_CONSTANTS.APPLICATION_CONTEXT.WEB);
  }

  // ✅ НОВЫЙ convenience метод для admin приложения
  static async createForAdmin(): Promise<UserManagerInterface> {
    return await this.createForContext(SESSION_CONSTANTS.APPLICATION_CONTEXT.ADMIN);
  }

  // ✅ ОБНОВЛЯЕМ createSessionAdapter для передачи context
  private static async createSessionAdapter(
    redisConfig: NonNullable<ManagerConfiguration['redis']>,
    context?: ApplicationContext // ✅ ДОБАВЛЯЕМ context параметр
  ): Promise<SessionAdapter> {
    const { Redis } = await import('ioredis');
    const redis = new Redis(redisConfig.url, {
      maxRetriesPerRequest: redisConfig.maxRetries || SESSION_CONSTANTS.REDIS.MAX_RETRIES,
    });

    // ✅ ПЕРЕДАЕМ context в RedisSessionAdapter
    return new RedisSessionAdapter(redis, context);
  }

  // ✅ ОБНОВЛЯЕМ createProductionManager для поддержки context
  private static async createProductionManager(
    config: ManagerConfiguration
  ): Promise<ProductionUserManager> {
    if (!config.database?.url || !config.redis?.url) {
      throw new Error('Production environment requires database and redis configuration');
    }

    const databaseAdapter = await this.createDatabaseAdapter(config.database);
    // ✅ ПЕРЕДАЕМ context в createSessionAdapter
    const sessionAdapter = await this.createSessionAdapter(config.redis, config.context);

    return new ProductionUserManager(databaseAdapter, sessionAdapter);
  }

  // ✅ ВСЕ ОСТАЛЬНЫЕ МЕТОДЫ ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ
}
```

---

## ЭТАП 5: Обновление ProductionUserManager для Context Support

### 5.1 Обновление `packages/session-management/src/managers/production-user-manager.ts`

**✅ ДОБАВИТЬ context в создание сессий:**

```typescript
// ✅ ВСЕ импорты остаются без изменений
import { generateSessionId } from '@repo/exchange-core';
import { SESSION_CONSTANTS } from '@repo/constants';

import type {
  User,
  CreateUserData,
  UserManagerInterface,
  DatabaseAdapter,
  SessionAdapter,
  SessionMetadata,
  SessionData,
} from '../types/index.js';

export class ProductionUserManager implements UserManagerInterface {
  // ✅ КОНСТРУКТОР остается без изменений
  constructor(
    private db: DatabaseAdapter,
    private sessions: SessionAdapter
  ) {}

  // ✅ ВСЕ СУЩЕСТВУЮЩИЕ МЕТОДЫ остаются БЕЗ ИЗМЕНЕНИЙ
  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.db.users.findByEmail(email);
    return user || undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.db.users.findById(id);
    return user || undefined;
  }

  // ✅ findBySessionId остается БЕЗ ИЗМЕНЕНИЙ - Redis adapter сам обрабатывает context
  async findBySessionId(sessionId: string): Promise<User | undefined> {
    // Существующая логика остается полностью идентичной
    const sessionData = await this.sessions.get(sessionId);

    if (sessionData && sessionData.expires_at > Date.now()) {
      const user = await this.db.users.findById(sessionData.user_id);
      return user || undefined;
    }

    if (sessionData) {
      await this.sessions.delete(sessionId);
    }

    try {
      const user = await this.db.users.findBySessionId?.(sessionId);
      return user || undefined;
    } catch {
      return undefined;
    }
  }

  // ✅ ВСЕ ОСТАЛЬНЫЕ МЕТОДЫ остаются ИДЕНТИЧНЫМИ
  async create(userData: CreateUserData): Promise<User> {
    return await this.db.users.create(userData);
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    return await this.db.users.update(id, updateData);
  }

  // ✅ createSession остается БЕЗ ИЗМЕНЕНИЙ - Redis adapter обрабатывает context автоматически
  async createSession(userId: string, metadata: SessionMetadata, ttl: number): Promise<string> {
    const sessionId = generateSessionId();
    const sessionData: SessionData = {
      user_id: userId,
      created_at: Date.now(),
      expires_at: Date.now() + ttl * 1000,
      ip: metadata.ip,
      user_agent: metadata.userAgent,
    };

    await this.sessions.set(sessionId, sessionData, ttl);
    return sessionId;
  }

  // ✅ deleteSession и extendSession остаются БЕЗ ИЗМЕНЕНИЙ
  async deleteSession(sessionId: string): Promise<void> {
    await this.sessions.delete(sessionId);
  }

  async extendSession(sessionId: string, ttl: number): Promise<void> {
    await this.sessions.extend(sessionId, ttl);
  }

  // ✅ ВСЕ ОСТАЛЬНЫЕ МЕТОДЫ остаются идентичными
  async getAll(): Promise<User[]> {
    // Mock compatibility method
    return [];
  }

  async count(): Promise<number> {
    return 0;
  }
}
```

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

## ЭТАП 6: Обновление приложений для использования Context

### 6.1 Обновление `apps/web/src/server/trpc/context.ts`

**✅ ИСПОЛЬЗОВАНИЕ CONTEXT-AWARE UserManagerFactory:**

```typescript
// ✅ ВСЕ импорты остаются без изменений
import { UserManagerFactory } from '@repo/session-management';
import { SESSION_CONSTANTS } from '@repo/constants';

export const createContext = async (opts: CreateNextContextOptions) => {
  // ✅ ВСЕ существующее остается без изменений
  const { req, res } = opts;
  const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
  let user: User | null = null;

  const sessionId = req.cookies.sessionId || req.headers.authorization?.replace('Bearer ', '');

  if (sessionId) {
    try {
      // ✅ ИЗМЕНЯЕМ ТОЛЬКО эту строку - добавляем context для web приложения
      const userManager = await UserManagerFactory.createForContext(
        SESSION_CONSTANTS.APPLICATION_CONTEXT.WEB
      );
      const foundUser = await userManager.findBySessionId(sessionId);
      user = foundUser || null;
    } catch (error) {
      console.error('Session validation error:', error);
    }
  }

  // ✅ ВСЕ остальное остается идентичным
  const acceptLanguage = req.headers['accept-language'] || '';
  const locale = getLocaleFromAcceptLanguage(acceptLanguage);
  const getErrorMessage = createErrorMessageFunction(locale);

  return {
    req,
    res,
    ip,
    user,
    sessionId,
    locale,
    getErrorMessage,
  };
};
```

### 6.2 Обновление `apps/web/src/server/trpc/routers/auth.ts`

**✅ ИСПОЛЬЗОВАНИЕ WEB CONTEXT:**

```typescript
// ✅ ВСЕ импорты остаются без изменений
// Только заменяем UserManagerFactory.create() на UserManagerFactory.createForWeb()

// В register mutation:
const webUserManager = await UserManagerFactory.createForWeb(); // ✅ БЫЛО: .create()

// В login mutation:
const webUserManager = await UserManagerFactory.createForWeb(); // ✅ БЫЛО: .create()

// В logout mutation:
const webUserManager = await UserManagerFactory.createForWeb(); // ✅ БЫЛО: .create()

// ✅ ВСЕ ОСТАЛЬНОЕ остается ИДЕНТИЧНЫМ
```

### 6.3 Подготовка для admin-panel (будущее расширение)

**✅ СОЗДАТЬ ФАЙЛ:** `apps/admin-panel/src/server/trpc/context.ts` (когда понадобится)

```typescript
// ✅ Аналогично web context, но с ADMIN контекстом
export const createContext = async (opts: CreateNextContextOptions) => {
  // ... существующая логика ...

  if (sessionId) {
    try {
      // ✅ ADMIN контекст для изоляции админских сессий
      const userManager = await UserManagerFactory.createForContext(
        SESSION_CONSTANTS.APPLICATION_CONTEXT.ADMIN
      );
      const foundUser = await userManager.findBySessionId(sessionId);
      user = foundUser || null;
    } catch (error) {
      console.error('Session validation error:', error);
    }
  }

  // ... остальное идентично web context ...
};
```

---

## ЭТАП 7: Обновление схемы и финальное тестирование

### 7.1 Прямое обновление Prisma схемы (без миграции)

```powershell
# ✅ Переход в session-management пакет
cd packages/session-management

# ✅ Генерация обновленного Prisma клиента после изменения schema.prisma
npx prisma generate

# ✅ Проверка компиляции TypeScript
npx tsc --noEmit

# ✅ Сброс БД и применение новой схемы (разработка - данных нет)
npx prisma db push --force-reset
```

### 7.2 Проверка работы

```powershell
# ✅ Запуск web приложения
cd ../../apps/web
npm run dev

# ✅ Проверка что аутентификация работает с новыми session ключами
# Ожидаемые Redis ключи: session:web:abc123...

# ✅ Проверка в Redis новой структуры ключей
docker exec exchanger-redis redis-cli KEYS "*session:web:*"
```

---

## 🔍 ПРОВЕРКА РЕЗУЛЬТАТА МИГРАЦИИ

### ✅ Ожидаемые изменения:

1. **Session таблица**: добавлено поле `application_context` с default 'web'
2. **Redis namespace**: новые ключи `session:web:sessionId` для web сессий
3. **Backward compatibility**: старые сессии продолжают работать
4. **UserManagerFactory**: поддерживает createForWeb() и createForAdmin()
5. **Web приложение**: использует изолированные web сессии

### 🔍 Проверочные команды:

```powershell
# ✅ Проверка структуры Sessions таблицы
docker exec exchanger-postgres psql -U exchanger_user -d exchanger_db -c "\d sessions"

# ✅ Проверка новых ключей в Redis
docker exec exchanger-redis redis-cli KEYS "*session:*"

# ✅ Проверка работы TypeScript
cd packages/session-management && npx tsc --noEmit
cd ../../apps/web && npx tsc --noEmit
```

### 🎯 Критерии успеха:

- **Sessions таблица** содержит поле `application_context`
- **Redis** содержит ключи формата `session:web:*`
- **Web аутентификация** работает без ошибок
- **TypeScript** компилируется без ошибок
- **Backward compatibility** сохранена

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ ПО МИГРАЦИИ

### 🔒 Безопасность данных:

1. **📦 Обязательный бэкап**: Сделать дамп БД перед миграцией
2. **🧪 Тестирование на копии**: Протестировать на dev окружении
3. **� Постепенное развертывание**: Поэтапно в production

### 📊 Мониторинг после миграции:

1. **⚡ Производительность**: Время отклика аутентификации
2. **🔐 Сессии**: Корректность создания/валидации
3. **💾 Redis**: Использование памяти и новые patterns
4. **🗄️ PostgreSQL**: Нагрузка и performance новых indexes

### 🔄 Rollback план:

1. **⏪ Prisma**: Откат миграции `npx prisma migrate reset`
2. **� Code**: Revert изменений в context.ts и auth.ts
3. **� Data**: Восстановление из бэкапа при необходимости

---

## 📝 ИТОГОВЫЙ ПЛАН РЕАЛИЗАЦИИ

**⏱️ Время выполнения**: ~45 минут

### 🚀 Этап 1 (15 мин): Обновление констант и адаптеров

- Расширение SESSION_CONSTANTS с APPLICATION_CONTEXT
- Обновление RedisSessionAdapter для context support

### 🏗️ Этап 2 (15 мин): Обновление UserManagerFactory и Prisma

- Добавление context параметров в Factory
- Обновление Prisma схемы с applicationContext поле

### ✅ Этап 3 (15 мин): Применение изменений и тестирование

- Prisma миграция и генерация клиента
- Обновление web приложения для использования context
- Проверка работоспособности

### 🎯 Результат:

**Готовая multi-app session архитектура с:**

- **Session изоляция**: Web и Admin сессии разделены по context
- **Redis namespace**: `session:web:*` и `session:admin:*` ключи
- **Database context**: application_context поле в Sessions таблице
- **Backward compatibility**: 100% совместимость с существующим кодом
- **Готовность к расширению**: Легкое добавление telegram-bot и других приложений

---

## ЭТАП 8: CLEANUP - Удаление Backward Compatibility (После полноценной миграции)

> ⚠️ **ВНИМАНИЕ**: Этот этап выполняется ТОЛЬКО после полной миграции всех сессий на новую архитектуру и подтверждения отсутствия старых сессий в production

### 🎯 ЦЕЛЬ: Удаление мусорного кода и упрощение архитектуры

После того как все приложения мигрировали на новую архитектуру и все старые сессии истекли, можно убрать backward compatibility код для чистоты архитектуры.

### 8.1 Очистка Redis префиксов в `packages/constants/src/session.ts`

**✅ УДАЛИТЬ избыточные константы:**

```typescript
export const SESSION_CONSTANTS = {
  // ... existing constants ...

  REDIS: {
    // ❌ УДАЛИТЬ: SESSION_PREFIX: 'session:',  // Больше не нужен
    // ❌ УДАЛИТЬ: APP_SESSION_PREFIX: 'session:',  // Больше не нужен
    MAX_RETRIES: 3,
    // ✅ ОСТАВЛЯЕМ только специфичные prefixes
    WEB_SESSION_PREFIX: 'session:web:',
    ADMIN_SESSION_PREFIX: 'session:admin:',
  } as const,

  // ... rest stays the same ...
} as const;
```

### 8.2 Упрощение RedisSessionAdapter

**✅ УДАЛИТЬ fallback логику:**

```typescript
export class RedisSessionAdapter implements SessionAdapter {
  // ✅ УПРОЩАЕМ: context теперь ОБЯЗАТЕЛЬНЫЙ параметр
  constructor(
    private redis: Redis,
    private context: ApplicationContext // ❌ УДАЛЯЕМ: опциональность
  ) {}

  // ✅ УПРОЩАЕМ: удаляем fallback логику
  private generateSessionKey(sessionId: string): string {
    // ❌ УДАЛЯЕМ весь fallback код:
    // if (this.context) {
    //   return `${SESSION_CONSTANTS.REDIS.APP_SESSION_PREFIX}${this.context}:${sessionId}`;
    // }
    // return `${SESSION_CONSTANTS.REDIS.SESSION_PREFIX}${sessionId}`;

    // ✅ ТОЛЬКО новая схема:
    return `${SESSION_CONSTANTS.REDIS.WEB_SESSION_PREFIX}${sessionId}`.replace('web', this.context);
  }

  // ✅ ВСЕ остальные методы упрощаются автоматически
}
```

### 8.3 Упрощение UserManagerFactory

**✅ УДАЛИТЬ старые методы:**

```typescript
export class UserManagerFactory {
  // ❌ УДАЛИТЬ: static async create(config: ManagerConfiguration = {})
  // ❌ УДАЛИТЬ: static async createForContext(): Promise<UserManagerInterface>

  // ✅ ОСТАВЛЯЕМ только context-aware методы:
  static async createForContext(context: ApplicationContext): Promise<UserManagerInterface> {
    // Упрощенная логика без fallback на старый create()
  }

  static async createForWeb(): Promise<UserManagerInterface> {
    return await this.createForContext(SESSION_CONSTANTS.APPLICATION_CONTEXT.WEB);
  }

  static async createForAdmin(): Promise<UserManagerInterface> {
    return await this.createForContext(SESSION_CONSTANTS.APPLICATION_CONTEXT.ADMIN);
  }

  // ❌ УДАЛИТЬ: все методы createSessionAdapter без context параметра
  // ❌ УДАЛИТЬ: createProductionManager без context поддержки
}
```

### 8.4 Обновление ManagerConfiguration

**✅ СДЕЛАТЬ context ОБЯЗАТЕЛЬНЫМ:**

```typescript
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
  // ✅ ИЗМЕНЯЕМ: context больше не опциональный
  context: ApplicationContext; // ❌ УДАЛЯЕМ: опциональность
}
```

### 8.5 Удаление Prisma default значения

**✅ УБРАТЬ default в schema.prisma:**

```prisma
model Session {
  // ... existing fields ...

  // ✅ ИЗМЕНЯЕМ: убираем default, context теперь всегда передается явно
  applicationContext ApplicationType @map("application_context")
  // ❌ БЫЛО: applicationContext ApplicationType @default(WEB) @map("application_context")

  // ... rest stays the same ...
}
```

### 8.6 Очистка web приложения

**✅ УПРОСТИТЬ context.ts:**

```typescript
export const createContext = async (opts: CreateNextContextOptions) => {
  // ... existing logic ...

  if (sessionId) {
    try {
      // ✅ УПРОЩАЕМ: всегда передаем явный context
      const userManager = await UserManagerFactory.createForWeb();
      // ❌ УДАЛЯЕМ: UserManagerFactory.createForContext() без параметров

      const foundUser = await userManager.findBySessionId(sessionId);
      user = foundUser || null;
    } catch (error) {
      console.error('Session validation error:', error);
    }
  }

  // ... rest stays the same ...
};
```

---

## 🗑️ CLEANUP CHECKLIST

### Перед выполнением cleanup:

- [ ] ✅ Все приложения мигрированы на новую архитектуру
- [ ] ✅ Все старые сессии в Redis истекли (проверить: `KEYS session:*` не содержит старых ключей)
- [ ] ✅ PostgreSQL Sessions таблица содержит только записи с applicationContext
- [ ] ✅ Production окружение работает стабильно минимум 2 недели
- [ ] ✅ Создан бэкап БД перед cleanup

### Этапы cleanup:

1. **Константы**: Удалить избыточные SESSION_PREFIX и APP_SESSION_PREFIX
2. **RedisSessionAdapter**: Убрать fallback логику и сделать context обязательным
3. **UserManagerFactory**: Удалить старые методы create() и createForContext() без параметров
4. **ManagerConfiguration**: Сделать context обязательным полем
5. **Prisma Schema**: Убрать default значение для applicationContext
6. **Applications**: Упростить код приложений убрав fallback логику

### После cleanup:

- [ ] ✅ TypeScript компиляция без ошибок
- [ ] ✅ Все тесты проходят
- [ ] ✅ Production deployment и проверка работоспособности
- [ ] ✅ Мониторинг в течение 24 часов после deployment

---

## 🎉 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ

**Чистая, простая, эффективная multi-app session архитектура:**

- **Строгая типизация**: ApplicationContext всегда явно задан
- **Простая логика**: Нет fallback кода и legacy поддержки
- **Высокая производительность**: Упрощенная логика Redis ключей
- **Безопасность**: Полная изоляция сессий по приложениям
- **Масштабируемость**: Легкое добавление новых приложений

```

```
