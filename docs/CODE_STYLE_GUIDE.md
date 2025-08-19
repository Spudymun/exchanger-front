## 📋 Next.js Code Style Guide

Практический стайл-гайд для поддерживаемого и масштабируемого кода в монорепозитории.

---

## 🏗️ Архитектура

### Структура пакетов

```
packages/
├── ui/                    # React компоненты (shadcn/ui)
├── exchange-core/        # Core business logic
├── hooks/                # Zustand stores + custom hooks
├── constants/            # Бизнес-константы и конфигурация
├── utils/                # Утилитарные функции
└── design-tokens/        # Design system tokens + CSS Variables v2.1
```

### Принципы зависимостей

- **UI компоненты** не должны знать о бизнес-логике
- **Hooks/Stores** содержат состояние и бизнес-правила
- **Constants** - единый источник истины для магических значений
- **Utils** - чистые функции без побочных эффектов

---

## 🎯 Архитектурные паттерны

### Compound Components Pattern

**Применение**: Для сложных UI компонентов с множественными частями.

**Структура** (используется в проекте):

```typescript
// Реальный пример из packages/ui/src/components/data-table-compound.tsx
export const DataTableCompound = Object.assign(DataTable, {
  Container,
  Header,
  Filters,
  Content,
  TableWrapper,
  Pagination,
  CellWrapper,
});

// Использование:
<DataTable data={users}>
  <DataTable.Container>
    <DataTable.Header title="Users" />
    <DataTable.Filters />
    <DataTable.Content />
    <DataTable.Pagination />
  </DataTable.Container>
</DataTable>
```

**Преимущества**:

- Композиция вместо больших пропсов
- Гибкость компоновки
- Переиспользование частей

### DOM Props Filtering

**Проблема**: React DOM warnings при передаче не-HTML атрибутов в DOM элементы.

**Решение** (используется в compound компонентах):

```typescript
// Реальный пример из packages/ui/src/components/auth-form-compound.tsx
const FormWrapper = React.forwardRef<HTMLFormElement, FormWrapperProps>(
  ({ className, children, onSubmit, ...props }, ref) => {
    // Фильтруем React-специфичные пропсы
    const {
      form: _form,
      isLoading: _isLoading,
      t: _t,
      fieldId: _fieldId,
      formType: _formType,
      onSubmit: _onSubmitFromProps,
      validationErrors: _validationErrors,
      ...domProps // Только DOM-безопасные пропсы
    } = props as Record<string, unknown>;

    return <form ref={ref} {...domProps}>{children}</form>;
  }
);
```

**Правило**: Всегда фильтруйте пропсы перед передачей в DOM элементы.

### Context Enhancement Pattern

**Применение**: Автоматическое внедрение пропсов из контекста в дочерние компоненты.

**Реализация** (уникальный паттерн проекта):

```typescript
// packages/ui/src/lib/auth-helpers.tsx
export function enhanceChildWithContext(
  child: React.ReactNode,
  context: AuthFormContextValue | undefined
) {
  if (!React.isValidElement(child) || typeof child.type === 'string') {
    return child;
  }

  const childProps = child.props as Record<string, unknown>;
  const enhancedProps: Record<string, unknown> = {};

  // Добавляем пропсы контекста только если они отсутствуют
  if (context?.form && !childProps.form) {
    enhancedProps.form = context.form;
  }

  return React.cloneElement(child, enhancedProps);
}
```

**Преимущества**:

- Автоматическое распространение контекста
- Сохранение явных пропсов
- Предотвращение prop drilling

### Критерии оценки компонентов для Compound Pattern

**Применение**: Решение о необходимости миграции компонента в compound pattern.

**Система оценки** (из практики проекта):

| Критерий               | Баллы | Описание                                           |
| ---------------------- | ----- | -------------------------------------------------- |
| **Multiple Exports**   | 10/10 | Компонент экспортирует несколько связанных частей  |
| **Prop Drilling**      | 9/10  | Глубокая передача пропсов между родителем и детьми |
| **Conditional Logic**  | 8/10  | Сложная условная логика в композиции               |
| **State Sharing**      | 7/10  | Общее состояние между подкомпонентами              |
| **Event Coordination** | 6/10  | Координация событий между частями                  |

**Порог миграции**: ≥ 7 баллов по любому критерию

**Примеры применения в проекте**:

- `AuthForm` → 9/10 (prop drilling для locale, user state)
- `DataTable` → 10/10 (multiple exports: Header, Body, Pagination)
- `Header` → 8/10 (conditional logic для auth state)

---

## 📐 Размер компонентов и функций

### ESLint конфигурация (централизованная архитектура)

**Архитектура**: Единый `eslint.config.mjs` с модульной структурой и lazy loading

```javascript
// eslint.config.mjs - ЕДИНСТВЕННАЯ конфигурация
import {
  FUNCTION_SIZE_LIMITS,
  COMPLEXITY_LIMITS,
  DEPTH_LIMITS,
  PARAMETERS_LIMITS,
} from './packages/constants/dist/index.js';

import { lazyLoadConfig } from './packages/eslint-config/lazy-loading.js';

export default [
  // Глобальные правила с централизованными лимитами
  {
    name: 'global-rules',
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: lazyLoadConfig('global-rules', () => ({
      // Размер функций - из CODE_STYLE_GUIDE.md
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.BASE }], // 50 строк
      complexity: ['error', COMPLEXITY_LIMITS.BASE], // 10 (error, не warn)
      'max-depth': ['error', DEPTH_LIMITS.BASE], // 2 уровня
      'max-params': ['error', PARAMETERS_LIMITS.BASE], // 4 параметра

      // Правило 13: Запрет техдолга
      '@typescript-eslint/no-explicit-any': 'error', // НЕ warn!
      'no-warning-comments': [
        'error',
        {
          terms: ['todo', 'fixme', 'hack', 'temp', 'xxx'],
        },
      ],

      // Качество кода
      'prefer-const': 'error',
      'no-console': 'error', // Строго запрещено (кроме инфраструктуры)
      'no-debugger': 'error',
    })),
  },

  // Динамические лимиты для разных типов файлов
  {
    name: 'ui-components',
    files: ['packages/ui/**/*.{js,jsx,ts,tsx}'],
    rules: lazyLoadConfig('ui-rules', () => ({
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.UI_COMPONENTS }], // 60 строк
    })),
  },

  {
    name: 'main-pages',
    files: ['apps/*/app/page.tsx', 'apps/*/app/**/page.tsx'],
    rules: lazyLoadConfig('main-pages-rules', () => ({
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.MAIN_PAGES }], // 80 строк
    })),
  },

  {
    name: 'api-layer',
    files: ['apps/web/src/server/trpc/**/*.ts'],
    rules: lazyLoadConfig('api-rules', () => ({
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.API_ENDPOINTS }], // 100 строк
      complexity: ['error', COMPLEXITY_LIMITS.API_LAYER], // 12 (выше базового)
      'no-console': 'off', // Разрешено для логирования
    })),
  },

  {
    name: 'utils-strict',
    files: ['packages/utils/**/*.ts', 'packages/exchange-core/**/*.ts'],
    rules: lazyLoadConfig('utils-rules', () => ({
      complexity: ['error', COMPLEXITY_LIMITS.UTILS], // 8 (строже базового)
    })),
  },
];
```

### Практические лимиты (из централизованных констант)

**Источник**: `packages/constants/src/linter-limits.ts`

- **Простые компоненты**: до 20 строк
- **Средние компоненты**: 20-40 строк
- **UI компоненты**: до 60 строк (`FUNCTION_SIZE_LIMITS.UI_COMPONENTS`)
- **Основные страницы**: до 80 строк (`FUNCTION_SIZE_LIMITS.MAIN_PAGES`)
- **API endpoints**: до 100 строк (`FUNCTION_SIZE_LIMITS.API_ENDPOINTS`)
- **Тесты**: до 120 строк (`FUNCTION_SIZE_LIMITS.TESTS`)
- **Хуки**: до 75 строк (`FUNCTION_SIZE_LIMITS.HOOKS`)

#### Централизованные константы:

```typescript
// packages/constants/src/linter-limits.ts
export const FUNCTION_SIZE_LIMITS = {
  BASE: 50, // Базовый лимит
  UI_COMPONENTS: 60, // UI компоненты (JSX)
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

### Техники сокращения

```tsx
// ❌ Плохо - слишком много ответственности
function UserDashboard({ userId }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const userData = await fetchUser(userId);
        const ordersData = await fetchUserOrders(userId);
        setUser(userData);
        setOrders(ordersData);
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  if (loading) return <DashboardSkeleton />;
  if (!user) return <UserNotFound />;

  return (
    <div className="grid grid-cols-2 gap-6">
      <UserProfile user={user} />
      <RecentOrders orders={orders} />
      <UserStats user={user} orders={orders} />
    </div>
  );
}

// ✅ Хорошо - разделение ответственности
function UserDashboard({ userId }: Props) {
  const userQuery = useUserQuery(userId);
  const ordersQuery = useUserOrdersQuery(userId);

  if (userQuery.isLoading) return <DashboardSkeleton />;
  if (!userQuery.data) return <UserNotFound />;

  return <DashboardContent user={userQuery.data} orders={ordersQuery.data} />;
}

function DashboardContent({ user, orders }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <UserProfile user={user} />
      <RecentOrders orders={orders || []} />
      <UserStats user={user} orders={orders || []} />
    </div>
  );
}
```

---

## 🚥 Условная логика

### Используйте Guard Clauses

```tsx
// ✅ Хорошо - ранние возвраты
function OrderSummary({ order }: Props) {
  if (!order) return <OrderNotFound />;
  if (order.items.length === 0) return <EmptyCart />;
  if (order.status === 'cancelled') return <CancelledOrder order={order} />;

  return <ActiveOrder order={order} />;
}
```

### Избегайте глубокой вложенности

```tsx
// ❌ Плохо - глубокая вложенность
function PaymentForm({ user, cart }: Props) {
  return (
    <div>
      {user ? (
        <div>
          {cart.items.length > 0 ? (
            <div>
              {user.paymentMethods.length > 0 ? (
                <PaymentSelector methods={user.paymentMethods} />
              ) : (
                <AddPaymentMethod />
              )}
            </div>
          ) : (
            <EmptyCart />
          )}
        </div>
      ) : (
        <LoginPrompt />
      )}
    </div>
  );
}

// ✅ Хорошо - плоская структура
function PaymentForm({ user, cart }: Props) {
  if (!user) return <LoginPrompt />;
  if (cart.items.length === 0) return <EmptyCart />;
  if (user.paymentMethods.length === 0) return <AddPaymentMethod />;

  return <PaymentSelector methods={user.paymentMethods} />;
}
```

---

## 🎨 Полиморфные компоненты

### Когда использовать

✅ **ДА** - для UI вариантов:

- Кнопки с разными стилями
- Алерты/уведомления
- Бейджи/статусы
- Иконки с состояниями

### Реализация через конфигурацию

```tsx
// packages/ui/src/components/alert.tsx
const AlertVariants = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
} as const;

const AlertIcons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
} as const;

interface AlertProps {
  variant?: keyof typeof AlertVariants;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', children, className }: AlertProps) {
  const Icon = AlertIcons[variant];

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border',
        AlertVariants[variant],
        className
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
}
```

### Кнопки с вариантами

```tsx
// packages/ui/src/components/button.tsx
const ButtonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  destructive: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
} as const;

const ButtonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
} as const;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof ButtonVariants;
  size?: keyof typeof ButtonSizes;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors focus:outline-none focus:ring-2',
        ButtonVariants[variant],
        ButtonSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

---

## 📊 Lookup Tables для состояний

### Когда использовать

✅ **ДА** - для состояний с конфигурацией:

- Статусы заказов/платежей
- Типы пользователей
- Уровни доступа
- Категории контента

```tsx
// packages/constants/src/order-status.ts
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Ожидает подтверждения',
    color: 'yellow',
    icon: 'clock',
    canCancel: true,
    canEdit: true,
  },
  confirmed: {
    label: 'Подтвержден',
    color: 'blue',
    icon: 'check',
    canCancel: true,
    canEdit: false,
  },
  shipped: {
    label: 'Отправлен',
    color: 'purple',
    icon: 'truck',
    canCancel: false,
    canEdit: false,
  },
  delivered: {
    label: 'Доставлен',
    color: 'green',
    icon: 'check-circle',
    canCancel: false,
    canEdit: false,
  },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_CONFIG;
```

```tsx
// packages/ui/src/components/order-status.tsx
import { ORDER_STATUS_CONFIG } from '@repo/constants';

interface OrderStatusProps {
  status: OrderStatus;
  showActions?: boolean;
}

export function OrderStatus({ status, showActions = false }: OrderStatusProps) {
  const config = ORDER_STATUS_CONFIG[status];

  return (
    <div className="flex items-center justify-between">
      <Badge variant={config.color}>
        <Icon name={config.icon} className="mr-2" />
        {config.label}
      </Badge>

      {showActions && (
        <div className="flex gap-2">
          {config.canEdit && <EditButton />}
          {config.canCancel && <CancelButton />}
        </div>
      )}
    </div>
  );
}
```

---

## 🚫 Когда НЕ усложнять

### Простые условия оставляйте как есть

```tsx
// ✅ Хорошо - простые guard clauses
function Avatar({ user }: Props) {
  if (!user) return <DefaultAvatar />;
  if (!user.avatar) return <InitialsAvatar name={user.name} />;

  return <img src={user.avatar} alt={user.name} className="rounded-full" />;
}

// ✅ Хорошо - простая условная логика
function WelcomeMessage({ user }: Props) {
  const greeting = user.lastLoginAt
    ? `Добро пожаловать, ${user.name}!`
    : `Впервые у нас, ${user.name}?`;

  return <h1>{greeting}</h1>;
}
```

### Логика с 2-3 вариантами

```tsx
// ✅ Хорошо - не усложняйте
function LoadingState({ type }: Props) {
  if (type === 'spinner') return <Spinner />;
  if (type === 'skeleton') return <Skeleton />;
  return <div>Loading...</div>;
}

// ❌ Плохо - излишнее усложнение для 3 вариантов
const LoadingComponents = {
  spinner: Spinner,
  skeleton: Skeleton,
  default: () => <div>Loading...</div>,
};

function LoadingState({ type }: Props) {
  const Component = LoadingComponents[type] ?? LoadingComponents.default;
  return <Component />;
}
```

---

## 📦 Constants пакет

### Структура

```typescript
// packages/constants/src/index.ts
export * from './api';
export * from './business';
export * from './ui';
export * from './validation';

// packages/constants/src/api.ts
export const API_ENDPOINTS = {
  USERS: '/api/users',
  ORDERS: '/api/orders',
  PAYMENTS: '/api/payments',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;

// packages/constants/src/business.ts
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const;

// packages/constants/src/validation.ts
export const VALIDATION_LIMITS = {
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  ORDER_ITEMS_MAX: 50,
} as const;
```

### Использование

```typescript
// В компонентах
import { ORDER_STATUSES, HTTP_STATUS } from '@repo/constants';

// В API
if (response.status === HTTP_STATUS.OK) {
  // ...
}

// В валидации
if (order.status === ORDER_STATUSES.PENDING) {
  // ...
}
```

---

## 🧪 Тестирование паттерны

### User-Centric Testing

**Принцип**: Тестировать поведение, а не implementation details.

**Используемые инструменты**:

- `@testing-library/react` - DOM запросы через пользовательские сценарии
- `@testing-library/jest-dom` - расширенные матчеры
- `@testing-library/user-event` - симуляция пользовательских действий

**Примеры из кодовой базы**:

```typescript
// packages/ui/src/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Test Button</Button>);
    // Используем role вместо className или testId
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    // Симулируем реальное взаимодействие пользователя
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Приоритеты запросов** (по убыванию):

1. `getByRole()` - семантические роли
2. `getByLabelText()` - форма labels
3. `getByText()` - видимый текст
4. `getByTestId()` - только в крайнем случае

### Testing Setup

**Конфигурация** (`jest.setup.cjs`):

```javascript
require('@testing-library/jest-dom');

// Mocks для Next.js
jest.mock('next/router', () => ({ useRouter: () => ({ ... }) }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ ... }) }));
```

**Правила**:

- Тестируйте контракты, не внутреннюю логику
- Используйте accessibility-focused запросы
- Мокайте внешние зависимости (Next.js router, API)

---

## ✅ Code Review Checklist

### Размер и сложность

- [ ] Функции не превышают 50 строк
- [ ] Сложность функций не превышает 10
- [ ] Глубина вложенности не больше 2 уровней
- [ ] Используются guard clauses вместо глубокой вложенности

### Условная логика

- [ ] UI варианты реализованы через конфигурацию (lookup tables)
- [ ] Состояния с множественными свойствами вынесены в константы
- [ ] Простые условия (2-3 варианта) оставлены как if/else
- [ ] Guard clauses используются для валидации входных данных

### Константы

- [ ] Отсутствуют магические строки и числа
- [ ] API endpoints, статусы, роли вынесены в constants пакет
- [ ] Конфигурация UI компонентов централизована

### Архитектура

- [ ] UI компоненты не содержат бизнес-логику
- [ ] Hooks/stores изолированы от UI деталей
- [ ] Зависимости направлены правильно (UI → hooks → exchange-core)

### Архитектурные паттерны

- [ ] **Compound Components**: Сложные UI компоненты используют Object.assign паттерн
- [ ] **DOM Props Filtering**: Отфильтрованы React-специфичные пропсы перед передачей в DOM
- [ ] **Context Enhancement**: Используется автоматическое внедрение пропсов где применимо

### TypeScript

- [ ] Типы экспортированы из правильных пакетов
- [ ] Используется `as const` для конфигурационных объектов
- [ ] Нет `any` типов без веской причины

### Тестирование

- [ ] Тесты используют `getByRole()` и accessibility-focused запросы
- [ ] Тестируется поведение пользователя, а не implementation details
- [ ] Мокаются внешние зависимости (Next.js router, API calls)

---

## 🔒 Pre-commit хуки

### Автоматические проверки

Каждый коммит автоматически проходит следующие проверки:

#### 📝 **Lint-staged** (для измененных файлов):

```json
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix --max-warnings 0", // ESLint с нулевой толерантностью к предупреждениям
    "prettier --write" // Автоформатирование
  ],
  "*.{css,scss}": [
    "stylelint --fix", // Stylelint с автофиксом
    "prettier --write" // Форматирование CSS
  ],
  "*.{json,md}": [
    "prettier --write" // Форматирование JSON/Markdown
  ],
  "packages/constants/**/*.{ts,tsx}": [
    "npm run build --workspace=@repo/constants" // Пересборка constants при изменении
  ]
}
```

#### 🔧 **Полные проверки проекта**:

1. **Type checking**: `npm run check-types`
   - Проверка TypeScript для всего проекта
   - Выявление ошибок типизации

2. **Unit tests**: `npm run test`
   - Запуск unit тестов
   - Убеждаемся что изменения не ломают существующую функциональность

#### 📋 **Commit message** (commitlint):

Сообщения коммитов должны следовать [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Примеры правильных сообщений:
feat(ui): add polymorphic Alert component
fix(constants): correct ORDER_STATUS_CONFIG types
docs: update code style guide
refactor(hooks): simplify user store logic
test(ui): add Button component tests
```

### Обход проверок (только в экстренных случаях)

```bash
# Пропустить pre-commit хуки (НЕ РЕКОМЕНДУЕТСЯ)
git commit --no-verify -m "emergency fix"

# Пропустить только commitlint
git commit --no-verify -m "temporary commit"
```

### Настройка локального окружения

```bash
# Установить хуки (автоматически при npm install)
npx husky install

# Ручная установка хуков
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

### Решение проблем

#### ESLint ошибки:

```bash
# Автофикс всех файлов
npm run lint

# Проверка конкретного файла
npx eslint src/components/Button.tsx --fix
```

#### TypeScript ошибки:

```bash
# Проверка типов
npm run check-types

# Проверка конкретного workspace
npm run check-types --workspace=@repo/ui
```

#### Stylelint ошибки:

```bash
# Автофикс стилей
npm run lint:styles

# Проверка конкретного файла
npx stylelint src/styles/globals.css --fix
```

### Производительность хуков

- **Lint-staged**: Обрабатывает только измененные файлы (~2-5 секунд)
- **Type checking**: Проверяет весь проект (~10-30 секунд)
- **Unit tests**: Запускает все тесты (~5-15 секунд)

**Общее время**: ~20-50 секунд в зависимости от размера изменений.

---

## 🎉 **Итоговая сводка изменений**

### ✅ **1. Code Style Guide**

Создан комплексный стайл-гайд в `docs/CODE_STYLE_GUIDE.md`:

- Правила размера компонентов (до 50 строк)
- Guard clauses вместо глубокой вложенности
- Полиморфные компоненты для UI вариантов
- Lookup tables для состояний с конфигурацией
- Code Review Checklist

### ✅ **2. ESLint конфигурация обновлена**

В `eslint.config.mjs` добавлены правила:

```javascript
"max-lines-per-function": ["error", 50],
"complexity": ["warn", 10],
"max-depth": ["error", 2],
"max-params": ["error", 4]
```

### ✅ **3. Constants пакет создан**

Структура `packages/constants/`:

- `api.ts` - API endpoints, HTTP статусы
- `business.ts` - Бизнес константы (роли, статусы)
- `ui.ts` - UI конфигурация с lookup tables
- `validation.ts` - Правила валидации и паттерны
- Полная типизация с TypeScript

### ✅ **4. Pre-commit хуки настроены**

Создан `docs/PRE_COMMIT_GUIDE.md` и обновлены:

- `.husky/pre-commit` - комплексные проверки
- `.lintstagedrc.json` - автофиксы для staged файлов
- Проверки: ESLint, Prettier, Stylelint, TypeScript, Tests

### ✅ **5. Документация**

- `docs/CODE_STYLE_GUIDE.md` - основной стайл-гайд
- `docs/PRE_COMMIT_GUIDE.md` - руководство по хукам
- `packages/constants/README.md` - документация constants
- `docs/CONSTANTS_EXAMPLES.ts` - примеры использования

---

## 🛡️ Валидация и безопасность

### Security-Enhanced Validation

**КРИТИЧНО**: Все новые формы ДОЛЖНЫ использовать security-enhanced schemas с XSS protection.

#### ✅ Правильный подход:

```typescript
// ✅ Security-enhanced schema с XSS защитой
import { securityEnhancedLoginSchema } from '@repo/utils';

const form = useFormWithNextIntl({
  validationSchema: securityEnhancedLoginSchema, // 🛡️ XSS protected
  // ...
});
```

#### ❌ Устаревший подход:

```typescript
// ❌ DEPRECATED: Legacy schema без XSS protection
import { loginSchema } from '@repo/utils'; // Уязвимо к XSS!
```

### Обязательные для изучения:

- **[SECURITY_ENHANCED_VALIDATION_GUIDE.md](SECURITY_ENHANCED_VALIDATION_GUIDE.md)** - полное руководство по безопасной валидации
- **[VALIDATION_ARCHITECTURE_GUIDE.md](VALIDATION_ARCHITECTURE_GUIDE.md)** - архитектурные принципы системы валидации
- **[VALIDATION_LOCALIZATION_GUIDE.md](VALIDATION_LOCALIZATION_GUIDE.md)** - практическое руководство по локализации валидации

### Принципы безопасности:

1. **Security-First**: XSS protection на уровне schemas
2. **Type Safety**: SecurityEnhanced\* типы для всех форм
3. **Compositional Design**: Building blocks + security layer
4. **Legacy Deprecation**: Миграция от небезопасных patterns

---

### 🎯 **Готово к использованию:**

1. **ESLint правила** автоматически проверяют качество кода
2. **Constants пакет** заменяет магические строки
3. **Security-Enhanced Validation** защищает от XSS атак
4. **Pre-commit хуки** предотвращают попадание плохого кода в репозиторий
5. **Стайл-гайд** обеспечивает единообразие разработки

### 🚀 **Следующие шаги для команды:**

1. Ознакомиться со стайл-гайдом и руководством по валидации
2. Начать использовать security-enhanced schemas в новых формах
3. Начать использовать константы вместо магических строк
4. Создать первые полиморфные компоненты (Alert, Button)
5. Следовать правилам при code review

**Все готово для высококачественной разработки! 🎉**
