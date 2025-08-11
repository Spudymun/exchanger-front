# useFormTypes.ts - Анализ файла

## Краткое назначение

Type definitions и utility functions для deprecated useForm hook - заменяется на useFormWithNextIntl для интернационализированных компонентов.

## Подробное описание

### Основная функциональность

Файл предоставляет базовые типы и utilities для form management:

- `FormField<T>` interface для field props
- `UseFormOptions<T>` для конфигурации hook'а
- `UseFormReturn<T>` для return type hook'а
- `checkObjectEquality` utility для dirty state detection

### Ключевые особенности

- **DEPRECATED статус**: Комментарий указывает на замену useFormWithNextIntl
- **Generic type safety**: Полное типирование с generic constraints
- **Field props abstraction**: Unified interface для form field properties
- **Efficient equality check**: Оптимизированная проверка равенства объектов

### Архитектурные решения

- Type-first approach для form management
- Generic constraints для flexibility
- Separation между options, return types и field definitions
- Performance-optimized equality checking без JSON.stringify

## Экспортируемые сущности / API

### Основные types

```typescript
// Field interface для form inputs
export interface FormField<T> {
  name: string;
  value: T;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onBlur?: () => void;
}

// Hook configuration options
export interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnBlur?: boolean;
  locale?: string; // Localization support
  captchaMessages?: Record<string, string>; // Deprecated
}

// Complete hook return interface
export interface UseFormReturn<T> {
  // State
  values: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;

  // Validation methods
  validateForm: () => boolean;
  validateField: (field: string) => boolean;

  // State management methods
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearErrors: () => void;
  reset: () => void;

  // Form actions
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  getFieldProps: <K extends keyof T>(field: K) => FormField<T[K]>;
}
```

### Utility functions

```typescript
// Efficient object equality check
export function checkObjectEquality<T extends Record<string, unknown>>(obj1: T, obj2: T): boolean;
```

## Зависимости

### Внутренние зависимости

- Нет прямых внутренних зависимостей

### Внешние зависимости

- `zod` - для validation schema typing
- `react` - для React event types

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/business/useForm.ts` - основной consumer
- `packages/ui/src/types/auth-fields.ts` - UseFormReturn typing
- `packages/ui/src/components/auth/` - для form component typing

### Используется совместно с

- Zod schemas для validation
- React form components для field props
- Form hooks для state management

## Возможные улучшения и риски

### Текущие риски

- **DEPRECATED STATUS**: Файл помечен как устаревший
- **Legacy approach**: Используется старый подход без i18n
- **Hardcoded types**: Некоторые types могут быть недостаточно flexible

### Рекомендации по улучшению

1. **Migration completion**: Завершить переход на useFormWithNextIntl types
2. **Type enhancement**: Improve type safety для edge cases
3. **Remove deprecated**: Удалить после миграции всех consumers

## TODO и планы развития

### Краткосрочные задачи

- [ ] Map all consumers using these types
- [ ] Create migration guide для type changes
- [ ] Verify type compatibility с new i18n approach

### Долгосрочные задачи

- [ ] Remove deprecated types после миграции
- [ ] Consolidate type definitions в новой архитектуре
- [ ] Update documentation references

## Дополнительные заметки

### Migration context

Типы являются частью миграции от legacy form management к современному i18n-aware подходу:

- `FormField` → новые i18n field types
- `UseFormReturn` → enhanced return types с локализацией
- `checkObjectEquality` → может быть переиспользован

### Type design patterns

- **Generic constraints**: `T extends Record<string, unknown>` для type safety
- **Optional properties**: Flexible configuration через optional fields
- **Event typing**: Proper React event types для form elements
- **Callback typing**: Type-safe callbacks для onSubmit и onChange

### Performance considerations

- `checkObjectEquality` использует efficient shallow comparison
- Избегает JSON.stringify для performance
- O(n) complexity для object comparison
- Early return для different key lengths

### Form field abstraction

`FormField<T>` interface предоставляет:

- Unified props для различных input types
- Type-safe value handling
- Optional onBlur для validation timing
- Standard onChange signature для React compatibility

### Usage patterns

```typescript
// Typical usage в component
const form = useForm<LoginFormData>({
  initialValues: { email: '', password: '' },
  validationSchema: loginSchema,
  onSubmit: handleLogin,
});

// Field props generation
const emailProps = form.getFieldProps('email');
// Returns: FormField<string> with proper typing
```
