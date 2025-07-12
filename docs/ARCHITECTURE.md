# 🏗️ Architecture Guide

## 📁 Project Structure

```
exchanger-front/
├── apps/                           # Applications
│   ├── web/                       # Main Next.js app (localhost:3000)
│   ├── admin-panel/               # Admin dashboard (localhost:3002)
│   └── docs/                      # Documentation (localhost:3001)
├── packages/                      # Shared packages
│   ├── ui/                        # UI components (shadcn/ui)
│   ├── providers/                 # React providers + tRPC setup
│   ├── hooks/                     # Shared hooks + Zustand stores
│   ├── design-tokens/             # Design system tokens
│   └── utils/                     # Utility functions
└── tests/                         # E2E tests (Playwright)
```

## 🔧 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui + Design System v2.1
- **State:** Zustand + React Query
- **API:** tRPC (end-to-end typesafe)
- **Testing:** Jest + Playwright + Storybook
- **Build:** Turborepo monorepo

## 🎨 Design System v2.1

- **CSS Variables:** Адаптивная 6-уровневая цветовая иерархия для темной темы
- **Централизация:** Все стили в `packages/ui/src/styles/form-patterns.js`
- **Адаптивность:** `dark:` префиксы для автоматической поддержки обеих тем
- **Семантичность:** Компоненты именуются по назначению, не по внешнему виду
- **Переиспользование:** Максимальное использование существующих паттернов

## 🎯 Development Workflow

### Adding New Features

1. **UI Components** → `packages/ui/src/components/`
2. **API Endpoints** → `apps/web/server/trpc.ts`
3. **State Management** → `packages/hooks/src/state/`
4. **Pages** → `apps/web/app/[locale]/`

### Code Guidelines

- **Components:** Use shadcn/ui patterns + Design System v2.1
- **Styling:** Импортировать стили из `form-patterns.js` для консистентности
- **State:** Zustand for UI, React Query for server state
- **Styling:** Tailwind utility classes
- **Types:** Export from package entry points

## 🚨 Common Issues

**Problem:** Build fails
**Solution:** Run `npm run check-types` to find TypeScript errors

**Problem:** UI looks broken  
**Solution:** Check CSS variables in globals.css and use Design System v2.1 patterns

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
import { useUIStore, useTradingStore, useAuthStore } from '@repo/hooks'

// In components
function TradingPanel() {
  const { portfolio, currentPair, setTradingPair } = useTradingStore()
  const { user, isAuthenticated } = useAuthStore()

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
