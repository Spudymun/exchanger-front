# @repo/constants

Централизованный пакет для всех констант проекта ExchangeGO. Единый источник истины для бизнес-правил, UI конфигурации, API endpoints, валидационных лимитов и ExchangeGO-специфичных констант.

## 📦 Установка

Пакет автоматически доступен в монорепозитории через workspace dependencies:

```json
{
  "dependencies": {
    "@repo/constants": "*"
  }
}
```

## 🚀 Использование

### API Constants

```typescript
import { API_ENDPOINTS, HTTP_STATUS, API_METHODS } from '@repo/constants';

// API endpoints
const response = await fetch(API_ENDPOINTS.EXCHANGES);

// HTTP status codes
if (response.status === HTTP_STATUS.OK) {
  // Success handling
}
```

### ExchangeGO Business Logic

```typescript
import {
  ORDER_STATUSES,
  ORDER_STATUS_CONFIG,
  CRYPTOCURRENCIES,
  COMMISSION_RATES,
} from '@repo/constants';

// Order status checks
if (order.status === ORDER_STATUSES.PENDING) {
  // Handle pending order
}

// Status configuration with metadata
const config = ORDER_STATUS_CONFIG[order.status];
// { label: 'Ожидание оплаты', color: 'warning', icon: 'clock', description: '...' }

// Supported cryptocurrencies
const supportedCrypto = CRYPTOCURRENCIES; // ['BTC', 'ETH', 'USDT', 'LTC']

// Commission rates
const btcCommission = COMMISSION_RATES.BTC; // 2.5%
```

### UI Configuration

```typescript
import {
  UI_NUMERIC_CONSTANTS,
  UI_DEBOUNCE_CONSTANTS,
  THEME_MODES,
  BUTTON_VARIANTS,
  Z_INDEX_LAYERS,
} from '@repo/constants';

// Pagination
const pageSize = UI_NUMERIC_CONSTANTS.DEFAULT_PAGE_SIZE; // 10

// Debounce delays
const debounceDelay = UI_DEBOUNCE_CONSTANTS.EXCHANGE_CALCULATION_DELAY; // 300ms

// Theme modes
const theme = THEME_MODES.DARK;

// Z-index layers
const modalZIndex = Z_INDEX_LAYERS.MODAL; // 50
```

### Banking & Fiat Currencies

```typescript
import {
  FIAT_CURRENCIES,
  BANKS_BY_CURRENCY,
  getBanksForCurrency,
  FIAT_CURRENCY_SYMBOLS,
} from '@repo/constants';

// Supported fiat currencies
const fiats = FIAT_CURRENCIES; // ['UAH', 'USD', 'EUR']

// Get banks for specific currency
const uahBanks = getBanksForCurrency('UAH');
// [{ id: 'privatbank', name: 'ПриватБанк', ... }, ...]

// Currency symbols
const uahSymbol = FIAT_CURRENCY_SYMBOLS.UAH; // '₴'
```

### Validation Limits

```typescript
import { VALIDATION_LIMITS, VALIDATION_BOUNDS } from '@repo/constants';

// Email validation
const emailSchema = z.string().max(VALIDATION_LIMITS.EMAIL_MAX_LENGTH); // 255

// Order amount limits
const minAmount = VALIDATION_BOUNDS.MIN_ORDER_AMOUNT; // 0.01
const maxAmount = VALIDATION_BOUNDS.MAX_ORDER_AMOUNT; // 1000000
```

### Time & Precision Constants

```typescript
import { TIME_CONSTANTS, DECIMAL_PRECISION, UI_REFRESH_INTERVALS } from '@repo/constants';

// Time calculations
const msInSecond = TIME_CONSTANTS.MILLISECONDS_IN_SECOND; // 1000

// Decimal precision
const cryptoDecimals = DECIMAL_PRECISION.CRYPTO_DECIMAL_PLACES; // 8
const uahDecimals = DECIMAL_PRECISION.UAH_DECIMAL_PLACES; // 2

// UI refresh intervals
const orderRefresh = UI_REFRESH_INTERVALS.ORDER_STATUS_REFRESH; // 30000ms
```

## 📚 Доступные константы

### API (`api.ts`)

- `API_ENDPOINTS` - Все API endpoints для ExchangeGO
- `HTTP_STATUS` - HTTP статус коды
- `API_METHODS` - HTTP методы (GET, POST, PUT, DELETE)
- `CONTENT_TYPES` - Content-Type заголовки

### Business Logic (`business.ts`)

- `USER_ROLES` - Роли пользователей (ADMIN, OPERATOR, SUPPORT, USER)
- `TRANSACTION_TYPES` - Типы транзакций (BUY, SELL, EXCHANGE, etc.)
- `CURRENCY_TYPES` - Типы валют (FIAT, CRYPTO, STABLE)
- `KYC_LEVELS` - Уровни верификации
- `NOTIFICATION_TYPES` - Типы уведомлений

### ExchangeGO Specific (`exchange.ts`, `exchange-currencies.ts`, `order-statuses.ts`)

- `ORDER_STATUSES` - Статусы заказов (PENDING, PAID, PROCESSING, COMPLETED, etc.)
- `ORDER_STATUS_CONFIG` - UI конфигурация статусов с метаданными
- `CRYPTOCURRENCIES` - Поддерживаемые криптовалюты ['BTC', 'ETH', 'USDT', 'LTC']
- `COMMISSION_RATES` - Комиссии по валютам
- `CURRENCY_NAMES` - Отображаемые имена валют
- `MOCK_EXCHANGE_RATES` - Тестовые курсы обмена

### Banking & Fiat (`banks.ts`, `fiat-currencies.ts`)

- `FIAT_CURRENCIES` - Поддерживаемые фиатные валюты ['UAH', 'USD', 'EUR']
- `BANKS_BY_CURRENCY` - Банки для каждой валюты
- `getBanksForCurrency()` - Функция получения банков по валюте
- `FIAT_CURRENCY_SYMBOLS` - Символы валют (₴, $, €)

### UI Configuration (`ui.ts`)

- `UI_NUMERIC_CONSTANTS` - Численные константы для UI
- `BUTTON_VARIANTS` - Варианты кнопок (PRIMARY, SECONDARY, DESTRUCTIVE, etc.)
- `ALERT_VARIANTS` - Варианты алертов (SUCCESS, ERROR, WARNING, INFO)
- `THEME_MODES` - Режимы темы (LIGHT, DARK, SYSTEM)
- `Z_INDEX_LAYERS` - Z-index слои для правильного наложения
- `COLOR_SCALE_KEYS` - Ключи цветовых шкал для design-tokens
- `SUPPORTED_LOCALES` - Поддерживаемые локали ['en', 'ru']

### Validation (`validation.ts`)

- `VALIDATION_LIMITS` - Лимиты для валидации (длины, размеры, таймауты)
- `AUTH_CONSTANTS` - Константы аутентификации

### Time & Precision (`time-constants.ts`, `decimal-precision.ts`, `validation-bounds.ts`)

- `TIME_CONSTANTS` - Базовые временные константы
- `UI_DEBOUNCE_CONSTANTS` - Задержки для debounce в UI
- `UI_REFRESH_INTERVALS` - Интервалы обновления UI
- `DECIMAL_PRECISION` - Точность десятичных дробей для валют
- `VALIDATION_BOUNDS` - Граничные значения для валидации

### Business Limits (`business-limits.ts`, `percentage-calculations.ts`)

- `BUSINESS_LIMITS` - Бизнес-лимиты и ограничения
- `PERCENTAGE_CALCULATIONS` - Константы для расчета процентов

### Authentication (`auth.ts`)

- `AUTH_CAPTCHA_CONFIG` - Конфигурация CAPTCHA
- `AUTH_FIELD_IDS` - ID полей форм аутентификации

### Contacts & Social (`contacts.ts`)

- `SOCIAL_LINKS` - Ссылки на социальные сети
- `CONTACT_INFO` - Контактная информация
- `COMPANY_INFO` - Информация о компании

### Rate Limiting (`rate-limits.ts`)

- `RATE_LIMITS` - Конфигурация ограничения запросов

### User Management (`user.ts`)

- `APP_SCOPE` - Области приложений (ADMIN_PANEL, WEB_APP)
- `ROLE_TO_APP_MAPPING` - Маппинг ролей к приложениям
- `USER_MESSAGES` - Сообщения пользовательского API

### SEO & Layout (`seo.ts`)

- `LAYOUT_SHARED_CONFIG` - Технические настройки viewport и темы
- `META_DEFAULTS` - Базовые настройки Open Graph и Twitter Card

### Development Tools (`linter-limits.ts`)

- `COMPLEXITY_LIMITS` - Лимиты цикломатической сложности
- `FUNCTION_SIZE_LIMITS` - Лимиты размера функций по типам файлов
- `DEPTH_LIMITS` - Лимиты глубины вложенности кода
- `PARAMETERS_LIMITS` - Лимиты количества параметров функций

### Currency Formats (`currency-formats.ts`)

- `CURRENCY_FORMATS` - Форматы валют (зарезервировано для будущего использования)

## 🎯 Принципы использования

### ✅ Хорошо

```typescript
// Использование констант вместо магических строк
if (user.role === USER_ROLES.ADMIN) {
}

// Конфигурация через lookup tables
const config = ORDER_STATUS_CONFIG[status];

// Семантические константы вместо магических чисел
const debounceDelay = UI_DEBOUNCE_CONSTANTS.EXCHANGE_CALCULATION_DELAY;
const pageSize = UI_NUMERIC_CONSTANTS.DEFAULT_PAGE_SIZE;

// Централизованные валютные данные
const supportedCrypto = CRYPTOCURRENCIES;
const btcCommission = COMMISSION_RATES.BTC;
```

### ❌ Плохо

```typescript
// Магические строки
if (user.role === 'admin') { }

// Хардкод в компонентах
if (status === 'pending') {
  return <span className="text-yellow-500">Ожидает</span>;
}

// Магические числа
setTimeout(callback, 300); // Используйте UI_DEBOUNCE_CONSTANTS.EXCHANGE_CALCULATION_DELAY
const pageSize = 10; // Используйте UI_NUMERIC_CONSTANTS.DEFAULT_PAGE_SIZE
```

## 🔧 Разработка

```bash
# Сборка (TypeScript → JavaScript + типы)
npm run build

# Разработка с watch режимом
npm run dev

# Проверка типов
npm run check-types

# Линтинг
npm run lint
```

### Архитектура сборки

Пакет использует **TypeScript компиляцию** с dual exports:

- **CommonJS**: `dist/index.js` - для Node.js и старых систем
- **ESM**: `dist/index.mjs` - для современных модульных систем
- **TypeScript**: `dist/index.d.ts` - типы для IDE и компилятора

```json
// package.json exports
{
  "main": "./dist/index.js", // CommonJS
  "module": "./dist/index.mjs", // ESM
  "types": "./dist/index.d.ts", // TypeScript
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

## 📝 Добавление новых констант

1. Добавьте константы в соответствующий файл (`api.ts`, `business.ts`, `ui.ts`, `validation.ts`)
2. Экспортируйте типы с помощью `typeof` и `keyof`
3. Обновите экспорт в `index.ts`
4. Пересоберите пакет

```typescript
// Пример добавления новой константы
export const NEW_FEATURE_STATUS = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
} as const;

export type NewFeatureStatus = (typeof NEW_FEATURE_STATUS)[keyof typeof NEW_FEATURE_STATUS];
```

### 1. Выберите правильный файл

- **API константы** → `api.ts`
- **Бизнес-логика** → `business.ts` или `exchange.ts`
- **UI конфигурация** → `ui.ts`
- **Валидация** → `validation.ts` или `validation-bounds.ts`
- **Время/точность** → `time-constants.ts` или `decimal-precision.ts`
- **ExchangeGO специфичные** → `exchange-currencies.ts`, `order-statuses.ts`, etc.

### 2. Добавьте константу с типизацией

```typescript
// Пример: добавление нового статуса
export const NEW_ORDER_STATUSES = {
  ...ORDER_STATUSES,
  REFUNDED: 'refunded',
} as const;

export type NewOrderStatus = (typeof NEW_ORDER_STATUSES)[keyof typeof NEW_ORDER_STATUSES];
```

### 3. Обновите экспорт

```typescript
// В index.ts добавьте экспорт
export * from './new-file'; // если создали новый файл
```

### 4. Пересоберите пакет

```bash
cd packages/constants
npm run build
```

### 5. Используйте в других пакетах

```typescript
import { NEW_ORDER_STATUSES } from '@repo/constants';

if (order.status === NEW_ORDER_STATUSES.REFUNDED) {
  // Логика для возвращенного заказа
}
```

## 🎯 Принципы организации

### Семантическая группировка

- **По назначению**: API, UI, валидация
- **По домену**: ExchangeGO, банки, валюты
- **По типу**: лимиты, статусы, конфигурации

### Устранение магических чисел

```typescript
// ❌ Плохо
if (timeout > 5000) {
}
if (precision === 8) {
}

// ✅ Хорошо
if (timeout > UI_NUMERIC_CONSTANTS.NOTIFICATION_AUTO_REMOVE_TIMEOUT) {
}
if (precision === DECIMAL_PRECISION.CRYPTO_DECIMAL_PLACES) {
}
```

### TypeScript-first подход

- **Строгая типизация** всех констант
- **Literal types** через `as const`
- **Type exports** для использования в других пакетах

## 📊 Статистика использования

Пакет активно используется в проекте:

- **50+ файлов** импортируют константы
- **4 основных пакета** зависят от него: `@repo/ui`, `@repo/hooks`, `@repo/providers`, `@repo/utils`
- **Все приложения** используют константы: `apps/web`, `apps/admin-panel`
- **21 файл** с константами в исходном коде
- **Полная типизация** всех экспортов

## 🔗 Связанная документация

- **[Design Tokens](../design-tokens/README.md)** - интеграция с дизайн-системой
- **[Utils Package](../utils/README.md)** - валидационные схемы и утилиты
- **[DEVELOPER_GUIDE.md](../../docs/DEVELOPER_GUIDE.md)** - общее руководство разработчика
