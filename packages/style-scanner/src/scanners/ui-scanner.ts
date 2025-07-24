// UIScanner - сканирование UI компонентов
// Отвечает за: поиск UI компонентов, определение типов, multi-component логику

import { resolve } from 'node:path';
import { BaseScanner } from './base-scanner.js';
import { FILE_PATTERNS } from '../constants/index.js';
import { findFiles, readFileSafely } from '../utils/file-utils.js';
import { parseComponent } from '../utils/component-parser-simple.js';
import { extractStylesForLocalComponentWithUI } from '../utils/style-extractor.js';
import type { UIScanResult, ComponentNode, ScannerConfig } from '../types/scanner.js';
import type { ComponentTreeBuilder } from '../core/component-tree-simple.js';

/**
 * Сканер UI компонентов
 * Отвечает за поиск и сканирование компонентов пакета @repo/ui
 */
export class UIScanner extends BaseScanner {
  private treeBuilder: ComponentTreeBuilder;
  private uiComponentsCache: ComponentNode[];

  constructor(
    config: ScannerConfig,
    treeBuilder: ComponentTreeBuilder,
    uiComponentsCache: ComponentNode[] = []
  ) {
    super(config);
    this.treeBuilder = treeBuilder;
    this.uiComponentsCache = uiComponentsCache;
  }

  /**
   * Поиск всех UI компонентов по паттернам
   */
  async findAllUIComponents(): Promise<string[]> {
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
  groupUIComponentsByProject(uiFiles: string[]): Map<string, string[]> {
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
   * Безопасное сканирование UI-компонента с обработкой ошибок
   */
  async scanUISafely(uiFile: string, projectName: string): Promise<UIScanResult> {
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
    return this.scanWithTimeouts(
      uiFile,
      projectName,
      this.scanUI.bind(this),
      this.createUITimeoutPromise.bind(this),
      this.createMinimalUIScanResult.bind(this)
    );
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

    // Сохраняем найденные компоненты в кэш
    components.forEach(component => {
      this.uiComponentsCache.push(component);
      // eslint-disable-next-line no-console
      console.log(
        `📦 DEBUG: Added to cache: ${component.name} (${component.styles.tailwind.length} tailwind classes)`
      );
    });

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

    // Парсим файл чтобы узнать сколько в нем компонентов
    const parsed = parseComponent(componentContent);
    const isMultiComponentFile = parsed.localComponents && parsed.localComponents.length > 1;

    let styles;
    if (isMultiComponentFile) {
      // Для локальных компонентов в многокомпонентном файле используем функцию с UI поддержкой
      const result = await extractStylesForLocalComponentWithUI(
        componentContent,
        componentNode.name,
        this.uiComponentsCache
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
   * Создание минимального результата UI-сканирования при ошибке
   */
  private async createMinimalUIScanResult(
    uiFile: string,
    projectName: string,
    error: string
  ): Promise<UIScanResult> {
    return {
      uiPath: uiFile,
      componentType: 'other',
      components: [],
      errors: [this.createScanError(uiFile, error)],
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
   * Получение кэша UI компонентов
   */
  getUIComponentsCache(): readonly ComponentNode[] {
    return this.uiComponentsCache;
  }

  /**
   * Очистка кэша UI компонентов
   */
  clearUIComponentsCache(): void {
    this.uiComponentsCache = [];
  }
}
