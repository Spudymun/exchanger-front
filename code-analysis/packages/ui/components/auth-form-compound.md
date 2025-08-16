# auth-form-compound.tsx

## Краткое назначение

Compound компонент для создания форм аутентификации с поддержкой автоматического внедрения context props (form, isLoading, t, fieldId), реализующий архитектуру Compound Components v2.0 для устранения prop drilling и централизации состояния auth форм.

## Подробное описание

Файл реализует комплексную систему auth form компонентов, мигрировавшую от монолитной архитектуры AUTH компонентов к Compound Components Pattern для устранения выявленных архитектурных проблем (Score: 43/50 - 86% критический уровень). Использует React Context для централизованного управления состоянием формы (form object, loading state, translation function, field identifiers, validation errors). Предоставляет модульные компоненты: Root (AuthForm - основной провайдер), FormWrapper (HTML form с автоматическим handleSubmit), FieldWrapper (контейнер полей с spacing), ActionsWrapper (обертка кнопок с layout). Включает enhancement паттерн для автоматического внедрения context props в дочерние компоненты. Интегрирован с BaseErrorBoundary для error handling и следует проектным паттернам из header-compound.tsx. Использует 'use client' директивы для Next.js SSR совместимости.

## Экспортируемые сущности / API

### Основные компоненты

- `AuthFormCompound` - объединенный compound компонент со всеми дочерними
- `Root` (AuthForm) - корневой провайдер AuthFormContext с enhancement
- `FormWrapper` - HTML form обертка с автоматическим handleSubmit
- `FieldWrapper` - контейнер полей с вертикальным spacing (space-y-2)
- `ActionsWrapper` - контейнер кнопок с flex layout (space-y-4)
- `AuthFormWithErrorBoundary` - обертка с BaseErrorBoundary

### Hooks

- `useAuthFormContext()` - доступ к AuthFormContext

### Context Properties

- `form: UseFormReturn<Record<string, unknown>>` - react-hook-form объект
- `isLoading: boolean` - состояние загрузки формы
- `t: (key: string) => string` - функция интернационализации
- `fieldId?: string` - идентификатор поля для композиции
- `onSubmit?: (data: Record<string, unknown>) => void` - обработчик отправки
- `validationErrors?: Record<string, string>` - ошибки валидации

### Enhancement Pattern

Автоматическое внедрение пропсов в дочерние компоненты:

- `addForm()` - внедрение form объекта
- `addIsLoading()` - внедрение loading состояния
- `addTranslation()` - внедрение t функции
- `addFieldId()` - внедрение field идентификатора
- `addOnSubmit()` - внедрение submit обработчика
- `addValidationErrors()` - внедрение ошибок валидации

### Интерфейсы

- `AuthFormContextValue` - типизированный контекст (external)
- `AuthFormProviderProps` - пропсы корневого провайдера
- `FormWrapperProps` - пропсы form обертки
- `FieldWrapperProps` - пропсы field контейнера
- `ActionsWrapperProps` - пропсы actions контейнера

## Зависимости

### Внутренние зависимости

- `../lib/auth-helpers` - enhanceChildWithContext и AuthFormContextValue
- `../lib/utils` - utility функция `cn` для conditional classnames
- `./error-boundaries` - BaseErrorBoundary компонент
- `@repo/hooks` - UseFormReturn тип

### External Architecture

- Использует external helper files для separation of concerns
- Enhancement logic externalized в auth-helpers.tsx для reusability
- Следует паттернам из header-compound.tsx для consistency

### UI системы

- Использует design system через Tailwind CSS классы
- Интегрируется с form system через react-hook-form
- Поддерживает Next.js App Router через 'use client' директивы

## Архитектурные улучшения

### Устранение проблем AUTH компонентов

- ✅ **Prop Drilling**: Устранено через AuthFormContext
- ✅ **State Duplication**: isLoading, t, form централизованы
- ✅ **Multiple Exports**: Object.assign pattern реализован
- ✅ **Context Absence**: AuthFormContext создан с enhancement

### Compliance с Compound Pattern v2.0

- ✅ Context API с useMemo оптимизацией
- ✅ Enhancement helpers pattern
- ✅ Object.assign export structure
- ✅ Error Boundaries integration
- ✅ TypeScript strict mode
- ✅ forwardRef поддержка

## Использование

### Базовое использование

```tsx
import { AuthForm } from '@repo/ui';

<AuthForm form={form} isLoading={loading} t={t}>
  <AuthForm.FormWrapper>
    <AuthForm.FieldWrapper>
      <AuthEmailField /> {/* Auto-enhanced */}
      <AuthPasswordField /> {/* Auto-enhanced */}
    </AuthForm.FieldWrapper>
    <AuthForm.ActionsWrapper>
      <AuthSubmitButton /> {/* Auto-enhanced */}
    </AuthForm.ActionsWrapper>
  </AuthForm.FormWrapper>
</AuthForm>;
```

### Миграция от монолитных форм

```tsx
// ❌ Старый подход с prop drilling
<form onSubmit={form.handleSubmit(onSubmit)}>
  <AuthEmailField form={form} isLoading={isLoading} t={t} fieldId="email" />
  <AuthPasswordField form={form} isLoading={isLoading} t={t} fieldId="password" />
  <AuthSubmitButton isLoading={isLoading} t={t} />
</form>

// ✅ Новый подход с compound pattern
<AuthForm form={form} isLoading={isLoading} t={t}>
  <AuthForm.FormWrapper>
    <AuthForm.FieldWrapper>
      <AuthEmailField />     {/* Props автоматически внедряются */}
      <AuthPasswordField />  {/* из AuthFormContext */}
    </AuthForm.FieldWrapper>
    <AuthForm.ActionsWrapper>
      <AuthSubmitButton />
    </AuthForm.ActionsWrapper>
  </AuthForm.FormWrapper>
</AuthForm>
```

## Возможные риски и проблемы

### Производительность

- Context re-renders при любом изменении состояния формы
- Множественные React.cloneElement операции в enhancement
- useMemo оптимизация снижает риски

### Миграция

- Требует обновления существующих LoginForm/RegisterForm
- Изменение API для разработчиков
- Необходимость обучения compound pattern

### Совместимость

- Требует 'use client' для Next.js SSR
- Зависимость от BaseErrorBoundary architecture
- Интеграция с существующими AUTH компонентами

## TODO и предложения по улучшению

### Миграция

- [ ] Мигрировать LoginForm.tsx на AuthFormCompound
- [ ] Мигрировать RegisterForm.tsx на AuthFormCompound
- [ ] Обновить AuthForms.tsx с новой архитектурой
- [ ] Создать Storybook stories для демонстрации

### Тестирование

- [ ] Unit тесты для AuthFormContext
- [ ] Integration тесты для enhancement pattern
- [ ] E2E тесты для auth workflow
- [ ] Performance тесты для больших форм

### Документация

- [ ] Обновить API документацию
- [ ] Создать migration guide
- [ ] Добавить примеры в Storybook
- [ ] Обновить TypeScript типы
