/**
 * Style Scanner Types
 * Централизованные типы для сканера стилей
 */

/**
 * Конфигурация сканирования стилей
 */
export interface ScannerConfig {
  readonly outputDir: string;
  readonly pattern: string;
  readonly exclude: readonly string[];
  readonly verbose: boolean;
  readonly dryRun: boolean;
}

/**
 * Результат сканирования одной страницы
 */
export interface PageScanResult {
  readonly pagePath: string;
  readonly components: readonly ComponentNode[];
  readonly errors: readonly ScanError[];
}

/**
 * Узел дерева компонентов
 */
export interface ComponentNode {
  readonly name: string;
  readonly filePath: string;
  readonly styles: ComponentStyles;
  children: ComponentNode[]; // Мутабельный для построения дерева
  readonly depth: number;
  readonly imports: readonly ImportInfo[];
  readonly exports: readonly ExportInfo[];
  errors: ScanError[]; // Мутабельный для добавления ошибок
}

/**
 * Информация об импорте
 */
export interface ImportInfo {
  readonly name: string;
  readonly localName: string;
  readonly source: string;
  readonly type: 'default' | 'named' | 'namespace';
}

/**
 * Информация об экспорте
 */
export interface ExportInfo {
  readonly name: string;
  readonly type: 'default' | 'named';
}

/**
 * Стили компонента
 */
export interface ComponentStyles {
  readonly tailwind: readonly string[];
  readonly cssModules: readonly CSSModule[];
  readonly cssInJs: readonly string[];
}

/**
 * CSS модуль
 */
export interface CSSModule {
  readonly filePath: string;
  readonly content: string;
}

/**
 * Ошибка сканирования
 */
export interface ScanError {
  readonly type: 'parse_error' | 'import_error' | 'file_not_found' | 'invalid_syntax';
  readonly message: string;
  readonly filePath: string;
  readonly line?: number;
  readonly column?: number;
}

/**
 * Опции построения дерева компонентов
 */
export interface ComponentTreeOptions {
  readonly maxDepth: number;
  readonly includeNodeModules: boolean;
  readonly verbose: boolean;
}

/**
 * Результат полного сканирования проекта
 */
export interface ProjectScanResult {
  readonly projectName: string;
  readonly pages: readonly PageScanResult[];
  readonly summary: ScanSummary;
}

/**
 * Сводка по сканированию
 */
export interface ScanSummary {
  readonly totalPages: number;
  readonly totalComponents: number;
  readonly totalErrors: number;
  readonly scanDuration: number;
}
