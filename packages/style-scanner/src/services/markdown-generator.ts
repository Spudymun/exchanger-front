/**
 * Markdown Generator (Refactored)
 * Главный класс для генерации Markdown документации с использованием сервисов
 */

import type { ProjectScanResult, PageScanResult, LayoutScanResult } from '../types/scanner.js';
import {
  FileManagementService,
  ComponentAnalysisService,
  ContentGenerationService,
} from './index.js';
import { createLogger, type LoggerConfig } from '../utils/logger.js';

/**
 * Конфигурация генератора Markdown
 */
export interface MarkdownConfig {
  readonly outputDir: string;
  readonly verbose: boolean;
}

/**
 * Генератор Markdown документации (рефакторенная версия)
 */
export class MarkdownGenerator {
  private readonly fileService: FileManagementService;
  private readonly analysisService: ComponentAnalysisService;
  private readonly contentService: ContentGenerationService;
  private readonly logger;

  constructor(private readonly config: MarkdownConfig) {
    const loggerConfig = { quiet: !config.verbose, verbose: config.verbose };
    this.logger = createLogger(loggerConfig);
    this.fileService = new FileManagementService(config.outputDir, config.verbose);
    this.analysisService = new ComponentAnalysisService(config.verbose);
    this.contentService = new ContentGenerationService(config.verbose);
  }

  /**
   * Генерация всей документации для проекта
   */
  async generateDocumentation(projectResult: ProjectScanResult): Promise<void> {
    this.logger.info('📝 Generating Markdown documentation...');

    // СНАЧАЛА ОЧИЩАЕМ ДИРЕКТОРИЮ
    await this.fileService.cleanOutputDirectory();

    // Создаем директории
    await this.fileService.ensureDirectories(projectResult);

    // Генерируем общий summary файл
    await this.generateSummary(projectResult);

    // Генерируем документацию для каждой страницы по новой структуре
    await this.generateProjectStructuredDocs(projectResult);

    this.logger.info(`✅ Documentation generated in: ${this.config.outputDir}`);
  }

  /**
   * Генерация сводного файла
   */
  private async generateSummary(projectResult: ProjectScanResult): Promise<void> {
    const content = this.contentService.createSummaryMarkdown(projectResult);
    const filePath = this.fileService.createSummaryFilePath();

    await this.fileService.writeMarkdownFile(filePath, content);
  }

  /**
   * Генерация структурированной документации по проектам
   */
  private async generateProjectStructuredDocs(projectResult: ProjectScanResult): Promise<void> {
    // Генерируем документацию для страниц
    for (const pageResult of projectResult.pages) {
      const { projectName, pageName } = this.extractProjectAndPageNames(pageResult.pagePath);

      // Генерируем общий файл страницы
      await this.generatePageOverview(pageResult, projectName, pageName);

      // Генерируем файлы для ИМПОРТИРОВАННЫХ компонентов-секций
      await this.generateSectionFiles(pageResult, projectName, pageName);
    }

    // Генерируем документацию для layout компонентов
    for (const layoutResult of projectResult.layouts) {
      const { projectName, layoutName } = this.extractProjectAndLayoutNames(
        layoutResult.layoutPath
      );

      // Генерируем документацию для layout компонента
      await this.generateLayoutDocumentation(layoutResult, projectName, layoutName);
    }
  }

  /**
   * Генерация файлов для структурирования страницы
   * Создаёт файлы для секций (если есть импорты) или топ-левел компонентов (если импортов нет)
   */
  private async generateSectionFiles(
    pageResult: PageScanResult,
    projectName: string,
    pageName: string
  ): Promise<void> {
    // Получаем компоненты для структурирования (секции или топ-левел)
    const structuringComponents = this.analysisService.getStructuringComponents(pageResult);

    for (const structuringComponent of structuringComponents) {
      const content = this.contentService.createComponentMarkdown(
        structuringComponent,
        pageResult.pagePath
      );
      const fileName = this.sanitizeFileName(structuringComponent.name) + '.md';
      const filePath = this.fileService.createPageFilePath(projectName, pageName, fileName);

      await this.fileService.writeMarkdownFile(filePath, content);
    }
  }

  /**
   * Генерация документации для layout компонента
   */
  private async generateLayoutDocumentation(
    layoutResult: LayoutScanResult,
    projectName: string,
    layoutName: string
  ): Promise<void> {
    // Генерируем общий файл для layout
    await this.generateLayoutOverview(layoutResult, projectName, layoutName);

    // Генерируем файлы для компонентов layout-а (аналогично секциям)
    await this.generateLayoutComponentFiles(layoutResult, projectName, layoutName);
  }

  /**
   * Генерация overview файла для layout компонента
   */
  private async generateLayoutOverview(
    layoutResult: LayoutScanResult,
    projectName: string,
    layoutName: string
  ): Promise<void> {
    const content = this.contentService.createLayoutOverviewMarkdown(
      layoutResult,
      projectName,
      layoutName
    );
    const filePath = this.fileService.createLayoutOverviewFilePath(projectName, layoutName);

    await this.fileService.writeMarkdownFile(filePath, content);
  }

  /**
   * Генерация файлов для компонентов layout-а
   */
  private async generateLayoutComponentFiles(
    layoutResult: LayoutScanResult,
    projectName: string,
    layoutName: string
  ): Promise<void> {
    // Получаем структурирующие компоненты layout-а (аналогично страницам)
    const structuringComponents =
      this.analysisService.getStructuringComponentsFromLayout(layoutResult);

    for (const structuringComponent of structuringComponents) {
      const content = this.contentService.createComponentMarkdown(
        structuringComponent,
        layoutResult.layoutPath
      );
      const fileName = this.sanitizeFileName(structuringComponent.name) + '.md';
      const filePath = this.fileService.createLayoutFilePath(projectName, fileName);

      await this.fileService.writeMarkdownFile(filePath, content);
    }
  }

  /**
   * Генерация overview файла для страницы
   */
  private async generatePageOverview(
    pageResult: PageScanResult,
    projectName: string,
    pageName: string
  ): Promise<void> {
    const content = this.contentService.createPageOverviewMarkdown(
      pageResult,
      projectName,
      pageName
    );
    const filePath = this.fileService.createPageOverviewFilePath(projectName, pageName);

    await this.fileService.writeMarkdownFile(filePath, content);
  }

  /**
   * Извлечение имени проекта и страницы из пути
   */
  private extractProjectAndPageNames(pagePath: string): { projectName: string; pageName: string } {
    const normalizedPath = pagePath.replace(/\\/g, '/');
    const pathParts = normalizedPath.split('/');
    let projectName = 'unknown';
    let pageName = 'page';

    const appsIndex = pathParts.findIndex(part => part === 'apps');
    if (appsIndex !== -1 && pathParts[appsIndex + 1]) {
      projectName = pathParts[appsIndex + 1] || 'unknown';
    }

    const appIndex = pathParts.findIndex(part => part === 'app');
    if (appIndex !== -1) {
      const pageStructure = pathParts.slice(appIndex + 1, -1);
      if (pageStructure.length === 0) {
        pageName = 'home-page';
      } else if (pageStructure.includes('[locale]')) {
        const filteredParts = pageStructure.filter(part => !part.startsWith('['));
        pageName = filteredParts.length > 0 ? filteredParts.join('-') + '-page' : 'home-page';
      } else {
        pageName = pageStructure.join('-') + '-page';
      }
    }

    return { projectName, pageName };
  }

  /**
   * Извлечение имени проекта и layout из пути
   */
  private extractProjectAndLayoutNames(layoutPath: string): {
    projectName: string;
    layoutName: string;
  } {
    const normalizedPath = layoutPath.replace(/\\/g, '/');
    const pathParts = normalizedPath.split('/');
    let projectName = 'unknown';
    let layoutName = 'layout';

    const appsIndex = pathParts.findIndex(part => part === 'apps');
    if (appsIndex !== -1 && pathParts[appsIndex + 1]) {
      projectName = pathParts[appsIndex + 1] || 'unknown';
    }

    // Извлекаем название layout компонента из имени файла
    const fileName = pathParts[pathParts.length - 1];
    if (fileName) {
      // Убираем расширение и делаем kebab-case
      layoutName = fileName
        .replace(/\.(tsx|jsx|ts|js)$/, '')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
    }

    return { projectName, layoutName };
  }

  /**
   * Санитизация имени файла
   */
  private sanitizeFileName(name: string): string {
    return (
      name
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'component'
    );
  }
}

/**
 * Утилитарная функция для генерации документации
 */
export async function generateMarkdownDocs(
  projectResult: ProjectScanResult,
  config: MarkdownConfig
): Promise<void> {
  const generator = new MarkdownGenerator(config);
  await generator.generateDocumentation(projectResult);
}
