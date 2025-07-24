/**
 * Component Analysis Service
 * Сервис для анализа компонентов и применения эвристик
 */

import type {
  ComponentNode,
  PageScanResult,
  LayoutScanResult,
  ImportInfo,
} from '../types/scanner.js';
import { createLogger, type LoggerConfig } from '../utils/logger.js';

/**
 * Сервис анализа компонентов
 */
export class ComponentAnalysisService {
  private readonly logger;

  constructor(private readonly verbose: boolean) {
    const loggerConfig = { quiet: !verbose, verbose };
    this.logger = createLogger(loggerConfig);
  }

  /**
   * Получение компонентов для структурирования (секции или топ-левел компоненты)
   * Унифицированная работа как для страниц с секциями, так и без них
   */
  getStructuringComponents(pageResult: PageScanResult): ComponentNode[] {
    // Ищем все компоненты, которые импортированы на странице
    const allComponents = this.flattenComponents(pageResult.components);
    const mainPageComponent = pageResult.components.find(comp => comp.depth === 0);

    if (!mainPageComponent) return [];

    // Получаем имена импортированных компонентов
    const importedNames = mainPageComponent.imports.map(imp =>
      imp.name.replace(/[{}]/g, '').trim()
    );

    // ПРАВИЛЬНАЯ ФИЛЬТРАЦИЯ: Для каждого импортированного имени ищем ПЕРВЫЙ подходящий компонент
    // (приоритет отдаем основным файлам, затем локальным)
    const selectedComponents: ComponentNode[] = [];

    for (const importedName of importedNames) {
      // Сначала ищем основной компонент (без #)
      let mainComp = allComponents.find(
        comp => comp.name === importedName && comp.depth > 0 && !comp.filePath.includes('#')
      );

      // Если основной не найден, берём первый локальный
      if (!mainComp) {
        mainComp = allComponents.find(
          comp => comp.name === importedName && comp.depth > 0 && comp.filePath.includes('#')
        );
      }

      if (mainComp) {
        selectedComponents.push(mainComp);
      }
    }

    // НОВАЯ ЛОГИКА: Если импортированных компонентов не найдено (страница без секций),
    // возвращаем все топ-левел компоненты (прямые дети главной страницы)
    if (selectedComponents.length === 0) {
      const topLevelComponents = mainPageComponent.children.filter(comp => comp.depth === 1);
      return topLevelComponents;
    }

    return selectedComponents;
  }

  /**
   * Получение компонентов для структурирования из layout результата
   * Аналогично getStructuringComponents, но для layout компонентов
   */
  getStructuringComponentsFromLayout(layoutResult: LayoutScanResult): ComponentNode[] {
    // Ищем все компоненты в layout
    const allComponents = this.flattenComponents(layoutResult.components);
    const mainLayoutComponent = layoutResult.components.find(comp => comp.depth === 0);

    if (!mainLayoutComponent) return [];

    // Получаем имена импортированных компонентов в layout
    const importedNames = mainLayoutComponent.imports.map(imp =>
      imp.name.replace(/[{}]/g, '').trim()
    );

    // ПРАВИЛЬНАЯ ФИЛЬТРАЦИЯ: Для каждого импортированного имени ищем ПЕРВЫЙ подходящий компонент
    const selectedComponents: ComponentNode[] = [];

    for (const importedName of importedNames) {
      // Сначала ищем основной компонент (без #)
      let mainComp = allComponents.find(
        comp => comp.name === importedName && comp.depth > 0 && !comp.filePath.includes('#')
      );

      // Если основной не найден, берём первый локальный
      if (!mainComp) {
        mainComp = allComponents.find(
          comp => comp.name === importedName && comp.depth > 0 && comp.filePath.includes('#')
        );
      }

      if (mainComp) {
        selectedComponents.push(mainComp);
      }
    }

    // НОВАЯ ЛОГИКА: Если импортированных компонентов не найдено,
    // возвращаем все топ-левел компоненты layout-а
    if (selectedComponents.length === 0) {
      const topLevelComponents = mainLayoutComponent.children.filter(comp => comp.depth === 1);
      return topLevelComponents;
    }

    return selectedComponents;
  }

  /**
   * Проверка, вероятно ли что компонент использует UI компоненты
   */
  likelyUsesUIComponents(comp: ComponentNode): boolean {
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
  inferUIImports(comp: ComponentNode): ImportInfo[] {
    const inferred: ImportInfo[] = [];

    // Если компонент имеет очень много классов (>60), скорее всего использует Button
    if (comp.styles.tailwind.length >= 60) {
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
  isUIComponent(componentName: string): boolean {
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
   * Подсчет собственных классов компонента (более точно)
   */
  countOwnClasses(comp: ComponentNode): number {
    // Если компонент импортирует UI компоненты, то предполагаем малое количество собственных стилей
    const hasUIImports = comp.imports?.some(imp => this.isUIComponent(imp.name));

    if (!hasUIImports) {
      return comp.styles.tailwind.length;
    }

    // Для компонентов с UI импортами - оцениваем по динамическим классам или используем эвристику
    const dynamicClasses = comp.styles.dynamicClasses?.length || 0;
    if (dynamicClasses > 0) {
      // Если есть динамические классы (например, cn(...)), то собственных стилей мало
      return Math.min(comp.styles.tailwind.length, 10);
    }

    return Math.min(comp.styles.tailwind.length, 15);
  }

  /**
   * Оценка количества классов от UI компонента
   */
  estimateUIComponentClasses(componentName: string): number {
    // Известные UI компоненты и их приблизительное количество классов
    const uiComponentClasses: Record<string, number> = {
      Button: 65, // из CVA
      Input: 25,
      Card: 15,
      Dialog: 30,
      Form: 20,
      Select: 35,
      Textarea: 15,
      Label: 10,
      Table: 20,
      Notification: 60,
    };

    return uiComponentClasses[componentName] || 15;
  }

  /**
   * Получение максимальной глубины вложенности
   */
  getMaxDepth(components: ComponentNode[]): number {
    return Math.max(...components.map(comp => comp.depth));
  }

  /**
   * Рекурсивное получение всех компонентов
   */
  flattenComponents(components: readonly ComponentNode[]): ComponentNode[] {
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
}
