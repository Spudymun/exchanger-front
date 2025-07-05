/**
 * API и tRPC-специфичные правила
 * Включает security и performance правила для серверного кода
 */

import { baseTsRules, performanceRules, consoleRules } from './shared-rules.js';

export const apiConfig = [
  // === API СЛОЙ - ДОПОЛНИТЕЛЬНЫЕ SECURITY ПРАВИЛА ===
  {
    files: ['apps/web/src/server/**/*.ts', 'apps/*/pages/api/**/*.ts'],
    rules: {
      ...baseTsRules,
      ...performanceRules,
      ...consoleRules.strict, // API слой не должен логировать
    },
  },

  // === tRPC MIDDLEWARE И API СЛОЙ ===
  {
    files: ['apps/web/src/server/trpc/**/*.ts', 'apps/web/pages/api/trpc/**/*.ts'],
    rules: {
      ...baseTsRules,
      ...performanceRules,
      ...consoleRules.warn, // tRPC инфраструктура может логировать (согласно DEVELOPER_GUIDE.md)
    },
  },
];
