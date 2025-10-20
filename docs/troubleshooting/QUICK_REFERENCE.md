# Quick Reference - Telegram Bot Docker Build

> Краткая шпаргалка для быстрого решения типичных проблем

## 🔥 Быстрые решения

### Build падает с "Cannot find module"

```bash
# Проверьте что используется tsc --build:
cat packages/*/package.json | grep '"build":'

# Должно быть:
"build": "tsc --build"  # ✅
# Не:
"build": "tsc"  # ❌
```

### Prisma типы не найдены

```bash
# Проверьте что Prisma генерируется в Dockerfile:
grep "prisma generate" apps/telegram-bot/Dockerfile

# Должно быть:
RUN npx prisma generate --schema=./packages/session-management/prisma/schema.prisma
```

### Cross-app type imports не работают

```bash
# ❌ НЕ ДЕЛАЙТЕ ТАК:
import type { AppRouter } from '../../../web/src/server/trpc';

# ✅ ПРАВИЛЬНО:
# 1. Создайте packages/api-contract/
# 2. Re-export типы:
export type { AppRouter } from '../../../apps/web/src/server/trpc';
# 3. Импортируйте:
import type { AppRouter } from '@repo/api-contract';
# 4. Обновите turbo prune:
RUN turbo prune telegram-bot web --docker
```

## 📋 Build checklist

```bash
# 1. Все dependencies объявлены?
npx depcheck packages/exchange-core

# 2. Build scripts используют --build?
grep -r '"build": "tsc"' packages/*/package.json  # Должно быть пусто

# 3. Prisma генерируется?
grep "prisma generate" apps/telegram-bot/Dockerfile

# 4. Docker build проходит?
docker build -f apps/telegram-bot/Dockerfile -t test .

# 5. Размер image разумный?
docker images | grep test
```

## 🐛 Debug команды

```bash
# Проверить что включено в turbo prune:
docker build --target=pruner -f apps/telegram-bot/Dockerfile -t pruner-test .
docker run --rm -it pruner-test ls -la /app/out/full/

# Проверить какие packages включены:
docker run --rm -it pruner-test ls -la /app/out/full/packages/

# Проверить что web включён (для api-contract):
docker run --rm -it pruner-test ls -la /app/out/full/apps/
```

## 🎯 Быстрый тест после изменений

```bash
# 1. Очистить Docker cache:
docker builder prune -f

# 2. Build без cache:
docker build --no-cache -f apps/telegram-bot/Dockerfile -t telegram-bot-test .

# 3. Проверить успех:
echo $?  # Должно быть 0

# 4. Проверить логи:
docker build -f apps/telegram-bot/Dockerfile . 2>&1 | grep -E "Tasks:|successful|Failed"
```

## 📦 Структура правильного package

```json
{
  "name": "@repo/my-package",
  "scripts": {
    "build": "tsc --build" // ← НЕ просто "tsc"
  },
  "dependencies": {
    // Все direct imports должны быть здесь
    "@repo/other-package": "*",
    "some-library": "^1.0.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "@types/some-library": "^1.0.0" // Типы тоже
  }
}
```

## 🚨 Типичные ошибки

| Ошибка                                             | Причина                   | Решение                                 |
| -------------------------------------------------- | ------------------------- | --------------------------------------- |
| `Cannot find module '@repo/xxx'`                   | Не объявлена dependency   | Добавить в package.json                 |
| `Module '"@prisma/client"' has no exported member` | Prisma не сгенерирован    | Добавить `prisma generate` в Dockerfile |
| `Cannot find module '../../../web/xxx'`            | Cross-app import          | Создать shared package                  |
| `Tasks: 0 successful, 6 total`                     | TypeScript race condition | Использовать `tsc --build`              |

## 📚 Полная документация

См. [TELEGRAM_BOT_DOCKER_BUILD_ISSUES.md](./TELEGRAM_BOT_DOCKER_BUILD_ISSUES.md) для детального объяснения.
