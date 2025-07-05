/**
 * Утилиты и core библиотеки - максимально строгие правила
 * Функциональное программирование и высокое качество кода
 */

import { functionalRules, baseTsRules, consoleRules } from './shared-rules.js';

export const utilsConfig = [
  // === УТИЛИТЫ И EXCHANGE-CORE - ВЫСОКОЕ КАЧЕСТВО ===
  {
    files: ['packages/utils/**/*.{ts,tsx}', 'packages/exchange-core/**/*.{ts,tsx}'],
    rules: {
      ...functionalRules,
      ...consoleRules.strict, // Утилиты не должны логировать
    },
  },

  // === КОНСТАНТЫ И ВАЛИДАЦИЯ ===
  {
    files: [
      'packages/constants/**/*.ts',
      'packages/exchange-core/src/utils/validation.ts',
      'packages/exchange-core/src/utils/calculations.ts',
    ],
    rules: {
      ...baseTsRules,
      ...consoleRules.strict,
    },
  },

  // === EXCHANGE-CORE УТИЛИТЫ ===
  {
    files: ['packages/exchange-core/**/*.{js,ts}'],
    rules: {
      ...baseTsRules,
      ...consoleRules.strict,
      // Non-null assertions допустимы в crypto операциях
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
];
