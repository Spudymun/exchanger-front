# Анализ файла: packages/exchange-core/src/types/currency.ts

## 📋 Назначение

Централизованные TypeScript типы для управления криптовалютами, курсами обмена и валютной информацией в системе ExchangeGO.

## 📝 Описание

Comprehensive cryptocurrency types система, включающая:

- **Type-safe currency definitions** - строго типизированные определения криптовалют
- **Constants integration** - глубокая интеграция с @repo/constants CRYPTOCURRENCIES
- **Exchange rate modeling** - модели данных для курсов обмена в реальном времени
- **Currency metadata support** - расширенная информация о валютах (decimals, limits, status)
- **Business logic integration** - готовность к интеграции с calculations и validation systems
- **Multi-currency support** - поддержка BTC, ETH, USDT, LTC валют

Используется во всех exchange operations, rate calculations, и currency validation workflows.

## 🔌 API и интерфейсы

### Core Currency Types:

```typescript
// Строго типизированный union type based на constants
export type CryptoCurrency = (typeof CRYPTOCURRENCIES)[number];
// Резолвится в: 'BTC' | 'ETH' | 'USDT' | 'LTC'

// Расширенная информация о криптовалюте
export interface CurrencyInfo {
  symbol: CryptoCurrency; // Символ валюты (BTC, ETH, USDT, LTC)
  name: string; // Полное имя валюты
  decimals: number; // Количество decimal places
  minAmount: number; // Минимальная сумма для обмена
  maxAmount: number; // Максимальная сумма для обмена
  isActive: boolean; // Статус активности валюты
}

// Exchange rate с commission information
export interface ExchangeRate {
  currency: CryptoCurrency; // Валюта для rate
  usdRate: number; // Курс к USD
  uahRate: number; // Курс к UAH (primary для ExchangeGO)
  commission: number; // Комиссия в процентах
  lastUpdated: Date; // Timestamp последнего обновления
}
```

### Type Usage Patterns:

```typescript
interface TypeUsagePatterns {
  validation: {
    usage: 'validateCurrency(currency: string): ValidationResult';
    pattern: 'CRYPTOCURRENCIES.includes(currency as CryptoCurrency)';
    location: 'business-validators.ts';
  };

  calculations: {
    usage: 'calculateUahAmount(amount: number, currency: CryptoCurrency)';
    pattern: 'getExchangeRate(currency: CryptoCurrency): ExchangeRate';
    location: 'calculations.ts';
  };

  api_integration: {
    usage: 'z.enum(CRYPTOCURRENCIES)'; // tRPC validation
    pattern: 'input validation для API endpoints';
    location: 'routers/exchange.ts, routers/fiat.ts';
  };

  ui_components: {
    usage: 'form state management';
    pattern: 'fromCurrency: CryptoCurrency | null';
    location: 'useExchangeStore, form components';
  };
}
```

### Constants Integration:

```typescript
interface ConstantsIntegration {
  source: '@repo/constants/src/exchange-currencies.ts';

  primary: {
    CRYPTOCURRENCIES: ['BTC', 'ETH', 'USDT', 'LTC'] as const;
    usage: 'CryptoCurrency type definition source';
  };

  supporting_constants: {
    COMMISSION_RATES: 'BTC: 2.5%, ETH: 2.0%, USDT: 1.5%, LTC: 2.0%';
    CURRENCY_DECIMALS: 'BTC: 8, ETH: 18, USDT: 6, LTC: 8';
    MIN_TRANSACTION_AMOUNTS: 'BTC: 0.00001, ETH: 0.001, USDT: 1, LTC: 0.001';
    CURRENCY_FULL_NAMES: 'Bitcoin, Ethereum, Tether USD, Litecoin';
  };
}
```

## 📥 Входящие зависимости

```typescript
import { CRYPTOCURRENCIES } from '@repo/constants';
```

### Dependencies Analysis:

- **@repo/constants/exchange-currencies.ts** - CRYPTOCURRENCIES array как source truth
- **TypeScript const assertions** - `as const` для type literal inference
- **Template literal types** - `(typeof CRYPTOCURRENCIES)[number]` pattern

### Architecture Integration:

- **Constants-first approach** - types derived от centralized constants
- **Single source of truth** - CRYPTOCURRENCIES array maintains consistency
- **Compile-time safety** - TypeScript ensures only valid currencies used

## 📤 Исходящие зависимости

### Direct Type Consumers:

- **packages/exchange-core/src/utils/calculations.ts** - getExchangeRate, calculateUahAmount functions
- **packages/exchange-core/src/utils/business-validators.ts** - validateCurrency, validateCryptoAmount
- **packages/exchange-core/src/utils/crypto.ts** - generateDepositAddress, formatCryptoAmount
- **packages/exchange-core/src/types/order.ts** - Order interface uses CryptoCurrency

### Cross-Package Usage:

- **apps/web/src/server/trpc/routers/** - API input validation с z.enum(CRYPTOCURRENCIES)
- **packages/hooks/src/state/exchange-store.ts** - ExchangeFormData.fromCurrency: CryptoCurrency | null
- **apps/web/src/components/ExchangeRates.tsx** - ExchangeRate interface для UI display
- **packages/exchange-core/src/data/** - mock data generation using CryptoCurrency types

## 🔗 Взаимосвязи с другими компонентами

### Exchange Workflow Integration:

```typescript
interface ExchangeWorkflowIntegration {
  rate_fetching: {
    source: 'exchange.ts tRPC router getRates endpoint';
    type: 'ExchangeRate[] с real-time rates';
    consumer: 'ExchangeRates.tsx component';
    flow: 'getRates → ExchangeRate[] → UI display';
  };

  calculation_pipeline: {
    input: 'CryptoCurrency для rate lookup';
    processing: 'getExchangeRate(currency) → ExchangeRate';
    output: 'calculateUahAmount(amount, currency) → number';
    integration: 'calculations.ts business logic';
  };

  validation_chain: {
    step1: 'validateCurrency(string) → ValidationResult';
    step2: 'validateCryptoAmount(number, CryptoCurrency) → ValidationResult';
    step3: 'isAmountWithinLimits(amount, currency) → {isValid, reason}';
    purpose: 'end-to-end validation before order creation';
  };
}
```

### API Integration Pattern:

```
Frontend Form Input (string)
    ↓ (validation)
tRPC Input Validation (z.enum(CRYPTOCURRENCIES))
    ↓ (type assertion)
Business Logic (CryptoCurrency type)
    ↓ (rate lookup)
Exchange Rate Calculation (ExchangeRate)
    ↓ (commission calculation)
Final Amount Calculation (number)
```

### State Management Flow:

```typescript
interface StateManagementFlow {
  form_state: 'useExchangeStore.formData.fromCurrency: CryptoCurrency | null';
  validation: 'validateCurrency checks против CRYPTOCURRENCIES array';
  calculation: 'getExchangeRate lookups using CryptoCurrency key';
  api_calls: 'tRPC procedures validate input против z.enum(CRYPTOCURRENCIES)';
  persistence: 'Order.currency: CryptoCurrency stored in database';
}
```

## 📊 Типы данных

### Type Structure Analysis:

```typescript
interface TypeStructureAnalysis {
  CryptoCurrency: {
    definition: 'union literal type';
    values: ['BTC', 'ETH', 'USDT', 'LTC'];
    source: '(typeof CRYPTOCURRENCIES)[number]';
    compile_time_safety: 'full TypeScript inference';
    runtime_validation: 'array.includes() checks';
  };

  CurrencyInfo: {
    structure: 'interface with 6 properties';
    symbol: 'CryptoCurrency (required)';
    metadata: 'name, decimals, amounts, status';
    purpose: 'comprehensive currency information';
    usage: 'admin panels, currency listings';
  };

  ExchangeRate: {
    structure: 'interface with 5 properties';
    currency: 'CryptoCurrency identifier';
    rates: 'usdRate, uahRate (numbers)';
    business: 'commission (percentage)';
    temporal: 'lastUpdated (Date)';
    purpose: 'real-time exchange calculations';
  };
}
```

### Business Logic Integration:

```typescript
interface BusinessLogicIntegration {
  rate_calculation: {
    function: 'getExchangeRate(currency: CryptoCurrency): ExchangeRate';
    source_data: 'MOCK_EXCHANGE_RATES[currency]';
    commission: 'COMMISSION_RATES[currency]';
    result: 'ExchangeRate object для calculations';
  };

  amount_validation: {
    function: 'validateCryptoAmount(amount: number, currency: CryptoCurrency)';
    limits: 'MIN_TRANSACTION_AMOUNTS[currency]';
    boundary_checks: 'AMOUNT_LIMITS.MIN_USD, MAX_USD';
    integration: 'isAmountWithinLimits validation';
  };

  currency_metadata: {
    decimals: 'CURRENCY_DECIMALS[currency]';
    symbols: 'CURRENCY_SYMBOLS[currency]';
    names: 'CURRENCY_FULL_NAMES[currency]';
    networks: 'NETWORK_NAMES[currency]';
    purpose: 'UI display и formatting';
  };
}
```

### Data Flow Patterns:

```typescript
interface DataFlowPatterns {
  input_validation: 'string → CryptoCurrency (validated)';
  rate_lookup: 'CryptoCurrency → ExchangeRate (with commission)';
  amount_calculation: '(amount, CryptoCurrency) → UAH amount';
  ui_display: '(ExchangeRate, CryptoCurrency) → formatted strings';
  persistence: 'CryptoCurrency → Order.currency (database)';
}
```

## ⚠️ Потенциальные проблемы и риски

### Проблемы типизации:

- **Runtime/compile-time gap**: CryptoCurrency compile-time type не guaranteed runtime validation
- **Const assertion dependency**: Зависимость от `as const` может быть fragile при refactoring
- **Template literal complexity**: `(typeof CRYPTOCURRENCIES)[number]` может confuse developers
- **Type widening issues**: Возможные проблемы с type inference в complex scenarios

### Проблемы расширяемости:

- **New currency addition**: Добавление new cryptocurrencies требует updates в multiple packages
- **Constants synchronization**: Risk desync между CRYPTOCURRENCIES и supporting constants
- **Breaking changes propagation**: Changes в CRYPTOCURRENCIES propagate через all consuming types
- **Version compatibility**: Different package versions могут have different CRYPTOCURRENCIES

### Проблемы валидации:

- **No runtime validation**: Types не ensure runtime validation of currency strings
- **API boundary validation**: Отсутствие consistent validation across API boundaries
- **User input sanitization**: Нет built-in sanitization для user-provided currency inputs
- **Error handling gaps**: Minimal error handling для invalid currency scenarios

### Проблемы производительности:

- **Rate lookup efficiency**: getExchangeRate может become bottleneck при high frequency calls
- **Memory usage**: ExchangeRate objects могут accumulate memory при frequent updates
- **Calculation overhead**: Multiple currency calculations могут impact performance
- **Constants bundle size**: Large constants objects увеличивают bundle size

## ✅ Тестирование

- **Type tests**: Отсутствуют
- **Validation tests**: Отсутствуют
- **Integration tests**: Отсутствуют

### Рекомендации по тестированию:

- Type-only tests для CryptoCurrency type inference
- Validation tests для currency string → CryptoCurrency conversion
- Integration tests для getExchangeRate consistency
- Mock data tests для ExchangeRate data integrity
- Cross-package compatibility tests

## 🔧 Техническая сложность

**Уровень: Низкий**

### Метрики сложности:

- **Размер**: 18 строк с simple и clear structure
- **Type complexity**: Низкая (union types + basic interfaces)
- **Dependencies**: Минимальные (только constants import)
- **Integration surface**: Высокая (widely used across packages)

### Анализ архитектуры:

- Простая и эффективная type design
- Хорошая separation between types и business logic
- Clean integration с constants package
- Excellent foundation для currency-related features

## 📝 TODO и области для улучшения

### Критические улучшения:

1. **Runtime validation integration**: Integration с runtime validation libraries
2. **Currency metadata validation**: Validation consistency между types и constants
3. **Error handling enhancement**: Better error types для currency validation failures
4. **API boundary validation**: Consistent validation across all API endpoints

### Рекомендуемые улучшения:

1. **Extended currency info**: More comprehensive CurrencyInfo с network data
2. **Rate history types**: Types для historical exchange rate data
3. **Multi-network support**: Better support для multi-network tokens (USDT)
4. **Rate volatility tracking**: Types для rate change tracking и alerts
5. **Currency pair types**: Types для cross-currency pair management

### Долгосрочные задачи:

1. **Dynamic currency support**: Runtime addition of new cryptocurrencies
2. **Advanced rate modeling**: Complex rate models с spread, slippage
3. **Multi-exchange integration**: Types для multiple exchange rate sources
4. **DeFi protocol integration**: Types для DeFi yield opportunities
5. **Stablecoin management**: Enhanced support для multiple stablecoins
6. **Cross-chain bridge support**: Types для cross-chain operations
7. **Regulatory compliance**: Types для regulatory reporting requirements
8. **Advanced analytics**: Types для currency performance analytics
