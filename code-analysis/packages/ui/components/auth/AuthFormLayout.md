# AuthFormLayout.tsx

## Краткое назначение

Централизованный layout компонент для authentication форм с переключением между login/register режимами, единообразным styling и модульной архитектурой через sub-components.

## Подробное описание

Файл реализует комплексный layout system для auth forms с focus на consistency и reusability. Основной AuthFormLayout компонент orchestrates весь auth UI включая header, mode toggle и form content area. Использует modular sub-components: AuthFormHeader для title/subtitle display и AuthFormToggle для mode switching functionality. Включает memoized sub-components для performance optimization. Предоставляет consistent CSS class usage для styling integration. Реализует callback-based mode switching с proper event handling. Поддерживает internationalization через structured translation keys. Обеспечивает accessible design через semantic HTML и proper button types.

## Экспортируемые сущности / API

### Основные компоненты

- `AuthFormLayout` - основной layout orchestrator для auth forms

### Sub-components (Internal)

- `AuthFormHeader` - мемоизированный header с title/subtitle
- `AuthFormToggle` - мемоизированный mode toggle с button switching

### Интерфейсы

- `AuthFormLayoutProps` - props для main layout component
- `AuthFormHeaderProps` - props для header sub-component
- `AuthFormToggleProps` - props для toggle sub-component

### Props API

- `mode` - текущий auth mode ('login' | 'register')
- `onModeChange` - callback для mode switching
- `t` - translation function для internationalization
- `children` - form content area

### CSS Classes Integration

- `auth-form-container` - main container styling
- `auth-form-wrapper` - form wrapper styling
- `text-center-with-margin` - header alignment styling

## Зависимости

### Внутренние зависимости

- `../ui/button` - Button компонент для mode toggle functionality
- `react` - React hooks, memoization и типы

### UI Integration

- Использует design system CSS переменные (--foreground, --muted-foreground)
- Интегрируется с Button component variants (default/ghost)
- Responsive design через Tailwind classes

### Архитектурные паттерны

- Modular sub-component architecture
- Memoization для performance optimization
- Callback composition для event handling

## Возможные риски и проблемы

### Performance

- Отсутствие memoization для main AuthFormLayout component
- Callback recreation на каждый render через useCallback
- Potential excessive re-renders при mode changes

### State Management

- Mode state управляется externally без internal state fallback
- Отсутствие validation для mode prop values
- Нет persistence для user's preferred mode

### Accessibility

- Limited ARIA support для mode switching
- Отсутствие keyboard navigation enhancements
- Нет screen reader announcements для mode changes

### CSS Dependencies

- Hardcoded CSS class names без validation
- Тесная связь с specific styling implementation
- Отсутствие fallback для missing CSS classes

### Internationalization

- Manual translation key management
- Hardcoded translation structure
- Отсутствие fallback для missing translations

## TODO и предложения по улучшению

### Performance

- [ ] Добавить React.memo для main AuthFormLayout component
- [ ] Оптимизировать callback dependencies через useMemo
- [ ] Реализовать selective re-rendering для mode changes
- [ ] Добавить performance monitoring для auth layout

### State Management

- [ ] Добавить internal state fallback для mode management
- [ ] Реализовать mode validation с TypeScript constraints
- [ ] Создать mode persistence через localStorage
- [ ] Добавить mode change analytics tracking

### Accessibility

- [ ] Реализовать полную ARIA support для mode switching
- [ ] Добавить keyboard navigation для toggle buttons
- [ ] Создать screen reader announcements для mode changes
- [ ] Улучшить focus management для mode transitions

### CSS & Styling

- [ ] Создать CSS-in-JS integration для dynamic styling
- [ ] Добавить theme variants для different auth scenarios
- [ ] Реализовать responsive layout optimizations
- [ ] Создать CSS class validation system

### Internationalization

- [ ] Создать automated translation key management
- [ ] Добавить fallback mechanisms для missing translations
- [ ] Реализовать RTL language support
- [ ] Создать context-aware translation loading

### API Enhancement

- [ ] Добавить render props pattern для custom layouts
- [ ] Создать compound component architecture
- [ ] Реализовать plugin system для auth layout extensions
- [ ] Добавить imperative API для programmatic control

### Functionality

- [ ] Добавить animation support для mode transitions
- [ ] Создать progressive enhancement для form states
- [ ] Реализовать auto-mode detection based on context
- [ ] Добавить social auth integration points

### Error Handling

- [ ] Добавить error boundaries для auth layout
- [ ] Создать graceful degradation для missing components
- [ ] Реализовать fallback UI для broken layouts
- [ ] Добавить error recovery mechanisms

### Security

- [ ] Добавить CSRF protection integration points
- [ ] Создать secure mode transition handling
- [ ] Реализовать rate limiting integration
- [ ] Добавить audit logging для auth interactions

### Testing

- [ ] Добавить comprehensive unit tests для layout logic
- [ ] Создать accessibility tests
- [ ] Реализовать visual regression tests
- [ ] Добавить performance benchmarks

### Documentation

- [ ] Создать comprehensive usage examples
- [ ] Документировать customization patterns
- [ ] Добавить integration guide с auth providers
- [ ] Создать best practices guide для auth layouts
