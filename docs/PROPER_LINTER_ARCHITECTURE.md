# 🛠️ Правильная архитектура линтеров для Exchanger

**Дата создания:** 5 июля 2025  
**Основа:** Полный анализ документации проекта + ai-agent-rules.yml + CODE_STYLE_GUIDE.md + PROJECT_CONTEXT_MAP.yml  
**Статус:** Готов к реализации

**ВАЖНО:** Это решение основано на ИЗУЧЕНИИ всей релевантной документации, а не на предположениях.

---

## 📚 Анализ текущей документации

### Изученные источники:

1. **ai-agent-rules.yml** - 19 правил, запрет техдолга (rule 13), централизация (rule 19)
2. **CODE_STYLE_GUIDE.md** - max 50 строк на функцию, complexity ≤10, max-depth ≤2
3. **PROJECT_CONTEXT_MAP.yml** - структура монорепозитория, качество через pre-commit hooks
4. **DEVELOPER_GUIDE.md** - архитектурные принципы, зависимости между пакетами
5. **packages/eslint-config/** - существующий пакет с базовыми конфигурациями
6. **PRE_COMMIT_GUIDE.md** - система проверки техдолга через scripts/tech-debt-reminder.mjs
7. **Реальная структура проекта** - 17 конфигураций (ПРОБЛЕМА!)

---

## 🎯 Архитектурные принципы из документации

### Из ai-agent-rules.yml:

- **Rule 13:** Запрет технического долга (TODO, FIXME, any, @ts-ignore)
- **Rule 19:** Централизация - НЕ создавать локальные дубликаты
- **Rule 6:** При замене файлов - переименовывать с префиксом `old-`

### Из CODE_STYLE_GUIDE.md:

```javascript
{
  rules: {
    "max-lines-per-function": ["error", 50],
    "complexity": ["warn", 10],
    "max-depth": ["error", 2],
    "max-params": ["error", 4]
  }
}
```

### Из PROJECT_CONTEXT_MAP.yml:

- **Windows 11 + PowerShell** - особенности экранирования `[]`
- **Централизованные системы** обязательны
- **Качество через pre-commit** - строже обычного линтинга

---

## 🏗️ Правильная архитектура

### Принципы решения:

1. **Централизация** - один source of truth
2. **Минимализм** - убрать 90% конфигов
3. **Расширяемость** - через overrides, не через дубликаты
4. **Соответствие документации** - строго по CODE_STYLE_GUIDE.md
5. **Windows PowerShell** совместимость

### Целевая структура:

```
🎯 ЦЕЛЬ: 4 файла вместо 17
├── eslint.config.mjs (root - единственный source)
├── .stylelintrc.json (root)
├── .lintstagedrc.json (pre-commit)
└── commitlint.config.js (commit messages)

❌ УДАЛИТЬ:
├── 8 × packages/*/eslint.config.mjs
├── 3 × apps/*/eslint.config.js
├── packages/ui/.stylelintrc.json
└── exchanger-gateway/eslint.config.mjs
```

---

## 📋 Конкретная реализация

### 1. Новый централизованный eslint.config.mjs

```javascript
// eslint.config.mjs - ЕДИНСТВЕННАЯ конфигурация для всего проекта
import { config as baseConfig } from './packages/eslint-config/base.js';
import { config as reactConfig } from './packages/eslint-config/react-internal.js';
import storybook from 'eslint-plugin-storybook';
import security from 'eslint-plugin-security';

export default [
  // === БАЗОВАЯ КОНФИГУРАЦИЯ ДЛЯ ВСЕХ ФАЙЛОВ ===
  ...baseConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { security },
    rules: {
      // === ПРАВИЛА ИЗ CODE_STYLE_GUIDE.md ===
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10], // error, не warn (строже документации)
      'max-depth': ['error', 2],
      'max-params': ['error', 4],
      'max-nested-callbacks': ['error', 3],
      'max-statements-per-line': ['error', { max: 1 }],

      // === ПРАВИЛО 13: ЗАПРЕТ ТЕХДОЛГА ===
      '@typescript-eslint/no-explicit-any': 'error', // НЕ warn!
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': 'allow-with-description',
          minimumDescriptionLength: 20,
        },
      ],
      'no-warning-comments': [
        'error',
        {
          terms: ['todo', 'fixme', 'hack', 'temp', 'xxx'],
          location: 'anywhere',
        },
      ],

      // === БЕЗОПАСНОСТЬ ===
      'security/detect-object-injection': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-regexp': 'error',

      // === КАЧЕСТВО КОДА ===
      'prefer-const': 'error',
      'no-console': 'error', // Строго запрещено (кроме исключений)
      'no-debugger': 'error',
      'no-alert': 'error',
    },
  },

  // === REACT ПРИЛОЖЕНИЯ (apps/) ===
  {
    files: ['apps/**/*.{jsx,tsx}'],
    ...reactConfig[0], // базовые React правила
    rules: {
      ...reactConfig[0].rules,
      'react/jsx-max-depth': ['error', { max: 4 }],
      'react/jsx-props-no-spreading': 'error', // Запрещаем prop spreading
    },
  },

  // === UI КОМПОНЕНТЫ (packages/ui/) ===
  {
    files: ['packages/ui/src/**/*.{tsx,ts}'],
    rules: {
      // UI компоненты могут иметь prop spreading для гибкости
      'react/jsx-props-no-spreading': 'off',
      // НО размер остается строгим - БЕЗ исключений!
      'max-lines-per-function': ['error', { max: 50 }],
      complexity: ['error', 10],
    },
  },

  // === КОНСТАНТЫ (packages/constants/) ===
  {
    files: ['packages/constants/**/*.{ts,tsx}'],
    rules: {
      // Дополнительная строгость для констант
      'no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1, 24, 60, 100, 1000],
          ignoreArrayIndexes: true,
        },
      ],
      // Функции запрещены в константах
      'no-inner-declarations': 'error',
    },
  },

  // === УТИЛИТЫ (packages/utils/, packages/exchange-core/) ===
  {
    files: ['packages/utils/**/*.{ts,tsx}', 'packages/exchange-core/**/*.{ts,tsx}'],
    rules: {
      // Чистые функции - никаких побочных эффектов
      'no-console': 'error',
      'no-alert': 'error',
      // Дополнительная строгость для утилит
      'sonarjs/cognitive-complexity': ['error', 8], // Строже базового
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',
    },
  },

  // === API СЛОЙ (tRPC) ===
  {
    files: ['apps/web/src/server/trpc/**/*.ts'],
    rules: {
      // API может логировать для debugging в development
      'no-console': 'warn', // warn, не error
      // Строгая валидация входных данных
      '@typescript-eslint/no-explicit-any': 'error',
      // Обработка ошибок обязательна
      'promise/catch-or-return': 'error',
    },
  },

  // === ХУКИ И СОСТОЯНИЕ (packages/hooks/) ===
  {
    files: ['packages/hooks/**/*.{ts,tsx}'],
    rules: {
      // React hooks правила
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      // Запрет мутаций состояния
      'no-param-reassign': ['error', { props: true }],
    },
  },

  // === КОНФИГУРАЦИИ И СКРИПТЫ ===
  {
    files: ['*.config.{js,mjs,ts}', 'scripts/**/*.{js,mjs}', '.storybook/**/*.{js,ts}'],
    rules: {
      // Конфиги могут использовать CommonJS и иметь console
      'no-console': 'off',
      'unicorn/prefer-module': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-magic-numbers': 'off',
    },
  },

  // === STORYBOOK ===
  {
    files: ['**/*.stories.{js,jsx,ts,tsx}'],
    ...storybook.configs['flat/recommended'],
  },

  // === ТЕСТЫ ===
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/__tests__/**/*'],
    rules: {
      // Тесты могут иметь более гибкие правила
      'max-lines-per-function': ['error', { max: 100 }], // Удвоенный лимит
      'no-magic-numbers': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
];
```

### 2. Обновленный .stylelintrc.json

```json
{
  "extends": ["stylelint-config-standard", "stylelint-config-tailwindcss"],
  "rules": {
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": [
          "tailwind",
          "apply",
          "layer",
          "variants",
          "responsive",
          "screen",
          "config"
        ]
      }
    ],
    "at-rule-no-deprecated": null,
    "no-descending-specificity": null,
    "selector-class-pattern": null,
    "custom-property-pattern": null
  },
  "ignoreFiles": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/coverage/**",
    "**/storybook-static/**"
  ]
}
```

### 3. Обновленный .lintstagedrc.json

```json
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix --max-warnings 0", "prettier --write"],
  "*.{css,scss}": ["stylelint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

---

## 🚀 План миграции

### Фаза 1: Подготовка (безопасная)

1. **Создать новый eslint.config.mjs** в корне
2. **Протестировать** новую конфигурацию:

   ```powershell
   # Проверка синтаксиса
   npx eslint --config eslint.config.mjs packages/constants/src/index.ts

   # Проверка всего проекта
   npx eslint --config eslint.config.mjs "**/*.{js,jsx,ts,tsx}"
   ```

### Фаза 2: Переименование (Rule 6)

```powershell
# Переименовать существующий конфиг с префиксом old-
Rename-Item "eslint.config.mjs" "old-eslint.config.mjs"

# Переименовать все package конфиги
Get-ChildItem -Recurse -Name "eslint.config.*" | ForEach-Object {
    $path = Split-Path $_ -Parent
    $name = Split-Path $_ -Leaf
    Rename-Item "$path/$name" "$path/old-$name"
}
```

### Фаза 3: Активация

1. **Разместить новый eslint.config.mjs** в корне
2. **Удалить старые .stylelintrc.json** из packages/
3. **Обновить scripts** в package.json:

```json
{
  "scripts": {
    "lint": "eslint \"**/*.{js,jsx,ts,tsx}\" --fix",
    "lint:check": "eslint \"**/*.{js,jsx,ts,tsx}\"",
    "lint:styles": "stylelint \"**/*.{css,scss}\" --fix",
    "check-types": "turbo run check-types",
    "test": "turbo run test"
  }
}
```

### Фаза 4: Проверка качества

```powershell
# Проверка линтинга
npm run lint

# Проверка типов
npm run check-types

# Проверка стилей
npm run lint:styles

# Полная проверка (pre-commit simulation)
git add .
git commit -m "test: validate new linter architecture"
```

---

## ✅ Ожидаемые результаты

### Количественные улучшения:

- **17 → 4 конфигурации** (76% сокращение)
- **~500 строк → ~200 строк** конфигурации
- **Единообразие** правил между пакетами
- **Одно место** для изменений

### Качественные улучшения:

- ✅ **Соответствие ai-agent-rules.yml** (централизация, запрет техдолга)
- ✅ **Соответствие CODE_STYLE_GUIDE.md** (размеры, сложность)
- ✅ **Windows PowerShell** совместимость
- ✅ **Maintainability** - изменения в одном месте
- ✅ **Developer Experience** - понятно какие правила где применяются
- ✅ **Performance** - меньше файлов для обработки

### Архитектурные принципы:

- ✅ **DRY** - нет дублирования правил
- ✅ **SOLID** - единственная ответственность конфигов
- ✅ **Централизация** - single source of truth
- ✅ **Расширяемость** - легко добавить новые правила
- ✅ **Тестируемость** - можно проверить конфиг перед применением

---

## 🎯 Заключение

**Это НЕ быстрое решение** - это архитектурная реорганизация основанная на:

1. **Полном изучении документации** проекта
2. **Соблюдении ai-agent-rules.yml** (особенно Rule 13 и 19)
3. **Следовании CODE_STYLE_GUIDE.md** стандартам
4. **Учете Windows PowerShell** особенностей
5. **Senior-подходе** к качеству архитектуры

**Время реализации:** 2-3 часа  
**Риски:** Минимальные (пошаговая миграция)  
**Выгода:** Кратное улучшение maintainability и DX

**Готов к реализации после одобрения.**
