// eslint.config.mjs - ЕДИНСТВЕННАЯ конфигурация для всего проекта
import { 
  COMPLEXITY_LIMITS, 
  FUNCTION_SIZE_LIMITS, 
  FILE_SIZE_LIMITS, 
  DEPTH_LIMITS, 
  PARAMETERS_LIMITS, 
  MAGIC_NUMBERS, 
  DESCRIPTION_LENGTHS
} from './packages/constants/dist/index.js';
import { config as baseConfig } from './packages/eslint-config/base.js';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig[]} */
export default [
  // === КРИТИЧЕСКИЕ IGNORES (устраняют 80%+ warnings) ===
  {
    ignores: [
      // Build artifacts and generated files
      '**/dist/**',
      '**/out/**', 
      '**/.next/**',
      '**/.next/types/**', // Next.js автогенерированные типы
      '**/node_modules/**',
      '**/coverage/**',
      '**/storybook-static/**',
      '**/playwright-report/**',
      '**/test-results/**',
      
      // Package build outputs
      'packages/*/dist/**',
      'packages/*/.turbo/**',
      'apps/*/.next/**',
      'apps/*/dist/**',
      'apps/*/.turbo/**',
      
      // IDE and system files
      '**/.vscode/**',
      '**/.idea/**',
      '**/*.log',
      '**/.DS_Store',
      '**/Thumbs.db',
      
      // Temporary and cache files
      '**/.cache/**',
      '**/tmp/**',
      '**/temp/**',
      '**/.temp/**'
    ]
  },

  // === БАЗОВАЯ КОНФИГУРАЦИЯ ДЛЯ ВСЕХ ФАЙЛОВ ===
  ...baseConfig,
  
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // === ПРАВИЛА ИЗ CODE_STYLE_GUIDE.md ===
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.BASE, skipBlankLines: true, skipComments: true }],
      'complexity': ['error', COMPLEXITY_LIMITS.BASE], // error, не warn (строже документации)
      'max-depth': ['error', DEPTH_LIMITS.BASE],
      'max-params': ['error', PARAMETERS_LIMITS.BASE],
      'max-nested-callbacks': ['error', PARAMETERS_LIMITS.NESTED_CALLBACKS],
      'max-statements-per-line': ['error', { max: PARAMETERS_LIMITS.STATEMENTS_PER_LINE }],

      // === ПРАВИЛО 13: ЗАПРЕТ ТЕХДОЛГА ===
      '@typescript-eslint/no-explicit-any': 'error', // НЕ warn!
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': 'allow-with-description',
          minimumDescriptionLength: DESCRIPTION_LENGTHS.TS_IGNORE_COMMENT,
        },
      ],
      'no-warning-comments': [
        'error',
        {
          terms: ['todo', 'fixme', 'hack', 'temp', 'xxx'],
          location: 'anywhere',
        },
      ],

      // === КАЧЕСТВО КОДА ===
      'prefer-const': 'error',
      'no-console': 'error', // Строго запрещено (кроме исключений)
      'no-debugger': 'error',
      'no-alert': 'error',
      
      // === PERFORMANCE ПРАВИЛА ===
      'no-loop-func': 'error',
      'no-caller': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },

  // === REACT КОМПОНЕНТЫ - БАЗОВЫЕ ПРАВИЛА ===
  {
    files: ['apps/**/*.{jsx,tsx}', 'packages/ui/**/*.{jsx,tsx}'],
    rules: {
      // === БАЗОВЫЕ TYPESCRIPT ПРАВИЛА ДЛЯ REACT ===
      '@typescript-eslint/no-unused-vars': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // === API СЛОЙ - ДОПОЛНИТЕЛЬНЫЕ SECURITY ПРАВИЛА ===
  {
    files: ['apps/web/src/server/**/*.ts', 'apps/*/pages/api/**/*.ts'],
    rules: {
      // === API PERFORMANCE ===
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
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
      'no-undef': 'off' // Node.js globals
    },
  },

  // === ESLINT CONFIG ПАКЕТ - ОСОБЫЕ ПРАВИЛА ===
  {
    files: ['packages/eslint-config/**/*.{js,mjs}'],
    rules: {
      // Конфиг файлы могут содержать magic numbers для правил
      'no-magic-numbers': 'off',
      // Могут содержать примеры localhost в описаниях
      'no-restricted-syntax': 'off',
      // Дублирующиеся ключи в конфиге - это ошибка
      'no-dupe-keys': 'error'
    },
  },

  // === tRPC MIDDLEWARE И API СЛОЙ ===
  {
    files: [
      'apps/web/src/server/trpc/**/*.ts',
      'apps/web/pages/api/trpc/**/*.ts'
    ],
    rules: {
      // tRPC инфраструктура может логировать (согласно DEVELOPER_GUIDE.md)
      'no-console': 'warn', // warn вместо error
      // API слой может иметь более сложную логику
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.API_ENDPOINTS }],
      'complexity': ['error', COMPLEXITY_LIMITS.API_LAYER] // Увеличенная сложность для API
    },
  },

  // === ТЕСТЫ И PLAYWRIGHT ===
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}', 'tests/**/*.{js,ts}', '**/__tests__/**/*'],
    rules: {
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.TESTS }], // Увеличенный лимит для тестов
      'no-magic-numbers': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'no-restricted-syntax': 'off', // Разрешаем localhost в тестах
      '@typescript-eslint/no-unused-vars': 'off',
      'turbo/no-undeclared-env-vars': 'off' // CI/PLAYWRIGHT переменные
    },
  },

  // === JEST КОНФИГУРАЦИИ ===
  {
    files: ['**/jest.config.{js,ts}', '**/jest.setup.{js,ts}'],
    rules: {
      'no-undef': 'off',
      'unicorn/prefer-module': 'off',
      '@typescript-eslint/no-require-imports': 'off'
    },
  },

  // === TAILWIND И POSTCSS КОНФИГУРАЦИИ ===
  {
    files: ['**/tailwind.config.{js,ts}', '**/postcss.config.{js,ts}'],
    rules: {
      'no-undef': 'off',
      'unicorn/prefer-module': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'sonarjs/no-duplicate-string': 'off'
    },
  },

  // === STORYBOOK ФАЙЛЫ ===
  {
    files: ['**/*.stories.{js,jsx,ts,tsx}', '**/stories/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'off', // Демо компоненты могут логировать
      'no-alert': 'off',   // Демо взаимодействия
      '@typescript-eslint/no-unused-vars': 'off'
    },
  },

  // === UI БИБЛИОТЕКА - СПЕЦИАЛЬНЫЕ ПРАВИЛА ===
  {
    files: ['packages/ui/**/*.{js,jsx,ts,tsx}'],
    rules: {
      // UI компоненты могут быть больше из-за JSX
      'max-lines': ['error', { max: FILE_SIZE_LIMITS.UI_LIBRARY }],
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.UI_COMPONENTS }], // Немного больше для UI
      // Demo компоненты могут использовать console
      'no-console': 'warn', // warn вместо error
    },
  },

  // === УТИЛИТЫ И EXCHANGE-CORE - ВЫСОКОЕ КАЧЕСТВО ===
  {
    files: ['packages/utils/**/*.{ts,tsx}', 'packages/exchange-core/**/*.{ts,tsx}'],
    rules: {
      // === ЧИСТЫЕ ФУНКЦИИ ===
      'no-console': 'error',
      'no-alert': 'error',
      
      // === ПОВЫШЕННОЕ КАЧЕСТВО ===
      'complexity': ['error', COMPLEXITY_LIMITS.UTILS], // Строже базового
      'max-statements': ['error', 10],
      'max-nested-callbacks': ['error', 2],
      
      // === ФУНКЦИОНАЛЬНОЕ ПРОГРАММИРОВАНИЕ ===
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-param-reassign': 'error',
    },
  },
  {
    files: [
      'packages/constants/**/*.ts', 
      'packages/exchange-core/src/utils/validation.ts',
      'packages/exchange-core/src/utils/calculations.ts'
    ],
    rules: {
      // Константы и валидация могут содержать magic numbers
      'no-magic-numbers': ['error', {
        ignore: MAGIC_NUMBERS.COMMON, // Частые значения из централизованных констант
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        ignoreClassFieldInitialValues: true
      }]
    },
  },

  // === EXCHANGE-CORE УТИЛИТЫ ===
  {
    files: ['packages/exchange-core/**/*.{js,ts}'],
    rules: {
      // Криптографические функции могут использовать magic numbers
      'no-magic-numbers': ['error', {
        ignore: MAGIC_NUMBERS.CRYPTO, // Частые значения в crypto из централизованных констант
        ignoreArrayIndexes: true
      }],
      // Non-null assertions допустимы в crypto операциях
      '@typescript-eslint/no-non-null-assertion': 'warn'
    },
  },

  // === ДОКУМЕНТАЦИЯ И ПРИМЕРЫ ===
  {
    files: ['docs/**/*.ts', '**/*.examples.ts', '**/CONSTANTS_EXAMPLES.ts'],
    rules: {
      // Документация может содержать console
      'no-console': 'off',
      // Примеры могут использовать magic numbers
      'no-magic-numbers': 'off'
    },
  },

  // === PLAYWRIGHT И CI КОНФИГУРАЦИЯ ===
  {
    files: ['playwright.config.ts', 'turbo.json'],
    rules: {
      // CI переменные не нужно объявлять в turbo.json для тестов
      'turbo/no-undeclared-env-vars': 'off',
      // Localhost допустим в test конфигурации
      'no-restricted-syntax': 'off'
    },
  },

  // === SCRIPTS И УТИЛИТЫ ===
  {
    files: ['scripts/**/*.js'],
    rules: {
      // Scripts могут использовать console и неиспользуемые переменные
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
      // Могут иметь более глубокую вложенность
      'max-depth': ['error', DEPTH_LIMITS.SCRIPTS],
    },
  },

  // === TSUP CONFIG ИСКЛЮЧЕНИЯ ===
  {
    files: ['**/tsup.config.ts'],
    rules: {
      // tsup конфигурация может использовать @ts-nocheck
      '@typescript-eslint/ban-ts-comment': 'off'
    },
  },

  // === ОСНОВНЫЕ СТРАНИЦЫ И КОМПОНЕНТЫ ===
  {
    files: [
      // Паттерны для основных страниц
      'apps/*/app/page.tsx',
      'apps/*/app/**/page.tsx',
      'apps/*/src/components/**/Order*.tsx',
      'apps/*/src/components/**/Dashboard*.tsx',
      // Основные хуки с состоянием
      'packages/hooks/src/use*Store.ts',
      'packages/hooks/src/use*Notifications.ts'
    ],
    rules: {
      // Основные страницы могут быть больше
      'max-lines': ['error', { max: FILE_SIZE_LIMITS.MAIN_PAGES }],
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.MAIN_PAGES }],
      // TODO в main pages - это планируемые фичи, не техдолг
      'no-warning-comments': 'warn' // warn вместо error
    },
  },

  // === DASHBOARD И СЛОЖНЫЕ СТРАНИЦЫ ===
  {
    files: [
      'apps/*/app/**/dashboard/**/*.tsx',
      'apps/*/src/pages/**/dashboard/**/*.tsx'
    ],
    rules: {
      // Dashboard может быть немного больше
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.DASHBOARD }]
    },
  },

  // === ХУКИ С УВЕЛИЧЕННЫМ ЛИМИТОМ ===
  {
    files: ['packages/hooks/**/*.{js,ts,tsx}'],
    rules: {
      // Хуки могут быть немного больше из-за state logic
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.HOOKS }]
    },
  }
];
