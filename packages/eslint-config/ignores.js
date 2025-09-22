/**
 * Централизованные ignore паттерны
 * Группировка по типам для лучшей читаемости
 */

// === BUILD ARTIFACTS ===
export const buildIgnores = [
  '**/dist/**',
  '**/out/**',
  '**/.next/**',
  '**/.next/types/**', // Next.js автогенерированные типы
  '**/coverage/**',
  '**/storybook-static/**',
  '**/playwright-report/**',
  '**/test-results/**',
];

// === PACKAGE BUILD OUTPUTS ===
export const packageIgnores = [
  'packages/*/dist/**',
  'packages/*/.turbo/**',
  'apps/*/.next/**',
  'apps/*/dist/**',
  'apps/*/.turbo/**',
];

// === IDE AND SYSTEM FILES ===
export const systemIgnores = [
  '**/.vscode/**',
  '**/.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/Thumbs.db',
  '**/.history/**', // VSCode Local History
];

// === TEMPORARY AND CACHE FILES ===
export const tempIgnores = [
  '**/node_modules/**',
  '**/.cache/**',
  '**/tmp/**',
  '**/.temp/**', // Optimized temporary patterns
];

// === GENERATED FILES ===
export const generatedIgnores = ['**/*.d.ts', '**/*.map', '**/*.tsbuildinfo'];

// === CONFIG FILES ===
export const configIgnores = ['turbo.json'];

// === DEVELOPMENT/NON-PRODUCTION APPS ===
export const devAppIgnores = [
  'docs/**', // Документация
  'apps/docs/**', // Документация приложение
  'apps/admin-panel/**', // Admin panel (в разработке)
];

// === ПОЛНЫЙ СПИСОК IGNORES ===
export const allIgnores = [
  ...buildIgnores,
  ...packageIgnores,
  ...systemIgnores,
  ...tempIgnores,
  ...generatedIgnores,
  ...configIgnores,
  ...devAppIgnores,
];
