import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
import onlyWarn from 'eslint-plugin-only-warn';
import sonarjs from 'eslint-plugin-sonarjs';
import security from 'eslint-plugin-security';
import unicorn from 'eslint-plugin-unicorn';
import importPlugin from 'eslint-plugin-import';
import promisePlugin from 'eslint-plugin-promise';
import unusedImports from 'eslint-plugin-unused-imports';

/**
 * A shared ESLint configuration for the repository.
 * Enterprise-level rules for code quality, security, and maintainability.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      sonarjs,
      security,
      promise: promisePlugin,
    },
    rules: {
      // SonarJS rules (cognitive complexity & code duplication)
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-small-switch': 'error',
      'sonarjs/prefer-immediate-return': 'error',

      // Security rules
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',

      // Promise rules
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-nesting': 'warn',
    },
  },
  {
    plugins: {
      turbo: turboPlugin,
      unicorn,
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',

      // === ENTERPRISE QUALITY RULES ===

      // Complexity & Maintainability
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', 4],
      'max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 5],

      // Anti-patterns & Code Smells
      'no-console': 'warn',
      'no-alert': 'error',
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Hard-coded values detection
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2, 24, 60, 100, 1000],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          detectObjects: false,
        },
      ],

      // Custom security rule: detect hardcoded API tokens
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/sk-[a-zA-Z0-9]{40,}/]',
          message: 'Hardcoded API tokens are not allowed. Use environment variables instead.',
        },
        {
          selector: 'TemplateElement[value.raw=/sk-[a-zA-Z0-9]{40,}/]',
          message:
            'Hardcoded API tokens in template literals are not allowed. Use environment variables instead.',
        },
        {
          selector: 'Literal[value=/localhost|127\\.0\\.0\\.1|192\\.168\\./]',
          message:
            'Hardcoded localhost/IP addresses are not allowed. Use environment variables instead.',
        },
        {
          selector: 'TemplateElement[value.raw=/localhost|127\\.0\\.0\\.1|192\\.168\\./]',
          message:
            'Hardcoded localhost/IP addresses in template literals are not allowed. Use environment variables instead.',
        },
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message:
            'Direct innerHTML assignment is dangerous (XSS vulnerability). Use textContent or sanitize input.',
        },
      ],

      // Imports organization
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always-and-inside-groups',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-useless-path-segments': 'error',

      // Unused imports control
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Modern JavaScript practices
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-ternary': 'error',
      'unicorn/prefer-logical-operator-over-ternary': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/no-lonely-if': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',

      // TypeScript specific (basic rules only - no type checking required)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-as-const': 'error',

      // TypeScript Enterprise Rules - базовые (не требуют type info)
      '@typescript-eslint/no-explicit-any': [
        'error',
        {
          fixToUnknown: true,
          ignoreRestArgs: false,
        },
      ],
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ['dist/**'],
  },
];
