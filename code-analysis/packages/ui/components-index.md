# components/index.ts

## Краткое назначение

Централизованный barrel export файл для всех UI компонентов в пакете, организующий экспорты по функциональным категориям и обеспечивающий единую точку импорта для consuming приложений.

## Подробное описание

Файл служит основным entry point для всех компонентов UI библиотеки, организуя exports в логические группы: базовые UI элементы, compound components, specialized компоненты, authentication элементы, layout компоненты и utility функции. Обеспечивает type-safe экспорты с полной TypeScript типизацией для всех компонентов, их props interfaces и context hooks. Реализует compound component pattern exports с множественными named exports для composition patterns. Включает re-exports для utility функций и adaptive container system. Организует экспорты по domain areas для лучшей developer experience и maintainability.

## Экспортируемые сущности / API

### Базовые UI Components

- **Form Elements**: Button, Input, Label, Textarea, Select (полные sets)
- **Layout**: Card, Dialog, DropdownMenu, Table components
- **Feedback**: Notification, Spinner variants, MathCaptcha
- **Navigation**: TreeView, FloatingActionButton

### Compound Components

- **ExchangeForm**: полная composition с Root, Container, CardPair, ExchangeCard, FieldWrapper, Arrow, ActionArea + context hook
- **DataTable**: новая compound версия с Root, Container, Header, Filters, Content, TableWrapper, Pagination, CellWrapper + context
- **AdminPanel**: административная панель с Root, Layout, Header, Sidebar, Main, StatsGrid, StatsCard, ContentSection + context
- **Header**: header composition с Root, Container, Logo, Navigation, Actions, MobileMenu, LanguageSwitcher, UserMenu, WithTheme + context
- **Footer**: footer layout с Root, Container, Section, Link, Social, CompanyInfo, Legal, FullLayout + context

### Specialized Components

- **Auth**: специализированные поля (Email, Password, ConfirmPassword, Captcha, SubmitButton, SwitchButton, FormLayout)
- **ThemeToggle**: переключатель темы
- **AdaptiveContainer**: система адаптивных контейнеров с hooks и presets

### Utilities

- **cn**: className utility функция

## Зависимости

### Внутренние компоненты

- `./ui/*` - все базовые UI компоненты
- `./data-table` - legacy data table компонент
- `./floating-action-button` - FAB компонент
- `./tree-view` - древовидная навигация
- `./theme-toggle` - theme switching
- Все compound components со своими sub-components
- `./auth` - authentication компоненты
- `./adaptive-container` - адаптивная система
- `../lib/utils` - utility функции

## Возможные риски и проблемы

### Bundle Size

- Barrel exports могут препятствовать proper tree shaking
- Все compound components загружаются даже если не используются
- Потенциально большой bundle size для simple use cases

### Circular Dependencies

- Риск circular imports между компонентами
- Сложность dependency graph с множественными exports
- Потенциальные проблемы с module resolution

### Maintenance

- Большое количество exports усложняет refactoring
- Необходимость синхронизации с изменениями компонентов
- Version compatibility между различными component versions

### TypeScript

- Сложность type resolution с множественными re-exports
- Потенциальные type conflicts при name collisions
- Performance issues с large type inference

### Developer Experience

- Overwhelming amount of available components
- Difficulty в discovering right component для task
- Potential confusion с legacy vs new component versions

## TODO и предложения по улучшению

### Организация

- [ ] Группировать exports по domain areas в separate files
- [ ] Создать sub-entry points для specialized domains
- [ ] Реализовать conditional exports для tree shaking
- [ ] Добавить deprecation warnings для legacy components

### Bundle Optimization

- [ ] Реализовать tree-shakeable export structure
- [ ] Создать separate entry points для compound components
- [ ] Добавить bundle size monitoring
- [ ] Оптимизировать export patterns

### Documentation

- [ ] Добавить JSDoc для всех exported entities
- [ ] Создать component usage examples
- [ ] Документировать compound component patterns
- [ ] Описать migration paths от legacy к new components

### Developer Experience

- [ ] Добавить component categorization metadata
- [ ] Создать searchable component index
- [ ] Реализовать component discovery tools
- [ ] Добавить usage analytics

### TypeScript

- [ ] Улучшить type inference для compound components
- [ ] Добавить strict export validation
- [ ] Создать automated type testing
- [ ] Реализовать type-safe component composition

### Testing

- [ ] Unit тесты для export completeness
- [ ] Integration тесты для compound component composition
- [ ] Bundle size regression тесты
- [ ] Type checking automation

### Architecture

- [ ] Разделить на domain-specific packages
- [ ] Создать plugin-based component loading
- [ ] Реализовать component registry system
- [ ] Добавить runtime component validation

### Performance

- [ ] Lazy loading для heavy compound components
- [ ] Code splitting strategies
- [ ] Runtime performance monitoring
- [ ] Component usage optimization
