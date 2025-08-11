# exchange-helpers.ts - Анализ файла

## Краткое назначение

Helper functions для Exchange Store - расчеты курсов обмена и управление шагами workflow с использованием централизованных utilities.

## Подробное описание

### Основная функциональность

Файл предоставляет вспомогательные функции для Exchange Store:

- `calculateExchangeRate` - расчет курса обмена с валидацией
- Step navigation helpers (next, previous, clamping)
- Error handling для различных scenarios
- Integration с centralized calculation utilities

### Ключевые особенности

- **Centralized calculations**: Использование utilities от `@repo/exchange-core`
- **Error handling**: Comprehensive error states и validation
- **Step management**: Navigation utilities для multi-step workflow
- **Type safety**: Полное типирование всех functions

### Архитектурные решения

- Pure functions без side effects
- Separation между calculation logic и step management
- Error state propagation через structured objects
- Integration с existing rate calculation system

## Экспортируемые сущности / API

### Основные exports

```typescript
// Расчет курса обмена
export const calculateExchangeRate = (
  formData: ExchangeFormData,
  availableRates: ExchangeRate[]
): ExchangeCalculation | null

// Step navigation helpers
export const getNextStepIndex = (
  currentStep: number,
  totalSteps: number
): number

export const getPrevStepIndex = (currentStep: number): number

export const clampStepIndex = (
  stepIndex: number,
  totalSteps: number
): number
```

### ExchangeCalculation result

```typescript
interface ExchangeCalculation {
  fromAmount: number;
  toAmount: number;
  rate: number;
  commission: number;
  commissionAmount: number;
  finalAmount: number;
  isValid: boolean;
  errors: string[];
}
```

## Зависимости

### Внутренние зависимости

- `@repo/exchange-core` - calculateUahAmount, calculateCommission, ExchangeRate
- `./exchange-store` - ExchangeCalculation, ExchangeFormData types

### Внешние зависимости

- Нет прямых внешних зависимостей

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/state/exchange-store.ts` - основной consumer для calculations

### Использует

- Exchange-core calculation utilities
- Exchange store type definitions

## Возможные улучшения и риски

### Текущие риски

- **Hardcoded error messages**: Не локализованные сообщения об ошибках
- **Limited validation**: Basic validation может быть недостаточной
- **Rate finding logic**: Simple find может не handle edge cases

### Рекомендации по улучшению

1. **Localization**: Move error messages к i18n system
2. **Enhanced validation**: More comprehensive input validation
3. **Better rate matching**: More sophisticated rate selection logic
4. **Error categorization**: Different error types для better handling

## TODO и планы развития

### Краткосрочные задачи

- [ ] Локализация error messages
- [ ] Add comprehensive unit tests
- [ ] Enhanced validation logic

### Долгосрочные задачи

- [ ] Multiple rate sources support
- [ ] Advanced calculation modes
- [ ] Real-time rate updates integration

## Дополнительные заметки

### Calculation flow

`calculateExchangeRate` flow:

1. **Input validation**: Check required fields и amount validity
2. **Rate lookup**: Find rate для selected currency
3. **Calculation**: Use centralized utilities для amount и commission
4. **Result assembly**: Create structured calculation result

### Error handling strategy

Function returns null или structured error states:

- `null`: Insufficient input data
- `isValid: false`: Calculation errors with error messages
- `isValid: true`: Successful calculation

### Step management utilities

Navigation helpers для workflow:

- **getNextStepIndex**: Safe forward navigation
- **getPrevStepIndex**: Safe backward navigation
- **clampStepIndex**: Bounds checking для step indices

### Integration с exchange-core

Delegates actual calculations:

- `calculateUahAmount(fromAmount, fromCurrency)` - core calculation
- `calculateCommission(fromAmount, fromCurrency)` - fee calculation
- Uses `ExchangeRate` type для consistent data structure

### Validation logic

Input validation covers:

- Required fields (fromCurrency, fromAmount)
- Numeric conversion и range validation
- Rate availability check
- Final amount validation

### Error message consistency

Current error messages:

- 'Invalid amount' - для parsing errors
- 'Курс валюты не найден' - для missing rates
- 'Сумма слишком мала' - для insufficient amounts

Mix of English и Russian suggests need для localization.

### Step management patterns

Step helpers follow safe navigation:

- Prevent index out of bounds
- Handle edge cases (first/last steps)
- Pure functions без state mutations

### Performance characteristics

- Pure functions without side effects
- Efficient array lookup для rates
- Minimal computation overhead
- No async operations

### Type safety approach

- Full TypeScript typing
- Proper null handling
- Structured error states
- Type imports от dependencies

### Future extensibility

Structure allows для:

- Multiple rate sources
- Different calculation methods
- Enhanced validation rules
- Complex fee structures
