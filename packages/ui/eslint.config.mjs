import { config } from "@repo/eslint-config/ui-library";

/** @type {import("eslint").Linter.Config} */
export default [
    ...config,
    {
        files: ["*.config.js", "jest.config.js", "jest.setup.js", "tailwind.config.js"],
        languageOptions: {
            globals: {
                module: "readonly",
                require: "readonly",
            },
        },
        rules: {
            "@typescript-eslint/no-require-imports": "off",
            "unicorn/prefer-module": "off",
        },
    },
    // Override rules for demo components
    {
        files: ["src/**/*.tsx"],
        rules: {
            "no-console": "off", // Allow console logs in demo UI components
        },
    },
    // Architectural exception for complex system components
    // These components are fundamental system-level UI elements that require
    // comprehensive configuration options and extensive functionality.
    // Breaking them down would destroy their architectural cohesion.
    {
        files: [
            "src/components/data-table.tsx",
            "src/components/tree-view.tsx"
        ],
        rules: {
            "max-lines": "off", // System components exception for architectural integrity
        },
    },
];
