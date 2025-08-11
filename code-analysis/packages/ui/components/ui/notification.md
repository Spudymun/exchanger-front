# notification.tsx

## Краткое назначение

Comprehensive Notification компонент с variant system, icon integration, accessibility optimization и modular helper functions для user feedback scenarios.

## Подробное описание

Файл реализует sophisticated notification component с comprehensive variant system и accessibility-first design. Основной Notification component обеспечивает flexible user feedback через variant-based styling (default, success, error, warning, info) с automatic icon mapping и color coordination. Включает modular helper functions для reducing component complexity: renderIcon для conditional icon display, renderContent для title/description/children hierarchy, и renderCloseButton для dismissible functionality. Реализует comprehensive accessibility через proper ARIA roles (role="alert"), live regions (aria-live="assertive"), atomic announcements (aria-atomic="true"), и semantic button labeling. Поддерживает extensive customization через size variants (default/sm/lg), icon visibility control, closable behavior, и custom close labels. Обеспечивает consistent theming через cva-based variant systems с dark mode support и semantic color variables. Включает transition animations для smooth user experience.

## Экспортируемые сущности / API

### Основные компоненты

- `Notification` - main notification display component
- `notificationVariants` - cva function для styling variants

### Variant Systems

- Notification variants: default, success, error, warning, info
- Size variants: default, sm, lg
- Icon variants с automatic color coordination
- Consistent theming across variants

### Props API

- `title` - optional heading text
- `description` - optional body text
- `onClose` - close callback function
- `showIcon` - icon visibility control (default: true)
- `closable` - dismissible behavior control (default: true)
- `closeLabel` - accessibility label для close button
- `children` - fallback content when title/description absent

### Icon Integration

- Automatic icon mapping по variant type
- Lucide React icons (CheckCircle, AlertCircle, etc.)
- Size-responsive icon scaling
- Proper ARIA hidden attributes

### Accessibility Features

- `role="alert"` для immediate announcements
- `aria-live="assertive"` для priority messaging
- `aria-atomic="true"` для complete message reading
- Accessible close button labeling

## Зависимости

### External Libraries

- `class-variance-authority` - cva для variant systems
- `lucide-react` - icons (X, CheckCircle, AlertCircle, Info, AlertTriangle)

### Internal Dependencies

- `../../lib/utils` - cn utility для class merging
- React для forwardRef и component definition

### CSS Dependencies

- Comprehensive color system с dark mode variants
- Transition animations для smooth interactions
- Flexible sizing system
- Border, background, text color coordination

## Возможные риски и проблемы

### Accessibility Concerns

- aria-live="assertive" может be too aggressive для some use cases
- Multiple notifications могут overwhelm screen readers
- Color-only differentiation для variant types
- Close button accessibility в different contexts

### Performance

- Complex variant calculations на каждый render
- Icon component loading для each notification
- CSS transition animations на low-end devices
- Helper function calls overhead

### User Experience

- No auto-dismiss functionality
- Missing stacking/queue management
- No position/placement controls
- Limited animation customization

### Variant System Complexity

- Large color palette maintenance
- Dark mode synchronization requirements
- Variant consistency между different contexts
- Theme customization limitations

### Type Safety

- Variant union types могут become restrictive
- Helper function parameter typing
- Icon component type inference
- Props spreading type safety

## TODO и предложения по улучшению

### Accessibility Enhancement

- [ ] Добавить aria-live level options (polite vs assertive)
- [ ] Создать screen reader message customization
- [ ] Реализовать keyboard navigation для close buttons
- [ ] Добавить high contrast mode support

### Auto-Dismiss Features

- [ ] Добавить automatic timeout functionality
- [ ] Создать pause-on-hover behavior
- [ ] Реализовать progress indicators
- [ ] Добавить dismiss delay customization

### Animation System

- [ ] Добавить enter/exit animations
- [ ] Создать animation variant options
- [ ] Реализовать reduced motion support
- [ ] Добавить gesture-based dismissal

### Stacking Management

- [ ] Создать notification queue system
- [ ] Добавить position management (top, bottom, corners)
- [ ] Реализовать z-index management
- [ ] Добавить max notifications limit

### Variant Enhancement

- [ ] Добавить custom variant creation
- [ ] Создать theme-aware variants
- [ ] Реализовать gradient variants
- [ ] Добавить compound variants

### Performance Optimization

- [ ] Мемоизировать helper functions
- [ ] Оптимизировать icon loading
- [ ] Добавить React.memo optimization
- [ ] Создать performance monitoring

### User Experience

- [ ] Добавить action buttons support
- [ ] Создать rich content support
- [ ] Реализовать notification history
- [ ] Добавить undo functionality

### Type Safety

- [ ] Улучшить variant type constraints
- [ ] Добавить strict prop validation
- [ ] Создать type-safe helper functions
- [ ] Реализовать compile-time validation

### Integration

- [ ] Добавить toast notification system integration
- [ ] Создать global notification provider
- [ ] Реализовать state management integration
- [ ] Добавить analytics tracking

### Theme System

- [ ] Расширить theme customization options
- [ ] Добавить custom color palette support
- [ ] Создать brand-specific variants
- [ ] Реализовать automatic theme adaptation

### Error Handling

- [ ] Добавить graceful degradation
- [ ] Создать fallback UI
- [ ] Реализовать error recovery
- [ ] Добавить validation error handling

### Testing

- [ ] Добавить comprehensive unit tests
- [ ] Создать accessibility tests
- [ ] Реализовать visual regression tests
- [ ] Добавить animation tests

### Documentation

- [ ] Создать comprehensive usage examples
- [ ] Документировать accessibility features
- [ ] Добавить theming guides
- [ ] Создать best practices documentation
