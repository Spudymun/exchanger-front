/**
 * Component Analyzers
 * Модуль для анализа компонентов и извлечения статистики
 */

import type { ComponentNode, PageScanResult } from '../types/scanner.js';
import { flattenComponents } from './markdown-utils.js';

/**
 * Получение топ компонентов по количеству стилей
 */
export function getTopComponentsByStyles(pages: readonly PageScanResult[]): Array<{
  name: string;
  filePath: string;
  styleCount: number;
}> {
  const allComponents: Array<{
    name: string;
    filePath: string;
    styleCount: number;
  }> = [];

  const collectComponents = (components: readonly ComponentNode[]): void => {
    for (const comp of components) {
      const styleCount =
        comp.styles.tailwind.length + comp.styles.cssModules.length + comp.styles.cssInJs.length;

      if (styleCount > 0) {
        allComponents.push({
          name: comp.name,
          filePath: comp.filePath,
          styleCount,
        });
      }

      collectComponents(comp.children);
    }
  };

  for (const page of pages) {
    collectComponents(page.components);
  }

  return allComponents.sort((a, b) => b.styleCount - a.styleCount).slice(0, 10);
}

/**
 * Получение сводки ошибок
 */
export function getErrorsSummary(pages: readonly PageScanResult[]): string {
  const allErrors = pages.flatMap(page => [
    ...page.errors,
    ...collectComponentErrors(page.components),
  ]);

  if (allErrors.length === 0) {
    return '✅ No errors found!';
  }

  const errorsByType = new Map<string, number>();
  for (const error of allErrors) {
    errorsByType.set(error.type, (errorsByType.get(error.type) || 0) + 1);
  }

  return Array.from(errorsByType.entries())
    .map(([type, count]) => `- **${type}**: ${count}`)
    .join('\n');
}

/**
 * Сбор ошибок из компонентов
 */
export function collectComponentErrors(
  components: readonly ComponentNode[]
): Array<{ type: string; message: string; filePath: string }> {
  const errors: Array<{ type: string; message: string; filePath: string }> = [];

  const collectErrors = (comps: readonly ComponentNode[]): void => {
    for (const comp of comps) {
      errors.push(...comp.errors);
      collectErrors(comp.children);
    }
  };

  collectErrors(components);
  return errors;
}

/**
 * Получение всех Tailwind классов из дерева
 */
export function getAllTailwindFromTree(components: ComponentNode[]): string[] {
  const allClasses = new Set<string>();

  for (const comp of components) {
    comp.styles.tailwind.forEach(cls => allClasses.add(cls));
  }

  return Array.from(allClasses).sort();
}

/**
 * Получение всех CSS модулей из дерева
 */
export function getAllCSSModulesFromTree(components: ComponentNode[]): Array<{ filePath: string }> {
  const allModules = new Map<string, { filePath: string }>();

  for (const comp of components) {
    comp.styles.cssModules.forEach(mod => {
      allModules.set(mod.filePath, mod);
    });
  }

  return Array.from(allModules.values());
}

/**
 * Получение всех CSS-in-JS стилей из дерева
 */
export function getAllCSSInJSFromTree(components: ComponentNode[]): string[] {
  const allStyles = new Set<string>();

  for (const comp of components) {
    comp.styles.cssInJs.forEach(style => allStyles.add(style));
  }

  return Array.from(allStyles).sort();
}

/**
 * Рендер дерева вложенных компонентов
 */
export function renderNestedComponentsTree(
  components: readonly ComponentNode[],
  depth: number
): string {
  if (components.length === 0) return '';

  return components
    .map(comp => {
      const indent = '  '.repeat(depth);
      const tailwindCount = comp.styles.tailwind.length;
      const cssModulesCount = comp.styles.cssModules.length;
      const cssInJsCount = comp.styles.cssInJs.length;
      const totalStyles = tailwindCount + cssModulesCount + cssInJsCount;

      let result = `${indent}- **${comp.name}** (${totalStyles} styles) - \`${comp.filePath}\``;

      if (comp.children.length > 0) {
        result += '\n' + renderNestedComponentsTree(comp.children, depth + 1);
      }

      return result;
    })
    .join('\n');
}
