/**
 * Style Scanner Constants
 * Централизованные константы в соответствии с архитектурой проекта
 * Теперь использует конфигурируемые паттерны вместо hardcoded значений
 */

import { generateFilePatterns, DEFAULT_PROJECT_STRUCTURE } from '../config/default-patterns.js';
import {
  DEPTH_LIMITS,
  TIMEOUT_CONFIG,
  PERFORMANCE_CONFIG,
  COMPONENT_HEURISTICS,
} from '../config/performance.js';

/**
 * Паттерны поиска файлов (конфигурируемые)
 */
export const FILE_PATTERNS = generateFilePatterns(DEFAULT_PROJECT_STRUCTURE);

/**
 * Дополнительные паттерны файлов
 */
export const ADDITIONAL_PATTERNS = {
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
  CVA: /cva\s*\(\s*["']([^"']+)["']/g,
} as const;

/**
 * Конфигурация по умолчанию (теперь с обоснованными значениями)
 */
export const DEFAULT_CONFIG = {
  OUTPUT_DIR: 'docs/styles',
  VERBOSE: false,
  DRY_RUN: false,
  MAX_DEPTH: DEPTH_LIMITS.MAX_COMPONENT_DEPTH, // Из конфигурации производительности
  TIMEOUT: TIMEOUT_CONFIG.FULL_SCAN, // Из конфигурации производительности
} as const;

/**
 * Константы таймаутов (теперь из конфигурации)
 */
export const SCAN_TIMEOUTS = {
  FULL_SCAN: TIMEOUT_CONFIG.FULL_SCAN,
  FAST_SCAN: TIMEOUT_CONFIG.FAST_SCAN,
  MINIMAL_SCAN: TIMEOUT_CONFIG.MINIMAL_SCAN,
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
