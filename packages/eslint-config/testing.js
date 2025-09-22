/**
 * Тестовые правила для Jest, Playwright и других тестовых фреймворков
 */

import { testRelaxedRules } from './shared-rules.js';

export const testingConfig = [
  // === ТЕСТЫ И PLAYWRIGHT ===
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}', 'tests/**/*.{js,ts}', '**/__tests__/**/*'],
    rules: {
      ...testRelaxedRules,
    },
  },

  // === JEST КОНФИГУРАЦИИ ===
  {
    files: ['**/jest.config.{js,ts}', '**/jest.setup.{js,ts}'],
    rules: {
      'no-undef': 'off',
      'unicorn/prefer-module': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // === PLAYWRIGHT И CI КОНФИГУРАЦИЯ ===
  {
    files: ['playwright.config.ts'],
    rules: {
      'turbo/no-undeclared-env-vars': 'off',
      'no-restricted-syntax': 'off', // Localhost допустим в test конфигурации
    },
  },
];
