# useForm.ts - Анализ файла

## Краткое назначение

Universal form hook с Zod валидацией - deprecated в пользу useFormWithNextIntl для интернационализированных компонентов.

## Подробное описание

### Основная функциональность

Файл предоставляет универсальный `useForm` hook для управления формами:

- Zod schema validation интеграция
- Автоматическое состояние формы (values, errors, isSubmitting, isDirty)
- Встроенные уведомления об ошибках
- Flexible validation timing (onBlur/onSubmit)
- Helper methods для field management

### Ключевые особенности

- **DEPRECATED статус**: Явно помечен как устаревший в комментариях
- **Migration path**: Переход на `useFormWithNextIntl` для новых компонентов
- **Modular architecture**: Разделение на отдельные hooks для validation, actions, field props
- **Type safety**: Полное типирование с generic constraints

### Архитектурные решения

- Functional composition через отдельные helper hooks
- State management с useState и derived state через useMemo
- Error handling с notification system integration
- Validation abstraction поверх Zod schemas

## Экспортируемые сущности / API

### Основные exports

```typescript
// Главная функция (deprecated)
export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormReturn<T>;

// Re-exported types
export type { FormField, UseFormOptions, UseFormReturn } from './useFormTypes';
```

### UseFormReturn interface

```typescript
interface UseFormReturn<T> {
  // State
  values: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;

  // Validation
  validateForm: () => boolean;
  validateField: (field: string) => boolean;

  // Actions
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearErrors: () => void;
  reset: () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  getFieldProps: <K extends keyof T>(field: K) => FieldProps;
}
```

## Зависимости

### Внутренние зависимости

- `@repo/constants` - I18N_CONFIG для fallback locale
- `../useNotifications` - notification system
- `./useFormTypes` - type definitions и utilities

### Внешние зависимости

- `react` - useState, useCallback, useMemo
- `zod` - validation schema system

## Связи с другими файлами

### Импортируется в

- `packages/ui/src/types/auth-fields.ts` - UseFormReturn typing
- `packages/ui/src/components/auth/` - AuthSubmitButton, AuthPasswordField
- Используется в legacy form components

### Использует

- `useNotifications` для error feedback
- `useFormTypes` для shared types и utilities
- Constants для internationalization config

## Возможные улучшения и риски

### Текущие риски

- **DEPRECATED STATUS**: Файл помечен как устаревший
- **Hardcoded messages**: Error messages не локализованы
- **Legacy validation**: Использует deprecated подход без i18n
- **Complex composition**: Много helper hooks увеличивают complexity

### Рекомендации по улучшению

1. **Complete migration**: Завершить переход на `useFormWithNextIntl`
2. **Remove deprecated code**: Удалить после миграции всех consumers
3. **Documentation update**: Обновить docs после завершения миграции

## TODO и планы развития

### Краткосрочные задачи

- [ ] Завершить миграцию всех consumers на `useFormWithNextIntl`
- [ ] Audit usage в кодовой базе
- [ ] Create migration guide

### Долгосрочные задачи

- [ ] Remove deprecated hook после завершения миграции
- [ ] Clean up related types и dependencies
- [ ] Archive documentation

## Дополнительные заметки

### Migration context

Файл является частью большой миграции от базовых form hooks к полностью интернационализированным решениям:

- `useForm` → `useFormWithNextIntl`
- Hardcoded messages → i18n translations
- Legacy validation → modern i18n-aware validation

### Architecture patterns

Использует несколько важных паттернов:

- **Separation of concerns**: Отдельные hooks для validation, actions, field props
- **Composition over inheritance**: Functional composition для flexibility
- **Type-safe field access**: Generic constraints для type safety
- **Error boundary pattern**: Centralized error handling через notifications

### Helper hooks breakdown

```typescript
// Core validation logic
useFormValidation() -> { validateForm, validateField }

// State management actions
useFormBasicActions() -> { setValue, setError, clearError, etc. }

// Submit handling
useFormSubmitAction() -> { handleSubmit }

// Field props generation
useFormFieldProps() -> { getFieldProps }
```

### Validation strategy

- Zod schemas для type-safe validation
- Field-level и form-level validation
- Error accumulation и clearing
- Integration с notification system для user feedback

### Performance considerations

- Использует useCallback для stable references
- useMemo для derived state calculations
- Functional composition для избежания ненужных re-renders
