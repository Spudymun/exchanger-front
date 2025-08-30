# `@repo/providers`

Централизованная система React провайдеров для ExchangeGO монорепозитория с SSR-safe архитектурой и современным state management.

## 🎯 Обзор

Пакет предоставляет критически важную инфраструктуру для всех приложений монорепозитория:

- ✅ **React Query Provider** - централизованное управление server state
- ✅ **Theme System** - полная поддержка light/dark/system тем
- ✅ **SSR-safe архитектура** - предотвращение FOUC (Flash of Unstyled Content)
- ✅ **Оптимизированные настройки** - производительность и кэширование
- ✅ **TypeScript типизация** - полная типизация всех провайдеров

## 🏗️ Архитектура пакета

### Структура файлов

```
packages/providers/
├── src/
│   ├── index.tsx           # Главный провайдер + React Query
│   ├── theme-provider.tsx  # Система темизации с SSR поддержкой
│   └── theme-script.tsx    # Синхронный скрипт предотвращения FOUC
├── package.json           # Конфигурация и зависимости
├── tsconfig.json         # TypeScript настройки
└── README.md             # Документация (этот файл)
```

### Зависимости

```json
{
  "dependencies": {
    "@repo/constants": "*", // THEME_MODES константы
    "@repo/hooks": "*", // useUIStore для состояния темы
    "@trpc/react-query": "^11.0.0", // tRPC интеграция
    "@tanstack/react-query": "^5.45.0", // Server state management
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  }
}
```

## 🚀 Компоненты и API

### 1. Providers (главный провайдер)

Основной провайдер для React Query с оптимизированными настройками.

```typescript
import { Providers } from '@repo/providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

#### Конфигурация React Query

```typescript
// Автоматически настроенные параметры:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут кэширования
      retry: 1, // 1 повторная попытка
      refetchOnWindowFocus: false, // Отключен рефетч при фокусе
    },
  },
});
```

### 2. ThemeProvider (система темизации)

Полнофункциональная система темизации с поддержкой SSR и системных настроек.

```typescript
import { ThemeProvider } from '@repo/providers';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      {children}
    </ThemeProvider>
  );
}
```

#### Props

| Prop           | Type              | Default    | Описание            |
| -------------- | ----------------- | ---------- | ------------------- |
| `children`     | `React.ReactNode` | -          | Дочерние компоненты |
| `defaultTheme` | `ThemeMode`       | `"system"` | Тема по умолчанию   |

#### ThemeMode типы

```typescript
type ThemeMode = 'light' | 'dark' | 'system';
```

### 3. useTheme Hook

Хук для управления темой в компонентах.

```typescript
import { useTheme } from '@repo/providers';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Current: {resolvedTheme} (setting: {theme})
    </button>
  );
}
```

#### API useTheme

```typescript
interface ThemeContextType {
  theme: ThemeMode; // Текущая настройка темы
  setTheme: (theme: ThemeMode) => void; // Функция изменения темы
  resolvedTheme: 'light' | 'dark'; // Разрешенная тема (system -> light/dark)
}
```

### 4. ThemeScript (предотвращение FOUC)

Критически важный компонент для SSR-приложений.

```typescript
import { ThemeScript } from '@repo/providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <ThemeScript /> {/* Должен быть в <head> */}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### Как работает ThemeScript

1. **Синхронное выполнение** - запускается до React hydration
2. **Чтение localStorage** - восстанавливает сохраненную тему
3. **Системная тема** - определяет через `prefers-color-scheme`
4. **DOM манипуляция** - применяет CSS класс `dark` к `<html>`
5. **Fallback логика** - безопасное поведение при ошибках

## 🔧 Интеграция в приложения

### Next.js App Router (рекомендуемый подход)

#### 1. Root Layout (SSR уровень)

```typescript
// app/layout.tsx
import { ThemeScript } from '@repo/providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ExchangeGO',
  description: 'Crypto Exchange Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

#### 2. App Layout (Client уровень)

```typescript
// src/components/app-layout.tsx
'use client';

import { ThemeProvider } from '@repo/providers';
import { TRPCProvider } from '../lib/trpc-provider';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider>
      <TRPCProvider>
        <div className="min-h-screen flex flex-col">
          <header>Header</header>
          <main className="flex-1">{children}</main>
          <footer>Footer</footer>
        </div>
      </TRPCProvider>
    </ThemeProvider>
  );
}
```

#### 3. Page Component

```typescript
// app/page.tsx
import { AppLayout } from '../src/components/app-layout';

export default function HomePage() {
  return (
    <AppLayout>
      <h1>Welcome to ExchangeGO</h1>
    </AppLayout>
  );
}
```

### Полная интеграция (admin-panel пример)

```typescript
// apps/admin-panel/app/layout.tsx
import { Providers, ThemeProvider } from '@repo/providers';
import '@repo/ui/styles';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ThemeProvider defaultTheme="system">
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
```

## 🎨 Работа с темизацией

### Интеграция с Zustand Store

ThemeProvider автоматически интегрируется с `useUIStore` из `@repo/hooks`:

```typescript
// Внутренняя логика ThemeProvider
import { useUIStore } from '@repo/hooks/src/client-hooks';

export function ThemeProvider({ children }) {
  const { theme, setTheme } = useUIStore(); // Автоматическая синхронизация

  // Логика применения темы...
}
```

### Создание Theme Toggle компонента

```typescript
// components/theme-toggle.tsx
import { useTheme } from '@repo/providers';
import { THEME_MODES } from '@repo/constants';
import { Button } from '@repo/ui';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const themes = [THEME_MODES.LIGHT, THEME_MODES.DARK, THEME_MODES.SYSTEM];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getIcon = () => {
    switch (theme) {
      case THEME_MODES.LIGHT: return <Sun className="h-4 w-4" />;
      case THEME_MODES.DARK: return <Moon className="h-4 w-4" />;
      case THEME_MODES.SYSTEM: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme}>
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

### CSS интеграция

Темы работают через CSS классы и CSS переменные:

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}

/* Tailwind автоматически использует эти переменные */
.bg-background {
  background-color: hsl(var(--background));
}
.text-foreground {
  color: hsl(var(--foreground));
}
```

## 🔄 Интеграция с tRPC

### Использование с tRPC Provider

```typescript
// lib/trpc-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from './trpc';
import { useState } from 'react';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => trpc.createClient({
    links: [
      // tRPC configuration
    ],
  }));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Комбинирование провайдеров

```typescript
// components/app-layout.tsx
import { ThemeProvider } from '@repo/providers';
import { TRPCProvider } from '../lib/trpc-provider';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TRPCProvider>
        {children}
      </TRPCProvider>
    </ThemeProvider>
  );
}
```

## 🧪 Тестирование

### Test Utilities

```typescript
// test-utils.tsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@repo/providers';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        <ThemeProvider defaultTheme="light">
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
```

### Пример теста

```typescript
// components/__tests__/theme-toggle.test.tsx
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { ThemeToggle } from '../theme-toggle';

test('theme toggle changes theme', () => {
  renderWithProviders(<ThemeToggle />);

  const button = screen.getByRole('button');
  fireEvent.click(button);

  // Проверяем изменение темы
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});
```

## ⚡ Производительность и оптимизация

### React Query настройки

```typescript
// Оптимизированные настройки по умолчанию
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
      retry: 1, // Только 1 повторная попытка
      refetchOnWindowFocus: false, // Не рефетчить при фокусе
    },
  },
});
```

### Theme Performance

- **Синхронный скрипт** предотвращает FOUC
- **CSS переменные** для быстрого переключения
- **localStorage кэширование** настроек пользователя
- **Media query listener** только для system режима

### Bundle Size

```bash
# Анализ размера пакета
npm run build:analyze

# Основные зависимости:
# - @tanstack/react-query: ~40KB
# - React Context: ~2KB
# - Theme logic: ~3KB
```

## 🔧 Кастомизация

### Кастомные настройки React Query

```typescript
// lib/custom-providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function CustomProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 60 * 1000,    // 10 минут вместо 5
        retry: 3,                      // 3 попытки вместо 1
        refetchOnWindowFocus: true,    // Включить рефетч
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Кастомная тема по умолчанию

```typescript
// components/custom-theme-provider.tsx
import { ThemeProvider } from '@repo/providers';

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark">
      {children}
    </ThemeProvider>
  );
}
```

## 🚨 SSR Guidelines

### DO ✅

```typescript
// ✅ Правильно - ThemeScript в <head>
export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}

// ✅ Правильно - suppressHydrationWarning для темы
<ThemeProvider>
  <div suppressHydrationWarning>
    {children}
  </div>
</ThemeProvider>
```

### DON'T ❌

```typescript
// ❌ Неправильно - ThemeScript в <body>
<body>
  <ThemeScript /> {/* Будет FOUC! */}
  {children}
</body>

// ❌ Неправильно - без suppressHydrationWarning
<ThemeProvider>
  {children} {/* Hydration mismatch! */}
</ThemeProvider>

// ❌ Неправильно - использование темы в Server Components
export default function ServerPage() {
  const { theme } = useTheme(); // SSR error!
  return <div>Theme: {theme}</div>;
}
```

## 📚 Связанная документация

- **[DEVELOPER_GUIDE.md](../../docs/core/DEVELOPER_GUIDE.md)** - React Query и State Management
- **[Constants Package](../constants/README.md)** - THEME_MODES константы
- **[Hooks Package](../hooks/README.md)** - useUIStore интеграция
- **[UI Package](../ui/README.md)** - Theme Toggle компонент

## 🎯 Best Practices

### ✅ Рекомендуется

- Используйте `ThemeScript` в `<head>` для предотвращения FOUC
- Применяйте `suppressHydrationWarning` для theme-зависимых компонентов
- Комбинируйте `ThemeProvider` с другими провайдерами правильно
- Используйте `useTheme` только в Client Components
- Настраивайте React Query под нужды приложения

### ❌ Не рекомендуется

- Не размещайте `ThemeScript` в `<body>`
- Не используйте `useTheme` в Server Components
- Не забывайте `suppressHydrationWarning` для темизации
- Не дублируйте провайдеры в разных частях приложения
- Не изменяйте тему напрямую через DOM без провайдера

## 🔧 Development

### Добавление нового провайдера

1. Создайте файл в `src/new-provider.tsx`
2. Реализуйте провайдер с TypeScript типами
3. Добавьте экспорт в `src/index.tsx`
4. Обновите документацию и примеры
5. Добавьте тесты для нового провайдера

### Модификация существующих провайдеров

1. Сохраняйте обратную совместимость API
2. Обновляйте TypeScript типы
3. Тестируйте во всех приложениях
4. Документируйте breaking changes
5. Обновляйте примеры использования

Пакет является **критически важным** для всей архитектуры приложений в монорепозитории!
