# preset.js

## Краткое назначение

Централизованный Tailwind CSS preset для экосистемы ExchangeGO, устраняющий дублирование 20+ конфигурационных файлов и обеспечивающий единообразную дизайн-систему с интеграцией design-tokens и семантическими CSS переменными.

## Подробное описание

Файл реализует комплексный Tailwind preset, объединяющий все design tokens, цветовые схемы, типографику, анимации и utility классы в единой конфигурации. Использует семантические CSS переменные для автоматической поддержки темизации через hsl(var(--variable)) паттерн. Интегрирует встроенные дизайн токены с brand colors для криптовалют (Bitcoin, Ethereum, USDT). Определяет кастомные анимации с уникальными именами для избежания конфликтов со встроенными Tailwind utilities. Включает специализированные form patterns и exchange card utilities через custom plugin. Обеспечивает consistent spacing system, typography scale и interactive states. Настраивает container, border radius system через CSS переменные и focus ring utilities для accessibility.

## Экспортируемые сущности / API

### Основная конфигурация

- `module.exports` - полная Tailwind CSS конфигурация с preset

### Цветовая система

- **Семантические переменные**: border, input, ring, background, foreground
- **Состояния**: primary, secondary, destructive, success, warning, info
- **Компоненты**: muted, accent, popover, card
- **Brand colors**: bitcoin, ethereum, usdt

### Анимации

- `fade-in`, `slide-up`, `bounce-gentle` - стандартные анимации
- `heartbeat-slow/normal/fast/attention` - кастомные пульсации

### Typography

- **Font families**: Inter (sans), JetBrains Mono (mono)
- **Font sizes**: от xs до 5xl с оптимизированными line-height

### Utility классы

- `.form-container` - стилизация форм с темизацией
- `.exchange-card` - карточки обменников с hover эффектами
- `.interactive-card` - интерактивные элементы
- `.focus-ring` - accessibility focus states

## Зависимости

### Внешние пакеты

- `tailwindcss-animate` - дополнительные анимации

### Внутренние связи

- Интегрируется с design-tokens из `@repo/design-tokens`
- Используется во всех приложениях через preset reference
- Координируется с CSS переменными в theme systems

### CSS переменные

- Зависит от CSS custom properties определенных в глобальных стилях
- Интегрируется с theme provider для динамической темизации

## Возможные риски и проблемы

### Централизация

- Single point of failure для всех Tailwind конфигураций
- Изменения влияют на все приложения одновременно
- Сложность отладки специфичных для приложения проблем

### CSS переменные

- Зависимость от правильной инициализации CSS variables
- Возможные проблемы с SSR если переменные не определены
- Fallback behavior при отсутствии переменных не реализован

### Производительность

- Потенциально избыточные styles для простых приложений
- Bundle size может увеличиваться из-за unused utilities
- Кастомные plugins добавляют дополнительный CSS

### Maintenance

- Необходимость синхронизации с design-tokens changes
- Версионирование изменений preset может быть сложным
- Breaking changes влияют на все consuming приложения

### Совместимость

- Возможные конфликты с application-specific Tailwind config
- Plugin compatibility issues с различными версиями Tailwind
- CSS variable support в старых браузерах

## TODO и предложения по улучшению

### Архитектура

- [ ] Создать versioned preset releases для безопасных updates
- [ ] Разделить preset на modules (colors, animations, utilities)
- [ ] Добавить configuration validation и type safety
- [ ] Реализовать fallback values для CSS переменных

### Design Tokens

- [ ] Автоматическая синхронизация с @repo/design-tokens
- [ ] Build-time generation preset из design tokens
- [ ] Добавить semantic token naming conventions
- [ ] Создать token validation system

### Производительность

- [ ] Implement purging strategies для unused styles
- [ ] Добавить bundle size monitoring
- [ ] Оптимизировать custom plugin performance
- [ ] Создать minimal preset versions для простых cases

### Функциональность

- [ ] Добавить dark mode specific utilities
- [ ] Расширить exchange-specific components
- [ ] Реализовать responsive design tokens
- [ ] Создать animation preset variations

### Developer Experience

- [ ] Добавить TypeScript definitions для config
- [ ] Создать preset documentation и examples
- [ ] Реализовать preset testing framework
- [ ] Добавить development mode с debug utilities

### Тестирование

- [ ] Visual regression тесты для preset changes
- [ ] Cross-browser compatibility тесты
- [ ] Performance impact testing
- [ ] CSS validation тесты

### Документация

- [ ] Создать comprehensive usage guide
- [ ] Документировать migration strategies
- [ ] Добавить troubleshooting guide
- [ ] Описать customization patterns

### Мониторинг

- [ ] Usage analytics для utilities
- [ ] Performance metrics для preset loading
- [ ] Error tracking для CSS variable issues
- [ ] Bundle size tracking per application

### Безопасность

- [ ] CSP compatibility для inline styles
- [ ] Validate CSS injection vectors
- [ ] Secure handling CSS variable values
- [ ] Audit custom plugin security
