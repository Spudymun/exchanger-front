import { config as baseConfig } from "./react-internal.js";

/**
 * Extended ESLint configuration for UI libraries with relaxed rules.
 * Some enterprise rules are softened for design system components.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
    ...baseConfig,
    {
        files: ["src/components/ui/**/*.tsx", "src/components/ui/**/*.ts"],
        rules: {
            // Relax some rules for UI components (they often need prop spreading)
            "react/jsx-props-no-spreading": "off",
            "react/require-default-props": "off",

            // Allow longer functions for complex UI components
            "max-lines-per-function": ["error", { "max": 150 }],
            "complexity": ["error", { "max": 15 }],
        },
    },
    {
        files: ["**/*.config.js", "**/*.config.ts", "jest.*.js", "tailwind.config.js"],
        rules: {
            // Config files can use CommonJS and have different rules
            "unicorn/prefer-module": "off",
            "no-magic-numbers": "off",
            "@typescript-eslint/no-require-imports": "off",
        },
    },
    {
        files: ["**/*.stories.tsx", "**/*.stories.ts", "**/*.test.tsx", "**/*.test.ts"],
        rules: {
            // Stories and tests can be more flexible
            "no-console": "off",
            "no-alert": "off",
            "import/order": "off",
            "react/jsx-no-bind": "off",
            "max-lines-per-function": "off",
            "sonarjs/no-duplicate-string": "off",
        },
    },
];
