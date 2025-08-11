# theme-provider.tsx

## Краткое назначение

Реализует React provider для управления темой приложения с поддержкой темной/светлой темы и системных настроек, интегрированный с глобальным UI store для централизованного управления состоянием темы и синхронизации с DOM.

## Подробное описание

Файл предоставляет комплексную систему управления темой с поддержкой трех режимов: light, dark, и system. Использует React Context API для предоставления состояния темы дочерним компонентам. Интегрируется с useUIStore из хуков для централизованного управления состоянием темы. Реализует автоматическое отслеживание системных настроек цветовой схемы через matchMedia API. Обеспечивает правильную синхронизацию состояния с DOM классами для CSS стилизации. Включает обработку SSR через suppressHydrationWarning для предотвращения hydration mismatch. Предоставляет инициализацию и управление resolvedTheme для определения актуальной темы. Реализует type-safe контекст с proper error handling для использования вне провайдера.

## Экспортируемые сущности / API

### Компоненты

- `ThemeProvider` - основной provider компонент для оборачивания приложения
- `useTheme` - хук для доступа к состоянию и методам управления темой

### Интерфейсы

- `ThemeContextType` - тип для значения theme context

### Внутренние функции

- `getSystemPreference` - получение системной цветовой схемы
- `resolveTheme` - разрешение theme mode в конкретную тему
- `applyThemeToDOM` - применение темы к DOM элементам

### Константы

- `DARK_THEME`, `LIGHT_THEME` - строковые константы тем
- `ThemeContext` - React context для темы

## Зависимости

### Внешние импорты

- `@repo/constants` - THEME_MODES константы и ThemeMode тип
- `@repo/hooks/src/client-hooks` - useUIStore для состояния UI
- `react` - React hooks и createContext

### Внутренние связи

- Использует useUIStore для централизованного управления темой
- Интегрируется с THEME_MODES из constants пакета
- Синхронизируется с CSS классами в DOM

## Возможные риски и проблемы

### Производительность

- Множественные useEffect могут вызывать лишние re-renders
- matchMedia listener может утекать при неправильной очистке
- DOM манипуляции на каждое изменение темы

### SSR/Hydration

- window доступ может вызывать SSR ошибки без проверок
- Hydration mismatch при различии server/client theme preferences
- suppressHydrationWarning может скрывать реальные проблемы

### Состояние

- Дублирование состояния между context и useUIStore
- Race conditions при инициализации темы
- Потенциальные проблемы с system theme detection

### Безопасность

- Отсутствие валидации theme values
- Возможные XSS через DOM manipulation

## TODO и предложения по улучшению

### Рефакторинг

- [ ] Упростить логику инициализации в одном useEffect
- [ ] Мемоизировать getSystemPreference для производительности
- [ ] Добавить debounce для system theme changes
- [ ] Вынести DOM manipulation в отдельный хук

### Типизация

- [ ] Добавить строгую валидацию ThemeMode values
- [ ] Создать branded types для resolved themes
- [ ] Добавить JSDoc документацию для всех функций

### Производительность

- [ ] Использовать useCallback для стабильных ссылок
- [ ] Оптимизировать re-renders через React.memo
- [ ] Добавить lazy initialization для system preferences

### Функциональность

- [ ] Добавить persistence theme preference в localStorage
- [ ] Реализовать transition effects между темами
- [ ] Добавить support для custom theme colors
- [ ] Создать hook для theme-aware CSS variables

### Безопасность

- [ ] Добавить CSP-safe CSS injection
- [ ] Валидировать theme values перед DOM updates
- [ ] Добавить error boundaries для theme provider

### Тестирование

- [ ] Покрыть все scenarios unit тестами
- [ ] Добавить integration тесты с useUIStore
- [ ] Протестировать SSR behavior
- [ ] Добавить performance benchmarks

### Документация

- [ ] Создать usage examples для разных scenarios
- [ ] Документировать SSR considerations
- [ ] Добавить migration guide от старых theme solutions
