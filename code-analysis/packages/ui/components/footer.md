# footer.tsx

## Краткое назначение

Простые статичные footer компоненты без context API, предоставляющие базовую функциональность для создания footers с секциями, ссылками, социальными медиа и правовой информацией в качестве альтернативы compound архитектуре.

## Подробное описание

Файл реализует набор простых footer компонентов без сложной context архитектуры, предназначенных для случаев когда не требуется глубокая интеграция и enhancement functionality. Включает базовые компоненты: Footer (основной контейнер), FooterSection (секции с заголовками), FooterLink (навигационные ссылки), FooterSocial (социальные ссылки), FooterCompanyInfo (информация компании), FooterLegal (правовая информация), FooterLayout (предустановленный grid layout). Каждый компонент является self-contained без зависимостей от shared context. Использует forwardRef для proper ref handling и semantic HTML с accessibility features. Предоставляет простую альтернативу для быстрого прототипирования и простых use cases где compound architecture может быть избыточной.

## Экспортируемые сущности / API

### Основные компоненты

- `Footer` - основной footer контейнер с semantic HTML
- `FooterSection` - секции с опциональными заголовками
- `FooterLink` - навигационные ссылки с external link support
- `FooterSocial` - социальные ссылки с icon поддержкой
- `FooterCompanyInfo` - информация о компании с contact details
- `FooterLegal` - правовая информация с copyright и legal links
- `FooterLayout` - предустановленный 4-column responsive grid

### Интерфейсы

- `FooterProps` - базовые пропсы для main footer
- `FooterSectionProps` - секции с title поддержкой
- `FooterLinkProps` - ссылки с external flags
- `FooterSocialProps` - массив социальных ссылок с icons
- `FooterCompanyInfoProps` - структурированная информация компании
- `FooterLegalProps` - массив legal links

### Особенности

- Прямое использование без context setup
- Self-contained компоненты без shared state
- Static content с минимальными dependencies
- Hardcoded company name "ExchangeGO"
- Current year calculation в FooterLegal

## Зависимости

### Внутренние зависимости

- `../lib/utils` - utility функция `cn` для conditional classnames
- `./ui/button` - базовый Button компонент для social links
- `react` - базовые React типы и forwardRef

### UI системы

- Использует design system CSS переменные (--background, --border, --foreground)
- Responsive design через Tailwind breakpoints
- Semantic HTML с proper ARIA roles

### Архитектурные отличия

- НЕ использует Context API в отличие от footer-compound
- НЕ включает enhancement patterns
- НЕ имеет dynamic theming capabilities

## Возможные риски и проблемы

### Ограниченная функциональность

- Отсутствие dynamic content capabilities
- Hardcoded values (company name, styling)
- Нет shared state между компонентами
- Ограниченная customization без prop drilling

### Maintainability

- Дублирование логики с footer-compound
- Нет centralized configuration
- Изменения требуют updates в multiple places
- Несоответствие с compound architecture patterns проекта

### Типизация

- Базовая типизация без advanced constraints
- Отсутствие validation для social links structure
- Нет type safety для contact information formats

### Accessibility

- Базовая ARIA поддержка без advanced features
- Отсутствие keyboard navigation enhancements
- Ограниченная screen reader optimization

### Состояние проекта

- Возможная redundancy с footer-compound
- Unclear use cases где простые компоненты предпочтительнее
- Потенциальная confusion между двумя footer systems

## TODO и предложения по улучшению

### Архитектурное решение

- [ ] Определить четкие use cases для простых vs compound footers
- [ ] Рассмотреть consolidation в единую систему
- [ ] Создать migration path между простыми и compound компонентами
- [ ] Документировать когда использовать каждый подход

### Функциональность

- [ ] Добавить basic theming поддержку без context
- [ ] Реализовать configuration через props
- [ ] Создать preset layouts для common use cases
- [ ] Добавить internationalization поддержку

### Типизация

- [ ] Улучшить типизацию social links с icon constraints
- [ ] Добавить validation для contact information
- [ ] Создать branded types для legal links
- [ ] Реализовать generic types для content customization

### Performance

- [ ] Добавить React.memo для static content
- [ ] Мемоизировать social links rendering
- [ ] Оптимизировать re-renders для date calculations

### Consistency

- [ ] Синхронизировать API с footer-compound где возможно
- [ ] Стандартизировать naming conventions
- [ ] Унифицировать styling approaches
- [ ] Создать shared utilities между системами

### Accessibility

- [ ] Улучшить ARIA labeling
- [ ] Добавить keyboard navigation поддержку
- [ ] Реализовать skip links functionality
- [ ] Создать high contrast mode support

### Configuration

- [ ] Вынести hardcoded values в props или constants
- [ ] Создать default configuration system
- [ ] Добавить preset configurations
- [ ] Реализовать theme variants

### Documentation

- [ ] Создать clear usage guidelines
- [ ] Документировать differences от compound version
- [ ] Добавить migration examples
- [ ] Описать performance implications

### Testing

- [ ] Добавить unit тесты для каждого компонента
- [ ] Создать accessibility тесты
- [ ] Добавить visual regression тесты
- [ ] Реализовать comparison тесты с compound version

### Refactoring Options

- [ ] Рассмотреть удаление в пользу compound architecture
- [ ] Создать простой wrapper над compound components
- [ ] Реализовать как preset configurations для compound system
- [ ] Maintain as legacy support с clear deprecation path
