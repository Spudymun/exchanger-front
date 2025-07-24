// LayoutScanner - сканирование layout компонентов
// Отвечает за: поиск layouts, группировка по проектам, определение типов layout

import { resolve } from 'node:path';
import { BaseScanner } from './base-scanner.js';
import { FILE_PATTERNS } from '../constants/index.js';
import { findFiles, readFileSafely } from '../utils/file-utils.js';
import { parseComponent } from '../utils/component-parser-simple.js';
import { extractStyles } from '../utils/style-extractor.js';
import type { LayoutScanResult, ComponentNode, ScannerConfig } from '../types/scanner.js';
import type { ComponentTreeBuilder } from '../core/component-tree-simple.js';

/**
 * Сканер layout компонентов
 * Отвечает за поиск и сканирование layout.tsx и layout-компонентов
 */
export class LayoutScanner extends BaseScanner {
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
   * Поиск всех layout-файлов по паттернам
   */
  async findAllLayouts(): Promise<string[]> {
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
  groupLayoutsByProject(layoutFiles: string[]): Map<string, string[]> {
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
   * Безопасное сканирование layout-компонента с обработкой ошибок
   */
  async scanLayoutSafely(layoutFile: string, projectName: string): Promise<LayoutScanResult> {
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
    return this.scanWithTimeouts(
      layoutFile,
      projectName,
      this.scanLayout.bind(this),
      this.createLayoutTimeoutPromise.bind(this),
      this.createMinimalLayoutScanResult.bind(this)
    );
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

    // Для layout компонентов используем стандартную функцию
    const result = await extractStyles(componentNode.filePath, componentContent);
    const styles = result.styles;

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
   * Создание минимального результата сканирования layout-а при неудаче
   */
  private async createMinimalLayoutScanResult(
    layoutFile: string,
    _projectName: string,
    errorMessage: string
  ): Promise<LayoutScanResult> {
    return {
      layoutPath: this.getRelativePath(layoutFile),
      layoutType: this.determineLayoutType(layoutFile),
      components: [],
      errors: [this.createScanError(layoutFile, `Failed to scan layout: ${errorMessage}`)],
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
}
