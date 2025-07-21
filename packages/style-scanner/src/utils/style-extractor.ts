/**
 * Style Extractor
 * Извлечение стилей из React компонентов
 */

import path from 'node:path';

import { CLASSNAME_PATTERNS } from '../constants/index.js';
import type { ComponentStyles, CSSModule, ScanError } from '../types/scanner.js';

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
    const tailwindClasses = extractTailwindClasses(componentContent);
    const cssModules = await extractCSSModules(filePath, componentContent);

    return {
      styles: {
        tailwind: tailwindClasses,
        cssModules,
        cssInJs: [], // Will be implemented in future versions
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
      styles: { tailwind: [], cssModules: [], cssInJs: [] },
      errors,
    };
  }
}

/**
 * Извлечение Tailwind классов из JSX
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
