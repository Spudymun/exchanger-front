/**
 * Style Scanner
 * Главный модуль для сканирования стилей в React компонентах
 */

export * from './types/scanner.js';
export * from './constants/index.js';
export * from './config/default-patterns.js';
export * from './config/performance.js';
export * from './utils/file-utils.js';
export * from './utils/component-parser-simple.js';
export * from './utils/style-extractor.js';
export * from './core/component-tree-simple.js';

// НОВАЯ АРХИТЕКТУРА СЕРВИСОВ
export * from './services/index.js';

// НОВАЯ АРХИТЕКТУРА СКАНЕРОВ
export * from './scanners/index.js';

// ОБРАТНАЯ СОВМЕСТИМОСТЬ (устаревшие экспорты)
export * from './core/main-scanner.js';
