// Базовый класс для всех сканеров
// Содержит общую функциональность: таймауты, логирование, обработка ошибок

import { resolve, relative } from 'node:path';
import { parseComponent } from '../utils/component-parser-simple.js';
import { readFileSafely } from '../utils/file-utils.js';
import { createLogger } from '../utils/logger.js';
import { SCAN_TIMEOUTS } from '../constants/index.js';
import type { ComponentNode, ScanError, ScannerConfig } from '../types/scanner.js';

/**
 * Базовый класс для всех сканеров
 * Предоставляет общую функциональность: таймауты, логирование, обработка ошибок
 */
export abstract class BaseScanner {
  protected readonly config: ScannerConfig;
  protected readonly logger = createLogger({ quiet: false, verbose: true });

  constructor(config: ScannerConfig) {
    this.config = config;

    // Настроим logger в зависимости от режима
    this.logger = createLogger({
      quiet: !config.verbose,
      verbose: config.verbose || false,
    });
  }

  /**
   * Получение относительного пути от корня проекта
   */
  protected getRelativePath(filePath: string): string {
    const workspaceRoot = process.cwd();
    return relative(workspaceRoot, filePath);
  }

  /**
   * Извлечение имени компонента из пути файла
   */
  protected extractComponentNameFromPath(filePath: string): string {
    const fileName = filePath.split(/[/\\]/).pop() || '';
    return fileName.replace(/\.(tsx|jsx|ts|js)$/, '');
  }

  /**
   * Извлечение имени проекта из пути файла
   */
  protected extractProjectName(filePath: string): string {
    // apps/web/app/page.tsx → "web"
    // apps/admin-panel/app/page.tsx → "admin-panel"
    const match = filePath.match(/apps[/\\]([^/\\]+)[/\\]/);
    return match?.[1] || 'unknown';
  }

  /**
   * Логирование попытки сканирования
   */
  protected logAttempt(timeout: number): void {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      this.logger.verbose(`  🔄 Попытка сканирования (таймаут: ${timeout}ms)`);
    }
  }

  /**
   * Логирование успешного сканирования
   */
  protected logSuccess(): void {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      this.logger.verbose(`  ✅ Успешно просканировано`);
    }
  }

  /**
   * Логирование таймаута
   */
  protected logTimeout(errorMessage: string): void {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      this.logger.verbose(`  ⏰ Таймаут: ${errorMessage}`);
    }
  }

  /**
   * Извлечение используемых компонентов из JSX
   */
  protected extractUsedComponentsFromJSX(content: string): string[] {
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
  protected createSimpleComponent(name: string, depth: number): ComponentNode {
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
  protected extractTailwindFromContent(content: string): string[] {
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
   * Создание ScanError объекта
   */
  protected createScanError(
    filePath: string,
    message: string,
    type: ScanError['type'] = 'parse_error'
  ): ScanError {
    return {
      filePath,
      message,
      type,
    };
  }

  /**
   * Попытка сканирования с указанным таймаутом (базовая реализация)
   */
  protected async attemptScanWithTimeout<T>(
    filePath: string,
    projectName: string,
    timeout: number,
    scanFunction: (filePath: string, projectName: string) => Promise<T>,
    timeoutPromiseFactory: (timeout: number) => Promise<T>
  ): Promise<T | null> {
    try {
      this.logAttempt(timeout);

      const result = await Promise.race([
        scanFunction(filePath, projectName),
        timeoutPromiseFactory(timeout),
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
   * Сканирование с несколькими таймаутами (базовая реализация)
   */
  protected async scanWithTimeouts<T>(
    filePath: string,
    projectName: string,
    scanFunction: (filePath: string, projectName: string) => Promise<T>,
    timeoutPromiseFactory: (timeout: number) => Promise<T>,
    fallbackFactory: (filePath: string, projectName: string, error: string) => Promise<T>
  ): Promise<T> {
    const timeouts = [SCAN_TIMEOUTS.FULL_SCAN, SCAN_TIMEOUTS.FAST_SCAN, SCAN_TIMEOUTS.MINIMAL_SCAN];

    for (const timeout of timeouts) {
      const result = await this.attemptScanWithTimeout(
        filePath,
        projectName,
        timeout,
        scanFunction,
        timeoutPromiseFactory
      );
      if (result) {
        return result;
      }
    }

    return await fallbackFactory(filePath, projectName, 'All scan attempts failed');
  }
}
