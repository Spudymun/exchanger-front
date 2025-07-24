/**
 * Markdown Formatting Service
 * Сервис для форматирования и утилитарных функций Markdown
 */

import { ComponentNode, ImportInfo } from '../types/scanner.js';
import { UI_HEURISTICS } from '../constants/index.js';

/**
 * Сервис форматирования Markdown
 */
export class MarkdownFormattingService {
  constructor(private readonly verbose: boolean) {}

  /**
   * Рендер дерева компонентов в текстовом формате
   */
  renderComponentTreeText(components: ComponentNode[]): string {
    if (components.length === 0) return '';

    const lines: string[] = [];

    const renderNode = (node: ComponentNode, depth: number = 0): void => {
      const indent = '  '.repeat(depth);
      const icon = this.getComponentIcon(depth);
      lines.push(`${indent}- ${icon} ${node.exports[0]?.name || node.name || 'Unknown'}`);

      // Рекурсивно обходим дочерние компоненты
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          renderNode(child, depth + 1);
        });
      }
    };

    // Найдем корневой компонент (с минимальной глубиной)
    const minDepth = Math.min(...components.map(comp => comp.depth));
    const rootComponents = components.filter(comp => comp.depth === minDepth);

    rootComponents.forEach(root => {
      renderNode(root, 0);
    });

    return lines.join('\n');
  }

  /**
   * Рендер источников стилей для компонента
   */
  renderStyleSources(comp: ComponentNode): string {
    const sources: string[] = [];
    const totalClasses = comp.styles.tailwind.length;

    // ИСПРАВЛЕНИЕ: Если у компонента нет импортов, но много классов -
    // используем эвристику основанную на файле и имени компонента
    let uiImports: ImportInfo[] = [];

    if (comp.imports && comp.imports.length > 0) {
      // Обычный случай: компонент имеет импорты
      uiImports = comp.imports.filter(imp => this.isUIComponent(imp.name));
    } else {
      // Эвристика: если у компонента много классов и его имя предполагает использование UI компонентов
      if (
        totalClasses > UI_HEURISTICS.UI_DETECTION_THRESHOLDS.COMPLEX_UI_COMPONENT &&
        this.likelyUsesUIComponents(comp)
      ) {
        // Создаем mock импорты для известных UI компонентов
        uiImports = this.inferUIImports(comp);
      }
    }

    // Логика определения источников стилей
    if (
      uiImports.length > 0 &&
      totalClasses > UI_HEURISTICS.UI_DETECTION_THRESHOLDS.MODERATE_UI_COMPONENT
    ) {
      // Если есть UI импорты в файле И много классов, то это скорее всего наследование от UI
      const buttonImport = uiImports.find(imp => imp.name === 'Button');

      if (
        buttonImport &&
        totalClasses >= UI_HEURISTICS.UI_DETECTION_THRESHOLDS.INFER_BUTTON_THRESHOLD
      ) {
        // ExchangeFormAction случай: Button компонент дает большинство классов
        const estimatedButtonClasses = this.estimateUIComponentClasses('Button');
        const ownClasses = Math.max(1, totalClasses - estimatedButtonClasses);

        sources.push(`**Own styles**: ${ownClasses} classes from component code`);
        sources.push(
          `**Button component**: ${estimatedButtonClasses} classes inherited from CVA variants`
        );
        sources.push(
          `**Total**: ${ownClasses} own + ${estimatedButtonClasses} inherited = ${totalClasses} classes`
        );
      } else {
        // Другие UI компоненты
        const estimatedUIClasses = uiImports.reduce(
          (sum, imp) => sum + this.estimateUIComponentClasses(imp.name),
          0
        );
        const ownClasses = Math.max(1, totalClasses - estimatedUIClasses);

        sources.push(`**Own styles**: ${ownClasses} classes from component code`);

        for (const imp of uiImports) {
          const estimatedClasses = this.estimateUIComponentClasses(imp.name);
          sources.push(`**${imp.name}**: ${estimatedClasses} classes from UI component`);
        }

        sources.push(
          `**Total**: ${ownClasses} own + ${estimatedUIClasses} inherited = ${totalClasses} classes`
        );
      }
    } else {
      // Обычный случай: собственные стили компонента
      sources.push(`**Own styles**: ${totalClasses} classes from component code`);

      if (uiImports.length > 0) {
        sources.push(
          `**Note**: Uses UI components (${uiImports.map(i => i.name).join(', ')}) but styles are minimal`
        );
      }
    }

    if (sources.length === 0) {
      return '';
    }

    return `
#### 📤 Style Sources
${sources.map(source => `- ${source}`).join('\n')}
`;
  }

  /**
   * Детальный рендер стилей для каждого компонента
   */
  renderDetailedComponentStyles(components: ComponentNode[]): string {
    return components
      .map(comp => {
        const icon = this.getComponentIcon(comp.depth);
        const tailwindClasses = comp.styles.tailwind;
        const cssModules = comp.styles.cssModules;
        const cssInJs = comp.styles.cssInJs;
        const dynamicClasses = comp.styles.dynamicClasses || [];

        // ИСПРАВЛЕНИЕ: Правильное получение имени компонента
        const exportName = comp.exports[0]?.name || comp.name || 'Unknown';

        let dynamicSection = '';
        if (dynamicClasses.length > 0) {
          dynamicSection = `

**Dynamic**:
${dynamicClasses
  .map(
    (pattern: any) => `\`\`\`tsx
${pattern.originalCode}
\`\`\``
  )
  .join('\n\n')}`;
        }

        return `### ${icon} ${exportName}

**File**: \`${comp.filePath}\`  
**Export**: \`${exportName}\`

#### 🎨 Tailwind Classes
**Static (${tailwindClasses.length})**:
${tailwindClasses.length > 0 ? `\`\`\`css\n${tailwindClasses.join('\n')}\n\`\`\`` : '_None_'}${dynamicSection}

${this.renderStyleSources(comp)}

#### 🧩 CSS Modules
${
  Object.keys(cssModules).length > 0
    ? Object.keys(cssModules)
        .map(key => `\`${key}: ${(cssModules as any)[key]}\``)
        .join('\n')
    : '_None_'
}

#### 🧬 CSS-in-JS
${cssInJs.length > 0 ? `\`\`\`javascript\n${cssInJs.join('\n')}\n\`\`\`` : '_None_'}`;
      })
      .join('\n\n');
  }

  /**
   * Рендер сводки Tailwind по компонентам
   */
  renderTailwindSummaryByComponent(components: ComponentNode[]): string {
    return (
      components
        .filter(comp => comp.styles.tailwind.length > 0)
        .map(comp => {
          const exportName = comp.exports[0]?.name || 'Unknown';
          return `- **${exportName}**: ${comp.styles.tailwind.join(', ')}`;
        })
        .join('\n') || '_No Tailwind classes found_'
    );
  }

  /**
   * Форматирование пути страницы
   */
  formatPagePath(pagePath: string): string {
    return pagePath.replace(/\\/g, '/');
  }

  /**
   * Санитизация имени файла
   */
  sanitizeFileName(name: string): string {
    return (
      name
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'component'
    );
  }

  /**
   * Получение иконки для компонента в зависимости от уровня вложенности
   */
  private getComponentIcon(depth: number): string {
    if (depth === 0) return '🧱'; // Корневой компонент
    if (depth === 1) return '🔸'; // Первый уровень вложенности
    return '⚪'; // Глубокая вложенность
  }

  /**
   * Проверка, вероятно ли что компонент использует UI компоненты
   */
  private likelyUsesUIComponents(comp: ComponentNode): boolean {
    // Эвристики:
    // 1. Имя компонента содержит "Action", "Button", "Form"
    const componentNameIndicators = ['Action', 'Button', 'Form', 'Submit'];
    const nameIndicatesUI = componentNameIndicators.some(indicator =>
      comp.name.includes(indicator)
    );

    // 2. Файл содержит "form", "exchange" или другие UI паттерны
    const fileIndicatesUI =
      comp.filePath.toLowerCase().includes('form') ||
      comp.filePath.toLowerCase().includes('exchange');

    return nameIndicatesUI || fileIndicatesUI;
  }

  /**
   * Инферация UI импортов на основе эвристик
   */
  private inferUIImports(comp: ComponentNode): ImportInfo[] {
    const inferred: ImportInfo[] = [];

    // Если компонент имеет очень много классов, скорее всего использует Button
    if (
      comp.styles.tailwind.length >= UI_HEURISTICS.UI_DETECTION_THRESHOLDS.INFER_BUTTON_THRESHOLD
    ) {
      inferred.push({
        name: 'Button',
        localName: 'Button',
        source: '@repo/ui',
        type: 'named',
      });
    }

    return inferred;
  }

  /**
   * Проверка, является ли компонент UI компонентом
   */
  private isUIComponent(componentName: string): boolean {
    const uiComponents = [
      'Button',
      'Input',
      'Card',
      'Dialog',
      'Form',
      'Select',
      'Textarea',
      'Label',
      'Table',
      'Notification',
      'cn',
    ];
    return uiComponents.includes(componentName);
  }

  /**
   * Оценка количества классов от UI компонента
   */
  private estimateUIComponentClasses(componentName: string): number {
    // Используем конфигурируемые значения вместо hardcoded чисел
    return (
      UI_HEURISTICS.UI_COMPONENT_CLASS_ESTIMATES[
        componentName as keyof typeof UI_HEURISTICS.UI_COMPONENT_CLASS_ESTIMATES
      ] || UI_HEURISTICS.UI_COMPONENT_CLASS_ESTIMATES.DEFAULT
    );
  }
}
