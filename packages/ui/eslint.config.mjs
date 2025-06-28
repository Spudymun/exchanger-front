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
];
