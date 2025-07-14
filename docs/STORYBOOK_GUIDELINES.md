# 📚 Storybook Guidelines

**Дата создания:** 10 июля 2025  
**Версия:** 1.0  
**Назначение:** Регламент использования и критерии качества для Storybook в проекте Exchanger

**Основа:** ai-agent-rules.yml + CODE_STYLE_GUIDE.md + архитектурные принципы монорепозитория

---

## 🎯 Назначение и область применения

### Основное назначение Storybook в проекте

**Storybook служит для изолированной разработки и документирования переиспользуемых UI компонентов.**

#### Архитектурная роль в монорепозитории:

- **Каталог компонентов** из `packages/ui/` - единый источник истины для UI
- **Документация CSS-системы** из `packages/tailwind-preset/` - централизованные переменные
- **Тестовая среда** для компонентов без зависимостей от бизнес-логики
- **Инструмент collaboration** между разработчиками и дизайнерами

#### Интеграция с архитектурными уровнями:

```
Уровень 6: Storybook Stories ← документируют
Уровень 5: UI Components    ← тестируют изолированно
Уровень 4: CSS Variables    ← демонстрируют использование (packages/tailwind-preset/)
```

---

## 🏗️ Архитектурные принципы использования

### Принцип изоляции компонентов

**✅ ПРАВИЛЬНО:** Компонент работает независимо от внешних зависимостей

```typescript
// packages/ui/src/stories/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/ui/button';

const meta: Meta<typeof Button> = {
  title: 'UI/Atoms/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Переиспользуемая кнопка с вариантами стилизации',
      },
    },
  },
};
```

**❌ НЕПРАВИЛЬНО:** Компонент зависит от внешних провайдеров

```typescript
// ❌ Не включать в Storybook
import { useAuthStore } from 'packages/hooks';
import { PaymentAPI } from 'packages/exchange-core';
```

### Принцип соответствия архитектуре пакетов

#### Обязательная проверка централизованных систем (Rule 17):

1. **packages/ui/** - ВСЕ переиспользуемые компоненты ДОЛЖНЫ иметь stories
2. **packages/tailwind-preset/** - демонстрация CSS переменных через stories
3. **packages/constants/** - использование UI констант вместо hardcode

#### Запрет дублирования (Rule 20):

- НЕ создавать stories для компонентов, которые уже есть в `packages/ui/`
- НЕ дублировать логику между stories и тестами
- Переиспользовать существующие декораторы и утилиты

---

## 📋 Критерии включения/исключения компонентов

### ✅ ЧТО ВКЛЮЧАТЬ в Storybook

#### Уровень 5: UI Components (ОБЯЗАТЕЛЬНО)

**Атомарные компоненты:**

```typescript
// packages/ui/src/components/ui/
(Button, Input, Card, Badge, Avatar, Checkbox, RadioButton, Switch, Progress);
```

**Составные компоненты:**

```typescript
// packages/ui/src/components/ui/
(Modal, Dropdown, DataTable, Tabs, Accordion, Pagination, DatePicker);
```

**Критерии включения:**

- [ ] Компонент в `packages/ui/src/components/ui/`
- [ ] Компонент переиспользуется в 2+ местах
- [ ] Компонент имеет варианты состояний (loading, error, disabled)
- [ ] Компонент использует централизованные CSS переменные из `packages/tailwind-preset/`

#### Уровень 4: Демонстрация CSS системы

**Демонстрация переменных:**

```typescript
// Цветовая палитра, типографика, spacing
export const CSSVariables = () => (
  <div className="grid gap-4">
    <div className="bg-card text-card-foreground p-4 rounded">Card Background</div>
    <div className="bg-primary text-primary-foreground p-4 rounded">Primary</div>
    <div className="bg-muted text-muted-foreground p-4 rounded">Muted</div>
  </div>
);
```

### ❌ ЧТО НЕ ВКЛЮЧАТЬ в Storybook

#### Бизнес-компоненты (apps/web/src/components/)

**ИСКЛЮЧИТЬ:**

```typescript
// apps/web/src/components/forms/
(ExchangeForm, PaymentForm, UserRegistration);

// apps/web/src/components/dashboard/
(TradingPanel, PortfolioOverview, TransactionHistory);

// apps/web/src/components/auth/
(LoginForm, AuthGuard, PermissionChecker);
```

**Причины исключения:**

- Тесно связаны с бизнес-логикой (`packages/exchange-core/`)
- Требуют состояния из `packages/hooks/`
- Зависят от API и авторизации
- Не переиспользуются между приложениями

#### Страницы и layout компоненты

**ИСКЛЮЧИТЬ:**

```typescript
// apps/*/app/**/page.tsx
(HomePage, DashboardPage, ProfilePage);

// Специфичные layout
(AdminLayout, AuthLayout);
```

---

## 📏 Стандарты качества stories

### Обязательная структура story

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from '../components/ui/component-name';

// ОБЯЗАТЕЛЬНЫЕ ПОЛЯ
const meta: Meta<typeof ComponentName> = {
  title: 'UI/Category/ComponentName', // Соответствие иерархии
  component: ComponentName,
  parameters: {
    docs: {
      description: {
        component: 'Четкое описание назначения', // Обязательное описание
      },
    },
  },
  argTypes: {
    // Настройка controls для всех публичных props
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// БАЗОВЫЕ STORIES (минимум)
export const Default: Story = {};

export const Loading: Story = {
  args: { loading: true },
};

export const Error: Story = {
  args: { error: 'Error message' },
};

export const Disabled: Story = {
  args: { disabled: true },
};
```

### Обязательные stories для каждого компонента

#### Минимальный набор (ТРЕБУЕТСЯ):

1. **Default** - базовое состояние без props
2. **Loading** - состояние загрузки (если применимо)
3. **Error** - состояние ошибки (если применимо)
4. **Disabled** - неактивное состояние (если применимо)
5. **Variants** - все визуальные варианты (size, color, etc.)

#### Дополнительные stories (по необходимости):

```typescript
// Для компонентов с текстом
export const WithLongText: Story = {
  args: {
    children: 'Very long text that might cause layout issues...',
  },
};

// Для компонентов с данными
export const Empty: Story = {
  args: {
    data: [],
    emptyMessage: 'No data available',
  },
};

// Для интерактивных компонентов
export const Interactive: Story = {
  args: {
    onClick: action('clicked'),
    onSelect: action('selected'),
  },
};
```

### Качество документации

#### Обязательные descriptions:

```typescript
const meta: Meta<typeof Button> = {
  parameters: {
    docs: {
      description: {
        component: `
Базовая кнопка с поддержкой различных вариантов стилизации.
Использует токены из packages/design-tokens для консистентности.
        `,
      },
    },
  },
};

export const Primary: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Основной вариант кнопки для primary actions',
      },
    },
  },
};
```

#### Интеграция с design-tokens:

```typescript
// ✅ Правильно - использование констант
import { UI_VARIANTS } from 'packages/constants';

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      {UI_VARIANTS.button.map(variant => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  )
};
```

---

## 🔍 Протокол ревью Storybook

### Чек-лист перед созданием story

#### Архитектурная проверка (Rule 2, 17, 20):

- [ ] **Компонент находится в `packages/ui/`** - не создавать stories для app-specific компонентов
- [ ] **Отсутствуют внешние зависимости** - компонент изолирован
- [ ] **Используются константы из `packages/constants/`** вместо hardcode значений
- [ ] **Нет дублирования существующих stories**

#### Качественная проверка (Rule 3, 7, 11):

- [ ] **Все публичные props демонстрируются**
- [ ] **Включены edge cases** (длинный текст, пустые данные)
- [ ] **Нет технического долга** в story коде
- [ ] **Stories готовы к использованию** без дополнительной настройки

### Критерии качества при ревью

#### 1. Структурные требования

**Именование и организация:**

```typescript
// ✅ Правильная иерархия
'UI/Atoms/Button'; // Атомарные компоненты
'UI/Molecules/Card'; // Составные компоненты
'UI/Organisms/Modal'; // Сложные компоненты
'Tokens/Colors'; // Design system токены
```

**Файловая структура:**

```
packages/ui/src/stories/
├── atoms/
│   ├── Button.stories.tsx
│   ├── Input.stories.tsx
│   └── Badge.stories.tsx
├── molecules/
│   ├── Card.stories.tsx
│   └── FormField.stories.tsx
└── design-tokens/
    ├── Colors.stories.tsx
    └── Typography.stories.tsx
```

#### 2. Функциональные требования

**Покрытие состояний:**

- [ ] Все варианты из TypeScript types покрыты stories
- [ ] Loading/Error/Empty состояния (где применимо)
- [ ] Responsive behavior демонстрируется
- [ ] Accessibility features задокументированы

**Качество кода:**

```typescript
// ✅ Хорошо структурированная story
export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="primary" loading>Loading</Button>
      <Button variant="primary" disabled>Disabled</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Все основные состояния кнопки для быстрого сравнения'
      }
    }
  }
};
```

#### 3. Интеграционные требования

**Декораторы и провайдеры:**

```typescript
// .storybook/preview.ts - глобальные декораторы
export const decorators = [
  (Story) => (
    <div className="p-4">
      <Story />
    </div>
  ),
];

// Компонент-специфичные декораторы с Design System v2.1
const meta: Meta<typeof ThemeButton> = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={defaultTheme}>
        <div className="min-h-screen bg-background text-foreground">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};
```

**Controls конфигурация:**

```typescript
const meta: Meta<typeof Button> = {
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline'],
      description: 'Визуальный вариант кнопки',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    onClick: { action: 'clicked' },
  },
};
```

### Процедура ревью

#### Этап 1: Автоматическая проверка

```bash
# Проверка сборки Storybook
npm run build-storybook

# Линтинг stories
npm run lint "**/*.stories.tsx"

# Проверка типов
npm run check-types
```

#### Этап 2: Ручная проверка

**Функциональность:**

1. Все stories загружаются без ошибок
2. Controls работают корректно
3. Docs генерируются автоматически
4. Actions логируются в Actions панели

**Качество документации:**

1. Описания компонентов и stories заполнены
2. Примеры демонстрируют реальные use cases
3. Edge cases покрыты
4. Accessibility considerations задокументированы

#### Этап 3: Архитектурная валидация

**Соответствие принципам:**

- [ ] Компонент действительно переиспользуемый
- [ ] Нет связи с бизнес-логикой
- [ ] Использует дизайн-систему
- [ ] Не дублирует существующие решения

---

## 🔧 Интеграция с архитектурой проекта

### Связь с централизованными системами

#### packages/constants/ интеграция

```typescript
// ✅ Использование констант вместо hardcode
import { UI_VARIANTS, UI_SIZES } from 'packages/constants';

export const AllVariants: Story = {
  render: () => (
    <div className="grid gap-2">
      {Object.values(UI_VARIANTS.button).map(variant =>
        Object.values(UI_SIZES).map(size => (
          <Button key={`${variant}-${size}`} variant={variant} size={size}>
            {variant} {size}
          </Button>
        ))
      )}
    </div>
  )
};
```

#### packages/design-tokens/ интеграция

```typescript
// ✅ Демонстрация дизайн-токенов
import { DESIGN_TOKENS } from 'packages/design-tokens';

export const ColorShowcase: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      {Object.entries(DESIGN_TOKENS.colors).map(([name, value]) => (
        <div key={name} className="text-center">
          <div
            className="w-16 h-16 rounded mb-2"
            style={{ backgroundColor: value }}
          />
          <p className="text-sm">{name}</p>
          <p className="text-xs text-gray-500">{value}</p>
        </div>
      ))}
    </div>
  )
};
```

### Конфигурация .storybook/

#### main.ts соответствие проекту

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  stories: [
    // ТОЛЬКО UI компоненты
    '../packages/ui/src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    // НЕ включать apps/web/src/components
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs', // Документация
    '@storybook/addon-a11y', // Accessibility
    '@storybook/addon-vitest', // Тестирование
  ],
  // Интеграция с Next.js и Vite
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
};
```

#### preview.ts глобальные настройки

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/nextjs-vite';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true, // Table of contents
    },
  },
  // Глобальные декораторы для всех stories
  decorators: [
    (Story) => (
      <div className="storybook-wrapper p-4">
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

---

## 📊 Метрики качества Storybook

### Измеримые критерии (Rule 3)

#### Покрытие компонентов

**Целевые метрики:**

- **100%** UI компонентов из `packages/ui/` имеют stories
- **≥5** stories на компонент (Default, Loading, Error, Disabled, Variants)
- **≥80%** публичных props демонстрируются в stories

**Способ измерения:**

```bash
# Скрипт для проверки покрытия
npm run analyze:storybook-coverage
```

#### Качество документации

**Критерии качества:**

- [ ] Все stories имеют descriptions
- [ ] Все компоненты имеют описание назначения
- [ ] Edge cases покрыты
- [ ] Controls настроены для всех интерактивных props

#### Performance метрики

**Загрузка Storybook:**

- Время сборки `npm run build-storybook` < 2 минуты
- Время загрузки stories < 3 секунд
- Размер bundle Storybook < 50MB

### Процесс улучшения

#### Еженедельный аудит

1. **Проверка новых компонентов** - все ли имеют stories
2. **Валидация качества** - соответствие стандартам
3. **Performance мониторинг** - время сборки и загрузки
4. **Обновление документации** - актуальность descriptions

#### Обратная связь от команды

**Метрики использования:**

- Частота просмотра stories разработчиками
- Количество найденных UI багов через Storybook
- Время на создание новых компонентов (с/без Storybook)

---

## 🚨 Частые ошибки и как их избегать

### Архитектурные антипаттерны

#### ❌ Включение бизнес-компонентов

```typescript
// ❌ НЕПРАВИЛЬНО
// apps/web/src/components/ExchangeForm.stories.tsx
export const ExchangeForm: Story = {
  args: {
    onSubmit: mockSubmitHandler,
    currencies: mockCurrencies, // Бизнес-данные!
  },
};
```

**Решение:** Создавать stories только для `packages/ui/` компонентов.

#### ❌ Дублирование логики

```typescript
// ❌ НЕПРАВИЛЬНО - дублирование констант
export const ButtonVariants: Story = {
  render: () => (
    <div>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      {/* Hardcoded варианты вместо использования констант */}
    </div>
  )
};
```

**Решение:** Использовать `packages/constants/` для всех значений.

### Качественные ошибки

#### ❌ Неполное покрытие состояний

```typescript
// ❌ НЕПРАВИЛЬНО - только "счастливый" сценарий
export const OnlyDefault: Story = {};
// Отсутствуют Loading, Error, Disabled, Edge cases
```

**Решение:** Создавать минимальный набор обязательных stories.

#### ❌ Плохая документация

```typescript
// ❌ НЕПРАВИЛЬНО
const meta: Meta<typeof Button> = {
  title: 'Button', // Плохая категоризация
  component: Button,
  // Отсутствует description
};
```

**Решение:** Следовать обязательной структуре с descriptions.

---

## 📝 Шаблоны для быстрого старта

### Базовый шаблон story

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from '../components/ui/component-name';

const meta: Meta<typeof ComponentName> = {
  title: 'UI/Category/ComponentName',
  component: ComponentName,
  parameters: {
    docs: {
      description: {
        component: 'Краткое описание назначения компонента'
      }
    }
  },
  argTypes: {
    // Настройка controls
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { loading: true }
};

export const Error: Story = {
  args: { error: 'Error message' }
};

export const Disabled: Story = {
  args: { disabled: true }
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid gap-4">
      {/* Демонстрация всех вариантов */}
    </div>
  )
};
```

### Шаблон для design tokens

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { DESIGN_TOKENS } from 'packages/design-tokens';

const meta: Meta = {
  title: 'Tokens/ColorPalette',
  parameters: {
    docs: {
      description: {
        component: 'Цветовая палитра проекта из packages/design-tokens'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllColors: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      {Object.entries(DESIGN_TOKENS.colors).map(([name, value]) => (
        <div key={name} className="text-center">
          <div
            className="w-20 h-20 rounded-lg mb-2 border"
            style={{ backgroundColor: value }}
          />
          <h3 className="font-medium">{name}</h3>
          <code className="text-sm text-gray-600">{value}</code>
        </div>
      ))}
    </div>
  )
};
```

---

## 🔗 Связанные документы

- [CODE_STYLE_GUIDE.md](./CODE_STYLE_GUIDE.md) - Архитектурные принципы проекта
- [CODE_REVIEW_PROTOCOLS.md](./CODE_REVIEW_PROTOCOLS.md) - Протоколы проверки по уровням
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Общие принципы разработки
- [ai-agent-rules.yml](./ai-agent-rules.yml) - Правила качества и архитектуры

**Версия документа:** 1.0  
**Последнее обновление:** 10 июля 2025  
**Ответственный:** Development Team
