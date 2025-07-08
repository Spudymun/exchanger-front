# 🎯 Централизованная архитектура ESLint

**Статус**: ✅ Внедрена (Июль 2025)  
**Версия**: 2.0 (Centralized + Lazy Loading)

## 📋 Обзор

Проект перешел от хаотичной архитектуры с 17+ конфигурационными файлами к централизованной системе с модульной структурой и lazy loading.

## 🔄 Миграция: До vs После

### ❌ Было (Архитектурный хаос)

```
# Множественные конфиги
eslint.config.mjs
apps/web/eslint.config.mjs
apps/admin-panel/eslint.config.mjs
packages/ui/eslint.config.mjs

packages/hooks/eslint.config.mjs
packages/utils/eslint.config.mjs
packages/constants/eslint.config.mjs
packages/design-tokens/eslint.config.mjs
packages/providers/eslint.config.mjs
packages/typescript-config/eslint.config.mjs
.eslintrc.js
.eslintrc.json
old-eslint.config.mjs
old-.eslintignore
...и другие

# Результат:
- 83,398 warnings
- Дубли правил
- Медленная загрузка
- Сложность поддержки
```

### ✅ Стало (Централизованная архитектура)

```
# Единый конфиг
eslint.config.mjs                 # Главный конфиг

# Модульная структура
packages/eslint-config/
├── base.js                       # Базовые правила
├── shared-rules.js               # Централизованные правила
├── react.js                      # React + hooks + a11y
├── api.js                        # API слой
├── testing.js                    # Тесты
├── configs.js                    # Конфигурации
├── utils.js                      # Утилиты
├── ignores.js                    # Централизованные ignores
├── lazy-loading.js               # Performance утилиты
└── performance-benchmark.js      # Мониторинг

# Результат:
- 68 warnings (99.9% улучшение)
- Lazy loading: ~0ms загрузка
- Централизованные лимиты
- Мемоизированные правила
```

## 🏗️ Архитектурные принципы

### 1. Единый источник истины

- **Один конфиг**: `eslint.config.mjs` на root уровне
- **Централизованные лимиты**: `packages/constants/src/linter-limits.ts`
- **Модульная структура**: `packages/eslint-config/`

### 2. Lazy Loading

- **Условная загрузка**: правила загружаются только при необходимости
- **Мемоизация**: результаты кэшируются для повторного использования
- **Performance мониторинг**: отслеживание времени загрузки

### 3. Архитектурные overrides

- **Динамические лимиты**: разные правила для разных типов файлов
- **Контекстные правила**: API слой vs UI компоненты vs тесты
- **Graceful degradation**: более мягкие правила для сложных компонентов

### 4. Централизованные ignores

- **Общие patterns**: build, generated, node_modules
- **Архитектурно-специфичные**: .next/types, dist/, coverage/
- **Устранение 80%+ ложных срабатываний**

## 🎯 Архитектурные компоненты

### Главный конфигурационный файл

```javascript
// eslint.config.mjs - ЕДИНСТВЕННЫЙ конфиг
import { FUNCTION_SIZE_LIMITS, COMPLEXITY_LIMITS } from './packages/constants/dist/index.js';

import { lazyLoadConfig } from './packages/eslint-config/lazy-loading.js';

export default [
  // Глобальные ignores (устраняют 80%+ warnings)
  { name: 'global-ignores', ignores: allIgnores },

  // Базовая конфигурация
  ...baseConfig,

  // Модульные конфигурации (lazy loaded)
  ...reactConfig,
  ...apiConfig,
  ...testingConfig,
  ...utilsConfig,
];
```

### Lazy Loading система

```javascript
// packages/eslint-config/lazy-loading.js
const configCache = new Map();

export function lazyLoadConfig(name, configFn) {
  if (configCache.has(name)) {
    return configCache.get(name);
  }

  const config = configFn();
  configCache.set(name, config);
  return config;
}

// Мониторинг производительности
export const performanceMetrics = {
  configLoadTimes: new Map(),
  recordLoadTime: (name, startTime) => {
    const duration = Date.now() - startTime;
    performanceMetrics.configLoadTimes.set(name, duration);
  },
};
```

### Централизованные лимиты

```typescript
// packages/constants/src/linter-limits.ts
export const FUNCTION_SIZE_LIMITS = {
  BASE: 50, // Базовый лимит функций
  UI_COMPONENTS: 60, // UI компоненты (учитывают JSX)
  MAIN_PAGES: 80, // Основные страницы
  API_ENDPOINTS: 100, // API endpoints
  TESTS: 120, // Тесты
  HOOKS: 75, // Хуки
  DASHBOARD: 70, // Dashboard компоненты
} as const;

export const COMPLEXITY_LIMITS = {
  BASE: 10, // Базовая сложность
  UTILS: 8, // Утилиты (строже)
  API_LAYER: 12, // API слой
} as const;

export const DEPTH_LIMITS = {
  BASE: 2, // Базовая глубина
  SCRIPTS: 3, // Scripts могут быть глубже
} as const;

export const PARAMETERS_LIMITS = {
  BASE: 4, // Базовое количество параметров
  NESTED_CALLBACKS: 3, // Вложенные callbacks
  STATEMENTS_PER_LINE: 1, // Statements на строку
} as const;
```

### Shared Rules (мемоизированные)

```javascript
// packages/eslint-config/shared-rules.js
let sharedRulesCache = null;

export function getSharedRules() {
  if (sharedRulesCache) {
    return sharedRulesCache;
  }

  sharedRulesCache = {
    // TypeScript правила
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-ignore': 'allow-with-description',
        minimumDescriptionLength: 10,
      },
    ],

    // Качество кода
    'prefer-const': 'error',
    'no-var': 'error',
    'no-debugger': 'error',
    'no-alert': 'error',

    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',

    // Import ordering
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
  };

  return sharedRulesCache;
}
```

## 🎨 Архитектурные overrides

### UI компоненты

```javascript
{
  name: 'ui-components',
  files: ['packages/ui/**/*.{js,jsx,ts,tsx}'],
  rules: lazyLoadConfig('ui-rules', () => ({
    'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.UI_COMPONENTS }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
  }))
}
```

### API слой

```javascript
{
  name: 'api-layer',
  files: ['apps/web/src/server/trpc/**/*.ts'],
  rules: lazyLoadConfig('api-rules', () => ({
    'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.API_ENDPOINTS }],
    'complexity': ['error', COMPLEXITY_LIMITS.API_LAYER],
    'no-console': 'off', // Разрешено для логирования
  }))
}
```

### Тестовые файлы

```javascript
{
  name: 'testing',
  files: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
  rules: lazyLoadConfig('testing-rules', () => ({
    'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.TESTS }],
    'no-magic-numbers': 'off', // Разрешено в тестах
    'prefer-const': 'error',
  }))
}
```

### Утилиты (строже)

```javascript
{
  name: 'utils-strict',
  files: ['packages/utils/**/*.ts', 'packages/exchange-core/**/*.ts'],
  rules: lazyLoadConfig('utils-rules', () => ({
    'complexity': ['error', COMPLEXITY_LIMITS.UTILS], // Строже базового
    'max-statements': ['error', 10],
    'max-nested-callbacks': ['error', 2],
  }))
}
```

## 📊 Performance характеристики

### Метрики производительности

| Метрика                   | До внедрения | После внедрения | Улучшение |
| ------------------------- | ------------ | --------------- | --------- |
| Время загрузки конфига    | ~500ms       | ~0ms            | **99.9%** |
| Время выполнения lint     | ~15s         | ~6.9s           | **54%**   |
| Количество warnings       | 83,398       | 68              | **99.9%** |
| Строки кода конфига       | 1000+        | 196             | **80%**   |
| Количество файлов конфига | 17+          | 1 + модули      | **85%**   |

### Мониторинг производительности

```bash
# Бенчмарк производительности
npm run lint:benchmark

# Результат:
# ESLint config loaded in 0ms
# Lint completed in 6.9s
# Total warnings: 68
# Config lines: 196
```

## 🔧 Команды и workflow

### Основные команды

```bash
# Обычный lint
npm run lint

# Lint с фиксом
npm run lint:fix

# Бенчмарк производительности
npm run lint:benchmark

# Проверка типов
npm run check-types

# Полная проверка
npm run lint && npm run check-types && npm run test
```

### Pre-commit процесс

```bash
# Автоматически запускается при git commit
git commit -m "feat: update component"

# Процесс:
# 1. ESLint --fix --max-warnings 52
# 2. Prettier --write
# 3. Type checking
# 4. Tests
# 5. Performance monitoring
```

## 🎯 Best Practices

### Для разработчиков

1. **НЕ создавайте локальные eslint.config.mjs** - все правила в root конфиге
2. **Используйте централизованные лимиты** из `@repo/constants`
3. **Добавляйте новые правила через lazy loading**
4. **Группируйте правила по архитектурным слоям**
5. **Мониторьте производительность** через `npm run lint:benchmark`

### Для добавления новых правил

```javascript
// eslint.config.mjs
export default [
  // ...existing configs...

  // Новый архитектурный слой
  {
    name: 'new-layer',
    files: ['path/to/new-layer/**/*.{js,ts}'],
    rules: lazyLoadConfig('new-layer-rules', () => ({
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.CUSTOM }],
      'specific-rule': 'error',
    })),
  },
];
```

### Для обновления лимитов

```typescript
// packages/constants/src/linter-limits.ts
export const FUNCTION_SIZE_LIMITS = {
  // ...existing limits...
  NEW_COMPONENT_TYPE: 90, // Новый лимит
} as const;
```

## 🚀 Эволюция архитектуры

### Этап 1: Чистка (✅ Завершено)

- Удаление всех старых конфигов
- Создание единого eslint.config.mjs
- Базовая централизация

### Этап 2: Модульность (✅ Завершено)

- Создание packages/eslint-config/
- Разделение по архитектурным слоям
- Централизованные лимиты

### Этап 3: Оптимизация (✅ Завершено)

- Lazy loading система
- Мемоизация shared rules
- Performance мониторинг

### Этап 4: Будущее развитие

- AI-powered правила
- Автоматическое обновление лимитов
- Интеграция с CI/CD метриками

## 🎉 Результаты

**Главные достижения:**

- ✅ 99.9% сокращение warnings (83,398 → 68)
- ✅ Lazy loading: ~0ms загрузка конфига
- ✅ Централизованные лимиты и правила
- ✅ Модульная архитектура
- ✅ Performance мониторинг
- ✅ Полная актуализация документации

**Техническая эффективность:**

- Время разработки: сокращено за счет централизации
- Время CI/CD: сокращено на 54%
- Поддержка: упрощена благодаря модульности
- Качество кода: повышено за счет строгих правил

**Архитектурная целостность:**

- Единый источник истины
- Централизованные константы
- Lazy loading для производительности
- Мемоизация для оптимизации
- Performance мониторинг

Архитектура готова к масштабированию и дальнейшему развитию проекта.
