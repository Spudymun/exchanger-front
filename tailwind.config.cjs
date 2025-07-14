// ExchangeGO Tailwind Configuration
// Интеграция с дизайн-системой
// Создано: 30 июня 2025

// Импортируем design tokens
// Временно используем CommonJS импорт для совместимости с Tailwind
const designTokens = {
  colors: {
    // === BRAND COLORS ===
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
    },

    // === SEMANTIC COLORS ===
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },

    // === CRYPTO SPECIFIC COLORS ===
    bitcoin: {
      50: '#fff7ed',
      500: '#f97316',
      600: '#ea580c',
      900: '#9a3412',
    },
    ethereum: {
      50: '#eff6ff',
      500: '#627eea',
      600: '#4c6ef5',
      900: '#1e40af',
    },
    usdt: {
      50: '#f0fdf4',
      500: '#26a269',
      600: '#16a34a',
      900: '#14532d',
    },
    litecoin: {
      50: '#f8fafc',
      500: '#64748b',
      600: '#475569',
      900: '#1e293b',
    },

    // === SPECIAL COLORS ===
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
    current: 'currentColor',
  },

  typography: {
    fontFamily: {
      sans: [
        'Inter',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ],
      display: ['Inter', 'system-ui', 'sans-serif'],
      mono: [
        '"JetBrains Mono"',
        '"SF Mono"',
        'Consolas',
        '"Liberation Mono"',
        'Menlo',
        'Monaco',
        'monospace',
      ],
      numeric: ['Inter', '"SF Pro Display"', 'system-ui', 'sans-serif'],
    },
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Контент для сканирования классов
  content: [
    // Приложения
    './apps/**/*.{js,ts,jsx,tsx,mdx}',

    // Пакеты
    './packages/ui/src/**/*.{js,ts,jsx,tsx}',
    './packages/ui/src/**/*.stories.{js,ts,jsx,tsx}',
    './packages/**/*.{js,ts,jsx,tsx}',

    // Корневые файлы
    './src/**/*.{js,ts,jsx,tsx,mdx}',

    // Storybook
    './.storybook/**/*.{js,ts,jsx,tsx}',
  ],

  // Темная тема
  darkMode: ['class'],

  theme: {
    extend: {
      // === ЦВЕТА ===
      colors: {
        ...designTokens.colors,

        // Алиасы для shadcn/ui совместимости
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      // === ТИПОГРАФИКА ===
      fontFamily: designTokens.typography.fontFamily,

      // === РАЗМЕРЫ И ОТСТУПЫ ===
      spacing: {
        0.5: '0.125rem',
        1.5: '0.375rem',
        2.5: '0.625rem',
        3.5: '0.875rem',
      },

      // === АНИМАЦИИ ===
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 1s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },

      // === ТЕНИ ===
      boxShadow: {
        primary: '0 10px 15px -3px rgb(59 130 246 / 0.1), 0 4px 6px -4px rgb(59 130 246 / 0.1)',
        success: '0 10px 15px -3px rgb(34 197 94 / 0.1), 0 4px 6px -4px rgb(34 197 94 / 0.1)',
        warning: '0 10px 15px -3px rgb(245 158 11 / 0.1), 0 4px 6px -4px rgb(245 158 11 / 0.1)',
        error: '0 10px 15px -3px rgb(239 68 68 / 0.1), 0 4px 6px -4px rgb(239 68 68 / 0.1)',
      },

      // === ГРАДИЕНТЫ ===
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        'gradient-success': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'gradient-crypto': 'linear-gradient(135deg, #f97316 0%, #3b82f6 50%, #a855f7 100%)',
      },

      // === КОНТЕЙНЕРЫ ===
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },

      // === Z-INDEX ===
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
      },
    },
  },

  // Плагины
  plugins: [
    // require('tailwindcss-animate'), // Временно отключено для линтинга

    // Кастомные утилиты для ExchangeGO
    function ({ addUtilities }) {
      const newUtilities = {
        // Градиентный текст
        '.text-gradient-primary': {
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },

        // Glassmorphism эффект
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },

        // Безопасная область для мобильных
        '.safe-area-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-area-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },

        // Мобильные touch targets
        '.touch-target': {
          'min-height': '44px',
          'min-width': '44px',
        },

        // Мобильный контейнер
        '.mobile-container': {
          'width': '100%',
          'max-width': '100vw',
          'overflow-x': 'hidden',
        },

        // Предотвращение горизонтального скролла
        '.no-scroll-x': {
          'overflow-x': 'hidden',
          'max-width': '100vw',
        },
      };

      addUtilities(newUtilities);
    },
  ],
};
