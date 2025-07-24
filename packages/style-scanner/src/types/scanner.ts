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
 * Узел дерева компонентов (immutable)
 */
export interface ComponentNode {
  readonly name: string;
  readonly filePath: string;
  readonly styles: ComponentStyles;
  readonly children: readonly ComponentNode[]; // Теперь readonly
  readonly depth: number;
  readonly imports: readonly ImportInfo[];
  readonly exports: readonly ExportInfo[];
  readonly errors: readonly ScanError[]; // Теперь readonly
}

/**
 * Билдер для построения ComponentNode (мутабельный во время сборки)
 */
export interface ComponentNodeBuilder {
  name: string;
  filePath: string;
  styles: ComponentStyles;
  children: ComponentNode[]; // Мутабельный для построения
  depth: number;
  imports: ImportInfo[];
  exports: ExportInfo[];
  errors: ScanError[]; // Мутабельный для добавления ошибок
}

/**
 * Функции для работы с ComponentNode
 */
export namespace ComponentNode {
  /**
   * Создает новый билдер для ComponentNode
   */
  export function builder(name: string, filePath: string): ComponentNodeBuilder {
    return {
      name,
      filePath,
      styles: {
        tailwind: [],
        cssModules: [],
        cssInJs: [],
        dynamicClasses: [],
      },
      children: [],
      depth: 0,
      imports: [],
      exports: [],
      errors: [],
    };
  }

  /**
   * Преобразует билдер в immutable ComponentNode
   */
  export function build(builder: ComponentNodeBuilder): ComponentNode {
    return {
      name: builder.name,
      filePath: builder.filePath,
      styles: builder.styles,
      children: [...builder.children], // Создаем immutable копию
      depth: builder.depth,
      imports: [...builder.imports], // Создаем immutable копию
      exports: [...builder.exports], // Создаем immutable копию
      errors: [...builder.errors], // Создаем immutable копию
    };
  }

  /**
   * Добавляет ошибку к ComponentNode (возвращает новый объект)
   */
  export function addError(node: ComponentNode, error: ScanError): ComponentNode {
    return {
      ...node,
      errors: [...node.errors, error],
    };
  }

  /**
   * Добавляет дочерний компонент (возвращает новый объект)
   */
  export function addChild(node: ComponentNode, child: ComponentNode): ComponentNode {
    return {
      ...node,
      children: [...node.children, child],
    };
  }

  /**
   * Обновляет стили компонента (возвращает новый объект)
   */
  export function updateStyles(node: ComponentNode, styles: ComponentStyles): ComponentNode {
    return {
      ...node,
      styles,
    };
  }
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
