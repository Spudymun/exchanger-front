// ExchangeGO Design System - Typography
// Современная типографическая система для криптообменника
// Создано: 30 июня 2025

// Font constants
const MAIN_FONT = 'Inter';
const FALLBACK_FONT = 'sans-serif';

export const typography = {
  // === FONT FAMILIES ===
  fontFamily: {
    // Sans: Основной шрифт для интерфейса
    sans: [
      MAIN_FONT, // Современный, читаемый
      'system-ui', // Системный шрифт
      '-apple-system', // macOS
      'BlinkMacSystemFont', // macOS Safari
      '"Segoe UI"', // Windows
      'Roboto', // Android
      '"Helvetica Neue"', // Fallback
      'Arial', // Универсальный fallback
      FALLBACK_FONT, // Generic fallback
    ],

    // Display: Для заголовков и акцентов
    display: [
      MAIN_FONT, // Тот же шрифт для консистентности
      'system-ui',
      FALLBACK_FONT,
    ],

    // Mono: Для криптоадресов, кодов, цифр
    mono: [
      '"JetBrains Mono"', // Отличная читаемость для крипто
      '"SF Mono"', // macOS
      'Consolas', // Windows
      '"Liberation Mono"', // Linux
      'Menlo', // macOS Terminal
      'Monaco', // macOS старые версии
      'monospace', // Generic fallback
    ],

    // Numeric: Специально для цифр и валют
    numeric: [
      MAIN_FONT, // Inter отлично подходит для цифр
      '"SF Pro Display"', // Apple's numeric font
      'system-ui',
      FALLBACK_FONT,
    ],
  },

  // === FONT SIZES ===
  fontSize: {
    // Micro: Мелкие подписи, копирайты
    '2xs': ['0.625rem', { lineHeight: '0.75rem' }], // 10px
    xs: ['0.75rem', { lineHeight: '1rem' }], // 12px

    // Small: Вторичная информация, метки
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px

    // Base: Основной текст интерфейса
    base: ['1rem', { lineHeight: '1.5rem' }], // 16px

    // Large: Важная информация, суммы
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px

    // Display: Заголовки и важные числа
    '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px

    // Hero: Главные заголовки, крупные суммы
    '5xl': ['3rem', { lineHeight: '3rem' }], // 48px
    '6xl': ['3.75rem', { lineHeight: '3.75rem' }], // 60px
    '7xl': ['4.5rem', { lineHeight: '4.5rem' }], // 72px

    // Giant: Для особых случаев
    '8xl': ['6rem', { lineHeight: '6rem' }], // 96px
    '9xl': ['8rem', { lineHeight: '8rem' }], // 128px
  },

  // === FONT WEIGHTS ===
  fontWeight: {
    thin: '100', // Очень тонкий
    extralight: '200', // Экстра легкий
    light: '300', // Легкий - для больших заголовков
    normal: '400', // Обычный - основной текст
    medium: '500', // Средний - акценты, важный текст
    semibold: '600', // Полужирный - подзаголовки
    bold: '700', // Жирный - заголовки
    extrabold: '800', // Экстра жирный - крупные заголовки
    black: '900', // Черный - для особых случаев
  },

  // === LINE HEIGHTS ===
  lineHeight: {
    none: '1', // Без отступов - для крупных заголовков
    tight: '1.25', // Плотный - для заголовков
    snug: '1.375', // Компактный - для кнопок
    normal: '1.5', // Обычный - для текста
    relaxed: '1.625', // Расслабленный - для чтения
    loose: '2', // Свободный - для особых случаев
  },

  // === LETTER SPACING ===
  letterSpacing: {
    tighter: '-0.05em', // Более плотный
    tight: '-0.025em', // Плотный - для заголовков
    normal: '0em', // Обычный - основной текст
    wide: '0.025em', // Широкий - кнопки, лейблы
    wider: '0.05em', // Более широкий - акценты
    widest: '0.1em', // Самый широкий - особые случаи
  },

  // === SEMANTIC FONT COMBINATIONS ===
  // Готовые комбинации для типичных случаев
  combinations: {
    // Заголовки
    h1: {
      fontSize: '3xl',
      fontWeight: 'bold',
      lineHeight: 'tight',
      letterSpacing: 'tight',
    },
    h2: {
      fontSize: '2xl',
      fontWeight: 'semibold',
      lineHeight: 'tight',
      letterSpacing: 'tight',
    },
    h3: {
      fontSize: 'xl',
      fontWeight: 'semibold',
      lineHeight: 'snug',
      letterSpacing: 'normal',
    },

    // Основной текст
    body: {
      fontSize: 'base',
      fontWeight: 'normal',
      lineHeight: 'normal',
      letterSpacing: 'normal',
    },

    // Вторичный текст
    caption: {
      fontSize: 'sm',
      fontWeight: 'normal',
      lineHeight: 'normal',
      letterSpacing: 'normal',
    },

    // Кнопки
    button: {
      fontSize: 'sm',
      fontWeight: 'medium',
      lineHeight: 'snug',
      letterSpacing: 'wide',
    },

    // Криптоадреса и коды
    code: {
      fontFamily: 'mono',
      fontSize: 'sm',
      fontWeight: 'normal',
      lineHeight: 'snug',
      letterSpacing: 'normal',
    },

    // Числовые значения (курсы, суммы)
    numeric: {
      fontFamily: 'numeric',
      fontSize: 'lg',
      fontWeight: 'semibold',
      lineHeight: 'tight',
      letterSpacing: 'normal',
    },

    // Крупные числа (главные суммы)
    numericLarge: {
      fontFamily: 'numeric',
      fontSize: '2xl',
      fontWeight: 'bold',
      lineHeight: 'none',
      letterSpacing: 'tight',
    },
  },
};

export default typography;
