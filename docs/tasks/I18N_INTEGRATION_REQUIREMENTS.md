# 🌍 I18N Integration Requirements для TASKS-PART-5

**Дата создания:** 11 июля 2025  
**Версия:** 1.0  
**Применяется к:** Всем задачам TASKS-PART-5.1 - TASKS-PART-5.4

## 📋 Общие требования

### 🚨 КРИТИЧЕСКИ ВАЖНО

Все задачи Part 5 **ОБЯЗАТЕЛЬНО** включают полную интернационализацию (ru/en) с использованием next-intl согласно официальной документации и DEVELOPER_GUIDE.md.

### 🎯 Универсальные шаги для каждой задачи

1. **useTranslations setup** - добавить соответствующий namespace для компонента
2. **Messages files** - обновить `messages/en.json` и `messages/ru.json` с новыми ключами
3. **setRequestLocale** - добавить в каждый page.tsx для static rendering
4. **Link usage** - использовать ТОЛЬКО из `@/src/i18n/navigation`, НЕ из `next/link`
5. **Number formatting** - использовать `toLocaleString()` для всех чисел
6. **Date formatting** - использовать локализованные форматы дат
7. **Validation messages** - переводы для всех ошибок форм
8. **Testing** - проверка работы на `/en` и `/ru` routes

## 🏗️ Архитектурные требования

### Структура файлов (уже настроена)

```
apps/web/src/
├── i18n/
│   ├── routing.ts              # defineRouting с SUPPORTED_LOCALES
│   ├── navigation.ts           # createNavigation API
│   └── request.ts              # getRequestConfig
├── app/
│   └── [locale]/               # Локализованные routes
│       ├── layout.tsx          # hasLocale + setRequestLocale
│       ├── page.tsx            # setRequestLocale в каждой странице
│       └── [routes]/
├── middleware.ts               # createMiddleware(routing)
└── next.config.js             # withNextIntl('./src/i18n/request.ts')
```

### Паттерны компонентов

#### Server Components:

```typescript
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale); // ОБЯЗАТЕЛЬНО для static rendering

  const t = useTranslations('PageNamespace');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

#### Client Components:

```typescript
'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/src/i18n/navigation'; // ВАЖНО: НЕ next/link

export function MyComponent() {
  const t = useTranslations('ComponentNamespace');

  return (
    <div>
      <h2>{t('title')}</h2>
      <Link href="/exchange">{t('goToExchange')}</Link>
    </div>
  );
}
```

## 📝 Translation Namespaces по задачам

### TASKS-PART-5.1 (Core Pages & Layout)

```json
{
  "Layout": {
    "header": {
      "nav": {
        "home": "Home / Главная",
        "exchange": "Exchange / Обмен",
        "rates": "Rates / Курсы"
      },
      "auth": {
        "login": "Login / Войти",
        "register": "Register / Регистрация"
      }
    },
    "footer": {
      "company": "Company Info",
      "social": "Social Media",
      "legal": "Privacy Policy"
    }
  },
  "HomePage": {
    "hero": {
      "title": "Professional Crypto Exchange",
      "description": "Fast and secure cryptocurrency exchange",
      "cta": "Start Exchange"
    },
    "features": {
      "title": "Our Features",
      "security": { "title": "Security", "description": "Bank-level security" },
      "speed": { "title": "Speed", "description": "Instant transactions" }
    }
  }
}
```

### TASKS-PART-5.2 (Exchange Pages)

```json
{
  "Exchange": {
    "title": "Exchange Calculator",
    "steps": {
      "calculate": "Calculate",
      "details": "Enter Details",
      "confirm": "Confirm"
    },
    "form": {
      "amount": "Amount",
      "currency": "Currency",
      "rate": "Rate"
    }
  }
}
```

### TASKS-PART-5.3 (Contact & Payment)

```json
{
  "Order": {
    "create": {
      "contact": "Contact Information",
      "payment": "Payment Method",
      "confirmation": "Confirmation"
    },
    "validation": {
      "required": "This field is required",
      "email": "Invalid email format",
      "phone": "Invalid phone number"
    }
  }
}
```

### TASKS-PART-5.4 (Order Tracking & Auth)

```json
{
  "Orders": {
    "list": "My Orders",
    "status": {
      "pending": "Pending",
      "processing": "Processing",
      "completed": "Completed"
    },
    "filters": "Filters",
    "search": "Search orders"
  },
  "Auth": {
    "login": {
      "title": "Login",
      "email": "Email",
      "password": "Password",
      "submit": "Sign In"
    },
    "register": {
      "title": "Create Account",
      "confirmPassword": "Confirm Password"
    }
  }
}
```

## 🧪 Критические проверки

### Обязательные тесты для каждой задачи:

1. **Route Accessibility:**
   - [ ] `/en/[page]` returns 200 OK
   - [ ] `/ru/[page]` returns 200 OK
   - [ ] NO 404 errors на локализованных routes

2. **Navigation:**
   - [ ] Language switcher работает корректно
   - [ ] Links между страницами сохраняют локаль
   - [ ] NO redirect loops

3. **Content:**
   - [ ] Правильные переводы отображаются для каждой локали
   - [ ] Numbers отформатированы корректно по локали
   - [ ] Dates отображаются в правильном формате

4. **SEO:**
   - [ ] `lang` атрибут в `<html>` соответствует локали
   - [ ] Meta tags локализованы
   - [ ] hreflang links присутствуют (где применимо)

## 🚨 Частые ошибки и решения

| Ошибка               | Причина                        | Решение                                  |
| -------------------- | ------------------------------ | ---------------------------------------- |
| 404 на /en, /ru      | Неправильная структура файлов  | Проверить `[locale]` директорию          |
| Redirect loops       | Неправильный middleware        | Использовать `createMiddleware(routing)` |
| "Cannot find module" | Неверный путь в next.config.js | Проверить путь к `request.ts`            |
| Missing translations | Нет setRequestLocale           | Добавить в layout и page                 |
| Wrong Link import    | Используется next/link         | Использовать Link из navigation.ts       |

## 📋 Чек-лист завершения I18N для каждой задачи

- [ ] 🌍 **Config Setup**: i18n файлы созданы и настроены
- [ ] 🌍 **Pages Setup**: setRequestLocale добавлен в каждую страницу
- [ ] 🌍 **Components**: useTranslations используется вместо hardcoded текста
- [ ] 🌍 **Navigation**: Link импортируется из navigation.ts
- [ ] 🌍 **Messages**: переводы добавлены в en.json и ru.json
- [ ] 🌍 **Testing**: /en и /ru routes работают корректно
- [ ] 🌍 **Formatting**: числа и даты локализованы
- [ ] 🌍 **Validation**: error messages переведены

## 🔗 Полезные ссылки

- [DEVELOPER_GUIDE.md - I18N Section](../DEVELOPER_GUIDE.md#интернационализация-i18n)
- [I18N_TROUBLESHOOTING.md](../I18N_TROUBLESHOOTING.md)
- [next-intl Official Docs](https://next-intl-docs.vercel.app/)
- [App Router Setup Guide](https://next-intl-docs.vercel.app/docs/getting-started/app-router/with-i18n-routing)

---

**Дата обновления:** 11 июля 2025  
**Статус:** Готов к применению для всех задач Part 5
