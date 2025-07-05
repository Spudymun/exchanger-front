/**
 * React-специфичные правила для компонентов и хуков
 * Включает React Hooks и accessibility правила с lazy loading
 */

import {
  lazyLoadPlugin,
  lazyLoadConfig,
  conditionalConfig,
  hasFiles,
  performanceMetrics,
} from './lazy-loading.js';
import { baseTsRules, consoleRules } from './shared-rules.js';

// === LAZY LOADING REACT PLUGINS ===
const loadReactHooks = () =>
  lazyLoadPlugin('react-hooks', async () => {
    const start = Date.now();
    const plugin = await import('eslint-plugin-react-hooks');
    performanceMetrics.recordLoadTime('react-hooks', start);
    return plugin.default;
  });

const loadA11y = () =>
  lazyLoadPlugin('jsx-a11y', async () => {
    const start = Date.now();
    const plugin = await import('eslint-plugin-jsx-a11y');
    performanceMetrics.recordLoadTime('jsx-a11y', start);
    return plugin.default;
  });

// === HELPER FUNCTIONS ===
const createReactBaseConfig = hasReactFiles =>
  conditionalConfig(hasReactFiles, () => [
    {
      name: 'react-base',
      files: ['apps/**/*.{jsx,tsx}', 'packages/ui/**/*.{jsx,tsx}'],
      rules: lazyLoadConfig('react-base-rules', () => ({
        ...baseTsRules,
      })),
    },
  ]);

const createUILibraryConfig = () =>
  conditionalConfig(hasFiles(['packages/ui/**/*.{js,jsx,ts,tsx}']), () => [
    {
      name: 'ui-library',
      files: ['packages/ui/**/*.{js,jsx,ts,tsx}'],
      rules: lazyLoadConfig('ui-rules', () => ({
        ...baseTsRules,
        ...consoleRules.warn, // UI компоненты могут логировать warnings
      })),
    },
  ]);

const createStorybookConfig = hasStorybookFiles =>
  conditionalConfig(hasStorybookFiles, () => [
    {
      name: 'storybook',
      files: ['**/*.stories.{js,jsx,ts,tsx}', '**/stories/**/*.{js,jsx,ts,tsx}'],
      rules: lazyLoadConfig('storybook-rules', () => ({
        ...consoleRules.off, // Демо компоненты могут логировать
        'no-alert': 'off', // Демо взаимодействия
        '@typescript-eslint/no-unused-vars': 'off',
      })),
    },
  ]);

const createMainPagesConfig = () => ({
  name: 'main-pages',
  files: [
    'apps/*/app/page.tsx',
    'apps/*/app/**/page.tsx',
    'apps/*/src/components/**/Order*.tsx',
    'apps/*/src/components/**/Dashboard*.tsx',
    'packages/hooks/src/use*Store.ts',
    'packages/hooks/src/use*Notifications.ts',
  ],
  rules: lazyLoadConfig('main-pages-rules', () => ({
    ...baseTsRules,
    // Main pages могут содержать планируемые фичи
    'no-warning-comments': 'warn', // warn вместо error
  })),
});

const createDashboardConfig = () => ({
  name: 'dashboard',
  files: ['apps/*/app/**/dashboard/**/*.tsx', 'apps/*/src/pages/**/dashboard/**/*.tsx'],
  rules: lazyLoadConfig('dashboard-rules', () => ({
    ...baseTsRules,
  })),
});

const createHooksConfig = () => ({
  name: 'hooks',
  files: ['packages/hooks/**/*.{js,ts,tsx}'],
  rules: lazyLoadConfig('hooks-rules', () => ({
    ...baseTsRules,
  })),
});

// === OPTIMIZED REACT CONFIG FACTORY ===
export const createReactConfig = () => {
  const start = Date.now();

  const hasReactFiles = hasFiles(['**/*.{jsx,tsx}']);
  const hasStorybookFiles = hasFiles(['**/*.stories.{js,jsx,ts,tsx}']);

  const config = [
    // Базовые React правила только если есть React файлы
    ...createReactBaseConfig(hasReactFiles),
    // UI библиотека правила
    ...createUILibraryConfig(),
    // Storybook правила только если есть Storybook файлы
    ...createStorybookConfig(hasStorybookFiles),
    // Основные страницы
    createMainPagesConfig(),
    // Dashboard страницы
    createDashboardConfig(),
    // Хуки
    createHooksConfig(),
  ];

  performanceMetrics.recordLoadTime('react-config', start);
  return config;
};

// === LAZY REACT CONFIG ===
export const reactConfig = createReactConfig();

// === ASYNC REACT CONFIG С ПЛАГИНАМИ ===
export const createAsyncReactConfig = async () => {
  const start = Date.now();

  const [reactHooks, a11y] = await Promise.all([loadReactHooks(), loadA11y()]);

  const config = [
    // React Hooks и A11y конфигурация
    ...(reactHooks && a11y
      ? [
          {
            name: 'react-plugins',
            plugins: {
              'react-hooks': reactHooks,
              'jsx-a11y': a11y,
            },
            rules: lazyLoadConfig('react-plugins-rules', () => ({
              // React Hooks правила
              'react-hooks/rules-of-hooks': 'error',
              'react-hooks/exhaustive-deps': 'warn',

              // Accessibility правила (базовые)
              'jsx-a11y/alt-text': 'error',
              'jsx-a11y/anchor-has-content': 'error',
              'jsx-a11y/anchor-is-valid': 'error',
              'jsx-a11y/click-events-have-key-events': 'warn',
              'jsx-a11y/no-static-element-interactions': 'warn',
            })),
          },
        ]
      : []),

    // Основная React конфигурация
    ...reactConfig,
  ];

  performanceMetrics.recordLoadTime('async-react-config', start);
  return config;
};
