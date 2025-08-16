# auth-helpers.tsx

## Краткое назначение

Utility модуль с enhancement функциями для AuthFormCompound, предоставляющий автоматическое внедрение context props в дочерние компоненты через shouldEnhanceProp pattern и enhanceChildWithContext логику.

## Подробное описание

Файл реализует enhancement system для AuthForm compound компонента, следуя установленным паттернам из header-helpers.tsx. Включает типизированный AuthFormContextValue интерфейс и специализированные функции для добавления specific props (form, isLoading, t, fieldId, onSubmit, validationErrors). Использует shouldEnhanceProp utility для определения необходимости внедрения пропсов. Основная enhanceChildWithContext функция применяет все enhancement rules к React элементам через React.cloneElement pattern. Поддерживает 'use client' директиву для Next.js совместимости и интегрируется с @repo/hooks для UseFormReturn типизации.

## Экспортируемые сущности / API

### Типы

- `AuthFormContextValue` - интерфейс контекста с всеми auth form properties

### Context Properties

- `form: UseFormReturn<Record<string, unknown>>` - react-hook-form object
- `isLoading: boolean` - loading state для UI feedback
- `t: (key: string) => string` - translation function для i18n
- `fieldId?: string` - опциональный field identifier
- `onSubmit?: (data: Record<string, unknown>) => void` - form submission handler
- `validationErrors?: Record<string, string>` - validation error mapping

### Utility Functions

- `shouldEnhanceProp(contextValue, childProp): boolean` - определяет необходимость enhancement
- `addForm(enhancedProps, context, childProps)` - внедрение form объекта
- `addIsLoading(enhancedProps, context, childProps)` - внедрение loading state
- `addTranslation(enhancedProps, context, childProps)` - внедрение t function
- `addFieldId(enhancedProps, context, childProps)` - внедрение field ID
- `addOnSubmit(enhancedProps, context, childProps)` - внедрение submit handler
- `addValidationErrors(enhancedProps, context, childProps)` - внедрение validation errors

### Enhancement Functions

- `addContextProps(enhancedProps, context, childProps)` - orchestrator для всех add\* функций
- `enhanceChildWithContext(child, context): ReactNode` - главная enhancement функция

## Зависимости

### Внутренние зависимости

- `@repo/hooks` - UseFormReturn тип из централизованного hooks пакета
- `react` - React API для элемент enhancement

### Архитектурные паттерны

- Следует header-helpers.tsx паттернам для consistency
- Использует shouldEnhanceProp pattern для conditional enhancement
- Реализует same enhancement architecture как другие compound components

## Enhancement Logic

### shouldEnhanceProp Pattern

```typescript
function shouldEnhanceProp(contextValue: unknown, childProp: unknown): boolean {
  return contextValue !== undefined && !childProp;
}
```

Внедряет prop только если:

- В контексте есть значение (`contextValue !== undefined`)
- У дочернего элемента нет этого пропа (`!childProp`)

### Enhancement Process

1. **Validation**: проверка React.isValidElement и type !== 'string'
2. **Props extraction**: получение childProps через child.props
3. **Context enhancement**: применение всех add\* функций
4. **Element cloning**: React.cloneElement с enhanced props

### Supported Props Enhancement

- **form**: Автоматическое внедрение react-hook-form объекта
- **isLoading**: Передача loading состояния для disabled/spinner UI
- **t**: Внедрение translation function для i18n support
- **fieldId**: Опциональный field identifier для специализации
- **onSubmit**: Form submission handler для unified handling
- **validationErrors**: Error mapping для field-specific validation

## Использование

### Автоматическое enhancement

```tsx
// Context предоставляет эти значения
const contextValue = {
  form: useForm(),
  isLoading: true,
  t: useTranslations(),
  fieldId: 'login',
};

// Дочерние компоненты автоматически получают пропсы
<AuthForm {...contextValue}>
  <AuthEmailField /> {/* Автоматически получает form, isLoading, t */}
  <AuthPasswordField /> {/* Автоматически получает form, isLoading, t */}
  <AuthSubmitButton /> {/* Автоматически получает isLoading, t */}
</AuthForm>;
```

### Manual enhancement (для custom случаев)

```tsx
import { enhanceChildWithContext } from '../lib/auth-helpers';

const enhancedChild = enhanceChildWithContext(<CustomAuthComponent />, authFormContext);
```

## Архитектурные принципы

### Consistency с проектом

- Идентичные паттерны с header-helpers.tsx
- Та же структура функций и naming conventions
- Соответствие Compound Components Pattern v2.0

### Type Safety

- Строгая типизация через TypeScript
- UseFormReturn интеграция с @repo/hooks
- Record типы для flexible form data

### Performance

- Conditional enhancement через shouldEnhanceProp
- Минимальное количество клонирований элементов
- Отсутствие enhancement для string элементов

## Возможные риски и проблемы

### Performance

- React.cloneElement на каждый дочерний элемент
- Context updates вызывают re-render всех consumers
- Отсутствие мемоизации в enhancement functions

### Type Safety

- Record<string, unknown> типы снижают type safety
- Возможная потеря specific типизации при enhancement
- childProps typing через Record может скрывать ошибки

### Сложность

- Enhancement логика может быть неочевидна для новых разработчиков
- Отладка enhanced props может быть затруднена
- Зависимость от правильного порядка enhancement функций

## TODO и предложения по улучшению

### Performance

- [ ] Добавить React.memo для enhancement functions
- [ ] Реализовать useMemo для contextValue в AuthFormProvider
- [ ] Оптимизировать shouldEnhanceProp через useCallback

### Type Safety

- [ ] Улучшить типизацию для specific form types
- [ ] Добавить generic constraints для AuthFormContextValue
- [ ] Создать typed enhancement functions для specific cases

### Developer Experience

- [ ] Добавить development warnings для invalid enhancement
- [ ] Создать debug mode для tracking enhanced props
- [ ] Добавить JSDoc комментарии для всех функций
