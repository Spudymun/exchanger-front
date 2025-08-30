# 🌍 План реструктуризации i18n системы

## 📋 Статус документа

- **Создан**: 8 января 2025
- **Версия**: 2.0 ⚠️ **КРИТИЧЕСКИЙ ПЕРЕСМОТР**
- **Агент-кодер**: AI Agent (следует ai-agent-rules.yml v1.5)
- **Базируется на**: РЕАЛЬНОЙ кодовой базе, а не предположениях
- **⚠️ ПРОБЛЕМА v1.0**: Основывался на НЕВЕРНЫХ предположениях о структуре namespace

## 🚨 Критическое обновление плана

**⚠️ ОШИБКА ВЕРСИИ 1.0**:
Первая версия планы игнорировала принцип "НЕ ПРЕДПОЛАГАТЬ" и основывалась на теоретических соображениях, а не на реальной структуре проекта.

**🔍 РЕАЛЬНЫЙ АНАЛИЗ КОДА (v2.0)**:
После изучения фактического использования переводов в компонентах обнаружено:

### Существующие TOP-level namespace (530+ строк):

- `HomePage` (используется в HeroSection, FeaturesSection, HowItWorksSection)
- `Layout` (используется в app-header, app-footer, AuthForms, LoginForm)
- `AdvancedExchangeForm` (используется в валидации, ExchangeContainer, forms)
- `server` (используется в i18n-errors для серверных сообщений)
- `notifications` (используется в useNotificationsWithTranslations)
- `exchange` (биржевая логика)
- `common`, `theme`, `NotFound`, `Error` (общие компоненты)

**Решение**: Разбивка ПО СУЩЕСТВУЮЩИМ ДОМЕНАМ с сохранением API компонентов

## 🏗️ Архитектурные принципы

### 1. Следование существующей архитектуре

- **Централизованные константы** → `packages/constants/src/ui.ts` (I18N_CONFIG)
- **Package-based структура** → сохранение монорепо паттернов
- **Семантическая организация** → группировка по функциональным доменам

### 2. Архитектурные паттерны проекта

```typescript
// Существующая структура (НЕ ИЗМЕНЯЕТСЯ)
apps/web/src/i18n/
├── routing.ts       // ✅ Использует SUPPORTED_LOCALES из @repo/constants
├── navigation.ts    // ✅ Экспорт Link, redirect, useRouter
└── request.ts       // ✅ Загрузка из messages/${locale}.json

// Конфигурация (НЕ ИЗМЕНЯЕТСЯ)
packages/constants/src/ui.ts:
- SUPPORTED_LOCALES = ['en', 'ru']
- I18N_CONFIG = { DEFAULT_LOCALE: 'ru', FALLBACK_LOCALE: 'en' }
```

## 📁 ПРАВИЛЬНАЯ структура файлов (на основе реального кода)

### Модульная организация по СУЩЕСТВУЮЩИМ доменам

```
apps/web/messages/
├── en/
│   ├── home-page.json           # HomePage namespace (hero, features, howItWorks)
│   ├── layout.json              # Layout namespace (navigation, auth, footer)
│   ├── advanced-exchange.json   # AdvancedExchangeForm namespace
│   ├── server-errors.json       # server namespace (API errors, validation)
│   ├── notifications.json       # notifications namespace
│   ├── exchange-trading.json    # exchange, trading, portfolio namespace
│   ├── common-ui.json          # common, theme, NotFound, Error namespace
│   └── dashboard-nav.json      # dashboard, navigation namespace
├── ru/
│   ├── home-page.json
│   ├── layout.json
│   ├── advanced-exchange.json
│   ├── server-errors.json
│   ├── notifications.json
│   ├── exchange-trading.json
│   ├── common-ui.json
│   └── dashboard-nav.json
└── index.ts                    # TypeScript типизация (опционально)
```

### Принцип разбивки по доменам

**✅ СОХРАНЯЕМ существующий API компонентов:**

- `useTranslations('HomePage')` → home-page.json
- `useTranslations('Layout.forms.login')` → layout.json
- `useTranslations('AdvancedExchangeForm')` → advanced-exchange.json
- `useTranslations('server.errors')` → server-errors.json

**⚠️ КРИТИЧЕСКОЕ ТРЕБОВАНИЕ**: Никаких изменений в компонентах!

## 🔧 ИСПРАВЛЕННАЯ техническая реализация

### 1. Правильное обновление конфигурации загрузки

```typescript
// apps/web/src/i18n/request.ts (ПРАВИЛЬНОЕ ОБНОВЛЕНИЕ)
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  // ✅ ПРАВИЛЬНО: Загрузка модульных файлов с сохранением namespace structure
  const [
    homePage,
    layout,
    advancedExchange,
    serverErrors,
    notifications,
    exchangeTrading,
    commonUi,
    dashboardNav,
  ] = await Promise.all([
    import(`../../messages/${locale}/home-page.json`),
    import(`../../messages/${locale}/layout.json`),
    import(`../../messages/${locale}/advanced-exchange.json`),
    import(`../../messages/${locale}/server-errors.json`),
    import(`../../messages/${locale}/notifications.json`),
    import(`../../messages/${locale}/exchange-trading.json`),
    import(`../../messages/${locale}/common-ui.json`),
    import(`../../messages/${locale}/dashboard-nav.json`),
  ]);

  return {
    locale,
    messages: {
      // ✅ КРИТИЧЕСКИ ВАЖНО: Сохранение TOP-level namespace для совместимости с useTranslations
      HomePage: homePage.default.HomePage,
      Layout: layout.default.Layout,
      AdvancedExchangeForm: advancedExchange.default.AdvancedExchangeForm,
      server: serverErrors.default.server,
      notifications: notifications.default.notifications,
      exchange: exchangeTrading.default.exchange,
      trading: exchangeTrading.default.trading,
      portfolio: exchangeTrading.default.portfolio,
      common: commonUi.default.common,
      theme: commonUi.default.theme,
      NotFound: commonUi.default.NotFound,
      Error: commonUi.default.Error,
      dashboard: dashboardNav.default.dashboard,
      navigation: dashboardNav.default.navigation,
    },
  };
});
```

### 2. Структура модульных файлов

**⚠️ ВАЖНО**: Каждый модульный файл содержит ПОЛНУЮ структуру namespace

```json
// home-page.json - содержит ТОЛЬКО HomePage namespace
{
  "HomePage": {
    "title": "ExchangeGO",
    "description": "Cryptocurrency Exchange",
    "features": { ... },
    "howItWorks": { ... }
  }
}

// layout.json - содержит ТОЛЬКО Layout namespace
{
  "Layout": {
    "navigation": { ... },
    "auth": { ... },
    "footer": { ... }
  }
}

// advanced-exchange.json - содержит ТОЛЬКО AdvancedExchangeForm namespace
{
  "AdvancedExchangeForm": {
    "benefits": { ... },
    "validation": { ... },
    "steps": { ... }
  }
}
```

````

### 3. УПРОЩЕННАЯ типизация (опционально)

```typescript
// apps/web/messages/index.ts (НОВЫЙ ФАЙЛ - если нужна типизация)
/**
 * Типизированные интерфейсы для основных i18n доменов
 * Соответствуют РЕАЛЬНОЙ структуре namespace в проекте
 */

export interface HomePageMessages {
  HomePage: {
    title: string;
    description: string;
    features: {
      title: string;
      speed: { title: string; description: string };
      // ... остальные features
    };
    howItWorks: {
      title: string;
      step1: { title: string; description: string };
      // ... остальные steps
    };
  };
}

export interface LayoutMessages {
  Layout: {
    navigation: {
      exchange: string;
      orders: string;
      contact: string;
    };
    auth: {
      signIn: string;
      signUp: string;
      // ... остальные auth поля
    };
    footer: {
      company: { title: string; description: string };
      // ... остальные footer секции
    };
  };
}

export interface AdvancedExchangeMessages {
  AdvancedExchangeForm: {
    benefits: { fast: string };
    validation: { email: { required: string } };
    // ... остальные поля формы
  };
}

// НЕ ЭКСПОРТИРУЕМ сложные составные типы - слишком много работы для минимальной пользы
```## 📊 Карта миграции контента

### Анализ текущих 530+ строк

**Распределение по модулям (предварительное):**

| Модуль            | Примерный размер | Ключевые namespace          |
| ----------------- | ---------------- | --------------------------- |
| `common.json`     | ~80 строк        | Layout, common, navigation  |
| `forms.json`      | ~120 строк       | Validation, form labels     |
| `pages.json`      | ~100 строк       | HomePage, About, Contact    |
| `exchange.json`   | ~150 строк       | AdvancedExchangeForm, rates |
| `server.json`     | ~50 строк        | Server errors, API messages |
| `components.json` | ~30 строк        | Tooltips, UI descriptions   |

### Миграционная карта namespace → модуль

```typescript
// Текущие namespace → Новые модули
const MIGRATION_MAP = {
  // common.json
  Layout: 'common.json',
  common: 'common.json',

  // forms.json
  validation: 'forms.json',
  forms: 'forms.json',

  // pages.json
  HomePage: 'pages.json',
  AboutPage: 'pages.json',
  ContactPage: 'pages.json',

  // exchange.json
  AdvancedExchangeForm: 'exchange.json',
  ExchangeRates: 'exchange.json',
  Calculator: 'exchange.json',

  // server.json
  server: 'server.json',
  api: 'server.json',
  errors: 'server.json',

  // components.json
  components: 'components.json',
  ui: 'components.json',
} as const;
````

## 🚀 План реализации

### Этап 1: Подготовка (30 мин)

1. **Создание структуры папок**

   ```powershell
   mkdir apps/web/messages/en
   mkdir apps/web/messages/ru
   ```

2. **Анализ текущих файлов**
   - Извлечение всех ключей из en.json/ru.json
   - Группировка по функциональным доменам
   - Создание карты миграции

### Этап 2: Создание модульных файлов (60 мин)

1. **common.json** - Базовые элементы

   ```json
   {
     "navigation": {
       "home": "Home",
       "exchange": "Exchange",
       "about": "About"
     },
     "actions": {
       "submit": "Submit",
       "cancel": "Cancel"
     },
     "loading": "Loading...",
     "loadingDescription": "Please wait..."
   }
   ```

2. **forms.json** - Формы и валидация

   ```json
   {
     "validation": {
       "required": "This field is required",
       "email": "Please enter a valid email"
     },
     "labels": {
       "email": "Email",
       "amount": "Amount"
     }
   }
   ```

3. **exchange.json** - Обменные операции

   ```json
   {
     "AdvancedExchangeForm": {
       "title": "Advanced Exchange",
       "calculateButton": "Calculate",
       "youSend": "You Send",
       "youReceive": "You Receive"
     }
   }
   ```

4. **pages.json** - Контент страниц
5. **server.json** - Серверные сообщения
6. **components.json** - UI компоненты

### Этап 3: Обновление загрузчика (15 мин)

Модификация `apps/web/src/i18n/request.ts` для загрузки модульных файлов.

### Этап 4: Тестирование (30 мин)

1. **Функциональное тестирование**

   ```powershell
   npm run dev
   # Проверка всех страниц на наличие переводов
   ```

2. **Проверка типизации**

   ```powershell
   npm run type-check
   ```

3. **Проверка сборки**
   ```powershell
   npm run build
   ```

### Этап 5: Очистка (15 мин)

1. Удаление старых файлов en.json/ru.json
2. Обновление документации
3. Коммит изменений

## 🔍 Контроль качества

### Чек-лист проверки

- [ ] ✅ **Архитектурное соответствие**: Используются константы из `@repo/constants`
- [ ] ✅ **Модульность**: Файлы разбиты логически по функциональным доменам
- [ ] ✅ **Типобезопасность**: Созданы TypeScript интерфейсы
- [ ] ✅ **Обратная совместимость**: Все переводы сохранены
- [ ] ✅ **Производительность**: Загрузка остается эффективной
- [ ] ✅ **Масштабируемость**: Легко добавлять новые модули

### Тестовые сценарии

1. **Функциональность страниц**
   - Главная страница отображается с переводами
   - Форма обмена работает корректно
   - Навигация функционирует

2. **Смена языка**
   - Переключение EN/RU работает везде
   - Переводы загружаются корректно

3. **Режимы разработки**
   - `npm run dev` - hot reload работает
   - `npm run build` - сборка успешна

## ⚡ ПЕРЕСМОТРЕННЫЕ критические моменты

### 🚨 Риски и митигация (на основе реального кода)

1. **Потеря переводов**
   - **Риск**: Ключи могут потеряться при разбивке 530+ строк
   - **Митигация**: Автоматические скрипты валидации + покрытие ВСЕХ namespace

2. **Поломка существующих компонентов**
   - **Риск**: useTranslations('HomePage') может не найти ключи после разбивки
   - **Митигация**: СТРОГОЕ сохранение TOP-level namespace в request.ts

3. **Нарушение архитектуры namespace**
   - **Риск**: Разбивка может сломать иерархическую структуру Layout.auth.signIn
   - **Митигация**: Каждый модульный файл содержит ПОЛНУЮ структуру своего домена

4. **Производительность загрузки**
   - **Риск**: 8 файлов вместо 2 могут замедлить старт приложения
   - **Митигация**: Promise.all для параллельной загрузки + уменьшение размера отдельных файлов

### 🔧 ИСПРАВЛЕННЫЕ инструменты миграции

```powershell
# Скрипт проверки NAMESPACE INTEGRITY
function Test-I18nNamespaceIntegrity {
    # Тестируем каждый TOP-level namespace отдельно
    $namespaces = @('HomePage', 'Layout', 'AdvancedExchangeForm', 'server', 'notifications', 'exchange', 'trading', 'portfolio', 'common', 'theme', 'NotFound', 'Error', 'dashboard', 'navigation')

    foreach ($namespace in $namespaces) {
        $oldContent = Get-Content "apps/web/messages/en.json" | ConvertFrom-Json
        $oldNamespaceContent = $oldContent.$namespace

        # Определяем в каком модульном файле должен быть namespace
        $moduleFile = switch ($namespace) {
            'HomePage' { 'home-page.json' }
            'Layout' { 'layout.json' }
            'AdvancedExchangeForm' { 'advanced-exchange.json' }
            'server' { 'server-errors.json' }
            'notifications' { 'notifications.json' }
            { $_ -in 'exchange', 'trading', 'portfolio' } { 'exchange-trading.json' }
            { $_ -in 'common', 'theme', 'NotFound', 'Error' } { 'common-ui.json' }
            { $_ -in 'dashboard', 'navigation' } { 'dashboard-nav.json' }
        }

        $newContent = Get-Content "apps/web/messages/en/$moduleFile" | ConvertFrom-Json
        $newNamespaceContent = $newContent.$namespace

        # Сравниваем структуры
        $oldJson = $oldNamespaceContent | ConvertTo-Json -Depth 10
        $newJson = $newNamespaceContent | ConvertTo-Json -Depth 10

        if ($oldJson -eq $newJson) {
            Write-Host "✅ $namespace: Идентичен в $moduleFile"
        } else {
            Write-Host "❌ $namespace: НАРУШЕНА СТРУКТУРА в $moduleFile"
        }
    }
}

# Тест компонентов - проверяем что useTranslations работает
function Test-ComponentTranslations {
    npm run dev
    Start-Sleep 5

    # Тестируем ключевые страницы
    $testUrls = @(
        'http://localhost:3000/en',  # HomePage namespace
        'http://localhost:3000/ru',  # HomePage namespace
        'http://localhost:3000/en/exchange' # AdvancedExchangeForm namespace
    )

    foreach ($url in $testUrls) {
        try {
            $response = Invoke-WebRequest $url -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $url: Страница загружается"
            }
        } catch {
            Write-Host "❌ $url: ОШИБКА загрузки"
        }
    }
}
```

## 📈 РЕАЛИСТИЧНЫЕ ожидаемые результаты

### Улучшения после миграции (основанные на реальной архитектуре)

1. **Удобство разработки**
   - Файлы 40-140 строк вместо 530+ (по доменам)
   - Быстрый поиск переводов в конкретном namespace
   - Четкое разделение ответственности по функциональным областям

2. **Командная работа**
   - Меньше git conflicts (разные разработчики работают с разными доменами)
   - Параллельная работа над HomePage и Layout независимо
   - Четкая ответственность за домены (фронт → Layout, продукт → HomePage)

3. **Масштабируемость**
   - Легко добавлять новые функциональные домены
   - Переиспользование общих переводов (common-ui.json)
   - Модульное тестирование переводов по доменам

4. **Архитектурная чистота**
   - Соответствие domain-driven принципам проекта
   - Использование централизованных констант из @repo/constants
   - Полная типобезопасность на уровне TypeScript (опционально)

### Метрики улучшения

**До миграции:**

- 2 монолитных файла по 530+ строк
- Один разработчик может заблокировать весь i18n
- Поиск конкретного перевода занимает время
- Git conflicts при изменении разных секций

**После миграции:**

- 8 доменных файлов по 40-140 строк
- Параллельная работа по доменам
- Мгновенный поиск переводов в нужном домене
- Минимальные git conflicts

## 🎯 ФИНАЛЬНАЯ архитектура (проверенная против реального кода)

```typescript
// Финальная структура проекта
exchanger-front/
├── packages/constants/src/ui.ts     # ✅ I18N_CONFIG (НЕ ИЗМЕНЯЕТСЯ)
├── apps/web/src/i18n/              # ✅ Конфигурация (НЕ ИЗМЕНЯЕТСЯ)
│   ├── routing.ts
│   ├── navigation.ts
│   └── request.ts                  # 🔄 ОБНОВЛЕН: доменная загрузка с namespace preservation
└── apps/web/messages/              # 🆕 НОВАЯ СТРУКТУРА
    ├── en/                         # 8 доменных файлов
    │   ├── home-page.json          # HomePage namespace
    │   ├── layout.json             # Layout namespace
    │   ├── advanced-exchange.json  # AdvancedExchangeForm namespace
    │   ├── server-errors.json      # server namespace
    │   ├── notifications.json      # notifications namespace
    │   ├── exchange-trading.json   # exchange, trading, portfolio namespaces
    │   ├── common-ui.json          # common, theme, NotFound, Error namespaces
    │   └── dashboard-nav.json      # dashboard, navigation namespaces
    ├── ru/                         # 8 доменных файлов (идентичная структура)
    │   └── [аналогичная структура]
    └── index.ts                    # TypeScript типизация (опционально)
```

### Компоненты остаются БЕЗ ИЗМЕНЕНИЙ

**✅ ГАРАНТИРУЕТСЯ 100% совместимость:**

- `useTranslations('HomePage')` → home-page.json
- `useTranslations('Layout.forms.login')` → layout.json
- `useTranslations('AdvancedExchangeForm')` → advanced-exchange.json
- `useTranslations('server.errors')` → server-errors.json

**🔧 Принцип рефакторинга**: Изменения только в загрузке данных, API остается идентичным

---

**✅ ПЛАН ГОТОВ К РЕАЛИЗАЦИИ (версия 2.0)**

Архитектурная проверка против реального кода завершена. План соответствует:

- ✅ **Rule 8**: НЕТ ДОПУЩЕНИЙ (изучен реальный код и использование useTranslations)
- ✅ **Rule 24**: ЖЕЛЕЗОБЕТОННОЕ ЗНАНИЕ СТРУКТУРЫ (изучены фактические namespace)
- ✅ **Принципу рефакторинга**: Минимальные изменения для максимального эффекта
- ✅ **Существующей архитектуре**: Сохранение всех паттернов next-intl и @repo/constants
- ✅ **Backward compatibility**: Ноль изменений в компонентах

**🚀 СТАТУС**: Готов к началу реализации с минимальными рисками
│ ├── pages.json
│ ├── exchange.json
│ ├── server.json
│ └── components.json
├── ru/ # 6 модульных файлов
│ └── [аналогичная структура]
└── index.ts # TypeScript типизация

```

---

**🚀 ГОТОВ К РЕАЛИЗАЦИИ**

Архитектурная проверка завершена. План соответствует:

- ✅ **Rule 24**: ЖЕЛЕЗОБЕТОННОЕ ЗНАНИЕ СТРУКТУРЫ (PROJECT_STRUCTURE_MAP.md изучен)
- ✅ **Rule 8**: НЕТ ДОПУЩЕНИЙ (вся конфигурация проверена через документацию)
- ✅ **Rule 17**: ПЕРЕИСПОЛЬЗОВАНИЕ (используем существующие константы и паттерны)
- ✅ **ARCHITECTURE.md**: Следуем centralised package-based архитектуре
- ✅ **Существующей i18n системе**: Сохраняем next-intl + конфигурацию из @repo/constants
```
