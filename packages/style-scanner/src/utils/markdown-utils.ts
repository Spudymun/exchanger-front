/**
 * Markdown Generator Utilities
 * Утилитарные функции для работы с Markdown генератором
 */

import type { ComponentNode, PageScanResult } from '../types/scanner.js';

/**
 * Извлечение имени проекта и страницы из пути
 */
export function extractProjectAndPageNames(pagePath: string): {
  projectName: string;
  pageName: string;
} {
  // Парсим путь типа "apps/admin-panel/app/page.tsx" или "apps/web/app/[locale]/page.tsx"
  const normalizedPath = pagePath.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/');

  let projectName = 'unknown';
  let pageName = 'page';

  // Ищем паттерн apps/PROJECT_NAME/...
  const appsIndex = pathParts.findIndex(part => part === 'apps');
  if (appsIndex !== -1 && pathParts[appsIndex + 1]) {
    projectName = pathParts[appsIndex + 1] || 'unknown';
  }

  // Определяем имя страницы на основе структуры пути
  const appIndex = pathParts.findIndex(part => part === 'app');
  if (appIndex !== -1) {
    const pageStructure = pathParts.slice(appIndex + 1, -1); // Исключаем 'app' и 'page.tsx'

    if (pageStructure.length === 0) {
      pageName = 'home-page';
    } else if (pageStructure.includes('[locale]')) {
      // Убираем [locale] и создаем имя из оставшихся частей
      const filteredParts = pageStructure.filter(part => !part.startsWith('['));
      pageName = filteredParts.length > 0 ? filteredParts.join('-') + '-page' : 'home-page';
    } else {
      pageName = pageStructure.join('-') + '-page';
    }
  }

  return { projectName, pageName };
}

/**
 * Создание имени файла для страницы
 */
export function createPageFileName(pagePath: string): string {
  return (
    pagePath
      .replace(/[\\\/]/g, '-')
      .replace(/[\[\]]/g, '')
      .replace(/\.(tsx|jsx)$/, '')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() + '.md'
  );
}

/**
 * Форматирование пути страницы
 */
export function formatPagePath(pagePath: string): string {
  return pagePath.replace(/\\/g, '/');
}

/**
 * Санитизация имени файла
 */
export function sanitizeFileName(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'component'
  );
}

/**
 * Рекурсивное получение всех компонентов
 */
export function flattenComponents(components: readonly ComponentNode[]): ComponentNode[] {
  const result: ComponentNode[] = [];

  const flatten = (comps: readonly ComponentNode[]): void => {
    for (const comp of comps) {
      result.push(comp);
      flatten(comp.children);
    }
  };

  flatten(components);
  return result;
}

/**
 * Удаление дублирующихся компонентов по имени и filePath
 */
export function deduplicateComponents(components: ComponentNode[]): ComponentNode[] {
  const seen = new Set<string>();
  return components.filter(comp => {
    const key = `${comp.name}-${comp.filePath}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Получение компонентов-секций из импортов
 */
export function getSectionComponentsFromImports(pageResult: PageScanResult): ComponentNode[] {
  // Ищем все компоненты, которые импортированы на странице
  const allComponents = flattenComponents(pageResult.components);
  const mainPageComponent = pageResult.components.find(comp => comp.depth === 0);

  if (!mainPageComponent) return [];

  // Получаем имена импортированных компонентов
  const importedNames = mainPageComponent.imports.map(imp => imp.name.replace(/[{}]/g, '').trim());

  // Находим компоненты, которые соответствуют импортам
  return allComponents.filter(comp => importedNames.includes(comp.name) && comp.depth > 0);
}
