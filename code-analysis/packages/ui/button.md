# button.tsx

## Краткое назначение

Базовый демонстрационный Button компонент с простой логикой логирования, предназначенный для тестирования и начального развития UI библиотеки в multi-app архитектуре ExchangeGO.

## Подробное описание

Файл содержит простой client-side React компонент Button с минимальной функциональностью для демонстрации работы UI пакета. Компонент принимает children для content, className для стилизации и обязательный appName prop для идентификации приложения. Использует useCallback для оптимизации handleClick функции и предотвращения лишних re-renders. Реализует console.log вместо alert для лучшего UX. Помечен как 'use client' для Next.js App Router compatibility. Представляет собой proof-of-concept компонент, который должен быть заменен полноценной button implementation с вариантами, размерами и состояниями.

## Экспортируемые сущности / API

### Компоненты

- `Button` - основной button компонент

### Интерфейсы

- `ButtonProps` - типы props для Button компонента
  - `children: ReactNode` - содержимое кнопки
  - `className?: string` - CSS классы для стилизации
  - `appName: string` - обязательное имя приложения для логирования

### Функциональность

- Логирование клика с именем приложения
- Поддержка custom styling через className
- Базовая accessibility с proper button type

## Зависимости

### Внешние импорты

- `react` - ReactNode, useCallback hooks

### Browser APIs

- `console.log` для демонстрационного функционала

## Возможные риски и проблемы

### Функциональность

- Отсутствие реальной button functionality
- Нет поддержки disabled состояния
- Отсутствие button variants (primary, secondary, etc.)
- Нет size variants и proper styling system

### Accessibility

- Отсутствие ARIA attributes
- Нет focus management
- Отсутствие keyboard navigation support
- Нет screen reader optimizations

### Performance

- useCallback может быть избыточным для такой простой логики
- Отсутствие memo optimization для компонента

### Architecture

- Демонстрационный код в production package
- Отсутствие integration с design system
- Нет соответствия UI patterns других компонентов

### Developer Experience

- Обязательный appName prop усложняет использование
- Отсутствие TypeScript strict typing
- Нет JSDoc documentation

## TODO и предложения по улучшению

### Полная замена

- [ ] Заменить на полноценную button implementation
- [ ] Интегрировать с design system из @repo/design-tokens
- [ ] Добавить button variants (primary, secondary, destructive, ghost)
- [ ] Реализовать size system (sm, md, lg, icon)

### Функциональность

- [ ] Добавить disabled состояние и loading state
- [ ] Реализовать proper onClick handling без demo логики
- [ ] Добавить support для as prop (polymorphic component)
- [ ] Создать forwarded refs для proper DOM access

### Стилизация

- [ ] Интегрировать с Tailwind variants через cva
- [ ] Добавить CSS-in-JS solution или styled-components
- [ ] Реализовать theme-aware styling
- [ ] Создать consistent spacing и typography

### Accessibility

- [ ] Добавить proper ARIA attributes и roles
- [ ] Реализовать focus management и keyboard support
- [ ] Добавить screen reader friendly descriptions
- [ ] Создать high contrast mode support

### TypeScript

- [ ] Улучшить типизацию с generic constraints
- [ ] Добавить строгую validation для props
- [ ] Создать utility types для button variants
- [ ] Реализовать proper type inference

### Testing

- [ ] Добавить comprehensive unit тесты
- [ ] Создать accessibility тесты
- [ ] Реализовать visual regression тесты
- [ ] Добавить performance benchmarks

### Documentation

- [ ] Создать Storybook stories для всех variants
- [ ] Добавить usage examples и best practices
- [ ] Документировать design system integration
- [ ] Описать accessibility features

### Integration

- [ ] Интегрировать с form libraries (react-hook-form)
- [ ] Добавить support для icon components
- [ ] Создать composite button patterns
- [ ] Реализовать loading и pending states
