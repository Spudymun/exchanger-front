# exchange-fiat-actions.ts - Анализ файла

## Краткое назначение

Fiat currency actions для Exchange Store - управление фиатными валютами, банками и автоматическими пересчетами.

## Подробное описание

### Основная функциональность

Файл создает actions для работы с фиатными валютами в Exchange Store:

- Управление списком доступных фиатных валют
- Управление банками для конкретных валют
- Выбор фиатной валюты с автоматическим пересчетом
- Выбор банка с автоматическим пересчетом
- Debounced calculations для performance

### Ключевые особенности

- **Debounced calculations**: Автоматический пересчет с задержкой при изменениях
- **State management**: Proper state updates с partial merging
- **Data relationships**: Связь между валютами и банками
- **Auto-reset logic**: Сброс связанных полей при изменениях

### Архитектурные решения

- Factory pattern с `createFiatActions`
- Integration с Zustand store pattern (set, get)
- Debounced actions через utility от `@repo/utils`
- State invalidation при изменении dependencies

## Экспортируемые сущности / API

### Основные exports

```typescript
// Factory function для создания fiat actions
export const createFiatActions = (
  set: (fn: (state: ExchangeStore) => Partial<ExchangeStore>) => void,
  get: () => ExchangeStore
) => ({
  // Обновление списка доступных фиатных валют
  updateFiatCurrencies: (currencies: FiatCurrency[]) => void,

  // Обновление банков для конкретной валюты
  updateBanksForCurrency: (currency: FiatCurrency, banks: Bank[]) => void,

  // Получение банков для валюты
  getBanksForCurrency: (currency: FiatCurrency) => Bank[],

  // Выбор фиатной валюты
  selectFiatCurrency: (currency: FiatCurrency) => void,

  // Выбор банка
  selectBank: (bank: Bank) => void,
})
```

### Action details

- **updateFiatCurrencies**: Массовое обновление доступных валют
- **updateBanksForCurrency**: Связывание банков с валютой
- **getBanksForCurrency**: Getter для банков (currently returns all available)
- **selectFiatCurrency**: Выбор валюты с reset dependent fields
- **selectBank**: Выбор банка с recalculation

## Зависимости

### Внутренние зависимости

- `@repo/constants` - UI_DEBOUNCE_CONSTANTS
- `@repo/exchange-core` - FiatCurrency, Bank types
- `@repo/utils` - createDebounceAction utility
- `./exchange-store` - ExchangeStore type

### Внешние зависимости

- Нет прямых внешних зависимостей

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/state/exchange-store.ts` - integration в main store

### Использует

- Exchange store types для type safety
- Debounce utilities для performance optimization
- Constants для timing configuration

## Возможные улучшения и риски

### Текущие риски

- **getBanksForCurrency**: Не фильтрует банки по валюте
- **Memory leaks**: Debounced actions могут создавать memory leaks
- **Race conditions**: Multiple debounced calls могут конфликтовать

### Рекомендации по улучшению

1. **Fix getBanksForCurrency**: Implement proper filtering by currency
2. **Cleanup debounced actions**: Add cleanup mechanisms
3. **Better error handling**: Handle failed calculations
4. **Validation**: Add input validation для actions

## TODO и планы развития

### Краткосрочные задачи

- [ ] Fix getBanksForCurrency implementation
- [ ] Add proper cleanup для debounced actions
- [ ] Add error handling для calculations

### Долгосрочные задачи

- [ ] Enhanced bank filtering logic
- [ ] Rate limiting для API calls
- [ ] Optimistic updates для better UX

## Дополнительные заметки

### Factory pattern usage

`createFiatActions` использует factory pattern:

- Принимает `set` и `get` functions от Zustand store
- Возвращает object с action methods
- Allows closure over store access functions

### State update patterns

Все actions используют consistent pattern:

```typescript
set(state => ({
  formData: { ...state.formData /* updates */ },
  calculation: null, // reset calculation
}));
```

### Auto-reset logic

При изменении валюты или банка:

- Сбрасывается `selectedBank` (при смене валюты)
- Сбрасывается `toAmount`
- Сбрасывается `calculation`
- Triggers debounced recalculation

### Debounced calculations

Uses `createDebounceAction` utility:

- `delay`: Берется от `UI_DEBOUNCE_CONSTANTS.EXCHANGE_CALCULATION_DELAY`
- `action`: Calls `get().calculateExchange()`
- Prevents excessive calculation calls

### Data relationships

Implied relationships:

- FiatCurrency → Bank (many-to-many)
- Currency selection affects available banks
- Bank selection affects exchange calculations

### Performance considerations

- Debounced actions prevent excessive API calls
- State updates batched через Zustand
- Partial state updates minimize re-renders

### Integration points

Actions интегрированы в exchange store через spread:

```typescript
...createFiatActions(set, get)
```

### Missing functionality

`getBanksForCurrency` currently returns все banks instead of filtering. Это suggests:

- Either filtering происходит elsewhere
- Или это bug который нужно исправить
- Или банки не связаны с конкретными валютами

### Error handling gaps

Actions не handle cases where:

- calculateExchange throws error
- Invalid currency/bank passed
- Store state corrupted

### Type safety

Full type safety через:

- TypeScript types от exchange-core
- ExchangeStore type constraints
- Proper parameter typing
