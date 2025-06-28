import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: "module",
                project: "./tsconfig.json"
            }
        },
        plugins: {
            '@typescript-eslint': tseslint
        },
        rules: {
            // Basic quality rules
            "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
            "complexity": ["warn", 10],
            "max-depth": ["error", 2],
            "max-params": ["error", 4],

            // Prevent deeply nested conditionals
            "max-nested-callbacks": ["error", 3],

            // Encourage readable code
            "max-statements-per-line": ["error", { max: 1 }],

            // TypeScript-aware rules
            "@typescript-eslint/no-unused-vars": "warn",
            "no-console": "off", // Allow console in examples
            "prefer-const": "error"
        }
    },
    {
        files: ["**/*.{js,jsx}"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module"
        },
        rules: {
            "no-unused-vars": "warn",
            "prefer-const": "error"
        }
    }
]
