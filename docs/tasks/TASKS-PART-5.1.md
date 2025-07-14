# 🚀 ExchangeGO Development Tasks - Part 5.1: Core Pages & Layout

**Дата создания:** 29 июня 2025  
**Статус:** В разработке  
**Покрытие:** Базовые страницы, роутинг, layout system + I18N локализация (ru/en)

---

## 📋 Общая информация

### Связь с предыдущими частями:

- ✅ Использует типы из `@repo/exchange-core` (Part 1)
- ✅ Интегрируется с tRPC API (Part 2)
- ✅ Применяет State Management и хуки (Part 3)
- ✅ Использует UI Components (Part 4)
- 🌍 **NEW**: Интеграция next-intl для полной локализации

### Архитектурный подход:

- **Next.js App Router** с file-based routing + **[locale] structure**
- **next-intl** для локализации (ru/en)
- **Responsive Layout** с mobile-first
- **SEO-optimized** страницы с метаданными + **hreflang**
- **Progressive Enhancement** для лучшего UX

---

## 🎯 PHASE 5.1: CORE PAGES & LAYOUT

### TASK 5.1.1: Создать базовую структуру роутинга и layout

**Время:** 2 часа  
**Приоритет:** 🔴 Критический

#### Описание

Настроить базовую структуру Next.js App Router с общими layout компонентами и навигацией.

#### Технические требования

🌍 **ВАЖНО**: Следует официальной next-intl архитектуре согласно DEVELOPER_GUIDE.md

```
apps/web/src/
├── i18n/
│   ├── routing.ts              # next-intl routing config
│   ├── navigation.ts           # next-intl navigation API
│   └── request.ts              # server-side config
├── app/
│   └── [locale]/               # Локализованные routes
│       ├── layout.tsx          # Layout с NextIntlClientProvider
│       ├── page.tsx            # Home page с setRequestLocale
│       ├── loading.tsx         # Global loading UI
│       ├── error.tsx           # Global error UI
│       ├── not-found.tsx       # 404 page
│       ├── exchange/
│       │   ├── page.tsx        # Exchange page
│       │   └── loading.tsx     # Exchange loading
│       └── [other routes]/
├── middleware.ts               # createMiddleware(routing)
└── next.config.js             # withNextIntl('./src/i18n/request.ts')
messages/
├── en.json                     # English translations
├── ru.json                     # Russian translations
```

│ └── [id]/
│ └── page.tsx # Exchange details
├── auth/
│ ├── login/
│ │ └── page.tsx # Login page
│ └── register/
│ └── page.tsx # Register page
├── profile/
│ ├── page.tsx # Profile page
│ └── orders/
│ └── page.tsx # User orders
└── admin/
└── layout.tsx # Admin layout
└── page.tsx # Admin dashboard

````

#### Реализация

1. **apps/web/src/app/layout.tsx**

```typescript
import './globals.css'; // ✅ Теперь корректно импортирует централизованные CSS переменные
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@repo/ui';
import { Providers } from '~/components/providers/Providers';
import { Toaster } from '~/components/ui/Toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'ExchangeGO - Обмен криптовалют на гривны',
    template: '%s | ExchangeGO',
  },
  description: 'Быстрый и безопасный обмен криптовалют на украинские гривны. Лучшие курсы BTC, ETH, USDT, LTC.',
  keywords: ['обмен криптовалют', 'биткоин', 'ethereum', 'USDT', 'гривны', 'Украина'],
  authors: [{ name: 'ExchangeGO Team' }],
  creator: 'ExchangeGO',
  publisher: 'ExchangeGO',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://exchangego.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'ExchangeGO',
    title: 'ExchangeGO - Обмен криптовалют на гривны',
    description: 'Быстрый и безопасный обмен криптовалют на украинские гривны',
    url: 'https://exchangego.com',
    locale: 'uk_UA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExchangeGO - Обмен криптовалют на гривны',
    description: 'Быстрый и безопасный обмен криптовалют на украинские гривны',
  },
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background font-sans antialiased')}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
````

2. **apps/web/src/components/layout/Header/Header.tsx**

```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, cn } from '@repo/ui';
import { useAuth } from '~/hooks/useAuth';
import { useNotifications } from '~/hooks/useNotifications';
import { Logo } from '~/components/ui/Logo';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Главная', href: '/' },
  { name: 'Обмен', href: '/exchange' },
  { name: 'Курсы', href: '/rates' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Контакты', href: '/contacts' },
];

export function Header() {
  const pathname = usePathname();
  const auth = useAuth();
  const notifications = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const unreadCount = notifications.unreadCount;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Logo className="h-8 w-auto" />
              <span className="text-xl font-bold text-primary">ExchangeGO</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            {auth.user && (
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => notifications.markAllAsRead()}
              >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            )}

            {/* User Menu */}
            {auth.user ? (
              <UserMenu user={auth.user} />
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Вход</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/register">Регистрация</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          navigation={navigation}
          user={auth.user}
        />
      </div>
    </header>
  );
}
```

3. **apps/web/src/components/layout/Footer/Footer.tsx**

```typescript
import React from 'react';
import Link from 'next/link';
import { Logo } from '~/components/ui/Logo';

const footerLinks = {
  company: [
    { name: 'О нас', href: '/about' },
    { name: 'Контакты', href: '/contacts' },
    { name: 'Вакансии', href: '/careers' },
    { name: 'Пресс-центр', href: '/press' },
  ],
  support: [
    { name: 'FAQ', href: '/faq' },
    { name: 'Поддержка', href: '/support' },
    { name: 'Статус системы', href: '/status' },
    { name: 'API документация', href: '/api-docs' },
  ],
  legal: [
    { name: 'Пользовательское соглашение', href: '/terms' },
    { name: 'Политика конфиденциальности', href: '/privacy' },
    { name: 'Политика AML', href: '/aml' },
    { name: 'Политика KYC', href: '/kyc' },
  ],
  social: [
    { name: 'Telegram', href: 'https://t.me/exchangego' },
    { name: 'Twitter', href: 'https://twitter.com/exchangego' },
    { name: 'Facebook', href: 'https://facebook.com/exchangego' },
    { name: 'Instagram', href: 'https://instagram.com/exchangego' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Logo className="h-8 w-auto" />
              <span className="text-xl font-bold">ExchangeGO</span>
            </Link>
            <p className="text-gray-400 text-sm">
              Быстрый и безопасный обмен криптовалют на украинские гривны.
              Лучшие курсы и надежная поддержка.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Компания</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Поддержка</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Правовая информация</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Социальные сети</h3>
            <ul className="space-y-2">
              {footerLinks.social.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 ExchangeGO. Все права защищены.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-gray-400 text-sm">Лицензия НБУ №12345</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-400 text-sm">Система работает</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

4. **apps/web/src/app/page.tsx**

```typescript
import type { Metadata } from 'next';
import { HeroSection } from '~/components/sections/HeroSection';
import { FeaturesSection } from '~/components/sections/FeaturesSection';
import { RatesSection } from '~/components/sections/RatesSection';
import { TestimonialsSection } from '~/components/sections/TestimonialsSection';
import { CTASection } from '~/components/sections/CTASection';
import { Header } from '~/components/layout/Header/Header';
import { Footer } from '~/components/layout/Footer/Footer';

export const metadata: Metadata = {
  title: 'ExchangeGO - Обмен криптовалют на гривны',
  description: 'Быстрый и безопасный обмен криптовалют на украинские гривны. Лучшие курсы BTC, ETH, USDT, LTC.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <HeroSection />
        <FeaturesSection />
        <RatesSection />
        <TestimonialsSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
```

5. **apps/web/src/app/loading.tsx**

```typescript
import { Skeleton } from '@repo/ui';

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="hidden md:flex space-x-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-16" />
              ))}
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
```

6. **apps/web/src/app/error.tsx**

```typescript
'use client';

import { useEffect } from 'react';
import { Button } from '@repo/ui';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Что-то пошло не так
        </h1>
        <p className="text-gray-600 mb-6">
          Произошла ошибка при загрузке страницы. Пожалуйста, попробуйте еще раз.
        </p>
        <div className="space-y-4">
          <Button onClick={reset} className="w-full">
            Попробовать еще раз
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Вернуться на главную
          </Button>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-gray-400">
            ID ошибки: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
```

7. **apps/web/src/app/not-found.tsx**

```typescript
import Link from 'next/link';
import { Button } from '@repo/ui';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Страница не найдена
          </h2>
          <p className="text-gray-600">
            Запрашиваемая страница не существует или была перемещена.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">
              <HomeIcon className="h-4 w-4 mr-2" />
              Вернуться на главную
            </Link>
          </Button>

          <Button variant="outline" onClick={() => window.history.back()} className="w-full">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Вернуться назад
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Если вы считаете, что это ошибка, свяжитесь с нами:</p>
          <Link href="/contacts" className="text-primary hover:underline">
            support@exchangego.com
          </Link>
        </div>
      </div>
    </div>
  );
}
```

#### Юзкейсы и Edge Cases

1. **SEO Optimization**
   - ✅ Structured metadata для всех страниц
   - ✅ OpenGraph и Twitter cards
   - ✅ Canonical URLs
   - ✅ Robots.txt настройки

2. **Performance**
   - ✅ Lazy loading для компонентов
   - ✅ Skeleton states для загрузки
   - ✅ Optimized images и fonts
   - ✅ Bundle optimization

3. **Accessibility**
   - ✅ Semantic HTML structure
   - ✅ Keyboard navigation
   - ✅ Screen reader support
   - ✅ Color contrast compliance

4. **Error Handling**
   - ✅ Global error boundaries
   - ✅ 404 page с navigation
   - ✅ Loading states
   - ✅ Error reporting integration

#### Чек-лист готовности

- [ ] Базовая структура роутинга создана
- [ ] Layout компоненты реализованы
- [ ] Header с навигацией настроен
- [ ] Footer с ссылками добавлен
- [ ] Error handling настроен
- [ ] SEO метаданные добавлены

---

### TASK 5.1.2: Создать Home Page с основными секциями

**Время:** 3 часа  
**Приоритет:** 🔴 Критический

#### Описание

Разработать привлекательную главную страницу с hero секцией, преимуществами, курсами и призывом к действию.

#### Реализация

1. **apps/web/src/components/sections/HeroSection.tsx**

```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@repo/ui';
import { useRates } from '~/hooks/useRates';
import { formatCurrency } from '@repo/utils';
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export function HeroSection() {
  const rates = useRates();

  const features = [
    {
      icon: ShieldCheckIcon,
      title: 'Безопасно',
      description: 'SSL шифрование и холодное хранение',
    },
    {
      icon: ClockIcon,
      title: 'Быстро',
      description: 'Обмен за 5-15 минут',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Выгодно',
      description: 'Лучшие курсы на рынке',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-20 sm:py-24 lg:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Обмен криптовалют
              <span className="text-primary block">на гривны</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl">
              Быстрый, безопасный и выгодный обмен Bitcoin, Ethereum, USDT и Litecoin
              на украинские гривны с лучшими курсами на рынке.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 justify-center lg:justify-start">
                  <feature.icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{feature.title}</div>
                    <div className="text-sm text-gray-600">{feature.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" asChild className="text-lg px-8 py-4">
                <Link href="/exchange">
                  Начать обмен
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button variant="outline" size="lg" asChild className="text-lg px-8 py-4">
                <Link href="/rates">
                  Посмотреть курсы
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column - Rates Card */}
          <div className="lg:justify-self-end">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Текущие курсы
                </h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Онлайн</span>
                </div>
              </div>

              <div className="space-y-4">
                {rates.data?.slice(0, 4).map((rate) => (
                  <div key={rate.currency} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {rate.currency}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{rate.currency}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ₴{formatCurrency(rate.sellRate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rate.changePercent > 0 ? '+' : ''}{rate.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/rates">
                  Все курсы
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

2. **apps/web/src/components/sections/FeaturesSection.tsx**

```typescript
import React from 'react';
import {
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  PhoneIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: ShieldCheckIcon,
    title: 'Максимальная безопасность',
    description: 'SSL шифрование, двухфакторная аутентификация и холодное хранение криптовалют для максимальной защиты ваших средств.',
  },
  {
    icon: ClockIcon,
    title: 'Быстрые транзакции',
    description: 'Автоматизированная система обработки заявок обеспечивает обмен криптовалют за 5-15 минут.',
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Лучшие курсы',
    description: 'Мониторим рынок 24/7 и предлагаем самые выгодные курсы обмена с минимальными комиссиями.',
  },
  {
    icon: UserGroupIcon,
    title: 'Поддержка 24/7',
    description: 'Наша команда экспертов готова помочь вам в любое время дня и ночи через чат, email или телефон.',
  },
  {
    icon: PhoneIcon,
    title: 'Простота использования',
    description: 'Интуитивно понятный интерфейс позволяет совершить обмен всего за несколько кликов.',
  },
  {
    icon: DocumentCheckIcon,
    title: 'Полная легальность',
    description: 'Работаем в соответствии с законодательством Украины и имеем все необходимые лицензии.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Почему выбирают ExchangeGO
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Мы предоставляем надежный и удобный сервис для обмена криптовалют
            с максимальной безопасностью и лучшими условиями на рынке
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="relative p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

3. **apps/web/src/components/sections/RatesSection.tsx**

```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@repo/ui';
import { useRates } from '~/hooks/useRates';
import { formatCurrency } from '@repo/utils';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

export function RatesSection() {
  const rates = useRates();

  if (rates.isLoading) {
    return (
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Актуальные курсы обмена
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Курсы обновляются каждые 30 секунд и соответствуют текущей ситуации на рынке
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {rates.data?.map((rate) => (
            <div key={rate.currency} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {rate.currency}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{rate.currency}</h3>
                    <p className="text-xs text-gray-500">
                      {rate.currency === 'BTC' ? 'Bitcoin' :
                       rate.currency === 'ETH' ? 'Ethereum' :
                       rate.currency === 'USDT' ? 'Tether' : 'Litecoin'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {rate.changePercent > 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${rate.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {rate.changePercent > 0 ? '+' : ''}{rate.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Покупка:</span>
                  <span className="font-semibold text-gray-900">
                    ₴{formatCurrency(rate.buyRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Продажа:</span>
                  <span className="font-semibold text-gray-900">
                    ₴{formatCurrency(rate.sellRate)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Обновлено: {new Date(rate.updatedAt).toLocaleTimeString('uk-UA')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" asChild>
            <Link href="/exchange">
              Начать обмен
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
```

4. **apps/web/src/components/sections/CTASection.tsx**

```typescript
import React from 'react';
import Link from 'next/link';
import { Button } from '@repo/ui';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export function CTASection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-primary to-blue-700">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Готовы начать обмен?
          </h2>
          <p className="text-lg sm:text-xl mb-8 opacity-90">
            Присоединяйтесь к тысячам довольных клиентов, которые уже оценили
            удобство и безопасность нашего сервиса
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-4">
              <Link href="/exchange">
                Обменять криптовалюту
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary">
              <Link href="/auth/register">
                Создать аккаунт
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">50,000+</div>
              <div className="text-sm opacity-80">Успешных обменов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">₴2.5M+</div>
              <div className="text-sm opacity-80">Обменено за месяц</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">99.9%</div>
              <div className="text-sm opacity-80">Время работы</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

#### Юзкейсы и Edge Cases

1. **Hero Section**
   - ✅ Responsive design для всех устройств
   - ✅ Real-time курсы в hero card
   - ✅ Call-to-action оптимизация
   - ✅ Loading states для курсов

2. **Features Section**
   - ✅ Hover effects для интерактивности
   - ✅ Icon integration с Heroicons
   - ✅ Accessibility для screen readers
   - ✅ Grid layout адаптация

3. **Rates Section**
   - ✅ Real-time обновления курсов
   - ✅ Trend indicators (up/down arrows)
   - ✅ Loading skeleton states
   - ✅ Error handling для API

4. **CTA Section**
   - ✅ Gradient background с брендингом
   - ✅ Statistics showcase
   - ✅ Multiple CTA buttons
   - ✅ Mobile optimization

#### Чек-лист готовности

- [ ] Hero section с курсами создана
- [ ] Features section реализована
- [ ] Rates section с API интеграцией
- [ ] CTA section с статистикой
- [ ] Responsive design проверен
- [ ] Loading states добавлены

---

## 📊 Статус Progress Part 5.1

### Завершенные задачи: 0/2

- [ ] TASK 5.1.1: Создать базовую структуру роутинга и layout
- [ ] TASK 5.1.2: Создать Home Page с основными секциями

### Следующие задачи в Part 5.1:

Готов к созданию Part 5.2 (Exchange Pages) после завершения текущих задач.

### Ключевые результаты Part 5.1:

✅ **Next.js App Router** с file-based routing + **[locale] structure**  
✅ **next-intl Integration** с поддержкой ru/en  
✅ **Responsive Layout** с Header/Footer + **Language Switcher**  
✅ **SEO Optimization** с метаданными + **hreflang links**  
✅ **Error Handling** с красивыми страницами  
✅ **Hero Section** с real-time курсами + **локализация**  
✅ **Features Section** с преимуществами + **переводы**  
✅ **Rates Section** с API интеграцией + **currency names**  
✅ **CTA Section** с призывом к действию + **форма подписки**

### 🌍 I18N Requirements для Part 5.1:

#### Обязательные файлы и конфигурации:

- [ ] `src/i18n/routing.ts` - конфигурация маршрутизации
- [ ] `src/i18n/navigation.ts` - API навигации
- [ ] `src/i18n/request.ts` - серверная конфигурация
- [ ] `middleware.ts` - с `createMiddleware(routing)`
- [ ] `next.config.js` - с `withNextIntl('./src/i18n/request.ts')`

#### Обязательные переводы в messages/:

- [ ] **Layout**: header navigation, footer links, language switcher
- [ ] **HomePage**: hero title/description, features, CTA buttons
- [ ] **Common**: loading, error messages, validation messages
- [ ] **Numbers**: локализованное форматирование (toLocaleString)

#### Критические проверки:

- [ ] **NO 404 errors** на `/en` и `/ru` routes
- [ ] **NO redirect loops** при навигации
- [ ] **Корректные переводы** отображаются для каждой локали
- [ ] **Working navigation** между локализованными страницами
- [ ] **Language switcher** работает без перезагрузки страницы

**🚨 ВАЖНО**: Следовать ТОЛЬКО официальной документации next-intl и структуре из DEVELOPER_GUIDE.md

---

**Дата создания:** 29 июня 2025  
**Версия:** 1.0  
**Следующая часть:** TASKS-PART-5.2.md
