/**
 * Markdown Generator (Legacy - Backward Compatibility)
 *
 * @deprecated Используйте новую архитектуру из src/services/markdown-generator.ts
 * Этот файл сохранен для обратной совместимости и будет удален в следующих версиях.
 */

// Re-export новой архитектуры для обратной совместимости
export {
  MarkdownGenerator,
  generateMarkdownDocs,
  type MarkdownConfig,
} from '../services/markdown-generator.js';
