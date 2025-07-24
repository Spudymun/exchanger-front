/**
 * Default File Patterns Configuration
 * Конфигурируемые паттерны поиска файлов вместо hardcoded значений
 */

/**
 * Конфигурация путей для разных типов проектов
 */
export interface ProjectStructureConfig {
  readonly apps: {
    readonly basePath: string;
    readonly pagePatterns: readonly string[];
    readonly layoutPatterns: readonly string[];
    readonly componentPatterns: readonly string[];
  };
  readonly packages: {
    readonly ui: {
      readonly basePath: string;
      readonly componentPatterns: readonly string[];
    };
  };
}

/**
 * Конфигурация по умолчанию для монорепо структуры
 */
export const DEFAULT_PROJECT_STRUCTURE: ProjectStructureConfig = {
  apps: {
    basePath: 'apps',
    pagePatterns: ['apps/*/app/**/page.{tsx,jsx}', 'apps/*/src/app/**/page.{tsx,jsx}'],
    layoutPatterns: ['apps/*/app/**/layout.{tsx,jsx}', 'apps/*/src/app/**/layout.{tsx,jsx}'],
    componentPatterns: [
      'apps/*/src/components/app-layout.{tsx,jsx}',
      'apps/*/src/components/app-header.{tsx,jsx}',
      'apps/*/src/components/app-footer.{tsx,jsx}',
      'apps/*/src/components/**/header*.{tsx,jsx}',
      'apps/*/src/components/**/footer*.{tsx,jsx}',
      'apps/*/src/components/**/navigation*.{tsx,jsx}',
      'apps/*/src/components/**/sidebar*.{tsx,jsx}',
    ],
  },
  packages: {
    ui: {
      basePath: 'packages/ui',
      componentPatterns: [
        'packages/ui/src/components/ui/button.{tsx,jsx}',
        'packages/ui/src/components/ui/input.{tsx,jsx}',
        'packages/ui/src/components/ui/select.{tsx,jsx}',
        'packages/ui/src/components/ui/textarea.{tsx,jsx}',
        'packages/ui/src/components/ui/card.{tsx,jsx}',
        'packages/ui/src/components/ui/dialog.{tsx,jsx}',
        'packages/ui/src/components/ui/form.{tsx,jsx}',
        'packages/ui/src/components/ui/label.{tsx,jsx}',
        'packages/ui/src/components/ui/dropdown-menu.{tsx,jsx}',
        'packages/ui/src/components/ui/spinner.{tsx,jsx}',
        'packages/ui/src/components/ui/table.{tsx,jsx}',
        'packages/ui/src/components/ui/notification.{tsx,jsx}',
        'packages/ui/src/components/header-compound.{tsx,jsx}',
        'packages/ui/src/components/footer-compound.{tsx,jsx}',
        'packages/ui/src/components/theme-toggle.{tsx,jsx}',
      ],
    },
  },
} as const;

/**
 * Функция для генерации паттернов на основе конфигурации
 */
export function generateFilePatterns(config: ProjectStructureConfig = DEFAULT_PROJECT_STRUCTURE) {
  return {
    PAGES: config.apps.pagePatterns,
    LAYOUTS: config.apps.layoutPatterns,
    LAYOUT_COMPONENTS: config.apps.componentPatterns,
    UI_COMPONENTS: config.packages.ui.componentPatterns,
  } as const;
}

/**
 * Альтернативные конфигурации для разных структур проектов
 */
export const ALTERNATIVE_STRUCTURES = {
  /**
   * Структура с src/ в корне
   */
  SRC_BASED: {
    apps: {
      basePath: 'src/apps',
      pagePatterns: ['src/apps/*/pages/**/page.{tsx,jsx}', 'src/apps/*/app/**/page.{tsx,jsx}'],
      layoutPatterns: ['src/apps/*/layouts/**/*.{tsx,jsx}', 'src/apps/*/app/**/layout.{tsx,jsx}'],
      componentPatterns: ['src/apps/*/components/**/*.{tsx,jsx}'],
    },
    packages: {
      ui: {
        basePath: 'src/packages/ui',
        componentPatterns: ['src/packages/ui/components/**/*.{tsx,jsx}'],
      },
    },
  },

  /**
   * Простая структура без монорепо
   */
  SIMPLE: {
    apps: {
      basePath: 'src',
      pagePatterns: ['src/pages/**/page.{tsx,jsx}', 'src/app/**/page.{tsx,jsx}'],
      layoutPatterns: ['src/layouts/**/*.{tsx,jsx}', 'src/app/**/layout.{tsx,jsx}'],
      componentPatterns: ['src/components/**/*.{tsx,jsx}'],
    },
    packages: {
      ui: {
        basePath: 'src/ui',
        componentPatterns: ['src/ui/**/*.{tsx,jsx}'],
      },
    },
  },
} as const;
