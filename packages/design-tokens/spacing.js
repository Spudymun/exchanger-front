// ExchangeGO Design System - Spacing & Layout
// Современная система отступов и пространства
// Создано: 30 июня 2025

// === BASE SPACING SCALE ===
// Использует систему 4px grid для консистентности
export const spacing = {
  // Micro spacing (0-8px)
  0: '0px',
  px: '1px', // Для border
  0.5: '0.125rem', // 2px - очень мелкие отступы
  1: '0.25rem', // 4px - минимальные отступы
  1.5: '0.375rem', // 6px - между элементами
  2: '0.5rem', // 8px - внутренние отступы кнопок

  // Small spacing (8-16px)
  2.5: '0.625rem', // 10px - отступы в формах
  3: '0.75rem', // 12px - отступы текста
  3.5: '0.875rem', // 14px - между группами
  4: '1rem', // 16px - стандартные отступы

  // Medium spacing (16-32px)
  5: '1.25rem', // 20px - между секциями
  6: '1.5rem', // 24px - отступы карточек
  7: '1.75rem', // 28px - большие отступы
  8: '2rem', // 32px - между блоками

  // Large spacing (32px+)
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px - отступы контейнеров
  11: '2.75rem', // 44px
  12: '3rem', // 48px - большие секции
  14: '3.5rem', // 56px
  16: '4rem', // 64px - очень большие отступы

  // XL spacing (для layout)
  20: '5rem', // 80px - между главными секциями
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
};

// === BORDER RADIUS ===
// Современные скругления для ExchangeGO
export const borderRadius = {
  none: '0px', // Без скругления
  sm: '0.125rem', // 2px - мелкие элементы
  DEFAULT: '0.25rem', // 4px - стандартное скругление
  md: '0.375rem', // 6px - инпуты, кнопки
  lg: '0.5rem', // 8px - карточки
  xl: '0.75rem', // 12px - большие карточки
  '2xl': '1rem', // 16px - модальные окна
  '3xl': '1.5rem', // 24px - hero секции
  full: '9999px', // Полное скругление (круги)
};

// === BOX SHADOWS ===
// Тени для создания глубины и иерархии
export const boxShadow = {
  // Subtle shadows
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',

  // Medium shadows
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',

  // Large shadows
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',

  // Colored shadows для crypto элементов
  primary: '0 10px 15px -3px rgb(59 130 246 / 0.1), 0 4px 6px -4px rgb(59 130 246 / 0.1)',
  success: '0 10px 15px -3px rgb(34 197 94 / 0.1), 0 4px 6px -4px rgb(34 197 94 / 0.1)',
  warning: '0 10px 15px -3px rgb(245 158 11 / 0.1), 0 4px 6px -4px rgb(245 158 11 / 0.1)',
  error: '0 10px 15px -3px rgb(239 68 68 / 0.1), 0 4px 6px -4px rgb(239 68 68 / 0.1)',

  // Special shadows
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
};

// === CONTAINER SIZES ===
// Размеры контейнеров для responsive дизайна
export const container = {
  sm: '640px', // Small screens
  md: '768px', // Medium screens
  lg: '1024px', // Large screens
  xl: '1280px', // Extra large screens
  '2xl': '1536px', // 2X large screens
};

// === Z-INDEX SCALE ===
// Управление слоями интерфейса
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10', // Dropdown элементы
  20: '20', // Sticky headers
  30: '30', // Fixed sidebars
  40: '40', // Модальные overlay
  50: '50', // Модальные окна
  60: '60', // Tooltips
  70: '70', // Loading состояния
  80: '80', // Toast уведомления
  90: '90', // Debug информация
  100: '100', // Максимальный приоритет
};

// === SEMANTIC SPACING ===
// Готовые паттерны для типичных случаев
export const semanticSpacing = {
  // Отступы компонентов
  component: {
    padding: {
      xs: spacing[2], // 8px - маленькие кнопки
      sm: spacing[3], // 12px - обычные кнопки
      md: spacing[4], // 16px - карточки
      lg: spacing[6], // 24px - большие карточки
      xl: spacing[8], // 32px - контейнеры
    },
    margin: {
      xs: spacing[2], // 8px - между элементами
      sm: spacing[4], // 16px - между группами
      md: spacing[6], // 24px - между секциями
      lg: spacing[8], // 32px - между блоками
      xl: spacing[12], // 48px - между главными секциями
    },
  },

  // Отступы для текста
  text: {
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  // Отступы для форм
  form: {
    fieldSpacing: spacing[4], // 16px между полями
    groupSpacing: spacing[6], // 24px между группами
    sectionSpacing: spacing[8], // 32px между секциями
  },
};

const spacingSystem = {
  spacing,
  borderRadius,
  boxShadow,
  container,
  zIndex,
  semanticSpacing,
};

export default spacingSystem;
