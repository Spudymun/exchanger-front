# header-compound.tsx

## Краткое назначение

Compound компонент для создания header'ов с поддержкой navigation, mobile menu, language switching, user authentication и theme toggle, реализующий архитектуру Compound Components v2.0 для максимальной композиции и переиспользования.

## Подробное описание

Файл реализует комплексную систему header компонентов с React Context для управления состоянием navigation (menu state, locale, authentication, user data). Предоставляет модульные компоненты: Root (основной header с context), Container (layout варианты), Logo (логотип область), Navigation (desktop navigation), Actions (action buttons с enhancement), MobileMenu (hamburger menu), LanguageSwitcher (EN/RU переключатель), UserMenu (authentication UI), WithTheme (preset с theme toggle). Использует external helper functions из lib/header-helpers для enhancement patterns. Включает sticky positioning, z-index management и responsive design. Реализует accessibility features с proper ARIA attributes и semantic HTML. Обеспечивает consistent integration с design system и theme providers.

## Экспортируемые сущности / API

### Основные компоненты

- `HeaderCompound` - объединенный compound компонент со всеми дочерними
- `Root` (Header) - корневой header с React Context провайдером
- `Container` - layout контейнер с вариантами (default/fluid/compact)
- `Logo` - область логотипа с flex layout
- `Navigation` - desktop navigation с hidden mobile behavior
- `Actions` - action buttons с context enhancement
- `MobileMenu` - hamburger menu с toggle state
- `LanguageSwitcher` - EN/RU language переключатель
- `UserMenu` - authentication UI с conditional rendering
- `WithTheme` - предустановленный header с theme toggle

### Hooks

- `useHeaderContext()` - доступ к header контексту

### Интерфейсы

- `HeaderContextValue` - типизированный контекст header (external)
- `HeaderProps` - пропсы корневого компонента с callbacks
- `ContainerProps`, `LogoProps`, `NavigationProps` - layout компоненты
- `ActionsProps`, `MobileMenuProps` - interactive компоненты
- `LanguageSwitcherProps`, `UserMenuProps` - specialized функциональность
- `WithThemeProps` - preset компонент

### Context Properties

- `isMenuOpen` - состояние mobile menu
- `currentLocale` - текущий язык (en/ru)
- `isAuthenticated` - статус аутентификации
- `userName` - имя пользователя
- `onToggleMenu`, `onLocaleChange`, `onSignIn`, `onSignOut` - callbacks

### Утилиты

- `enhanceChildWithContext` - external enhancement function
- `FLEX_ITEMS_CENTER_SPACE_X_2` - reusable CSS class constant

## Зависимости

### Внутренние зависимости

- `../lib/header-helpers` - enhanceChildWithContext function
- `../lib/header-types` - HeaderContextValue interface
- `../lib/utils` - utility функция `cn` для conditional classnames
- `./theme-toggle` - ThemeToggle компонент для WithTheme preset
- `./ui/button` - базовый Button компонент

### External Architecture

- Использует external helper files для separation of concerns
- Типы вынесены в separate file для better organization
- Enhancement logic externalized для reusability

### UI системы

- Использует design system CSS переменные (--background, --border)
- Sticky positioning с z-index management
- Responsive design через Tailwind breakpoints

## Возможные риски и проблемы

### Architecture Complexity

- Зависимость от external helper files увеличивает complexity
- Split между header-compound и helper files может затруднять понимание
- Context API с множественными properties может приводить к excessive re-renders

### Performance

- Context re-renders при любом изменении header state
- Enhancement patterns через React.cloneElement на каждый render
- Отсутствие мемоизации для context value
- Mobile menu toggle может вызывать layout shifts

### Типизация

- External типы могут быть не синхронизированы с implementation
- Enhancement patterns имеют слабую типизацию
- Возможная потеря type safety при external helper usage

### State Management

- Вся navigation state находится в React Context без persistence
- Отсутствие URL synchronization для menu state
- Нет debouncing для rapid menu toggles

### Mobile Experience

- Mobile menu implementation может быть недостаточно sophisticated
- Отсутствие gesture support для menu operations
- Limited customization для mobile layouts

## TODO и предложения по улучшению

### Architecture

- [ ] Рассмотреть consolidation helper functions обратно в компонент
- [ ] Добавить code splitting для mobile menu functionality
- [ ] Создать plugin system для header extensions
- [ ] Реализовать composition patterns без external dependencies

### Performance

- [ ] Добавить React.memo для всех header компонентов
- [ ] Реализовать useMemo для context value
- [ ] Мемоизировать enhancement operations
- [ ] Оптимизировать re-renders через selective context subscriptions

### State Management

- [ ] Добавить URL state synchronization
- [ ] Реализовать persistence для user preferences
- [ ] Создать reducer pattern для complex state operations
- [ ] Добавить optimistic updates для user operations

### Mobile Experience

- [ ] Улучшить mobile menu с animation support
- [ ] Добавить gesture recognition для menu operations
- [ ] Создать responsive navigation patterns
- [ ] Реализовать touch-friendly interaction areas

### Функциональность

- [ ] Добавить search functionality integration
- [ ] Создать notification badges для user menu
- [ ] Реализовать breadcrumb navigation support
- [ ] Добавить keyboard shortcuts для navigation

### Accessibility

- [ ] Улучшить ARIA labeling для complex navigation
- [ ] Добавить focus management для menu operations
- [ ] Реализовать skip links functionality
- [ ] Создать high contrast mode support

### Internationalization

- [ ] Расширить language support beyond EN/RU
- [ ] Добавить RTL language support
- [ ] Создать dynamic language loading
- [ ] Реализовать locale-specific formatting

### Integration

- [ ] Создать router integration для active navigation states
- [ ] Добавить analytics tracking для navigation events
- [ ] Реализовать permission-based navigation visibility
- [ ] Создать CMS integration для dynamic navigation

### API Design

- [ ] Улучшить типизацию с branded types
- [ ] Создать declarative navigation configuration
- [ ] Добавить render props поддержку для custom content
- [ ] Реализовать imperative API для programmatic control

### Тестирование

- [ ] Добавить unit тесты для всех header компонентов
- [ ] Создать integration тесты для navigation workflows
- [ ] Добавить accessibility тесты
- [ ] Реализовать visual regression тесты для responsive behavior

### Документация

- [ ] Создать comprehensive header examples
- [ ] Документировать integration patterns с external helpers
- [ ] Добавить customization guidelines
- [ ] Создать migration guide для legacy headers
