# Telegram Bot Docker Build - Troubleshooting Guide

> **Дата создания**: 19 октября 2025  
> **Статус**: Все проблемы решены ✅  
> **Контекст**: Этот документ описывает реальные проблемы, возникшие при настройке Docker build для `apps/telegram-bot` в Turborepo monorepo, и их решения.

---

## Оглавление

1. [Критическая проблема: TypeScript Race Condition](#1-критическая-проблема-typescript-race-condition)
2. [Проблема: Отсутствие Prisma Client в Docker](#2-проблема-отсутствие-prisma-client-в-docker)
3. [Проблема: Missing Dependencies в exchange-core](#3-проблема-missing-dependencies-в-exchange-core)
4. [Критическая проблема: tRPC Type Imports между Apps](#4-критическая-проблема-trpc-type-imports-между-apps)
5. [Архитектурное решение: @repo/api-contract Package](#5-архитектурное-решение-repoapi-contract-package)
6. [Общие выводы и Best Practices](#6-общие-выводы-и-best-practices)

---

## 1. Критическая проблема: TypeScript Race Condition

### Симптомы

```bash
docker build -f apps/telegram-bot/Dockerfile .

# Ошибка при сборке:
Error: Cannot find module '@repo/constants/dist/index.js'
```

**Важно**: Проблема возникала **только в Docker**, в локальной разработке всё работало.

### Анализ

При выполнении `turbo run build` в Docker наблюдалась следующая последовательность:

```
19:53:29.073 - @repo/constants:build exits ✅ (процесс завершился)
19:53:29.081 - @repo/exchange-core:build starts ⚡ (через 8ms!)
19:53:29.081 - ERROR: Cannot find '@repo/constants/dist/index.js'
```

**Root Cause**: TypeScript `tsc` команда завершает процесс **немедленно** после компиляции, но запись файлов на диск происходит **асинхронно**. Turborepo видит `exit code 0` и сразу запускает зависимые задачи, не дожидаясь фактического создания `dist/` файлов.

### Решение

Заменили `tsc` на `tsc --build` во всех packages с TypeScript компиляцией.

**Изменённые файлы:**

#### `packages/constants/package.json`

```json
{
  "scripts": {
    "build": "tsc --build" // ← Было: "tsc"
  }
}
```

#### `packages/email-service/package.json`

```json
{
  "scripts": {
    "build": "tsc --build" // ← Было: "tsc"
  }
}
```

#### `packages/hooks/package.json`

```json
{
  "scripts": {
    "build": "tsc --build" // ← Было: "tsc"
  }
}
```

#### `packages/exchange-core/package.json`

```json
{
  "scripts": {
    "build": "tsc --build" // ← Было: "tsc"
  }
}
```

#### `packages/session-management/package.json`

```json
{
  "scripts": {
    "build": "prisma generate && tsc --build" // ← Было: "tsc"
  }
}
```

### Почему `--build` решает проблему?

TypeScript Project References mode (`--build` flag):

- ✅ **Синхронно ждёт** завершения записи всех output файлов
- ✅ Соблюдает порядок сборки через `references` в tsconfig.json
- ✅ Гарантирует что dist/ полностью готов перед exit

Обычный `tsc`:

- ❌ Завершает процесс сразу после компиляции
- ❌ Записывает файлы асинхронно (через Node.js fs API)
- ❌ Turborepo видит exit code 0 и запускает следующую задачу

### Проверка решения

```bash
# До исправления (FAILED):
docker build -f apps/telegram-bot/Dockerfile .
# Tasks: 0 successful, 6 total
# Cached: 0 cached, 6 total

# После исправления (SUCCESS):
docker build -f apps/telegram-bot/Dockerfile .
# Tasks: 6 successful, 6 total ✅
# Cached: 0 cached, 6 total
```

---

## 2. Проблема: Отсутствие Prisma Client в Docker

### Симптомы

```bash
# TypeScript ошибки при сборке:
error TS2305: Module '"@prisma/client"' has no exported member 'PrismaClient'
error TS2305: Module '"@prisma/client"' has no exported member 'OrderStatus'
error TS2305: Module '"@prisma/client"' has no exported member 'WalletStatus'
```

### Анализ

Prisma Client генерируется из schema.prisma и **не коммитится в git**. При Docker build:

1. Копируется source code через `turbo prune`
2. Устанавливаются dependencies (`npm ci`)
3. **НО**: Prisma Client не существует в `node_modules/@prisma/client`
4. TypeScript не может найти типы при компиляции

### Решение

Добавили `prisma generate` в Dockerfile **после** копирования source code, но **до** turbo build.

#### `apps/telegram-bot/Dockerfile`

```dockerfile
# Copy source code from pruned workspace
COPY --from=pruner /app/out/full/ .

# ✅ Generate Prisma Client for session-management package
RUN npx prisma generate --schema=./packages/session-management/prisma/schema.prisma

# Build using Turborepo
RUN npx turbo run build --filter=telegram-bot...
```

### Дополнительно: Build script

Также обновили build script в `session-management` чтобы генерировать Prisma Client локально:

#### `packages/session-management/package.json`

```json
{
  "scripts": {
    "build": "prisma generate && tsc --build"
  }
}
```

### Проверка решения

```bash
# Prisma Client успешно генерируется:
✔ Generated Prisma Client (v6.15.0) to ./../../node_modules/@prisma/client in 191ms

# TypeScript компиляция проходит без ошибок:
@repo/session-management:build: ✓ Compiled successfully
```

---

## 3. Проблема: Missing Dependencies в exchange-core

### Симптомы

```bash
# TypeScript ошибки:
error TS7016: Could not find a declaration file for module 'bcryptjs'
error TS2307: Cannot find module '@repo/email-service'
error TS2307: Cannot find module '@repo/hooks'
```

### Анализ

Package `@repo/exchange-core` использовал эти зависимости в коде, но они не были объявлены в `package.json`:

```typescript
// packages/exchange-core/src/server.ts
import bcrypt from 'bcryptjs'; // ❌ Не в dependencies
import { sendEmail } from '@repo/email-service'; // ❌ Не в dependencies
import { useOrderTracking } from '@repo/hooks'; // ❌ Не в dependencies
```

В локальной разработке работало благодаря npm workspace hoisting, но в Docker (после `turbo prune`) эти пакеты не включались в pruned workspace.

### Решение

Добавили все используемые зависимости в `package.json`:

#### `packages/exchange-core/package.json`

```json
{
  "dependencies": {
    "@repo/constants": "*",
    "@repo/email-service": "*", // ← Добавлено
    "@repo/hooks": "*", // ← Добавлено
    "@repo/utils": "*",
    "bcryptjs": "^2.4.3" // ← Добавлено
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "@types/bcryptjs": "^2.4.6" // ← Добавлено
  }
}
```

### Best Practice

**Всегда объявляйте direct dependencies**, даже если они доступны через hoisting:

```bash
# Проверка неиспользуемых dependencies:
npx depcheck packages/exchange-core

# Проверка отсутствующих dependencies:
npx dependency-check packages/exchange-core/package.json --entry src/**/*.ts
```

---

## 4. Критическая проблема: tRPC Type Imports между Apps

### Симптомы

```bash
# В telegram-bot использовался прямой импорт из web:
import type { AppRouter } from '../../../web/src/server/trpc';

# Docker build ошибка:
error TS2307: Cannot find module '../../../web/src/server/trpc'
or its corresponding type declarations.
```

### Анализ

**Проблема архитектуры monorepo:**

```
apps/
  web/                    # Next.js app с tRPC server
    src/server/trpc/
      index.ts           # export type { AppRouter }

  telegram-bot/          # Next.js microservice с tRPC client
    src/lib/trpc-client.ts
      # ❌ import type { AppRouter } from '../../../web/src/server/trpc'
```

**Почему не работает в Docker:**

1. `turbo prune telegram-bot --docker` создаёт изолированный workspace
2. В pruned workspace **нет** `apps/web` (не является dependency)
3. TypeScript не может резолвить `../../../web/` путь
4. Build fails

**Почему работает локально:**

- Все apps находятся в одном monorepo
- TypeScript paths mapping резолвит relative imports
- npm workspace symlinks работают

### Неудачные попытки решения

#### ❌ Попытка 1: Генерация .d.ts файлов

Пытались генерировать только type definitions из web:

```dockerfile
# Создали отдельный stage:
FROM base AS web-types
COPY apps/web/src/server/trpc ./apps/web/src/server/trpc/
RUN npm run build:types  # tsc --emitDeclarationOnly

# Копировали в telegram-bot:
COPY --from=web-types /app/apps/web/dist/types /app/web-types
```

**Провал**: Type generation требовал полную dependency chain:

- web/src/server/trpc → web/src/server/utils (session, prisma)
- utils → @repo/session-management
- session-management → **Prisma Client** (requires generation)
- Плюс runtime dependencies: `bullmq`, `ioredis`, etc.

#### ❌ Попытка 2: turbo prune с build:types

Добавили script в web/package.json:

```json
{
  "scripts": {
    "build:types": "tsc --project tsconfig.types.json"
  }
}
```

**Провал**: `turbo prune` копирует package.json **до** наших изменений (из cached layer), поэтому script не существовал в pruned workspace.

#### ❌ Попытка 3: Прямое копирование web source

```dockerfile
COPY apps/web/src/server/trpc ./apps/web/src/server/trpc/
COPY apps/web/tsconfig.json ./apps/web/
RUN npm ci --workspace=web
```

**Провал**:

- Husky postinstall scripts падали в Alpine Linux
- Требовался полный web/src (не только trpc/)
- Size увеличивался на 50MB+

---

## 5. Архитектурное решение: @repo/api-contract Package

### Подход

Следуя **best practices для tRPC в monorepo** (источник: tRPC GitHub discussions), создали отдельный package для type sharing.

### Реализация

#### Шаг 1: Создали `packages/api-contract/`

**Структура:**

```
packages/api-contract/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

#### `packages/api-contract/package.json`

```json
{
  "name": "@repo/api-contract",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@repo/eslint-config": "*",
    "@repo/typescript-config": "*",
    "typescript": "^5.7.2"
  }
}
```

#### `packages/api-contract/src/index.ts`

```typescript
/**
 * API Contract Package
 *
 * This package re-exports only the TYPE definitions from the web tRPC server.
 * It does NOT include any runtime code, ensuring that importing this package
 * in client applications (like telegram-bot) won't pull in server implementation.
 *
 * Following best practices from:
 * https://github.com/trpc/trpc (monorepo type sharing)
 */

// ✅ Type-only import to avoid bundling runtime code
export type { AppRouter } from '../../../apps/web/src/server/trpc';
```

**Ключевой момент**: `export type` гарантирует что **только типы** экспортируются, никакого runtime кода.

#### Шаг 2: Обновили telegram-bot

**`apps/telegram-bot/package.json`:**

```json
{
  "dependencies": {
    "@repo/api-contract": "*", // ← Добавлено
    "@repo/constants": "*",
    "@repo/session-management": "*",
    "@repo/utils": "*",
    "@tanstack/react-query": "^5.81.5",
    "@trpc/client": "^11.0.5",
    "@trpc/server": "^11.0.5",
    "bullmq": "^5.34.2",
    "ioredis": "^5.7.0",
    "next": "^15.3.0",
    "superjson": "^2.2.1",
    "telegraf": "^4.16.3",
    "zod": "^3.25.67"
  }
}
```

**`apps/telegram-bot/src/lib/trpc-client.ts`:**

```typescript
// ✅ БЫЛО:
// import type { AppRouter } from '../../../web/src/server/trpc';

// ✅ СТАЛО:
import type { AppRouter } from '@repo/api-contract';

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

// ... rest of the file
```

**`apps/telegram-bot/tsconfig.json`:**

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@repo/api-contract": ["../../packages/api-contract/src"],
      "@repo/api-contract/*": ["../../packages/api-contract/src/*"],
      // ... other paths
    },
  },
}
```

#### Шаг 3: Обновили Dockerfile

**Ключевое изменение** - включили `web` в turbo prune:

**`apps/telegram-bot/Dockerfile`:**

```dockerfile
# Generate pruned monorepo for telegram-bot AND web (needed for api-contract types)
# This creates /app/out/json (for installing deps) and /app/out/full (for building)
RUN turbo prune telegram-bot web --docker
#                            ^^^ ← Добавлено
```

**Почему нужен web?**

`@repo/api-contract` делает type-only import из `apps/web/src/server/trpc`, поэтому при TypeScript compilation api-contract нужен доступ к web source files для резолва типов.

### Dependency Graph

```
telegram-bot
  └─ @repo/api-contract
       └─ apps/web (type-only)
            └─ @repo/session-management
            └─ @repo/exchange-core
            └─ @repo/constants
            └─ @repo/utils
```

`turbo prune telegram-bot web` включает:

- ✅ telegram-bot source
- ✅ api-contract source
- ✅ web source (для type resolution)
- ✅ Все shared packages
- ❌ web node_modules (не нужны)
- ❌ web .next build (не нужны)

### Результат

```bash
docker build -f apps/telegram-bot/Dockerfile -t telegram-bot-clean .

# Output:
• Packages in scope: @repo/api-contract, @repo/constants,
  @repo/email-service, @repo/eslint-config, @repo/exchange-core,
  @repo/hooks, @repo/session-management, @repo/typescript-config,
  @repo/utils, telegram-bot

✅ @repo/constants:build
✅ @repo/email-service:build
✅ @repo/hooks:build
✅ @repo/exchange-core:build
✅ @repo/session-management:build
✅ telegram-bot:build

Tasks: 6 successful, 6 total
Cached: 0 cached, 6 total
Time: 39.141s

Successfully built telegram-bot-clean
```

---

## 6. Общие выводы и Best Practices

### TypeScript в Monorepo

✅ **DO:**

- Используйте `tsc --build` для composite projects
- Настройте project references в tsconfig.json
- Проверяйте build в Docker, не только локально

❌ **DON'T:**

- Не используйте просто `tsc` в package scripts
- Не полагайтесь на async file operations
- Не тестируйте только в dev mode

### Prisma в Docker

✅ **DO:**

- Генерируйте Prisma Client в Dockerfile
- Запускайте `prisma generate` **после** COPY source
- Добавляйте `prisma generate` в package build scripts

❌ **DON'T:**

- Не коммитьте `node_modules/@prisma/client` в git
- Не полагайтесь на pre-generated client
- Не забывайте про schema path в monorepo

### Dependencies Management

✅ **DO:**

- Объявляйте **все** direct dependencies
- Используйте `depcheck` для аудита
- Тестируйте pruned workspace (`turbo prune`)

❌ **DON'T:**

- Не полагайтесь на hoisting
- Не используйте transitive dependencies напрямую
- Не игнорируйте TypeScript errors о missing modules

### tRPC Type Sharing

✅ **DO:**

- Создавайте отдельный package для API contract
- Используйте `export type` для type-only exports
- Следуйте official tRPC best practices
- Включайте source apps в turbo prune при необходимости

❌ **DON'T:**

- Не делайте cross-app imports (`../../../`)
- Не пытайтесь генерировать isolated .d.ts files
- Не копируйте runtime code для type access
- Не включайте implementation в type packages

### Docker Build Optimization

✅ **DO:**

- Используйте multi-stage builds
- Кешируйте `npm ci` layer отдельно
- Используйте `turbo prune --docker`
- Копируйте только необходимые files в runtime stage

❌ **DON'T:**

- Не копируйте весь monorepo в каждый stage
- Не устанавливайте devDependencies в production
- Не забывайте про .dockerignore
- Не игнорируйте layer caching

---

## Checklist для новых микросервисов

При добавлении нового приложения в monorepo:

- [ ] Используете `tsc --build` в build scripts
- [ ] Объявили все direct dependencies
- [ ] Добавили Prisma generation в Dockerfile (если используется)
- [ ] Создали отдельный contract package для shared types
- [ ] Настроили `turbo prune` с нужными apps
- [ ] Протестировали Docker build с нуля (без cache)
- [ ] Проверили размер финального Docker image
- [ ] Добавили health check в Dockerfile
- [ ] Настроили правильные environment variables
- [ ] Задокументировали архитектурные решения

---

## Дополнительные ресурсы

**TypeScript Project References:**

- https://www.typescriptlang.org/docs/handbook/project-references.html

**Turborepo Docker Guide:**

- https://turbo.build/repo/docs/guides/tools/docker

**tRPC Monorepo Best Practices:**

- https://github.com/trpc/trpc/discussions
- https://trpc.io/docs/server/introduction

**Prisma in Docker:**

- https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker

---

**Документ создан на основе реального troubleshooting процесса.**  
**Все примеры кода взяты из production codebase.**  
**Последнее обновление: 19 октября 2025**
