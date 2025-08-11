# exchange-store.ts - Анализ файла

## Краткое назначение

Главный Zustand store для управления состоянием процесса обмена валют - comprehensive state management с интегрированными actions.

## Подробное описание

### Основная функциональность

Файл предоставляет полноценный exchange store:

- Form data management для обмена валют
- Calculation state с automatic updates
- Multi-step workflow management
- Order tracking и status management
- Rates и fiat currencies management
- Timer integration для time-sensitive operations

### Ключевые особенности

- **Modular actions**: Разделение actions на отдельные factories
- **Timer integration**: Built-in timer state для timeouts
- **Debounced calculations**: Automatic recalculation с debounce
- **Type safety**: Comprehensive TypeScript typing
- **Persistent state**: Store с versioning support

### Архитектурные решения

- Factory pattern для action groups
- Integration с helper utilities
- Extends TimerState для time management
- Centralized configuration через constants
- Separation of concerns через action creators

## Экспортируемые сущности / API

### Основные interfaces

```typescript
// Form data structure
export interface ExchangeFormData {
  fromCurrency: CryptoCurrency | null;
  toCurrency: FiatCurrency | null;
  selectedBank: Bank | null;
  fromAmount: string;
  toAmount: string;
  recipientData: ExchangeRecipientData;
  userEmail: string;
  agreementAccepted: boolean;
}

// Calculation results
export interface ExchangeCalculation {
  fromAmount: number;
  toAmount: number;
  rate: number;
  commission: number;
  commissionAmount: number;
  finalAmount: number;
  isValid: boolean;
  errors: string[];
}

// Workflow steps
export interface ExchangeStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  canSkip: boolean;
}

// Order tracking
export interface ExchangeOrderData {
  id: string;
  status: OrderStatus;
  depositAddress: string;
  qrCode?: string;
  timeLeft?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Store interface

```typescript
export interface ExchangeStore extends TimerState {
  // State
  formData: ExchangeFormData;
  calculation: ExchangeCalculation | null;
  currentStep: number;
  steps: ExchangeStep[];
  isCalculating: boolean;
  isSubmitting: boolean;
  currentOrder: ExchangeOrderData | null;
  availableRates: ExchangeRate[];
  availableFiatCurrencies: FiatCurrency[];
  availableBanks: Bank[];

  // Actions (comprehensive set of methods)
}
```

## Зависимости

### Внутренние зависимости

- `@repo/constants` - OrderStatus, UI_DEBOUNCE_CONSTANTS
- `@repo/exchange-core` - All exchange types
- `@repo/utils` - createStore, createDebounceAction, createTimerActions
- `./exchange-constants` - DEFAULT_FORM_DATA, DEFAULT_STEPS
- `./exchange-fiat-actions` - createFiatActions
- `./exchange-helpers` - calculation и step utilities

### Внешние зависимости

- Zustand (через createStore utility)

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/state/index.ts` - barrel export как useExchangeStoreBase
- `packages/hooks/src/useExchangeStore.ts` - wrapper with enhanced functionality
- Components и business hooks

### Использует

- Constants для initial state
- Helpers для calculations
- Actions для modular functionality

## Возможные улучшения и риски

### Текущие риски

- **Large store**: Comprehensive store может быть too large для some use cases
- **Memory management**: Timer state requires proper cleanup
- **Action complexity**: Multiple action factories increase cognitive load

### Рекомендации по улучшению

1. **Store splitting**: Consider domain-specific sub-stores
2. **Action optimization**: Review action composition patterns
3. **Error handling**: Enhanced error states throughout actions
4. **Performance**: Add selective subscriptions для large state

## TODO и планы развития

### Краткосрочные задачи

- [ ] Add comprehensive error handling
- [ ] Optimize action composition
- [ ] Review timer cleanup mechanisms

### Долгосрочные задачи

- [ ] Consider store splitting по domains
- [ ] Add middleware для logging/debugging
- [ ] Performance optimization для large forms

## Дополнительные заметки

### Store architecture

```typescript
ExchangeStore = {
  // Core state
  form + calculation + steps + order + rates,

  // Composed actions
  ...formActions +
  ...calculationActions +
  ...stepActions +
  ...orderActions +
  ...rateActions +
  ...fiatActions +
  ...resetActions
}
```

### Action factories breakdown

- **createFormActions**: Form data management с auto-calculation
- **createCalculationActions**: Exchange rate calculations
- **createStepActions**: Workflow step navigation
- **createOrderActions**: Order state management
- **createRatesActions**: Exchange rates management
- **createFiatActions**: Fiat currencies и banks (from separate file)
- **createResetActions**: State reset с timer cleanup

### State management patterns

- **Immutable updates**: All actions use spread operators
- **Partial updates**: Efficient state merging
- **Auto-calculation**: Triggered by form changes с debounce
- **Step synchronization**: Step state kept in sync with navigation

### Timer integration

Extends `TimerState` для:

- Payment timeouts
- QR code expiration
- Order status updates
- Cleanup on reset operations

### Debounced operations

Uses `createDebounceAction` для:

- Exchange calculations при form changes
- Rate updates при currency selection
- Bank selection impacts

### Form validation approach

Store doesn't include validation state directly, relies на:

- External selectors для validation
- Calculation validity flags
- Step completion state

### Data flow patterns

1. **Form input** → updateFormData → auto-calculation
2. **Currency selection** → selectFiatCurrency → reset dependent fields
3. **Step navigation** → step actions → update step states
4. **Order creation** → setCurrentOrder → timer start

### Performance considerations

- Debounced calculations prevent excessive updates
- Partial state updates minimize re-renders
- Timer state isolated для targeted subscriptions
- Action composition enables selective usage

### Error handling strategy

- Calculation errors wrapped в structured objects
- Timer cleanup prevents memory leaks
- Reset actions restore clean state
- No global error state (handled per domain)

### Integration patterns

Store designed для:

- Direct usage через selectors
- Wrapper hooks с additional logic
- Component integration через subscriptions
- Business logic composition

### Type safety approach

- Full TypeScript coverage
- Interface segregation для different domains
- Type imports для consistency
- Generic constraints где appropriate
