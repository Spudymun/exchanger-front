# 🏗️ Architecture Guide

## 📁 Project Structure

```
exchanger-front/
├── apps/                           # Applications
│   ├── web/                       # Main Next.js app (localhost:3000)
│   ├── admin-panel/               # Admin dashboard (localhost:3002)
│   └── docs/                      # Documentation (localhost:3001)
├── packages/                      # Shared packages
│   ├── tailwind-preset/            # Centralized CSS variables + config
│   ├── ui/                        # UI components (shadcn/ui)
│   ├── providers/                 # React providers + tRPC setup
│   ├── hooks/                     # Shared hooks + Zustand stores
│   └── utils/                     # Utility functions
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
2. **API Endpoints** → `apps/web/server/trpc.ts`
3. **State Management** → `packages/hooks/src/state/`
4. **Pages** → `apps/web/app/[locale]/`

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

- `turbo.json` - Build configuration
- `packages/ui/src/index.ts` - UI exports
- `packages/constants/src/index.ts` - Business constants and configuration
- `apps/web/server/trpc.ts` - API definition
- `packages/hooks/src/state/` - Global state

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
import { formatCurrency, validateEmail, debounce, formatDate } from '@repo/utils'

// In components
function PriceDisplay({ amount, currency }: Props) {
  return <span>{formatCurrency(amount, currency)}</span>
}

// In forms
const isValidEmail = validateEmail(email)
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

### API Client

```typescript
import { trpc } from '@repo/providers'

// In components
function UserList() {
  const { data: users, isLoading } = trpc.users.getAll.useQuery()
  const createUser = trpc.users.create.useMutation()

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

#### 🎯 **1. Компилируемые пакеты (Compiled)**

**Пример:** `constants`

```json
// constants/package.json
{
  "main": "./dist/index.js", // ← ГОТОВЫЙ JS файл
  "types": "./dist/index.d.ts", // ← ГОТОВЫЕ типы
  "scripts": {
    "build": "tsc", // ← КОМПИЛЯЦИЯ
    "build:clean": "tsc --build --clean",
    "build:force": "tsc --build --force"
  }
}
```

**Что происходит:**

- TypeScript **компилирует** `.ts` → `.js` файлы в `dist/`
- Создается `.tsbuildinfo` для **инкрементального кеширования**
- При импорте используется **готовый скомпилированный** код
- Нужны `build:clean/force` для управления кешем TypeScript

**Преимущества:**

- ✅ **Быстрый импорт** - готовый оптимизированный JS
- ✅ **Стабильность** - не зависит от компилятора приложения
- ✅ **Кеширование** - TypeScript оптимизирует повторные сборки
- ✅ **Tree-shaking** - статическая оптимизация

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

#### 🎯 **3. Types-Only пакеты (Types-Only)**

**Пример:** `exchange-core`

```json
// exchange-core/package.json
{
  "main": "./src/index.ts", // ← ИСХОДНИКИ
  "types": "./src/index.ts", // ← ТИПЫ ИЗ ИСХОДНИКОВ
  "scripts": {
    "build": "tsc", // ← НЕТ build:clean/force
    "check-types": "tsc --noEmit" // ← ТОЛЬКО ПРОВЕРКА
  }
}
```

**Что происходит:**

- В основном содержит **TypeScript типы и интерфейсы**
- Минимальная runtime логика
- `build` используется только для проверки корректности
- **НЕТ** артефактов для очистки

**Преимущества:**

- ✅ **Нулевой runtime** - только типы
- ✅ **Быстрая разработка** - нет сборки
- ✅ **Типизация в реальном времени**

#### 🎯 **4. Application Build (Next.js)**

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

| Аспект                | Compiled         | TS-Direct            | Types-Only           | Next.js App      |
| --------------------- | ---------------- | -------------------- | -------------------- | ---------------- |
| **Компиляция**        | `tsc` → `dist/`  | Прямой TS            | Проверка типов       | `next build`     |
| **Кеширование**       | `.tsbuildinfo`   | Нет                  | Нет                  | `.next/cache/`   |
| **build:clean/force** | ✅ **НУЖНЫ**     | ❌ НЕ НУЖНЫ          | ❌ НЕ НУЖНЫ          | ❌ НЕ НУЖНЫ      |
| **HMR скорость**      | Медленно         | **Быстро**           | **Быстро**           | **Быстро**       |
| **Импорт скорость**   | **Быстро**       | Средне               | **Быстро**           | Оптимизировано   |
| **Отладка**           | Source maps      | **Прямые исходники** | **Прямые исходники** | Оптимизированные |
| **Подходит для**      | Константы, енумы | Утилиты, UI          | Типы, интерфейсы     | Приложения       |

### 🎯 **Практические следствия**

#### ✅ **Что нормально:**

```powershell
# ✅ Работает только для constants
npm run build:clean                  # OK!
npm run build:force                  # OK!

# ✅ НЕ работает для utils/ui
cd packages/utils
npm run build:clean                  # ОШИБКА - и это правильно!
```

#### 🔧 **Решение проблем по типам пакетов:**

**constants (Compiled):**

```powershell
# При проблемах с кешем TypeScript
npm run build:clean                  # Очистить .tsbuildinfo
npm run build:force                  # Принудительная пересборка
```

**utils/ui (TS-Direct):**

```powershell
# При проблемах - перезапустить dev-server
npm run dev                          # Next.js пересобирает автоматически
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
2. **Стабильные данные (константы) → компиляция для оптимизации**
3. **Динамические данные (утилиты, UI) → прямое использование для гибкости**
4. **Типы → без runtime артефактов**
5. **Приложения → фреймворк управляет сборкой**

### 💡 **Зачем это нужно?**

- **Производительность:** каждый тип пакета оптимизирован под свою задачу
- **Developer Experience:** быстрая разработка там, где нужно, стабильность где важно
- **Maintainability:** понятные правила для каждого типа кода
- **Scalability:** архитектура масштабируется с ростом проекта

**🎯 Итог:** `build:clean/force` только для `constants` - это НЕ баг, это **архитектурно правильное** решение!
