# Webpack Externals + Monorepo ESM Packages: Module Resolution Проблемы

## Проблема

При работе с **Next.js monorepo** с ESM пакетами (`@repo/*`) возникают ошибки **"Can't resolve module"** или **"Module not found"**:

```bash
Error: Module not found: Can't resolve '@repo/exchange-core'
Error [ERR_REQUIRE_ESM]: require() of ES Module
Module not found: Can't resolve '@repo/session-management'
```

Попытки решить через **webpack externals** приводят к еще большим проблемам:

- ❌ В production build: "Module not found"
- ❌ В dev режиме: "require() of ES Module" crash
- ❌ В instrumentation.ts: полный крах с ESM/CJS конфликтами

---

## Почему webpack externals НЕ работают в monorepo

### Типичная попытка решения

```javascript
// next.config.js
// ❌ ЛОМАЕТ ВСЕ в monorepo с ESM пакетами
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals.push({
      '@repo/exchange-core': 'commonjs @repo/exchange-core',
      '@repo/session-management': 'commonjs @repo/session-management',
    });
  }
  return config;
};
```

### Что происходит

**1. В instrumentation.ts (отдельный webpack entry point):**

- Webpack помечает `@repo/*` как external
- Пытается сделать `require('@repo/exchange-core')`
- Но `@repo/exchange-core` в **ESM формате** (type: "module")
- Результат: **ERR_REQUIRE_ESM crash**

**2. В main app bundle:**

- `transpilePackages` уже конвертирует ESM → CommonJS
- Но если добавить externals, webpack НЕ применяет transpilePackages
- Результат: **module not found** или **ESM/CJS конфликт**

**3. Транзитивные зависимости:**

- `@repo/exchange-core` импортирует другие `@repo/*` пакеты
- Даже если основной пакет external, зависимости остаются в ESM
- Webpack пытается разрешить их статически
- Результат: **cascade of module errors**

### Фундаментальная проблема

```
Webpack externals говорит: "не трогай этот модуль, он внешний"
    ↓
transpilePackages говорит: "конвертируй ESM → CommonJS"
    ↓
Конфликт: externals отключает transpilePackages!
    ↓
ESM модули остаются в ESM формате
    ↓
require() не работает с ESM
    ↓
CRASH
```

---

## Почему instrumentation.ts особенно проблематичен

### Что такое instrumentation.ts

Next.js предоставляет [`instrumentation.ts`](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation) для ранней server-side инициализации:

```typescript
// apps/web/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Код здесь выполняется ДО запуска основного сервера
    const { startBackgroundService } = await import('./src/server/background');
    startBackgroundService();
  }
}
```

### Проблема: отдельный webpack entry point

**instrumentation.ts** компилируется **отдельно** от main app bundle:

- ❌ `transpilePackages` **НЕ применяется**
- ❌ Если есть webpack externals → `require()` ESM module
- ❌ Даже dynamic import не помогает (webpack анализирует статически)

```bash
# Типичная ошибка:
Error [ERR_REQUIRE_ESM]: require() of ES Module
/path/to/packages/exchange-core/src/index.ts is treated as an ES module
```

---

## ✅ Правильное решение

### Не использовать webpack externals для monorepo пакетов

```javascript
// next.config.js
// ✅ ПРАВИЛЬНО: только transpilePackages
const nextConfig = {
  transpilePackages: [
    '@repo/exchange-core',
    '@repo/session-management',
    '@repo/constants',
    '@repo/utils',
    // ... все @repo/* пакеты
  ],

  // ❌ НЕ добавлять webpack externals для @repo/* пакетов!
  // webpack: (config) => { ... } // не нужно для monorepo
};
```

### Почему это работает

1. **transpilePackages** конвертирует `@repo/*` ESM → CommonJS
2. Webpack включает их в bundle (не external)
3. Все импорты работают корректно
4. Работает и в dev, и в production
5. Работает в main bundle, API routes, Server Components

### Если НЕ нужен instrumentation.ts

**Проблема:** Нужно запустить background service (cron, worker, etc.)

**Решение:** Инициализация в main server bundle через singleton pattern

```typescript
// apps/web/src/server/utils/service-singleton.ts
let serviceInstance: MyService | null = null;

export function getService(): MyService {
  if (!serviceInstance) {
    serviceInstance = new MyService();
    serviceInstance.start();
  }
  return serviceInstance;
}
```

```typescript
// apps/web/src/server/trpc/context.ts
import { getService } from '../utils/service-singleton';

export async function createContext() {
  // Инициализация при первом запросе
  void getService();

  return { db, session /* ... */ };
}
```

**Почему это работает:**

- ✅ Код в main server bundle (transpilePackages применен)
- ✅ `@repo/*` пакеты уже в CommonJS
- ✅ Нет ESM/CJS конфликтов
- ✅ Lazy initialization при первом запросе

---

## Наш кейс: OrderCleanupCron

### Что пытались сделать

Запустить cron job для автоматической отмены истекших заказов:

```typescript
// ❌ ПОПЫТКА 1: instrumentation.ts + webpack externals
// apps/web/instrumentation.ts
export async function register() {
  const { OrderCleanupCron } = await import('./src/server/utils/order-cleanup-cron');
  const cron = new OrderCleanupCron();
  cron.start();
}
```

```javascript
// next.config.js
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals.push({
      '@repo/exchange-core': 'commonjs @repo/exchange-core',
    });
  }
  return config;
};
```

**Результат:**

```bash
Error [ERR_REQUIRE_ESM]: require() of ES Module @repo/exchange-core
```

### Что сделали (правильно)

**1. Удалили instrumentation.ts полностью**

**2. Удалили webpack externals из next.config.js**

**3. Создали singleton pattern:**

```typescript
// apps/web/src/server/utils/cleanup-cron-singleton.ts
import { OrderCleanupCron } from './order-cleanup-cron';

let cleanupCronInstance: OrderCleanupCron | null = null;

export function getCleanupCron(): OrderCleanupCron {
  if (!cleanupCronInstance) {
    console.log('[CleanupCron] Initializing singleton');
    cleanupCronInstance = new OrderCleanupCron();
    cleanupCronInstance.start();
  }
  return cleanupCronInstance;
}

if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    cleanupCronInstance?.stop();
  });
}
```

**4. Инициализация в createContext:**

```typescript
// apps/web/src/server/trpc/context.ts
import { getCleanupCron } from '../utils/cleanup-cron-singleton';

export async function createContext() {
  void getCleanupCron(); // Lazy init при первом tRPC запросе

  return {
    db: prisma,
    session: await getSession(),
  };
}
```

**Результат:** ✅ Работает в dev и production, нет ошибок module resolution

---

## Когда можно использовать webpack externals

### ✅ Безопасные случаи

**1. npm пакеты, которые точно в CommonJS:**

```javascript
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals.push('canvas', 'sharp'); // native modules
  }
  return config;
};
```

**2. serverExternalPackages (Next.js опция):**

```javascript
// next.config.js
const nextConfig = {
  serverExternalPackages: ['sharp', 'canvas'], // только npm пакеты
};
```

### ❌ НЕ использовать externals для

- Monorepo пакеты (`@repo/*`, workspace packages)
- Любые ESM модули (type: "module")
- Пакеты с транзитивными зависимостями в monorepo
- Использование в instrumentation.ts

---

## Проверочный чеклист

Если у вас ошибки "Module not found" или "ERR_REQUIRE_ESM":

- [ ] **Проверить next.config.js:** есть ли webpack externals для `@repo/*`?
  - Если да → **удалить их**
- [ ] **Проверить transpilePackages:** все ли `@repo/*` пакеты добавлены?
  - Если нет → **добавить все monorepo пакеты**
- [ ] **Проверить instrumentation.ts:** импортирует ли `@repo/*` пакеты?
  - Если да → **переместить логику в main bundle** (singleton pattern)
- [ ] **Проверить package.json:** все ли `@repo/*` пакеты имеют `"type": "module"`?
  - Если да → **убедиться что нет webpack externals**
- [ ] **Проверить dev сервер:** `npm run dev` запускается без ошибок?
- [ ] **Проверить production build:** `npm run build` успешен?

---

## Связанные проблемы

### turbopack-ioredis-leak.md

Похожая проблема с **client/server bundle leak** в Turbopack:

- Решение: `turbopack.resolveAlias` для блокировки server модулей в client
- НО: это для **npm пакетов**, не для `@repo/*` monorepo пакетов

### MODULE_RESOLUTION_TROUBLESHOOTING.md

Общие проблемы module resolution в TypeScript/Next.js:

- Path aliases (`@/*`)
- tsconfig.json paths
- package.json exports

---

## Итог

**Проблема:** "Can't resolve module" / "ERR_REQUIRE_ESM" в Next.js monorepo

**Причина:** webpack externals отключает transpilePackages → ESM пакеты остаются в ESM

**Решение:**

1. ❌ Удалить webpack externals для `@repo/*` пакетов
2. ✅ Использовать только transpilePackages
3. ❌ Не использовать instrumentation.ts с `@repo/*` импортами
4. ✅ Singleton pattern в main server bundle для background services

**Применение:** OrderCleanupCron успешно работает через getCleanupCron() singleton
