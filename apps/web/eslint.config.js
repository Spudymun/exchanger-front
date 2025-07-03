import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config} */
const config = [
  ...nextJsConfig,
  // Override rules for infrastructure/service files
  {
    files: [
      'src/server/trpc/**/*.ts',
      'pages/api/trpc/**/*.ts',
      'src/components/ui/**/*.tsx', // for demo components
    ],
    rules: {
      'no-console': 'off', // Allow console logs in infrastructure layer
    },
  },
];

export default config;
