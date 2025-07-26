# Design Document: TailwindConfigScanner

## Overview

TailwindConfigScanner является специализированным сканером в архитектуре style-scanner, предназначенным для автоматической проверки корректности конфигураций Tailwind CSS. Сканер интегрируется в существующий workflow как четвертый этап после сканирования UI компонентов, страниц и layouts.

**Архитектурные принципы:**

- Следование существующим паттернам style-scanner
- Минимальное дублирование кода (Rule 20)
- Использование централизованных систем (Rule 17)
- Immutable результаты и error handling

## Architecture

### High-Level Architecture

```
MainScanner
├── 1. UI Components Scan
├── 2. Pages Scan
├── 3. Layouts Scan
└── 4. Tailwind Config Scan ← NEW
    └── TailwindConfigScanner
        ├── ConfigDiscovery
        ├── ContentPathValidator
        ├── MissingFileDetector
        └── DuplicationAnalyzer
```

### Integration Points

1. **MainScanner Integration**: Новый метод `scanTailwindConfigs()` в MainScanner
2. **Type System**: Новый `TailwindConfigScanResult` в `types/scanner.ts`
3. **Base Scanner**: Наследование от `BaseScanner` для консистентности
4. **File Utils**: Использование существующих `file-utils.ts`
5. **Markdown Generation**: Интеграция в существующую систему генерации отчетов

## Components and Interfaces

### 1. TailwindConfigScanner Class

```typescript
export class TailwindConfigScanner extends BaseScanner {
  constructor(config: ScannerConfig);

  // Основные методы
  async scanAllConfigs(): Promise<TailwindConfigScanResult[]>;
  async scanConfigSafely(configPath: string): Promise<TailwindConfigScanResult>;

  // Внутренние методы
  private async findAllTailwindConfigs(): Promise<string[]>;
  private async validateConfig(configPath: string): Promise<ConfigValidationResult>;
  private async checkContentPaths(
    config: TailwindConfig,
    basePath: string
  ): Promise<ContentPathIssue[]>;
  private async findMissingFiles(
    contentPaths: string[],
    basePath: string
  ): Promise<MissingFileIssue[]>;
  private async analyzeDuplication(configs: TailwindConfig[]): Promise<DuplicationIssue[]>;
}
```

### 2. Type Definitions

```typescript
// Результат сканирования конфигурации
export interface TailwindConfigScanResult {
  readonly configPath: string;
  readonly configType: 'root' | 'app-specific' | 'preset';
  readonly issues: readonly ConfigIssue[];
  readonly stats: ConfigStats;
  readonly errors: readonly ScanError[];
}

// Типы проблем конфигурации
export interface ConfigIssue {
  readonly type:
    | 'dead_path'
    | 'empty_glob'
    | 'missing_file'
    | 'redundant_path'
    | 'inefficient_glob';
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly path?: string;
  readonly suggestion?: string;
}

// Статистика конфигурации
export interface ConfigStats {
  readonly totalContentPaths: number;
  readonly validPaths: number;
  readonly deadPaths: number;
  readonly filesFound: number;
  readonly missingFiles: number;
}

// Расширение ProjectScanResult
export interface ProjectScanResult {
  // ... существующие поля
  readonly tailwindConfigs: readonly TailwindConfigScanResult[]; // NEW
}
```

### 3. Configuration Discovery

```typescript
class ConfigDiscovery {
  async findAllConfigs(): Promise<ConfigInfo[]> {
    // Поиск всех tailwind.config.{js,cjs,ts,mjs}
    // Исключение node_modules
    // Определение типа конфигурации (root/app/preset)
  }

  async parseConfig(configPath: string): Promise<TailwindConfig> {
    // Динамический импорт конфигурации
    // Обработка CommonJS/ESM
    // Разрешение preset'ов
  }
}
```

### 4. Content Path Validator

```typescript
class ContentPathValidator {
  async validatePaths(contentPaths: string[], basePath: string): Promise<PathValidationResult[]> {
    // Проверка существования путей
    // Валидация glob паттернов
    // Проверка что паттерны находят файлы
  }

  private async resolveGlobPattern(pattern: string, basePath: string): Promise<string[]> {
    // Использование fast-glob для разрешения паттернов
    // Применение таймаутов для предотвращения зависания
  }
}
```

### 5. Missing File Detector

```typescript
class MissingFileDetector {
  async findMissingFiles(contentPaths: string[], projectRoot: string): Promise<MissingFileInfo[]> {
    // Поиск всех .tsx/.jsx файлов в проекте
    // Анализ содержимого на наличие className
    // Проверка включения в content paths
  }

  private async haseTailwindClasses(filePath: string): Promise<boolean> {
    // Использование существующих CLASSNAME_PATTERNS
    // Быстрая проверка без полного парсинга
  }
}
```

## Data Models

### TailwindConfig Model

```typescript
interface TailwindConfig {
  content: string[];
  presets?: TailwindConfig[];
  theme?: Record<string, any>;
  plugins?: any[];
  // Другие опции Tailwind
}

interface ConfigInfo {
  path: string;
  type: 'root' | 'app-specific' | 'preset';
  config: TailwindConfig;
  basePath: string; // Для разрешения относительных путей
}
```

### Issue Models

```typescript
interface ContentPathIssue extends ConfigIssue {
  readonly type: 'dead_path' | 'empty_glob';
  readonly path: string;
  readonly resolvedPath?: string;
}

interface MissingFileIssue extends ConfigIssue {
  readonly type: 'missing_file';
  readonly filePath: string;
  readonly tailwindClasses: string[];
}

interface DuplicationIssue extends ConfigIssue {
  readonly type: 'redundant_path';
  readonly path: string;
  readonly configs: string[]; // Конфигурации где дублируется
}
```

## Error Handling

### Error Types

1. **Config Parse Errors**: Ошибки парсинга JavaScript/TypeScript конфигураций
2. **File System Errors**: Недоступные файлы или директории
3. **Glob Pattern Errors**: Некорректные glob паттерны
4. **Timeout Errors**: Превышение времени выполнения для широких паттернов

### Error Recovery Strategy

```typescript
class ErrorHandler {
  handleConfigParseError(configPath: string, error: Error): ConfigIssue {
    // Логирование ошибки
    // Создание issue с предложением исправления
    // Продолжение работы с другими конфигурациями
  }

  handleGlobTimeout(pattern: string): ConfigIssue {
    // Создание предупреждения о слишком широком паттерне
    // Предложение более специфичного паттерна
  }
}
```

## Testing Strategy

### Unit Tests

1. **ConfigDiscovery Tests**
   - Поиск конфигураций в различных структурах проекта
   - Парсинг различных форматов конфигураций
   - Обработка preset'ов

2. **ContentPathValidator Tests**
   - Валидация существующих и несуществующих путей
   - Тестирование различных glob паттернов
   - Обработка относительных и абсолютных путей

3. **MissingFileDetector Tests**
   - Обнаружение файлов с Tailwind классами
   - Проверка включения в content paths
   - Игнорирование node_modules

4. **Integration Tests**
   - Полный workflow сканирования
   - Интеграция с MainScanner
   - Генерация отчетов

### Test Data Structure

```
packages/style-scanner/src/__tests__/fixtures/
├── configs/
│   ├── valid-config.js
│   ├── invalid-config.js
│   ├── preset-config.js
│   └── empty-content-config.js
├── projects/
│   ├── monorepo-structure/
│   └── simple-structure/
└── components/
    ├── with-tailwind-classes.tsx
    └── without-tailwind-classes.tsx
```

### Performance Tests

1. **Large Project Simulation**: Тестирование на проектах с 1000+ файлов
2. **Glob Pattern Performance**: Измерение времени выполнения различных паттернов
3. **Memory Usage**: Контроль потребления памяти при сканировании

## Implementation Phases

### Phase 1: Core Infrastructure

- [ ] Создание базовых типов
- [ ] Реализация ConfigDiscovery
- [ ] Базовая интеграция с BaseScanner

### Phase 2: Validation Logic

- [ ] Реализация ContentPathValidator
- [ ] Реализация MissingFileDetector
- [ ] Обработка ошибок

### Phase 3: Integration

- [ ] Интеграция в MainScanner
- [ ] Обновление типов ProjectScanResult
- [ ] CLI интеграция

### Phase 4: Reporting

- [ ] Генерация Markdown отчетов
- [ ] Интеграция в существующую систему отчетов
- [ ] Настройка verbose/quiet режимов

### Phase 5: Testing & Documentation

- [ ] Comprehensive test suite
- [ ] Performance optimization
- [ ] Documentation updates
