import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { config as baseConfig } from './base.js';

/**
 * A custom ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").Linter.Config[]} */
export const config = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  {
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      'react/react-in-jsx-scope': 'off',

      // === REACT ENTERPRISE RULES ===

      // Performance & Best Practices
      'react/jsx-no-bind': [
        'error',
        {
          ignoreDOMComponents: false,
          ignoreRefs: true,
          allowArrowFunctions: false,
          allowBind: false,
        },
      ],
      'react/jsx-no-leaked-render': 'error',
      'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
      'react/no-array-index-key': 'warn',
      'react/no-unstable-nested-components': 'error',

      // Component Quality
      'react/jsx-max-depth': ['warn', { max: 6 }],
      'react/jsx-max-props-per-line': ['error', { maximum: 3, when: 'multiline' }],
      'react/jsx-first-prop-new-line': ['error', 'multiline'],
      'react/jsx-closing-bracket-location': ['error', 'line-aligned'],

      // Accessibility & UX
      'react/jsx-no-target-blank': ['error', { enforceDynamicLinks: 'always' }],
      'react/button-has-type': 'error',
      'react/no-unescaped-entities': 'error',

      // State Management
      'react/no-unused-state': 'error',
      'react/prefer-stateless-function': 'warn',
      'react/no-redundant-should-component-update': 'error',

      // Props & Types
      'react/require-default-props': 'off', // TypeScript handles this better
      'react/prop-types': 'off', // TypeScript handles this
      'react/jsx-props-no-spreading': [
        'warn',
        {
          html: 'enforce',
          custom: 'ignore',
          exceptions: ['input', 'textarea'],
        },
      ],

      // === INLINE STYLES CONTROL ===

      // Запретить инлайн стили в пользу CSS классов
      'react/forbid-dom-props': [
        'warn',
        {
          forbid: [
            {
              propName: 'style',
              message: 'Avoid inline styles. Use CSS classes or styled-components instead.',
            },
          ],
        },
      ],

      // Контроль магических чисел в JSX (включая style объекты)
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2, 100],
          ignoreArrayIndexes: true,
          enforceConst: true,
          detectObjects: true, // Найдет магические числа в style={{width: 300}}
        },
      ],
    },
  },
];
