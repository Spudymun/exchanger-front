// Main Style Scanner - РЕФАКТОРИНГ: теперь использует архитектуру сканеров
// Этот файл сохраняется для обратной совместимости

// Импортируем новую архитектуру
import { MainScanner, scanStyles } from '../scanners/main-scanner.js';
import type { ScannerConfig } from '../types/scanner.js';

/**
 * @deprecated Используйте MainScanner из '../scanners/main-scanner.js'
 * Этот класс сохраняется для обратной совместимости
 */
export class StyleScanner extends MainScanner {
  constructor(config: Partial<ScannerConfig> = {}) {
    super(config);
  }
}

/**
 * @deprecated Используйте scanStyles из '../scanners/main-scanner.js'
 * Эта функция сохраняется для обратной совместимости
 */
export { scanStyles };
