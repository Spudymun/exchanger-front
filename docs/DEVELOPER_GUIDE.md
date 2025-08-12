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
| **Tailwind CSS** | 3.4.16 | Utility-first CSS            | ✅ + Design Tokens |
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
// ✅ SSR-safe подход для client компонентов
'use client';
import { useUserStore } from '@repo/hooks/src/client-hooks';

export function LoginButton() {
  const { login, isAuthenticated } = useUserStore()

  if (isAuthenticated) return <LogoutButton />

  return <button onClick={() => login(credentials)}>Login</button>
}
```

## 🔄 Working with State in Next.js App Router

### SSR-Safe State Management Rules:

**1. Server Components - только типы:**

```typescript
// ✅ Безопасно в Server Components
import type { UseFormReturn, NotificationType } from '@repo/hooks';

// ❌ Ошибка в Server Components
import { useUIStore } from '@repo/hooks'; // SSR error!
```

**2. Client Components - полная функциональность:**

```typescript
// ✅ Правильно в Client Components
'use client';
import { useUIStore, useForm, useNotifications } from '@repo/hooks/src/client-hooks';

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();
  return <button onClick={() => setTheme('dark')}>Toggle</button>;
}
```

**3. Обязательная директива 'use client':**

```typescript
// ❌ Забыли 'use client' - будет SSR ошибка
import { useUIStore } from '@repo/hooks/src/client-hooks';

// ✅ Правильно с директивой
('use client');
import { useUIStore } from '@repo/hooks/src/client-hooks';
```

**4. Избегание Hydration Mismatch:**

```typescript
'use client';
import { useUIStore } from '@repo/hooks/src/client-hooks';
import { useEffect, useState } from 'react';

export function ThemeAwareComponent() {
  const { theme } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Предотвращаем hydration mismatch
  if (!mounted) return <div>Loading...</div>;

  return <div className={theme === 'dark' ? 'dark' : 'light'}>Content</div>;
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

### Tailwind CSS + Централизованная CSS архитектура

#### ✅ Новая архитектура CSS (2025)

**Централизованные CSS Variables**: Все CSS переменные теперь определены в одном месте и автоматически импортируются во все приложения.

**Расположение**: `packages/tailwind-preset/globals.css` - единственный источник истины для всех CSS переменных.

#### Правильная структура импортов:

```css
/* В каждом apps/{app}/app/globals.css */
@import '@repo/tailwind-preset/globals.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### Конфигурация Tailwind CSS:

```javascript
// packages/tailwind-preset/tailwind.config.js
module.exports = {
  content: [
    '../../apps/*/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // CSS Variables автоматически подхватываются из globals.css
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        // ... остальные переменные
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

#### Централизованные CSS Variables:

**📍 Расположение**: `packages/tailwind-preset/globals.css`

```css
@layer base {
  :root {
    /* === LIGHT THEME - Enhanced Visual Hierarchy v2.1 === */

    /* Level 1: Main background */
    --background: 220 14% 98%;
    --foreground: 222.2 84% 4.9%;

    /* Level 2: Card surfaces */
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    /* Level 3: Floating elements */
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    /* Interactive elements */
    --primary: 220 90% 50%;
    --primary-foreground: 210 40% 98%;

    /* Secondary surfaces */
    --secondary: 220 14% 96%;
    --secondary-foreground: 222.2 84% 4.9%;

    /* Muted backgrounds */
    --muted: 220 14% 96%;
    --muted-foreground: 215 16% 47%;

    /* Accent surfaces */
    --accent: 220 14% 96%;
    --accent-foreground: 222.2 84% 4.9%;

    /* Error states */
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;

    /* Visible borders */
    --border: 220 13% 85%;

    /* Input backgrounds */
    --input: 220 13% 91%;

    /* Focus rings */
    --ring: 220 90% 50%;
    --radius: 0.5rem;
  }

  .dark {
    /* === DARK THEME - 6-уровневая иерархия для четкого разделения === */

    /* Level 1: Deep background */
    --background: 222.2 84% 2%;
    --foreground: 210 40% 98%;

    /* Level 2: Card surfaces */
    --card: 222.2 84% 4%;
    --card-foreground: 210 40% 98%;

    /* Level 3: Popovers */
    --popover: 222.2 84% 5%;
    --popover-foreground: 210 40% 98%;

    /* Level 4: Interactive elements */
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    /* Level 5: Secondary elements */
    --secondary: 217.2 32.6% 10%;
    --secondary-foreground: 210 40% 98%;

    /* Level 6: Muted elements */
    --muted: 217.2 32.6% 8%;
    --muted-foreground: 215 20.2% 65.1%;

    /* Accent surfaces */
    --accent: 217.2 32.6% 10%;
    --accent-foreground: 210 40% 98%;

    /* Error states */
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    /* Visible borders */
    --border: 217.2 32.6% 12%;

    /* Input backgrounds */
    --input: 217.2 32.6% 10%;

    /* Focus rings */
    --ring: 212.7 26.8% 83.9%;
  }
}
```

#### ✅ Ключевые принципы новой архитектуры:

1. **Единый источник истины**: `packages/tailwind-preset/globals.css`
2. **Автоматический импорт**: `@import '@repo/tailwind-preset/globals.css'` в каждом приложении
3. **Нулевое дублирование**: CSS переменные определены только в одном файле
4. **Предсказуемая иерархия**: Семантическая структура переменных
5. **Поддержка тем**: Автоматическая поддержка light/dark режимов

#### Правила использования:

- ✅ **Используйте централизованные переменные**: `bg-card`, `text-foreground`
- ✅ **Импортируйте preset во все приложения**: `@import '@repo/tailwind-preset/globals.css'`
- ❌ **Не дублируйте CSS переменные** в отдельных файлах
- ❌ **Не определяйте CSS переменные** вне `packages/tailwind-preset/`

### 🎨 Дизайн-система v2.1 - Централизованные паттерны

**Обновлено:** Январь 2025 - Улучшенная визуальная иерархия и адаптивность

#### Использование централизованных стилей

```typescript
// Правильное использование CSS переменных
import { cn } from '@repo/ui';

export function ExchangeCard({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      // Используем централизованные CSS переменные
      'bg-card text-card-foreground rounded-lg',
      'border border-border',
      'shadow-sm',
      'p-6 space-y-4',
      // Focus стили
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    )}>
      {children}
    </div>
  );
}
```

#### Примеры семантических компонентов

```typescript
// Компоненты с правильным использованием переменных
export const DesignComponents = {
  ExchangeCard: ({ type, children }: { type: 'sending' | 'receiving'; children: React.ReactNode }) => (
    <div className={cn(
      'bg-card text-card-foreground rounded-lg border border-border p-6',
      type === 'sending' && 'shadow-blue-500/10 dark:shadow-blue-400/20',
      type === 'receiving' && 'shadow-purple-500/10 dark:shadow-purple-400/20'
    )}>
      {children}
    </div>
  ),

  FormSection: ({ children }: { children: React.ReactNode }) => (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      {children}
    </div>
  ),

  InteractiveButton: ({ variant = 'default', children, ...props }: ButtonProps) => (
    <button
      className={cn(
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'rounded-md px-4 py-2 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
      {...props}
    >
      {children}
    </button>
  ),
};
```

      DS.containers.card,
      DS.elevation.card,
      DS.borders.default,
      type === 'sending'
        ? 'shadow-blue-500/10 dark:shadow-blue-400/20'
        : 'shadow-purple-500/10 dark:shadow-purple-400/20',
      'p-6 space-y-4 transition-all duration-200'
    )}>
      {children}
    </div>

),

ActionButton: ({ variant, children, ...props }: ButtonProps) => (
<Button
className={cn(
DS.elevation.hover,
DS.focus.ring,
'transition-all duration-200'
)}
variant={variant}
{...props} >
{children}
</Button>
),

FormSection: ({ title, children }: { title: string; children: React.ReactNode }) => (

<div className={cn(DS.containers.section, 'space-y-3')}>
<h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
<div className={cn(DS.borders.subtle, 'rounded-md p-4')}>
{children}
</div>
</div>
)
};

````

#### Принципы дизайн-системы v2.1

1. **Визуальная иерархия**: 6-уровневая система для темной темы, четкий контраст для светлой
2. **Адаптивность**: Все компоненты работают в обеих темах без дополнительной настройки
3. **Централизация**: Все стили определены в `form-patterns.js` для легкого обновления
4. **Семантичность**: Компоненты названы по назначению, а не по внешнему виду
5. **Переиспользование**: Максимальное использование существующих паттернов

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

2. **⚠️ ОБЯЗАТЕЛЬНО: Обновить package.json при изменении структуры пакета**:

```json
// packages/design-tokens/package.json
{
  "files": [
    "index.js",
    "index.d.ts",
    "colors.js",
    "typography.js",
    "spacing.js",
    "form-patterns.js",
    "new-file.js"  // ← Добавить новый файл
  ],
  "dependencies": {
    "@repo/constants": "*",  // ← Добавить если используете типы из constants
    "@repo/new-package": "*" // ← Добавить новые зависимости
  }
}
```

**Когда обновлять package.json:**
- ✅ **Добавили новый .js файл** → добавить в `files` массив
- ✅ **Используете типы из другого пакета** → добавить в `dependencies`
- ✅ **Импортируете из другого internal пакета** → добавить зависимость
- ❌ **Только изменили содержимое существующих файлов** → обновление не нужно`

3. **Использовать в CSS**:

```css
/* Автоматически доступно как Tailwind класс */
.success-button {
  @apply bg-success-500 hover:bg-success-600 text-white;
}
```

4. **В компонентах**:

```typescript
<div className="bg-success-50 border border-success-200 text-success-800">
  Success message
</div>
```

#### Как добавить новые семантические паттерны:

1. **Добавить в form-patterns.js**:

```javascript
// packages/design-tokens/form-patterns.js
export const newPatterns = {
  customCard: {
    base: 'bg-card text-card-foreground border border-border rounded-lg p-4',
    variants: {
      highlighted: 'border-primary/50 shadow-primary/10',
      subtle: 'bg-muted/50 border-muted',
    }
  }
};
```

2. **Экспортировать в index.js**:

```javascript
// packages/design-tokens/index.js
export { newPatterns } from './form-patterns.js';
```

3. **Использовать в компонентах**:

```typescript
import { newPatterns } from '@repo/design-tokens';

<div className={newPatterns.customCard.base}>
  Контент
</div>
```

#### Как обновлять exports в eslint-config:

**⚠️ ВАЖНО**: При добавлении новых модулей ESLint обновляйте exports в package.json:

```json
// packages/eslint-config/package.json
{
  "exports": {
    "./base": "./base.js",
    "./api": "./api.js",
    "./react": "./react.js",
    "./testing": "./testing.js",
    "./utils": "./utils.js",
    "./configs": "./configs.js",
    "./ignores": "./ignores.js",
    "./lazy-loading": "./lazy-loading.js",
    "./shared-rules": "./shared-rules.js",
    "./performance-benchmark": "./performance-benchmark.js",
    "./new-module": "./new-module.js"  // ← Добавить новый модуль
  }
}
```

**Когда обновлять exports:**
- ✅ **Добавили новый .js модуль** → добавить в exports
- ✅ **Модуль используется в eslint.config.mjs** → добавить в exports
- ✅ **Модуль может использоваться извне** → добавить в exports
- ❌ **Модуль только для внутреннего использования** → можно не добавлять

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

**Конфигурация**: Настроена в каждом приложении с использованием App Router

**🚨 ВАЖНО**: Используйте ТОЛЬКО официальную документацию next-intl и следуйте структуре файлов ниже.

#### Правильная структура next-intl (Next.js 15 + App Router):

```
apps/web/
├── src/
│   └── i18n/
│       ├── routing.ts        # Конфигурация маршрутизации
│       ├── navigation.ts     # Навигационные API
│       └── request.ts        # Конфигурация запросов
├── messages/
│   ├── en.json
│   ├── ru.json
│   └── [locale].json
├── middleware.ts            # Использует createMiddleware
├── next.config.js           # Указывает путь к request.ts
└── app/
    ├── layout.tsx           # Корневой layout с html/body
    ├── not-found.tsx        # Глобальная 404 с редиректом на локализированную
    └── [locale]/
        ├── layout.tsx       # С hasLocale, setRequestLocale
        ├── page.tsx         # С setRequestLocale
        └── not-found-page/  # Локализированная 404 страница
            └── page.tsx
```

#### 1. Конфигурация маршрутизации (`src/i18n/routing.ts`):

```typescript
import { SUPPORTED_LOCALES } from '@repo/constants';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: SUPPORTED_LOCALES,

  // Used when no locale matches
  defaultLocale: 'en',
});
```

#### 2. Навигационные API (`src/i18n/navigation.ts`):

```typescript
import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

#### 3. Конфигурация запросов (`src/i18n/request.ts`):

```typescript
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

#### 4. Middleware (`middleware.ts`):

```typescript
import createMiddleware from 'next-intl/middleware';

import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*|favicon\\.ico).*)',
};
```

#### 5. Next.js конфигурация (`next.config.js`):

```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/exchange-core', '@repo/constants', '@repo/ui', '@repo/utils'],
  serverExternalPackages: ['@trpc/server'],
};

export default withNextIntl(nextConfig);
```

#### 6. Root Layout (`app/layout.tsx`):

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ExchangeGO - Enterprise Crypto Exchange',
  description: 'Modern cryptocurrency exchange platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
```

#### 7. Layout с локалью (`app/[locale]/layout.tsx`):

```typescript
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from 'next-intl/server';

import { routing } from '../../src/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      {children}
    </NextIntlClientProvider>
  );
}
```

#### 8. Страница с локалью (`app/[locale]/page.tsx`):

```typescript
import { useTranslations } from "next-intl";
import { setRequestLocale } from 'next-intl/server';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  const t = useTranslations('HomePage');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

#### 8. Файлы переводов:

```json
// messages/en.json
{
  "HomePage": {
    "title": "Exchanger",
    "description": "Enterprise-ready cryptocurrency exchange platform",
    "getStarted": "Get Started",
    "learnMore": "Learn More",
    "features": {
      "title": "Enterprise Features",
      "turborepo": {
        "title": "Turborepo Monorepo",
        "description": "Scalable monorepo architecture"
      },
      "trpc": {
        "title": "tRPC API",
        "description": "End-to-end typesafe APIs"
      }
    }
  },
  "NotFound": {
    "title": "Page not found",
    "description": "The page you are looking for doesn't exist.",
    "goHome": "Go home"
  }
}
```

```json
// messages/ru.json
{
  "HomePage": {
    "title": "Exchanger",
    "description": "Готовая к промышленному использованию платформа для торговли криптовалютой",
    "getStarted": "Начать",
    "learnMore": "Узнать больше",
    "features": {
      "title": "Корпоративные возможности",
      "turborepo": {
        "title": "Turborepo монорепозиторий",
        "description": "Масштабируемая архитектура монорепозитория"
      },
      "trpc": {
        "title": "tRPC API",
        "description": "Сквозная типизация API"
      }
    }
  },
  "NotFound": {
    "title": "Страница не найдена",
    "description": "Страница, которую вы ищете, не существует.",
    "goHome": "На главную"
  }
}
```

#### 9. Использование в компонентах:

```typescript
// В серверных компонентах
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('HomePage');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}

// В клиентских компонентах
'use client';
import { useTranslations } from 'next-intl';

export function LoadingButton() {
  const t = useTranslations('common');
  const [loading, setLoading] = useState(false);

  return (
    <button disabled={loading}>
      {loading ? t('loading') : t('save')}
    </button>
  );
}
```

#### 🚨 КРИТИЧНО: Правильная интерполяция параметров

**В next-intl используются ОДИНАРНЫЕ фигурные скобки `{parameter}`, НЕ двойные `{{parameter}}`!**

```json
// ✅ ПРАВИЛЬНО в messages/en.json:
{
  "validation": {
    "password": {
      "minLength": "Password must contain at least {min} characters"
    }
  }
}

// ❌ НЕПРАВИЛЬНО:
{
  "validation": {
    "password": {
      "minLength": "Password must contain at least {{min}} characters"
    }
  }
}
```

```typescript
// Использование в коде:
const t = useTranslations('validation.password');
const message = t('minLength', { min: 8 });
// Результат: "Password must contain at least 8 characters"
```

**См. также**: [I18N Troubleshooting Guide](./troubleshooting/I18N_TROUBLESHOOTING.md#проблема-6-malformed_argument---ошибка-интерполяции)

#### 10. Навигация между страницами:

```typescript
// Используйте Link из src/i18n/navigation.ts, НЕ из next/link
import { Link } from '@/src/i18n/navigation';

export function Navigation() {
  return (
    <nav>
      <Link href="/">{t('navigation.home')}</Link>
      <Link href="/about">{t('navigation.about')}</Link>
    </nav>
  );
}
```

### 🚨 КРИТИЧЕСКИЕ ПРАВИЛА I18N:

1. **ВСЕГДА следуйте официальной документации** next-intl
2. **НИКОГДА не создавайте собственную архитектуру** - используйте предложенную структуру
3. **ОБЯЗАТЕЛЬНО используйте `setRequestLocale`** в layout.tsx и page.tsx
4. **ВСЕГДА используйте `hasLocale` для валидации** локали
5. **ИСПОЛЬЗУЙТЕ `Link` из `src/i18n/navigation.ts`**, НЕ из `next/link`
6. **ПУТЬ к `request.ts` в `next.config.js`** должен быть точным

### 📋 Чек-лист для добавления новых переводов:

1. **Создать ключи в JSON файлах** (en.json, ru.json)
2. **Добавить типизацию** (если используется TypeScript augmentation)
3. **Использовать в компонентах** через `useTranslations`
4. **Тестировать на обеих локалях** (/en и /ru)
5. **Проверить статическое генерирование** с `generateStaticParams`

### 🐛 Частые ошибки и решения:

| Ошибка               | Причина                        | Решение                        |
| -------------------- | ------------------------------ | ------------------------------ |
| 404 на /en, /ru      | Неправильная структура файлов  | Следуйте структуре выше        |
| Redirect loops       | Неправильный middleware        | Используйте `createMiddleware` |
| "Cannot find module" | Неверный путь в next.config.js | Проверьте путь к request.ts    |
| Missing translations | Отсутствие `setRequestLocale`  | Добавьте в layout и page       |
| Hydration errors     | Неправильный ClientProvider    | Используйте без messages prop  |
| MALFORMED_ARGUMENT   | Двойные скобки {{param}}       | Используйте одинарные {param}  |

### 🚨 Архитектура 404 страниц

Проект использует специальную архитектуру для локализированных 404 страниц:

#### Глобальная 404 (`app/not-found.tsx`):

```typescript
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function GlobalNotFound() {
  const headersList = await headers();
  const locale = headersList.get('x-locale') || 'en';
  redirect(`/${locale}/not-found-page`);
}
```

#### Локализированная 404 (`app/[locale]/not-found-page/page.tsx`):

```typescript
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';

export default async function NotFoundPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('NotFound');

  return (
    <div>
      <h1>404</h1>
      <h2>{t('title')}</h2>
      <p>{t('description')}</p>
    </div>
  );
}
```

**Как работает:**

1. Пользователь заходит на несуществующий URL (например `/ru/orders`)
2. Next.js вызывает глобальный `not-found.tsx`
3. Middleware предоставляет локаль через header `x-locale`
4. Происходит редирект на локализированную страницу `/ru/not-found-page`
5. Отображается 404 с правильными переводами

### 🔗 Полезные ссылки:

- [next-intl Official Docs](https://next-intl-docs.vercel.app/)
- [App Router Setup](https://next-intl-docs.vercel.app/docs/getting-started/app-router/with-i18n-routing)
- [Static Rendering](https://next-intl-docs.vercel.app/docs/getting-started/app-router/with-i18n-routing#static-rendering)

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
    files: ['**/*.{js,ts,jsx,tsx}'],
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
  console.log('UserCard rendered'); // Должно быть удалено
  return <div>...</div>;
}
```

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
```

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

##
````
