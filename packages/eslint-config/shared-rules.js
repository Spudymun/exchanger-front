import { memoize } from './lazy-loading.js';

/**
 * Централизованные shared правила для избежания дублирования
 * Согласно ai-agent-rules.yml - устраняем технический долг через централизацию
 */

// === БАЗОВЫЕ TYPESCRIPT ПРАВИЛА ===
export const baseTsRules = {
  '@typescript-eslint/no-unused-vars': 'error',
  'prefer-const': 'error',
  'no-var': 'error',
};

// === PERFORMANCE И SECURITY ПРАВИЛА ===
export const performanceRules = {
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',
  'no-loop-func': 'error',
  'no-caller': 'error',
};

// === КАЧЕСТВО КОДА ===
export const qualityRules = {
  'no-debugger': 'error',
  'no-alert': 'error',
  'prefer-arrow-callback': 'error',
  'no-param-reassign': 'error',
};

// === RELAXED ПРАВИЛА ДЛЯ КОНФИГОВ ===
export const configRelaxedRules = {
  'no-console': 'off',
  'no-magic-numbers': 'off',
  'unicorn/prefer-module': 'off',
  '@typescript-eslint/no-require-imports': 'off',
  'no-undef': 'off', // Node.js globals
};

// === RELAXED ПРАВИЛА ДЛЯ ТЕСТОВ ===
export const testRelaxedRules = {
  'no-magic-numbers': 'off',
  'sonarjs/no-duplicate-string': 'off',
  'no-restricted-syntax': 'off', // Разрешаем localhost в тестах
  '@typescript-eslint/no-unused-vars': 'off',
  'turbo/no-undeclared-env-vars': 'off', // CI/PLAYWRIGHT переменные
};

// === DEMO/EXAMPLES ПРАВИЛА ===
export const demoRelaxedRules = {
  'no-console': 'off',
  'no-alert': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  'no-magic-numbers': 'off',
};

// === ФУНКЦИОНАЛЬНОЕ ПРОГРАММИРОВАНИЕ (для utils) ===
export const functionalRules = {
  ...baseTsRules,
  ...performanceRules,
  ...qualityRules,
  'max-statements': ['error', 10],
  'max-nested-callbacks': ['error', 2],
};

// === CONSOLE ПРАВИЛА (разные уровни строгости) ===
export const consoleRules = {
  strict: { 'no-console': 'error' },
  warn: { 'no-console': 'warn' },
  off: { 'no-console': 'off' },
};

// === МЕМОИЗИРОВАННЫЕ ПРАВИЛА ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ ===
export const createOptimizedBaseTsRules = memoize(() => ({
  '@typescript-eslint/no-unused-vars': 'error',
  'prefer-const': 'error',
  'no-var': 'error',
}));

export const createOptimizedPerformanceRules = memoize(() => ({
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',
  'no-loop-func': 'error',
  'no-caller': 'error',
}));

export const createOptimizedQualityRules = memoize(() => ({
  'no-debugger': 'error',
  'no-alert': 'error',
  'prefer-arrow-callback': 'error',
  'no-param-reassign': 'error',
}));

// === ОПТИМИЗИРОВАННЫЕ КОМПОЗИТНЫЕ ПРАВИЛА ===
export const createFunctionalRules = memoize(() => ({
  ...createOptimizedBaseTsRules(),
  ...createOptimizedPerformanceRules(),
  ...createOptimizedQualityRules(),
  'max-statements': ['error', 10],
  'max-nested-callbacks': ['error', 2],
}));
