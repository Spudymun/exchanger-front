# useExchange.ts - Анализ файла

## Краткое назначение

Business logic hook для обменных операций с валидацией формы, автоматическими расчетами и helper функциями для отображения.

## Подробное описание

### Основная функциональность

Файл предоставляет два основных hook'а:

- `useExchange()` - основной business logic hook для обменных операций
- `useExchangeForm()` - специализированный hook для управления формой

### Ключевые особенности

- **Auto-calculation**: Автоматический пересчет при изменении суммы с debounce
- **Form validation**: Centralized валидация с использованием Zod schemas
- **Display helpers**: Утилиты для форматирования курсов и прогресса
- **Separation of concerns**: Четкое разделение логики валидации, отображения и управления формой

### Архитектурные решения

- Использование `useExchangeStore` как основы для state management
- React.useEffect для debounced calculations
- Функциональное разделение через отдельные helper hooks
- Integration с validation utilities из `@repo/utils`

## Экспортируемые сущности / API

### Основные exports

```typescript
// Главный business logic hook
export function useExchange(): {
  ...ExchangeStore,
  validateForm: () => { isValid: boolean; errors: string[] },
  getDisplayRate: () => DisplayRate | null,
  getProgress: () => ProgressInfo
}

// Form management hook
export function useExchangeForm(): {
  setFromAmount: (amount: string) => void,
  setFromCurrency: (currency: CryptoCurrency | null) => void,
  setUserEmail: (email: string) => void,
  setRecipientData: (data: Partial<RecipientData>) => void
}
```

### Helper types

```typescript
// Display rate information
interface DisplayRate {
  currency: CryptoCurrency;
  rate: number;
  commission: number;
  formattedRate: string;
  formattedCommission: string;
}

// Progress tracking
interface ProgressInfo {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  isComplete: boolean;
}
```

## Зависимости

### Внутренние зависимости

- `@repo/constants` - UI_DEBOUNCE_CONSTANTS
- `@repo/exchange-core` - CryptoCurrency types
- `@repo/utils` - emailSchema для валидации
- `../state/exchange-store` - типы для ExchangeStore
- `../useExchangeStore` - основной store hook

### Внешние зависимости

- `react` - для useEffect и lifecycle management

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/client-hooks.ts` - barrel export
- `packages/ui/src/components/exchange-form.tsx` - form context
- Документация упоминает использование в business layer

### Использует

- `useExchangeStore` - основной state management
- Email validation schema из utils
- UI constants для debounce timing

## Возможные улучшения и риски

### Текущие риски

- **Hardcoded error messages**: Validation messages не локализованы
- **Direct store coupling**: Тесная связь с конкретной реализацией store
- **Side effects in hooks**: useEffect может вызывать ненужные пересчеты

### Рекомендации по улучшению

1. **Localization**: Все error messages должны быть локализованы
2. **Memoization**: Добавить useMemo для expensive calculations
3. **Error boundaries**: Обработка edge cases в validation logic
4. **TypeScript enhancement**: Более строгие типы для validation results

## TODO и планы развития

### Краткосрочные задачи

- [ ] Локализация validation messages
- [ ] Добавить unit tests для validation logic
- [ ] Оптимизировать debounce механизм

### Долгосрочные задачи

- [ ] Интеграция с i18n system для error messages
- [ ] Advanced validation rules для business logic
- [ ] Real-time rate updates integration
- [ ] Enhanced progress tracking с step validation

## Дополнительные заметки

### Validation strategy

Использует комбинацию:

- Zod schemas для email validation
- Custom business logic для amounts и calculations
- Centralized error accumulation для user feedback

### Performance considerations

- Debounced calculations с `UI_DEBOUNCE_CONSTANTS.EXCHANGE_CALCULATION_DELAY`
- Отдельные helper functions для избежания ненужных re-renders
- Memoization opportunities в display helpers

### Form management pattern

Разделение ответственности:

- `useExchange` - business logic и validation
- `useExchangeForm` - form state management
- Store integration через `useExchangeStore`

### Integration points

- Exchange store для state management
- Utils для validation schemas
- Constants для UI timing
- Exchange-core для type definitions
