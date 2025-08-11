# exchange-constants.ts - Анализ файла

## Краткое назначение

Константы для Exchange Store - дефолтные значения формы обмена и шагов процесса обмена валют.

## Подробное описание

### Основная функциональность

Файл предоставляет константы для Exchange Store:

- `DEFAULT_FORM_DATA` - дефолтные значения формы обмена
- `DEFAULT_STEPS` - конфигурация шагов процесса обмена
- Type-safe константы с полным типированием
- Centralized configuration для exchange workflow

### Ключевые особенности

- **Type safety**: Константы типизированы через ExchangeFormData и ExchangeStep
- **Immutable defaults**: Shared константы для consistent initialization
- **Step configuration**: Полная конфигурация exchange workflow
- **Recipient data structure**: Structured approach к данным получателя

### Архитектурные решения

- Separation of concerns - константы отделены от store logic
- Type imports для обеспечения consistency
- Structured recipient data с отдельным объектом
- Step-based workflow configuration

## Экспортируемые сущности / API

### Основные exports

```typescript
// Дефолтные данные формы
export const DEFAULT_FORM_DATA: ExchangeFormData = {
  fromCurrency: null,
  toCurrency: null,
  selectedBank: null,
  fromAmount: '',
  toAmount: '',
  recipientData: {
    cardNumber: '',
    recipientName: '',
    phone: '',
  },
  userEmail: '',
  agreementAccepted: false,
};

// Конфигурация шагов обмена
export const DEFAULT_STEPS: ExchangeStep[] = [
  // 4 шага: form, review, payment, completed
];
```

### Form data structure

- **Currency fields**: fromCurrency, toCurrency (nullable)
- **Bank selection**: selectedBank (nullable)
- **Amount fields**: fromAmount, toAmount (strings для input handling)
- **Recipient data**: Вложенный объект с cardNumber, recipientName, phone
- **User contact**: userEmail для notifications
- **Agreement**: agreementAccepted boolean flag

### Step configuration

Каждый step содержит:

- `id`: Unique identifier ('form', 'review', 'payment', 'completed')
- `title`: Human-readable название
- `description`: Описание шага
- `isCompleted`: Completion status
- `isActive`: Current step indicator
- `canSkip`: Whether step может быть пропущен

## Зависимости

### Внутренние зависимости

- `./exchange-store` - ExchangeFormData, ExchangeStep types

### Внешние зависимости

- Нет прямых внешних зависимостей

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/state/exchange-store.ts` - основной consumer для initialization

### Экспортирует типы из

- `./exchange-store` - для type consistency

## Возможные улучшения и риски

### Текущие риски

- **Hardcoded values**: Все значения hardcoded в константах
- **No validation**: Нет runtime validation для константы
- **Limited configurability**: Нет опций для different exchange types

### Рекомендации по улучшению

1. **Configuration options**: Allow customization через параметры
2. **Validation**: Add runtime validation для data integrity
3. **Internationalization**: Move step titles/descriptions к i18n system
4. **Type guards**: Add runtime type checking

## TODO и планы развития

### Краткосрочные задачи

- [ ] Add JSDoc documentation для all constants
- [ ] Consider i18n для step titles и descriptions
- [ ] Add validation helpers

### Долгосрочные задачи

- [ ] Dynamic step configuration based на exchange type
- [ ] Configurable form fields based на requirements
- [ ] Enhanced recipient data structure для different payment methods

## Дополнительные заметки

### Default form data design

Структура `DEFAULT_FORM_DATA` отражает:

- **Currency selection**: null values для dropdown selections
- **String amounts**: Empty strings для input field handling
- **Nested recipient data**: Organized structure для payment details
- **Agreement handling**: Boolean flag для terms acceptance

### Step workflow design

`DEFAULT_STEPS` представляет linear workflow:

1. **form**: Data entry step (initially active)
2. **review**: Data verification step
3. **payment**: Payment processing step
4. **completed**: Success confirmation step

Все steps начинают как incomplete и inactive (кроме первого).

### Type integration

Константы полностью интегрированы с type system:

- Import types от exchange-store
- Type annotations обеспечивают consistency
- Compile-time verification против type changes

### Usage patterns

Constants используются для:

- Store initialization в exchange-store
- Form reset operations
- Default state restoration
- Type inference для form fields

### Recipient data structure

`recipientData` object includes:

- `cardNumber`: Payment card details
- `recipientName`: Beneficiary name
- `phone`: Contact information

Это suggests bank transfer как primary payment method.

### Step state management

Each step имеет multiple state flags:

- `isCompleted`: Historical completion status
- `isActive`: Current position в workflow
- `canSkip`: Workflow flexibility option

### Maintenance considerations

При модификации констант:

- Update corresponding types в exchange-store
- Review all usage sites
- Test initialization scenarios
- Verify form reset functionality
