# Developer Guide

Полное руководство для разработчиков по работе с монорепозиторием Exchanger.

## 📋 Содержание

1. [Архитектура и структура проекта](#архитектура-и-структура-проекта)
2. [Технологический стек](#технологический-стек)
3. [Работа с зависимостями в монорепозитории](#работа-с-зависимостями-в-монорепозитории)
4. [Структура директорий](#структура-директорий)
5. [UI-система и компоненты](#ui-система-и-компоненты)
6. [State Management](#state-management)
7. [API и типизация](#api-и-типизация)
8. [Стилизация и темизация](#стилизация-и-темизация)
9. [Интернационализация (i18n)](#интернационализация-i18n)
10. [Тестирование](#тестирование)
11. [Контроль качества кода](#контроль-качества-кода)
12. [Workflow и best practices](#workflow-и-best-practices)

---

## 🏗️ Архитектура и структура проекта

### Монорепозиторий с Turborepo

Проект использует **монорепозиторий** для управления несколькими связанными приложениями и библиотеками.

#### Принципы организации:

- **`apps/`** - готовые к деплою приложения
- **`packages/`** - переиспользуемые библиотеки и утилиты
- **Общие зависимости** - управляются на корневом уровне
- **Типизация** - единая система типов через TypeScript

#### Turborepo конфигурация (`turbo.json`):

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## 🛠️ Технологический стек

### Основные технологии

| Технология       | Версия | Назначение                   | Статус             |
| ---------------- | ------ | ---------------------------- | ------------------ |
| **Next.js**      | 15.x   | React фреймворк с App Router | ✅ Настроен        |
| **TypeScript**   | 5.x    | Статическая типизация        | ✅ Strict mode     |
| **Turborepo**    | 2.x    | Монорепозиторий              | ✅ Настроен        |
| **Tailwind CSS** | 4.x    | Utility-first CSS            | ✅ + Design Tokens |
| **shadcn/ui**    | latest | UI-компоненты                | ✅ Интегрирован    |
| **tRPC**         | 11.x   | End-to-end типизация API     | ✅ Настроен        |
| **Zustand**      | 4.x    | State management             | ✅ Интегрирован    |
| **React Query**  | 5.x    | Server state management      | ✅ Настроен        |
| **next-intl**    | 3.x    | Интернационализация          | ✅ Настроен        |
| **Jest**         | 29.x   | Unit тесты                   | ✅ Настроен        |
| **Playwright**   | latest | E2E тесты                    | ✅ Настроен        |
| **Storybook**    | 8.x    | UI документация              | ✅ Настроен        |

---

## � Работа с зависимостями в монорепозитории

### Добавление зависимостей между internal packages

При работе с константами, утилитами или другими общими ресурсами используйте централизованные пакеты вместо дублирования кода.

#### Как добавить зависимость на internal package:

1. **Откройте `package.json` целевого пакета**

   ```bash
   # Например, packages/hooks/package.json
   ```

2. **Добавьте зависимость в секцию `dependencies`**

   ```json
   {
     "dependencies": {
       "@repo/constants": "*",
       "react": "^19.1.0"
     }
   }
   ```

3. **Используйте правильный импорт в коде**

   ```typescript
   // ❌ Неправильно - создание локальных констант
   const TIMEOUT = 5000;

   // ✅ Правильно - импорт из централизованного пакета
   import { UI_NUMERIC_CONSTANTS } from '@repo/constants';
   const timeout = UI_NUMERIC_CONSTANTS.NOTIFICATION_AUTO_REMOVE_TIMEOUT;
   ```

#### Обновление зависимостей после изменений:

1. **Пересоберите пакет с изменениями**

   ```bash
   npx turbo run build --filter=@repo/constants
   ```

2. **Проверьте типизацию в зависимых пакетах**

   ```bash
   npx turbo run check-types --filter=@repo/hooks
   ```

3. **При проблемах с кэшированием TypeScript**
   ```bash
   # Очистка кэша (если нужно)
   Remove-Item -Recurse -Force "packages/[package]/node_modules/.cache" -ErrorAction SilentlyContinue
   ```

#### Частые проблемы и решения:

| Проблема                   | Симптом                                | Решение                                   |
| -------------------------- | -------------------------------------- | ----------------------------------------- |
| **Отсутствие зависимости** | `Cannot find module '@repo/constants'` | Добавить зависимость в `package.json`     |
| **Старые типы**            | `Property 'NEW_CONST' does not exist`  | Пересобрать пакет с изменениями           |
| **Кэш TypeScript**         | Типы не обновляются                    | Очистить кэш или перезапустить TypeScript |

### ⚠️ КРИТИЧЕСКИ ВАЖНО: Синтаксис workspace зависимостей

#### Проблема с `workspace:*` в npm

**НЕ ИСПОЛЬЗУЙТЕ** `"workspace:*"` синтаксис в npm monorepo с Turborepo:

```json
{
  "dependencies": {
    "@repo/constants": "workspace:*" // ❌ НЕПРАВИЛЬНО - вызывает ошибки npm
  }
}
```

#### ✅ Правильные способы указания internal зависимостей:

**Вариант 1: Использование `"*"`** (рекомендуется)

```json
{
  "dependencies": {
    "@repo/constants": "*", // ✅ ПРАВИЛЬНО
    "@repo/utils": "*", // ✅ ПРАВИЛЬНО
    "@repo/ui": "*" // ✅ ПРАВИЛЬНО
  }
}
```

**Вариант 2: File references** (альтернатива)

```json
{
  "dependencies": {
    "@repo/constants": "file:../constants", // ✅ ПРАВИЛЬНО
    "@repo/utils": "file:../utils" // ✅ ПРАВИЛЬНО
  }
}
```

#### Типичные ошибки при использовании `workspace:*`:

```bash
# Ошибка при npm install
npm ERR! Could not resolve dependency:
npm ERR! peer @repo/constants@"workspace:*" from @repo/hooks@1.0.0

# Ошибка при сборке
Error: Cannot resolve module '@repo/constants'
```

#### Как исправить существующие проблемы:

1. **Найдите все файлы с `workspace:*`**

   ```powershell
   # PowerShell команда для поиска
   Get-ChildItem -Recurse -Name "package.json" | ForEach-Object {
     $content = Get-Content $_ -Raw
     if ($content -match '"workspace:\*"') {
       Write-Output $_
     }
   }
   ```

2. **Замените `workspace:*` на `*`**

   ```json
   // Было:
   "@repo/constants": "workspace:*"

   // Стало:
   "@repo/constants": "*"
   ```

3. **Переустановите зависимости**

   ```powershell
   # Очистите node_modules и package-lock.json
   Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
   Remove-Item package-lock.json -ErrorAction SilentlyContinue

   # Переустановите зависимости
   npm install
   ```

#### Почему `workspace:*` не работает с npm:

- **Yarn vs npm**: `workspace:*` синтаксис специфичен для Yarn
- **npm использует**: `*` или `file:` references для local packages
- **Turborepo совместимость**: Turbo работает с обеими системами, но требует корректного синтаксиса

#### Best practices для монорепозитория:

```json
{
  "name": "@repo/web",
  "dependencies": {
    // ✅ External packages - точные версии
    "react": "^19.1.0",
    "next": "^15.1.0",

    // ✅ Internal packages - wildcards
    "@repo/constants": "*",
    "@repo/ui": "*",
    "@repo/utils": "*"
  },
  "devDependencies": {
    // ✅ Development tools - точные версии
    "@types/react": "^19.0.2",
    "typescript": "^5.7.2"
  }
}
```

#### Принципы работы с константами:

- **DRY (Don't Repeat Yourself)** - используйте `@repo/constants` вместо дублирования
- **Централизация** - все константы в одном месте для консистентности
- **Типизация** - константы должны быть строго типизированы
- **Семантическая группировка** - группируйте константы по назначению

#### Примеры правильного использования:

```typescript
// ✅ UI константы
import { UI_NUMERIC_CONSTANTS, BUTTON_VARIANTS } from '@repo/constants';

// ✅ API константы
import { API_ROUTES, HTTP_STATUS } from '@repo/constants';

// ✅ Бизнес константы
import { EXCHANGE_LIMITS, CURRENCY_CODES } from '@repo/constants';
```

---

## 📁 Структура директорий

**Расположение**: `packages/ui/src/components/ui/`

**Принцип**: Один компонент = один файл

```typescript
// packages/ui/src/components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

#### 2. Составные компоненты

**Расположение**: `packages/ui/src/components/`

**Принцип**: Комбинируют базовые компоненты для сложной функциональности

```typescript
// packages/ui/src/components/data-table.tsx
export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Array<Column<T>>;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
}
```

### Как добавлять новые компоненты

#### 1. Базовый компонент (из shadcn/ui):

```bash
# Добавить новый shadcn/ui компонент
npx shadcn@latest add [component-name]

# Компонент автоматически добавится в packages/ui/src/components/ui/
```

#### 2. Составной компонент:

```bash
# Создать новый составной компонент
cd packages/ui
npm run generate:component

# Или вручную:
# 1. Создать packages/ui/src/components/my-component.tsx
# 2. Добавить в packages/ui/src/index.ts
# 3. Добавить Storybook историю в packages/ui/src/stories/
# 4. Добавить тесты в packages/ui/src/__tests__/
```

#### 3. Шаблон нового компонента:

```typescript
// packages/ui/src/components/my-component.tsx
import React from 'react'
import { cn } from '../lib/utils'

export interface MyComponentProps {
  className?: string
  children?: React.ReactNode
  // Специфичные пропы
}

export const MyComponent = React.forwardRef<
  HTMLDivElement,
  MyComponentProps
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("base-styles", className)}
      {...props}
    >
      {children}
    </div>
  )
})

MyComponent.displayName = "MyComponent"
```

#### 4. Экспорт компонента:

```typescript
// packages/ui/src/index.ts
export { MyComponent, type MyComponentProps } from './components/my-component';
```

#### 5. Storybook история:

```typescript
// packages/ui/src/stories/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from '../components/my-component';

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
    children: 'Hello World',
  },
};
```

---

## 🏪 State Management

### Zustand - Централизованное состояние

**Расположение**: `packages/hooks/src/state/`

#### Архитектура состояния:

- **UI Store** - глобальное UI состояние (темы, модалы, загрузки)
- **Business Stores** - бизнес логика (trading, user, etc.)

#### UI Store (`ui-store.ts`):

```typescript
interface UIState {
  // Темизация
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Модалы
  modals: Record<string, boolean>;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;

  // Загрузки
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, isLoading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // State implementation
    }),
    {
      name: 'ui-storage',
      partialize: state => ({ theme: state.theme }),
    }
  )
);
```

#### Как добавить новый store:

1. **Создать store файл**:

```typescript
// packages/hooks/src/state/user-store.ts
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  login: async credentials => {
    // Login logic
    set({ user: userData, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
```

2. **Экспортировать из индекса**:

```typescript
// packages/hooks/src/index.ts
export { useUserStore } from './state/user-store';
```

3. **Использовать в компонентах**:

```typescript
// В любом компоненте
import { useUserStore } from '@repo/hooks'

export function LoginButton() {
  const { login, isAuthenticated } = useUserStore()

  if (isAuthenticated) return <LogoutButton />

  return <button onClick={() => login(credentials)}>Login</button>
}
```

#### Персистенция данных:

```typescript
// Для данных, которые должны сохраняться
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // state
    }),
    {
      name: 'user-storage',
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

---

## 🔌 API и типизация

### tRPC - End-to-end типизация

**Расположение**: `apps/web/src/server/trpc/`

#### Архитектура API:

- **Server procedures** - определение API на сервере
- **Client** - типизированный клиент для фронтенда
- **Автоматическая типизация** - от сервера к клиенту

#### Определение процедур:

```typescript
// apps/web/src/server/trpc/routers/index.ts
import { z } from 'zod';
import { initTRPC } from '@trpc/server';

const t = initTRPC.create();

const appRouter = t.router({
  // Query (чтение данных)
  getUsers: t.procedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Бизнес логика
      return {
        users: [], // User[]
        total: 0,
        page: input.page,
      };
    }),

  // Mutation (изменение данных)
  createUser: t.procedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        role: z.enum(['admin', 'user']),
      })
    )
    .mutation(async ({ input }) => {
      // Создание пользователя
      return { user: newUser, success: true };
    }),

  // Subscription (real-time)
  onUserUpdate: t.procedure.subscription(() => {
    return observable<User>(emit => {
      // WebSocket logic
    });
  }),
});

export type AppRouter = typeof appRouter;
```

#### Использование в компонентах:

```typescript
// В приложении
import { trpc } from '../utils/trpc'

export function UsersList() {
  // Query с автоматической типизацией
  const { data, isLoading, error } = trpc.getUsers.useQuery({
    page: 1,
    limit: 10,
    search: 'john'
  })

  // Mutation
  const createUser = trpc.createUser.useMutation({
    onSuccess: () => {
      // Обновить кеш
      trpc.getUsers.invalidate()
    }
  })

  const handleCreate = () => {
    createUser.mutate({
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user'
    })
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={handleCreate}>Create User</button>
    </div>
  )
}
```

#### Как добавить новую процедуру:

1. **Определить схему входных данных**:

```typescript
const CreateProductInput = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  categoryId: z.string(),
});
```

2. **Добавить процедуру в роутер**:

```typescript
const appRouter = t.router({
  // ...existing procedures

  createProduct: t.procedure.input(CreateProductInput).mutation(async ({ input }) => {
    // Валидация прав доступа
    // Бизнес логика
    // Возврат результата
    return { product, success: true };
  }),
});
```

3. **Использовать в компоненте**:

```typescript
const createProduct = trpc.createProduct.useMutation();
```

### React Query - Server state

**Настройка**: `packages/providers/src/index.tsx`

#### Провайдер:

```typescript
// packages/providers/src/index.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 минут
        retry: 3,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

#### Использование без tRPC:

```typescript
// Для внешних API
function useExternalData() {
  return useQuery({
    queryKey: ['external-data', params],
    queryFn: () => fetch('/api/external').then(res => res.json()),
    staleTime: 10 * 60 * 1000,
  });
}
```

---

## 🎨 Стилизация и темизация

### Tailwind CSS + Design Tokens

#### Конфигурация (`tailwind.config.js`):

```javascript
module.exports = {
  content: ['./apps/**/*.{js,ts,jsx,tsx}', './packages/ui/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Design tokens автоматически импортируются
      colors: require('./packages/design-tokens/colors'),
      fontFamily: require('./packages/design-tokens/typography').fontFamily,
      spacing: require('./packages/design-tokens/spacing'),
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

#### CSS Variables для темизации:

```css
/* packages/ui/src/styles/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... остальные переменные */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    /* ... темная тема */
  }
}
```

#### Theme Provider:

```typescript
// packages/ui/src/components/theme-provider.tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

#### Как добавить новые design tokens:

1. **Добавить в токены**:

```javascript
// packages/design-tokens/colors.js
module.exports = {
  colors: {
    // Существующие цвета...

    // Новые цвета
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      900: '#14532d',
    },
  },
};
```

2. **Использовать в CSS**:

```css
/* Автоматически доступно как Tailwind класс */
.success-button {
  @apply bg-success-500 hover:bg-success-600 text-white;
}
```

3. **В компонентах**:

```typescript
<div className="bg-success-50 border border-success-200 text-success-800">
  Success message
</div>
```

#### Кастомные CSS компоненты:

```css
/* packages/ui/src/styles/components.css */
@layer components {
  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90;
    @apply px-4 py-2 rounded-md font-medium transition-colors;
  }

  .card {
    @apply bg-card text-card-foreground shadow-sm border rounded-lg;
  }
}
```

---

## 🌍 Интернационализация (i18n)

### next-intl - Типизированные переводы

**Конфигурация**: Настроена в каждом приложении

#### Структура переводов:

```
apps/web/
├── messages/
│   ├── en.json
│   ├── ru.json
│   └── [locale].json
├── middleware.ts          # Роутинг локалей
└── i18n.ts               # Конфигурация
```

#### Файлы переводов:

```json
// apps/web/messages/en.json
{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "save": "Save",
    "cancel": "Cancel"
  },
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "pages": {
    "home": {
      "title": "Welcome to Exchanger",
      "description": "Modern exchange platform"
    }
  }
}
```

```json
// apps/web/messages/ru.json
{
  "common": {
    "loading": "Загрузка...",
    "error": "Что-то пошло не так",
    "save": "Сохранить",
    "cancel": "Отмена"
  },
  "navigation": {
    "home": "Главная",
    "about": "О нас",
    "contact": "Контакты"
  },
  "pages": {
    "home": {
      "title": "Добро пожаловать в Exchanger",
      "description": "Современная биржевая платформа"
    }
  }
}
```

#### Конфигурация i18n:

```typescript
// apps/web/i18n.ts
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'ru'];

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

#### Middleware для роутинга:

```typescript
// apps/web/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'ru'],
  defaultLocale: 'en',
  localePrefix: 'always', // /en/page, /ru/page
});

export const config = {
  matcher: ['/', '/(ru|en)/:path*'],
};
```

#### Использование в компонентах:

```typescript
// В серверных компонентах
import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('pages.home')

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  )
}

// В клиентских компонентах
'use client'
import { useTranslations } from 'next-intl'

export function LoadingButton() {
  const t = useTranslations('common')
  const [loading, setLoading] = useState(false)

  return (
    <button disabled={loading}>
      {loading ? t('loading') : t('save')}
    </button>
  )
}
```

#### Как добавить новые переводы:

1. **Добавить ключи в JSON файлы**:

```json
// Во все locale файлы
{
  "products": {
    "title": "Products" / "Товары",
    "create": "Create Product" / "Создать товар",
    "list": "Product List" / "Список товаров"
  }
}
```

2. **Создать типизированный хук** (опционально):

```typescript
// utils/translations.ts
export function useProductTranslations() {
  return useTranslations('products');
}
```

3. **Использовать в компонентах**:

```typescript
export function ProductsPage() {
  const t = useTranslations('products')

  return <h1>{t('title')}</h1>
}
```

#### Интерполяция и плюрализация:

```json
{
  "messages": {
    "welcome": "Welcome, {name}!",
    "itemCount": "{count, plural, =0 {No items} =1 {One item} other {# items}}"
  }
}
```

```typescript
// Использование
t('messages.welcome', { name: 'John' });
t('messages.itemCount', { count: 5 });
```

---

## 🧪 Тестирование

### Jest + Testing Library - Unit тесты

**Конфигурация**: `jest.config.js` (корневой), `jest.setup.js`

#### Структура тестов:

```
packages/ui/
├── src/
│   ├── __tests__/             # Unit тесты
│   │   ├── Button.test.tsx
│   │   └── DataTable.test.tsx
│   └── components/
apps/web/
├── __tests__/                 # Интеграционные тесты
│   ├── pages/
│   └── components/
tests/                         # E2E тесты
├── admin-panel.spec.ts
└── web.spec.ts
```

#### Пример unit теста:

```typescript
// packages/ui/src/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../components/ui/button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })
})
```

#### Тестирование с провайдерами:

```typescript
// Test utilities
function renderWithProviders(ui: React.ReactElement) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper })
}

// Использование
test('component with providers', () => {
  renderWithProviders(<MyComponent />)
  // assertions
})
```

#### Как добавить новые тесты:

1. **Создать тест файл**:

```typescript
// packages/ui/src/__tests__/NewComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { NewComponent } from '../components/new-component'

describe('NewComponent', () => {
  it('should render correctly', () => {
    render(<NewComponent />)
    // Базовые проверки
  })
})
```

2. **Запустить тесты**:

```bash
# Все тесты
npm run test

# Конкретный пакет
cd packages/ui && npm run test

# Watch mode
npm run test:watch
```

### Playwright - E2E тесты

**Конфигурация**: `playwright.config.ts`

#### Структура E2E тестов:

```
tests/
├── admin-panel.spec.ts        # Тесты админ панели
├── web.spec.ts               # Тесты основного приложения
└── fixtures/                 # Тестовые данные
```

#### Пример E2E теста:

```typescript
// tests/web.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Web Application', () => {
  test('should display homepage correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Проверяем заголовок
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome');

    // Проверяем навигацию
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should handle theme toggle', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Нажимаем на переключатель темы
    await page.getByRole('button', { name: /theme/i }).click();

    // Проверяем, что тема изменилась
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Кликаем на ссылку
    await page.getByRole('link', { name: 'About' }).click();

    // Проверяем URL
    await expect(page).toHaveURL(/\/about/);
  });
});
```

#### Как добавить новые E2E тесты:

1. **Создать spec файл**:

```typescript
// tests/new-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('New Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Подготовка перед каждым тестом
    await page.goto('/new-feature');
  });

  test('should work correctly', async ({ page }) => {
    // Тестовые шаги
  });
});
```

2. **Запустить тесты**:

```bash
# Все E2E тесты
npx playwright test

# Конкретный браузер
npx playwright test --project=chromium

# UI режим
npx playwright test --ui

# Debug режим
npx playwright test --debug
```

### Storybook - Компонентная документация

**Конфигурация**: `.storybook/main.ts`

#### Структура историй:

```
packages/ui/src/stories/
├── Button.stories.tsx
├── DataTable.stories.tsx
└── [Component].stories.tsx
```

#### Пример Storybook истории:

```typescript
// packages/ui/src/stories/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/ui/button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
}

export const WithIcon: Story = {
  args: {
    size: 'icon',
    children: <PlusIcon className="h-4 w-4" />,
  },
}
```

#### Как добавить новые истории:

1. **Создать story файл**:

```typescript
// packages/ui/src/stories/NewComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { NewComponent } from '../components/new-component';

const meta: Meta<typeof NewComponent> = {
  title: 'Components/NewComponent',
  component: NewComponent,
  // конфигурация
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // props
  },
};
```

2. **Запустить Storybook**:

```bash
npm run storybook
```

---

## 🔍 Контроль качества кода

### ESLint - Централизованная архитектура линтинга

**Архитектура**: Единый конфиг с модульной структурой и lazy loading

#### Основные принципы новой архитектуры:

- **Единый файл конфигурации**: `eslint.config.mjs` (root-level)
- **Модульная структура**: `packages/eslint-config/` с разделением по типам файлов
- **Lazy loading**: Условная загрузка конфигов для оптимизации производительности
- **Централизованные лимиты**: Все правила используют константы из `@repo/constants`
- **Shared rules**: Мемоизированные общие правила для избежания дублирования

#### Структура модулей ESLint:

```
packages/eslint-config/
├── base.js               # Базовые TypeScript правила
├── shared-rules.js       # Централизованные правила (мемоизированные)
├── react.js              # React, hooks, a11y правила
├── api.js                # API слой (tRPC, endpoints)
├── testing.js            # Jest/testing правила
├── configs.js            # Конфигурационные файлы (turbo, etc.)
├── utils.js              # Утилитарные пакеты
├── ignores.js            # Централизованные ignores
├── lazy-loading.js       # Утилиты производительности
└── performance-benchmark.js # Мониторинг производительности
```

#### Ключевые особенности:

- **Мониторинг производительности**: Отслеживание времени загрузки конфигов
- **Централизованные ignores**: Устранение 80%+ ложных срабатываний
- **Архитектурные overrides**: Динамические лимиты для разных типов файлов
- **Security правила**: Защита от XSS, инъекций, eval
- **Ordering импортов**: Единообразная организация импортов
- **React hooks**: Валидация правильного использования хуков
- **Accessibility**: A11y правила для улучшения UX

#### Централизованные лимиты:

```typescript
// packages/constants/src/linter-limits.ts
export const FUNCTION_SIZE_LIMITS = {
  BASE: 50, // Базовый лимит
  UI_COMPONENTS: 60, // UI компоненты
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

#### Примеры правил для разных типов файлов:

```javascript
// eslint.config.mjs - главный конфиг
import { FUNCTION_SIZE_LIMITS, COMPLEXITY_LIMITS } from './packages/constants/dist/index.js';
import { lazyLoadConfig } from './packages/eslint-config/lazy-loading.js';

export default [
  // Глобальные правила
  {
    name: 'global-rules',
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: lazyLoadConfig('global-rules', () => ({
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.BASE }],
      complexity: ['error', COMPLEXITY_LIMITS.BASE],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',
    })),
  },

  // UI компоненты
  {
    name: 'ui-components',
    files: ['packages/ui/**/*.{js,jsx,ts,tsx}'],
    rules: lazyLoadConfig('ui-rules', () => ({
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.UI_COMPONENTS }],
      'react-hooks/rules-of-hooks': 'error',
      'jsx-a11y/alt-text': 'error',
    })),
  },

  // API слой
  {
    name: 'api-layer',
    files: ['apps/web/src/server/trpc/**/*.ts'],
    rules: lazyLoadConfig('api-rules', () => ({
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.API_ENDPOINTS }],
      complexity: ['error', COMPLEXITY_LIMITS.API_LAYER],
      'no-console': 'off', // Разрешен для логирования
    })),
  },
];
```

#### Как настроить правила для нового пакета:

1. **Использовать centralized config**:

```javascript
// packages/new-package/eslint.config.mjs (не нужен, используется root)
// Все правила настраиваются в root eslint.config.mjs через overrides
```

2. **Добавить override в root eslint.config.mjs**:

```javascript
// eslint.config.mjs
export default [
  // ...existing configs...

  // Новый пакет
  {
    name: 'new-package',
    files: ['packages/new-package/**/*.{js,ts}'],
    rules: lazyLoadConfig('new-package-rules', () => ({
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.BASE }],
      'no-console': 'error',
    })),
  },
];
```

3. **Добавить скрипты в package.json**:

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings 52",
    "lint:fix": "eslint . --fix --max-warnings 52"
  }
}
```

#### Performance мониторинг:

```bash
# Бенчмарк производительности
npm run lint:benchmark

# Мониторинг времени загрузки конфига
# Автоматически в консоли при запуске eslint
```

#### Архитектурно оправданные console.log

**🚨 Проблема**: Pre-commit хуки автоматически удаляют `eslint-disable` комментарии для console.log, из-за чего коммиты становятся пустыми и важные логи теряются.

**✅ Решение**: ESLint overrides для инфраструктурных файлов вместо inline комментариев.

**📋 Паттерн конфигурации**:

```javascript
// eslint.config.mjs - уже настроен
export default [
  // ...base configs...

  // Override для инфраструктурных файлов
  {
    name: 'infrastructure-console',
    files: [
      'src/server/trpc/**/*.ts', // tRPC middleware & routers
      'pages/api/trpc/**/*.ts', // API endpoints
      'src/components/ui/**/*.tsx', // Demo UI components
      'scripts/**/*.js', // Build scripts
    ],
    rules: lazyLoadConfig('infrastructure-console', () => ({
      'no-console': 'off', // Разрешить console.log в инфраструктуре
    })),
  },
];
```

**🎯 Где разрешены console.log** (уже настроено):

| Тип файла           | Путь                         | Обоснование                             |
| ------------------- | ---------------------------- | --------------------------------------- |
| **tRPC middleware** | `src/server/trpc/**/*.ts`    | Логирование запросов, ошибок, метрик    |
| **API endpoints**   | `pages/api/trpc/**/*.ts`     | Отладка серверной логики                |
| **Demo компоненты** | `src/components/ui/**/*.tsx` | Примеры использования для разработчиков |
| **Build scripts**   | `scripts/**/*.js`            | Информация о процессе сборки            |

**⚠️ Критерии применения**:

- ✅ **Только для инфраструктурных/служебных файлов**
- ✅ **Логи должны нести диагностическую ценность**
- ✅ **Не применять для business-logic компонентов**
- ❌ **НЕ использовать для обычных UI компонентов**
- ❌ **НЕ использовать для utils/helpers**

**🔧 Пример использования**:

```javascript
// ✅ ПРАВИЛЬНО: В tRPC middleware (уже разрешено)
export const loggingMiddleware = t.middleware(async ({ next, path }) => {
  console.log(`[tRPC] ${path} started`); // Архитектурно оправдано
  const result = await next();
  console.log(`[tRPC] ${path} completed`);
  return result;
});

// ❌ НЕПРАВИЛЬНО: В UI компоненте
export function UserCard() {
  console.log('UserCard rendered'); // Будет заблокировано ESLint
  return <div>...</div>;
}
```

**💡 Важно**: Это решение предотвращает конфликты между архитектурными требованиями логирования и автоматизированными проверками качества кода.
export const loggingMiddleware = t.middleware(async ({ next, path }) => {
console.log(`[tRPC] ${path} started`); // Архитектурно оправдано
const result = await next();
console.log(`[tRPC] ${path} completed`);
return result;
});

// ❌ НЕПРАВИЛЬНО: В UI компоненте
export function UserCard() {
console.log('UserCard rendered'); // Должно быть удалено
return <div>...</div>;
}

````

**💡 Важно**: Это решение предотвращает конфликты между архитектурными требованиями логирования и автоматизированными проверками качества кода.

### Stylelint - CSS линтинг

**Конфигурация**: `.stylelintrc.json`

#### Правила для Tailwind:

```json
{
  "extends": ["stylelint-config-standard"],
  "plugins": ["stylelint-config-tailwindcss"],
  "rules": {
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": ["tailwind", "apply", "layer"]
      }
    ],
    "property-no-unknown": [
      true,
      {
        "ignoreProperties": ["@apply"]
      }
    ]
  }
}
````

### Husky + lint-staged - Pre-commit хуки

**Конфигурация**: `.husky/pre-commit`, `.lintstagedrc.json`

#### Автоматическая проверка:

```json
// .lintstagedrc.json
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,scss}": ["stylelint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

---

## 🚀 Workflow и best practices

### Разработка нового функционала

#### 1. Анализ задачи:

- Какие компоненты нужны?
- Какое состояние требуется?
- Какие API endpoints нужны?
- Нужны ли новые переводы?

#### 2. Создание структуры:

```bash
# 1. UI компоненты (если нужны)
cd packages/ui
npm run generate:component

# 2. API процедуры (если нужны)
# Добавить в packages/exchange-core/src/server.ts

# 3. Состояние (если нужно)
# Создать новый store в packages/hooks/src/state/

# 4. Переводы (если нужны)
# Добавить ключи в messages/*.json файлы
```

#### 3. Разработка компонентов:

```typescript
// Пример: функционал списка продуктов

// 1. API процедура
export const appRouter = t.router({
  getProducts: t.procedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional()
    }))
    .query(async ({ input }) => {
      // Логика получения продуктов
    })
})

// 2. Store (если нужен)
interface ProductsState {
  selectedCategory: string | null
  setSelectedCategory: (category: string | null) => void
}

// 3. Компонент
export function ProductsList() {
  const { selectedCategory } = useProductsStore()
  const { data: products } = trpc.getProducts.useQuery({
    category: selectedCategory
  })

  return (
    <DataTable
      data={products || []}
      columns={productColumns}
      searchable
      filterable
    />
  )
}
```

#### 4. Тестирование:

```bash
# Unit тесты для компонентов
npm run test

# E2E тесты для user flows
npx playwright test

# Storybook для UI документации
npm run storybook
```

#### 5. Проверка качества:

```bash
# Линтинг
npm run lint

# Типы
npm run check-types

# Сборка
npm run build
```

### Добавление нового приложения

#### 1. Создать структуру:

```bash
mkdir apps/new-app
cd apps/new-app
npm init -y
```

#### 2. Настроить Next.js:

```bash
npm install next react react-dom
npm install -D @types/react @types/react-dom typescript
```

#### 3. Настроить конфигурацию:

```json
// apps/new-app/package.json
{
  "scripts": {
    "dev": "next dev --port 3003",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/ui": "*",
    "@repo/providers": "*",
    "@repo/hooks": "*"
  }
}
```

#### 4. Добавить в Turborepo:

```json
// turbo.json
{
  "pipeline": {
    "dev": {
      "dependsOn": ["^build"],
      "cache": false
    }
  }
}
```

### Добавление нового пакета

#### 1. Создать структуру:

```bash
mkdir packages/new-package
cd packages/new-package
npm init -y
```

#### 2. Настроить TypeScript:

```json
// packages/new-package/tsconfig.json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 3. Настроить экспорты:

```json
// packages/new-package/package.json
{
  "name": "@repo/new-package",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

#### 4. Создать основные файлы:

```typescript
// packages/new-package/src/index.ts
export { myFunction } from './my-function';
export type { MyType } from './types';
```

### Debug и troubleshooting

#### Распространенные проблемы:

1. **TypeScript ошибки**:

```bash
# Проверить конфигурацию
npm run check-types

# Очистить кеш
rm -rf .next .turbo node_modules/.cache
npm install
```

2. **Tailwind классы не работают**:

```javascript
// Проверить tailwind.config.js
module.exports = {
  content: [
    './apps/**/*.{js,ts,jsx,tsx}',
    './packages/ui/**/*.{js,ts,jsx,tsx}', // Важно!
  ],
};
```

3. **Компоненты не импортируются**:

```typescript
// Проверить packages/ui/src/index.ts
export { MyComponent } from './components/my-component';
```

4. **tRPC типы не работают**:

```typescript
// Проверить настройку клиента
import type { AppRouter } from '../src/server/trpc';

const trpc = createTRPCReact<AppRouter>();
```

#### Полезные команды:

```bash
# Очистка
npm run clean        # Очистить все build артефакты
rm -rf node_modules  # Полная переустановка

# Разработка
npm run dev          # Запустить все приложения
npm run build        # Собрать все приложения
npm run lint         # Проверить качество кода

# Тестирование
npm run test         # Unit тесты
npx playwright test  # E2E тесты
npm run storybook    # UI документация
```

---

## 📚 Заключение

Этот проект предоставляет полную enterprise-инфраструктуру для разработки современных веб-приложений. Следуя этому руководству, вы сможете:

- ✅ Создавать типизированные и переиспользуемые компоненты
- ✅ Управлять состоянием приложения централизованно
- ✅ Строить end-to-end типизированные API
- ✅ Поддерживать высокое качество кода
- ✅ Масштабировать архитектуру под любые потребности

**Основные принципы:**

1. **Централизация** - всё общее выносится в packages/
2. **Типизация** - TypeScript everywhere
3. **Переиспользование** - DRY principle
4. **Качество** - автоматические проверки
5. **Документация** - каждый компонент в Storybook
6. **Тестирование** - unit + E2E coverage

Удачной разработки! 🚀
