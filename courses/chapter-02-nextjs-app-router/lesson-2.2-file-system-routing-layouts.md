# Урок 2.2: Файловая система маршрутизации и layouts

> **🎯 Цель урока**: Понять как работает файловая система маршрутизации в App Router и создавать вложенные layouts

## 📖 Введение

Представьте **многоэтажное здание**: каждый **этаж** (layout) имеет свою планировку, а **комнаты** (страницы) наследуют эту планировку. В App Router Next.js файловая система определяет не только маршруты, но и то, как компоненты вкладываются друг в друга.

Это **конвенция над конфигурацией** - структура папок автоматически становится URL-структурой приложения.

## 🗂️ Структура файловой системы

### Специальные файлы App Router

В нашем проекте ExchangeGO используются следующие специальные файлы:

```
app/
├── layout.tsx          # Корневой layout (HTML структура)
├── loading.tsx         # Универсальный loading для всех страниц
├── error.tsx           # Общий error boundary
├── not-found.tsx       # 404 страница
├── globals.css         # Глобальные стили
└── [locale]/           # Динамический сегмент для языков
    ├── layout.tsx      # Локализованный layout
    ├── page.tsx        # Главная страница /en или /ru
    ├── loading.tsx     # Loading для локализованных страниц
    ├── error.tsx       # Error boundary для локализации
    ├── exchange/       # Вложенный маршрут
    │   └── page.tsx    # Страница /en/exchange
    ├── order/          # Еще один маршрут
    │   └── page.tsx    # Страница /en/order
    └── not-found-page/ # Кастомная 404 с локализацией
        └── page.tsx
```

## 🎯 Назначение каждого файла

### 📋 `layout.tsx` - Общие обертки

**Корневой layout** (`app/layout.tsx`):

```typescript
// app/layout.tsx - Корневой layout
import type { Metadata } from 'next';
import { cn } from '@repo/ui/lib/utils';
import './globals.css';

export const metadata: Metadata = {
  title: 'ExchangeGO - Криптовалютная биржа',
  description: 'Безопасный обмен криптовалют по лучшим курсам',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased')}>
        {/* 🎯 Тут рендерится locale layout */}
        {children}
      </body>
    </html>
  );
}
```

**Локализованный layout** (`app/[locale]/layout.tsx`):

```typescript
// app/[locale]/layout.tsx - Языковой контекст
import { NextIntlClientProvider } from 'next-intl';
import { AppLayout } from '../../src/components/app-layout';

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Загружаем переводы для текущего языка
  const messages = await loadMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* 🎯 Общий layout приложения */}
      <AppLayout>
        {/* 🎯 Тут рендерятся страницы */}
        {children}
      </AppLayout>
    </NextIntlClientProvider>
  );
}
```

### 📄 `page.tsx` - Контент страниц

```typescript
// app/[locale]/page.tsx - Главная страница
import { setRequestLocale } from 'next-intl/server';
import { HeroSection } from '../../src/components/hero-exchange';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  // Включаем статический рендеринг для SEO
  setRequestLocale(locale);

  return (
    <main>
      <HeroSection />
      {/* Остальной контент главной страницы */}
    </main>
  );
}
```

### ⏳ `loading.tsx` - UI состояния загрузки

```typescript
// app/[locale]/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary">
      </div>
      <span className="ml-2 text-muted-foreground">Загрузка...</span>
    </div>
  );
}
```

### ❌ `error.tsx` - Обработка ошибок

```typescript
// app/[locale]/error.tsx
'use client';

import { Button } from '@repo/ui/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Что-то пошло не так!</h2>
      <p className="text-muted-foreground mb-4">
        {error.message || 'Произошла неожиданная ошибка'}
      </p>
      <Button onClick={reset}>Попробовать снова</Button>
    </div>
  );
}
```

## 🔗 Как работает вложенность layouts

### Концепция "Русская матрешка"

```
Root Layout (HTML, body, глобальные стили)
  └── Locale Layout (языковой контекст, AppLayout)
      └── Page Layout (если есть специфичный layout)
          └── Page Content (конкретная страница)
```

### Пример URL: `/ru/exchange`

1. **Шаг 1**: `app/layout.tsx` - создает `<html>` и `<body>`
2. **Шаг 2**: `app/[locale]/layout.tsx` - оборачивает в языковой контекст
3. **Шаг 3**: `app/[locale]/exchange/page.tsx` - рендерит контент страницы

```typescript
// Финальная структура DOM:
<html>
  <body>
    <NextIntlClientProvider locale="ru">
      <AppLayout>
        <ExchangePage /> {/* Контент из page.tsx */}
      </AppLayout>
    </NextIntlClientProvider>
  </body>
</html>
```

## 🛣️ Маршрутизация по файловой системе

### Динамические сегменты `[параметр]`

```
app/[locale]/           → /en, /ru, /uk
app/[locale]/order/     → /en/order, /ru/order
app/user/[id]/          → /user/123, /user/456
app/blog/[...slug]/     → /blog/2024/article, /blog/news
```

**Пример с параметрами**:

```typescript
// app/user/[id]/page.tsx
interface UserPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;

  return <div>Пользователь ID: {id}</div>;
}
```

### Группировка маршрутов `(группа)`

```
app/
├── (dashboard)/        # Группа - не влияет на URL
│   ├── analytics/
│   └── reports/
├── (marketing)/        # Другая группа
│   ├── about/
│   └── contact/
└── layout.tsx          # Общий layout
```

**Результат**: `/analytics`, `/reports`, `/about`, `/contact` - группы не видны в URL.

## 🔍 Анализ реального кода проекта

### Наша структура маршрутов:

```typescript
// Результирующие маршруты:
'/'           → app/[locale]/page.tsx           (редирект на /en или /ru)
'/en'         → app/[locale]/page.tsx           (главная на английском)
'/ru'         → app/[locale]/page.tsx           (главная на русском)
'/en/exchange'→ app/[locale]/exchange/page.tsx  (обмен валют)
'/ru/exchange'→ app/[locale]/exchange/page.tsx  (обмен валют по-русски)
'/en/order'   → app/[locale]/order/page.tsx    (страница заказа)
```

### Middleware для интернационализации:

```typescript
// apps/web/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Обрабатываем все маршруты кроме API и статики
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

## 💻 Практическое задание

### Задача: Создать новый маршрут `/help`

1. **Создайте структуру файлов**:

```
app/[locale]/help/
├── page.tsx         # Основная страница помощи
├── loading.tsx      # Загрузка для страницы помощи
└── faq/
    └── page.tsx     # Подстраница FAQ
```

2. **Реализуйте основную страницу**:

```typescript
// app/[locale]/help/page.tsx
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';

interface HelpPageProps {
  params: Promise<{ locale: string }>;
}

export default async function HelpPage({ params }: HelpPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Центр помощи</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Часто задаваемые вопросы</h2>
          <p className="text-muted-foreground">
            Ответы на самые популярные вопросы пользователей
          </p>
        </div>
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Контакты поддержки</h2>
          <p className="text-muted-foreground">
            Свяжитесь с нашей службой поддержки
          </p>
        </div>
      </div>
    </div>
  );
}
```

3. **Добавьте loading состояние**:

```typescript
// app/[locale]/help/loading.tsx
export default function HelpLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
```

4. **Создайте подстраницу FAQ**:

```typescript
// app/[locale]/help/faq/page.tsx
import { setRequestLocale } from 'next-intl/server';

interface FAQPageProps {
  params: Promise<{ locale: string }>;
}

export default async function FAQPage({ params }: FAQPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Часто задаваемые вопросы</h1>
      <div className="space-y-4">
        <details className="p-4 border rounded-lg">
          <summary className="font-semibold cursor-pointer">
            Как создать аккаунт?
          </summary>
          <p className="mt-2 text-muted-foreground">
            Для создания аккаунта нажмите кнопку "Регистрация" и заполните форму...
          </p>
        </details>
        <details className="p-4 border rounded-lg">
          <summary className="font-semibold cursor-pointer">
            Какие криптовалюты поддерживаются?
          </summary>
          <p className="mt-2 text-muted-foreground">
            Мы поддерживаем основные криптовалюты: Bitcoin, Ethereum, USDT...
          </p>
        </details>
      </div>
    </div>
  );
}
```

## ✅ Проверка знаний

### Вопросы для самоконтроля:

1. **Какая разница между `layout.tsx` и `page.tsx`?**
   - layout оборачивает несколько страниц, page - конкретный контент

2. **Как создать маршрут `/profile/settings`?**
   - Создать `app/[locale]/profile/settings/page.tsx`

3. **Что происходит если нет `layout.tsx` в папке?**
   - Используется ближайший родительский layout

4. **Зачем нужен `loading.tsx`?**
   - Показывает UI во время загрузки компонентов

5. **Как работают динамические сегменты `[param]`?**
   - Создают маршруты с параметрами, доступными в `params`

### Практические задания:

1. **Создайте маршрут `/about/team`** с собственным loading состоянием
2. **Добавьте error boundary** для страницы `/contact`
3. **Реализуйте группировку** `(public)` для публичных страниц

## 📚 Дополнительные материалы

### Официальная документация:

- [App Router File Conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
- [Layouts and Templates](https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates)
- [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

### Лучшие практики:

- Используйте layouts для общих элементов (навигация, footer)
- loading.tsx для улучшения UX при загрузке
- error.tsx для graceful обработки ошибок
- Группируйте связанные маршруты в папки

---

[← Урок 2.1](./lesson-2.1-pages-to-app-router.md) | [Урок 2.3 →](./lesson-2.3-server-client-components.md)
