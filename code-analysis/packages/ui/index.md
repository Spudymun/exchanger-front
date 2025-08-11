# index.ts (UI Package)

## Краткое назначение

Основной entry point для пакета UI компонентов, предоставляющий centralized re-export всех UI элементов, compound components, utility функций и стилей для использования в приложениях экосистемы ExchangeGO.

## Подробное описание

Файл служит единой точкой доступа к компонентной библиотеке UI, организуя экспорты по категориям функциональности. Включает базовые UI компоненты (Button, Card, Dialog, Form элементы), compound components с паттерном composition (ExchangeForm, DataTable, AdminPanel, Header, Footer), authentication компоненты, adaptive container system и utility функции. Автоматически подключает глобальные стили через CSS import. Обеспечивает type-safe exports с полной TypeScript типизацией для всех компонентов и их props. Реализует barrel export pattern для упрощения импортов в consuming приложениях. Включает специализированные компоненты для криптообмена, административной панели и адаптивной системы контейнеров.

## Экспортируемые сущности / API

### UI Components (Basic)

- **Button**: `Button`, `buttonVariants`
- **Card**: `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`
- **Dialog**: полный набор dialog components с overlay и triggers
- **DropdownMenu**: все варианты dropdown menu components
- **Form**: `Input`, `Label`, `Textarea`, `FormField`, `FormLabel`, `FormControl`, `FormMessage`
- **Table**: полный table component set
- **Select**: все select components с scroll buttons
- **Notification**: `Notification`, `notificationVariants`
- **Spinner**: `Spinner`, `SpinnerOverlay`, `InlineSpinner` с variants

### Compound Components

- **ExchangeForm**: полная exchange form composition с context
- **DataTable**: новая compound версия data table с filters и pagination
- **AdminPanel**: административная панель с layout и stats
- **Header**: header component composition с navigation и theme
- **Footer**: footer layout с sections и social links

### Specialized Components

- **Auth**: специализированные поля для authentication
- **ThemeToggle**: переключатель темы
- **MathCaptcha**: математическая captcha
- **FloatingActionButton**: FAB component
- **TreeView**: древовидная структура данных

### Adaptive System

- **AdaptiveContainer**: система адаптивных контейнеров с presets

### Utils & Styles

- **Utils**: `cn` utility, `shared-styles`
- **Styles**: автоматический импорт `globals.css`

## Зависимости

### Внутренние компоненты

- `./components` - все UI компоненты
- `./lib/utils` - utility функции
- `./lib/shared-styles` - общие стили
- `./styles/globals.css` - глобальные стили

### Внешние зависимости

- Все компоненты зависят от их собственных dependencies
- TypeScript для типизации
- CSS/Tailwind для стилизации

## Возможные риски и проблемы

### Bundle Size

- Barrel exports могут увеличивать bundle size при неправильном tree shaking
- Глобальные стили загружаются автоматически
- Все compound components экспортируются даже если не используются

### Dependencies

- Изменения в любом компоненте влияют на этот index
- Circular dependency risks при неправильной организации
- Version compatibility между внутренними компонентами

### Типизация

- Потенциальные type conflicts при export name collisions
- Complexity в поддержке всех exported types
- Breaking changes в component props влияют на exports

### Maintenance

- Большое количество exports усложняет рефакторинг
- Необходимость синхронизации с изменениями в компонентах
- Potential for outdated or missing exports

## TODO и предложения по улучшению

### Bundle Optimization

- [ ] Реализовать tree-shakeable exports структуру
- [ ] Добавить conditional CSS imports
- [ ] Создать separate entry points для больших compound components
- [ ] Оптимизировать re-export patterns

### Documentation

- [ ] Добавить JSDoc для всех exported entities
- [ ] Создать component catalog documentation
- [ ] Добавить usage examples в комментариях
- [ ] Документировать compound component patterns

### Organization

- [ ] Группировать exports по functional areas
- [ ] Создать sub-exports для specialized domains
- [ ] Добавить deprecated exports tracking
- [ ] Реализовать version-aware exports

### Developer Experience

- [ ] Добавить TypeScript strict exports validation
- [ ] Создать automated export verification
- [ ] Реализовать component usage analytics
- [ ] Добавить development-time warnings для deprecated exports

### Testing

- [ ] Unit тесты для export completeness
- [ ] Integration тесты для compound components
- [ ] Performance тесты для bundle size impact
- [ ] Type checking для all exported interfaces

### Architecture

- [ ] Разделить на domain-specific sub-packages
- [ ] Создать plugin-based component loading
- [ ] Реализовать dynamic imports для heavy components
- [ ] Добавить component registry system
