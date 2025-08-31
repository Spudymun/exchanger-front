# Урок 2.5: Практика - создание многоязычных маршрутов

> **🎯 Цель урока**: Научиться создавать полноценные многоязычные маршруты с использованием next-intl и App Router

## 📖 Введение

Представьте **международный аэропорт**: все указатели дублируются на нескольких языках, но **структура здания** остается одинаковой. В веб-приложении многоязычные маршруты работают так же - одна архитектура, разный контент.

В этом уроке мы создадим полноценную многоязычную страницу "О компании" с подстраницами, используя реальную архитектуру проекта ExchangeGO.

## 🌍 Архитектура интернационализации в проекте

### Как это работает в ExchangeGO:

```
URL: /en/about → Английская версия
URL: /ru/about → Русская версия
URL: /uk/about → Украинская версия

Файл: app/[locale]/about/page.tsx (один файл для всех языков)
```

### Конфигурация поддерживаемых языков:

```typescript
// packages/constants/src/i18n.ts
export const SUPPORTED_LOCALES = ['en', 'ru', 'uk'] as const;
export const I18N_CONFIG = {
  DEFAULT_LOCALE: 'en' as const,
} as const;
```

```typescript
// apps/web/src/i18n/routing.ts
import { SUPPORTED_LOCALES, I18N_CONFIG } from '@repo/constants';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: I18N_CONFIG.DEFAULT_LOCALE,
});
```

## 🛠️ Структура переводов в проекте

### Модульная архитектура переводов:

```
apps/web/messages/
├── en/                     # Английские переводы
│   ├── home-page.json     # Главная страница
│   ├── layout.json        # Навигация, footer
│   ├── about-page.json    # О компании (создадим)
│   └── ...
├── ru/                     # Русские переводы
│   ├── home-page.json
│   ├── layout.json
│   ├── about-page.json
│   └── ...
└── uk/                     # Украинские переводы
    ├── home-page.json
    ├── layout.json
    ├── about-page.json
    └── ...
```

## 💻 Практическое задание: Создаем страницу "О компании"

### Шаг 1: Создаем файлы переводов

**Английская версия** (`apps/web/messages/en/about-page.json`):

```json
{
  "about": {
    "title": "About ExchangeGO",
    "subtitle": "Your trusted cryptocurrency exchange platform",
    "hero": {
      "heading": "Leading the Future of Digital Currency Exchange",
      "description": "Since 2020, ExchangeGO has been providing secure, fast, and reliable cryptocurrency exchange services to users worldwide."
    },
    "mission": {
      "title": "Our Mission",
      "description": "To democratize access to cryptocurrency trading through innovative technology, transparent practices, and exceptional user experience."
    },
    "stats": {
      "users": "Active Users",
      "volume": "Trading Volume",
      "countries": "Countries Served",
      "uptime": "System Uptime"
    },
    "team": {
      "title": "Our Team",
      "description": "Meet the experts behind ExchangeGO's success",
      "ceo": {
        "name": "Alexander Petrov",
        "position": "CEO & Founder",
        "bio": "15+ years in fintech and blockchain technology"
      },
      "cto": {
        "name": "Maria Kovalenko",
        "position": "CTO",
        "bio": "Expert in distributed systems and cryptocurrency protocols"
      }
    },
    "values": {
      "title": "Our Values",
      "security": {
        "title": "Security First",
        "description": "Your funds and data are protected by industry-leading security measures"
      },
      "transparency": {
        "title": "Full Transparency",
        "description": "Clear fees, real-time rates, and honest communication"
      },
      "innovation": {
        "title": "Continuous Innovation",
        "description": "Always improving our platform with cutting-edge technology"
      }
    },
    "cta": {
      "title": "Ready to Start Trading?",
      "description": "Join thousands of satisfied users on ExchangeGO",
      "button": "Create Account"
    }
  }
}
```

**Русская версия** (`apps/web/messages/ru/about-page.json`):

```json
{
  "about": {
    "title": "О ExchangeGO",
    "subtitle": "Ваша надежная платформа для обмена криптовалют",
    "hero": {
      "heading": "Лидер в сфере обмена цифровых валют",
      "description": "С 2020 года ExchangeGO предоставляет безопасные, быстрые и надежные услуги обмена криптовалют пользователям по всему миру."
    },
    "mission": {
      "title": "Наша Миссия",
      "description": "Демократизировать доступ к торговле криптовалютами через инновационные технологии, прозрачные практики и исключительный пользовательский опыт."
    },
    "stats": {
      "users": "Активных Пользователей",
      "volume": "Объем Торгов",
      "countries": "Стран Обслуживаем",
      "uptime": "Время Работы Системы"
    },
    "team": {
      "title": "Наша Команда",
      "description": "Познакомьтесь с экспертами, стоящими за успехом ExchangeGO",
      "ceo": {
        "name": "Александр Петров",
        "position": "CEO и Основатель",
        "bio": "15+ лет в финтехе и блокчейн технологиях"
      },
      "cto": {
        "name": "Мария Коваленко",
        "position": "CTO",
        "bio": "Эксперт в распределенных системах и протоколах криптовалют"
      }
    },
    "values": {
      "title": "Наши Ценности",
      "security": {
        "title": "Безопасность Прежде Всего",
        "description": "Ваши средства и данные защищены ведущими в отрасли мерами безопасности"
      },
      "transparency": {
        "title": "Полная Прозрачность",
        "description": "Четкие комиссии, курсы в реальном времени и честное общение"
      },
      "innovation": {
        "title": "Постоянные Инновации",
        "description": "Всегда улучшаем нашу платформу с помощью передовых технологий"
      }
    },
    "cta": {
      "title": "Готовы Начать Торговлю?",
      "description": "Присоединяйтесь к тысячам довольных пользователей ExchangeGO",
      "button": "Создать Аккаунт"
    }
  }
}
```

**Украинская версия** (`apps/web/messages/uk/about-page.json`):

```json
{
  "about": {
    "title": "Про ExchangeGO",
    "subtitle": "Ваша надійна платформа для обміну криптовалют",
    "hero": {
      "heading": "Лідер у сфері обміну цифрових валют",
      "description": "З 2020 року ExchangeGO надає безпечні, швидкі та надійні послуги обміну криптовалют користувачам по всьому світу."
    },
    "mission": {
      "title": "Наша Місія",
      "description": "Демократизувати доступ до торгівлі криптовалютами через інноваційні технології, прозорі практики та виняткові користувацькі враження."
    },
    "stats": {
      "users": "Активних Користувачів",
      "volume": "Обсяг Торгів",
      "countries": "Країн Обслуговуємо",
      "uptime": "Час Роботи Системи"
    },
    "team": {
      "title": "Наша Команда",
      "description": "Познайомтеся з експертами, що стоять за успіхом ExchangeGO",
      "ceo": {
        "name": "Олександр Петров",
        "position": "CEO та Засновник",
        "bio": "15+ років у фінтеху та блокчейн технологіях"
      },
      "cto": {
        "name": "Марія Коваленко",
        "position": "CTO",
        "bio": "Експерт у розподілених системах та протоколах криптовалют"
      }
    },
    "values": {
      "title": "Наші Цінності",
      "security": {
        "title": "Безпека Понад Усе",
        "description": "Ваші кошти та дані захищені провідними в галузі заходами безпеки"
      },
      "transparency": {
        "title": "Повна Прозорість",
        "description": "Чіткі комісії, курси в реальному часі та чесне спілкування"
      },
      "innovation": {
        "title": "Постійні Інновації",
        "description": "Завжди покращуємо нашу платформу за допомогою передових технологій"
      }
    },
    "cta": {
      "title": "Готові Почати Торгувати?",
      "description": "Приєднуйтесь до тисяч задоволених користувачів ExchangeGO",
      "button": "Створити Акаунт"
    }
  }
}
```

### Шаг 2: Создаем серверный компонент страницы

```typescript
// app/[locale]/about/page.tsx
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Button } from '@repo/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

// Генерируем метаданные на основе локали
export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;

  // Включаем статический рендеринг для SEO
  setRequestLocale(locale);

  // Получаем переводы на сервере
  const t = await getTranslations('about');

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {t('hero.heading')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('hero.description')}
          </p>
          <Badge variant="secondary" className="text-lg px-6 py-2">
            {t('subtitle')}
          </Badge>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500K+</div>
              <div className="text-gray-600">{t('stats.users')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">$2.5B</div>
              <div className="text-gray-600">{t('stats.volume')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">120+</div>
              <div className="text-gray-600">{t('stats.countries')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">{t('stats.uptime')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {t('mission.title')}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('mission.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('values.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  🔒
                </div>
                <CardTitle>{t('values.security.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('values.security.description')}</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  📊
                </div>
                <CardTitle>{t('values.transparency.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('values.transparency.description')}</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  🚀
                </div>
                <CardTitle>{t('values.innovation.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('values.innovation.description')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('team.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('team.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  AP
                </div>
                <CardTitle>{t('team.ceo.name')}</CardTitle>
                <p className="text-blue-600 font-medium">{t('team.ceo.position')}</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">{t('team.ceo.bio')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  MK
                </div>
                <CardTitle>{t('team.cto.name')}</CardTitle>
                <p className="text-purple-600 font-medium">{t('team.cto.position')}</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">{t('team.cto.bio')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('cta.description')}
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
            {t('cta.button')}
          </Button>
        </div>
      </section>
    </main>
  );
}
```

### Шаг 3: Обновляем locale layout для загрузки новых переводов

```typescript
// app/[locale]/layout.tsx (добавляем about-page.json)
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // Загружаем ВСЕ модули переводов включая about-page
  const [
    homePageMessages,
    layoutMessages,
    advancedExchangeMessages,
    serverErrorsMessages,
    notificationsMessages,
    exchangeTradingMessages,
    commonUiMessages,
    dashboardNavMessages,
    orderPageMessages,
    aboutPageMessages, // ← НОВЫЙ МОДУЛЬ
  ] = await Promise.all([
    import(`../../messages/${locale}/home-page.json`).then(m => m.default),
    import(`../../messages/${locale}/layout.json`).then(m => m.default),
    import(`../../messages/${locale}/advanced-exchange.json`).then(m => m.default),
    import(`../../messages/${locale}/server-errors.json`).then(m => m.default),
    import(`../../messages/${locale}/notifications.json`).then(m => m.default),
    import(`../../messages/${locale}/exchange-trading.json`).then(m => m.default),
    import(`../../messages/${locale}/common-ui.json`).then(m => m.default),
    import(`../../messages/${locale}/dashboard-nav.json`).then(m => m.default),
    import(`../../messages/${locale}/order-page.json`).then(m => m.default),
    import(`../../messages/${locale}/about-page.json`).then(m => m.default), // ← НОВЫЙ
  ]);

  const messages = {
    ...homePageMessages,
    ...layoutMessages,
    ...advancedExchangeMessages,
    ...serverErrorsMessages,
    ...notificationsMessages,
    ...exchangeTradingMessages,
    ...commonUiMessages,
    'common-ui': commonUiMessages,
    ...dashboardNavMessages,
    ...orderPageMessages,
    ...aboutPageMessages, // ← ДОБАВЛЯЕМ
  };

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppLayout>{children}</AppLayout>
    </NextIntlClientProvider>
  );
}
```

### Шаг 4: Добавляем навигацию (опционально)

```typescript
// Добавляем ссылку в навигацию (если есть компонент Navigation)
import { Link } from '@repo/ui/components/ui/link';
import { useTranslations } from 'next-intl';

export function Navigation() {
  const t = useTranslations('layout');

  return (
    <nav>
      <Link href="/">{t('nav.home')}</Link>
      <Link href="/exchange">{t('nav.exchange')}</Link>
      <Link href="/about">{t('nav.about')}</Link> {/* ← НОВАЯ ССЫЛКА */}
    </nav>
  );
}
```

## 🧪 Тестирование многоязычной страницы

### Проверяем работу в разных локалях:

1. **Откройте в браузере**:
   - `http://localhost:3000/en/about` - английская версия
   - `http://localhost:3000/ru/about` - русская версия
   - `http://localhost:3000/uk/about` - украинская версия

2. **Проверьте SEO метаданные**:
   - Title должен меняться в зависимости от языка
   - Description адаптируется под локаль

3. **Убедитесь в статическом рендеринге**:
   - Страница рендерится на сервере
   - HTML содержит переведенный контент

## 🔍 Продвинутые техники

### Клиентские компоненты с переводами

```typescript
// src/components/about/InteractiveStats.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function InteractiveStats() {
  const t = useTranslations('about');
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-4 gap-4">
      {(['users', 'volume', 'countries', 'uptime'] as const).map((stat) => (
        <button
          key={stat}
          onClick={() => setSelectedStat(stat)}
          className={`p-4 rounded-lg transition-colors ${
            selectedStat === stat ? 'bg-blue-100' : 'bg-gray-50'
          }`}
        >
          <div className="text-2xl font-bold mb-2">
            {/* Статические значения или из API */}
            {stat === 'users' && '500K+'}
            {stat === 'volume' && '$2.5B'}
            {stat === 'countries' && '120+'}
            {stat === 'uptime' && '99.9%'}
          </div>
          <div className="text-sm text-gray-600">
            {t(`stats.${stat}`)}
          </div>
        </button>
      ))}
    </div>
  );
}
```

### Динамические переводы с параметрами

```json
// messages/en/about-page.json
{
  "team": {
    "memberCount": "We have {count} team members",
    "founded": "Founded in {year}"
  }
}
```

```typescript
// Использование в компоненте
const t = useTranslations('about');

return (
  <p>{t('team.memberCount', { count: teamMembers.length })}</p>
  <p>{t('team.founded', { year: 2020 })}</p>
);
```

## ✅ Проверка знаний

### Вопросы для самоконтроля:

1. **Как работает автоматическое определение языка в URL?**
   - Middleware анализирует pathname и извлекает locale

2. **Где хранятся переводы в проекте?**
   - В папке `apps/web/messages/[locale]/`

3. **Какая разница между `getTranslations` и `useTranslations`?**
   - `getTranslations` для серверных компонентов, `useTranslations` для клиентских

4. **Как обеспечивается SEO для разных языков?**
   - Через `generateMetadata` с локализованными метаданными

5. **Что делает `setRequestLocale(locale)`?**
   - Включает статический рендеринг для конкретной локали

### Практические задания:

1. **Создайте подстраницу `/about/team`** с детальной информацией о команде
2. **Добавьте переключатель языков** в header компонент
3. **Реализуйте хлебные крошки** с локализованными названиями
4. **Создайте форму обратной связи** с валидацией на разных языках

## 📚 Дополнительные материалы

### Официальная документация:

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [App Router with Internationalization](https://next-intl-docs.vercel.app/docs/getting-started/app-router)
- [Static Rendering](https://next-intl-docs.vercel.app/docs/getting-started/app-router/with-i18n-routing#static-rendering)

### Лучшие практики:

- Используйте модульную структуру переводов
- Всегда вызывайте `setRequestLocale` в серверных компонентах
- Загружайте только необходимые модули переводов
- Создавайте типобезопасные ключи переводов
- Тестируйте все локали перед деплоем

---

[← Урок 2.4](./lesson-2.4-metadata-api.md) | [Глава 3 →](../chapter-03-typescript-system/README.md)
