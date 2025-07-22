/**
 * Component Parser
 * Упрощенный парсинг React компонентов через регулярные выражения
 */

import type { ScanError } from '../types/scanner.js';

/**
 * Результат парсинга компонента
 */
export interface ParsedComponent {
  name?: string;
  imports: string[];
  exports: string[];
  localComponents: string[]; // НОВОЕ: локальные компоненты в файле
  errors: ScanError[];
}

/**
 * Извлечение компонентов из React файла
 */
export function parseComponent(content: string): ParsedComponent {
  try {
    if (!content || typeof content !== 'string') {
      return {
        imports: [],
        exports: [],
        localComponents: [], // НОВОЕ
        errors: [
          {
            type: 'parse_error',
            message: 'Empty or invalid content',
            filePath: 'unknown',
          },
        ],
      };
    }

    const imports = extractImports(content);
    const exports = extractExports(content);
    const name = extractComponentName(content);
    const localComponents = extractAllComponents(content); // НОВОЕ: все компоненты

    return {
      name,
      imports,
      exports,
      localComponents,
      errors: [],
    };
  } catch (error) {
    return {
      imports: [],
      exports: [],
      localComponents: [], // НОВОЕ
      errors: [
        {
          type: 'parse_error',
          message: `Parse error: ${error}`,
          filePath: 'unknown',
        },
      ],
    };
  }
}

/**
 * Извлечение относительных импортов
 */
function extractImports(content: string): string[] {
  // Ищем ВСЕ относительные импорты - начинающиеся с . или ../
  const importRegex = /import\s+.*?from\s+['"](\.[^'"]*)['"]/g;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[0]); // Весь импорт
  }

  return imports;
}

/**
 * Извлечение экспортов
 */
function extractExports(content: string): string[] {
  const exports: string[] = [];

  // Дефолтный экспорт
  const defaultExportRegex = /export\s+default\s+(\w+)/g;
  let match;

  while ((match = defaultExportRegex.exec(content)) !== null) {
    if (match[1]) {
      exports.push(match[1]);
    }
  }

  // Именованные экспорты
  const namedExportRegex = /export\s+(?:const|function|class)\s+(\w+)/g;

  while ((match = namedExportRegex.exec(content)) !== null) {
    if (match[1]) {
      exports.push(match[1]);
    }
  }

  return exports;
}

/**
 * Извлечение ВСЕХ компонентов из файла
 */
function extractAllComponents(content: string): string[] {
  const components: Set<string> = new Set();

  // 1. Функциональные компоненты: function ComponentName(
  const functionRegex = /function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g;
  let match;

  while ((match = functionRegex.exec(content)) !== null) {
    if (match[1]) {
      components.add(match[1]);
    }
  }

  // 2. Arrow function компоненты: const ComponentName = (
  const arrowRegex = /const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*\(/g;

  while ((match = arrowRegex.exec(content)) !== null) {
    if (match[1]) {
      components.add(match[1]);
    }
  }

  // 2.1. ForwardRef компоненты: const ComponentName = React.forwardRef
  const forwardRefRegex = /const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*React\.forwardRef/g;

  while ((match = forwardRefRegex.exec(content)) !== null) {
    if (match[1]) {
      components.add(match[1]);
    }
  }

  // 3. Export function компоненты: export function ComponentName(
  const exportFunctionRegex = /export\s+function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g;

  while ((match = exportFunctionRegex.exec(content)) !== null) {
    if (match[1]) {
      components.add(match[1]);
    }
  }

  // 4. НОВОЕ: Arrow function с React.FC типизацией: const ComponentName: React.FC =
  const typedArrowRegex = /const\s+([A-Z][a-zA-Z0-9]*)\s*:\s*React\.FC[^=]*=\s*\(/g;

  while ((match = typedArrowRegex.exec(content)) !== null) {
    if (match[1]) {
      components.add(match[1]);
    }
  }

  // 5. НОВОЕ: Arrow function с типизированными пропсами: const ComponentName: React.FC<Props> =
  const typedPropsArrowRegex = /const\s+([A-Z][a-zA-Z0-9]*)\s*:\s*React\.FC<[^>]+>\s*=\s*\(/g;

  while ((match = typedPropsArrowRegex.exec(content)) !== null) {
    if (match[1]) {
      components.add(match[1]);
    }
  }

  // 6. НОВОЕ: Более гибкий паттерн для любых типизированных компонентов
  const flexibleTypedRegex = /const\s+([A-Z][a-zA-Z0-9]*)\s*:\s*[^=]+?=\s*\(/g;

  while ((match = flexibleTypedRegex.exec(content)) !== null) {
    if (match[1]) {
      components.add(match[1]);
    }
  }

  return Array.from(components);
}

/**
 * Извлечение имени компонента
 */
function extractComponentName(content: string): string | undefined {
  // Ищем функциональные компоненты
  const functionComponentRegex = /function\s+(\w+)\s*\(/;
  const match = functionComponentRegex.exec(content);

  if (match && match[1]) {
    return match[1];
  }

  // Ищем arrow functions
  const arrowComponentRegex = /const\s+(\w+)\s*=\s*\(/;
  const arrowMatch = arrowComponentRegex.exec(content);

  if (arrowMatch && arrowMatch[1]) {
    return arrowMatch[1];
  }

  return undefined;
}
