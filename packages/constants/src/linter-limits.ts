/**
 * Централизованные лимиты для линтеров
 * Согласно ai-agent-rules.yml (правило 19) - все константы должны быть централизованы
 */

// === БАЗОВЫЕ ЛИМИТЫ КАЧЕСТВА КОДА ===
export const COMPLEXITY_LIMITS = {
  /** Базовая цикломатическая сложность согласно CODE_STYLE_GUIDE.md */
  BASE: 10,
  /** Увеличенная для API слоя (tRPC middleware) */
  API_LAYER: 15,
  /** Уменьшенная для утилит (требуют высокого качества) */
  UTILS: 8,
} as const;

export const FUNCTION_SIZE_LIMITS = {
  /** Максимальные строки в функции согласно CODE_STYLE_GUIDE.md */
  BASE: 50,
  /** Увеличенный лимит для UI компонентов */
  UI_COMPONENTS: 80,
  /** Увеличенный лимит для API endpoints */
  API_ENDPOINTS: 80,
  /** Увеличенный лимит для тестов */
  TESTS: 100,
  /** Увеличенный лимит для основных страниц */
  MAIN_PAGES: 70,
  /** Увеличенный лимит для dashboard */
  DASHBOARD: 65,
  /** Увеличенный лимит для хуков */
  HOOKS: 60,
} as const;

export const FILE_SIZE_LIMITS = {
  /** Максимальные строки в файле (базовый лимит) */
  BASE: 300,
  /** Увеличенный лимит для UI библиотеки */
  UI_LIBRARY: 400,
  /** Увеличенный лимит для основных страниц */
  MAIN_PAGES: 350,
} as const;

export const DEPTH_LIMITS = {
  /** Максимальная глубина вложенности согласно CODE_STYLE_GUIDE.md */
  BASE: 2,
  /** Увеличенная для scripts */
  SCRIPTS: 4,
} as const;

export const PARAMETERS_LIMITS = {
  /** Максимальное количество параметров функции */
  BASE: 4,
  /** Максимальное количество callbacks */
  NESTED_CALLBACKS: 3,
  /** Максимальное количество statements в строке */
  STATEMENTS_PER_LINE: 1,
} as const;

// === MAGIC NUMBERS ДЛЯ РАЗНЫХ СЛОЕВ ===
// Числа объявлены как константы для избежания magic numbers в самой конфигурации
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MILLISECONDS_IN_SECOND = 1000;

export const MAGIC_NUMBERS = {
  /** Общие допустимые magic numbers */
  COMMON: [0, 1, -1, 2, 7, 8, 9, 10, 36, 100, 5000],
  /** Криптографические константы */
  CRYPTO: [0, 1, -1, 8, 9, 10, 36, 5000],
  /** Временные константы */
  TIME: [0, 1, -1, HOURS_IN_DAY, MINUTES_IN_HOUR, 100, MILLISECONDS_IN_SECOND],
} as const;

// === ДЛИНА ОПИСАНИЙ ===
export const DESCRIPTION_LENGTHS = {
  /** Минимальная длина описания для @ts-ignore */
  TS_IGNORE_COMMENT: 20,
} as const;

// === АРХИТЕКТУРНЫЕ СЛОИ ===
export const ARCHITECTURAL_LAYERS = {
  UI: 'packages/ui',
  API: 'apps/web/src/server/trpc',
  UTILS: 'packages/utils',
  CONSTANTS: 'packages/constants',
  EXCHANGE_CORE: 'packages/exchange-core',
  HOOKS: 'packages/hooks',
  TESTS: '**/*.{test,spec}.{js,jsx,ts,tsx}',
  SCRIPTS: 'scripts',
  CONFIGS: '*.config.{js,mjs,ts}',
  STORYBOOK: '**/*.stories.{js,jsx,ts,tsx}',
} as const;

// === ТИПЫ для конфигурации ===
export type ComplexityLimits = typeof COMPLEXITY_LIMITS;
export type FunctionSizeLimits = typeof FUNCTION_SIZE_LIMITS;
export type FileSizeLimits = typeof FILE_SIZE_LIMITS;
export type DepthLimits = typeof DEPTH_LIMITS;
export type ParametersLimits = typeof PARAMETERS_LIMITS;
export type MagicNumbers = typeof MAGIC_NUMBERS;
export type ArchitecturalLayers = typeof ARCHITECTURAL_LAYERS;
