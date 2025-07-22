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
 * Стили компонента с разделением на статические и динамические
 */
export interface ComponentStyles {
  readonly tailwind: readonly string[];
  readonly cssModules: readonly CSSModule[];
  readonly cssInJs: readonly string[];
  readonly dynamicClasses?: readonly DynamicClassPattern[]; // НОВОЕ: динамические классы
}

/**
 * Информация о динамическом паттерне класса
 */
export interface DynamicClassPattern {
  readonly pattern: string;
  readonly type: 'cn' | 'clsx' | 'twMerge' | 'template' | 'conditional';
  readonly line?: number;
  readonly originalCode: string;
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
  readonly uiComponentsCache?: ComponentNode[]; // UI components for style aggregation
}

/**
 * Результат сканирования layout-компонентов
 */
export interface LayoutScanResult {
  readonly layoutPath: string;
  readonly layoutType: 'root' | 'nested' | 'component';
  readonly components: readonly ComponentNode[];
  readonly errors: readonly ScanError[];
}

/**
 * Результат сканирования UI-компонентов
 */
export interface UIScanResult {
  readonly uiPath: string;
  readonly componentType: 'button' | 'input' | 'select' | 'card' | 'dialog' | 'other';
  readonly components: readonly ComponentNode[];
  readonly errors: readonly ScanError[];
}

/**
 * Результат полного сканирования проекта
 */
export interface ProjectScanResult {
  readonly projectName: string;
  readonly pages: readonly PageScanResult[];
  readonly layouts: readonly LayoutScanResult[];
  readonly uiComponents: readonly UIScanResult[];
  readonly summary: ScanSummary;
}

/**
 * Сводка по сканированию
 */
export interface ScanSummary {
  readonly totalPages: number;
  readonly totalLayouts: number;
  readonly totalUIComponents: number;
  readonly totalComponents: number;
  readonly totalErrors: number;
  readonly scanDuration: number;
}
