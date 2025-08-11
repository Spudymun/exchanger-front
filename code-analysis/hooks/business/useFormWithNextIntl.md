# useFormWithNextIntl.ts - Анализ файла

## Краткое назначение

Next-intl интегрированный form hook с полной локализацией валидации - современная замена deprecated useForm hook'а.

## Подробное описание

### Основная функциональность

Файл предоставляет `useFormWithNextIntl` hook для современного form management:

- Интеграция с Next-intl для локализованных error messages
- Полная совместимость с `UseFormReturn` interface
- Zod validation с локализованными сообщениями
- Modular architecture с отдельными helper functions

### Ключевые особенности

- **Full i18n support**: Локализованные validation messages через Next-intl
- **Backward compatibility**: Совместимость с существующим `UseFormReturn` API
- **Type safety**: Строгое типирование с generic constraints
- **Functional composition**: Разделение логики через helper functions

### Архитектурные решения

- Integration с `@repo/utils` для `useNextIntlValidation`
- Functional decomposition через отдельные helper functions
- State management с React hooks
- Error compatibility layer для legacy code

## Экспортируемые сущности / API

### Основные exports

```typescript
// Главная функция
export function useFormWithNextIntl<T extends Record<string, unknown>>(
  params: UseFormWithNextIntlParams<T>
): UseFormReturn<T>;

// Параметры configuration
export interface UseFormWithNextIntlParams<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  t: (key: string, values?: Record<string, string | number>) => string;
  locale?: string;
  onSubmit?: (values: T) => void | Promise<void>;
}

// Enhanced return type
export interface UseFormWithNextIntlReturn<T> {
  // Enhanced error typing
  errors: Partial<Record<keyof T, string>>;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;

  // Plus all UseFormReturn methods...
}
```

### Совместимость

Возвращает полный `UseFormReturn<T>` interface для совместимости с existing code

## Зависимости

### Внутренние зависимости

- `@repo/utils` - useNextIntlValidation для локализованной валидации
- `./useFormTypes` - FormField и UseFormReturn типы

### Внешние зависимости

- `react` - useState, useCallback, useMemo
- `zod` - validation schema system

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/index.ts` - public API export
- `apps/web/src/components/forms/` - LoginForm, RegisterForm
- `components/exchange-form/useHeroExchangeForm.ts` - exchange form logic

### Использует

- `useNextIntlValidation` из utils для i18n validation
- `UseFormReturn`, `FormField` из useFormTypes для compatibility

## Возможные улучшения и риски

### Текущие риски

- **JSON.stringify для isDirty**: Неэффективная проверка изменений
- **Complex composition**: Много helper functions увеличивают complexity
- **Error adaptation**: Дополнительный слой для compatibility

### Рекомендации по улучшению

1. **Performance optimization**: Заменить JSON.stringify на efficient equality check
2. **Simplify composition**: Reduce helper function complexity
3. **Enhanced typing**: More specific error typing для better DX

## TODO и планы развития

### Краткосрочные задачи

- [ ] Optimize isDirty calculation без JSON.stringify
- [ ] Add comprehensive unit tests
- [ ] Improve error message typing

### Долгосрочные задачи

- [ ] Full migration от deprecated useForm
- [ ] Enhanced validation features (async validation, field dependencies)
- [ ] Performance optimization для large forms

## Дополнительные заметки

### Architecture breakdown

Файл использует functional composition pattern:

```typescript
// Main hook
useFormWithNextIntl()
  -> useFormLogic()
    -> createFormMethods()
      -> createFieldMethods()
      -> createResetMethod()
      -> createValidationMethods()
      -> createSubmitHandler()
      -> createFieldPropsGetter()
      -> assembleFormReturn()
```

### Helper functions overview

- **createFieldMethods**: setValue, setError, clearError, clearErrors
- **createResetMethod**: Form reset functionality
- **createValidationMethods**: validateForm, validateField
- **createSubmitHandler**: Async submit с error handling
- **createFieldPropsGetter**: Field props generation для form components
- **assembleFormReturn**: Final object assembly с compatibility layer

### i18n Integration

- Использует `t` function от Next-intl для message translation
- Передает `locale` в validation utilities
- Обеспечивает consistent локализацию across всей формы

### Performance considerations

- useCallback для все methods для stable references
- useMemo для derived state (isDirty, isValid)
- Error adaptation layer может добавлять overhead

### Type compatibility

- Возвращает `UseFormReturn<T>` для backward compatibility
- `errors` type адаптируется от `Partial<Record<keyof T, string>>` к `Record<string, string>`
- Field props typing остается consistent с legacy API

### Migration strategy

Заменяет deprecated `useForm`:

- Same API surface для easy migration
- Enhanced i18n capabilities
- Better type safety
- Performance improvements (кроме isDirty calculation)

### Validation integration

- Делегирует validation логику в `useNextIntlValidation`
- Поддерживает Zod schemas
- Локализованные error messages из translation files
- Field-level и form-level validation
