/**
 * Markdown Generator
 * Генерация Markdown документации из результатов сканирования
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { rm } from 'node:fs/promises';

import type { ProjectScanResult, PageScanResult, ComponentNode } from '../types/scanner.js';

/**
 * Конфигурация генератора Markdown
 */
export interface MarkdownConfig {
  readonly outputDir: string;
  readonly verbose: boolean;
}

/**
 * Генератор Markdown документации
 */
export class MarkdownGenerator {
  private readonly config: MarkdownConfig;

  constructor(config: MarkdownConfig) {
    this.config = config;
  }

  /**
   * Очистка выходной директории
   */
  private async cleanOutputDirectory(): Promise<void> {
    try {
      await rm(this.config.outputDir, { recursive: true, force: true });
      if (this.config.verbose) {
        console.log(`🗑️  Cleaned output directory: ${this.config.outputDir}`);
      }
    } catch (error) {
      // Директория может не существовать - это нормально
      if (this.config.verbose) {
        console.log(`📁 Output directory will be created: ${this.config.outputDir}`);
      }
    }
  }

  /**
   * Генерация всей документации для проекта
   */
  async generateDocumentation(projectResult: ProjectScanResult): Promise<void> {
    if (this.config.verbose) {
      console.log('📝 Generating Markdown documentation...');
    }

    // СНАЧАЛА ОЧИЩАЕМ ДИРЕКТОРИЮ
    await this.cleanOutputDirectory();

    // Создаем директории
    await this.ensureDirectories(projectResult);

    // Генерируем общий summary файл
    await this.generateSummary(projectResult);

    // Генерируем документацию для каждой страницы по новой структуре
    await this.generateProjectStructuredDocs(projectResult);

    if (this.config.verbose) {
      console.log(`✅ Documentation generated in: ${this.config.outputDir}`);
    }
  }

  /**
   * Создание необходимых директорий
   */
  private async ensureDirectories(projectResult: ProjectScanResult): Promise<void> {
    await mkdir(this.config.outputDir, { recursive: true });

    // Создаем директории для каждого проекта и страницы
    for (const pageResult of projectResult.pages) {
      const { projectName, pageName } = this.extractProjectAndPageNames(pageResult.pagePath);
      const projectDir = join(this.config.outputDir, projectName);
      const pageDir = join(projectDir, pageName);

      await mkdir(projectDir, { recursive: true });
      await mkdir(pageDir, { recursive: true });
    }
  }

  /**
   * Генерация сводного файла
   */
  private async generateSummary(projectResult: ProjectScanResult): Promise<void> {
    const content = this.createSummaryMarkdown(projectResult);
    const filePath = join(this.config.outputDir, 'summary.md');

    await writeFile(filePath, content, 'utf-8');

    if (this.config.verbose) {
      console.log(`  📄 Created: ${filePath}`);
    }
  }

  /**
   * Генерация документации для страницы
   */
  private async generatePageDocumentation(pageResult: PageScanResult): Promise<void> {
    const content = this.createPageMarkdown(pageResult);
    const fileName = this.createPageFileName(pageResult.pagePath);
    const filePath = join(this.config.outputDir, 'pages', fileName);

    await writeFile(filePath, content, 'utf-8');

    if (this.config.verbose) {
      console.log(`  📄 Created: ${filePath}`);
    }
  }

  /**
   * Генерация структурированной документации по проектам
   */
  private async generateProjectStructuredDocs(projectResult: ProjectScanResult): Promise<void> {
    for (const pageResult of projectResult.pages) {
      const { projectName, pageName } = this.extractProjectAndPageNames(pageResult.pagePath);

      // Генерируем общий файл страницы
      await this.generatePageOverview(pageResult, projectName, pageName);

      // Генерируем файлы для ИМПОРТИРОВАННЫХ компонентов-секций
      await this.generateSectionFiles(pageResult, projectName, pageName);
    }
  }

  /**
   * Генерация файлов для секций (импортированных компонентов)
   */
  private async generateSectionFiles(
    pageResult: PageScanResult,
    projectName: string,
    pageName: string
  ): Promise<void> {
    // Получаем компоненты из импортов (это и есть секции)
    const sectionComponents = this.getSectionComponentsFromImports(pageResult);

    for (const sectionComponent of sectionComponents) {
      const content = this.createSectionMarkdown(sectionComponent, pageResult.pagePath);
      const fileName = this.sanitizeFileName(sectionComponent.name) + '.md';
      const filePath = join(this.config.outputDir, projectName, pageName, fileName);

      await writeFile(filePath, content, 'utf-8');

      if (this.config.verbose) {
        console.log(`  📄 Created: ${filePath}`);
      }
    }
  }

  /**
   * Получение компонентов-секций из импортов
   */
  private getSectionComponentsFromImports(pageResult: PageScanResult): ComponentNode[] {
    // Ищем все компоненты, которые импортированы на странице
    const allComponents = this.flattenComponents(pageResult.components);
    const mainPageComponent = pageResult.components.find(comp => comp.depth === 0);

    if (!mainPageComponent) return [];

    // Получаем имена импортированных компонентов
    const importedNames = mainPageComponent.imports.map(imp =>
      imp.name.replace(/[{}]/g, '').trim()
    );

    // Находим компоненты, которые соответствуют импортам
    return allComponents.filter(comp => importedNames.includes(comp.name) && comp.depth > 0);
  }

  /**
   * Извлечение имени проекта и страницы из пути
   */
  private extractProjectAndPageNames(pagePath: string): { projectName: string; pageName: string } {
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
   * Генерация обзорного файла страницы
   */
  private async generatePageOverview(
    pageResult: PageScanResult,
    projectName: string,
    pageName: string
  ): Promise<void> {
    const content = this.createPageOverviewMarkdown(pageResult, projectName, pageName);
    const filePath = join(this.config.outputDir, projectName, pageName, 'overview.md');

    await writeFile(filePath, content, 'utf-8');

    if (this.config.verbose) {
      console.log(`  📄 Created: ${filePath}`);
    }
  }

  /**
   * Генерация файлов для компонентов/секций
   */
  private async generateComponentSections(
    pageResult: PageScanResult,
    projectName: string,
    pageName: string
  ): Promise<void> {
    // ТОЛЬКО TOP-LEVEL компоненты (depth === 0)
    const topLevelComponents = pageResult.components.filter(comp => comp.depth === 0);

    for (const component of topLevelComponents) {
      const content = this.createComponentSectionMarkdown(component, pageResult.pagePath);
      const fileName = this.sanitizeFileName(component.name) + '.md';
      const filePath = join(this.config.outputDir, projectName, pageName, fileName);

      await writeFile(filePath, content, 'utf-8');

      if (this.config.verbose) {
        console.log(`  📄 Created: ${filePath}`);
      }
    }
  }

  /**
   * Удаление дублирующихся компонентов по имени и filePath
   */
  private deduplicateComponents(components: ComponentNode[]): ComponentNode[] {
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
   * Рекурсивное получение всех компонентов
   */
  private flattenComponents(components: readonly ComponentNode[]): ComponentNode[] {
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
   * Создание Markdown контента для сводки
   */
  private createSummaryMarkdown(projectResult: ProjectScanResult): string {
    const { summary, pages } = projectResult;

    return `# Style Scanner - Project Summary

Generated: ${new Date().toISOString()}

## 📊 Overview

- **Total Pages Scanned**: ${summary.totalPages}
- **Total Components Found**: ${summary.totalComponents}
- **Total Errors**: ${summary.totalErrors}
- **Scan Duration**: ${summary.scanDuration}ms

## 📄 Pages Analysis

${pages
  .map(page => {
    const { projectName, pageName } = this.extractProjectAndPageNames(page.pagePath);
    return `
### ${this.formatPagePath(page.pagePath)}

- **Components**: ${page.components.length}
- **Errors**: ${page.errors.length}
- **Project**: [\`${projectName}\`](./${projectName}/${pageName}/overview.md)
- **Sections**: ${
      page.components
        .filter(c => c.depth === 0)
        .map(
          comp =>
            `[\`${comp.name}\`](./${projectName}/${pageName}/${this.sanitizeFileName(comp.name)}.md)`
        )
        .join(', ') || '_No sections_'
    }
`;
  })
  .join('\n')}

## 🎨 Top Components by Styles

${this.getTopComponentsByStyles(pages)
  .map(
    comp => `
- **${comp.name}** (${comp.styleCount} styles) - \`${comp.filePath}\`
`
  )
  .join('\n')}

## ⚠️ Errors Summary

${this.getErrorsSummary(pages)}

---

*Generated by @repo/style-scanner*
`;
  }

  /**
   * Создание Markdown контента для страницы
   */
  private createPageMarkdown(pageResult: PageScanResult): string {
    const { pagePath, components, errors } = pageResult;

    return `# Style Analysis: ${pagePath}

Generated: ${new Date().toISOString()}

## Components (${components.length} found)

${components.map(component => this.formatComponent(component)).join('\n\n')}

${
  errors.length > 0
    ? `
## ⚠️ Errors (${errors.length} found)

${errors
  .map(
    error => `
### ${error.type}

- **File**: \`${error.filePath}\`
- **Message**: ${error.message}
`
  )
  .join('\n')}
`
    : ''
}

---

*Generated by @repo/style-scanner*
`;
  }

  /**
   * Форматирование компонента для Markdown
   */
  private formatComponent(component: ComponentNode, level: number = 3): string {
    const prefix = '#'.repeat(level);
    const tailwindClasses = component.styles.tailwind;
    const cssModules = component.styles.cssModules;

    let content = `${prefix} ${component.name}

- **File**: \`${component.filePath}\`
- **Depth**: ${component.depth}
- **Imports**: ${component.imports.length}
- **Children**: ${component.children.length}`;

    if (tailwindClasses.length > 0) {
      content += `
- **Tailwind Classes**: ${tailwindClasses.map(cls => `\`${cls}\``).join(', ')}`;
    }

    if (cssModules.length > 0) {
      content += `
- **CSS Modules**: ${cssModules.map(mod => `\`${mod.filePath}\``).join(', ')}`;
    }

    if (component.imports.length > 0) {
      content += `
- **Imports**: ${component.imports.map(imp => `\`${imp.name}\``).join(', ')}`;
    }

    if (component.errors.length > 0) {
      content += `
- **⚠️ Errors**: ${component.errors.length}`;
    }

    // Рекурсивно добавляем дочерние компоненты
    if (component.children.length > 0 && level < 6) {
      content +=
        '\n\n' +
        component.children.map(child => this.formatComponent(child, level + 1)).join('\n\n');
    }

    return content;
  }

  /**
   * Создание имени файла для страницы
   */
  private createPageFileName(pagePath: string): string {
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
  private formatPagePath(pagePath: string): string {
    return pagePath.replace(/\\/g, '/');
  }

  /**
   * Получение топ компонентов по количеству стилей
   */
  private getTopComponentsByStyles(pages: readonly PageScanResult[]): Array<{
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
  private getErrorsSummary(pages: readonly PageScanResult[]): string {
    const allErrors = pages.flatMap(page => [
      ...page.errors,
      ...this.collectComponentErrors(page.components),
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
  private collectComponentErrors(
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
   * Создание Markdown контента для обзора страницы
   */
  private createPageOverviewMarkdown(
    pageResult: PageScanResult,
    projectName: string,
    pageName: string
  ): string {
    const { pagePath, components, errors } = pageResult;

    return `# ${projectName} - ${pageName}

**File**: \`${pagePath}\`  
**Generated**: ${new Date().toISOString()}

## 📊 Overview

- **Total Components**: ${components.length}
- **Top-level Components**: ${components.filter(c => c.depth === 0).length}
- **Errors**: ${errors.length}

## 🧩 Top-level Components

${components
  .filter(c => c.depth === 0)
  .map(comp => {
    const styleCount =
      comp.styles.tailwind.length + comp.styles.cssModules.length + comp.styles.cssInJs.length;
    return `- **[${comp.name}](./${this.sanitizeFileName(comp.name)}.md)** (${styleCount} styles) - \`${comp.filePath}\``;
  })
  .join('\n')}

## 🧩 All Components

${this.flattenComponents(components)
  .map(comp => {
    const styleCount =
      comp.styles.tailwind.length + comp.styles.cssModules.length + comp.styles.cssInJs.length;
    const indent = '  '.repeat(comp.depth);
    return `${indent}- **[${comp.name}](./${this.sanitizeFileName(comp.name)}.md)** (${styleCount} styles) - depth: ${comp.depth}`;
  })
  .join('\n')}

${
  errors.length > 0
    ? `
## ⚠️ Errors (${errors.length} found)

${errors
  .map(
    error => `
### ${error.type}

- **File**: \`${error.filePath}\`
- **Message**: ${error.message}
`
  )
  .join('\n')}
`
    : ''
}

---

*Generated by @repo/style-scanner*
`;
  }

  /**
   * Создание Markdown контента для секции компонента
   */
  private createComponentSectionMarkdown(component: ComponentNode, pagePath: string): string {
    const tailwindClasses = component.styles.tailwind;
    const cssModules = component.styles.cssModules;
    const cssInJs = component.styles.cssInJs;

    // Получаем ВСЕ вложенные компоненты
    const allNestedComponents = this.flattenComponents([component]);
    const nestedOnly = allNestedComponents.filter(comp => comp !== component); // Исключаем сам компонент

    return `# ${component.name}

**File**: \`${component.filePath}\`  
**Page**: \`${pagePath}\`  
**Generated**: ${new Date().toISOString()}

## 📋 Component Info

- **Depth**: ${component.depth}
- **Direct Children**: ${component.children.length}
- **Total Nested Components**: ${nestedOnly.length}
- **Imports**: ${component.imports.length}
- **Exports**: ${component.exports.length}

## 🎨 Own Styles

### Tailwind Classes (${tailwindClasses.length})
${
  tailwindClasses.length > 0
    ? `\`\`\`css\n${tailwindClasses.join('\n')}\n\`\`\``
    : '_No Tailwind classes found_'
}

### CSS Modules (${cssModules.length})
${
  cssModules.length > 0
    ? cssModules
        .map(
          mod => `
**File**: \`${mod.filePath}\`
\`\`\`css
${mod.content || 'Content not available'}
\`\`\`
`
        )
        .join('\n')
    : '_No CSS modules found_'
}

### CSS-in-JS (${cssInJs.length})
${
  cssInJs.length > 0
    ? `\`\`\`javascript\n${cssInJs.join('\n')}\n\`\`\``
    : '_No CSS-in-JS styles found_'
}

## 📦 Imports (${component.imports.length})
${
  component.imports.length > 0
    ? component.imports
        .map(imp => `- **${imp.name}** (\`${imp.type}\`) from \`${imp.source}\``)
        .join('\n')
    : '_No imports found_'
}

## 📤 Exports (${component.exports.length})
${
  component.exports.length > 0
    ? component.exports.map(exp => `- **${exp.name}** (\`${exp.type}\`)`).join('\n')
    : '_No exports found_'
}

## 🧩 All Nested Components (${nestedOnly.length})

${nestedOnly.length > 0 ? this.renderNestedComponentsTree(component.children, 0) : '_No nested components_'}

## 🎨 Complete Styles Summary

### All Tailwind Classes Used
${
  this.getAllTailwindFromTree(allNestedComponents).length > 0
    ? `\`\`\`css\n${this.getAllTailwindFromTree(allNestedComponents).join('\n')}\n\`\`\``
    : '_No Tailwind classes in component tree_'
}

### All CSS Modules Used
${
  this.getAllCSSModulesFromTree(allNestedComponents).length > 0
    ? this.getAllCSSModulesFromTree(allNestedComponents)
        .map(mod => `- \`${mod.filePath}\``)
        .join('\n')
    : '_No CSS modules in component tree_'
}

${
  component.errors.length > 0
    ? `
## ⚠️ Errors (${component.errors.length} found)

${component.errors
  .map(
    error => `
### ${error.type}

- **Message**: ${error.message}
`
  )
  .join('\n')}
`
    : ''
}

---

*Generated by @repo/style-scanner*
`;
  }

  /**
   * Создание Markdown контента для СЕКЦИИ (импортированного компонента)
   */
  private createSectionMarkdown(sectionComponent: ComponentNode, pagePath: string): string {
    // Получаем ВСЕ вложенные компоненты этой секции
    const allNestedComponents = this.flattenComponents([sectionComponent]);
    const nestedOnly = allNestedComponents.filter(comp => comp !== sectionComponent);

    const tailwindClasses = sectionComponent.styles.tailwind;
    const cssModules = sectionComponent.styles.cssModules;
    const cssInJs = sectionComponent.styles.cssInJs;

    return `# ${sectionComponent.name}

**File**: \`${sectionComponent.filePath}\`  
**Page**: \`${pagePath}\`  
**Generated**: ${new Date().toISOString()}

## 📋 Section Info

- **Section Type**: Imported Component
- **Direct Children**: ${sectionComponent.children.length}
- **Total Nested Components**: ${nestedOnly.length}
- **Imports**: ${sectionComponent.imports.length}
- **Exports**: ${sectionComponent.exports.length}

## 🎨 Section Own Styles

### Tailwind Classes (${tailwindClasses.length})
${
  tailwindClasses.length > 0
    ? `\`\`\`css\n${tailwindClasses.join('\n')}\n\`\`\``
    : '_No Tailwind classes found_'
}

### CSS Modules (${cssModules.length})
${
  cssModules.length > 0
    ? cssModules
        .map(
          mod => `
**File**: \`${mod.filePath}\`
\`\`\`css
${mod.content || 'Content not available'}
\`\`\`
`
        )
        .join('\n')
    : '_No CSS modules found_'
}

### CSS-in-JS (${cssInJs.length})
${
  cssInJs.length > 0
    ? `\`\`\`javascript\n${cssInJs.join('\n')}\n\`\`\``
    : '_No CSS-in-JS styles found_'
}

## 📦 Section Imports (${sectionComponent.imports.length})
${
  sectionComponent.imports.length > 0
    ? sectionComponent.imports
        .map(imp => `- **${imp.name}** (\`${imp.type}\`) from \`${imp.source}\``)
        .join('\n')
    : '_No imports found_'
}

## 📤 Section Exports (${sectionComponent.exports.length})
${
  sectionComponent.exports.length > 0
    ? sectionComponent.exports.map(exp => `- **${exp.name}** (\`${exp.type}\`)`).join('\n')
    : '_No exports found_'
}

## 🧩 All Nested Components in Section (${nestedOnly.length})

${nestedOnly.length > 0 ? this.renderNestedComponentsTree(sectionComponent.children, 0) : '_No nested components in this section_'}

## 🎨 Complete Section Styles Summary

### All Tailwind Classes in Section
${
  this.getAllTailwindFromTree(allNestedComponents).length > 0
    ? `\`\`\`css\n${this.getAllTailwindFromTree(allNestedComponents).join('\n')}\n\`\`\``
    : '_No Tailwind classes in section tree_'
}

### All CSS Modules in Section
${
  this.getAllCSSModulesFromTree(allNestedComponents).length > 0
    ? this.getAllCSSModulesFromTree(allNestedComponents)
        .map(mod => `- \`${mod.filePath}\``)
        .join('\n')
    : '_No CSS modules in section tree_'
}

### All CSS-in-JS in Section
${
  this.getAllCSSInJSFromTree(allNestedComponents).length > 0
    ? `\`\`\`javascript\n${this.getAllCSSInJSFromTree(allNestedComponents).join('\n')}\n\`\`\``
    : '_No CSS-in-JS in section tree_'
}

${
  sectionComponent.errors.length > 0
    ? `
## ⚠️ Section Errors (${sectionComponent.errors.length} found)

${sectionComponent.errors
  .map(
    error => `
### ${error.type}

- **Message**: ${error.message}
`
  )
  .join('\n')}
`
    : ''
}

---

*Generated by @repo/style-scanner*
`;
  }

  /**
   * Рендер дерева вложенных компонентов
   */
  private renderNestedComponentsTree(components: readonly ComponentNode[], depth: number): string {
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
          result += '\n' + this.renderNestedComponentsTree(comp.children, depth + 1);
        }

        return result;
      })
      .join('\n');
  }

  /**
   * Получение всех Tailwind классов из дерева
   */
  private getAllTailwindFromTree(components: ComponentNode[]): string[] {
    const allClasses = new Set<string>();

    for (const comp of components) {
      comp.styles.tailwind.forEach(cls => allClasses.add(cls));
    }

    return Array.from(allClasses).sort();
  }

  /**
   * Получение всех CSS модулей из дерева
   */
  private getAllCSSModulesFromTree(components: ComponentNode[]): Array<{ filePath: string }> {
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
  private getAllCSSInJSFromTree(components: ComponentNode[]): string[] {
    const allStyles = new Set<string>();

    for (const comp of components) {
      comp.styles.cssInJs.forEach(style => allStyles.add(style));
    }

    return Array.from(allStyles).sort();
  }

  /**
   * Санитизация имени файла
   */
  private sanitizeFileName(name: string): string {
    return (
      name
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'component'
    );
  }
}

/**
 * Утилитарная функция для генерации документации
 */
export async function generateMarkdownDocs(
  projectResult: ProjectScanResult,
  config: MarkdownConfig
): Promise<void> {
  const generator = new MarkdownGenerator(config);
  await generator.generateDocumentation(projectResult);
}
