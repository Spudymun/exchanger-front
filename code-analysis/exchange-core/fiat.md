# Анализ файла: packages/exchange-core/src/types/fiat.ts

## 📋 Назначение

Централизованные TypeScript типы для управления фиатными валютами, банковской системой и межвалютными обменами в платформе ExchangeGO.

## 📝 Описание

Comprehensive fiat currency types система, включающая:

- **Multi-currency support** - поддержка UAH, USD, EUR согласно exchanger_AC.md requirements
- **Banking system integration** - типы для bank management и reserves tracking
- **Exchange rate modeling** - модели cross-fiat exchange rates
- **Constants integration** - глубокая интеграция с @repo/constants fiat definitions
- **Business logic support** - готовность к integration с tRPC fiat router и calculations
- **Reserve management** - типы для bank reserve tracking и validation

Используется в fiat currency selection, bank management, и cross-currency calculations в ExchangeGO ecosystem.

## 🔌 API и интерфейсы

### Core Fiat Types:

```typescript
// Строго типизированный union type based на constants
export type FiatCurrency = (typeof FIAT_CURRENCIES)[number];
// Резолвится в: 'UAH' | 'USD' | 'EUR'

// Расширенная информация о фиатной валюте
export interface FiatCurrencyInfo {
  symbol: FiatCurrency; // Символ валюты (UAH, USD, EUR)
  name: string; // Локализованное имя валюты
  decimals: number; // Количество decimal places (обычно 2)
  minAmount: number; // Минимальная сумма для операций
  maxAmount: number; // Максимальная сумма для операций
  isActive: boolean; // Статус активности валюты
}
```

### Banking System Types:

```typescript
// Банковская сущность для fiat operations
export interface Bank {
  id: string; // Уникальный идентификатор банка
  name: string; // Полное название банка
  shortName: string; // Краткое название для UI
  logoUrl: string; // URL логотипа банка
  isActive: boolean; // Статус активности банка
  priority: number; // Приоритет отображения
}

// Bank reserve tracking для liquidity management
export interface BankReserve {
  bankId: string; // ID банка
  currency: FiatCurrency; // Валюта резерва
  amount: number; // Сумма доступного резерва
  lastUpdated: Date; // Timestamp последнего обновления
}
```

### Exchange Rate Types:

```typescript
// Cross-fiat exchange rates для multi-currency support
export interface FiatExchangeRate {
  fromCurrency: FiatCurrency; // Исходная валюта
  toCurrency: FiatCurrency; // Целевая валюта
  rate: number; // Обменный курс
  lastUpdated: Date; // Timestamp обновления курса
}
```

### Integration Patterns:

```typescript
interface FiatIntegrationPatterns {
  currency_selection: {
    type: 'FiatCurrency used in form state';
    pattern: 'toCurrency: FiatCurrency | null';
    location: 'exchange-store.ts ExchangeFormData';
  };

  bank_management: {
    type: 'Bank interface for banking operations';
    pattern: 'selectedBank: Bank | null';
    integration: 'getBanksForCurrency(currency: FiatCurrency)';
  };

  api_validation: {
    type: 'tRPC endpoint validation';
    pattern: 'z.enum(FIAT_CURRENCIES)';
    usage: 'input validation в fiat router procedures';
  };

  reserve_checking: {
    type: 'BankReserve для liquidity validation';
    pattern: 'getBankReserve(bankId, currency) → amount';
    purpose: 'ensure sufficient bank reserves';
  };
}
```

## 📥 Входящие зависимости

```typescript
import { FIAT_CURRENCIES } from '@repo/constants';
```

### Dependencies Analysis:

- **@repo/constants/src/fiat-currencies.ts** - FIAT_CURRENCIES array как authoritative source
- **Constants integration** - связь с FIAT_CURRENCY_NAMES, FIAT_MIN_AMOUNTS, FIAT_MAX_AMOUNTS
- **TypeScript const assertions** - `as const` обеспечивает literal type inference

### Architecture Integration:

- **Constants-first approach** - типы derived от centralized fiat constants
- **Business requirements alignment** - types align с exchanger_AC.md UAH/USD/EUR support
- **Single source of truth** - FIAT_CURRENCIES maintains consistency across packages

## 📤 Исходящие зависимости

### Direct Type Consumers:

- **packages/hooks/src/state/exchange-store.ts** - ExchangeFormData.toCurrency: FiatCurrency | null
- **packages/hooks/src/state/exchange-fiat-actions.ts** - selectFiatCurrency, updateFiatCurrencies
- **apps/web/src/server/trpc/routers/fiat.ts** - all tRPC procedures use FiatCurrency validation
- **packages/constants/src/banks.ts** - Bank interface export для cross-package consistency

### Cross-Package Usage:

- **apps/web/src/components/exchange-form/ReceivingCard.tsx** - FiatCurrencySelector, BankSelector
- **packages/constants/** - getBanksForCurrency, getBankReserve functions
- **apps/web/src/server/trpc/routers/** - fiat router procedures и validation schemas
- **UI components** - fiat currency display и selection across apps

## 🔗 Взаимосвязи с другими компонентами

### Exchange Workflow Integration:

```typescript
interface ExchangeWorkflowIntegration {
  currency_selection: {
    step: 'user selects fiat currency in ReceivingCard';
    state: 'toCurrency: FiatCurrency | null updated';
    trigger: 'bank list refresh via getBanksForCurrency';
    validation: 'z.enum(FIAT_CURRENCIES) в tRPC';
  };

  bank_selection: {
    dependency: 'selected FiatCurrency drives bank availability';
    function: 'getBanksForCurrency(currency) → Bank[]';
    state: 'selectedBank: Bank | null updated';
    validation: 'bank compatibility с selected currency';
  };

  calculation_pipeline: {
    input: 'crypto amount + fromCurrency + toCurrency + bankId';
    processing: 'calculateFiatExchange tRPC procedure';
    validation: 'bank reserve sufficiency check';
    output: 'final fiat amount с commission calculation';
  };
}
```

### API Layer Integration:

```
Frontend Currency Selection (FiatCurrency)
    ↓ (form state update)
Exchange Store State Management (toCurrency: FiatCurrency | null)
    ↓ (API calls)
tRPC Fiat Router Procedures (z.enum(FIAT_CURRENCIES) validation)
    ↓ (business logic)
Bank Reserve Validation (BankReserve checks)
    ↓ (calculation)
Cross-Currency Exchange Calculation (FiatExchangeRate)
```

### Banking System Integration:

```typescript
interface BankingSystemIntegration {
  bank_discovery: {
    trigger: 'FiatCurrency selection';
    function: 'getBanksForCurrency(currency: FiatCurrency)';
    result: 'filtered Bank[] for selected currency';
    ui_update: 'BankSelector dropdown population';
  };

  reserve_validation: {
    trigger: 'bank selection + amount calculation';
    function: 'getBankReserve(bankId, currency)';
    validation: 'amount <= available reserve';
    user_feedback: 'reserve sufficiency indication';
  };

  exchange_execution: {
    prerequisites: 'valid FiatCurrency + Bank + sufficient reserves';
    processing: 'calculateFiatExchange procedure';
    result: 'FiatExchangeCalculation с validation status';
  };
}
```

## 📊 Типы данных

### Type Structure Analysis:

```typescript
interface TypeStructureAnalysis {
  FiatCurrency: {
    definition: 'union literal type';
    values: ['UAH', 'USD', 'EUR'];
    source: '(typeof FIAT_CURRENCIES)[number]';
    business_alignment: 'exchanger_AC.md requirements';
    runtime_validation: 'z.enum(FIAT_CURRENCIES) checks';
  };

  FiatCurrencyInfo: {
    structure: 'interface with 6 properties';
    symbol: 'FiatCurrency identifier';
    metadata: 'name, decimals, amounts, status';
    usage: 'getSupportedFiatCurrencies API response';
    localization: 'names support multiple languages';
  };

  Bank: {
    structure: 'interface with 6 properties';
    identifier: 'unique string id';
    branding: 'name, shortName, logoUrl';
    management: 'isActive, priority';
    usage: 'bank selection UI и business logic';
  };

  BankReserve: {
    structure: 'interface with 4 properties';
    tracking: 'bankId + currency + amount';
    temporal: 'lastUpdated timestamp';
    purpose: 'liquidity management и validation';
  };

  FiatExchangeRate: {
    structure: 'interface with 4 properties';
    conversion: 'fromCurrency → toCurrency';
    rate: 'numeric exchange rate';
    temporal: 'lastUpdated for rate freshness';
    usage: 'cross-fiat currency calculations';
  };
}
```

### Constants Integration Mapping:

```typescript
interface ConstantsIntegrationMapping {
  FIAT_CURRENCIES: {
    source: '@repo/constants/src/fiat-currencies.ts';
    values: ['UAH', 'USD', 'EUR'];
    type_usage: 'FiatCurrency type definition';
  };

  supporting_constants: {
    FIAT_CURRENCY_NAMES: 'localized display names';
    FIAT_CURRENCY_SYMBOLS: 'currency symbols (₴, $, €)';
    FIAT_MIN_AMOUNTS: 'minimum transaction amounts';
    FIAT_MAX_AMOUNTS: 'maximum transaction amounts';
    FIAT_CURRENCY_DECIMALS: 'decimal precision (всех: 2)';
    MOCK_FIAT_RATES: 'exchange rates relative to UAH';
  };

  banking_constants: {
    BANKS_BY_CURRENCY: 'currency-specific bank configurations';
    MOCK_BANK_RESERVES: 'simulated bank liquidity data';
    getBanksForCurrency: 'currency-filtered bank lookup';
    getBankReserve: 'bank-currency reserve lookup';
  };
}
```

### Business Logic Integration:

```typescript
interface BusinessLogicIntegration {
  tRPC_procedures: {
    getSupportedFiatCurrencies: 'returns FiatCurrencyInfo[]';
    getBanksForFiatCurrency: 'returns Bank[] с reserves';
    getBankInfo: 'returns Bank с detailed reserve info';
    calculateFiatExchange: 'uses all types для calculation';
  };

  validation_layer: {
    currency: 'z.enum(FIAT_CURRENCIES) validation';
    bank_compatibility: 'getBanksForCurrency filtering';
    reserve_sufficiency: 'BankReserve amount checks';
    amount_limits: 'FIAT_MIN_AMOUNTS/FIAT_MAX_AMOUNTS validation';
  };

  state_management: {
    form_state: 'toCurrency: FiatCurrency | null';
    bank_state: 'selectedBank: Bank | null';
    calculation_state: 'includes cross-currency rates';
  };
}
```

## ⚠️ Потенциальные проблемы и риски

### Проблемы типизации:

- **Type/constants synchronization**: Risk desync между types и supporting constants
- **Cross-package type consistency**: Bank interface duplicated в constants package
- **Runtime validation gaps**: Types не guarantee runtime currency validation
- **Template literal complexity**: `(typeof FIAT_CURRENCIES)[number]` может confuse developers

### Проблемы банковской системы:

- **Bank-currency relationship**: Отсутствие explicit bank-currency association types
- **Reserve data staleness**: BankReserve lastUpdated не enforced в business logic
- **Bank priority logic**: Priority field usage не documented
- **Liquidity management**: Нет types для reserve threshold warnings

### Проблемы расширяемости:

- **New currency addition**: Adding currencies требует updates across multiple packages
- **Bank onboarding**: Adding banks требует manual constants updates
- **Regional expansion**: Отсутствие support для regional banking differences
- **Dynamic configuration**: All bank data hardcoded в constants

### Проблемы валидации:

- **Cross-currency validation**: Отсутствие validation для currency pair compatibility
- **Reserve validation timing**: Real-time reserve checks не implemented
- **Amount boundary validation**: Min/max amounts не integrated в types
- **Bank operational status**: isActive field не integrated в business validation

## ✅ Тестирование

- **Type tests**: Отсутствуют
- **Integration tests**: Отсутствуют
- **Bank system tests**: Отсутствуют

### Рекомендации по тестированию:

- Type-only tests для FiatCurrency type inference
- Integration tests для getBanksForCurrency functions
- Reserve validation tests для bank liquidity scenarios
- Cross-currency calculation tests
- tRPC procedure tests с fiat types

## 🔧 Техническая сложность

**Уровень: Низко-средний**

### Метрики сложности:

- **Размер**: 31 строка с comprehensive interface coverage
- **Type complexity**: Средняя (unions + business domain interfaces)
- **Integration surface**: Высокая (widely used across banking workflows)
- **Business logic complexity**: Средняя (bank reserves + cross-currency rates)

### Анализ архитектуры:

- Хорошая separation между currency types и banking types
- Эффективная integration с constants package
- Clean business domain modeling
- Готовность к extension с new currencies/banks

## 📝 TODO и области для улучшения

### Критические улучшения:

1. **Bank-currency relationship types**: Explicit association types между banks и currencies
2. **Reserve monitoring types**: Types для real-time reserve monitoring и alerts
3. **Dynamic bank configuration**: Types для runtime bank configuration updates
4. **Cross-currency validation**: Enhanced validation для currency pair operations

### Рекомендуемые улучшения:

1. **Regional banking support**: Types для regional banking requirements
2. **Bank operational status**: Enhanced bank status management types
3. **Reserve threshold management**: Types для reserve warning systems
4. **Exchange rate history**: Types для historical rate tracking
5. **Bank fee structures**: Types для bank-specific fee modeling

### Долгосрочные задачи:

1. **Multi-region support**: Types для global banking system expansion
2. **Real-time reserve integration**: Integration с live banking APIs
3. **Advanced liquidity management**: Smart reserve allocation types
4. **Regulatory compliance**: Types для banking regulation compliance
5. **Bank partnership tiers**: Types для different bank partnership levels
6. **Cross-border banking**: Types для international wire transfers
7. **Digital banking integration**: Types для fintech и digital bank partnerships
8. **Bank performance analytics**: Types для bank performance tracking
