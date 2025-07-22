/**
 * Style Extractor
 * Извлечение стилей из React компонентов
 */

import path from 'node:path';

import { CLASSNAME_PATTERNS } from '../constants/index.js';
import type {
  ComponentStyles,
  CSSModule,
  ScanError,
  DynamicClassPattern,
} from '../types/scanner.js';

import { readFileSafely, fileExists } from './file-utils.js';

/**
 * Извлечение всех стилей из компонента
 */
export async function extractStyles(
  filePath: string,
  componentContent: string
): Promise<{ styles: ComponentStyles; errors: ScanError[] }> {
  const errors: ScanError[] = [];

  try {
    const classAnalysis = analyzeClassNames(componentContent);
    const cssModules = await extractCSSModules(filePath, componentContent);

    return {
      styles: {
        tailwind: classAnalysis.static,
        cssModules,
        cssInJs: [], // Will be implemented in future versions
        dynamicClasses: classAnalysis.dynamic,
      },
      errors,
    };
  } catch (error) {
    errors.push({
      type: 'parse_error',
      message: `Failed to extract styles: ${error}`,
      filePath,
    });

    return {
      styles: { tailwind: [], cssModules: [], cssInJs: [], dynamicClasses: [] },
      errors,
    };
  }
}

/**
 * Извлечение стилей для конкретного локального компонента по имени
 */
export async function extractStylesForLocalComponent(
  content: string, // Принимаем содержимое файла, а не путь
  componentName: string
): Promise<{ styles: ComponentStyles; errors: ScanError[] }> {
  const errors: ScanError[] = [];

  try {
    // Извлекаем только код конкретного компонента
    const componentCode = extractComponentFunction(content, componentName);

    if (!componentCode) {
      // Если не найден, возвращаем пустые стили
      return {
        styles: { tailwind: [], cssModules: [], cssInJs: [], dynamicClasses: [] },
        errors: [
          {
            type: 'parse_error',
            message: `Component function '${componentName}' not found in file`,
            filePath: 'inline-content',
          },
        ],
      };
    }

    const classAnalysis = analyzeClassNames(componentCode);
    // CSS модули не применяются к локальным компонентам, только к файлу в целом
    const cssModules: CSSModule[] = [];

    return {
      styles: {
        tailwind: classAnalysis.static,
        cssModules,
        cssInJs: [],
        dynamicClasses: classAnalysis.dynamic,
      },
      errors,
    };
  } catch (error) {
    errors.push({
      type: 'parse_error',
      message: `Failed to extract styles for component ${componentName}: ${error}`,
      filePath: 'inline-content',
    });

    return {
      styles: { tailwind: [], cssModules: [], cssInJs: [], dynamicClasses: [] },
      errors,
    };
  }
}

/**
 * Извлечение кода конкретной функции компонента
 */
function extractComponentFunction(content: string, componentName: string): string | null {
  // Паттерн 1: Обычные function декларации
  const functionPattern = `function ${componentName}(`;
  let startPos = content.indexOf(functionPattern);

  if (startPos !== -1) {
    // Находим полную декларацию до первой {
    let i = startPos;
    let openParens = 0;
    let foundOpeningBrace = false;

    while (i < content.length) {
      const char = content[i];

      if (char === '(') {
        openParens++;
      } else if (char === ')') {
        openParens--;
      } else if (char === '{' && openParens === 0) {
        // Это начало тела функции
        foundOpeningBrace = true;
        break;
      }
      i++;
    }

    if (foundOpeningBrace) {
      // Извлекаем тело функции
      let openBraces = 1;
      i++; // пропускаем открывающую скобку
      const extractStart = i;

      let inString = false;
      let stringChar = '';

      while (i < content.length && openBraces > 0) {
        const char = content[i];

        if (inString) {
          if (char === stringChar && content[i - 1] !== '\\') {
            inString = false;
          }
        } else {
          if (char === '"' || char === "'" || char === '`') {
            inString = true;
            stringChar = char;
          } else if (char === '{') {
            openBraces++;
          } else if (char === '}') {
            openBraces--;
          }
        }
        i++;
      }

      if (openBraces === 0) {
        return content.substring(extractStart, i - 1);
      }
    }
  }

  // Паттерн 2: Arrow functions с типизацией (const ComponentName: React.FC = (props) => (
  const arrowPattern = new RegExp(
    `const\\s+${componentName}\\s*:[^=]*=\\s*\\([^)]*\\)\\s*=>\\s*\\(`,
    'g'
  );
  const arrowMatch = arrowPattern.exec(content);

  if (arrowMatch) {
    let i = arrowMatch.index + arrowMatch[0].length - 1;
    let openParens = 1;

    while (i < content.length && openParens > 0) {
      i++;
      if (content[i] === '(') {
        openParens++;
      } else if (content[i] === ')') {
        openParens--;
      }
    }

    if (openParens === 0) {
      const startIndex = arrowMatch.index + arrowMatch[0].length;
      return content.substring(startIndex, i);
    }
  }

  return null;
}

/**
 * Результат анализа классов с разделением на статические и динамические
 */
export interface ClassAnalysisResult {
  static: string[];
  dynamic: DynamicClassPattern[];
}

/**
 * Извлечение Tailwind классов из JSX с разделением на статические и динамические
 */
function extractTailwindClasses(content: string): string[] {
  const classes = new Set<string>();

  // Простые строки
  const simpleMatches = content.matchAll(CLASSNAME_PATTERNS.SIMPLE);
  for (const match of simpleMatches) {
    if (!match[1]) continue;

    const classNames = match[1].split(/\s+/).filter(Boolean);
    for (const className of classNames) {
      classes.add(className);
    }
  }

  return [...classes].sort();
}

/**
 * Анализ классов с разделением на статические и динамические
 */
export function analyzeClassNames(content: string): ClassAnalysisResult {
  const staticClasses = new Set<string>();
  const dynamicPatterns: DynamicClassPattern[] = [];

  // 1. Статические классы из простых строк
  const simpleMatches = content.matchAll(CLASSNAME_PATTERNS.SIMPLE);
  for (const match of simpleMatches) {
    if (!match[1]) continue;

    const classNames = match[1].split(/\s+/).filter(Boolean);
    for (const className of classNames) {
      staticClasses.add(className);
    }
  }

  // 2. Динамические паттерны
  dynamicPatterns.push(...detectDynamicClasses(content));

  return {
    static: [...staticClasses].sort(),
    dynamic: dynamicPatterns,
  };
}

/**
 * Детектор динамических классов
 */
export function detectDynamicClasses(content: string): DynamicClassPattern[] {
  const patterns: DynamicClassPattern[] = [];
  const lines = content.split('\n');

  // 1. cn() вызовы
  const cnMatches = content.matchAll(/cn\s*\(([^)]+)\)/g);
  for (const match of cnMatches) {
    if (!match[0] || !match[1]) continue;

    const lineNumber = getLineNumber(content, match.index || 0);
    patterns.push({
      pattern: extractStaticClassesFromCnCall(match[1]),
      type: 'cn',
      line: lineNumber,
      originalCode: match[0],
    });
  }

  // 2. clsx() вызовы
  const clsxMatches = content.matchAll(/clsx\s*\(([^)]+)\)/g);
  for (const match of clsxMatches) {
    if (!match[0] || !match[1]) continue;

    const lineNumber = getLineNumber(content, match.index || 0);
    patterns.push({
      pattern: extractStaticClassesFromCnCall(match[1]),
      type: 'clsx',
      line: lineNumber,
      originalCode: match[0],
    });
  }

  // 3. twMerge() вызовы
  const twMergeMatches = content.matchAll(/twMerge\s*\(([^)]+)\)/g);
  for (const match of twMergeMatches) {
    if (!match[0] || !match[1]) continue;

    const lineNumber = getLineNumber(content, match.index || 0);
    patterns.push({
      pattern: extractStaticClassesFromCnCall(match[1]),
      type: 'twMerge',
      line: lineNumber,
      originalCode: match[0],
    });
  }

  // 4. Template literals с переменными
  const templateMatches = content.matchAll(/className\s*=\s*`([^`]*\$\{[^}]+\}[^`]*)`/g);
  for (const match of templateMatches) {
    if (!match[0] || !match[1]) continue;

    const lineNumber = getLineNumber(content, match.index || 0);
    patterns.push({
      pattern: extractStaticClassesFromTemplate(match[1]),
      type: 'template',
      line: lineNumber,
      originalCode: match[0],
    });
  }

  // 5. Условные классы
  const conditionalMatches = content.matchAll(/className\s*=\s*\{([^}]*\?[^}]*:[^}]*)\}/g);
  for (const match of conditionalMatches) {
    if (!match[0] || !match[1]) continue;

    const lineNumber = getLineNumber(content, match.index || 0);
    patterns.push({
      pattern: extractStaticClassesFromConditional(match[1]),
      type: 'conditional',
      line: lineNumber,
      originalCode: match[0],
    });
  }

  return patterns;
}

/**
 * Извлечение статических классов из cn() вызова
 */
function extractStaticClassesFromCnCall(cnContent: string): string {
  // Извлекаем строки в кавычках
  const stringMatches = cnContent.matchAll(/['"`]([^'"`]+)['"`]/g);
  const classes: string[] = [];

  for (const match of stringMatches) {
    if (match[1]) {
      const classNames = match[1].split(/\s+/).filter(Boolean);
      classes.push(...classNames);
    }
  }

  return classes.join(' ');
}

/**
 * Извлечение статических классов из template literal
 */
function extractStaticClassesFromTemplate(templateContent: string): string {
  // Удаляем ${...} части и извлекаем статические строки
  const staticParts = templateContent.split(/\$\{[^}]+\}/).filter(Boolean);
  const classes: string[] = [];

  for (const part of staticParts) {
    const classNames = part.trim().split(/\s+/).filter(Boolean);
    classes.push(...classNames);
  }

  return classes.join(' ');
}

/**
 * Извлечение статических классов из условного выражения
 */
function extractStaticClassesFromConditional(conditionalContent: string): string {
  // Извлекаем строки в кавычках из обеих частей условия
  const stringMatches = conditionalContent.matchAll(/['"`]([^'"`]+)['"`]/g);
  const classes: string[] = [];

  for (const match of stringMatches) {
    if (match[1]) {
      const classNames = match[1].split(/\s+/).filter(Boolean);
      classes.push(...classNames);
    }
  }

  return classes.join(' ');
}

/**
 * Получение номера строки по индексу в тексте
 */
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

/**
 * Извлечение CSS модулей
 */
async function extractCSSModules(componentPath: string, content: string): Promise<CSSModule[]> {
  const modules: CSSModule[] = [];

  // Поиск импортов CSS модулей
  const moduleImports = content.matchAll(
    /import\s+\w+\s+from\s+['"]([^'"]+\.module\.(?:css|scss))['"]/g
  );

  for (const match of moduleImports) {
    if (!match[1]) continue;

    const modulePath = resolveModulePath(componentPath, match[1]);
    const module = await loadCSSModule(modulePath);

    if (module) {
      modules.push(module);
    }
  }

  return modules;
}

/**
 * Загрузка CSS модуля
 */
async function loadCSSModule(modulePath: string): Promise<CSSModule | null> {
  if (!(await fileExists(modulePath))) {
    return null;
  }

  try {
    const moduleContent = await readFileSafely(modulePath);
    return {
      filePath: modulePath,
      content: moduleContent,
    };
  } catch {
    return null;
  }
}

/**
 * Разрешение пути к CSS модулю
 */
function resolveModulePath(componentPath: string, importPath: string): string {
  const componentDir = path.dirname(componentPath);
  return path.resolve(componentDir, importPath);
}
