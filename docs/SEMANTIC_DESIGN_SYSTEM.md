# ExchangeGO Semantic Design System v2.0

## Обзор

Обновленная дизайн-система ExchangeGO основана на семантических токенах, которые автоматически адаптируются к светлой и темной темам. Это обеспечивает правильное отображение сложных компонентов интерфейса во всех условиях.

## Ключевые принципы

### 1. Семантические токены

Вместо хардкодинга цветов используем семантические CSS-переменные:

- `bg-card` → автоматически белый в светлой теме, темный в темной
- `text-foreground` → автоматически черный/белый
- `border-border` → правильный контраст в любой теме

### 2. Правильная иерархия

- **Поверхности**: page → card → muted → accent
- **Глубина**: subtle → standard → floating
- **Интерактивность**: default → hover → active → focus

### 3. Семантическое значение цветов

- `primary` - основные действия (кнопки exchange)
- `secondary` - вторичные элементы
- `muted` - фоновые области
- `accent` - выделения и акценты
- `destructive` - ошибки и предупреждения

## Компоненты системы

### Semantic Tokens

```javascript
import { semanticTokens } from '@repo/design-tokens/form-patterns';

// Поверхности для разных уровней
semanticTokens.surfaces.page; // Основной фон страницы
semanticTokens.surfaces.elevated; // Карточки и контейнеры
semanticTokens.surfaces.accent; // Акцентные области

// Границы с правильной прозрачностью
semanticTokens.borders.subtle; // Мягкие границы
semanticTokens.borders.accent; // Яркие границы

// Тени с учетом темной темы
semanticTokens.elevation.subtle; // Минимальная тень
semanticTokens.elevation.floating; // Плавающие элементы
```

### Form Containers

```javascript
import { formContainers } from '@repo/design-tokens/form-patterns';

// Основной контейнер exchange формы
<div className={formContainers.exchangeForm.variants.compact}>{/* Содержимое формы */}</div>;
```

### Enhanced Cards

```javascript
import { enhancedCards } from '@repo/design-tokens/form-patterns';

// Карточки exchange с семантическими состояниями
<div className={enhancedCards.exchangeCard.variants.sending}>{/* Карточка отправки */}</div>;
```

### Layout Patterns

```javascript
import { layoutPatterns } from '@repo/design-tokens/form-patterns';

// Сложный компонент с правильной группировкой
<div className={layoutPatterns.complexComponent.wrapper}>
  <div className={layoutPatterns.complexComponent.content}>
    <div className={layoutPatterns.complexComponent.horizontalGroup}>
      {/* Горизонтальная группировка */}
    </div>
    <div className={layoutPatterns.complexComponent.actions}>{/* Действия */}</div>
  </div>
</div>;
```

## Примеры использования

### Exchange Form

```tsx
import { formContainers, layoutPatterns, formSpacing } from '@repo/design-tokens/form-patterns';

export function HeroExchangeForm() {
  return (
    <div className={formContainers.exchangeForm.variants.compact}>
      <div className={formSpacing.betweenGroups}>
        <div className={layoutPatterns.complexComponent.horizontalGroup}>
          <SendingCard />
          <ReceivingCard />
        </div>

        <div className={formSpacing.aroundActions}>
          <Button>Exchange</Button>
        </div>
      </div>
    </div>
  );
}
```

### Feature Cards

```tsx
import { enhancedCards, interactionStates } from '@repo/design-tokens/form-patterns';

export function FeatureCard() {
  return (
    <div
      className={`
      ${enhancedCards.groupedCard.base}
      ${interactionStates.card.default}
      ${interactionStates.card.hover}
    `}
    >
      {/* Содержимое */}
    </div>
  );
}
```

## Преимущества новой системы

### 1. Автоматическая поддержка темной темы

- Все цвета адаптируются автоматически
- Нет необходимости в `dark:` префиксах
- Правильный контраст во всех состояниях

### 2. Семантическая ясность

- Значение каждого токена понятно из названия
- Легко менять глобальные стили
- Консистентность во всем интерфейсе

### 3. Лучшая группировка сложных компонентов

- Четкая иерархия элементов
- Правильные отступы и границы
- Семантические состояния интерактивности

### 4. Maintenance-friendly

- Один источник истины для всех стилей
- Легко обновлять и тестировать
- TypeScript поддержка из коробки

## Миграция

### До

```tsx
// Хардкод цветов - плохо для темной темы
<div className="bg-white border border-gray-200 shadow-md">
```

### После

```tsx
// Семантические токены - работает везде
<div className="bg-card border border-border shadow-md">
```

## Best Practices

1. **Всегда используйте семантические токены** вместо конкретных цветов
2. **Тестируйте в темной теме** каждый новый компонент
3. **Используйте правильную иерархию** поверхностей и глубины
4. **Применяйте состояния интерактивности** для UX
5. **Группируйте связанные элементы** семантически правильно

## Заключение

Новая семантическая дизайн-система обеспечивает:

- ✅ Автоматическую поддержку темной темы
- ✅ Правильную иерархию сложных компонентов
- ✅ Семантическую ясность и maintenance
- ✅ Консистентный пользовательский опыт
- ✅ Минималистичный, но функциональный дизайн
