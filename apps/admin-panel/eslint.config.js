import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config} */
const config = [
  ...nextJsConfig,
  // Demo app exception for comprehensive demonstration file
  // This page contains multiple demo components to showcase UI library capabilities
  // Breaking it down would destroy the demo coherence and user experience
  {
    files: ['app/page.tsx'],
    rules: {
      'max-lines': 'off', // Demo app exception for comprehensive showcase
    },
  },
];

export default config;
