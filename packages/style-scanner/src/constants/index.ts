/**
 * Style Scanner Constants
 * Централизованные константы в соответствии с архитектурой проекта
 */

/**
 * Паттерны поиска файлов
 */
export const FILE_PATTERNS = {
  PAGES: [
    'apps/*/app/**/page.{tsx,jsx}', // apps/web/app/[locale]/page.tsx
    'apps/*/src/app/**/page.{tsx,jsx}', // apps/web/src/app/... (если есть)
  ],
  COMPONENTS: '**/*.{tsx,jsx}',
  CSS_MODULES: '**/*.module.{css,scss}',
  STYLE_FILES: '**/*.{css,scss,sass}',
} as const;

/**
 * Исключения при сканировании
 */
export const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  '.turbo/**',
  'coverage/**',
  'storybook-static/**',
] as const;

/**
 * Расширения поддерживаемых файлов
 */
export const SUPPORTED_EXTENSIONS = {
  REACT: ['.tsx', '.jsx'],
  STYLES: ['.css', '.scss', '.sass'],
  MODULES: ['.module.css', '.module.scss'],
} as const;

/**
 * Паттерны для извлечения className
 */
export const CLASSNAME_PATTERNS = {
  SIMPLE: /className\s*=\s*["']([^"']+)["']/g,
  TEMPLATE: /className\s*=\s*`([^`]+)`/g,
  OBJECT: /className\s*=\s*\{([^}]+)\}/g,
} as const;

/**
 * Конфигурация по умолчанию
 */
export const DEFAULT_CONFIG = {
  OUTPUT_DIR: 'docs/styles',
  VERBOSE: false,
  DRY_RUN: false,
  MAX_DEPTH: 5, // Уменьшили с 10 до 5 для предотвращения зависания
  TIMEOUT: 30000,
} as const;

/**
 * Константы таймаутов для обработки сложных страниц
 */
export const SCAN_TIMEOUTS = {
  FULL_SCAN: 30000, // 30 секунд - полное сканирование
  FAST_SCAN: 20000, // 20 секунд - быстрое сканирование
  MINIMAL_SCAN: 15000, // 15 секунд - минимальное сканирование
} as const;

/**
 * Сообщения об ошибках
 */
export const ERROR_MESSAGES = {
  FILE_NOT_FOUND: 'File not found',
  PARSE_ERROR: 'Failed to parse file',
  INVALID_SYNTAX: 'Invalid syntax in file',
  COMPONENT_NOT_FOUND: 'Component not found in file',
  STYLES_EXTRACTION_FAILED: 'Failed to extract styles',
} as const;

/**
 * Шаблоны для генерации документации
 */
export const MARKDOWN_TEMPLATES = {
  PAGE_HEADER: '# Проект: {projectName} — Страница: {pagePath}',
  COMPONENT_HEADER: '## {componentName}',
  STYLES_SECTION: '```css\n{styles}\n```',
} as const;
