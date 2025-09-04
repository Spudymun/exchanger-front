# 🌍 I18N Troubleshooting Guide

## Статус документа

- **Создан**: 11 июля 2025
- **Обновлен**: 4 сентября 2025
- **Версия**: 1.1
- **Основан на**: реальном опыте решения проблем с next-intl + Next.js 15
- **Последнее обновление**: Добавлена критическая проблема client-side navigation race condition

## 🚨 Критические проблемы и решения

### Проблема 1: 404 ошибки на /en и /ru

**Симптомы:**

- GET /en → 404
- GET /ru → 404
- Приложение не загружается
- Отображается стандартная 404 страница Next.js вместо локализированной

**Причины:**

1. Неправильная структура файлов (нет `src/i18n/` папки)
2. Отсутствует `generateStaticParams` в layout
3. Неправильный путь в `next.config.js`
4. Не используется `setRequestLocale`
5. Неправильная архитектура 404 страниц (отсутствует глобальный `not-found.tsx` или локализированная страница)

**Решение:**

```typescript
// 1. Создать правильную структуру src/i18n/
// 2. Добавить в layout.tsx:
export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

// 3. Добавить в page.tsx:
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  // ...
}

// 4. Проверить next.config.js:
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// 5. Создать правильную архитектуру 404:
// app/not-found.tsx - глобальная 404 с редиректом
// app/[locale]/not-found-page/page.tsx - локализированная 404
```

### Проблема 2: Redirect loops (307 redirects)

**Симптомы:**

- Бесконечные 307 редиректы
- Приложение не загружается
- Браузер показывает "Too many redirects"

**Причины:**

1. Конфликт между root layout и middleware
2. Неправильная конфигурация middleware
3. Root layout пытается редиректить вручную

**Решение:**

```typescript
// Root layout должен содержать html и body теги (требование Next.js):
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}

// Middleware должен использовать createMiddleware:
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);
```

### Проблема 3: "Cannot find module" ошибки

**Симптомы:**

- Cannot find module '@/i18n/routing'
- Cannot find module './src/i18n/routing'

**Причины:**

1. Неправильные пути импорта
2. Файлы не созданы в правильной директории
3. Нет алиасов в tsconfig.json

**Решение:**

```typescript
// Создать все файлы в src/i18n/:
src / i18n / routing.ts;
src / i18n / navigation.ts;
src / i18n / request.ts;

// Использовать правильные пути:
import { routing } from '../../src/i18n/routing'; // из app/[locale]/layout.tsx
import { routing } from './src/i18n/routing'; // из middleware.ts
```

### Проблема 4: Hydration errors

**Симптомы:**

- Ошибки гидратации в браузере
- Контент не отображается корректно

**Причины:**

1. Неправильное использование NextIntlClientProvider
2. Передача messages в ClientProvider
3. Неправильная конфигурация request.ts

**Решение:**

```typescript
// В layout.tsx НЕ передавать messages:
<NextIntlClientProvider>
  {children}
</NextIntlClientProvider>

// НЕ ТАК:
<NextIntlClientProvider messages={messages}>
  {children}
</NextIntlClientProvider>
```

### Проблема 5: Typescript ошибки

**Симптомы:**

- 'hasLocale' is defined but never used
- Cannot find name 'SUPPORTED_LOCALES'

**Причины:**

1. Неправильные импорты
2. Использование старых констант
3. Lint правила

**Решение:**

```typescript
// Использовать из routing.ts:
import { routing } from './routing';

// Валидация:
if (!hasLocale(routing.locales, locale)) {
  notFound();
}

// generateStaticParams:
export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}
```

### 🚨 Проблема 6: MALFORMED_ARGUMENT - Ошибка интерполяции

**Симптомы:**

- `Error: INVALID_MESSAGE: MALFORMED_ARGUMENT (Password must contain at least {{min}} characters)`
- Сообщения валидации не отображаются корректно
- Параметры в фигурных скобках не заменяются значениями

**Причина:**

**КРИТИЧНО**: В `next-intl` используются **одинарные фигурные скобки** `{parameter}`, а НЕ двойные `{{parameter}}`!

**Неправильно:**

```json
{
  "validation": {
    "password": {
      "minLength": "Password must contain at least {{min}} characters"
    }
  }
}
```

**Правильно:**

```json
{
  "validation": {
    "password": {
      "minLength": "Password must contain at least {min} characters"
    }
  }
}
```

**Решение:**

1. **Исправить все файлы переводов** - заменить `{{parameter}}` на `{parameter}`:

```powershell
# Поиск всех двойных скобок:
Select-String -Pattern "\{\{.*\}\}" -Path "messages/*.json"
```

2. **Правильное использование в коде**:

```typescript
// ✅ Правильно:
t('validation.password.minLength', { min: 8 });
// Результат: "Password must contain at least 8 characters"

// ❌ Неправильно:
t('validation.password.minLength', { min: '8' }); // Может не работать в некоторых случаях
```

3. **Проверить все интерполяции в проекте**:

```typescript
// Типичные случаи для исправления:
{
  "minLength": "Minimum {min} characters",     // ✅ Правильно
  "maxLength": "Maximum {max} characters",     // ✅ Правильно
  "minAmount": "Minimum amount: {min}",        // ✅ Правильно
  "maxAmount": "Maximum amount: {max}"         // ✅ Правильно
}
```

**Документация**: [next-intl Interpolation Guide](https://next-intl-docs.vercel.app/docs/usage/messages#interpolation-of-dynamic-values)

### � Проблема 7: Модульные переводы не загружаются

**Симптомы:**

- Ошибки "Translation key not found" в консоли
- Отображаются placeholder ключи вместо переводов
- Некоторые переводы работают, другие нет
- Ошибки загрузки модулей в Network tab

**Причины:**

1. Неправильная настройка ROUTE_MODULE_MAP в request.ts
2. Модуль не добавлен в MODULE_NAMESPACE_MAP
3. Неправильные условия lazy loading
4. Ошибки в структуре JSON файлов переводов
5. Кеширование устаревших модулей

**Диагностика:**

```powershell
# 1. Проверить структуру модульных файлов:
Test-Path "apps/web/messages/en/home-page.json"
Test-Path "apps/web/messages/en/layout.json"
Test-Path "apps/web/messages/en/advanced-exchange.json"
Test-Path "apps/web/messages/en/server-errors.json"
Test-Path "apps/web/messages/en/notifications.json"
Test-Path "apps/web/messages/en/exchange-trading.json"
Test-Path "apps/web/messages/en/common-ui.json"
Test-Path "apps/web/messages/en/dashboard-nav.json"

# 2. Проверить синтаксис JSON:
Get-Content "apps/web/messages/en/home-page.json" | ConvertFrom-Json
Get-Content "apps/web/messages/ru/home-page.json" | ConvertFrom-Json

# 3. Проверить наличие namespace'ов:
Select-String '"HomePage"' -Path "apps/web/messages/*/home-page.json"
Select-String '"Layout"' -Path "apps/web/messages/*/layout.json"
Select-String '"AdvancedExchangeForm"' -Path "apps/web/messages/*/advanced-exchange.json"
```

**Решение:**

1. **Проверить MODULE_NAMESPACE_MAP в request.ts:**

```typescript
// apps/web/src/i18n/request.ts
const MODULE_NAMESPACE_MAP = {
  'home-page': ['HomePage'],
  layout: ['Layout'],
  'advanced-exchange': ['AdvancedExchangeForm'],
  'server-errors': ['server'],
  notifications: ['notifications'],
  'exchange-trading': ['exchange', 'trading', 'portfolio'],
  'common-ui': ['common', 'theme', 'NotFound', 'Error'],
  'dashboard-nav': ['dashboard', 'navigation'],
} as const;
```

2. **Проверить ROUTE_MODULE_MAP:**

```typescript
const ROUTE_MODULE_MAP: Record<string, RouteModuleConfig> = {
  '/': {
    critical: ['home-page', 'layout'],
    lazy: ['common-ui', 'notifications'],
    description: 'Home page with hero, features, layout',
  },
  '/exchange': {
    critical: ['advanced-exchange', 'layout'],
    lazy: ['notifications'],
    description: 'Exchange page with forms and trading',
  },
  // Добавить недостающие routes
};
```

3. **Проверить структуру JSON файлов:**

```json
// messages/en/home-page.json
{
  "HomePage": {
    "title": "ExchangeGO",
    "description": "Cryptocurrency Exchange"
    // Вся структура должна быть под "HomePage"
  }
}
```

4. **Очистить cache переводов:**

```powershell
# В development mode перезапустить сервер:
taskkill /f /im node.exe
cd apps/web && npm run dev

# В production перезапустить приложение
```

5. **Проверить lazy loading conditions:**

```typescript
// Убедиться что условия не блокируют загрузку нужных модулей
function shouldLoadLazyModule(
  moduleName: string,
  conditions: ReturnType<typeof getLazyConditions>
) {
  switch (moduleName) {
    case 'notifications':
      return conditions.shouldLoadNotifications;
    case 'dashboard-nav':
      return conditions.hasAdminMode;
    case 'server-errors':
      return conditions.hasDebugMode;
    default:
      return true; // Загружать по умолчанию
  }
}
```

### 🚨 Проблема 8: Namespace ошибки в компонентах

**Симптомы:**

- "Namespace not found" ошибки
- useTranslations возвращает undefined
- Переводы не отображаются в компонентах

**Причины:**

1. Неправильный namespace в useTranslations()
2. Модуль с namespace'ом не загружен для текущего route
3. Опечатки в названиях namespace'ов
4. Namespace не соответствует структуре JSON

**Решение:**

```typescript
// ✅ Правильное использование namespace'ов:

// Для главной страницы
const t = useTranslations('HomePage'); // из home-page.json

// Для форм обмена
const t = useTranslations('AdvancedExchangeForm'); // из advanced-exchange.json

// Для навигации и layout
const t = useTranslations('Layout'); // из layout.json

// Для серверных ошибок
const t = useTranslations('server.errors'); // из server-errors.json

// Для общих UI элементов
const t = useTranslations('common'); // из common-ui.json

// ❌ Неправильно - несуществующие namespace'ы:
const t = useTranslations('Form'); // НЕТ такого namespace'а
const t = useTranslations('Exchange'); // НЕТ такого namespace'а
const t = useTranslations('Page'); // НЕТ такого namespace'а
```

### 🚨 Проблема 9: Translation keys отображаются вместо переводов при client-side navigation

**Симптомы:**

- После `router.push('/order/123')` показываются ключи переводов (`OrderStatus.loading` вместо "Загрузка...")
- Проблема возникает только при client-side navigation (router.push)
- Manual refresh или direct page access работает корректно
- Hot reload исправляет проблему
- Проблема специфична для компонентов, которые используют переводы на целевой странице

**Причина:**

**Race condition** между Next.js client-side navigation и next-intl translation loading:

```typescript
// Сценарий race condition:
// 1. Пользователь на /exchange (модули: advanced-exchange, layout)
// 2. ExchangeContainer вызывает router.push('/order/123')
// 3. Next.js немедленно рендерит /order страницу
// 4. OrderStatus компонент вызывает useTranslations('OrderStatus')
// 5. Но модуль order-page с OrderStatus namespace еще не загружен!
// 6. next-intl возвращает ключи вместо переводов
```

**Timeline диаграмма:**

```
T0: /exchange page (modules: advanced-exchange, layout)
T1: router.push('/order/123')
T2: Next.js client-side navigation starts
T3: /order page renders ← ПРОБЛЕМА: рендер ДО загрузки переводов
T4: useTranslations('OrderStatus') → keys (not translations)
T5: order-page module loads ← СЛИШКОМ ПОЗДНО
```

**Решение:**

```typescript
// ✅ РЕШЕНИЕ 1: Preload dependencies в source page
// В apps/web/src/i18n/request.ts
const ROUTE_MODULE_MAP = {
  '/exchange': {
    critical: ['advanced-exchange', 'layout'],
    lazy: ['order-page'], // ← Предзагружаем переводы для order
    description: 'Exchange page with forms and trading',
  },
};

// ✅ РЕШЕНИЕ 2: Navigation prefetching
// В ExchangeContainer перед навигацией
await router.prefetch(`/order/${orderId}`);
router.push(`/order/${orderId}`);

// ✅ РЕШЕНИЕ 3: Loading state в компоненте
// В OrderStatus.tsx
const t = useTranslations('OrderStatus');
if (!t.has('loading')) {
  return <div>Loading translations...</div>;
}
```

**Как предотвратить:**

1. **Анализируйте navigation flow** - какие компоненты используют переводы после навигации
2. **Добавляйте lazy dependencies** - включайте нужные модули в исходную страницу
3. **Тестируйте client-side navigation** - всегда проверяйте `router.push()` переходы
4. **Используйте prefetching** для критических navigation paths

## �🔧 Диагностические команды

### Проверка модульной структуры:

```powershell
# Проверить все модульные файлы переводов:
Get-ChildItem "apps/web/messages/en" -Name
Get-ChildItem "apps/web/messages/ru" -Name

# Проверить соответствие структуры:
$en_files = Get-ChildItem "apps/web/messages/en" -Name
$ru_files = Get-ChildItem "apps/web/messages/ru" -Name
Compare-Object $en_files $ru_files

# Проверить наличие основных namespace'ов:
Select-String '"HomePage"' -Path "apps/web/messages/en/home-page.json"
Select-String '"Layout"' -Path "apps/web/messages/en/layout.json"
Select-String '"AdvancedExchangeForm"' -Path "apps/web/messages/en/advanced-exchange.json"
```

### Проверка конфигурации модульной системы:

```powershell
# Проверить request.ts configuration:
Select-String "MODULE_NAMESPACE_MAP" "apps/web/src/i18n/request.ts"
Select-String "ROUTE_MODULE_MAP" "apps/web/src/i18n/request.ts"

# Проверить импорты модулей:
Select-String "import.*messages.*json" "apps/web/src/i18n/request.ts"
```

### Проверка структуры файлов:

```powershell
# Проверить наличие всех файлов:
Test-Path "src/i18n/routing.ts"
Test-Path "src/i18n/navigation.ts"
Test-Path "src/i18n/request.ts"
Test-Path "middleware.ts"
Test-Path "app/[locale]/layout.tsx"
Test-Path "app/[locale]/page.tsx"
```

### Проверка конфигурации:

```powershell
# Проверить next.config.js:
Select-String "request.ts" next.config.js

# Проверить middleware:
Select-String "createMiddleware" middleware.ts
```

### Проверка переводов:

```powershell
# Проверить модульные файлы переводов:
Test-Path "messages/en/home-page.json"
Test-Path "messages/en/layout.json"
Test-Path "messages/ru/home-page.json"
Test-Path "messages/ru/layout.json"
# И другие модули...
```

## 📋 Чек-лист для устранения неполадок

### При 404 ошибках:

- [ ] Структура `src/i18n/` создана
- [ ] Все три файла существуют (routing.ts, navigation.ts, request.ts)
- [ ] `generateStaticParams` добавлен в layout
- [ ] `setRequestLocale` добавлен в layout и page
- [ ] Правильный путь в next.config.js

### При redirect loops:

- [ ] Root layout содержит html и body теги (требование Next.js)
- [ ] Middleware использует createMiddleware
- [ ] Нет конфликтующих редиректов

### При module errors:

- [ ] Правильные пути импорта
- [ ] Файлы существуют в нужных местах
- [ ] Нет опечаток в путях

### При hydration errors:

- [ ] NextIntlClientProvider без messages prop
- [ ] Правильная конфигурация request.ts
- [ ] suppressHydrationWarning в html теге

### При ошибках интерполяции (MALFORMED_ARGUMENT):

- [ ] Все интерполяции используют одинарные скобки `{parameter}`
- [ ] Нет двойных скобок `{{parameter}}` в файлах переводов
- [ ] Параметры передаются как числа или строки: `{ min: 8 }`
- [ ] Проверены все модульные файлы переводов: messages/en/_, messages/ru/_

### При проблемах с модульными переводами:

- [ ] Все модульные файлы существуют для обеих локалей (en/ru)
- [ ] MODULE_NAMESPACE_MAP содержит все используемые модули
- [ ] ROUTE_MODULE_MAP настроен для всех routes приложения
- [ ] JSON файлы имеют правильную структуру namespace'ов
- [ ] Lazy loading conditions не блокируют нужные модули
- [ ] useTranslations() использует правильные namespace'ы
- [ ] Cache переводов очищен после изменений

## 🎯 Финальная проверка

После исправления всех проблем:

1. **Перезапустить сервер**:

   ```powershell
   taskkill /f /im node.exe
   cd apps/web && npm run dev
   ```

2. **Проверить маршруты**:
   - http://localhost:3000 → должен редиректить на /ru (default locale)
   - http://localhost:3000/en → должен работать (200)
   - http://localhost:3000/ru → должен работать (200)

3. **Проверить в терминале**:
   - Нет 404 ошибок
   - Нет redirect loops
   - Middleware компилируется без ошибок
   - Модули переводов загружаются успешно

4. **Проверить модульные переводы**:
   - Все namespace'ы загружаются корректно
   - Нет ошибок "Translation key not found"
   - Lazy loading работает по условиям
   - Cache переводов функционирует правильно

## 📚 Полезные ресурсы

- **[I18N_ARCHITECTURE_GUIDE.md](../core/I18N_ARCHITECTURE_GUIDE.md)** - Полная архитектура модульной системы переводов
- [next-intl Official Docs](https://next-intl-docs.vercel.app/)
- [App Router Setup Guide](https://next-intl-docs.vercel.app/docs/getting-started/app-router/with-i18n-routing)
- [Static Rendering Guide](https://next-intl-docs.vercel.app/docs/getting-started/app-router/with-i18n-routing#static-rendering)
- [Middleware Configuration](https://next-intl-docs.vercel.app/docs/routing/middleware)

---

**Помните**: Всегда следуйте официальной документации next-intl и модульной архитектуре проекта, а не собственным предположениям!
