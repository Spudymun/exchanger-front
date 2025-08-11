# AuthCaptchaField.tsx

## Краткое назначение

Переиспользуемый CAPTCHA field компонент для форм аутентификации с исправленной архитектурой, устраняющий избыточность двойного поля captcha/captchaVerified и использующий централизованную конфигурацию из констант.

## Подробное описание

Файл реализует specialized CAPTCHA field для authentication forms с комплексной валидацией и управлением состоянием. Использует local math captcha hook для избежания циклических зависимостей с @repo/hooks. Интегрируется с централизованной конфигурацией из AUTH_CAPTCHA_CONFIG constants. Реализует правильную архитектуру с single captcha field вместо избыточной captcha/captchaVerified структуры. Включает разделенные useEffect hooks для избежания циклических updates. Предоставляет полную интеграцию с form validation через UseFormReturn interface. Поддерживает internationalization через t function props. Обеспечивает proper error handling и user feedback через form integration.

## Экспортируемые сущности / API

### Основные компоненты

- `AuthCaptchaField` - основной generic CAPTCHA field компонент

### Интерфейсы

- `CaptchaFormFields` - базовый interface для form fields с captcha
- `AuthCaptchaFieldProps<T>` - generic props с form integration

### Generic Configuration

- Generic type `T extends CaptchaFormFields` для type safety
- Integration с `UseFormReturn<T>` для form library compatibility
- Extensible design для custom form structures

### Dependencies Integration

- `useMathCaptchaLocal` - local captcha logic без external dependencies
- `CAPTCHA_CONFIGS_LOCAL` - local configuration constants
- `AUTH_CAPTCHA_CONFIG` - централизованные настройки из @repo/constants

### Props API

- `form` - UseFormReturn instance для form integration
- `isLoading` - loading state для disabled state
- `t` - translation function для internationalization

## Зависимости

### Внешние пакеты

- `@repo/constants` - AUTH_CAPTCHA_CONFIG для centralized settings
- `@repo/hooks` - UseFormReturn type definition
- `react` - React hooks и типы

### Внутренние зависимости

- `../../lib/useMathCaptchaLocal` - local captcha hook без циклических зависимостей
- `../ui/form` - FormField, FormMessage для form integration
- `../ui/math-captcha` - MathCaptcha UI компонент

### Architectural Patterns

- Local hook usage для avoiding circular dependencies
- Separated useEffect hooks для clean state management
- Memoized callbacks для performance optimization

## Возможные риски и проблемы

### Architecture Complexity

- Дублирование captcha logic между local и repo hooks
- Complex dependency management для avoiding circular imports
- Potential inconsistency между local и global captcha configurations

### State Management

- Multiple useEffect hooks могут вызывать race conditions
- Form state synchronization может быть сложной
- Error state management между captcha и form validation

### Performance

- Множественные useEffect могут вызывать excessive re-renders
- Отсутствие debouncing для captcha input changes
- Potential memory leaks от callback dependencies

### Типизация

- Generic constraints могут быть слишком жесткими
- Form integration типы могут конфликтовать с different form libraries
- Translation function типизация может быть улучшена

### User Experience

- Captcha refresh может быть frustrating для users
- Отсутствие progressive difficulty adjustment
- Limited accessibility features для captcha interaction

## TODO и предложения по улучшению

### Architecture Cleanup

- [ ] Consolidate captcha logic между local и repo implementations
- [ ] Создать unified captcha configuration system
- [ ] Реализовать plugin architecture для different captcha types
- [ ] Упростить dependency chain через better separation

### State Management

- [ ] Добавить useReducer для complex captcha state
- [ ] Реализовать debouncing для input changes
- [ ] Создать centralized error state management
- [ ] Добавить optimistic updates для better UX

### Performance

- [ ] Добавить React.memo для component optimization
- [ ] Мемоизировать captcha configuration
- [ ] Оптимизировать useEffect dependencies
- [ ] Добавить lazy loading для captcha components

### User Experience

- [ ] Реализовать progressive difficulty system
- [ ] Добавить audio captcha для accessibility
- [ ] Создать visual captcha alternatives
- [ ] Добавить captcha strength indicators

### Типизация

- [ ] Улучшить generic constraints для form integration
- [ ] Создать строгие типы для captcha responses
- [ ] Добавить branded types для security
- [ ] Реализовать runtime validation для captcha data

### Security

- [ ] Добавить rate limiting для captcha attempts
- [ ] Реализовать anti-bot protection
- [ ] Создать captcha challenge rotation
- [ ] Добавить server-side validation integration

### Internationalization

- [ ] Создать automatic locale detection
- [ ] Добавить RTL support для captcha UI
- [ ] Реализовать locale-specific number formatting
- [ ] Создать accessible labels для screen readers

### Integration

- [ ] Добавить support для popular form libraries
- [ ] Создать integration с validation schemas
- [ ] Реализовать analytics tracking для captcha success rates
- [ ] Добавить A/B testing support для captcha types

### Testing

- [ ] Добавить unit тесты для captcha logic
- [ ] Создать integration тесты с form libraries
- [ ] Добавить accessibility тесты
- [ ] Реализовать security penetration tests

### Documentation

- [ ] Создать comprehensive usage examples
- [ ] Документировать integration patterns
- [ ] Добавить security best practices guide
- [ ] Создать troubleshooting guide для captcha issues
