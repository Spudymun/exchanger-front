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
│   ├── api-client/                # tRPC client/server setup
│   ├── providers/                 # React providers
│   ├── hooks/                     # Shared hooks + Zustand stores
│   ├── design-tokens/             # Design system tokens
│   └── utils/                     # Utility functions
└── tests/                         # E2E tests (Playwright)
```

## 🔧 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand + React Query
- **API:** tRPC (end-to-end typesafe)
- **Testing:** Jest + Playwright + Storybook
- **Build:** Turborepo monorepo

## 🎯 Development Workflow

### Adding New Features

1. **UI Components** → `packages/ui/src/components/`
2. **API Endpoints** → `apps/web/server/trpc.ts`
3. **State Management** → `packages/hooks/src/state/`
4. **Pages** → `apps/web/app/[locale]/`

### Code Guidelines

- **Components:** Use shadcn/ui patterns
- **State:** Zustand for UI, React Query for server state
- **Styling:** Tailwind utility classes
- **Types:** Export from package entry points

## 🚨 Common Issues

**Problem:** Build fails
**Solution:** Run `npm run check-types` to find TypeScript errors

**Problem:** UI looks broken  
**Solution:** Check CSS variables in globals.css

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

### Validation

```typescript
import { VALIDATION_LIMITS, VALIDATION_PATTERNS } from '@repo/constants';

// In form validation
const userSchema = z.object({
  email: z.string().max(VALIDATION_LIMITS.EMAIL_MAX_LENGTH).regex(VALIDATION_PATTERNS.EMAIL),
  password: z
    .string()
    .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH)
    .regex(VALIDATION_PATTERNS.PASSWORD),
});
```

## 📋 Development Examples

### Storybook Usage

```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

Component story example:

```typescript
// packages/ui/src/stories/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from '../components/MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
};
```

### Playwright Testing

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test admin-panel

# Run with UI
npx playwright test --ui

# Generate test report
npx playwright show-report
```

Test example:

```typescript
// tests/admin-panel.spec.ts
import { test, expect } from '@playwright/test';

test('admin dashboard loads correctly', async ({ page }) => {
  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByTestId('stats-card')).toHaveCount(4);
});
```

### Jest Unit Testing

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

Test example:

```typescript
// packages/hooks/src/state/__tests__/ui-store.test.ts
import { renderHook, act } from '@testing-library/react';
import { useUIStore } from '../ui-store';

describe('UIStore', () => {
  it('should toggle sidebar', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.sidebarOpen).toBe(true);
  });
});
```

### State Management Examples

```typescript
// Using UI Store
import { useUIStore } from '@repo/hooks/state'

function MyComponent() {
  const { sidebarOpen, toggleSidebar, showModal } = useUIStore()

  return (
    <div>
      <button onClick={toggleSidebar}>
        {sidebarOpen ? 'Close' : 'Open'} Sidebar
      </button>
      <button onClick={() => showModal('settings')}>
        Open Settings
      </button>
    </div>
  )
}

// Using Trading Store
import { useTradingStore } from '@repo/hooks/state'

function TradingView() {
  const { portfolio, currentPair, setTradingPair } = useTradingStore()

  return (
    <div>
      <h2>Portfolio: ${portfolio.balance}</h2>
      <p>Current Pair: {currentPair}</p>
      <button onClick={() => setTradingPair('BTC/USD')}>
        Switch to BTC/USD
      </button>
    </div>
  )
}
```

### tRPC API Examples

```typescript
// apps/web/server/trpc.ts - Adding new procedure
export const appRouter = router({
  // ...existing procedures...

  createUser: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      // Your logic here
      return { id: '1', ...input }
    }),
})

// Using in components
import { trpc } from '../lib/trpc'

function UserList() {
  const { data: users, isLoading } = trpc.getUsers.useQuery()
  const createUser = trpc.createUser.useMutation()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={() => createUser.mutate({ name: 'John', email: 'john@example.com' })}>
        Add User
      </button>
    </div>
  )
}
```

## Code Quality

### 🔍 Linting Architecture

The project uses a **centralized, modular ESLint architecture** with performance optimization:

#### JavaScript/TypeScript Linting

- **Single config**: `eslint.config.mjs` (root-level, flat config)
- **Modular structure**: `packages/eslint-config/` (api.js, react.js, testing.js, etc.)
- **Lazy loading**: Conditional config loading for better performance
- **Centralized limits**: All rules use constants from `@repo/constants`
- **Shared rules**: Memoized common rules to avoid duplication

#### ESLint Module Structure

```
packages/eslint-config/
├── base.js           # Base TypeScript rules
├── shared-rules.js   # Centralized & memoized rules
├── react.js          # React, hooks, a11y rules
├── api.js            # API layer (tRPC, endpoints)
├── testing.js        # Jest/testing rules
├── configs.js        # Config files (turbo, etc.)
├── utils.js          # Utility packages rules
├── ignores.js        # Centralized ignores
├── lazy-loading.js   # Performance utilities
└── performance-benchmark.js # Performance monitoring
```

#### Key Features

- **Performance monitoring**: Config load time tracking
- **Centralized ignores**: Eliminate 80%+ false positives
- **Architectural overrides**: Dynamic limits for different file types
- **Security rules**: XSS, injection, eval protection
- **Import ordering**: Consistent import organization
- **React hooks**: Proper hooks usage validation
- **Accessibility**: A11y rules for better UX

#### CSS/Styles

- **Stylelint**: CSS/SCSS linting with Tailwind CSS support
- **Prettier**: CSS formatting
- **Tailwind CSS**: Utility-first CSS framework

#### Available Commands

```bash
# Lint all code (JS/TS + CSS)
npm run lint

# Lint only JavaScript/TypeScript
turbo run lint

# Lint only CSS/SCSS files
npm run lint:styles

# Format all code
npm run format

# Format only CSS/SCSS files
npm run format:styles

# Type checking
npm run check-types

# Performance benchmark
npm run lint:benchmark
```

#### Pre-commit Hooks

Husky automatically runs before each commit:

- ESLint with auto-fix for JS/TS files (max 52 warnings)
- Stylelint with auto-fix for CSS/SCSS files
- Prettier formatting for all supported files
- Type checking validation

#### Centralized Linting Rules

Rules are centralized in `packages/constants/src/linter-limits.ts`:

```typescript
// Function size limits
export const FUNCTION_SIZE_LIMITS = {
  BASE: 50,
  UI_COMPONENTS: 60,
  MAIN_PAGES: 80,
  API_ENDPOINTS: 100,
  TESTS: 120,
  HOOKS: 75,
  DASHBOARD: 70,
} as const;

// Complexity limits
export const COMPLEXITY_LIMITS = {
  BASE: 10,
  UTILS: 8,
  API_LAYER: 12,
} as const;
```

#### Stylelint Configuration

The project uses:

- `stylelint-config-standard`: Standard CSS rules
- `stylelint-config-tailwindcss`: Tailwind CSS specific rules
- `stylelint-order`: Property ordering rules
- Custom rules for Tailwind directives (`@apply`, `@layer`, etc.)

## 🔍 ESLint Architecture Deep Dive

### Принципы централизованной архитектуры

**Проблема**: Ранее в проекте было 17+ конфигурационных файлов ESLint, что создавало:

- Дублирование правил
- Сложность поддержки
- Противоречивые настройки
- Низкая производительность

**Решение**: Единая централизованная архитектура с модульной структурой и lazy loading.

### Архитектурные компоненты

#### 1. Главный конфигурационный файл

```javascript
// eslint.config.mjs - ЕДИНСТВЕННЫЙ конфиг для всего проекта
import { FUNCTION_SIZE_LIMITS, COMPLEXITY_LIMITS } from './packages/constants/dist/index.js';

import { lazyLoadConfig } from './packages/eslint-config/lazy-loading.js';

export default [
  // Глобальные ignores (устраняют 80%+ warnings)
  { name: 'global-ignores', ignores: allIgnores },

  // Базовая конфигурация
  ...baseConfig,

  // Модульные конфигурации (lazy loaded)
  ...reactConfig,
  ...apiConfig,
  ...testingConfig,
  ...utilsConfig,
];
```

#### 2. Модульная структура

```
packages/eslint-config/
├── base.js                 # Базовые TypeScript правила
├── shared-rules.js         # Централизованные правила (мемоизированные)
├── react.js                # React, hooks, a11y
├── api.js                  # API слой (tRPC, endpoints)
├── testing.js              # Jest/testing правила
├── configs.js              # Конфигурационные файлы
├── utils.js                # Утилитарные пакеты
├── ignores.js              # Централизованные ignores
├── lazy-loading.js         # Утилиты производительности
└── performance-benchmark.js # Мониторинг производительности
```

#### 3. Централизованные лимиты

```typescript
// packages/constants/src/linter-limits.ts
export const FUNCTION_SIZE_LIMITS = {
  BASE: 50, // Базовый лимит функций
  UI_COMPONENTS: 60, // UI компоненты (учитывают JSX)
  MAIN_PAGES: 80, // Основные страницы
  API_ENDPOINTS: 100, // API endpoints
  TESTS: 120, // Тесты
  HOOKS: 75, // Хуки
  DASHBOARD: 70, // Dashboard компоненты
} as const;

export const COMPLEXITY_LIMITS = {
  BASE: 10, // Базовая сложность
  UTILS: 8, // Утилиты (строже)
  API_LAYER: 12, // API слой
} as const;
```

#### 4. Lazy Loading система

```javascript
// packages/eslint-config/lazy-loading.js
const configCache = new Map();

export function lazyLoadConfig(name, configFn) {
  if (configCache.has(name)) {
    return configCache.get(name);
  }

  const config = configFn();
  configCache.set(name, config);
  return config;
}

// Мониторинг производительности
export const performanceMetrics = {
  configLoadTimes: new Map(),
  recordLoadTime: (name, startTime) => {
    const duration = Date.now() - startTime;
    performanceMetrics.configLoadTimes.set(name, duration);
  },
};
```

#### 5. Архитектурные overrides

Система динамических правил для разных типов файлов:

```javascript
// Примеры архитектурных overrides
{
  name: 'ui-components',
  files: ['packages/ui/**/*.{js,jsx,ts,tsx}'],
  rules: {
    'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.UI_COMPONENTS }],
    'react-hooks/rules-of-hooks': 'error',
    'jsx-a11y/alt-text': 'error',
  }
},

{
  name: 'api-layer',
  files: ['apps/web/src/server/trpc/**/*.ts'],
  rules: {
    'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.API_ENDPOINTS }],
    'complexity': ['error', COMPLEXITY_LIMITS.API_LAYER],
    'no-console': 'off', // Разрешено для логирования
  }
}
```

### Результаты оптимизации

#### До внедрения:

- 17+ конфигурационных файлов
- 83,398 warnings
- Множественные дубли правил
- Медленная загрузка конфигов

#### После внедрения:

- 1 главный конфиг + модульная структура
- 68 warnings (99.9% улучшение)
- Lazy loading: ~0ms загрузка конфига
- Централизованные лимиты
- Мемоизированные правила

### Performance характеристики

- **Время загрузки конфига**: ~0ms (lazy loading)
- **Время выполнения lint**: ~6.9s
- **Количество warnings**: ~69 (vs 83,398 ранее)
- **Строки кода конфига**: ~196 (vs 1000+ ранее)

### Best Practices

1. **Не создавайте локальные eslint.config.mjs** - все правила идут в root конфиг
2. **Используйте централизованные лимиты** из `@repo/constants`
3. **Добавляйте новые правила через lazy loading**
4. **Группируйте правила по архитектурным слоям**
5. **Мониторьте производительность** через `npm run lint:benchmark`

### Мониторинг и обслуживание

```bash
# Проверка производительности
npm run lint:benchmark

# Обычный lint
npm run lint

# С максимальными warnings
npm run lint --max-warnings 52

# Pre-commit (автоматически)
git commit -m "feat: update component"
```
