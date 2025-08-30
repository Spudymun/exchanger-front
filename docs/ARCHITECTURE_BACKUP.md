# 🏗️ Architecture Guide

## 📁 Project Structure

```
exchanger-front/
├── apps/                           # Applications
│   ├── web/                       # Main Next.js app (localhost:3000)
│   ├── admin-panel/               # Admin dashboard (localhost:3002)
│   └── docs/                      # Documentation (localhost:3001)
├── packages/                      # Shared packages
│   ├── constants/                 # Business constants, enums, configs
│   ├── design-tokens/             # Design system tokens & typography
│   ├── eslint-config/             # Centralized ESLint configurations
│   ├── exchange-core/             # Core business logic & types
│   ├── hooks/                     # Shared hooks + Zustand stores
│   ├── providers/                 # React providers + Query Client setup
│   ├── style-scanner/             # CLI tool for style documentation
│   ├── tailwind-preset/           # Centralized CSS variables + config
│   ├── typescript-config/         # TypeScript configurations
│   ├── ui/                        # UI components (shadcn/ui)
│   └── utils/                     # Utility functions + security-enhanced validation
└── tests/                         # E2E tests (Playwright)
```

## 🔧 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui + Centralized CSS Architecture
- **State:** Zustand + React Query
- **API:** tRPC (end-to-end typesafe)
- **Testing:** Jest + Playwright + Storybook
- **Build:** Turborepo monorepo

## 🎨 CSS Architecture v3.0 - Centralized System

- **Single Source of Truth:** Все CSS переменные в `packages/tailwind-preset/globals.css`
- **Auto Import:** `@import '@repo/tailwind-preset/globals.css'` в каждом приложении
- **Zero Duplication:** CSS переменные определены только в одном месте
- **Semantic Classes:** `bg-card`, `text-foreground`, `border-border`
- **Theme Support:** Автоматическая поддержка light/dark режимов

### ✅ Ключевые принципы новой архитектуры:

1. **Единый источник**: `packages/tailwind-preset/globals.css`
2. **Обязательный импорт**: `@import '@repo/tailwind-preset/globals.css'`
3. **Семантические переменные**: `bg-card` вместо `bg-white dark:bg-gray-900`
4. **Запрет дублирования**: НЕ определяйте CSS переменные в других местах

## 🎯 Development Workflow

### Adding New Features

1. **UI Components** → `packages/ui/src/components/`
2. **API Endpoints** → `apps/web/src/server/trpc/routers/`
3. **State Management** → `packages/hooks/src/state/`
4. **Pages** → `apps/web/app/[locale]/`

## 🔗 API Architecture

### tRPC v11 Structure

```
apps/web/src/server/trpc/
├── routers/              # API namespace routers
│   ├── auth.ts          # Authentication & registration
│   ├── exchange.ts      # Crypto exchange operations
│   ├── user/            # User namespace (orders, profile, security)
│   ├── operator.ts      # Operator role functions
│   └── support.ts       # Support role functions
├── middleware/          # Security & authentication
│   ├── auth.ts         # Role-based access (OPERATOR/SUPPORT/ADMIN)
│   └── rateLimit.ts    # Rate limiting per endpoint
└── context.ts          # tRPC context & session
```

**Принципы:** Namespace composition, роле-основанный доступ, rate limiting

**Детали:** См. [API_DOCS.md](core/API_DOCS.md)
register: createRateLimitProcedure(RATE_LIMITS.REGISTER),
login: createRateLimitProcedure(RATE_LIMITS.LOGIN),
resetPassword: createRateLimitProcedure(RATE_LIMITS.RESET_PASSWORD),
};

```

## 🔐 Security-Enhanced Validation

Комплексная система защиты от XSS, SQL injection и CSRF атак:

**Расположение:** `packages/utils/src/validation/`
**Принцип:** Все пользовательские данные проходят санитизацию
**Интеграция:** Автоматическое использование в tRPC роутерах

**Детали:** См. [SECURITY_ENHANCED_VALIDATION_GUIDE.md](core/SECURITY_ENHANCED_VALIDATION_GUIDE.md)

### Centralized Validation Architecture

**Расположение схем:** `packages/utils/src/validation/`

- `base-schemas.ts` - Базовые Zod схемы
- `security-enhanced-schemas.ts` - Схемы с XSS protection
- `business-schemas.ts` - Бизнес-валидация
- `form-schemas.ts` - UI формы с локализацией

**Принцип единого источника:** Все валидационные схемы централизованы для предотвращения дублирования и обеспечения консистентности безопасности.

### Code Guidelines

- **Components:** Use shadcn/ui patterns + Centralized CSS variables
- **CSS:** Use semantic classes from `packages/tailwind-preset/globals.css`
- **State:** Zustand for UI, React Query for server state
- **Styling:** Tailwind utility classes
- **Types:** Export from package entry points

## 🚨 Common Issues

**Problem:** Build fails
**Solution:** Run `npm run check-types` to find TypeScript errors

**Problem:** UI looks broken
**Solution:** Check `@import '@repo/tailwind-preset/globals.css'` and use semantic CSS classes

**Problem:** CSS variables not working
**Solution:** Ensure proper @import order in globals.css files

**Problem:** State not syncing
**Solution:** Use correct Zustand store from `@repo/hooks`

## 🔗 Important Files

- `turbo.json` - Monorepo build configuration
- `packages/ui/src/index.ts` - UI components exports
- `packages/constants/src/index.ts` - Business constants and configuration
- `packages/exchange-core/src/index.ts` - Core business logic & types
- `packages/utils/src/validation/` - Security-enhanced validation schemas
- `packages/design-tokens/` - Design system tokens & typography
- `apps/web/src/server/trpc/` - tRPC API architecture
- `packages/hooks/src/state/` - Zustand global state
- `packages/style-scanner/` - CLI for automated style documentation

```

## 📦 Exchange-Core Package Usage

### Business Logic & Types

```typescript
import {
  CurrencyType,
  OrderStatus,
  UserRole,
  TradingPair,
  userManager,
  orderManager,
} from '@repo/exchange-core';

// Type-safe business operations
function processOrder(order: OrderStatus) {
  const validation = orderManager.validateOrder(order);
  if (validation.isValid) {
    return orderManager.executeOrder(order);
  }
}

// User management with role validation
function getUserPermissions(userId: string, role: UserRole) {
  return userManager.getUserPermissions(userId, role);
}
```

### Business Validation

```typescript
import { validateUserAccess, validateOrderLimits } from '@repo/exchange-core';

// Role-based business logic
const hasAccess = await validateUserAccess(user.id, USER_ROLES.OPERATOR);

// Order limits validation
const isValidAmount = await validateOrderLimits(amount, currency);
```

## 🎨 Design Tokens Package Usage

### Design System Integration

```typescript
import { colors, typography, spacing, breakpoints, formPatterns } from '@repo/design-tokens';

// Semantic design tokens
const theme = {
  primary: colors.primary[500],
  text: colors.text.foreground,
  spacing: spacing[4],
  fontSize: typography.fontSize.md,
};

// Form patterns for consistent UX
const inputStyles = formPatterns.input.default;
```

### Tailwind Integration

```typescript
// Automatic integration via packages/tailwind-preset
import tailwindConfig from '@repo/tailwind-preset';

// Design tokens automatically available as CSS variables
.button {
  background: var(--color-primary-500);
  font-size: var(--font-size-md);
  padding: var(--spacing-4);
}
```

## 🔧 Style Scanner Usage

### Automated Style Documentation

```bash
# Scan all React components and generate style documentation
npm run scan-styles

# Verbose output with detailed analysis
npm run scan-styles:verbose

# Custom output directory
node packages/style-scanner/bin/style-scanner.js scan --out custom-docs --verbose
```

### Generated Documentation Structure

```
style-docs/
├── summary.md              # Overview of all scanned styles
├── components/            # Per-component analysis
│   ├── Button.md         # Button component styles
│   ├── Modal.md          # Modal component styles
│   └── DataTable.md      # DataTable component styles
└── patterns/             # Common style patterns
    ├── color-usage.md    # Color pattern analysis
    └── spacing-usage.md  # Spacing pattern analysis
```

### Integration with Design System

Style Scanner automatically detects usage of design tokens and generates reports on:

- Design token adoption
- Inconsistent styling patterns
- Missing responsive design
- Accessibility improvements

## 📦 Constants Package Usage

### Business Constants

```typescript
import { ORDER_STATUSES, USER_ROLES, HTTP_STATUS } from '@repo/constants'

// In API handlers
if (response.status === HTTP_STATUS.OK) {
  // Handle success
}

// In components
if (order.status === ORDER_STATUSES.PENDING) {
  return <PendingOrderBadge />
}

// In authorization
if (user.role === USER_ROLES.ADMIN) {
  return <AdminPanel />
}
```

### Types

```typescript
import { CurrencyType, OrderStatus, UserRole, TradingPair } from '@repo/exchange-core';

// In API handlers
function processOrder(order: OrderStatus) {
  // Type-safe order processing
}

// In components
interface UserProps {
  role: UserRole;
  tradingPair: TradingPair;
}
```

### Utils

```typescript
import {
  formatCurrency,
  validateEmail,
  debounce,
  formatDate,
  sanitizeInput,
  securityEnhancedRegisterSchema
} from '@repo/utils'

// Utility functions
function PriceDisplay({ amount, currency }: Props) {
  return <span>{formatCurrency(amount, currency)}</span>
}

// Security-enhanced validation
const isValidEmail = validateEmail(email)

// XSS protection in forms
const sanitizedInput = sanitizeInput(userInput)

// Pre-built security schemas
const form = useForm({
  resolver: zodResolver(securityEnhancedRegisterSchema)
})
```

### UI Components

```typescript
import { Button, Modal, DataTable, Alert, Badge } from '@repo/ui'

// In pages
function TradingPage() {
  return (
    <div>
      <Button variant="primary" onClick={handleTrade}>
        Execute Trade
      </Button>
      <DataTable data={orders} columns={columns} />
    </div>
  )
}
```

### Hooks and State

```typescript
import { useUIStore, useTradingStore, useNotifications } from '@repo/hooks/src/client-hooks'
import { useTranslations } from 'next-intl'

// In components
function TradingPanel() {
  const { portfolio, currentPair, setTradingPair } = useTradingStore()
  const notifications = useNotifications()
  const t = useTranslations('trading')

  return (
    <div>
      <h2>Portfolio: {formatCurrency(portfolio.balance)}</h2>
      <p>Current Pair: {currentPair}</p>
    </div>
  )
}
```

### Design Tokens

```typescript
import { colors, typography, spacing, breakpoints } from '@repo/design-tokens';

// In styled components or CSS-in-JS
const Button = styled.button`
  background: ${colors.primary[500]};
  font-size: ${typography.fontSize.md};
  padding: ${spacing[4]};

  @media (min-width: ${breakpoints.md}) {
    padding: ${spacing[6]};
  }
`;
```

### tRPC API Client

```typescript
// apps/web/lib/trpc-provider.tsx - Local tRPC setup
import { trpc } from '~/lib/trpc-provider'

// In components
function UserList() {
  const { data: users, isLoading } = trpc.user.getAll.useQuery()
  const createOrder = trpc.exchange.createOrder.useMutation()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

### React Query Provider

```typescript
// @repo/providers - React Query setup (not tRPC)
import { Providers } from '@repo/providers'

// Application-level providers
function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <TRPCProvider> {/* Local tRPC provider */}
        {children}
      </TRPCProvider>
    </Providers>
  )
}
```

### UI Configuration

```typescript
import { ORDER_STATUS_CONFIG, ALERT_VARIANTS } from '@repo/constants'

// Polymorphic components with configuration
function OrderStatusBadge({ status }: Props) {
  const config = ORDER_STATUS_CONFIG[status]

  return (
    <Badge variant={config.color}>
      <Icon name={config.icon} className="mr-2" />
      {config.label}
    </Badge>
  )
}

// Alert variants
<Alert variant={ALERT_VARIANTS.SUCCESS}>
  Order created successfully!
</Alert>
```

## 🔧 Build Strategies

### Концепция разных стратегий сборки пакетов

В монорепозитории используются **4 разные стратегии сборки** в зависимости от типа и назначения пакета. Это архитектурно правильное решение, а не ошибка.

#### 🎯 **1. Compiled with Dual Export (tsup)**

**Пример:** `constants`

```json
// constants/package.json
{
  "main": "./dist/index.js", // ← CommonJS build
  "module": "./dist/index.mjs", // ← ESM build
  "types": "./dist/index.d.ts", // ← TypeScript definitions
  "exports": {
    ".": {
      "import": "./dist/index.mjs", // ← ESM import
      "require": "./dist/index.js", // ← CommonJS require
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup", // ← tsup для dual build
    "build:clean": "tsup --clean", // ← Очистка dist/
    "build:force": "rm -rf dist && tsup" // ← Принудительная пересборка
  }
}
```

**Что происходит:**

- **tsup** создает **CommonJS** (.js) и **ESM** (.mjs) сборки одновременно
- Поддержка как `import` так и `require` синтаксиса
- TypeScript типы компилируются в `.d.ts`
- Оптимизация для tree-shaking и bundle size

**Преимущества:**

- ✅ **Универсальная совместимость** - работает везде
- ✅ **Оптимизированные сборки** - отдельно для CJS/ESM
- ✅ **Быстрый импорт** - готовый скомпилированный код
- ✅ **Tree-shaking поддержка** - ESM оптимизации

**Когда использовать:**

- Константы и енумы (неизменяемые данные)
- Конфигурации (стабильные настройки)
- Библиотеки, которые редко изменяются

#### 🎯 **2. TypeScript-Direct пакеты (TS-Direct)**

**Примеры:** `utils`, `ui`

```json
// utils/package.json
{
  "exports": {
    ".": "./src/index.ts" // ← ПРЯМО ИЗ ИСХОДНИКОВ
  }
  // НЕТ build:clean/force - они не нужны!
}
```

**Что происходить:**

- TypeScript файлы используются **напрямую** из `src/`
- **НЕТ** предварительной компиляции
- **НЕТ** папки `dist/` и кеша `.tsbuildinfo`
- Next.js/приложения компилируют "на лету"

**Преимущества:**

- ✅ **Мгновенная горячая перезагрузка** в разработке
- ✅ **Современный bundling** - Next.js оптимизирует сам
- ✅ **Простота** - нет промежуточных артефактов
- ✅ **Source maps** - отладка прямо в исходниках

**Когда использовать:**

- Утилитарные функции (часто изменяются)
- UI компоненты (активная разработка)
- Хуки и провайдеры (динамическая логика)

**🚨 КРИТИЧЕСКИ ВАЖНО: Exports Configuration**

TS-Direct пакеты требуют **правильной настройки exports** для доступа к внутренним модулям:

```json
// packages/hooks/package.json
{
  "exports": {
    ".": "./src/index.ts", // Основной экспорт
    "./state": "./src/state/index.ts", // Доступ к state модулям
    "./src/client-hooks": "./src/client-hooks.ts", // Client-side hooks
    "./src/state/ui-store": "./src/state/ui-store.ts" // Прямой доступ к store
  }
}
```

**Правила exports для TS-Direct:**

1. **Основной экспорт** - всегда `".": "./src/index.ts"`
2. **Подмодули** - добавлять по мере необходимости
3. **Client-side код** - отдельные exports для SSR-safe импортов
4. **Прямые пути** - для обхода barrel exports при необходимости

**Типичные ошибки:**

- ❌ `Module not found: Can't resolve '@repo/hooks/src/state/ui-store'`
- ✅ Добавить `"./src/state/ui-store": "./src/state/ui-store.ts"` в exports

#### 🎯 **3. Business Logic Packages (TS-Direct with Runtime)**

**Пример:** `exchange-core`

```json
// exchange-core/package.json
{
  "main": "./src/index.ts", // ← Исходники TS
  "types": "./src/index.ts", // ← Типы из исходников
  "dependencies": {
    "@repo/constants": "*", // ← Runtime зависимости!
    "@repo/utils": "*" // ← Бизнес-логика зависит от утилит
  },
  "scripts": {
    "build": "tsc --noEmit", // ← Только проверка типов
    "check-types": "tsc --noEmit" // ← НЕТ компиляции артефактов
  }
}
```

**Что происходит:**

- Содержит **реальную бизнес-логику**, не только типы
- TypeScript файлы используются **напрямую** приложениями
- **Runtime зависимости** на другие пакеты (@repo/constants, @repo/utils)
- Экспортирует managers, validators, business functions

**Реальный код:**

```typescript
// packages/exchange-core/src/index.ts
export { userManager, orderManager } from './managers'; // ← Runtime код!
export { validateUserAccess } from './business/auth'; // ← Бизнес-логика!
export type { UserRole, OrderStatus } from './types'; // ← + Типы
```

**Преимущества:**

- ✅ **Централизованная бизнес-логика**
- ✅ **Горячая перезагрузка** в разработке
- ✅ **Типизация в реальном времени**
- ✅ **Переиспользование** между приложениями

**Когда использовать:**

- Ключевые бизнес-пакеты (exchange-core)
- Логика, требующая runtime зависимостей
- Переиспользуемые managers и validators

#### 🎯 **4. CLI Tools (Node.js Scripts)**

**Пример:** `style-scanner`

```json
// style-scanner/package.json
{
  "bin": {
    "style-scanner": "./bin/style-scanner.js" // ← CLI executable
  },
  "main": "./src/index.js", // ← Основной модуль
  "scripts": {
    "build": "node build.js", // ← Custom build script
    "test": "node test.js" // ← CLI testing
  }
}
```

**Что происходит:**

- Пакет представляет **CLI инструмент**
- Executable скрипт в `bin/` директории
- Работает как standalone приложение
- Анализирует React компоненты и генерирует документацию

**Использование:**

```bash
# Глобальное использование через turbo scripts
npm run scan-styles

# Прямой вызов CLI
node packages/style-scanner/bin/style-scanner.js scan --out docs --verbose
```

#### 🎯 **5. Application Build (Next.js)**

**Примеры:** `web`, `admin-panel`, `docs`

```json
// web/package.json
{
  "scripts": {
    "build": "next build", // ← Next.js управляет всем
    "dev": "next dev" // ← НЕТ build:clean/force
  }
}
```

**Что происходит:**

- **Next.js полностью управляет** процессом сборки
- Свой собственный кеш в `.next/`
- Оптимизации на уровне приложения
- **НЕТ** необходимости в ручной очистке TypeScript кеша

### 📊 **Сравнительная таблица стратегий**

| Аспект                | Dual Export (tsup) | TS-Direct            | Business Logic       | CLI Tools        | Next.js App      |
| --------------------- | ------------------ | -------------------- | -------------------- | ---------------- | ---------------- |
| **Компиляция**        | `tsup` → dual      | Прямой TS            | Прямой TS + Runtime  | Custom scripts   | `next build`     |
| **Кеширование**       | Нет                | Нет                  | Нет                  | Нет              | `.next/cache/`   |
| **build:clean/force** | ✅ **НУЖНЫ**       | ❌ НЕ НУЖНЫ          | ❌ НЕ НУЖНЫ          | ❌ НЕ НУЖНЫ      | ❌ НЕ НУЖНЫ      |
| **HMR скорость**      | Средне             | **Быстро**           | **Быстро**           | N/A              | **Быстро**       |
| **Импорт скорость**   | **Быстро**         | Средне               | Средне               | N/A              | Оптимизировано   |
| **Отладка**           | Source maps        | **Прямые исходники** | **Прямые исходники** | Node.js debugger | Оптимизированные |
| **Подходит для**      | Константы, енумы   | Утилиты, UI          | Бизнес-логика        | CLI инструменты  | Приложения       |

### 🎯 **Практические следствия**

#### ✅ **Что нормально:**

```powershell
# ✅ Работает только для constants (dual export strategy)
npm run build:clean                  # OK!
npm run build:force                  # OK!

# ✅ НЕ работает для utils/ui/exchange-core
cd packages/utils
npm run build:clean                  # ОШИБКА - и это правильно!
```

#### 🔧 **Решение проблем по типам пакетов:**

**constants (Dual Export):**

```powershell
# При проблемах с кешем tsup
npm run build:clean                  # Очистить dist/
npm run build:force                  # Принудительная пересборка
```

**utils/ui (TS-Direct):**

```powershell
# При проблемах - перезапустить dev-server
npm run dev                          # Next.js пересобирает автоматически
```

**exchange-core (Business Logic):**

```powershell
# При проблемах с типами и runtime
npm run check-types                  # Проверить корректность TypeScript
npm run dev                          # Горячая перезагрузка runtime логики
```

**style-scanner (CLI Tools):**

```powershell
# При проблемах с CLI
npm run scan-styles                  # Перезапустить сканирование
cd packages/style-scanner && npm test # Тестирование CLI
```

### 🔥 **SSR и Client-Side Разделение**

**Проблема:** TS-Direct пакеты с Zustand stores могут вызывать SSR ошибки.

**Решение:** Разделение на SSR-safe и Client-only экспорты.

#### **Техническая причина разделения:**

**Проблема с useSyncExternalStore:**

- Zustand использует `useSyncExternalStore` для синхронизации состояния
- Этот хук не работает в Server Components (Next.js App Router)
- Вызывает ошибки типа "useUIStore is not a function" при SSR
- Server-side рендеринг не имеет доступа к browser APIs (localStorage, window)

**Hydration Mismatch:**

- Сервер рендерит с одним состоянием (default значения)
- Клиент гидратирует с другим состоянием (из localStorage/sessionStorage)
- React выдает предупреждения о несоответствии HTML
- Может вызывать визуальные "блики" при переключении состояний

**Next.js App Router специфика:**

- Server Components выполняются на сервере и не могут использовать client-side состояние
- Client Components помечены `'use client'` и выполняются в браузере
- Смешивание приводит к runtime ошибкам в production build

#### **Решение через client-hooks.ts:**

**Архитектурные преимущества:**

- Все Zustand stores изолированы в client-only файле
- Основной index.ts содержит только SSR-safe экспорты
- Четкое разделение предотвращает ошибки автоматически
- Масштабируемость - легко добавлять новые client-only hooks

**Практические примеры ошибок и решений:**

```typescript
// ❌ Ошибка: "useUIStore is not a function"
// Причина: импорт в Server Component или SSR context
import { useUIStore } from '@repo/hooks';

// ✅ Решение: использовать client-hooks
('use client');
import { useUIStore } from '@repo/hooks/src/client-hooks';

// ❌ Ошибка: "Cannot read properties of undefined"
// Причина: store не инициализирован на сервере
const theme = useUIStore().theme; // undefined на сервере

// ✅ Решение: проверка на клиентскую среду
('use client');
const { theme } = useUIStore(); // безопасно в Client Component
```

#### **Архитектурный паттерн:**

```typescript
// packages/hooks/src/index.ts - SSR-safe экспорты
export type { UseFormOptions, UseFormReturn } from './business/useForm';
export { FORM_VALIDATION_SCHEMAS } from './business/useForm';
// НЕ экспортируем stores напрямую

// packages/hooks/src/client-hooks.ts - Client-only экспорты
('use client');
export { useUIStore } from './state/ui-store';
export { useTradingStore } from './state/trading-store';
export * from './useTheme';
```

#### **Использование в компонентах:**

```typescript
// ❌ Может вызвать SSR ошибки
import { useUIStore } from '@repo/hooks';

// ✅ SSR-safe подход
('use client');
import { useUIStore } from '@repo/hooks/src/client-hooks';
// или
import { useUIStore } from '@repo/hooks/src/state/ui-store';
```

#### **Настройка exports:**

```json
{
  "exports": {
    ".": "./src/index.ts", // SSR-safe экспорты
    "./src/client-hooks": "./src/client-hooks.ts", // Client-only hooks
    "./src/state/ui-store": "./src/state/ui-store.ts" // Прямой доступ
  }
}
```

**exchange-core (Types-Only):**

```powershell
# При проблемах с типами
npm run check-types                  # Проверить корректность типов
```

**web/admin-panel (Next.js):**

```powershell
# При проблемах с кешем
rm -rf .next                         # Очистить кеш Next.js
npm run dev                          # Пересобрать
```

### 🏗️ **Архитектурные принципы**

1. **Разные типы данных = разные стратегии сборки**
2. **Стабильные данные (константы) → dual export для универсальности**
3. **Динамические данные (утилиты, UI) → прямое использование для гибкости**
4. **Бизнес-логика → TS-Direct с runtime зависимостями**
5. **CLI инструменты → отдельные executable скрипты**
6. **Приложения → фреймворк управляет сборкой**

### 💡 **Зачем это нужно?**

- **Производительность:** каждый тип пакета оптимизирован под свою задачу
- **Developer Experience:** быстрая разработка там, где нужно, стабильность где важно
- **Maintainability:** понятные правила для каждого типа кода
- **Scalability:** архитектура масштабируется с ростом проекта
- **Security:** централизованная валидация и санитизация данных

**🎯 Итог:** `build:clean/force` только для `constants` - это НЕ баг, это **архитектурно правильное** решение!

---

## 🔐 **Архитектура валидации**

### **Принципы трехслойной валидации**

Проект использует строгую трехслойную архитектуру валидации, которая исключает дублирование и обеспечивает четкое разделение ответственности:

#### **Слой 1: UI Validation (Форматирование)**

- **Цель**: Помощь пользователю в правильном вводе данных
- **Инструменты**: React Hook Form + Zod schemas
- **Ответственность**: Форматирование, базовая проверка типов, UX feedback
- **Расположение**: `apps/web/src/components/forms/`

```typescript
// Пример UI validation schema
const passwordSchema = z
  .string()
  .min(8, { message: 'PASSWORD_MIN_LENGTH:8' })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'PASSWORD_WEAK',
  });
```

#### **Слой 2: tRPC Input Validation (Структура API)**

- **Цель**: Защита API от некорректных данных
- **Инструменты**: tRPC `.input()` + Zod schemas
- **Ответственность**: Валидация структуры запроса, типизация
- **Расположение**: `apps/web/src/server/trpc/routers/`

```typescript
// Пример tRPC input validation
export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        password: passwordSchema,
      })
    )
    .mutation(async ({ input }) => {
      // input уже валидирован по схеме
    }),
});
```

#### **Слой 3: Business Validation (Бизнес-логика)**

- **Цель**: Проверка бизнес-правил и ограничений
- **Инструменты**: Dedicated business validators
- **Ответственность**: Бизнес-логика, внешние зависимости, сложные проверки
- **Расположение**: `packages/exchange-core/src/business/`

```typescript
// Пример business validation
export class OrderBusinessValidator {
  async validateOrderLimits(amount: number, currency: string): Promise<void> {
    const limits = await this.getLimitsFromDatabase(currency);
    if (amount < limits.min) {
      throw new BusinessError('ORDER_BELOW_MINIMUM', { min: limits.min });
    }
  }
}
```

### **Централизованные схемы валидации**

**Расположение**: `packages/utils/src/validation-schemas.ts`

Все базовые Zod схемы централизованы для предотвращения дублирования:

```typescript
// Единственный источник правды для валидации пароля
export const passwordSchema = z
  .string()
  .min(8, { message: 'PASSWORD_MIN_LENGTH:8' })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'PASSWORD_WEAK',
  });

// Переиспользование в разных контекстах
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema, // НЕ создаем новую схему!
});
```

### **Правила архитектуры валидации**

#### ✅ **ОБЯЗАТЕЛЬНО:**

1. **Используй централизованные схемы** из `validation-schemas.ts`
2. **UI валидация = tRPC валидация** (одни и те же схемы)
3. **Бизнес-валидация отдельно** от структурной валидации
4. **Локализация через next-intl** с правильными ключами
5. **Единственный источник правды** для каждого типа валидации

#### ❌ **ЗАПРЕЩЕНО:**

1. Дублирование схем валидации в разных файлах
2. Создание "legacy" или "alternative" версий схем
3. Бизнес-логика в UI или tRPC схемах
4. Жестко заданные строки ошибок (только ключи локализации)
5. Переопределение централизованных схем

### **Миграция и рефакторинг**

При обнаружении дублирования валидации:

1. **Анализ**: Определи тип валидации (UI/tRPC/Business)
2. **Централизация**: Перенеси схему в `validation-schemas.ts`
3. **Рефакторинг**: Замени все дубликаты на импорт из централизованного места
4. **Тестирование**: Убедись, что все формы работают с единой схемой
5. **Удаление**: Удали все дублированные и legacy схемы

**Детальное руководство**: См. [VALIDATION_LOCALIZATION_GUIDE.md](core/VALIDATION_LOCALIZATION_GUIDE.md)

---

## 📚 Detailed Documentation Cross-References

Данная архитектурная документация дополняется специализированными руководствами:

### 🔧 **Implementation Guides**

- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Полное руководство разработчика (2,281 строк) с примерами всех технологий
- **[TASK_IMPLEMENTATION_GUIDE.md](core/TASK_IMPLEMENTATION_GUIDE.md)** - Универсальные чек-листы и шаблоны для реализации задач
- **[API_DOCS.md](core/API_DOCS.md)** - Полная tRPC API документация с примерами и middleware

### 🔒 **Security & Validation**

- **[SECURITY_ENHANCED_VALIDATION_GUIDE.md](core/SECURITY_ENHANCED_VALIDATION_GUIDE.md)** - Руководство по security-enhanced схемам валидации
- **[VALIDATION_ARCHITECTURE_GUIDE.md](core/VALIDATION_ARCHITECTURE_GUIDE.md)** - Архитектурные принципы системы валидации
- **[ROLES_ARCHITECTURE.md](core/ROLES_ARCHITECTURE.md)** - Permission-based access control и роли

### 🎨 **Design System**

- **[SEMANTIC_DESIGN_SYSTEM.md](core/SEMANTIC_DESIGN_SYSTEM.md)** - CSS Architecture v3.0 с semantic design tokens
- **[packages/design-tokens/README.md](../packages/design-tokens/README.md)** - Детальная документация Design Tokens (398 строк)
- **[packages/style-scanner/README.md](../packages/style-scanner/README.md)** - CLI инструмент стилизации (611 строк)

### 🔧 **Code Quality**

- **[CENTRALIZED_ESLINT_ARCHITECTURE.md](core/CENTRALIZED_ESLINT_ARCHITECTURE.md)** - Централизованная ESLint архитектура с lazy loading
- **[CODE_STYLE_GUIDE.md](core/CODE_STYLE_GUIDE.md)** - Правила стиля кода и архитектурные паттерны

### 🏗️ **Package Documentation**

- **[packages/exchange-core/README.md](../packages/exchange-core/README.md)** - Бизнес-логика обменника (440 строк)
- **[packages/utils/README.md](../packages/utils/README.md)** - Утилиты и валидация (526 строк)

### 📋 **Complete Documentation Catalog**

См. **[docs/README.md](README.md)** для навигации по всем 35+ специализированным руководствам проекта.
