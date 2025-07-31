// Centralized Tailwind CSS Preset for ExchangeGO
// Устраняет дублирование 20+ конфигурационных файлов
// Интегрирует design-tokens и семантическую систему

// Constants to avoid duplication
const CARD_COLOR = 'hsl(var(--card))';

// Встроенные дизайн токены для избежания проблем с CommonJS
const designColors = {
  // Brand colors
  brand: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
  },
  // Crypto colors
  bitcoin: '#f7931a',
  ethereum: '#627eea',
  usdt: '#26a17b',
};

module.exports = {
  darkMode: ['class'],
  content: [], // Будет определено в каждом приложении

  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },

    extend: {
      // === DESIGN TOKENS INTEGRATION ===
      colors: {
        // Семантические CSS-переменные (автоматическая поддержка тем)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
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
          DEFAULT: CARD_COLOR,
          foreground: 'hsl(var(--card-foreground))',
        },

        // Design Tokens Brand Colors
        ...designColors,
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },

      // === CUSTOM UTILITIES ===
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        // Кастомные анимации пульсации с уникальными именами (избегаем конфликта с встроенным pulse)
        'heartbeat-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat-normal': 'pulse-normal 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat-fast': 'pulse-fast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat-attention': 'pulse-attention 2.5s ease-in-out infinite',
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
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        // Разные keyframes для разной частоты пульсации (точно по документации)
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'pulse-normal': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'pulse-fast': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        // Кастомная анимация для привлечения внимания
        'pulse-attention': {
          '0%, 100%': { 
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': { 
            opacity: '0.7',
            transform: 'scale(1.05)',
          },
        },
      },

      // === SPACING SYSTEM ===
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },

      // === TYPOGRAPHY ===
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
    },
  },

  plugins: [
    require('tailwindcss-animate'),

    // Custom plugin for form patterns
    function ({ addUtilities, theme }) {
      addUtilities({
        // Form container utilities
        '.form-container': {
          'background-color': CARD_COLOR,
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
          'border-radius': theme('borderRadius.lg'),
          'box-shadow': theme('boxShadow.sm'),
          padding: theme('spacing.6'),
        },

        // Exchange card utilities
        '.exchange-card': {
          'background-color': CARD_COLOR,
          border: '1px solid hsl(var(--border))',
          'border-radius': theme('borderRadius.lg'),
          padding: theme('spacing.4'),
          transition: 'all 0.2s ease-in-out',
        },

        '.exchange-card:hover': {
          'box-shadow': theme('boxShadow.md'),
        },

        // Interactive states
        '.interactive-card': {
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
        },

        '.interactive-card:hover': {
          'background-color': 'hsl(var(--muted))',
          transform: 'translateY(-1px)',
        },

        // Focus utilities
        '.focus-ring': {
          outline: 'none',
          'box-shadow': '0 0 0 2px hsl(var(--ring))',
        },
      });
    },
  ],
};
