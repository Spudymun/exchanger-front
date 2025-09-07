# Руководство по переменным окружения в Turborepo + Next.js

## 📋 Обзор

Данное руководство описывает правильную работу с переменными окружения в монорепозитории на базе Turborepo и Next.js, основанное на реальном опыте решения проблем с загрузкой .env файлов.

## 🚨 Типичные проблемы

### Проблема: Переменные окружения не загружаются

```bash
🔍 UserManagerFactory DEBUG: {
  DATABASE_URL: 'не установлен',
  REDIS_URL: 'не установлен',
  FORCE_MOCK_MODE: 'не установлен'
}
```

### Причины:

1. **Неправильное расположение .env файлов** в монорепозитории
2. **Turborepo Strict Mode** фильтрует переменные по умолчанию
3. **Отсутствие конфигурации** в turbo.json

## 📁 Правильная структура файлов

### ❌ Неправильно (типичная ошибка):

```
exchanger-front/
├── .env                    # ❌ НЕ РАБОТАЕТ в Turborepo
├── turbo.json
└── apps/
    ├── web/
    └── admin-panel/
```

### ✅ Правильно (Turborepo Best Practices):

```
exchanger-front/
├── turbo.json
└── apps/
    ├── web/
    │   ├── .env            # ✅ .env в каждом приложении
    │   ├── .env.local      # ✅ Локальные переменные
    │   └── next.config.js
    └── admin-panel/
        └── .env            # ✅ .env для admin-panel
```

## 🔧 Конфигурация Turborepo

### turbo.json - правильная настройка:

```json
{
  "version": "3",
  "envMode": "loose", // 🔑 Ключевая настройка!
  "globalEnv": ["NODE_ENV"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true,
      "env": ["DATABASE_URL", "REDIS_URL", "FORCE_MOCK_MODE", "NEXTAUTH_SECRET", "NEXTAUTH_URL"]
    },
    "build": {
      "dependsOn": ["^build"],
      "env": ["DATABASE_URL", "REDIS_URL", "FORCE_MOCK_MODE", "NODE_ENV"],
      "inputs": [
        "$TURBO_DEFAULT$",
        ".env*" // 🔑 Учитываем .env файлы в хешах
      ]
    }
  }
}
```

## 🎯 Environment Modes в Turborepo

### Strict Mode (по умолчанию)

- Фильтрует переменные только до указанных в `env` и `globalEnv`
- **Безопасно**, но требует точной конфигурации
- Может вызывать ошибки `process.env.VARIABLE undefined`

### Loose Mode (рекомендуется для разработки)

```json
{
  "envMode": "loose" // Разрешает все переменные окружения
}
```

## 📝 Пример .env файла для apps/web/

```properties
# ===== DATABASE CONFIGURATION =====
DATABASE_URL="postgresql://exchanger_user:exchanger_password@localhost:5432/exchanger_db?schema=public"

# ===== REDIS CONFIGURATION =====
REDIS_URL="redis://localhost:6379"

# ===== APPLICATION SETTINGS =====
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev_secret_key_change_in_production

# ===== DEVELOPMENT FLAGS =====
FORCE_MOCK_MODE=false
DEV_MODE=true
DEBUG_SESSION=true

# ===== EXTERNAL SERVICES =====
SMTP_HOST=localhost
SMTP_PORT=1025
```

## 🔨 Конфигурация Next.js

### next.config.js с поддержкой .env:

```javascript
import bundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';
import pkg from '@next/env';

const { loadEnvConfig } = pkg;

// ⚡ Загружаем переменные окружения
const projectDir = process.cwd();
loadEnvConfig(projectDir);

// eslint-disable-next-line no-console, no-undef
console.log('🔧 Next.js config loading env vars...');
// eslint-disable-next-line no-console, no-undef
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'loaded' : 'missing');
// eslint-disable-next-line no-console, no-undef
console.log('REDIS_URL:', process.env.REDIS_URL ? 'loaded' : 'missing');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true', // eslint-disable-line no-undef
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/exchange-core', '@repo/constants', '@repo/ui', '@repo/utils'],
  serverExternalPackages: ['@trpc/server'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL, // eslint-disable-line no-undef
    REDIS_URL: process.env.REDIS_URL, // eslint-disable-line no-undef
    FORCE_MOCK_MODE: process.env.FORCE_MOCK_MODE, // eslint-disable-line no-undef
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
```

## 🔍 Диагностика проблем

### 1. Проверка загрузки переменных:

```bash
# В корне проекта
turbo run dev --summarize

# Проверить какие переменные доступны
node -e "console.log(Object.keys(process.env).filter(key => key.includes('DATABASE')))"
```

### 2. Проверка .env файлов:

```bash
# Проверить существование файлов
ls -la apps/web/.env*

# Проверить содержимое
cat apps/web/.env | grep DATABASE_URL
```

### 3. Отладка в коде:

```typescript
// Добавить в начало файла для диагностики
console.log('🔍 Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? 'loaded' : 'missing',
  REDIS_URL: process.env.REDIS_URL ? 'loaded' : 'missing',
});
```

## 🚀 Пошаговое решение

### Шаг 1: Создать .env в правильном месте

```bash
# Скопировать .env из корня в приложение
cp .env apps/web/.env
```

### Шаг 2: Настроить turbo.json

```json
{
  "envMode": "loose",
  "tasks": {
    "dev": {
      "env": ["DATABASE_URL", "REDIS_URL", "FORCE_MOCK_MODE"]
    }
  }
}
```

### Шаг 3: Установить @next/env

```bash
cd apps/web && npm install @next/env
```

### Шаг 4: Обновить next.config.js

Добавить загрузку переменных через `@next/env` (см. пример выше)

### Шаг 5: Перезапустить проект

```bash
turbo run dev
```

## ✅ Проверка успешного решения

После правильной настройки вы должны увидеть:

```bash
🔧 Next.js config loading env vars...
DATABASE_URL: loaded
REDIS_URL: loaded

🔍 UserManagerFactory DEBUG: {
  NODE_ENV: 'development',
  detected_environment: 'development',
  DATABASE_URL: 'установлен',
  REDIS_URL: 'установлен',
  FORCE_MOCK_MODE: 'false'
}

🚀 Используем PostgreSQL + Redis
```

## 🔗 Полезные ссылки

- [Turborepo Environment Variables](https://turborepo.com/docs/crafting-your-repository/using-environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Turborepo Best Practices](https://turborepo.com/docs/crafting-your-repository/using-environment-variables#best-practices)

## 📊 Итоги

### Ключевые принципы:

1. **Размещайте .env файлы в каждом приложении** (apps/web/.env, apps/admin-panel/.env)
2. **Используйте envMode: "loose"** для разработки
3. **Настройте env массивы** в turbo.json для каждой задачи
4. **Используйте @next/env** для загрузки переменных в Next.js конфиге
5. **Добавляйте .env файлы в inputs** для правильного кеширования

### Частые ошибки:

- ❌ .env файл в корне монорепо
- ❌ Забыть про envMode в turbo.json
- ❌ Не указать переменные в env массивах
- ❌ Не установить @next/env пакет

**Следуя этому руководству, вы избежите проблем с переменными окружения в Turborepo + Next.js проектах!**
