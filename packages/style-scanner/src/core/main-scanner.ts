// Main Style Scanner - основной модуль сканирования
// Реализует полный workflow согласно техническому заданию

import { resolve, relative } from 'node:path';

import { FILE_PATTERNS, DEFAULT_CONFIG, SCAN_TIMEOUTS } from '../constants/index.js';

import type {
  ScannerConfig,
  PageScanResult,
  ProjectScanResult,
  ComponentNode,
  LayoutScanResult,
  UIScanResult,
  ScanError,
} from '../types/scanner.js';

import { parseComponent } from '../utils/component-parser-simple.js';
import { findFiles, readFileSafely } from '../utils/file-utils.js';
import {
  extractStyles,
  extractStylesForLocalComponent,
  extractStylesForLocalComponentWithUI,
} from '../utils/style-extractor.js';

import { ComponentTreeBuilder } from './component-tree-simple.js';

/**
 * Основной сканер стилей
 * Реализует техническое задание: сбор дерева компонентов → извлечение стилей → генерация MD
 */
export class StyleScanner {
  private readonly config: ScannerConfig;
  private treeBuilder: ComponentTreeBuilder; // Убираем readonly чтобы обновлять с UI cache
  private uiComponentsCache: ComponentNode[] = []; // Cache for UI components

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

    // eslint-disable-next-line no-console
    console.log('🎨 DEBUG: scanProject() method started');

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

    // 2. Найти все layout-компоненты
    const layoutFiles = await this.findAllLayouts();

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`🏗️ Found ${layoutFiles.length} layout files`);
    }

    // 3. Найти все UI компоненты
    const uiFiles = await this.findAllUIComponents();

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`🎨 Found ${uiFiles.length} UI component files`);
    }

    // 4. Группировать по проектам
    const projectPages = this.groupPagesByProject(pageFiles);
    const projectLayouts = this.groupLayoutsByProject(layoutFiles);
    const projectUIComponents = this.groupUIComponentsByProject(uiFiles);

    // eslint-disable-next-line no-console
    console.log(
      `🎨 DEBUG: UI grouping result: ${projectUIComponents.size} projects, keys: ${Array.from(projectUIComponents.keys()).join(', ')}`
    );

    // 4. Сканировать UI-компоненты каждого проекта ПЕРВЫМИ (для кэша)
    const uiComponents: UIScanResult[] = [];
    this.uiComponentsCache = []; // Очищаем кэш перед сканированием

    // eslint-disable-next-line no-console
    console.log(`🎨 DEBUG: Starting UI scanning for ${projectUIComponents.size} projects`);

    for (const [projectName, projectUIFiles] of projectUIComponents.entries()) {
      // eslint-disable-next-line no-console
      console.log(
        `🎨 DEBUG: Scanning project ${projectName} with ${projectUIFiles.length} UI files`
      );

      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`\n🎨 Scanning UI components for project: ${projectName}`);
      }

      for (const uiFile of projectUIFiles) {
        const uiResult = await this.scanUISafely(uiFile, projectName);
        uiComponents.push(uiResult);

        // DEBUG: Always log UI result regardless of verbose setting
        // eslint-disable-next-line no-console
        console.log(
          `🎨 DEBUG: UI result for ${this.getRelativePath(uiFile)}: ${uiResult.components.length} components`
        );

        // Сохраняем в кэш для использования в extractStylesForLocalComponentWithUI
        uiResult.components.forEach(component => {
          this.uiComponentsCache.push(component);
          // eslint-disable-next-line no-console
          console.log(
            `📦 DEBUG: Added to cache: ${component.name} (${component.styles.tailwind.length} tailwind classes)`
          );
        });
      }
    }

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`🎨 Total UI components in cache: ${this.uiComponentsCache.length}`);
      if (this.uiComponentsCache.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `   🎨 Cache contents: ${this.uiComponentsCache.map(comp => comp.name).join(', ')}`
        );
      }
    }

    // ВАЖНО: Обновляем tree builder с UI компонентами для правильной агрегации стилей
    if (this.uiComponentsCache.length > 0) {
      this.treeBuilder = new ComponentTreeBuilder({
        maxDepth: 10,
        includeNodeModules: false,
        verbose: this.config.verbose,
        uiComponentsCache: this.uiComponentsCache, // Передаем UI кэш для style aggregation
      });

      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(
          `🎨 Updated tree builder with ${this.uiComponentsCache.length} UI components in cache`
        );
      }
    }

    // 5. Теперь сканируем страницы с доступными UI компонентами в кэше
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

    // 6. Сканировать layout-компоненты каждого проекта
    const layouts: LayoutScanResult[] = [];

    for (const [projectName, projectLayoutFiles] of projectLayouts.entries()) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`\n�️ Scanning layouts for project: ${projectName}`);
      }

      for (const layoutFile of projectLayoutFiles) {
        const layoutResult = await this.scanLayoutSafely(layoutFile, projectName);
        layouts.push(layoutResult);
      }
    }

    const scanDuration = Date.now() - startTime;

    // Очистка ресурсов
    this.cleanup();

    return {
      projectName: 'exchanger-front',
      pages,
      layouts,
      uiComponents,
      summary: {
        totalPages: pages.length,
        totalLayouts: layouts.length,
        totalUIComponents: uiComponents.length,
        totalComponents:
          pages.reduce((sum, page) => sum + page.components.length, 0) +
          layouts.reduce((sum, layout) => sum + layout.components.length, 0) +
          uiComponents.reduce((sum, ui) => sum + ui.components.length, 0),
        totalErrors:
          pages.reduce((sum, page) => sum + page.errors.length, 0) +
          layouts.reduce((sum, layout) => sum + layout.errors.length, 0) +
          uiComponents.reduce((sum, ui) => sum + ui.errors.length, 0),
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
   * Поиск всех layout-файлов по паттернам
   */
  private async findAllLayouts(): Promise<string[]> {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log('🏗️ Finding all layouts...');
    }

    const allFiles: string[] = [];

    // Поиск layout.tsx файлов
    for (const pattern of FILE_PATTERNS.LAYOUTS) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`  📋 Searching layout pattern: ${pattern}`);
      }

      const files = await findFiles(pattern);

      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`  ✅ Found ${files.length} layout files for pattern: ${pattern}`);
      }

      allFiles.push(...files);
    }

    // Поиск layout-компонентов (AppHeader, AppFooter и т.д.)
    for (const pattern of FILE_PATTERNS.LAYOUT_COMPONENTS) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`  📋 Searching layout component pattern: ${pattern}`);
      }

      const files = await findFiles(pattern);

      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`  ✅ Found ${files.length} layout component files for pattern: ${pattern}`);
      }

      allFiles.push(...files);
    }

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`🏗️ Total layout files found: ${allFiles.length}`);
    }

    // Убираем дубликаты и возвращаем абсолютные пути
    return [...new Set(allFiles)].map(file => resolve(file));
  }

  /**
   * Группировка layout-файлов по проектам
   */
  private groupLayoutsByProject(layoutFiles: string[]): Map<string, string[]> {
    const projects = new Map<string, string[]>();

    for (const layoutFile of layoutFiles) {
      const projectName = this.extractProjectName(layoutFile);

      if (!projects.has(projectName)) {
        projects.set(projectName, []);
      }

      const projectFileList = projects.get(projectName);
      if (projectFileList) {
        projectFileList.push(layoutFile);
      }
    }

    return projects;
  }

  /**
   * Поиск всех UI компонентов по паттернам
   */
  private async findAllUIComponents(): Promise<string[]> {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log('🎨 Finding all UI components...');
    }

    const allFiles: string[] = [];

    // Поиск UI компонентов
    for (const pattern of FILE_PATTERNS.UI_COMPONENTS) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`  📋 Searching UI component pattern: ${pattern}`);
      }

      const files = await findFiles(pattern);

      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`  ✅ Found ${files.length} UI component files for pattern: ${pattern}`);
      }

      allFiles.push(...files);
    }

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`🎨 Total UI component files found: ${allFiles.length}`);
    }

    // Убираем дубликаты и возвращаем абсолютные пути
    return [...new Set(allFiles)].map(file => resolve(file));
  }

  /**
   * Группировка UI компонентов по проектам
   */
  private groupUIComponentsByProject(uiFiles: string[]): Map<string, string[]> {
    const projects = new Map<string, string[]>();

    for (const uiFile of uiFiles) {
      // UI компоненты относятся к общему пакету ui
      const projectName = 'ui';

      if (!projects.has(projectName)) {
        projects.set(projectName, []);
      }

      const projectFileList = projects.get(projectName);
      if (projectFileList) {
        projectFileList.push(uiFile);
      }
    }

    return projects;
  }

  /**
   * Безопасное сканирование layout-компонента с обработкой ошибок
   */
  private async scanLayoutSafely(
    layoutFile: string,
    projectName: string
  ): Promise<LayoutScanResult> {
    try {
      return await this.scanLayoutWithTimeout(layoutFile, projectName);
    } catch (error) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.error(`❌ Error scanning layout ${layoutFile}:`, error);
      }

      return this.createMinimalLayoutScanResult(layoutFile, projectName, String(error));
    }
  }

  /**
   * Сканирование layout-компонента с таймаутом
   */
  private async scanLayoutWithTimeout(
    layoutFile: string,
    projectName: string
  ): Promise<LayoutScanResult> {
    const timeout = SCAN_TIMEOUTS.FULL_SCAN;

    return Promise.race([
      this.scanLayout(layoutFile, projectName),
      this.createLayoutTimeoutPromise(timeout),
    ]);
  }

  /**
   * Основное сканирование layout-компонента
   */
  private async scanLayout(layoutFile: string, projectName: string): Promise<LayoutScanResult> {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`  🏗️ Scanning layout: ${this.getRelativePath(layoutFile)}`);
    }

    // Определяем тип layout-а
    const layoutType = this.determineLayoutType(layoutFile);

    // Читаем содержимое файла
    const content = await readFileSafely(layoutFile);
    if (!content) {
      throw new Error(`Cannot read layout file: ${layoutFile}`);
    }

    // Парсим компонент
    const parsed = parseComponent(content);
    const componentName = parsed.name || this.extractComponentNameFromPath(layoutFile);

    // Строим дерево компонентов с ограниченной глубиной для layout-ов
    const componentTree = await this.treeBuilder.buildComponentTree(layoutFile);

    if (!componentTree) {
      throw new Error(`Failed to build component tree for layout: ${layoutFile}`);
    }

    // Обогащаем стилями
    const enrichedTree = await this.enrichWithStyles(componentTree);

    // Преобразуем в плоский список
    const components = this.flattenComponentTree(enrichedTree);

    return {
      layoutPath: this.getRelativePath(layoutFile),
      layoutType,
      components,
      errors: [],
    };
  }

  /**
   * Определение типа layout-а
   */
  private determineLayoutType(layoutFile: string): 'root' | 'nested' | 'component' {
    const relativePath = this.getRelativePath(layoutFile);

    // layout.tsx файлы
    if (relativePath.includes('layout.tsx') || relativePath.includes('layout.jsx')) {
      // root layout обычно в корне app директории
      if (relativePath.match(/apps\/[^/]+\/app\/layout\.(tsx|jsx)$/)) {
        return 'root';
      }
      return 'nested';
    }

    // Компоненты layout-а (AppHeader, AppFooter и т.д.)
    return 'component';
  }

  /**
   * Создание минимального результата сканирования layout-а при неудаче
   */
  private createMinimalLayoutScanResult(
    layoutFile: string,
    _projectName: string,
    errorMessage: string
  ): LayoutScanResult {
    return {
      layoutPath: this.getRelativePath(layoutFile),
      layoutType: this.determineLayoutType(layoutFile),
      components: [],
      errors: [
        {
          filePath: layoutFile,
          message: `Failed to scan layout: ${errorMessage}`,
          type: 'parse_error',
        },
      ],
    };
  }

  /**
   * Создание промиса таймаута для layout-а
   */
  private createLayoutTimeoutPromise(timeout: number): Promise<LayoutScanResult> {
    return new Promise<LayoutScanResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Layout scan timeout ${timeout}ms exceeded`));
      }, timeout);
    });
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
      const result = await extractStylesForLocalComponentWithUI(
        componentContent,
        componentNode.name,
        this.uiComponentsCache // передаем кэш UI компонентов
      );
      styles = result.styles;
    } else {
      // Для обычных компонентов используем стандартную функцию
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
   * Безопасное сканирование UI-компонента с обработкой ошибок
   */
  private async scanUISafely(uiFile: string, projectName: string): Promise<UIScanResult> {
    try {
      return await this.scanUIWithTimeout(uiFile, projectName);
    } catch (error) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.error(`❌ Error scanning UI component ${uiFile}:`, error);
      }

      return this.createMinimalUIScanResult(uiFile, projectName, String(error));
    }
  }

  /**
   * Сканирование UI-компонента с таймаутом
   */
  private async scanUIWithTimeout(uiFile: string, projectName: string): Promise<UIScanResult> {
    const timeout = SCAN_TIMEOUTS.FULL_SCAN;

    return Promise.race([this.scanUI(uiFile, projectName), this.createUITimeoutPromise(timeout)]);
  }

  /**
   * Основное сканирование UI-компонента
   */
  private async scanUI(uiFile: string, projectName: string): Promise<UIScanResult> {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`  🎨 Scanning UI component: ${this.getRelativePath(uiFile)}`);
    }

    // Определяем тип UI-компонента
    const componentType = this.determineUIType(uiFile);

    // Читаем содержимое файла
    const content = await readFileSafely(uiFile);
    if (!content) {
      throw new Error(`Cannot read UI file: ${uiFile}`);
    }

    // Парсим компонент
    const parsed = parseComponent(content);
    const componentName = parsed.name || this.extractComponentNameFromPath(uiFile);

    // Строим дерево компонентов
    const componentTree = await this.treeBuilder.buildComponentTree(uiFile);

    if (!componentTree) {
      throw new Error(`Failed to build component tree for UI: ${uiFile}`);
    }

    // eslint-disable-next-line no-console
    console.log(
      `🎨 DEBUG: Before enrichment - ${componentName} has ${componentTree.styles.tailwind.length} tailwind classes`
    );

    // Обогащаем стилями
    const enrichedTree = await this.enrichWithStyles(componentTree);

    // eslint-disable-next-line no-console
    console.log(
      `🎨 DEBUG: After enrichment - ${enrichedTree.name} has ${enrichedTree.styles.tailwind.length} tailwind classes`
    );

    // Для multi-component файлов создаём отдельные узлы для каждого компонента
    const components: ComponentNode[] = [enrichedTree];

    // ВАЖНО: Виртуальные компоненты создаём ТОЛЬКО для UI компонентов (packages/ui)
    const isUIComponent = uiFile.includes('packages/ui/');

    if (isUIComponent && parsed.localComponents && parsed.localComponents.length > 1) {
      // Если найдено несколько компонентов В UI ПАКЕТЕ, создаём узлы для каждого
      for (const localComponentName of parsed.localComponents) {
        if (localComponentName !== componentName) {
          // Извлекаем стили конкретного локального UI компонента
          const { styles } = await extractStylesForLocalComponentWithUI(
            content,
            localComponentName,
            this.uiComponentsCache
          );

          // Создаём виртуальный узел для каждого локального UI компонента
          const virtualNode: ComponentNode = {
            name: localComponentName,
            filePath: `${uiFile}#${localComponentName}`,
            styles,
            children: [],
            depth: 0,
            imports: [],
            exports: [{ name: localComponentName, type: 'named' }],
            errors: [],
          };
          components.push(virtualNode);
        }
      }
    }

    return {
      uiPath: uiFile,
      componentType,
      components,
      errors: [],
    };
  }

  /**
   * Определение типа UI-компонента
   */
  private determineUIType(filePath: string): UIScanResult['componentType'] {
    const fileName = filePath.toLowerCase();

    if (fileName.includes('button')) return 'button';
    if (fileName.includes('input')) return 'input';
    if (fileName.includes('select')) return 'select';
    if (fileName.includes('card')) return 'card';
    if (fileName.includes('dialog')) return 'dialog';

    return 'other';
  }

  /**
   * Создание минимального результата UI-сканирования при ошибке
   */
  private createMinimalUIScanResult(
    uiFile: string,
    projectName: string,
    error: string
  ): UIScanResult {
    return {
      uiPath: uiFile,
      componentType: 'other',
      components: [],
      errors: [
        {
          type: 'parse_error',
          message: error,
          filePath: uiFile,
        },
      ],
    };
  }

  /**
   * Создание промиса с таймаутом для UI-сканирования
   */
  private createUITimeoutPromise(timeout: number): Promise<UIScanResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`UI scan timeout after ${timeout}ms`));
      }, timeout);
    });
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
  // eslint-disable-next-line no-console
  console.log('🎨 DEBUG: scanStyles() function called');
  const scanner = new StyleScanner(config);
  // eslint-disable-next-line no-console
  console.log('🎨 DEBUG: About to call scanner.scanProject()');
  return scanner.scanProject();
}
