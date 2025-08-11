# theme-script.tsx

## Краткое назначение

Компонент для синхронной инициализации темы перед React гидратацией для предотвращения FOIT (Flash of Incorrect Theme), обеспечивающий применение правильной темы к DOM до загрузки React приложения.

## Подробное описание

Файл реализует критически важный компонент для предотвращения мерцания темы при загрузке приложения. ThemeScript генерирует inline JavaScript код, который выполняется синхронно в HTML head до инициализации React. Скрипт читает сохраненную тему из localStorage, валидирует её против допустимых значений, обрабатывает system preference через matchMedia API для темной схемы. Применяет CSS классы к document.documentElement для корректного отображения темы. Включает fallback логику для обработки ошибок с автоматическим переходом к светлой теме. Использует suppressHydrationWarning для корректной работы с SSR. Обеспечивает type-safe и CSP-safe выполнение кода через dangerouslySetInnerHTML.

## Экспортируемые сущности / API

### Компоненты

- `ThemeScript` - основной компонент для inline скрипта инициализации темы

### Особенности реализации

- Синхронное выполнение до React гидратации
- Встроенные THEME_MODES константы для избежания зависимостей
- Автоматическая валидация stored theme values
- Fallback к светлой теме при ошибках

## Зависимости

### Внешние импорты

- Отсутствуют (намеренно для минимизации dependencies)

### Внутренние связи

- Координируется с ThemeProvider для consistency
- Интегрируется с CSS темизацией через DOM классы
- Используется в layout компонентах приложений

### Browser APIs

- `localStorage` для персистентности темы
- `window.matchMedia` для system preference detection
- `document.documentElement` для применения CSS классов

## Возможные риски и проблемы

### CSP (Content Security Policy)

- inline скрипты могут блокироваться строгими CSP правилами
- dangerouslySetInnerHTML требует 'unsafe-inline' в script-src
- Возможное нарушение security policies

### Производительность

- Синхронное выполнение блокирует парсинг HTML
- localStorage access может быть медленным
- matchMedia query в критическом пути загрузки

### Совместимость

- Зависимость от localStorage availability
- matchMedia поддержка в старых браузерах
- document.documentElement access в SSR environment

### Состояние

- Дублирование THEME_MODES констант между файлами
- Потенциальная рассинхронизация с основной логикой темы
- Отсутствие centralized theme constants

### Безопасность

- Выполнение arbitrary JavaScript code
- Потенциальные XSS векторы через localStorage manipulation
- Отсутствие input sanitization

## TODO и предложения по улучшению

### Безопасность

- [ ] Добавить CSP nonce поддержку для inline скриптов
- [ ] Реализовать input validation для localStorage значений
- [ ] Создать secure fallback для environments без localStorage
- [ ] Добавить integrity checks для theme values

### Производительность

- [ ] Минифицировать inline JavaScript код
- [ ] Добавить compression для скрипта
- [ ] Оптимизировать критический путь загрузки
- [ ] Рассмотреть async альтернативы где возможно

### Архитектура

- [ ] Вынести THEME_MODES в shared константы
- [ ] Создать build-time generation скрипта
- [ ] Добавить TypeScript проверки для inline кода
- [ ] Реализовать centralized theme configuration

### Совместимость

- [ ] Добавить polyfills для старых браузеров
- [ ] Создать graceful degradation для environments без JS
- [ ] Тестировать в различных SSR environments
- [ ] Добавить feature detection для APIs

### Функциональность

- [ ] Поддержка custom theme colors
- [ ] Добавить theme transition effects
- [ ] Реализовать theme persistence strategies
- [ ] Создать debug mode для development

### Тестирование

- [ ] E2E тесты для FOIT prevention
- [ ] Unit тесты для inline script logic
- [ ] Performance тесты для критического пути
- [ ] Cross-browser compatibility тесты

### Документация

- [ ] Создать security considerations guide
- [ ] Документировать CSP requirements
- [ ] Добавить troubleshooting guide
- [ ] Описать integration с различными bundlers

### Мониторинг

- [ ] Добавить error reporting для failed theme initialization
- [ ] Метрики производительности для theme loading
- [ ] Analytics для theme preference distribution
- [ ] Monitoring для CSP violations
