# Client/Server Import Architecture для @repo/exchange-core

**Дата создания:** 1 октября 2025  
**Автор:** AI Agent  
**Статус:** Реализовано и протестировано

## 🎯 Проблема, которую решает

### Исходная проблема

При попытке собрать frontend приложения (admin-panel, web client-side) возникали ошибки компиляции:

```
Module not found: Can't resolve 'child_process'
Module not found: Can't resolve 'node:fs'
Module not found: Can't resolve 'node:path'
```

**Причина:** Пакет `@repo/exchange-core` экспортировал server-only зависимости (nodemailer, email-service с Node.js модулями), которые попадали в frontend bundle через цепочку импортов.

### Цепочка проблемных импортов

```
admin-panel/app/page.tsx
  ↓ import @repo/exchange-core
  ↓ export * from './services'
  ↓ export queue-email-notifier.ts
  ↓ import email-service (nodemailer)
  ↓ Node.js modules в frontend bundle ❌
```

## 🏗️ Архитектурное решение

### Новая структура экспортов

```typescript
// packages/exchange-core/src/
├── index.ts          // Основной экспорт (client-safe)
├── client.ts         // ✅ Явно client-safe экспорты
└── server.ts         // 🚫 Server-only экспорты
```

### package.json конфигурация

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts",
    "./server": "./src/server.ts"
  }
}
```

## 📋 Что находится в каждом файле

### client.ts - Безопасно для frontend

```typescript
// ✅ Все типы данных (без runtime зависимостей)
export * from './types';

// ✅ Repository интерфейсы (только типы)
export * from './repositories';

// ✅ Адаптеры и фабрики
export * from './adapters';
export * from './factories';

// ✅ Клиентские утилиты (БЕЗ Node.js зависимостей)
export * from './utils/calculations';
export * from './utils/data-sanitizers';
// ❌ ИСКЛЮЧЕНО: ./utils/crypto (содержит импорты из services)

// ✅ Безопасные сервисы
export * from './services/id-generation';
export * from './services/crypto-address-generation';
// ❌ ИСКЛЮЧЕНО: auto-registration, smart-pricing (могут иметь server зависимости)

// ✅ Data managers и mock данные для UI
export * from './data';
```

### server.ts - Только для server-side

```typescript
// ✅ SERVER-ONLY: Email notification service (содержит nodemailer)
export * from './services/queue-email-notifier';

// ✅ SERVER-ONLY: Wallet management services
export * from './services/wallet-pool-manager';
export * from './services/wallet-pool-manager-factory';

// ✅ SERVER-ONLY: Business services для tRPC роутеров
export * from './services/auto-registration-service';
export * from './services/smart-pricing-service';

// ✅ SERVER-ONLY: Monitoring and alerting services
export { WalletAlertsService } from './services/wallet-alerts-service';
export { WalletMonitoringProcess } from './services/wallet-monitoring-process';

// ✅ Re-export client-safe types для серверного кода
export * from './client';

// ✅ Утилиты для проверки server environment
export function isServerEnvironment(): boolean;
export function requireServerEnvironment(moduleName: string): void;
```

### index.ts - Обратная совместимость

```typescript
/**
 * ОСНОВНОЙ ЭКСПОРТ - ОБРАТНАЯ СОВМЕСТИМОСТЬ
 *
 * ⚠️ Теперь экспортирует ТОЛЬКО client-safe функции
 * для предотвращения проблем с frontend сборкой.
 */

// ✅ БЕЗОПАСНО: Re-export всех client-safe экспортов
export * from './client';
```

## 🔧 Правила использования

### ✅ Для Frontend приложений

```typescript
// admin-panel, web (client components), docs
import { createUITestUsers, UITestUser } from '@repo/exchange-core';
// или явно
import { createUITestUsers, UITestUser } from '@repo/exchange-core/client';
```

### 🚫 Для Server-side кода

```typescript
// API routes, tRPC procedures, Server Components
import {
  AutoRegistrationService,
  SmartPricingService,
  WalletPoolManagerFactory,
} from '@repo/exchange-core/server';

// Client-safe данные остаются доступны из основного экспорта
import { orderManager, userManager, Order } from '@repo/exchange-core';
```

## 📦 Миграция существующего кода

### Обновленные импорты

**БЫЛО:**

```typescript
import { AutoRegistrationService, SmartPricingService } from '@repo/exchange-core';
```

**СТАЛО:**

```typescript
import { AutoRegistrationService, SmartPricingService } from '@repo/exchange-core/server';
```

### Файлы, которые были обновлены

1. `apps/web/src/server/trpc/routers/exchange.ts`
2. `apps/web/src/server/trpc/routers/operator.ts`
3. `apps/web/src/server/trpc/routers/shared.ts`
4. `apps/web/app/api/background/email-worker/route.ts`
5. `packages/session-management/src/adapters/postgres-*-adapter.ts`

## ✅ Результаты

### До изменений

```
❌ admin-panel build - Failed to compile
❌ web build - Failed to compile
❌ telegram-bot build - Failed to compile
```

### После изменений

```
✅ admin-panel build - ✓ Compiled successfully in 14.0s
✅ web build - ✓ Compiled successfully in 37.0s
✅ telegram-bot build - ✓ Compiled successfully in 5.0s
✅ docs build - ✓ Compiled successfully in 17.0s
```

## 🎯 Архитектурные принципы

### 1. Четкое разделение ответственности

- **Client-side код** не должен иметь Node.js зависимостей
- **Server-side код** может использовать любые зависимости
- **Типы данных** доступны везде

### 2. Обратная совместимость

- Существующий код продолжает работать
- Постепенная миграция на явные импорты
- Никаких breaking changes для client-side кода

### 3. Безопасность bundle

- Webpack не может случайно включить server-only код в client bundle
- Явные ошибки компиляции при неправильном использовании
- Четкие boundaries между client и server

## 🚨 Важные замечания

### Для разработчиков

1. **Всегда проверяйте** какой импорт используете:
   - Frontend → `@repo/exchange-core` или `/client`
   - Backend → `@repo/exchange-core/server`

2. **При добавлении новых сервисов** решите куда их поместить:
   - Client-safe → добавить в `client.ts`
   - Server-only → добавить в `server.ts`

3. **При изменении экспортов** проверьте билды всех приложений

### Правила добавления нового кода

```typescript
// ✅ В client.ts - если код НЕ использует:
// - Node.js встроенные модули (fs, path, crypto, etc.)
// - Server-only библиотеки (nodemailer, prisma, redis)
// - File system операции
// - Network requests к внешним API

// 🚫 В server.ts - если код использует:
// - Node.js встроенные модули
// - Database connections
// - External API calls
// - File system operations
// - Server-only библиотеки
```

## 🔄 Процесс валидации

При внесении изменений в `exchange-core`:

1. **Проверьте билд всех приложений:**

   ```bash
   npm run build
   ```

2. **Убедитесь что client и server экспорты корректны:**
   - Client-код не импортирует server dependencies
   - Server-код имеет доступ ко всем необходимым функциям

3. **Проверьте типы:**
   ```bash
   npm run check-types
   ```

Эта архитектура обеспечивает правильное разделение client/server кода и предотвращает проблемы с frontend сборкой в будущем.
