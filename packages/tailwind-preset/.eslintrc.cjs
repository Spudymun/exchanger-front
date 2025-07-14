module.exports = {
  env: {
    node: true,
    commonjs: true,
  },
  rules: {
    'import/no-commonjs': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'unicorn/prefer-module': 'off',
    'no-undef': 'off',
    'sonarjs/no-duplicate-string': 'off',
  },
};
