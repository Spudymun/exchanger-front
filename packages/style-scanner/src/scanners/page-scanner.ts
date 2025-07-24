// PageScanner - сканирование страниц приложения
// Отвечает за: поиск страниц, группировка по проектам, сканирование с таймаутами

import { resolve } from 'node:path';
import { BaseScanner } from './base-scanner.js';
import { FILE_PATTERNS } from '../constants/index.js';
import { findFiles, readFileSafely } from '../utils/file-utils.js';
import { parseComponent } from '../utils/component-parser-simple.js';
import type { PageScanResult, ComponentNode, ScannerConfig } from '../types/scanner.js';
import type { ComponentTreeBuilder } from '../core/component-tree-simple.js';

/**
 * Сканер страниц приложения
 * Отвечает за поиск и сканирование всех page.tsx/jsx файлов
 */
export class PageScanner extends BaseScanner {
  private treeBuilder: ComponentTreeBuilder;
  private uiComponentsCache: readonly ComponentNode[];

  constructor(
    config: ScannerConfig,
    treeBuilder: ComponentTreeBuilder,
    uiComponentsCache: readonly ComponentNode[] = []
  ) {
    super(config);
    this.treeBuilder = treeBuilder;
    this.uiComponentsCache = uiComponentsCache;
  }

  /**
   * Поиск всех страниц по паттернам
   */
  async findAllPages(): Promise<string[]> {
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
  groupPagesByProject(pageFiles: string[]): Map<string, string[]> {
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
   * Безопасное сканирование страницы с обработкой ошибок
   */
  async scanPageSafely(pageFile: string, projectName: string): Promise<PageScanResult> {
    try {
      return await this.scanPageWithTimeouts(pageFile, projectName);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`❌ Failed to scan page ${pageFile}: ${error}`);

      // Создаем пустой результат с ошибкой
      return {
        pagePath: this.getRelativePath(pageFile),
        components: [],
        errors: [this.createScanError(pageFile, `Scan failed: ${error}`)],
      };
    }
  }

  /**
   * Сканирование одной страницы с таймаутами
   */
  private async scanPageWithTimeouts(
    pageFilePath: string,
    projectName: string
  ): Promise<PageScanResult> {
    return this.scanWithTimeouts(
      pageFilePath,
      projectName,
      this.scanPage.bind(this),
      this.createTimeoutPromise.bind(this),
      this.createMinimalScanResult.bind(this)
    );
  }

  /**
   * Сканирование одной страницы
   * Реализует: Page → Component → Subcomponent → Стили
   */
  private async scanPage(pageFilePath: string, _projectName: string): Promise<PageScanResult> {
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
        errors: [this.createScanError(pageFilePath, `Failed to scan page: ${error}`)],
      };
    }
  }

  /**
   * Обогащение дерева компонентов стилями
   * ВНИМАНИЕ: Эта логика должна быть перенесена в отдельный сервис стилей
   */
  private async enrichWithStyles(componentNode: ComponentNode): Promise<ComponentNode> {
    // ИСПРАВЛЕНИЕ: Проверяем если это виртуальный компонент (содержит #)
    if (componentNode.filePath.includes('#')) {
      // Для виртуальных компонентов просто возвращаем как есть - они уже имеют стили
      return componentNode;
    }

    // Читаем содержимое файла
    const componentContent = (await readFileSafely(componentNode.filePath)) || '';

    // ИСПРАВЛЕННАЯ ЛОГИКА: Определяем является ли это локальным компонентом
    // Парсим файл чтобы узнать сколько в нем компонентов
    const parsed = parseComponent(componentContent);
    const isMultiComponentFile = parsed.localComponents && parsed.localComponents.length > 1;

    let styles;
    if (isMultiComponentFile) {
      // Для локальных компонентов в многокомпонентном файле используем функцию с UI поддержкой
      const { extractStylesForLocalComponentWithUI } = await import('../utils/style-extractor.js');
      const result = await extractStylesForLocalComponentWithUI(
        componentContent,
        componentNode.name,
        Array.from(this.uiComponentsCache) // передаем кэш UI компонентов
      );
      styles = result.styles;
    } else {
      // Для обычных компонентов используем стандартную функцию
      const { extractStyles } = await import('../utils/style-extractor.js');
      const result = await extractStyles(componentNode.filePath, componentContent);
      styles = result.styles;
    }

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
          this.createScanError(
            pageFilePath,
            `Failed to scan page: ${errorMessage}. Fallback failed: ${fallbackError}`
          ),
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
        this.createScanError(
          pageFilePath,
          `Fallback mode (found ${usedComponents.length} components): ${originalError}`
        ),
        ...parsed.errors,
      ],
    };
  }
}
