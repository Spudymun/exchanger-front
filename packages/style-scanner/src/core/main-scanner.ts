// Main Style Scanner - основной модуль сканирования
// Реализует полный workflow согласно техническому заданию

import { resolve, relative } from 'node:path';

import { FILE_PATTERNS, DEFAULT_CONFIG, SCAN_TIMEOUTS } from '../constants/index.js';

import type {
  ScannerConfig,
  PageScanResult,
  ProjectScanResult,
  ComponentNode,
} from '../types/scanner.js';

import { parseComponent } from '../utils/component-parser-simple.js';
import { findFiles, readFileSafely } from '../utils/file-utils.js';
import { extractStyles } from '../utils/style-extractor.js';

import { ComponentTreeBuilder } from './component-tree-simple.js';

/**
 * Основной сканер стилей
 * Реализует техническое задание: сбор дерева компонентов → извлечение стилей → генерация MD
 */
export class StyleScanner {
  private readonly config: ScannerConfig;
  private readonly treeBuilder: ComponentTreeBuilder;

  constructor(config: Partial<ScannerConfig> = {}) {
    this.config = {
      outputDir: config.outputDir || DEFAULT_CONFIG.OUTPUT_DIR,
      pattern: config.pattern || 'default',
      exclude: config.exclude || [],
      verbose: config.verbose || DEFAULT_CONFIG.VERBOSE,
      dryRun: config.dryRun || DEFAULT_CONFIG.DRY_RUN,
    };

    this.treeBuilder = new ComponentTreeBuilder({
      maxDepth: 10, // ВОССТАНАВЛИВАЕМ нормальную глубину для поиска ВСЕХ компонентов
      includeNodeModules: false,
      verbose: this.config.verbose,
    });
  }

  /**
   * Сканирование всего проекта
   * Основная точка входа согласно техзаданию
   */
  async scanProject(): Promise<ProjectScanResult> {
    const startTime = Date.now();

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log('🔍 Starting project-wide style scanning...');
    }

    // 1. Найти все страницы
    const pageFiles = await this.findAllPages();

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`📄 Found ${pageFiles.length} page files`);
    }

    // 2. Группировать по проектам
    const projectPages = this.groupPagesByProject(pageFiles);

    // 3. Сканировать каждый проект
    const pages: PageScanResult[] = [];

    for (const [projectName, projectPageFiles] of projectPages.entries()) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`\n📦 Scanning project: ${projectName}`);
      }

      for (const pageFile of projectPageFiles) {
        const pageResult = await this.scanPageSafely(pageFile, projectName);
        pages.push(pageResult);
      }
    }

    const scanDuration = Date.now() - startTime;

    // Очистка ресурсов
    this.cleanup();

    return {
      projectName: 'exchanger-front',
      pages,
      summary: {
        totalPages: pages.length,
        totalComponents: pages.reduce((sum, page) => sum + page.components.length, 0),
        totalErrors: pages.reduce((sum, page) => sum + page.errors.length, 0),
        scanDuration,
      },
    };
  }

  /**
   * Очистка ресурсов
   */
  private cleanup(): void {
    // Очистка кэша компонентов
    this.treeBuilder.clearCache();

    // Принудительная очистка таймеров (если есть)
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Безопасное сканирование страницы с обработкой ошибок
   */
  private async scanPageSafely(pageFile: string, projectName: string): Promise<PageScanResult> {
    try {
      return await this.scanPageWithTimeout(pageFile, projectName);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`❌ Failed to scan page ${pageFile}: ${error}`);

      // Создаем пустой результат с ошибкой
      return {
        pagePath: this.getRelativePath(pageFile),
        components: [],
        errors: [
          {
            type: 'parse_error',
            message: `Scan failed: ${error}`,
            filePath: pageFile,
          },
        ],
      };
    }
  }

  /**
   * Сканирование одной страницы с таймаутом
   */
  private async scanPageWithTimeout(
    pageFilePath: string,
    projectName: string
  ): Promise<PageScanResult> {
    const timeouts = [SCAN_TIMEOUTS.FULL_SCAN, SCAN_TIMEOUTS.FAST_SCAN, SCAN_TIMEOUTS.MINIMAL_SCAN];

    for (const timeout of timeouts) {
      const result = await this.attemptScanWithTimeout(pageFilePath, projectName, timeout);
      if (result) {
        return result;
      }
    }

    return await this.createMinimalScanResult(
      pageFilePath,
      projectName,
      'All scan attempts failed'
    );
  }

  /**
   * Попытка сканирования с указанным таймаутом
   */
  private async attemptScanWithTimeout(
    pageFilePath: string,
    projectName: string,
    timeout: number
  ): Promise<PageScanResult | null> {
    try {
      this.logAttempt(timeout);

      const result = await Promise.race([
        this.scanPage(pageFilePath, projectName),
        this.createTimeoutPromise(timeout),
      ]);

      this.logSuccess();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logTimeout(errorMessage);
      return null;
    }
  }

  /**
   * Сканирование одной страницы
   * Реализует: Page → Component → Subcomponent → Стили
   */
  async scanPage(pageFilePath: string, _projectName: string): Promise<PageScanResult> {
    const relativePath = this.getRelativePath(pageFilePath);

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`  📄 Scanning page: ${relativePath}`);
    }

    try {
      // 1. Построить дерево компонентов
      const componentTree = await this.treeBuilder.buildComponentTree(pageFilePath);

      // 2. Извлечь стили для каждого компонента
      const componentsWithStyles = await this.enrichWithStyles(componentTree);

      // 3. Собрать плоский список компонентов
      const allComponents = this.flattenComponentTree(componentsWithStyles);

      return {
        pagePath: relativePath,
        components: allComponents,
        errors: componentTree.errors,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`❌ Error scanning page ${relativePath}:`, error);

      return {
        pagePath: relativePath,
        components: [],
        errors: [
          {
            type: 'parse_error',
            message: `Failed to scan page: ${error}`,
            filePath: pageFilePath,
          },
        ],
      };
    }
  }

  /**
   * Поиск всех страниц по паттернам
   */
  private async findAllPages(): Promise<string[]> {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log('🔍 Finding all pages...');
    }

    const allFiles: string[] = [];

    // FILE_PATTERNS.PAGES теперь массив
    for (const pattern of FILE_PATTERNS.PAGES) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`  📋 Searching pattern: ${pattern}`);
      }

      const files = await findFiles(pattern);

      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`  ✅ Found ${files.length} files for pattern: ${pattern}`);
      }

      allFiles.push(...files);
    }

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`📄 Total files found: ${allFiles.length}`);
    }

    // Убираем дубликаты и возвращаем абсолютные пути
    return [...new Set(allFiles)].map(file => resolve(file));
  }

  /**
   * Группировка страниц по проектам
   */
  private groupPagesByProject(pageFiles: string[]): Map<string, string[]> {
    const projects = new Map<string, string[]>();

    for (const pageFile of pageFiles) {
      const projectName = this.extractProjectName(pageFile);

      if (!projects.has(projectName)) {
        projects.set(projectName, []);
      }

      const projectFileList = projects.get(projectName);
      if (projectFileList) {
        projectFileList.push(pageFile);
      }
    }

    return projects;
  }

  /**
   * Извлечение имени проекта из пути файла
   */
  private extractProjectName(filePath: string): string {
    // apps/web/app/page.tsx → "web"
    // apps/admin-panel/app/page.tsx → "admin-panel"
    const match = filePath.match(/apps[/\\]([^/\\]+)[/\\]/);
    return match?.[1] || 'unknown';
  }

  /**
   * Получение относительного пути от корня проекта
   */
  private getRelativePath(filePath: string): string {
    const workspaceRoot = process.cwd();
    return relative(workspaceRoot, filePath);
  }

  /**
   * Обогащение дерева компонентов стилями
   */
  private async enrichWithStyles(componentNode: ComponentNode): Promise<ComponentNode> {
    // ИСПРАВЛЕНИЕ: Проверяем если это локальный компонент (содержит #)
    if (componentNode.filePath.includes('#')) {
      // Для локальных компонентов читаем оригинальный файл
      const originalFilePath = componentNode.filePath.split('#')[0];
      if (!originalFilePath) {
        return componentNode; // Возвращаем как есть если нет пути
      }

      const componentContent = (await readFileSafely(originalFilePath)) || '';

      // Извлекаем стили из оригинального файла
      const { styles } = await extractStyles(originalFilePath, componentContent);

      return {
        ...componentNode,
        styles,
        children: [], // Локальные компоненты не имеют детей
      };
    }

    // Обычная логика для импортированных компонентов
    const componentContent = (await readFileSafely(componentNode.filePath)) || '';
    const { styles } = await extractStyles(componentNode.filePath, componentContent);

    // Рекурсивно обрабатываем дочерние компоненты
    const enrichedChildren: ComponentNode[] = [];

    for (const child of componentNode.children) {
      const enrichedChild = await this.enrichWithStyles(child);
      enrichedChildren.push(enrichedChild);
    }

    return {
      ...componentNode,
      styles,
      children: enrichedChildren,
    };
  }

  /**
   * Преобразование дерева в плоский список
   */
  private flattenComponentTree(root: ComponentNode): ComponentNode[] {
    const result: ComponentNode[] = [root];

    for (const child of root.children) {
      result.push(...this.flattenComponentTree(child));
    }

    return result;
  }

  /**
   * Создание промиса таймаута
   */
  private createTimeoutPromise(timeout: number): Promise<PageScanResult> {
    return new Promise<PageScanResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout ${timeout}ms exceeded`));
      }, timeout);
    });
  }

  /**
   * Создание минимального результата сканирования при неудаче
   */
  private async createMinimalScanResult(
    pageFilePath: string,
    _projectName: string,
    errorMessage: string
  ): Promise<PageScanResult> {
    // Вместо пустого результата - попробуем хотя бы распарсить саму страницу
    try {
      return await this.createFallbackScanResult(pageFilePath, errorMessage);
    } catch (fallbackError) {
      // Если и это не удается - возвращаем пустой результат
      return {
        pagePath: this.getRelativePath(pageFilePath),
        components: [],
        errors: [
          {
            filePath: pageFilePath,
            message: `Failed to scan page: ${errorMessage}. Fallback failed: ${fallbackError}`,
            type: 'parse_error',
          },
        ],
      };
    }
  }

  /**
   * Создание fallback результата - парсим только саму страницу без зависимостей
   */
  private async createFallbackScanResult(
    pageFilePath: string,
    originalError: string
  ): Promise<PageScanResult> {
    // Простой парсинг БЕЗ построения дерева зависимостей
    const content = await readFileSafely(pageFilePath);
    if (!content) {
      throw new Error('Cannot read page file');
    }

    const parsed = parseComponent(content);
    const componentName = parsed.name || this.extractComponentNameFromPath(pageFilePath);

    // ГЛАВНОЕ: находим импортированные компоненты в JSX
    const usedComponents = this.extractUsedComponentsFromJSX(content);

    // Создаем один компонент для страницы
    const pageComponent: ComponentNode = {
      filePath: pageFilePath,
      name: componentName,
      imports: [], // Упрощаем - не парсим импорты в fallback режиме
      exports: [], // Упрощаем - не парсим экспорты в fallback режиме
      children: usedComponents.map((compName, index) =>
        this.createSimpleComponent(compName, index + 1)
      ),
      depth: 0,
      errors: parsed.errors,
      styles: {
        tailwind: this.extractTailwindFromContent(content),
        cssModules: [],
        cssInJs: [],
      },
    };

    return {
      pagePath: this.getRelativePath(pageFilePath),
      components: [pageComponent],
      errors: [
        {
          filePath: pageFilePath,
          message: `Fallback mode (found ${usedComponents.length} components): ${originalError}`,
          type: 'parse_error',
        },
        ...parsed.errors,
      ],
    };
  }

  /**
   * Извлечение используемых компонентов из JSX
   */
  private extractUsedComponentsFromJSX(content: string): string[] {
    // Ищем компоненты в JSX: <ComponentName, <ComponentName/>, <ComponentName >
    const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g;
    const components: Set<string> = new Set();
    let match;

    while ((match = componentRegex.exec(content)) !== null) {
      if (match[1]) {
        components.add(match[1]);
      }
    }

    return Array.from(components);
  }

  /**
   * Создание простого компонента без анализа
   */
  private createSimpleComponent(name: string, depth: number): ComponentNode {
    return {
      filePath: `virtual:${name}`,
      name,
      imports: [],
      exports: [],
      children: [],
      depth,
      errors: [],
      styles: {
        tailwind: [],
        cssModules: [],
        cssInJs: [],
      },
    };
  }

  /**
   * Извлечение Tailwind классов из содержимого файла
   */
  private extractTailwindFromContent(content: string): string[] {
    const classRegex = /className="([^"]+)"/g;
    const classes: string[] = [];
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      if (match[1]) {
        const classNames = match[1].split(/\s+/).filter(cls => cls.length > 0);
        classes.push(...classNames);
      }
    }

    return [...new Set(classes)]; // Удаляем дубликаты
  }

  /**
   * Извлечение имени компонента из пути файла
   */
  private extractComponentNameFromPath(filePath: string): string {
    const fileName = filePath.split(/[/\\]/).pop() || '';
    return fileName.replace(/\.(tsx|jsx|ts|js)$/, '');
  }

  /**
   * Логирование попытки сканирования
   */
  private logAttempt(timeout: number): void {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`  🔄 Попытка сканирования (таймаут: ${timeout}ms)`);
    }
  }

  /**
   * Логирование успешного сканирования
   */
  private logSuccess(): void {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`  ✅ Успешно просканировано`);
    }
  }

  /**
   * Логирование таймаута
   */
  private logTimeout(errorMessage: string): void {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`  ⏰ Таймаут: ${errorMessage}`);
    }
  }

  /**
   * Получение статистики сканирования
   */
  getStats() {
    return this.treeBuilder.getTreeStats();
  }

  /**
   * Очистка кэшей
   */
  clearCache(): void {
    this.treeBuilder.clearCache();
  }
}

/**
 * Основная функция для использования в CLI
 */
export async function scanStyles(config: Partial<ScannerConfig> = {}): Promise<ProjectScanResult> {
  const scanner = new StyleScanner(config);
  return scanner.scanProject();
}
