// Component Tree Builder - построение дерева компонентов
// Упрощенная версия без Babel AST для избежания проблем с типами

import { resolve, dirname, join } from 'node:path';

import type {
  ComponentTreeOptions,
  ComponentNodeBuilder,
  ImportInfo,
  ExportInfo,
  ScanError,
} from '../types/scanner.js';
import { ComponentNode } from '../types/scanner.js';

import { parseComponent } from '../utils/component-parser-simple.js';
import { readFileSafely, fileExists } from '../utils/file-utils.js';
import { extractStylesForLocalComponentWithUI } from '../utils/style-extractor.js';

/**
 * Строитель дерева компонентов
 * Упрощенная версия с regex парсингом
 */
export class ComponentTreeBuilder {
  private readonly options: ComponentTreeOptions;
  private readonly componentCache = new Map<string, ComponentNode>();
  private readonly processingSet = new Set<string>(); // Защита от циклических зависимостей

  constructor(options: ComponentTreeOptions) {
    this.options = options;
  }

  /**
   * Построение дерева компонентов для файла страницы
   */
  async buildComponentTree(pageFilePath: string): Promise<ComponentNode> {
    try {
      const rootComponent = await this.parseComponent(pageFilePath, 0);
      await this.resolveImports(rootComponent);

      if (this.options.verbose) {
        // eslint-disable-next-line no-console
        console.log(
          `    ✅ Component tree built: ${rootComponent.name} (${rootComponent.imports.length} imports)`
        );
      }

      return rootComponent;
    } catch (error) {
      if (this.options.verbose) {
        // eslint-disable-next-line no-console
        console.error(`    ❌ Failed to build component tree: ${error}`);
      }
      throw new Error(`Failed to build component tree for ${pageFilePath}: ${error}`);
    }
  }

  /**
   * Парсинг компонента из файла
   */
  private async parseComponent(filePath: string, depth: number): Promise<ComponentNode> {
    // СТРОГАЯ проверка глубины для предотвращения бесконечной рекурсии
    if (depth >= this.options.maxDepth) {
      if (this.options.verbose) {
        // eslint-disable-next-line no-console
        console.log(
          `      ⚠️  Max depth ${this.options.maxDepth} reached for ${filePath}, stopping recursion`
        );
      }
      return this.createErrorComponent(filePath, `Max depth ${this.options.maxDepth} exceeded`);
    }

    // НОРМАЛИЗАЦИЯ ПУТИ для правильного кэширования
    const cacheKey = resolve(filePath).toLowerCase().replace(/\\/g, '/');

    // Проверка кэша
    const cached = this.componentCache.get(cacheKey);
    if (cached) {
      if (this.options.verbose) {
        // eslint-disable-next-line no-console
        console.log(`      💾 Using cached component: ${cached.name}`);
      }
      return cached;
    }

    // СТРОГАЯ ЗАЩИТА ОТ ЦИКЛИЧЕСКИХ ЗАВИСИМОСТЕЙ с нормализованными путями
    if (this.processingSet.has(cacheKey)) {
      if (this.options.verbose) {
        // eslint-disable-next-line no-console
        console.log(`      🔄 Circular dependency detected for: ${filePath}`);
      }
      return this.createErrorComponent(filePath, 'Circular dependency detected');
    }

    // Добавляем в множество обрабатываемых файлов
    this.processingSet.add(cacheKey);

    try {
      // Проверка существования файла
      if (!(await fileExists(filePath))) {
        return this.createErrorComponent(filePath, 'File not found');
      }

      // Чтение и парсинг файла
      const content = await readFileSafely(filePath);
      if (!content) {
        return this.createErrorComponent(filePath, 'Empty file');
      }

      const parsedComponent = await parseComponent(content);

      // Используем builder pattern для создания componentNode
      const componentBuilder = ComponentNode.builder(
        parsedComponent.name || this.extractComponentName(filePath),
        cacheKey
      );
      componentBuilder.imports = this.convertToImportInfo(parsedComponent.imports);
      componentBuilder.exports = this.convertToExportInfo(parsedComponent.exports);
      componentBuilder.depth = depth;
      componentBuilder.errors = [...parsedComponent.errors];
      componentBuilder.styles = {
        tailwind: [],
        cssModules: [],
        cssInJs: [],
      };

      // ПРАВИЛЬНАЯ ОБРАБОТКА ЛОКАЛЬНЫХ КОМПОНЕНТОВ
      if (parsedComponent.localComponents && parsedComponent.localComponents.length > 0) {
        if (this.options.verbose) {
          // eslint-disable-next-line no-console
          console.log(
            `      🔍 Found ${parsedComponent.localComponents.length} local components: ${parsedComponent.localComponents.join(', ')}`
          );
        }

        // ИСПРАВЛЕНИЕ: НЕ создаём виртуальные компоненты для обычных файлов
        // Виртуальные компоненты создаются только в main-scanner.ts для UI компонентов
        for (const localCompName of parsedComponent.localComponents) {
          // Извлекаем стили для локального компонента с учетом UI компонентов
          const localStylesResult = await extractStylesForLocalComponentWithUI(
            content,
            localCompName,
            this.options.uiComponentsCache || []
          );

          // Создаем локальный компонент с использованием builder
          const localComponentBuilder = ComponentNode.builder(localCompName, cacheKey);
          localComponentBuilder.exports = [
            {
              name: localCompName,
              type: 'named', // Локальные компоненты как named exports
            },
          ];
          localComponentBuilder.depth = depth + 1;
          localComponentBuilder.errors = [...localStylesResult.errors]; // Добавляем ошибки извлечения стилей
          localComponentBuilder.styles = localStylesResult.styles; // Используем реальные стили вместо пустых

          const localComponent = ComponentNode.build(localComponentBuilder);
          componentBuilder.children.push(localComponent);
        }
      }

      // Создаем финальный immutable объект
      const componentNode = ComponentNode.build(componentBuilder);

      // Сохранение в кэш
      this.componentCache.set(cacheKey, componentNode);

      return componentNode;
    } finally {
      // Удаляем из множества обрабатываемых файлов
      this.processingSet.delete(cacheKey);
    }
  }

  /**
   * Преобразование строк импортов в ImportInfo
   */
  private convertToImportInfo(imports: string[]): ImportInfo[] {
    return imports.map(importStr => {
      // Простой парсинг импорта через regex
      const match = importStr.match(/import\s+(.+?)\s+from\s+['"](.+?)['"]/);
      if (match && match[1] && match[2]) {
        const [, importedName, source] = match;
        return {
          name: importedName.trim(),
          localName: importedName.trim(),
          source,
          type: 'named' as const,
        };
      }

      return {
        name: 'unknown',
        localName: 'unknown',
        source: importStr,
        type: 'named' as const,
      };
    });
  }

  /**
   * Преобразование строк экспортов в ExportInfo
   */
  private convertToExportInfo(exports: string[]): ExportInfo[] {
    return exports.map(exportStr => ({
      name: exportStr,
      type: 'named' as const,
    }));
  }

  /**
   * Разрешение импортов и построение дочерних узлов
   * ВРЕМЕННО: использует мутации для production readiness, будет рефакторен в ЭТАПЕ 2
   */
  private async resolveImports(component: ComponentNode): Promise<void> {
    // Дополнительная проверка глубины
    if (component.depth >= this.options.maxDepth - 1) {
      if (this.options.verbose) {
        // eslint-disable-next-line no-console
        console.log(`      ⚠️  Max depth reached for ${component.name}, skipping imports`);
      }
      return;
    }

    if (this.options.verbose) {
      // eslint-disable-next-line no-console
      console.log(`      🔄 Resolving ${component.imports.length} imports for ${component.name}`);
    }

    // Ограничиваем количество обрабатываемых импортов для предотвращения зависания
    const MAX_IMPORTS = 20;
    const IMPORTS_THRESHOLD = 5;
    const currentDir = dirname(component.filePath);
    const importsToProcess = component.imports.slice(0, MAX_IMPORTS);

    for (const importInfo of importsToProcess) {
      await this.processImport(importInfo, currentDir, component);

      // Добавляем небольшую задержку для предотвращения блокировки event loop
      if (component.imports.length > IMPORTS_THRESHOLD) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    // ВРЕМЕННО: мутируем для добавления ошибки - будет исправлено в ЭТАПЕ 2
    if (component.imports.length > MAX_IMPORTS) {
      (component.errors as ScanError[]).push({
        type: 'import_error',
        message: `Too many imports (${component.imports.length}), processing only first ${MAX_IMPORTS}`,
        filePath: component.filePath,
      });
    }

    if (this.options.verbose) {
      // eslint-disable-next-line no-console
      console.log(`      ✅ Resolved imports for ${component.name}`);
    }
  }

  /**
   * Обработка одного импорта
   */
  private async processImport(
    importInfo: ImportInfo,
    currentDir: string,
    component: ComponentNode
  ): Promise<void> {
    try {
      const resolvedPath = await this.resolveImportPath(importInfo.source, currentDir);

      if (!resolvedPath || !this.shouldProcessImport(resolvedPath)) {
        return;
      }

      // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Проверяем кэш ПЕРЕД созданием компонента
      const cacheKey = resolve(resolvedPath).toLowerCase().replace(/\\/g, '/');
      const cachedComponent = this.componentCache.get(cacheKey);

      if (cachedComponent) {
        if (this.options.verbose) {
          // eslint-disable-next-line no-console
          console.log(
            `          � Found in cache: ${cachedComponent.name} - NOT adding to avoid duplicates`
          );
        }
        // НЕ ДОБАВЛЯЕМ кэшированный компонент! Он уже есть в дереве
        return;
      }

      if (this.options.verbose) {
        // eslint-disable-next-line no-console
        console.log(`          📂 Parsing new component: ${resolvedPath}`);
      }

      const childComponent = await this.parseComponent(resolvedPath, component.depth + 1);

      // ВРЕМЕННО: мутируем для добавления ребенка - будет исправлено в ЭТАПЕ 2
      (component.children as ComponentNode[]).push(childComponent);

      // Рекурсивно разрешаем импорты дочерних компонентов
      if (component.depth < this.options.maxDepth - 1) {
        await this.resolveImports(childComponent);
      }
    } catch (error) {
      // ВРЕМЕННО: мутируем для добавления ошибки - будет исправлено в ЭТАПЕ 2
      (component.errors as ScanError[]).push({
        type: 'import_error',
        message: `Failed to resolve import ${importInfo.source}: ${error}`,
        filePath: component.filePath,
      });
    }
  }

  /**
   * Разрешение пути импорта
   */
  private async resolveImportPath(source: string, currentDir: string): Promise<string | null> {
    // Обрабатываем внутренние пакеты монорепо
    if (source.startsWith('@repo/')) {
      return this.resolveMonorepoPackage(source);
    }

    // Пропускаем внешние npm пакеты (node_modules)
    if (!source.startsWith('.') && !source.startsWith('/') && !source.startsWith('@repo/')) {
      return null;
    }

    const basePath = resolve(currentDir, source);

    // Проверяем различные расширения
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];

    for (const ext of extensions) {
      const fullPath = basePath + ext;
      if (await fileExists(fullPath)) {
        return fullPath;
      }
    }

    // Проверяем index файлы
    for (const ext of extensions) {
      const indexPath = join(basePath, `index${ext}`);
      if (await fileExists(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }

  /**
   * Разрешение импортов из внутренних пакетов монорепо
   */
  private async resolveMonorepoPackage(source: string): Promise<string | null> {
    // @repo/ui -> packages/ui/src/index.ts
    const packageName = source.replace('@repo/', '');
    const packageBasePath = resolve(process.cwd(), 'packages', packageName, 'src');

    // Попробуем найти основной экспорт
    const indexPath = join(packageBasePath, 'index.ts');
    if (await fileExists(indexPath)) {
      return indexPath;
    }

    const indexTsxPath = join(packageBasePath, 'index.tsx');
    if (await fileExists(indexTsxPath)) {
      return indexTsxPath;
    }

    return null;
  }

  /**
   * Проверка, нужно ли обрабатывать импорт
   */
  private shouldProcessImport(filePath: string): boolean {
    // Обрабатываем все React компоненты
    return /\.(tsx|jsx)$/.test(filePath);
  }

  /**
   * Извлечение имени компонента из пути файла
   */
  private extractComponentName(filePath: string): string {
    const fileName = filePath.split(/[/\\]/).pop() || '';
    return fileName.replace(/\.(tsx|jsx|ts|js)$/, '');
  }

  /**
   * Создание узла компонента с ошибкой
   */
  private createErrorComponent(filePath: string, message: string): ComponentNode {
    const errorBuilder = ComponentNode.builder(this.extractComponentName(filePath), filePath);
    errorBuilder.depth = 0;
    errorBuilder.errors = [
      {
        type: 'parse_error',
        message,
        filePath,
      },
    ];
    errorBuilder.styles = {
      tailwind: [],
      cssModules: [],
      cssInJs: [],
    };

    return ComponentNode.build(errorBuilder);
  }

  /**
   * Получение статистики построенного дерева
   */
  getTreeStats(): {
    totalComponents: number;
    maxDepth: number;
    errorsCount: number;
  } {
    const components = Array.from(this.componentCache.values());

    return {
      totalComponents: components.length,
      maxDepth: Math.max(...components.map(c => c.depth), 0),
      errorsCount: components.reduce((sum, c) => sum + c.errors.length, 0),
    };
  }

  /**
   * Получение текущей максимальной глубины
   */
  getMaxDepth(): number {
    return this.options.maxDepth;
  }

  /**
   * Очистка кэша
   */
  clearCache(): void {
    this.componentCache.clear();
    this.processingSet.clear();
  }
}

/**
 * Основная функция для построения дерева компонентов
 */
export async function buildComponentTree(
  pageFilePath: string,
  options: ComponentTreeOptions
): Promise<ComponentNode> {
  const builder = new ComponentTreeBuilder(options);
  return builder.buildComponentTree(pageFilePath);
}
