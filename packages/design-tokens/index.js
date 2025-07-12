// ExchangeGO Design System - Main Export
// Централизованный экспорт всех design tokens
// Создано: 30 июня 2025

// === INDIVIDUAL EXPORTS ===
export { colors } from './colors.js';
export { typography } from './typography.js';
export { spacing, borderRadius, boxShadow, container, zIndex, semanticSpacing } from './spacing.js';
export {
  formContainers,
  visualConnectors,
  componentGroups,
  enhancedCards,
  layoutPatterns,
  formSpacing,
} from './form-patterns.js';

// === COMBINED DEFAULT EXPORT ===
import { colors } from './colors.js';
import formPatterns from './form-patterns.js';
import spacingTokens from './spacing.js';
import { typography } from './typography.js';

// Полный набор design tokens для использования в Tailwind и компонентах
const designSystem = {
  // Цветовая система
  colors,

  // Типографическая система
  typography,

  // Пространственная система
  ...spacingTokens,

  // Паттерны форм и группировки компонентов
  ...formPatterns,

  // Мета-информация о дизайн-системе
  meta: {
    name: 'ExchangeGO Design System',
    version: '1.0.0',
    created: '2025-06-30',
    description: 'Современная дизайн-система для криптообменника',
  },

  // Брейкпоинты для responsive дизайна
  screens: {
    sm: '640px', // Mobile landscape
    md: '768px', // Tablet
    lg: '1024px', // Desktop
    xl: '1280px', // Large desktop
    '2xl': '1536px', // Extra large desktop
  },

  // Анимации и переходы
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      ease: 'ease',
      'ease-in': 'ease-in',
      'ease-out': 'ease-out',
      'ease-in-out': 'ease-in-out',
      linear: 'linear',
    },
  },
};

export default designSystem;
