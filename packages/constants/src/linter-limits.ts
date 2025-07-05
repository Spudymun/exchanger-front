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
export type ArchitecturalLayers = typeof ARCHITECTURAL_LAYERS;
