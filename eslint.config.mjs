// eslint.config.mjs - ЕДИНСТВЕННАЯ конфигурация для всего проекта с LAZY LOADING
import { 
  COMPLEXITY_LIMITS, 
  FUNCTION_SIZE_LIMITS, 
  FILE_SIZE_LIMITS, 
  DEPTH_LIMITS, 
  PARAMETERS_LIMITS, 
  DESCRIPTION_LENGTHS
} from './packages/constants/dist/index.js';

import { apiConfig } from './packages/eslint-config/api.js';
import { config as baseConfig } from './packages/eslint-config/base.js';
import { configsConfig } from './packages/eslint-config/configs.js';
import { allIgnores } from './packages/eslint-config/ignores.js';
import { performanceMetrics, lazyLoadConfig } from './packages/eslint-config/lazy-loading.js';
import { createReactConfig } from './packages/eslint-config/react.js';
import { testingConfig } from './packages/eslint-config/testing.js';
import { utilsConfig } from './packages/eslint-config/utils.js';

// === PERFORMANCE TIMING START ===
const configStartTime = Date.now();

// === LAZY LOADED CONFIGS ===
const reactConfig = lazyLoadConfig('react-main', () => createReactConfig());

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig[]} */
export default [
  // === КРИТИЧЕСКИЕ IGNORES (устраняют 80%+ warnings) ===
  {
    name: 'global-ignores',
    ignores: allIgnores,
  },

  // === БАЗОВАЯ КОНФИГУРАЦИЯ ДЛЯ ВСЕХ ФАЙЛОВ ===
  ...baseConfig,
  
  {
    name: 'global-rules',
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: lazyLoadConfig('global-rules', () => ({
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
    })),
  },

  // === МОДУЛЬНЫЕ КОНФИГУРАЦИИ (LAZY LOADED) ===
  ...reactConfig,
  ...apiConfig,
  ...configsConfig,
  ...testingConfig,
  ...utilsConfig,

  // === СПЕЦИАЛЬНЫЕ ПРАВИЛА ДЛЯ КОНСТАНТ И MAGIC NUMBERS ===
  {
    name: 'constants-magic-numbers',
    files: [
      'packages/constants/**/*.ts', 
      'packages/exchange-core/src/utils/validation.ts',
      'packages/exchange-core/src/utils/calculations.ts'
    ],
    rules: lazyLoadConfig('constants-rules', () => ({
      // Все magic numbers должны быть заменены на семантические константы
      'no-magic-numbers': ['error', {
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        ignoreClassFieldInitialValues: true
      }]
    })),
  },

  // === EXCHANGE-CORE CRYPTO УТИЛИТЫ ===
  {
    name: 'crypto-utils',
    files: ['packages/exchange-core/**/*.{js,ts}'],
    rules: lazyLoadConfig('crypto-rules', () => ({
      // Все magic numbers должны быть заменены на семантические константы
      'no-magic-numbers': ['error', {
        ignoreArrayIndexes: true
      }],
    })),
  },

  // === ДИНАМИЧЕСКИЕ ЛИМИТЫ ДЛЯ СЛОЖНЫХ КОМПОНЕНТОВ ===
  {
    name: 'ui-size-limits',
    files: ['packages/ui/**/*.{js,jsx,ts,tsx}'],
    rules: lazyLoadConfig('ui-size-rules', () => ({
      // UI компоненты могут быть больше из-за JSX
      'max-lines': ['error', { max: FILE_SIZE_LIMITS.UI_LIBRARY }],
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.UI_COMPONENTS }],
    })),
  },

  {
    name: 'main-pages-size',
    files: [
      'apps/*/app/page.tsx',
      'apps/*/app/**/page.tsx',
      'apps/*/src/components/**/Order*.tsx',
      'apps/*/src/components/**/Dashboard*.tsx',
    ],
    rules: lazyLoadConfig('main-pages-size-rules', () => ({
      // Основные страницы могут быть больше
      'max-lines': ['error', { max: FILE_SIZE_LIMITS.MAIN_PAGES }],
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.MAIN_PAGES }],
    })),
  },

  {
    name: 'dashboard-size',
    files: [
      'apps/*/app/**/dashboard/**/*.tsx',
      'apps/*/src/pages/**/dashboard/**/*.tsx'
    ],
    rules: lazyLoadConfig('dashboard-size-rules', () => ({
      // Dashboard может быть немного больше
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.DASHBOARD }]
    })),
  },

  {
    name: 'hooks-size',
    files: ['packages/hooks/**/*.{js,ts,tsx}'],
    rules: lazyLoadConfig('hooks-size-rules', () => ({
      // Хуки могут быть немного больше из-за state logic
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.HOOKS }]
    })),
  },

  {
    name: 'api-complexity',
    files: ['apps/web/src/server/trpc/**/*.ts', 'apps/web/pages/api/trpc/**/*.ts'],
    rules: lazyLoadConfig('api-complexity-rules', () => ({
      // API слой может иметь более сложную логику
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.API_ENDPOINTS }],
      'complexity': ['error', COMPLEXITY_LIMITS.API_LAYER],
      'no-console': 'off', // Разрешено для логирования согласно DEVELOPER_GUIDE.md
    })),
  },

  {
    name: 'test-size',
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    rules: lazyLoadConfig('test-size-rules', () => ({
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.TESTS }],
    })),
  },

  {
    name: 'utils-quality',
    files: ['packages/utils/**/*.{ts,tsx}', 'packages/exchange-core/**/*.{ts,tsx}'],
    rules: lazyLoadConfig('utils-quality-rules', () => ({
      // === ПОВЫШЕННОЕ КАЧЕСТВО ===
      'complexity': ['error', COMPLEXITY_LIMITS.UTILS], // Строже базового
      'max-statements': ['error', 10],
      'max-nested-callbacks': ['error', 2],
    })),
  },

  // === ESLINT CONFIG INFRASTRUCTURE ===
  {
    name: 'eslint-config-infrastructure',
    files: ['packages/eslint-config/**/*.js'],
    rules: lazyLoadConfig('eslint-config-rules', () => ({
      // ESLint конфигурация может быть больше и содержать инфраструктурный код
      'max-lines-per-function': ['error', { max: 100 }], // Больше лимит для config функций
      'no-console': 'off', // Разрешено для performance мониторинга
      'promise/catch-or-return': 'off', // Разрешено в benchmark утилитах
      'promise/always-return': 'off', // Разрешено в benchmark утилитах
    })),
  },

  // === HOOKS LAYER SECURITY OVERRIDES ===
  {
    name: 'hooks-security-overrides',
    files: ['packages/hooks/**/*.{ts,tsx}'],
    rules: lazyLoadConfig('hooks-security-rules', () => ({
      // Разрешено object injection для типизированных theme объектов
      'security/detect-object-injection': 'off',
    })),
  },

  // === ROOT CONFIG FILES ===
  {
    name: 'root-configs',
    files: ['*.config.{js,mjs,ts}', 'jest.config.js'],
    rules: lazyLoadConfig('root-config-rules', () => ({
      'no-console': 'off', // Разрешено в конфигурационных файлах
      'sonarjs/no-duplicate-string': 'off', // Разрешено дублирование в конфигах
    })),
  },

  // === SECURITY FALSE POSITIVES OVERRIDES ===
  {
    name: 'crypto-enum-access',
    files: [
      'packages/exchange-core/src/utils/crypto.ts',
      'packages/exchange-core/src/utils/calculations.ts',
      'packages/exchange-core/src/data/manager.ts'
    ],
    rules: lazyLoadConfig('crypto-enum-rules', () => ({
      // Разрешено object injection для типизированного enum-based доступа
      'security/detect-object-injection': 'off',
      // Разрешено non-null assertion для типизированных индексов
      '@typescript-eslint/no-non-null-assertion': 'off',
    })),
  },

  {
    name: 'build-scripts-access',
    files: ['scripts/**/*.js'],
    rules: lazyLoadConfig('build-scripts-rules', () => ({
      // Могут иметь более глубокую вложенность
      'max-depth': ['error', DEPTH_LIMITS.SCRIPTS],
      'no-console': 'off', // Разрешено для build scripts
      '@typescript-eslint/no-unused-vars': 'off', // Разрешено в утилитарных скриптах
      'security/detect-object-injection': 'off', // Разрешено для package.json доступа
    })),
  },

  {
    name: 'ui-demo-components',
    files: ['packages/ui/**/*.{tsx,jsx}'],
    rules: lazyLoadConfig('ui-demo-rules', () => ({
      // UI компоненты могут быть больше из-за JSX
      'max-lines': ['error', { max: FILE_SIZE_LIMITS.UI_LIBRARY }],
      'max-lines-per-function': ['error', { max: FUNCTION_SIZE_LIMITS.UI_COMPONENTS }],
      'no-console': 'off', // Разрешено для demo функций в UI компонентах
    })),
  },
];

// === PERFORMANCE REPORTING ===
const totalConfigTime = Date.now() - configStartTime;
performanceMetrics.recordLoadTime('main-config', configStartTime);

if (totalConfigTime > 100) {
  console.warn(`ESLint config loading took ${totalConfigTime}ms - consider optimizing`);
} else {
  console.debug(`ESLint config loaded in ${totalConfigTime}ms`);
}
