# @repo/design-tokens

Централизованная система дизайн-токенов для ExchangeGO. Обеспечивает единообразие цветов, типографики и компонентов во всем монорепозитории.

## 🎯 Назначение

Design tokens служат **единым источником истины** для всех визуальных элементов дизайн-системы:

- ✅ **Цветовые палитры** - brand, semantic и crypto-specific цвета
- ✅ **Типографическая система** - шрифты, размеры, веса, межстрочные расстояния
- ✅ **Пространственная система** - отступы, радиусы, тени
- ✅ **Готовые компоненты** - React компоненты с предустановленными стилями
- ✅ **TypeScript типизация** - полная типизация всех токенов

## 🏗️ Архитектура пакета

### Структура пакета (JavaScript + TypeScript)

```
packages/design-tokens/
├── colors.js           # Цветовые токены (JS объекты)
├── typography.js       # Типографические токены (JS объекты)
├── spacing.js          # Пространственные токены (JS объекты)
├── form-patterns.js    # CSS классы и семантические паттерны (JS объекты)
├── index.js           # Главный экспорт (JS)
├── index.d.ts         # TypeScript типизация
└── package.json       # Конфигурация пакета
```

### Почему такая архитектура?

#### **JavaScript файлы (.js)**

- **Назначение**: Build-time использование в конфигурациях и runtime паттерны
- **Потребители**: Tailwind CSS, webpack, React компоненты
- **Преимущества**: Простые объекты без сложных зависимостей

```javascript
// colors.js - используется в tailwind.config.cjs
export const colors = {
  primary: { 500: '#3b82f6' },
  // ...
};

// form-patterns.js - используется в React компонентах
export const formContainers = {
  exchangeForm: {
    base: 'bg-card text-card-foreground border border-border rounded-2xl shadow-standard p-6 space-y-6',
  },
};
```

#### **TypeScript типы (.d.ts)**

- **Назначение**: Типизация для всех экспортов
- **Потребители**: TypeScript компилятор, IDE
- **Преимущества**: Автокомплит, проверка типов

## 📦 Установка и использование

### В монорепозитории

Пакет автоматически доступен через workspace dependencies:

```json
{
  "dependencies": {
    "@repo/design-tokens": "*"
  }
}
```

### Основные способы использования

#### 1. Build-time (Tailwind конфигурации)

```javascript
// tailwind.config.cjs
const { colors, typography } = require('@repo/design-tokens');

module.exports = {
  theme: {
    extend: {
      colors: colors,
      fontFamily: typography.fontFamily,
    },
  },
};
```

#### 2. Runtime (React компоненты)

```typescript
// В React компонентах
import { formContainers, visualConnectors } from '@repo/design-tokens';

export function ExchangeForm() {
  return (
    <div className={formContainers.exchangeForm.compact}>
      <div>Отправляете</div>
      <div className={visualConnectors.exchangeIcon.base}>
        <RefreshCw className="w-4 h-4" />
      </div>
      <div>Получаете</div>
    </div>
  );
}
```

#### 3. CSS-in-JS / Styled Components

```typescript
import { colors, spacing } from '@repo/design-tokens';

const StyledButton = styled.button`
  background: ${colors.primary[500]};
  padding: ${spacing[4]};
`;
```

#### 4. TypeScript типизация

```typescript
import type { Colors, Typography, DesignTokens } from '@repo/design-tokens';

interface ThemeConfig {
  colors: Colors;
  typography: Typography;
}
```

## 🎨 Доступные токены

### Цвета (`colors.js`)

```typescript
import { colors } from '@repo/design-tokens';

// Brand цвета
colors.primary[500]; // #3b82f6
colors.secondary[500]; // #a855f7

// Semantic цвета
colors.success[500]; // #22c55e
colors.warning[500]; // #f59e0b
colors.error[500]; // #ef4444

// Crypto цвета
colors.bitcoin[500]; // #f97316
colors.ethereum[500]; // #627eea
colors.usdt[500]; // #26a269
```

### Типографика (`typography.js`)

```typescript
import { typography } from '@repo/design-tokens';

// Семейства шрифтов
typography.fontFamily.sans; // ['Inter', 'system-ui', ...]
typography.fontFamily.mono; // ['JetBrains Mono', ...]

// Размеры (с line-height)
typography.fontSize.sm; // ['0.875rem', { lineHeight: '1.25rem' }]
typography.fontSize.base; // ['1rem', { lineHeight: '1.5rem' }]
```

### Пространство (`spacing.js`)

```typescript
import { spacing, borderRadius, boxShadow } from '@repo/design-tokens';

// Отступы
spacing[4]; // '1rem'
spacing[6]; // '1.5rem'

// Радиусы
borderRadius.lg; // '0.5rem'
borderRadius.xl; // '0.75rem'

// Тени
boxShadow.sm; // '0 1px 2px 0 rgb(0 0 0 / 0.05)'
boxShadow.md; // '0 4px 6px -1px rgb(0 0 0 / 0.1)'
```

### Семантические паттерны (`form-patterns.js`)

```typescript
import {
  formContainers,
  visualConnectors,
  enhancedCards,
  componentGroups
} from '@repo/design-tokens';

// Контейнеры форм
<div className={formContainers.exchangeForm.base}>
  Содержимое формы
</div>

// Визуальные соединители
<div className={visualConnectors.exchangeIcon.base}>
  <RefreshCw className="w-4 h-4" />
</div>

// Улучшенные карточки
<div className={enhancedCards.exchangeCard.sending}>
  Отправка
</div>

// Группировка компонентов
<div className={componentGroups.actionGroup.container}>
  <button>Обменять</button>
</div>
```

## 🔧 Интеграция с другими пакетами

### С @repo/tailwind-preset

Design tokens автоматически интегрируются в Tailwind через preset:

```javascript
// packages/tailwind-preset/preset.js
const designTokens = require('@repo/design-tokens');

module.exports = {
  theme: {
    extend: {
      colors: designTokens.colors,
      // Автоматическая интеграция
    },
  },
};
```

### С @repo/ui

UI компоненты используют токены для консистентности:

```typescript
// packages/ui/src/components/Button.tsx
import { colors, spacing } from '@repo/design-tokens';

export const Button = ({ variant }) => (
  <button
    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
    style={{
      backgroundColor: colors.primary[500],
      padding: `${spacing[2]} ${spacing[4]}`
    }}
  >
    {children}
  </button>
);
```

### Со Storybook

Токены визуализируются в Storybook stories:

```typescript
// packages/ui/src/stories/design-tokens/Colors.stories.tsx
import { colors } from '@repo/design-tokens';

export const ColorShowcase = () => (
  <ColorPalette colors={colors} />
);
```

## ➕ Добавление новых токенов

### 1. Добавление цветов

```javascript
// packages/design-tokens/colors.js
export const colors = {
  // Существующие цвета...

  // Новый цвет
  accent: {
    50: '#f0f9ff',
    500: '#0ea5e9',
    900: '#0c4a6e',
  },
};
```

### 2. Обновление типизации

```typescript
// packages/design-tokens/index.d.ts
export interface Colors {
  // Существующие...
  accent: ColorScale; // Добавить новый цвет
}
```

### 3. Интеграция в preset

```javascript
// packages/tailwind-preset/preset.js
// Автоматически подхватывается через импорт
```

### 4. Добавление новых паттернов

```javascript
// packages/design-tokens/form-patterns.js
export const newPatterns = {
  customCard: {
    base: 'bg-card text-card-foreground border border-border rounded-lg p-4',
    variants: {
      highlighted: 'border-primary/50 shadow-primary/10',
      subtle: 'bg-muted/50 border-muted',
    },
  },
};

// Обновить экспорт в index.js
export { newPatterns } from './form-patterns.js';
```

## 🔍 Отладка и разработка

### Проверка типов

```bash
cd packages/design-tokens
npm run check-types
```

### Линтинг

```bash
npm run lint
```

### Просмотр в Storybook

```bash
# В корне монорепо
npm run storybook
# Перейти в Design Tokens секцию
```

## 📚 Связанная документация

- **[Tailwind Preset](../tailwind-preset/README.md)** - интеграция с Tailwind CSS
- **[SEMANTIC_DESIGN_SYSTEM.md](../../docs/SEMANTIC_DESIGN_SYSTEM.md)** - CSS архитектура
- **[FORM_DESIGN_PATTERNS.md](../../docs/FORM_DESIGN_PATTERNS.md)** - паттерны форм
- **[DEVELOPER_GUIDE.md](../../docs/DEVELOPER_GUIDE.md)** - общее руководство разработчика

## 🎯 Best Practices

### ✅ Рекомендуется

```typescript
// Использование токенов вместо хардкода
import { colors, spacing } from '@repo/design-tokens';

const styles = {
  background: colors.primary[500],
  padding: spacing[4],
};

// Использование семантических паттернов
import { formContainers, enhancedCards } from '@repo/design-tokens';
<div className={formContainers.exchangeForm.base}>
  <div className={enhancedCards.exchangeCard.sending}>
    Контент
  </div>
</div>
```

### ❌ Не рекомендуется

```typescript
// Хардкод значений
const styles = {
  background: '#3b82f6', // Используйте colors.primary[500]
  padding: '1rem', // Используйте spacing[4]
};

// Дублирование паттернов
const myCard = 'bg-white border rounded p-4'; // Используйте enhancedCards
```

## 🔄 Workflow изменений

1. **Изменить токены** в соответствующих .js файлах
2. **Обновить типы** в index.d.ts при необходимости
3. **Проверить типизацию** - `npm run check-types`
4. **Протестировать в Storybook** - визуальная проверка
5. **Обновить документацию** при добавлении новых возможностей

Изменения автоматически применяются во всех приложениях через preset архитектуру.
