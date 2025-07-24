/**
 * File Management Service
 * Сервис для управления файлами и директориями при генерации Markdown документации
 */

import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectScanResult, PageScanResult, LayoutScanResult } from '../types/scanner.js';
import { createLogger, type LoggerConfig } from '../utils/logger.js';

/**
 * Сервис управления файлами для генерации Markdown
 */
export class FileManagementService {
  private readonly logger;

  constructor(
    private readonly outputDir: string,
    private readonly verbose: boolean
  ) {
    const loggerConfig = { quiet: !verbose, verbose };
    this.logger = createLogger(loggerConfig);
  }

  /**
   * Очистка выходной директории
   */
  async cleanOutputDirectory(): Promise<void> {
    try {
      await rm(this.outputDir, { recursive: true, force: true });
      this.logger.verbose(`🗑️  Cleaned output directory: ${this.outputDir}`);
    } catch (error) {
      // Директория может не существовать - это нормально
      this.logger.verbose(`📁 Output directory will be created: ${this.outputDir}`);
    }
  }

  /**
   * Создание необходимых директорий для проекта
   */
  async ensureDirectories(projectResult: ProjectScanResult): Promise<void> {
    await mkdir(this.outputDir, { recursive: true });

    // Создаем директории для каждого проекта и страницы
    for (const pageResult of projectResult.pages) {
      const { projectName, pageName } = this.extractProjectAndPageNames(pageResult.pagePath);
      const projectDir = join(this.outputDir, projectName);
      const pageDir = join(projectDir, pageName);

      await mkdir(projectDir, { recursive: true });
      await mkdir(pageDir, { recursive: true });
    }

    // Создаем директории для layout компонентов
    for (const layoutResult of projectResult.layouts) {
      const { projectName } = this.extractProjectAndLayoutNames(layoutResult.layoutPath);
      const projectDir = join(this.outputDir, projectName);
      const layoutsDir = join(projectDir, 'layouts');

      await mkdir(projectDir, { recursive: true });
      await mkdir(layoutsDir, { recursive: true });
    }
  }

  /**
   * Запись файла с логированием
   */
  async writeMarkdownFile(filePath: string, content: string): Promise<void> {
    await writeFile(filePath, content, 'utf-8');

    this.logger.verbose(`  📄 Created: ${filePath}`);
  }

  /**
   * Создание пути для файла страницы
   */
  createPageFilePath(projectName: string, pageName: string, fileName: string): string {
    return join(this.outputDir, projectName, pageName, fileName);
  }

  /**
   * Создание пути для файла layout
   */
  createLayoutFilePath(projectName: string, fileName: string): string {
    return join(this.outputDir, projectName, 'layouts', fileName);
  }

  /**
   * Создание пути для сводного файла
   */
  createSummaryFilePath(): string {
    return join(this.outputDir, 'summary.md');
  }

  /**
   * Создание пути для overview файла страницы
   */
  createPageOverviewFilePath(projectName: string, pageName: string): string {
    return join(this.outputDir, projectName, pageName, 'overview.md');
  }

  /**
   * Создание пути для overview файла layout
   */
  createLayoutOverviewFilePath(projectName: string, layoutName: string): string {
    return join(this.outputDir, projectName, 'layouts', `${layoutName}-overview.md`);
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
}
