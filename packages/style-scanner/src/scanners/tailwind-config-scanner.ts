// TailwindConfigScanner - сканирование конфигураций Tailwind CSS
// Отвечает за: поиск конфигураций, валидацию content путей, обнаружение проблем

import { resolve, dirname } from 'node:path';
import { BaseScanner } from './base-scanner.js';
import { findFiles, fileExists, readFileSafely } from '../utils/file-utils.js';
import { analyzeClassNames } from '../utils/style-extractor.js';
import type {
  TailwindConfigScanResult,
  ConfigIssue,
  ConfigStats,
  ScannerConfig,
  ScanError,
} from '../types/scanner.js';

/**
 * Сканер конфигураций Tailwind CSS
 * Отвечает за поиск и валидацию конфигурационных файлов Tailwind
 */
export class TailwindConfigScanner extends BaseScanner {
  private configCache: Map<string, { config: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 секунд TTL для кэша

  constructor(config: ScannerConfig) {
    super(config);
  }

  /**
   * Сканирование всех конфигураций с анализом дублирования
   */
  async scanAllConfigs(): Promise<TailwindConfigScanResult[]> {
    this.logger.verbose('⚙️ Starting comprehensive Tailwind config scan...');

    // Находим все конфигурации
    const configPaths = await this.findAllTailwindConfigs();

    // Сканируем каждую конфигурацию
    const results: TailwindConfigScanResult[] = [];
    const allConfigs: Array<{ path: string; config: any; result: TailwindConfigScanResult }> = [];

    for (const configPath of configPaths) {
      const result = await this.scanConfigSafely(configPath);
      results.push(result);

      // Сохраняем конфигурацию для анализа дублирования
      const config = await this.parseConfig(configPath);
      if (config) {
        allConfigs.push({ path: configPath, config, result });
      }
    }

    // Анализ дублирования между конфигурациями (DuplicationAnalyzer компонент)
    const duplicationIssues = await this.analyzeDuplication(allConfigs);

    // Добавляем issues дублирования к соответствующим результатам
    this.addDuplicationIssuesToResults(results, duplicationIssues);

    this.logger.verbose(`✅ Completed scan of ${results.length} Tailwind configs`);

    return results;
  }

  /**
   * Поиск всех конфигурационных файлов Tailwind
   */
  async findAllTailwindConfigs(): Promise<string[]> {
    this.logger.verbose('⚙️ Finding all Tailwind config files...');

    const configPatterns = [
      'tailwind.config.js',
      'tailwind.config.cjs',
      'tailwind.config.ts',
      'tailwind.config.mjs',
      'apps/*/tailwind.config.js',
      'apps/*/tailwind.config.cjs',
      'apps/*/tailwind.config.ts',
      'apps/*/tailwind.config.mjs',
      'packages/*/tailwind.config.js',
      'packages/*/tailwind.config.cjs',
      'packages/*/tailwind.config.ts',
      'packages/*/tailwind.config.mjs',
    ];

    const allFiles: string[] = [];

    for (const pattern of configPatterns) {
      this.logger.verbose(`  📋 Searching config pattern: ${pattern}`);

      const files = await findFiles(pattern);

      this.logger.verbose(`  ✅ Found ${files.length} config files for pattern: ${pattern}`);

      allFiles.push(...files);
    }

    // Удаляем дубликаты
    const uniqueFiles = [...new Set(allFiles)];

    this.logger.verbose(`🎯 Total unique Tailwind config files found: ${uniqueFiles.length}`);

    return uniqueFiles;
  }

  /**
   * Сканирование конфигурации с обработкой ошибок
   */
  async scanConfigSafely(configPath: string): Promise<TailwindConfigScanResult> {
    try {
      this.logger.verbose(`⚙️ Scanning Tailwind config: ${configPath}`);

      return await this.scanConfig(configPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.verbose(`❌ Error scanning config ${configPath}: ${errorMessage}`);

      return this.createErrorResult(configPath, errorMessage);
    }
  }

  /**
   * Основной метод сканирования конфигурации
   */
  private async scanConfig(configPath: string): Promise<TailwindConfigScanResult> {
    const configType = this.determineConfigType(configPath);
    const issues: ConfigIssue[] = [];
    const errors: ScanError[] = [];

    // Парсинг конфигурации
    const config = await this.parseConfig(configPath);

    if (!config) {
      errors.push(
        this.createScanError(configPath, 'Failed to parse Tailwind config', 'parse_error')
      );
      return this.createErrorResult(configPath, 'Parse error', configType, errors);
    }

    // Валидация content путей
    const contentIssues = await this.validateContentPaths(config.content || [], configPath);
    issues.push(...contentIssues);

    // Поиск пропущенных файлов (MissingFileDetector компонент)
    const missingFileIssues = await this.findMissingFiles(config.content || [], configPath);
    issues.push(...missingFileIssues);

    // Создание статистики
    const stats = this.createConfigStats(config.content || [], [
      ...contentIssues,
      ...missingFileIssues,
    ]);

    return {
      configPath: this.getRelativePath(configPath),
      configType,
      issues,
      stats,
      errors,
    };
  }

  /**
   * Определение типа конфигурации
   */
  private determineConfigType(configPath: string): TailwindConfigScanResult['configType'] {
    if (configPath.includes('packages/tailwind-preset')) {
      return 'preset';
    }

    if (configPath.includes('apps/')) {
      return 'app-specific';
    }

    return 'root';
  }

  /**
   * Парсинг конфигурационного файла с кэшированием
   */
  private async parseConfig(configPath: string): Promise<any> {
    const absolutePath = resolve(configPath);
    const now = Date.now();

    // Проверяем кэш
    const cached = this.configCache.get(absolutePath);
    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      this.logger.verbose(`Using cached config for ${configPath}`);
      return cached.config;
    }

    try {
      // Используем динамический импорт для поддержки как CommonJS, так и ES модулей
      const configModule = await import(`file://${absolutePath}?t=${now}`);
      const parsedConfig = configModule.default || configModule;

      // Кэшируем результат
      this.configCache.set(absolutePath, {
        config: parsedConfig,
        timestamp: now,
      });

      this.logger.verbose(`Parsed and cached config for ${configPath}`);
      return parsedConfig;
    } catch (error) {
      // Улучшенная обработка ошибок
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.verbose(`Failed to parse config ${configPath}: ${errorMessage}`);

      // Логируем специфичные типы ошибок
      if (error instanceof SyntaxError) {
        this.logger.verbose(`Syntax error in config ${configPath}: ${errorMessage}`);
      } else if (error instanceof Error && error.message.includes('Cannot find module')) {
        this.logger.verbose(`Module not found for config ${configPath}: ${errorMessage}`);
      }

      return null;
    }
  }

  /**
   * Валидация content путей в конфигурации (ContentPathValidator компонент)
   */
  private async validateContentPaths(
    contentPaths: string[],
    configPath: string
  ): Promise<ConfigIssue[]> {
    const issues: ConfigIssue[] = [];
    const configDir = dirname(configPath);

    for (const contentPath of contentPaths) {
      try {
        // Проверяем тип пути
        if (this.isGlobPattern(contentPath)) {
          // Валидация glob паттерна с таймаутом
          const globIssues = await this.validateGlobPattern(contentPath, configDir);
          issues.push(...globIssues);
        } else {
          // Валидация обычного пути
          const pathIssues = await this.validateRegularPath(contentPath, configDir);
          issues.push(...pathIssues);
        }
      } catch (error) {
        // Обработка ошибок валидации
        issues.push({
          type: 'dead_path',
          severity: 'error',
          message: `Failed to validate path "${contentPath}": ${error}`,
          path: contentPath,
          suggestion: 'Check if the path is accessible and correctly formatted',
        });
      }
    }

    return issues;
  }

  /**
   * Проверка является ли путь glob паттерном
   */
  private isGlobPattern(path: string): boolean {
    return path.includes('*') || path.includes('?') || path.includes('[') || path.includes('{');
  }

  /**
   * Валидация glob паттерна с таймаутом
   */
  private async validateGlobPattern(pattern: string, baseDir: string): Promise<ConfigIssue[]> {
    const issues: ConfigIssue[] = [];

    try {
      // Используем таймаут для предотвращения зависания на широких паттернах
      const timeoutPromise = new Promise<string[]>((_, reject) => {
        setTimeout(() => reject(new Error('Glob pattern timeout')), 5000);
      });

      const findFilesPromise = findFiles(pattern, baseDir);

      const foundFiles = await Promise.race([findFilesPromise, timeoutPromise]);

      if (foundFiles.length === 0) {
        issues.push({
          type: 'empty_glob',
          severity: 'warning',
          message: `Glob pattern "${pattern}" matches no files`,
          path: pattern,
          suggestion: 'Check if the pattern is correct or if matching files exist',
        });
      } else if (foundFiles.length > 1000) {
        // Предупреждение о слишком широком паттерне
        issues.push({
          type: 'inefficient_glob',
          severity: 'info',
          message: `Glob pattern "${pattern}" matches ${foundFiles.length} files (very broad)`,
          path: pattern,
          suggestion: 'Consider using more specific patterns for better performance',
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Glob pattern timeout') {
        issues.push({
          type: 'inefficient_glob',
          severity: 'warning',
          message: `Glob pattern "${pattern}" is too broad and timed out`,
          path: pattern,
          suggestion: 'Use more specific patterns to avoid performance issues',
        });
      } else {
        issues.push({
          type: 'empty_glob',
          severity: 'error',
          message: `Failed to process glob pattern "${pattern}": ${error}`,
          path: pattern,
          suggestion: 'Check if the pattern syntax is correct',
        });
      }
    }

    return issues;
  }

  /**
   * Валидация обычного пути
   */
  private async validateRegularPath(path: string, baseDir: string): Promise<ConfigIssue[]> {
    const issues: ConfigIssue[] = [];

    // Разрешаем относительные пути
    const resolvedPath = resolve(baseDir, path);

    // Проверяем существование пути
    const exists = await fileExists(resolvedPath);

    if (!exists) {
      issues.push({
        type: 'dead_path',
        severity: 'error',
        message: `Path "${path}" does not exist`,
        path: path,
        suggestion: 'Remove the path or create the missing directory/file',
      });
    }

    return issues;
  }

  /**
   * Поиск файлов с Tailwind классами, не включенных в content (MissingFileDetector компонент)
   */
  private async findMissingFiles(
    contentPaths: string[],
    configPath: string
  ): Promise<ConfigIssue[]> {
    const issues: ConfigIssue[] = [];
    const configDir = dirname(configPath);

    try {
      // Поиск всех потенциальных файлов с Tailwind классами
      const candidateFiles = await this.findCandidateFiles(configDir);

      // Проверяем каждый файл
      for (const filePath of candidateFiles) {
        const hasTailwindClasses = await this.fileHasTailwindClasses(filePath);

        if (hasTailwindClasses) {
          // Проверяем включен ли файл в content paths
          const isIncluded = await this.isFileIncludedInContent(filePath, contentPaths, configDir);

          if (!isIncluded) {
            issues.push({
              type: 'missing_file',
              severity: 'warning',
              message: `File "${this.getRelativePath(filePath)}" contains Tailwind classes but is not included in content paths`,
              path: this.getRelativePath(filePath),
              suggestion: 'Add a matching pattern to the content array in Tailwind config',
            });
          }
        }
      }
    } catch (error) {
      this.logger.verbose(`Error in MissingFileDetector: ${error}`);
    }

    return issues;
  }

  /**
   * Поиск файлов-кандидатов для проверки на Tailwind классы (с оптимизацией производительности)
   */
  private async findCandidateFiles(baseDir: string): Promise<string[]> {
    const startTime = Date.now();

    // Оптимизированные паттерны для лучшей производительности
    const includePattern = '**/*.{tsx,jsx,ts,js}';
    const excludePatterns = [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**',
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/*.d.ts',
    ];

    try {
      // Используем таймаут для предотвращения зависания
      const timeoutPromise = new Promise<string[]>((_, reject) => {
        setTimeout(() => reject(new Error('File search timeout')), 10000); // 10 секунд
      });

      const searchPromise = findFiles(includePattern, baseDir);
      const allFiles = await Promise.race([searchPromise, timeoutPromise]);

      // Фильтруем исключения
      const filteredFiles = allFiles.filter(file => {
        return !excludePatterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
          return regex.test(file);
        });
      });

      // Ограничиваем количество для производительности
      const limitedFiles = filteredFiles.slice(0, 300); // Уменьшено до 300 для лучшей производительности

      const duration = Date.now() - startTime;
      this.logger.verbose(`Found ${limitedFiles.length} candidate files in ${duration}ms`);

      return limitedFiles;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage === 'File search timeout') {
        this.logger.verbose(`File search timed out after ${duration}ms`);
        return []; // Возвращаем пустой массив при таймауте
      }

      this.logger.verbose(`Error finding candidate files: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Проверка содержит ли файл Tailwind классы
   */
  private async fileHasTailwindClasses(filePath: string): Promise<boolean> {
    try {
      const content = await readFileSafely(filePath);

      if (!content) {
        return false;
      }

      // Используем существующую функцию анализа классов
      const classAnalysis = analyzeClassNames(content);

      // Считаем что файл содержит Tailwind классы если найдены статические классы
      return classAnalysis.static.length > 0;
    } catch (error) {
      this.logger.verbose(`Error analyzing file ${filePath}: ${error}`);
      return false;
    }
  }

  /**
   * Проверка включен ли файл в content paths
   */
  private async isFileIncludedInContent(
    filePath: string,
    contentPaths: string[],
    configDir: string
  ): Promise<boolean> {
    for (const contentPath of contentPaths) {
      try {
        if (this.isGlobPattern(contentPath)) {
          // Проверяем glob паттерн
          const matchedFiles = await findFiles(contentPath, configDir);
          if (matchedFiles.includes(filePath)) {
            return true;
          }
        } else {
          // Проверяем прямое совпадение пути
          const resolvedContentPath = resolve(configDir, contentPath);
          if (filePath === resolvedContentPath) {
            return true;
          }
        }
      } catch (error) {
        this.logger.verbose(`Error checking content path ${contentPath}: ${error}`);
      }
    }

    return false;
  }

  /**
   * Анализ дублирования путей между конфигурациями (DuplicationAnalyzer компонент)
   */
  private async analyzeDuplication(
    allConfigs: Array<{ path: string; config: any; result: TailwindConfigScanResult }>
  ): Promise<Map<string, ConfigIssue[]>> {
    const duplicationMap = new Map<string, ConfigIssue[]>();

    // Создаем карту путей и конфигураций где они используются
    const pathUsageMap = new Map<string, string[]>();

    // Собираем все content пути из всех конфигураций
    for (const { path: configPath, config } of allConfigs) {
      const contentPaths = config.content || [];

      for (const contentPath of contentPaths) {
        // Нормализуем путь для сравнения
        const normalizedPath = this.normalizePath(contentPath);

        if (!pathUsageMap.has(normalizedPath)) {
          pathUsageMap.set(normalizedPath, []);
        }

        pathUsageMap.get(normalizedPath)!.push(configPath);
      }
    }

    // Анализируем дублирование
    for (const [normalizedPath, configPaths] of pathUsageMap.entries()) {
      if (configPaths.length > 1) {
        // Проверяем является ли дублирование оправданным
        const isJustified = this.isDuplicationJustified(normalizedPath, configPaths);

        if (!isJustified) {
          // Создаем issue для каждой конфигурации с дублированием
          for (const configPath of configPaths) {
            const otherConfigs = configPaths.filter(p => p !== configPath);

            const issue: ConfigIssue = {
              type: 'redundant_path',
              severity: 'info',
              message: `Path "${normalizedPath}" is duplicated in ${otherConfigs.length} other config(s)`,
              path: normalizedPath,
              suggestion: `Consider centralizing this path or using inheritance. Also found in: ${otherConfigs.map(p => this.getRelativePath(p)).join(', ')}`,
            };

            if (!duplicationMap.has(configPath)) {
              duplicationMap.set(configPath, []);
            }

            duplicationMap.get(configPath)!.push(issue);
          }
        }
      }
    }

    return duplicationMap;
  }

  /**
   * Нормализация пути для сравнения
   */
  private normalizePath(path: string): string {
    // Удаляем различия в слешах и приводим к единому формату
    return path.replace(/\\/g, '/').toLowerCase();
  }

  /**
   * Проверка является ли дублирование оправданным
   */
  private isDuplicationJustified(path: string, configPaths: string[]): boolean {
    // Дублирование оправдано если:

    // 1. Один из путей - это preset, а другие - app-specific конфигурации
    const hasPreset = configPaths.some(p => p.includes('packages/tailwind-preset'));
    const hasAppConfigs = configPaths.some(p => p.includes('apps/'));

    if (hasPreset && hasAppConfigs) {
      return true; // Preset может дублировать пути с app конфигурациями
    }

    // 2. Путь указывает на общие UI компоненты
    if (path.includes('packages/ui') || path.includes('@repo/ui')) {
      return true; // UI компоненты могут быть включены в несколько конфигураций
    }

    // 3. Путь является очень общим (например, глобальные стили)
    if (path.includes('globals.css') || path.includes('global.css')) {
      return true;
    }

    return false; // Остальные дублирования не оправданы
  }

  /**
   * Добавление issues дублирования к результатам
   */
  private addDuplicationIssuesToResults(
    results: TailwindConfigScanResult[],
    duplicationIssues: Map<string, ConfigIssue[]>
  ): void {
    for (const result of results) {
      // Находим абсолютный путь для сравнения
      const absolutePath = resolve(result.configPath);

      // Ищем issues для этой конфигурации
      for (const [configPath, issues] of duplicationIssues.entries()) {
        if (resolve(configPath) === absolutePath) {
          // Добавляем issues к результату (создаем новый объект для immutability)
          const updatedResult = {
            ...result,
            issues: [...result.issues, ...issues],
          };

          // Заменяем результат в массиве
          const index = results.indexOf(result);
          results[index] = updatedResult;
          break;
        }
      }
    }
  }

  /**
   * Создание статистики конфигурации
   */
  private createConfigStats(contentPaths: string[], issues: ConfigIssue[]): ConfigStats {
    const deadPaths = issues.filter(issue => issue.type === 'dead_path').length;
    const emptyGlobs = issues.filter(issue => issue.type === 'empty_glob').length;
    const missingFiles = issues.filter(issue => issue.type === 'missing_file').length;

    return {
      totalContentPaths: contentPaths.length,
      validPaths: contentPaths.length - deadPaths - emptyGlobs,
      deadPaths,
      filesFound: 0, // Будет реализовано при необходимости
      missingFiles,
    };
  }

  /**
   * Создание результата с ошибкой
   */
  private createErrorResult(
    configPath: string,
    errorMessage: string,
    configType: TailwindConfigScanResult['configType'] = 'root',
    errors: ScanError[] = []
  ): TailwindConfigScanResult {
    return {
      configPath: this.getRelativePath(configPath),
      configType,
      issues: [],
      stats: {
        totalContentPaths: 0,
        validPaths: 0,
        deadPaths: 0,
        filesFound: 0,
        missingFiles: 0,
      },
      errors:
        errors.length > 0
          ? errors
          : [this.createScanError(configPath, errorMessage, 'parse_error')],
    };
  }

  /**
   * Очистка кэша конфигураций
   */
  clearCache(): void {
    this.configCache.clear();
    this.logger.verbose('Cleared Tailwind config cache');
  }

  /**
   * Получение статистики кэша
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.configCache.size,
      entries: Array.from(this.configCache.keys()),
    };
  }
}
