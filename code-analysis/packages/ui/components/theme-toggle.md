# theme-toggle.tsx

## Краткое назначение

Theme Toggle компонент для переключения между светлой, темной и системной темами с dropdown интерфейсом, иконочными индикаторами и поддержкой интернационализации через customizable labels.

## Подробное описание

Файл реализует полнофункциональный theme toggle компонент, интегрированный с theme system через useTheme hook из @repo/providers. Использует dropdown menu pattern с DropdownMenu компонентом для предоставления трех опций темы: light, dark, system. Включает animated icon transitions между Sun и Moon с CSS transforms для visual feedback. Предоставляет visual indicators (checkmarks) для активной темы. Поддерживает customizable labels для internationalization needs. Использует constants из @repo/constants для theme modes обеспечивая consistency с global theme system. Реализует proper accessibility с ARIA labels и screen reader support. Включает optimized re-rendering через useCallback hooks для theme setters.

## Экспортируемые сущности / API

### Основные компоненты

- `ThemeToggle` - основной theme toggle компонент с dropdown interface

### Интерфейсы

- `ThemeToggleProps` - пропсы с customizable labels для i18n

### Props Configuration

- `labels` - объект с переводами для light/dark/system/toggle labels
- Опциональные labels с fallback к default English values

### Functionality

- Интеграция с `useTheme()` hook из providers
- Support для всех THEME_MODES (LIGHT/DARK/SYSTEM)
- Visual indicators для активной темы
- Animated icon transitions

## Зависимости

### Внешние пакеты

- `@repo/constants` - THEME_MODES константы для consistency
- `@repo/providers` - useTheme hook для theme management
- `lucide-react` - Monitor, Moon, Sun иконки
- `react` - React hooks и типы

### Внутренние зависимости

- `./ui/button` - базовый Button компонент
- `./ui/dropdown-menu` - DropdownMenu компоненты для UI

### Theme Integration

- Прямая интеграция с global theme system
- Использует theme context для state management
- Координируется с ThemeProvider и ThemeScript

## Возможные риски и проблемы

### Производительность

- Dropdown rendering на каждый theme change
- Icon animations могут влиять на performance на слабых устройствах
- Отсутствие мемоизации для labels object
- Re-renders при theme changes через context

### Accessibility

- Limited keyboard navigation в dropdown
- Недостаточная screen reader feedback для theme changes
- Отсутствие focus indicators при keyboard navigation
- Icon-only button может быть недоступен без labels

### Internationalization

- Manual label management без автоматической локализации
- Отсутствие RTL support для dropdown alignment
- Hardcoded default English labels

### Theme System

- Тесная связь с specific theme provider implementation
- Отсутствие fallback behavior при provider errors
- Нет validation для theme values

### Visual Design

- Icon transitions могут конфликтовать с reduced motion preferences
- Fixed sizing может не подходить для все contexts
- Limited customization для icon styles

## TODO и предложения по улучшению

### Производительность

- [ ] Добавить React.memo для оптимизации re-renders
- [ ] Мемоизировать labels object через useMemo
- [ ] Оптимизировать icon animations для performance
- [ ] Добавить lazy loading для dropdown content

### Accessibility

- [ ] Улучшить keyboard navigation support
- [ ] Добавить screen reader announcements для theme changes
- [ ] Реализовать focus management для dropdown
- [ ] Добавить prefers-reduced-motion support для animations

### Internationalization

- [ ] Создать integration с i18n libraries
- [ ] Добавить RTL language support
- [ ] Реализовать automatic locale detection
- [ ] Создать locale-specific icon variations

### Customization

- [ ] Добавить size variants (small/medium/large)
- [ ] Создать icon customization options
- [ ] Реализовать color theme variants
- [ ] Добавить position variants для dropdown

### Theme Integration

- [ ] Добавить theme transition animations
- [ ] Создать theme preview functionality
- [ ] Реализовать theme persistence indicators
- [ ] Добавить custom theme support

### API Design

- [ ] Улучшить типизацию для labels object
- [ ] Создать render props pattern для custom layouts
- [ ] Добавить imperative API для programmatic control
- [ ] Реализовать compound component pattern

### Error Handling

- [ ] Добавить fallback UI при theme provider errors
- [ ] Создать error boundaries для theme operations
- [ ] Реализовать retry logic для failed theme changes
- [ ] Добавить validation для theme values

### Visual Enhancements

- [ ] Добавить theme preview tooltips
- [ ] Создать animated theme transitions
- [ ] Реализовать custom icon sets
- [ ] Добавить loading states для theme changes

### Integration

- [ ] Создать integration с system preferences
- [ ] Добавить analytics tracking для theme usage
- [ ] Реализовать A/B testing support
- [ ] Создать integration с user preference persistence

### Тестирование

- [ ] Добавить unit тесты для theme switching logic
- [ ] Создать accessibility тесты
- [ ] Добавить visual regression тесты для animations
- [ ] Реализовать integration тесты с theme provider

### Documentation

- [ ] Создать comprehensive usage examples
- [ ] Документировать internationalization patterns
- [ ] Добавить customization guidelines
- [ ] Создать integration guide с различными theme systems
