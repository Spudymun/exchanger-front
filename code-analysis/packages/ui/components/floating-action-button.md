# floating-action-button.tsx

## Краткое назначение

Floating Action Button компонент для создания плавающих кнопок действий с поддержкой позиционирования, анимаций, пульсации и интеграцией с z-index системой для важных действий, всегда доступных пользователю.

## Подробное описание

Файл реализует современный FAB компонент с комплексной системой позиционирования (bottom-right/left/center), анимациями появления/исчезновения и специализированными типами пульсации для привлечения внимания. Использует константы из @repo/constants для z-index layers обеспечивая правильное наложение. Интегрируется с базовым Button компонентом из UI системы, расширяя его функциональность для floating context. Поддерживает кастомные отступы через offset props, responsive поведение и accessibility features. Включает безопасную типизацию через TypeScript interfaces и VariantProps от class-variance-authority. Реализует performance оптимизации через константы и helper функции для уменьшения computational overhead. Обеспечивает consistent стилизацию через design system integration.

## Экспортируемые сущности / API

### Основные компоненты

- `FloatingActionButton` - основной FAB компонент с полной функциональностью

### Интерфейсы

- `FloatingActionButtonProps` - comprehensive пропсы с позиционированием и анимациями

### Константы

- `POSITION_KEYS` - именованные ключи для позиций (bottom-right/left/center)
- `POSITION_CLASSES` - CSS классы для каждой позиции
- `PULSE_ANIMATION_CLASSES` - анимации пульсации (slow/normal/fast/attention)

### Утилиты

- `createOffsetStyles` - функция создания кастомных отступов
- `createContainerClasses` - функция сборки CSS классов контейнера

### Props Configuration

- `show` - показ/скрытие кнопки
- `position` - позиция на экране
- `offset` - кастомные отступы от краев
- `animate` - включение transition анимаций
- `pulse` - пульсация для привлечения внимания
- `pulseType` - тип пульсации

## Зависимости

### Внешние пакеты

- `@repo/constants` - Z_INDEX_LAYERS для правильного layering
- `class-variance-authority` - VariantProps для типизации
- `react` - базовые React типы и API

### Внутренние зависимости

- `../lib/utils` - utility функция `cn` для conditional classnames
- `./ui/button` - базовый Button компонент и buttonVariants

### CSS системы

- Использует design system CSS переменные через Button integration
- Tailwind CSS классы для позиционирования и анимаций
- Custom анимации heartbeat-\* из tailwind config

## Возможные риски и проблемы

### Производительность

- Inline style calculations на каждый render для offset
- Потенциальные проблемы с z-index conflicts в сложных layouts
- Анимации могут влиять на performance на слабых устройствах
- Отсутствие motion-reduce поддержки для accessibility

### Позиционирование

- Fixed positioning может конфликтовать с sticky элементами
- Нет проверки viewport boundaries для offset values
- Возможные проблемы с responsive layouts
- Недостаточная поддержка complex positioning scenarios

### Accessibility

- Отсутствует ARIA labeling для floating context
- Keyboard navigation может быть затруднена
- Screen reader поддержка может быть недостаточной
- Нет focus management для show/hide transitions

### Типизация

- Слабая типизация для offset values (нет validation)
- Position keys type safety может быть улучшена
- Отсутствие runtime validation для props

### State Management

- Нет built-in state management для show/hide logic
- Отсутствие debouncing для frequent show/hide changes
- Нет persistence для user preferences

## TODO и предложения по улучшению

### Производительность

- [ ] Добавить React.memo для оптимизации re-renders
- [ ] Мемоизировать offset styles calculations
- [ ] Реализовать prefers-reduced-motion support
- [ ] Оптимизировать анимации для мобильных устройств

### Позиционирование

- [ ] Добавить viewport boundary detection
- [ ] Реализовать smart positioning с collision detection
- [ ] Создать support для custom positioning через CSS coordinates
- [ ] Добавить responsive positioning configurations

### Accessibility

- [ ] Реализовать полную ARIA поддержку
- [ ] Добавить keyboard navigation support
- [ ] Улучшить screen reader announcements
- [ ] Создать focus trap для modal-like behavior

### Функциональность

- [ ] Добавить support для multiple FABs coordination
- [ ] Реализовать expandable FAB patterns
- [ ] Создать integration с notification system
- [ ] Добавить gesture support для mobile

### State Management

- [ ] Создать built-in state management hooks
- [ ] Добавить debouncing для animations
- [ ] Реализовать persistence layer
- [ ] Создать global FAB coordination system

### API Design

- [ ] Улучшить типизацию с branded types
- [ ] Добавить render props поддержку
- [ ] Создать imperative API для programmatic control
- [ ] Реализовать compound component pattern для expandable FABs

### Стилизация

- [ ] Добавить more animation presets
- [ ] Создать theming support для colors
- [ ] Реализовать size variants system
- [ ] Добавить custom shape support

### Интеграция

- [ ] Создать integration с router для navigation FABs
- [ ] Добавить analytics tracking
- [ ] Реализовать permission-based visibility
- [ ] Создать integration с form systems

### Тестирование

- [ ] Добавить unit тесты для positioning logic
- [ ] Создать visual regression тесты для animations
- [ ] Добавить accessibility тесты
- [ ] Реализовать performance benchmarks

### Документация

- [ ] Создать comprehensive usage examples
- [ ] Документировать positioning best practices
- [ ] Добавить animation guidelines
- [ ] Создать troubleshooting guide для common issues
