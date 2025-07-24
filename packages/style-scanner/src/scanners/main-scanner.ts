// MainScanner - основной оркестратор сканирования
// Координирует работу PageScanner, LayoutScanner, UIScanner

import { relative } from 'node:path';
import { DEFAULT_CONFIG } from '../constants/index.js';
import { ComponentTreeBuilder } from '../core/component-tree-simple.js';
import { PageScanner } from './page-scanner.js';
import { LayoutScanner } from './layout-scanner.js';
import { UIScanner } from './ui-scanner.js';
import { createLogger } from '../utils/logger.js';
import { DEPTH_LIMITS } from '../config/performance.js';
import type {
  ScannerConfig,
  ProjectScanResult,
  PageScanResult,
  LayoutScanResult,
  UIScanResult,
} from '../types/scanner.js';

/**
 * Основной сканер стилей - оркестратор
 * Координирует работу всех специализированных сканеров
 */
export class MainScanner {
  private readonly config: ScannerConfig;
  private readonly logger = createLogger({ quiet: false, verbose: true });
  private treeBuilder: ComponentTreeBuilder;
  private pageScanner: PageScanner;
  private layoutScanner: LayoutScanner;
  private uiScanner: UIScanner;

  constructor(config: Partial<ScannerConfig> = {}) {
    this.config = {
      outputDir: config.outputDir || DEFAULT_CONFIG.OUTPUT_DIR,
      pattern: config.pattern || 'default',
      exclude: config.exclude || [],
      verbose: config.verbose || DEFAULT_CONFIG.VERBOSE,
      dryRun: config.dryRun || DEFAULT_CONFIG.DRY_RUN,
    };

    // Настроим logger в зависимости от режима
    this.logger = createLogger({
      quiet: !this.config.verbose,
      verbose: this.config.verbose || false,
    });

    this.treeBuilder = new ComponentTreeBuilder({
      maxDepth: DEPTH_LIMITS.MAX_FILE_SEARCH_DEPTH, // Используем конфигурируемое значение
      verbose: this.config.verbose || false,
      includeNodeModules: false, // Добавляем недостающее поле
    });

    // Инициализируем специализированные сканеры
    this.pageScanner = new PageScanner(this.config, this.treeBuilder);
    this.layoutScanner = new LayoutScanner(this.config, this.treeBuilder);
    this.uiScanner = new UIScanner(this.config, this.treeBuilder);
  }

  /**
   * Сканирование всего проекта
   * Основная точка входа согласно техзаданию
   */
  async scanProject(): Promise<ProjectScanResult> {
    const startTime = Date.now();

    this.logger.verbose('🎨 Starting scanProject() method...');

    if (this.config.verbose) {
      this.logger.info('🔍 Starting project-wide style scanning...');
    }

    // 1. ЭТАП: Сканирование UI компонентов (создание кэша)
    const uiComponents = await this.scanUIComponents();

    // 2. ЭТАП: Обновляем сканеры с UI кэшем
    this.updateScannersWithUICache();

    // 3. ЭТАП: Сканирование страниц
    const pages = await this.scanPages();

    // 4. ЭТАП: Сканирование layouts
    const layouts = await this.scanLayouts();

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
   * Сканирование UI компонентов (ПЕРВЫЙ ЭТАП)
   */
  private async scanUIComponents(): Promise<UIScanResult[]> {
    // 1. Найти все UI компоненты
    const uiFiles = await this.uiScanner.findAllUIComponents();

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      this.logger.verbose(`🎨 Found ${uiFiles.length} UI component files`);
    }

    // 2. Группировать по проектам
    const projectUIComponents = this.uiScanner.groupUIComponentsByProject(uiFiles);

    // eslint-disable-next-line no-console
    this.logger.verbose(
      `🗂️ Grouped files by projects: ${[...projectUIComponents.entries()]
        .map(([project, files]) => `${project}(${files.length})`)
        .join(', ')}`
    ); // 3. Сканировать UI-компоненты каждого проекта
    const uiComponents: UIScanResult[] = [];
    this.uiScanner.clearUIComponentsCache(); // Очищаем кэш перед сканированием

    // UI сканирование (убираем DEBUG лог)
    for (const [projectName, projectUIFiles] of projectUIComponents.entries()) {
      this.logger.verbose(
        `🎨 Scanning project ${projectName} with ${projectUIFiles.length} UI files`
      );

      if (this.config.verbose) {
        this.logger.info(`\n🎨 Scanning UI components for project: ${projectName}`);
      }

      for (const uiFile of projectUIFiles) {
        const uiResult = await this.uiScanner.scanUISafely(uiFile, projectName);
        uiComponents.push(uiResult);

        // DEBUG: Always log UI result regardless of verbose setting
        // eslint-disable-next-line no-console
        this.logger.verbose(
          `✅ UI scan completed for ${uiFile} (${uiResult.components.length} components)`
        );
      }
    }

    if (this.config.verbose) {
      const cacheSize = this.uiScanner.getUIComponentsCache().length;
      // eslint-disable-next-line no-console
      this.logger.verbose(`🎨 Total UI components in cache: ${cacheSize}`);
      if (cacheSize > 0) {
        const cacheContents = Array.from(this.uiScanner.getUIComponentsCache())
          .map(comp => comp.name)
          .join(', ');
        // eslint-disable-next-line no-console
        this.logger.verbose(`   🎨 Cache contents: ${cacheContents}`);
      }
    }

    return uiComponents;
  }

  /**
   * Обновление сканеров с UI кэшем
   */
  private updateScannersWithUICache(): void {
    const uiCache = this.uiScanner.getUIComponentsCache();

    // ВАЖНО: Обновляем tree builder с UI компонентами для правильной агрегации стилей
    if (uiCache.length > 0) {
      this.treeBuilder = new ComponentTreeBuilder({
        maxDepth: DEPTH_LIMITS.MAX_FILE_SEARCH_DEPTH,
        includeNodeModules: false,
        verbose: this.config.verbose,
        uiComponentsCache: Array.from(uiCache), // Передаем UI кэш для style aggregation
      });

      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        this.logger.verbose(
          `🎨 Updated tree builder with ${uiCache.length} UI components in cache`
        );
      }

      // Обновляем сканеры с новым tree builder и UI кэшем
      this.pageScanner = new PageScanner(this.config, this.treeBuilder, uiCache);
      this.layoutScanner = new LayoutScanner(this.config, this.treeBuilder, uiCache);
    }
  }

  /**
   * Сканирование страниц (ВТОРОЙ ЭТАП)
   */
  private async scanPages(): Promise<PageScanResult[]> {
    // 1. Найти все страницы
    const pageFiles = await this.pageScanner.findAllPages();

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      this.logger.verbose(`📄 Found ${pageFiles.length} page files`);
    }

    // 2. Группировать по проектам
    const projectPages = this.pageScanner.groupPagesByProject(pageFiles);

    // 3. Сканировать страницы каждого проекта
    const pages: PageScanResult[] = [];

    for (const [projectName, projectPageFiles] of projectPages.entries()) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        this.logger.info(`\n📦 Scanning project: ${projectName}`);
      }

      for (const pageFile of projectPageFiles) {
        const pageResult = await this.pageScanner.scanPageSafely(pageFile, projectName);
        pages.push(pageResult);
      }
    }

    return pages;
  }

  /**
   * Сканирование layouts (ТРЕТИЙ ЭТАП)
   */
  private async scanLayouts(): Promise<LayoutScanResult[]> {
    // 1. Найти все layout-компоненты
    const layoutFiles = await this.layoutScanner.findAllLayouts();

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      this.logger.verbose(`🏗️ Found ${layoutFiles.length} layout files`);
    }

    // 2. Группировать по проектам
    const projectLayouts = this.layoutScanner.groupLayoutsByProject(layoutFiles);

    // 3. Сканировать layout-компоненты каждого проекта
    const layouts: LayoutScanResult[] = [];

    for (const [projectName, projectLayoutFiles] of projectLayouts.entries()) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        this.logger.info(`\n🏗️ Scanning layouts for project: ${projectName}`);
      }

      for (const layoutFile of projectLayoutFiles) {
        const layoutResult = await this.layoutScanner.scanLayoutSafely(layoutFile, projectName);
        layouts.push(layoutResult);
      }
    }

    return layouts;
  }

  /**
   * Получение относительного пути от корня проекта
   */
  private getRelativePath(filePath: string): string {
    const workspaceRoot = process.cwd();
    return relative(workspaceRoot, filePath);
  }

  /**
   * Очистка ресурсов
   */
  private cleanup(): void {
    // Очистка кэша компонентов
    this.treeBuilder.clearCache();
    this.uiScanner.clearUIComponentsCache();

    // Принудительная очистка таймеров (если есть)
    if (global.gc) {
      global.gc();
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
    this.uiScanner.clearUIComponentsCache();
  }
}

/**
 * Основная функция для использования в CLI
 */
export async function scanStyles(options: Partial<ScannerConfig> = {}): Promise<ProjectScanResult> {
  const config = { ...DEFAULT_CONFIG, ...options };
  const logger = createLogger({
    quiet: !config.verbose || false,
    verbose: config.verbose || false,
  });

  logger.verbose('🎨 Starting project-wide style scanning...');

  const scanner = new MainScanner(config);
  const result = await scanner.scanProject();

  return result;
}
