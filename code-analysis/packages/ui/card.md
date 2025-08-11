# card.tsx

## Краткое назначение

Базовый демонстрационный Card компонент для создания ссылочных карточек с title и content, предназначенный для начального развития UI библиотеки, с встроенными utm параметрами для tracking.

## Подробное описание

Файл содержит простой React компонент Card, который представляет собой ссылку с заголовком и контентом. Компонент автоматически добавляет utm параметры (source=create-turbo, medium=basic, campaign=create-turbo) для отслеживания переходов. Использует target="\_blank" для открытия в новой вкладке и rel="noopener noreferrer" для безопасности. Включает стрелку (->) в заголовке для визуального указания на ссылку. Представляет собой temporary implementation для демонстрации и должен быть заменен полноценной card component system с различными вариантами и композицией.

## Экспортируемые сущности / API

### Компоненты

- `Card` - основной card компонент как ссылка

### Props Interface

- `className?: string` - CSS классы для кастомизации
- `title: string` - обязательный заголовок карточки
- `children: React.ReactNode` - содержимое карточки (описание)
- `href: string` - обязательная ссылка для навигации

### Особенности

- Автоматические utm параметры для tracking
- Внешние ссылки с security measures
- Встроенная стрелка в заголовке

## Зависимости

### Внешние импорты

- `react` - JSX типы и React.ReactNode

### Browser APIs

- Стандартные anchor элементы и navigation

## Возможные риски и проблемы

### Architecture

- Демонстрационный компонент в production package
- Hardcoded utm параметры не подходят для всех use cases
- Компонент привязан к ссылочной функциональности

### Flexibility

- Отсутствие вариантов карточек (interactive, static, etc.)
- Нет композиционных sub-components (Header, Content, Footer)
- Жесткая структура с title и children

### Accessibility

- Отсутствие ARIA labels и descriptions
- Нет keyboard navigation improvements
- Отсутствие focus management

### Security

- utm параметры могут раскрывать internal tracking
- Отсутствие URL validation для href prop
- Потенциальные XSS риски без sanitization

### SEO и Analytics

- Hardcoded utm параметры влияют на все использования
- Отсутствие flexibility для различных campaigns
- Нет support для internal links

## TODO и предложения по улучшению

### Полная переработка

- [ ] Создать композиционную card system с sub-components
- [ ] Реализовать варианты карточек (link, interactive, static)
- [ ] Добавить Header, Content, Footer composition pattern
- [ ] Интегрировать с design system

### Функциональность

- [ ] Сделать utm параметры опциональными и configurable
- [ ] Добавить support для internal navigation (Next.js Link)
- [ ] Реализовать click tracking без hardcoded parameters
- [ ] Создать polymorphic component (as prop)

### Стилизация

- [ ] Интегрировать с Tailwind CSS variants
- [ ] Добавить theme-aware styling
- [ ] Реализовать hover и focus states
- [ ] Создать size variants и spacing system

### Accessibility

- [ ] Добавить proper ARIA attributes
- [ ] Реализовать keyboard navigation support
- [ ] Добавить screen reader optimizations
- [ ] Создать focus ring и contrast compliance

### Security

- [ ] Добавить URL validation и sanitization
- [ ] Реализовать CSP-compliant link handling
- [ ] Добавить option для internal vs external links
- [ ] Создать safe defaults для rel attributes

### TypeScript

- [ ] Улучшить типизацию с union types для variants
- [ ] Добавить generic props для polymorphic behavior
- [ ] Создать strict validation для href prop
- [ ] Реализовать proper type inference

### Composition Pattern

- [ ] Создать CardHeader, CardContent, CardFooter components
- [ ] Реализовать compound component pattern
- [ ] Добавить context для sharing state
- [ ] Создать flexible layout system

### Testing

- [ ] Добавить unit тесты для всех variants
- [ ] Создать accessibility тесты
- [ ] Реализовать interaction тесты
- [ ] Добавить visual regression тесты

### Documentation

- [ ] Создать Storybook stories для patterns
- [ ] Добавить usage examples для различных cases
- [ ] Документировать composition patterns
- [ ] Описать accessibility features

### Integration

- [ ] Интегрировать с routing libraries
- [ ] Добавить analytics integration points
- [ ] Создать SEO optimization features
- [ ] Реализовать loading states
