# Урок 2.1: Эволюция от Pages Router к App Router

> **🎯 Цель урока**: Понять историческое развитие Next.js и архитектурные изменения в App Router 15.x

## 📖 Введение

Представьте эволюцию дома: сначала была **одна большая комната** (Pages Router), потом появились **отдельные комнаты с общими системами** (App Router). Next.js прошел похожую эволюцию.

В нашем проекте используется **Next.js 15 с App Router** - самая современная архитектура. Понимание эволюции поможет вам оценить преимущества текущего решения.

## 🕰️ История развития Next.js

### Эра 1: Pages Router (2016-2022)

```
pages/                    # Старая файловая структура
├── index.js             # → /
├── about.js             # → /about
├── exchange/
│   ├── index.js         # → /exchange
│   └── [id].js          # → /exchange/123
├── _app.js              # Глобальный layout
├── _document.js         # HTML документ
└── api/                 # API routes
    └── exchange.js      # → /api/exchange
```

#### ❌ Проблемы Pages Router:

1. **Один глобальный layout** - сложно делать разные layouts для разных страниц
2. **Нет вложенности** - каждый route независимый
3. **Смешанная ответственность** - getServerSideProps, getStaticProps в компоненте
4. **Сложные вложенные маршруты** - много вложенных папок для простых URL

### Эра 2: App Router (2023-present)

```
app/                      # Новая файловая структура
├── page.tsx             # → / (только страница)
├── layout.tsx           # Layout для всех потомков
├── loading.tsx          # Loading UI
├── error.tsx            # Error boundary
├── not-found.tsx        # 404 страница
├── exchange/
│   ├── page.tsx         # → /exchange
│   ├── layout.tsx       # Layout только для exchange/*
│   └── [id]/
│       └── page.tsx     # → /exchange/123
└── api/                 # API routes (совместимость)
```

## 🎯 App Router в нашем проекте

### Реальная структура `apps/web/app/`:

```typescript
// apps/web/app/layout.tsx - Корневой layout
import { AppLayout } from '../src/components/app-layout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
```

```typescript
// apps/web/app/[locale]/layout.tsx - Локализованный layout
import { NextIntlClientProvider } from 'next-intl';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

```typescript
// apps/web/app/[locale]/page.tsx - Главная страница
import { HeroSection } from '../../src/components/HeroSection';
import { FeaturesSection } from '../../src/components/FeaturesSection';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <StandardPageLayout maxWidth="7xl" centerContent={false}>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
    </StandardPageLayout>
  );
}
```

## 🔍 Ключевые преимущества App Router

### 1. **Вложенные layouts**

#### Pages Router (старый способ):

```typescript
// pages/_app.js - ЕДИНСТВЕННЫЙ layout для всего сайта
function MyApp({ Component, pageProps }) {
  return (
    <div>
      <Header />        {/* На ВСЕХ страницах */}
      <Component {...pageProps} />
      <Footer />        {/* На ВСЕХ страницах */}
    </div>
  );
}

// Проблема: А что если на странице login не нужен Header?
```

#### App Router (современный способ):

```typescript
// app/layout.tsx - Корневой layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}  {/* Разные layouts для разных routes */}
        </ThemeProvider>
      </body>
    </html>
  );
}

// app/exchange/layout.tsx - Layout только для /exchange/*
export default function ExchangeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ExchangeHeader />    {/* Только на exchange страницах */}
      <ExchangeSidebar />
      <main>{children}</main>
    </div>
  );
}

// app/auth/layout.tsx - Чистый layout для авторизации
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {children}  {/* Без header/footer */}
    </div>
  );
}
```

### 2. **Разделение ответственности**

#### Pages Router (всё в одном компоненте):

```typescript
// pages/exchange/[id].js
function ExchangePage({ order, rates }) {
  // UI компонент + данные в одном месте - сложно тестировать
  return <div>Exchange order {order.id}</div>;
}

// Данные перемешаны с UI
export async function getServerSideProps({ params }) {
  const order = await fetchOrder(params.id);
  const rates = await fetchRates();
  return { props: { order, rates } };
}
```

#### App Router (четкое разделение):

```typescript
// app/exchange/[id]/page.tsx - ТОЛЬКО UI
import { ExchangeContainer } from '../../../src/components/exchange/ExchangeContainer';

export default async function ExchangePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Чистый UI компонент - легко тестировать
  return <ExchangeContainer orderId={id} />;
}

// Данные загружаются ВНУТРИ компонентов через tRPC
function ExchangeContainer({ orderId }: { orderId: string }) {
  const { data: order } = api.exchange.getOrderById.useQuery({ id: orderId });
  const { data: rates } = api.exchange.getCurrentRates.useQuery();

  return <div>Exchange order {order?.id}</div>;
}
```

### 3. **Специализированные файлы**

```
app/exchange/
├── page.tsx        # Основная страница
├── layout.tsx      # Layout для всех exchange/*
├── loading.tsx     # Показывается во время загрузки
├── error.tsx       # Error boundary для обработки ошибок
├── not-found.tsx   # 404 для несуществующих exchange ID
└── [id]/
    ├── page.tsx
    └── loading.tsx # Специфичный loading для страницы заявки
```

#### Пример loading.tsx:

```typescript
// app/exchange/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-muted rounded"></div>
    </div>
  );
}
```

#### Пример error.tsx:

```typescript
// app/exchange/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-semibold mb-4">Что-то пошло не так!</h2>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground px-4 py-2 rounded"
      >
        Попробовать снова
      </button>
    </div>
  );
}
```

## 🌍 Интернационализация в App Router

### Структура с локализацией:

```
app/
├── [locale]/           # Динамический сегмент для языка
│   ├── layout.tsx      # Layout с locale context
│   ├── page.tsx        # Главная страница
│   ├── exchange/
│   │   └── page.tsx    # /en/exchange, /ru/exchange
│   └── not-found-page/
│       └── page.tsx    # Кастомная 404
├── globals.css
├── layout.tsx          # Корневой layout
└── not-found.tsx       # Глобальная 404
```

#### Генерация статических параметров:

```typescript
// app/[locale]/layout.tsx
import { locales } from '../../src/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <NextIntlClientProvider locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}
```

## 🔍 Анализ реального кода

### Сравнение файлов в проекте:

#### 1. Корневой layout (`app/layout.tsx`):

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen font-sans antialiased', fontSans.variable)}>
        <TRPCProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
```

#### 2. Локализованный layout (`app/[locale]/layout.tsx`):

```typescript
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppLayout>{children}</AppLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

#### 3. Страница обмена (`app/[locale]/exchange/page.tsx`):

```typescript
export async function generateMetadata({ searchParams }: ExchangePageProps) {
  const t = await getTranslations('AdvancedExchangeForm');
  const params = await searchParams;

  return {
    title: t('metadata.title', { from: params.from || 'USDT-TRC20' }),
    description: t('metadata.description'),
  };
}

export default async function ExchangePage({ params, searchParams }: ExchangePageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <PageLayout className="exchange-page">
      <ExchangeContainer
        locale={resolvedParams.locale}
        initialParams={resolvedSearchParams}
      />
    </PageLayout>
  );
}
```

## 📊 Сравнение производительности

| Аспект                   | Pages Router                     | App Router                 |
| ------------------------ | -------------------------------- | -------------------------- |
| **Bundle size**          | Больше (все layouts загружаются) | Меньше (code splitting)    |
| **Hydration**            | Полная страница                  | Selective hydration        |
| **Loading UX**           | Белый экран                      | Granular loading states    |
| **Error handling**       | Global error boundary            | Per-route error boundaries |
| **SEO**                  | Хорошее                          | Отличное (streaming SSR)   |
| **Developer Experience** | Средний                          | Отличный                   |

## ✅ Проверка знаний

1. **Вопрос**: В чем основное отличие App Router от Pages Router в плане layouts?

   <details>
   <summary>Ответ</summary>

   App Router поддерживает вложенные layouts - каждая папка может иметь свой layout.tsx, который применяется только к этому route и его потомкам. Pages Router имел только один глобальный \_app.js layout.
   </details>

2. **Задача**: Найдите в проекте примеры специализированных файлов App Router:

   ```bash
   # Найдите loading.tsx файлы
   find apps/web/app/ -name "loading.tsx"

   # Найдите error.tsx файлы
   find apps/web/app/ -name "error.tsx"
   ```

3. **Вопрос**: Зачем нужны отдельные loading.tsx и error.tsx файлы?

   <details>
   <summary>Ответ</summary>

   loading.tsx автоматически показывается во время загрузки данных на сервере. error.tsx создает error boundary для обработки ошибок на конкретном route без краха всего приложения. Это улучшает UX.
   </details>

## 🚀 Практическое задание

**Задание**: Изучите архитектуру App Router в проекте:

1. **Изучите структуру app директории**:

   ```bash
   tree apps/web/app/ -I "node_modules"
   ```

2. **Найдите все layout файлы**:

   ```bash
   find apps/web/app/ -name "layout.tsx" -exec echo "=== {} ===" \; -exec head -10 {} \;
   ```

3. **Изучите как работает локализация**:

   ```bash
   cat apps/web/app/[locale]/layout.tsx
   ```

4. **Сравните с pages структурой** (если есть):
   ```bash
   ls -la apps/web/pages/ 2>/dev/null || echo "Pages Router не используется"
   ```

## 🛠️ Миграционные преимущества

### Почему проект выбрал App Router:

1. **Лучшая производительность** - streaming SSR, selective hydration
2. **Современная архитектура** - подготовка к React 19, Suspense
3. **Улучшенный DX** - специализированные файлы, вложенные layouts
4. **Интернационализация** - встроенная поддержка динамических сегментов
5. **SEO оптимизация** - лучший контроль над metadata и структурой

### Миграционные вызовы:

1. **Learning curve** - новые концепции для разработчиков
2. **Экосистема** - некоторые библиотеки еще не адаптированы
3. **Debugging** - новые инструменты отладки
4. **Server/Client boundaries** - нужно понимать где что выполняется

## 📚 Дополнительные материалы

- [Next.js App Router документация](https://nextjs.org/docs/app)
- [Миграция с Pages Router на App Router](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [App Router vs Pages Router сравнение](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration#migrating-from-pages-to-app)
- [Наша структура приложения](../../apps/web/app/)

---

[← Глава 2](./README.md) | [Урок 2.2: Файловая система маршрутизации →](./lesson-2.2-file-system-routing.md)
