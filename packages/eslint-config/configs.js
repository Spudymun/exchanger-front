/**
 * Конфигурационные файлы и скрипты
 * Более мягкие правила для build инфраструктуры
 */

import { configRelaxedRules, demoRelaxedRules } from './shared-rules.js';

export const configsConfig = [
  // === КОНФИГУРАЦИИ И СКРИПТЫ ===
  {
    files: ['*.config.{js,mjs,ts}', 'scripts/**/*.{js,mjs}', '.storybook/**/*.{js,ts}'],
    rules: {
      ...configRelaxedRules,
    },
  },

  // === ESLINT CONFIG ПАКЕТ - ОСОБЫЕ ПРАВИЛА ===
  {
    files: ['packages/eslint-config/**/*.{js,mjs}'],
    rules: {
      ...configRelaxedRules,
      'no-restricted-syntax': 'off', // Могут содержать примеры localhost в описаниях
      'no-dupe-keys': 'error', // Дублирующиеся ключи в конфиге - это ошибка
    },
  },

  // === TAILWIND И POSTCSS КОНФИГУРАЦИИ ===
  {
    files: ['**/tailwind.config.{js,ts}', '**/postcss.config.{js,ts}'],
    rules: {
      ...configRelaxedRules,
      'sonarjs/no-duplicate-string': 'off',
    },
  },

  // === TSUP CONFIG ИСКЛЮЧЕНИЯ ===
  {
    files: ['**/tsup.config.ts'],
    rules: {
      ...configRelaxedRules,
      '@typescript-eslint/ban-ts-comment': 'off', // tsup конфигурация может использовать @ts-nocheck
    },
  },

  // === SCRIPTS И УТИЛИТЫ ===
  {
    files: ['scripts/**/*.js'],
    rules: {
      ...configRelaxedRules,
      'unused-imports/no-unused-vars': 'off',
    },
  },

  // === ДОКУМЕНТАЦИЯ И ПРИМЕРЫ ===
  {
    files: ['docs/**/*.ts', '**/*.examples.ts', '**/CONSTANTS_EXAMPLES.ts'],
    rules: {
      ...demoRelaxedRules,
    },
  },
];
