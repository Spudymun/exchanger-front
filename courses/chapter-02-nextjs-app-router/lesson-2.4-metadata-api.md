# Урок 2.4: Metadata API и SEO оптимизация

> **🎯 Цель урока**: Освоить Metadata API для улучшения SEO и социальных сетей

## 📖 Введение

Представьте **витрину магазина**: **metadata** - это то что привлекает покупателей снаружи (заголовок, описание в поисковике), а **контент** - это товары внутри. В Next.js App Router **Metadata API** позволяет элегантно управлять всей информацией для поисковых систем и социальных сетей.

Хорошие метаданные критически важны для **SEO**, **социальных сетей** и **пользовательского опыта**.

## 🔍 Типы метаданных в проекте

### 1. **Статические метаданные**

```typescript
// app/[locale]/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'О нас | ExchangeGO',
  description: 'Ведущая криптовалютная биржа в Украине. Быстрый и безопасный обмен USDT, Bitcoin, Ethereum.',
  keywords: ['криптообмен', 'USDT', 'Bitcoin', 'Украина', 'обмен криптовалют'],
  authors: [{ name: 'ExchangeGO Team' }],
  creator: 'ExchangeGO',
  publisher: 'ExchangeGO',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: 'https://exchangego.com/about',
    title: 'О нас | ExchangeGO',
    description: 'Ведущая криптовалютная биржа в Украине',
    siteName: 'ExchangeGO',
    images: [
      {
        url: 'https://exchangego.com/og-about.jpg',
        width: 1200,
        height: 630,
        alt: 'ExchangeGO - криптовалютная биржа',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'О нас | ExchangeGO',
    description: 'Ведущая криптовалютная биржа в Украине',
    creator: '@ExchangeGO',
    images: ['https://exchangego.com/twitter-about.jpg'],
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
```

## ⏳ Loading состояния в App Router

### Принцип работы loading.tsx:

```
app/exchange/
├── page.tsx        # Основная страница (медленная загрузка)
├── loading.tsx     # Показывается АВТОМАТИЧЕСКИ во время загрузки page.tsx
└── layout.tsx      # Layout остается на месте
```

### Механизм:

1. **Пользователь переходит** на `/exchange`
2. **loading.tsx рендерится мгновенно** (пока page.tsx загружается)
3. **page.tsx загружается** (серверные данные, компоненты)
4. **loading.tsx заменяется** на page.tsx когда загрузка завершена

## 🔍 Анализ loading компонентов проекта

### 1. Базовый loading (`app/[locale]/loading.tsx`)

```typescript
// app/[locale]/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
```

### 2. Специализированный loading для exchange

```typescript
// app/[locale]/exchange/loading.tsx
import { Skeleton } from '@repo/ui';

export default function ExchangeLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Форма обмена */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />

          {/* Поля формы */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Информация об обмене */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-36" />
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
```

### 3. Loading для деталей заявки

```typescript
// app/[locale]/exchange/[id]/loading.tsx
import { Skeleton } from '@repo/ui';

export default function ExchangeDetailsLoading() {
  return (
    <div className="container mx-auto px-4 py-6">

      {/* Хлебные крошки */}
      <div className="mb-6">
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Заголовок */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Статус */}
      <div className="mb-6">
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Детали обмена */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="border rounded-lg p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-28" />
          <div className="border rounded-lg p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
```

## 🎨 Продвинутые loading паттерны

### 1. **Имитация реального контента** (Skeleton screens)

```typescript
// src/components/loading/ExchangeFormSkeleton.tsx
import { Skeleton } from '@repo/ui';

export function ExchangeFormSkeleton() {
  return (
    <div className="max-w-md mx-auto space-y-6">

      {/* Заголовок */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Поля формы */}
      <div className="space-y-4">

        {/* Отдаю */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        {/* Получаю */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        {/* Курс */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Кнопка */}
        <Skeleton className="h-10 w-full" />

      </div>

    </div>
  );
}
```

### 2. **Адаптивные loading состояния**

```typescript
// src/components/loading/AdaptiveLoading.tsx
'use client';

import { useMediaQuery } from '@repo/hooks';
import { Skeleton } from '@repo/ui';

export function AdaptiveExchangeLoading() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return <MobileExchangeLoading />;
  }

  return <DesktopExchangeLoading />;
}

function MobileExchangeLoading() {
  return (
    <div className="px-4 py-6 space-y-6">
      <Skeleton className="h-8 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

function DesktopExchangeLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
```

### 3. **Loading с анимациями**

```typescript
// src/components/loading/AnimatedLoading.tsx
export function AnimatedExchangeLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">

        {/* Анимированный заголовок */}
        <div className="text-center space-y-2">
          <div className="h-8 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer rounded w-48 mx-auto" />
          <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer rounded w-64 mx-auto" />
        </div>

        {/* Пульсирующие карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-muted rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
```

## 🚨 Error boundaries в App Router

### Принцип работы error.tsx:

```
app/exchange/
├── page.tsx        # Может выбросить ошибку
├── error.tsx       # Перехватывает ошибки в page.tsx
├── loading.tsx     # Loading состояние
└── layout.tsx      # НЕ перехватывается этим error.tsx
```

### 1. Базовый error boundary

```typescript
// app/[locale]/error.tsx
'use client'; // Error boundaries должны быть Client Components

import { useEffect } from 'react';
import { Button } from '@repo/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логируем ошибку в сервис мониторинга
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h2 className="text-xl font-semibold mb-4">
        Что-то пошло не так!
      </h2>

      <p className="text-muted-foreground mb-6">
        Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова.
      </p>

      <div className="space-x-2">
        <Button onClick={reset}>
          Попробовать снова
        </Button>

        <Button variant="outline" asChild>
          <a href="/">Вернуться на главную</a>
        </Button>
      </div>

      {/* В development показываем детали ошибки */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6 text-left">
          <summary className="cursor-pointer">Детали ошибки</summary>
          <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
            {error.message}
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
```

### 2. Специализированный error для exchange

```typescript
// app/[locale]/exchange/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@repo/ui';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ExchangeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Отправляем ошибку в систему мониторинга
    if (typeof window !== 'undefined') {
      // analytics.track('Exchange Error', {
      //   error: error.message,
      //   digest: error.digest,
      //   url: window.location.href,
      // });
    }
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center">

        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ошибка обмена
          </h1>
          <p className="text-gray-600">
            Не удалось загрузить страницу обмена. Проверьте подключение к интернету и попробуйте снова.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Попробовать снова
          </Button>

          <Button
            variant="outline"
            className="w-full"
            asChild
          >
            <a href="/">
              <Home className="h-4 w-4 mr-2" />
              Вернуться на главную
            </a>
          </Button>
        </div>

        {/* Контактная информация */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Если проблема повторяется, свяжитесь с поддержкой:
          </p>
          <a
            href="mailto:support@exchangego.com"
            className="text-sm text-blue-600 hover:underline"
          >
            support@exchangego.com
          </a>
        </div>

      </div>
    </div>
  );
}
```

### 3. Глобальный error boundary

```typescript
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Критическая ошибка приложения
            </h2>
            <p className="text-gray-600 mb-6">
              Приложение столкнулось с критической ошибкой и не может продолжить работу.
            </p>
            <button
              onClick={reset}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Перезапустить приложение
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

## 🔄 Продвинутые error паттерны

### 1. **Типизированные ошибки**

```typescript
// src/types/errors.ts
export class ExchangeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ExchangeError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Проблемы с сетью') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### 2. **Умный error boundary**

```typescript
// app/[locale]/exchange/error.tsx
'use client';

import { ExchangeError, NetworkError, ValidationError } from '../../../src/types/errors';

export default function SmartExchangeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const getErrorContent = () => {
    if (error instanceof NetworkError) {
      return {
        title: 'Проблемы с подключением',
        message: 'Проверьте подключение к интернету и попробуйте снова.',
        action: 'Повторить попытку',
      };
    }

    if (error instanceof ExchangeError) {
      return {
        title: 'Ошибка обмена',
        message: error.message,
        action: 'Попробовать снова',
      };
    }

    if (error instanceof ValidationError) {
      return {
        title: 'Ошибка валидации',
        message: `Проблема с полем: ${error.field}`,
        action: 'Исправить данные',
      };
    }

    return {
      title: 'Неизвестная ошибка',
      message: 'Произошла непредвиденная ошибка.',
      action: 'Попробовать снова',
    };
  };

  const { title, message, action } = getErrorContent();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-xl font-semibold mb-4">{title}</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button onClick={reset}>{action}</Button>
      </div>
    </div>
  );
}
```

### 3. **Error boundary с fallback UI**

```typescript
// src/components/error/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold mb-2">Что-то пошло не так</h2>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-blue-600 hover:underline"
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 🔗 Сочетание Loading и Error states

### 1. **Unified state management**

```typescript
// src/hooks/useExchangeState.ts
'use client';

import { useState } from 'react';

type ExchangeState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: any }
  | { status: 'error'; error: Error };

export function useExchangeState() {
  const [state, setState] = useState<ExchangeState>({ status: 'idle' });

  const setLoading = () => setState({ status: 'loading' });
  const setSuccess = (data: any) => setState({ status: 'success', data });
  const setError = (error: Error) => setState({ status: 'error', error });
  const reset = () => setState({ status: 'idle' });

  return { state, setLoading, setSuccess, setError, reset };
}
```

### 2. **Условный рендеринг состояний**

```typescript
// src/components/exchange/ExchangeContainer.tsx
'use client';

import { useExchangeState } from '../../hooks/useExchangeState';
import { ExchangeFormSkeleton } from '../loading/ExchangeFormSkeleton';
import { ExchangeError } from './ExchangeError';
import { ExchangeForm } from './ExchangeForm';

export function ExchangeContainer() {
  const { state, setLoading, setSuccess, setError, reset } = useExchangeState();

  if (state.status === 'loading') {
    return <ExchangeFormSkeleton />;
  }

  if (state.status === 'error') {
    return <ExchangeError error={state.error} onRetry={reset} />;
  }

  return (
    <ExchangeForm
      onSubmit={async (data) => {
        setLoading();
        try {
          const result = await submitExchange(data);
          setSuccess(result);
        } catch (error) {
          setError(error as Error);
        }
      }}
    />
  );
}
```

## ✅ Проверка знаний

1. **Вопрос**: В каких случаях показывается loading.tsx файл?

   <details>
   <summary>Ответ</summary>

   loading.tsx показывается автоматически при:
   - Навигации на страницу (пока page.tsx загружается)
   - Серверном рендеринге (пока данные загружаются)
   - Не показывается при client-side state изменениях
   </details>

2. **Вопрос**: Какая разница между error.tsx и global-error.tsx?

   <details>
   <summary>Ответ</summary>
   - **error.tsx** - перехватывает ошибки в конкретном route и его потомках
   - **global-error.tsx** - перехватывает ошибки в корневом layout.tsx (критические ошибки)
   </details>

3. **Задача**: Как обработать ошибку в layout.tsx?

   <details>
   <summary>Ответ</summary>

   Ошибки в layout.tsx обрабатываются error.tsx на уровне выше. Например, ошибка в `app/[locale]/layout.tsx` обрабатывается в `app/error.tsx` или `app/global-error.tsx`.
   </details>

## 🚀 Практическое задание

**Задание**: Исследуйте loading и error компоненты:

1. **Найдите все loading файлы**:

   ```bash
   find apps/web/app/ -name "loading.tsx" -exec echo "=== {} ===" \; -exec cat {} \;
   ```

2. **Найдите все error файлы**:

   ```bash
   find apps/web/app/ -name "error.tsx" -exec echo "=== {} ===" \; -exec cat {} \;
   ```

3. **Проверьте Skeleton компоненты**:

   ```bash
   find apps/web/src/ -name "*skeleton*" -o -name "*loading*" | head -5
   ```

4. **Создайте тестовую ошибку**:
   ```typescript
   // Добавьте в любой page.tsx для тестирования
   if (Math.random() > 0.5) {
     throw new Error('Тестовая ошибка');
   }
   ```

## 🎯 Создание собственных компонентов

**Пример**: Создадим универсальный loading компонент:

```typescript
// src/components/loading/UniversalLoading.tsx
import { Skeleton } from '@repo/ui';

interface UniversalLoadingProps {
  type: 'form' | 'list' | 'card' | 'table';
  count?: number;
}

export function UniversalLoading({ type, count = 1 }: UniversalLoadingProps) {
  switch (type) {
    case 'form':
      return (
        <div className="space-y-4 max-w-md">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-full" />
        </div>
      );

    case 'list':
      return (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'card':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      );

    default:
      return <Skeleton className="h-32 w-full" />;
  }
}
```

## 📚 Дополнительные материалы

- [Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Skeleton UI библиотеки](https://ui.shadcn.com/docs/components/skeleton)

---

[← Урок 2.3: Layouts и вложенная структура](./lesson-2.3-layouts-nested-structure.md) | [Урок 2.5: Metadata и SEO оптимизация →](./lesson-2.5-metadata-seo-optimization.md)
