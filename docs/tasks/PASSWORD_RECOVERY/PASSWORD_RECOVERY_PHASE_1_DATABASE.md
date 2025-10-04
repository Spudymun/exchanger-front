# Phase 1: Database Layer - Detailed Implementation

> **Файл**: Part of PASSWORD_RECOVERY_IMPLEMENTATION_PLAN.md  
> **Фаза**: Database Layer  
> **Время**: ~30 минут  
> **Статус**: 100% VERIFIED patterns

---

## 📊 Phase 1: Database Layer

### Цель

Создать таблицу `password_reset_tokens` в PostgreSQL через Prisma migration, используя проверенные паттерны проекта.

### Prerequisite Check

```powershell
# Проверить доступность базы данных
$env:DATABASE_URL = "postgresql://..."  # Из .env файла
psql $env:DATABASE_URL -c "SELECT version();"

# Проверить текущие миграции
cd e:\project\kiro\exchanger-front\packages\session-management
pnpm prisma migrate status
```

---

## 1.1. Обновление Prisma Schema

### Файл: `packages/session-management/prisma/schema.prisma`

**Текущая структура User model** (lines 10-30):

```prisma
model User {
  id                  String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email               String          @unique @db.VarChar(255)
  hashedPassword      String?         @map("hashed_password")
  isVerified          Boolean         @default(false) @map("is_verified")
  telegramId          String?         @unique @map("telegram_id") @db.VarChar(20)
  createdAt           DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  lastLoginAt         DateTime?       @map("last_login_at") @db.Timestamptz(6)
  auditLogsPerformed  OrderAuditLog[] @relation("AuditLogPerformer")
  operatorAssignments Order[]         @relation("OperatorAssignments")
  orders              Order[]
  sessions            Session[]
  appRoles            UserAppRole[]

  @@index([email])
  @@index([telegramId])
  @@index([createdAt])
  @@map("users")
}
```

**ШАГ 1.1.1**: Добавить новую модель ПОСЛЕ User model (после line ~30)

```prisma
model PasswordResetToken {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  token     String   @unique @db.VarChar(6)
  expiresAt DateTime @map("expires_at") @db.Timestamptz(6)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  used      Boolean  @default(false)
  usedAt    DateTime? @map("used_at") @db.Timestamptz(6)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
  @@index([used, expiresAt])
  @@map("password_reset_tokens")
}
```

**ШАГ 1.1.2**: Обновить User model - добавить relation

В User model (после line `appRoles UserAppRole[]`):

```prisma
model User {
  // ... existing fields ...
  appRoles            UserAppRole[]
  passwordResetTokens PasswordResetToken[] // ← ADD THIS LINE

  @@index([email])
  // ... existing indexes ...
}
```

**ПОЛНЫЙ DIFF для schema.prisma**:

```diff
model User {
  id                  String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email               String          @unique @db.VarChar(255)
  hashedPassword      String?         @map("hashed_password")
  isVerified          Boolean         @default(false) @map("is_verified")
  telegramId          String?         @unique @map("telegram_id") @db.VarChar(20)
  createdAt           DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  lastLoginAt         DateTime?       @map("last_login_at") @db.Timestamptz(6)
  auditLogsPerformed  OrderAuditLog[] @relation("AuditLogPerformer")
  operatorAssignments Order[]         @relation("OperatorAssignments")
  orders              Order[]
  sessions            Session[]
  appRoles            UserAppRole[]
+  passwordResetTokens PasswordResetToken[]

  @@index([email])
  @@index([telegramId])
  @@index([createdAt])
  @@map("users")
}

+ model PasswordResetToken {
+   id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
+   userId    String   @map("user_id") @db.Uuid
+   token     String   @unique @db.VarChar(6)
+   expiresAt DateTime @map("expires_at") @db.Timestamptz(6)
+   createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
+   used      Boolean  @default(false)
+   usedAt    DateTime? @map("used_at") @db.Timestamptz(6)
+   user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
+
+   @@index([token])
+   @@index([userId])
+   @@index([expiresAt])
+   @@index([used, expiresAt])
+   @@map("password_reset_tokens")
+ }
```

---

## 1.2. Создание Prisma Migration

### Команда для создания миграции

**PowerShell команда**:

```powershell
# Перейти в директорию с Prisma schema
cd e:\project\kiro\exchanger-front\packages\session-management

# Создать миграцию
pnpm prisma migrate dev --name add_password_reset_tokens

# ✅ Prisma автоматически:
# 1. Создаст директорию packages/session-management/prisma/migrations/{timestamp}_add_password_reset_tokens/
# 2. Сгенерирует migration.sql файл
# 3. Применит миграцию к БД
# 4. Обновит Prisma Client
```

### Ожидаемый migration.sql (автоматически сгенерируется)

**Файл**: `packages/session-management/prisma/migrations/{timestamp}_add_password_reset_tokens/migration.sql`

```sql
-- CreateTable
CREATE TABLE "public"."password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMPTZ(6),

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "public"."password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "public"."password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "public"."password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "public"."password_reset_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "password_reset_tokens_used_expires_at_idx" ON "public"."password_reset_tokens"("used", "expires_at");

-- AddForeignKey
ALTER TABLE "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

**Анализ миграции**:

- ✅ UUID primary key с `gen_random_uuid()` (как в banks migration)
- ✅ TIMESTAMPTZ(6) для timestamps (как в User model)
- ✅ Indexes для поиска по token, userId, expiresAt (performance)
- ✅ Foreign key с `ON DELETE CASCADE` (автоматическое удаление токенов при удалении user)
- ✅ Unique constraint на token (предотвращение дубликатов)

---

## 1.3. Верификация миграции

### Шаг 1: Проверить статус миграции

```powershell
cd e:\project\kiro\exchanger-front\packages\session-management
pnpm prisma migrate status

# Ожидаемый output:
# ✅ All migrations have been applied
```

### Шаг 2: Проверить структуру таблицы в БД

```powershell
# Подключиться к БД через psql
psql $env:DATABASE_URL

# Выполнить SQL запросы
\d password_reset_tokens

# Ожидаемый output:
#                                          Table "public.password_reset_tokens"
#    Column    |           Type           | Collation | Nullable |      Default
# -------------+--------------------------+-----------+----------+--------------------
#  id          | uuid                     |           | not null | gen_random_uuid()
#  user_id     | uuid                     |           | not null |
#  token       | character varying(6)     |           | not null |
#  expires_at  | timestamp with time zone |           | not null |
#  created_at  | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
#  used        | boolean                  |           | not null | false
#  used_at     | timestamp with time zone |           |          |
# Indexes:
#     "password_reset_tokens_pkey" PRIMARY KEY, btree (id)
#     "password_reset_tokens_token_key" UNIQUE CONSTRAINT, btree (token)
#     "password_reset_tokens_token_idx" btree (token)
#     "password_reset_tokens_user_id_idx" btree (user_id)
#     "password_reset_tokens_expires_at_idx" btree (expires_at)
#     "password_reset_tokens_used_expires_at_idx" btree (used, expires_at)
# Foreign-key constraints:
#     "password_reset_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

### Шаг 3: Проверить Prisma Client generation

```powershell
cd e:\project\kiro\exchanger-front\packages\session-management

# Сгенерировать Prisma Client (если не сделано автоматически)
pnpm prisma generate

# ✅ Prisma Client будет содержать:
# - prisma.passwordResetToken.create()
# - prisma.passwordResetToken.findUnique()
# - prisma.passwordResetToken.findFirst()
# - prisma.passwordResetToken.update()
# - prisma.passwordResetToken.delete()
```

### Шаг 4: Тестовый CRUD через Prisma Studio (опционально)

```powershell
# Запустить Prisma Studio
cd e:\project\kiro\exchanger-front
pnpm db:studio

# Откроется http://localhost:5555
# ✅ В списке моделей должна появиться "PasswordResetToken"
# ✅ Можно вручную создать тестовую запись для проверки
```

---

## 1.4. Типы TypeScript для PasswordResetToken

После генерации Prisma Client, доступны следующие типы:

```typescript
// Автоматически сгенерированные типы из Prisma
import { PasswordResetToken, Prisma } from '@repo/session-management/prisma/client';

// Основной тип модели
type PasswordResetToken = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
  usedAt: Date | null;
};

// Тип для создания токена
type PasswordResetTokenCreateInput = Prisma.PasswordResetTokenCreateInput;

// Тип для обновления токена
type PasswordResetTokenUpdateInput = Prisma.PasswordResetTokenUpdateInput;

// Тип для условий where
type PasswordResetTokenWhereInput = Prisma.PasswordResetTokenWhereInput;

// Тип для условий where с уникальными полями
type PasswordResetTokenWhereUniqueInput = Prisma.PasswordResetTokenWhereUniqueInput;
```

**Использование в коде**:

```typescript
// ✅ ПРИМЕР: Создание токена
const newToken = await prisma.passwordResetToken.create({
  data: {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    token: 'ABC123',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 минут
  },
});

// ✅ ПРИМЕР: Поиск токена
const foundToken = await prisma.passwordResetToken.findUnique({
  where: { token: 'ABC123' },
  include: { user: true }, // Include user relation
});

// ✅ ПРИМЕР: Обновление токена (mark as used)
await prisma.passwordResetToken.update({
  where: { id: newToken.id },
  data: {
    used: true,
    usedAt: new Date(),
  },
});

// ✅ ПРИМЕР: Удаление expired токенов
await prisma.passwordResetToken.deleteMany({
  where: {
    OR: [
      { expiresAt: { lt: new Date() } }, // Expired
      { used: true }, // Already used
    ],
  },
});
```

---

## 1.5. Rollback Strategy (если что-то пошло не так)

### Сценарий 1: Миграция применилась, но есть ошибки

```powershell
# Откатить последнюю миграцию
cd e:\project\kiro\exchanger-front\packages\session-management
pnpm prisma migrate resolve --rolled-back {timestamp}_add_password_reset_tokens

# Удалить директорию миграции
Remove-Item -Recurse -Force prisma/migrations/{timestamp}_add_password_reset_tokens

# Исправить schema.prisma и создать миграцию заново
pnpm prisma migrate dev --name add_password_reset_tokens
```

### Сценарий 2: Нужно удалить таблицу вручную

```sql
-- Подключиться к БД
psql $env:DATABASE_URL

-- Удалить таблицу (это удалит все foreign keys автоматически)
DROP TABLE IF EXISTS "public"."password_reset_tokens" CASCADE;

-- Проверить что таблица удалена
\dt password_reset_tokens
```

### Сценарий 3: Миграция застряла в pending состоянии

```powershell
# Пометить миграцию как applied
pnpm prisma migrate resolve --applied {timestamp}_add_password_reset_tokens

# Или пометить как rolled-back
pnpm prisma migrate resolve --rolled-back {timestamp}_add_password_reset_tokens
```

---

## 1.6. Phase 1 Checklist

### ✅ Pre-Migration

- [ ] Backup БД (если production): `pg_dump -h localhost -U user -d exchanger > backup.sql`
- [ ] Проверить DATABASE_URL в .env: `echo $env:DATABASE_URL`
- [ ] Проверить текущие миграции: `pnpm prisma migrate status`

### ✅ Migration

- [ ] Обновить schema.prisma (добавить PasswordResetToken model + relation в User)
- [ ] Запустить: `pnpm prisma migrate dev --name add_password_reset_tokens`
- [ ] Проверить что миграция создалась в `prisma/migrations/`
- [ ] Проверить что миграция применилась: `pnpm prisma migrate status`

### ✅ Verification

- [ ] Проверить структуру таблицы в БД: `\d password_reset_tokens`
- [ ] Проверить indexes созданы: `\di password_reset_tokens*`
- [ ] Проверить foreign key: `\d password_reset_tokens` (смотреть Foreign-key constraints)
- [ ] Проверить Prisma Client обновлен: `pnpm prisma generate`
- [ ] Открыть Prisma Studio и проверить новую модель: `pnpm db:studio`

### ✅ Testing

- [ ] Создать тестовый токен через Prisma Studio
- [ ] Проверить что можно найти токен: `prisma.passwordResetToken.findUnique({ where: { token: '...' }})`
- [ ] Проверить cascade delete: Удалить user → токены должны удалиться автоматически

### ✅ Documentation

- [ ] Добавить комментарий в schema.prisma о назначении PasswordResetToken model
- [ ] Обновить README.md проекта (если есть database schema documentation)

---

## 1.7. Troubleshooting

### Проблема: "Error: P3009: migrate found failed migration"

**Решение**:

```powershell
pnpm prisma migrate resolve --rolled-back {failed_migration_name}
rm -rf prisma/migrations/{failed_migration_name}
pnpm prisma migrate dev --name add_password_reset_tokens
```

### Проблема: "Error: P1001: Can't reach database server"

**Решение**:

```powershell
# Проверить что PostgreSQL запущен
docker ps | grep postgres

# Или запустить через docker-compose
docker-compose up -d postgres

# Проверить DATABASE_URL
echo $env:DATABASE_URL
```

### Проблема: "Error: Unique constraint failed on the fields: (`token`)"

**Причина**: Токен уже существует в БД (коллизия)  
**Решение**: PasswordResetTokenService должен генерировать уникальные токены (см. Phase 2)

### Проблема: Migration created но не applied

**Решение**:

```powershell
# Применить pending миграции
pnpm prisma migrate deploy

# Или mark as applied если миграция уже в БД
pnpm prisma migrate resolve --applied {migration_name}
```

---

## 1.8. Next Steps → Phase 2

После успешного завершения Phase 1:

1. ✅ Таблица `password_reset_tokens` создана в PostgreSQL
2. ✅ Prisma Client обновлен с типами для PasswordResetToken
3. ✅ Foreign key к User настроен с CASCADE delete
4. ✅ Indexes созданы для быстрого поиска

**Следующий шаг**: Phase 2 - Business Logic Layer

- Создать `PasswordResetTokenService` для CRUD операций
- Создать email templates (`password-reset.html`, `password-reset.txt`)
- Добавить метод `EmailService.sendPasswordReset`
- Добавить метод `EmailTemplateService.generatePasswordResetEmail`
