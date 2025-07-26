// Barrel export для всех сканеров
// Предоставляет единую точку доступа к архитектуре сканеров

export { BaseScanner } from './base-scanner.js';
export { PageScanner } from './page-scanner.js';
export { LayoutScanner } from './layout-scanner.js';
export { UIScanner } from './ui-scanner.js';
export { TailwindConfigScanner } from './tailwind-config-scanner.js';
export { MainScanner, scanStyles } from './main-scanner.js';

// Re-export основной функции для обратной совместимости
export { scanStyles as scanStylesRefactored } from './main-scanner.js';
