# exchange-selectors.ts - Анализ файла

## Краткое назначение

Селекторы для Exchange Store - функции для извлечения и вычисления производных данных из состояния обмена.

## Подробное описание

### Основная функциональность

Файл предоставляет селекторы для Exchange Store:

- Базовые селекторы для direct access к store fields
- Производные селекторы для computed values
- Validation selectors для form state
- Step navigation selectors для workflow

### Ключевые особенности

- **Pure functions**: Все селекторы как pure functions
- **Type safety**: Полное типирование через ExchangeStore
- **Computed values**: Производные данные через composition
- **Memoization-ready**: Functions compatible с reselect libraries

### Архитектурные решения

- Separation между basic и derived selectors
- Single responsibility для каждого selector
- Consistent naming convention с select prefix
- No side effects в selector functions

## Экспортируемые сущности / API

### Базовые селекторы

```typescript
// Direct field access
export const selectFormData = (state: ExchangeStore) => state.formData;
export const selectCalculation = (state: ExchangeStore) => state.calculation;
export const selectCurrentStep = (state: ExchangeStore) => state.currentStep;
export const selectSteps = (state: ExchangeStore) => state.steps;
export const selectCurrentOrder = (state: ExchangeStore) => state.currentOrder;
export const selectAvailableRates = (state: ExchangeStore) => state.availableRates;
```

### Производные селекторы

```typescript
// Form validation
export const selectIsFormValid = (state: ExchangeStore) => boolean;

// Current step information
export const selectCurrentStepData = (state: ExchangeStore) => ExchangeStep | undefined;

// Navigation state
export const selectCanProceedToNextStep = (state: ExchangeStore) => boolean;
```

## Зависимости

### Внутренние зависимости

- `./exchange-store` - ExchangeStore type definition

### Внешние зависимости

- Нет прямых внешних зависимостей

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/index.ts` - public API export через barrel pattern
- Components которые need computed exchange data
- Custom hooks которые compose exchange selectors

### Используется совместно с

- Exchange store для state access
- Reselect library для memoization (potential)

## Возможные улучшения и риски

### Текущие риски

- **No memoization**: Селекторы не memoized, potential performance issues
- **Limited composition**: Basic selectors без complex compositions
- **Array bounds**: selectCurrentStepData может return undefined без проверок

### Рекомендации по улучшению

1. **Add memoization**: Use reselect для expensive computations
2. **Enhanced selectors**: More sophisticated derived data
3. **Bounds checking**: Safe array access для step selectors
4. **Composition helpers**: Higher-order selectors для complex scenarios

## TODO и планы развития

### Краткосрочные задачи

- [ ] Add bounds checking для step selectors
- [ ] Consider memoization для expensive selectors
- [ ] Add more validation selectors

### Долгосрочные задачи

- [ ] Reselect integration для performance
- [ ] Complex computed selectors для business logic
- [ ] Selector composition utilities

## Дополнительные заметки

### Selector patterns

Файл follows standard selector patterns:

- **Basic selectors**: Direct field access
- **Derived selectors**: Computed values from multiple fields
- **Validation selectors**: Boolean checks для state validity

### Form validation logic

`selectIsFormValid` проверяет:

- Required currency selection
- Amount input presence
- Recipient card number
- User email
- Agreement acceptance
- Valid calculation results

### Step management selectors

Step-related selectors:

- `selectCurrentStepData`: Current step configuration
- `selectCanProceedToNextStep`: Navigation permission based на completion

### Performance considerations

Current selectors are simple functions:

- No memoization может cause unnecessary re-renders
- Simple field access is fast
- Derived selectors need evaluation on every call

### Type safety approach

- All selectors typed через ExchangeStore
- Return types inferred from store structure
- No explicit return type annotations (follows TypeScript inference)

### Selector naming conventions

Consistent `select` prefix:

- Clear intention as data extraction
- IDE autocomplete friendly
- Standard в Redux/Zustand ecosystems

### Usage patterns

Селекторы typically used:

```typescript
const formData = useExchangeStore(selectFormData);
const isValid = useExchangeStore(selectIsFormValid);
```

### Extension opportunities

Structure allows для:

- Complex business rule selectors
- Multi-store composition selectors
- Parameterized selectors (higher-order functions)
- Performance-optimized selectors с memoization

### Integration с component layer

Селекторы provide clean interface:

- Components don't access store structure directly
- Easy to change store implementation
- Reusable across different components

### Validation complexity

`selectIsFormValid` довольно complex:

- Multiple field checks
- Nested object access
- Potential для false negatives if calculation pending

Could benefit от breaking into smaller validation selectors.

### Error handling

Селекторы don't handle error states:

- No null checks для store fields
- Assumes store structure is valid
- Could benefit от defensive programming
