// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import security from "eslint-plugin-security";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...storybook.configs["flat/recommended"],
  {
    plugins: {
      security,
    },
    rules: {
      // Security rules
      "security/detect-object-injection": "error",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "warn",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-regexp": "error",
      "security/detect-non-literal-require": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "error",

      // Code quality rules from our style guide
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
      "complexity": ["warn", 10],
      "max-depth": ["error", 2],
      "max-params": ["error", 4],

      // Prevent deeply nested conditionals
      "max-nested-callbacks": ["error", 3],

      // Encourage readable code
      "max-statements-per-line": ["error", { max: 1 }],

      // React specific improvements
      "react/jsx-max-depth": ["warn", { max: 4 }],

      // TypeScript improvements
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error"
    }
  },
  // Override rules for infrastructure/service files
  {
    files: [
      "apps/web/src/server/trpc/**/*.ts",
      "apps/web/pages/api/trpc/**/*.ts", 
      "packages/ui/src/**/*.tsx" // for demo components
    ],
    rules: {
      "no-console": "off" // Allow console logs in infrastructure layer
    }
  }
];

export default eslintConfig;
