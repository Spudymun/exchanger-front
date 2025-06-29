// ExchangeGO Design System - Colors
// Современная цветовая палитра для криптообменника
// Создано: 30 июня 2025

export const colors = {
  // === BRAND COLORS ===
  // Primary: Синий градиент (доверие + технологии)
  primary: {
    50: '#eff6ff', // Очень светлый
    100: '#dbeafe', // Светлый фон
    200: '#bfdbfe', // Светлые элементы
    300: '#93c5fd', // Hover состояния
    400: '#60a5fa', // Active элементы
    500: '#3b82f6', // Основной цвет
    600: '#2563eb', // Кнопки, ссылки
    700: '#1d4ed8', // Темные акценты
    800: '#1e40af', // Темный текст
    900: '#1e3a8a', // Очень темный
    950: '#172554', // Практически черный
  },

  // Secondary: Фиолетовый акцент (инновации + crypto)
  secondary: {
    50: '#faf5ff', // Очень светлый
    100: '#f3e8ff', // Светлый фон
    200: '#e9d5ff', // Светлые элементы
    300: '#d8b4fe', // Hover состояния
    400: '#c084fc', // Active элементы
    500: '#a855f7', // Основной цвет
    600: '#9333ea', // Кнопки, акценты
    700: '#7c3aed', // Темные акценты
    800: '#6b21a8', // Темный текст
    900: '#581c87', // Очень темный
    950: '#3b0764', // Практически черный
  },

  // === SEMANTIC COLORS ===
  // Success: Зеленый (успешные операции, подтверждения)
  success: {
    50: '#f0fdf4', // Фон success уведомлений
    100: '#dcfce7', // Светлый success фон
    200: '#bbf7d0', // Success border
    300: '#86efac', // Success hover
    400: '#4ade80', // Success active
    500: '#22c55e', // Основной success
    600: '#16a34a', // Success кнопки
    700: '#15803d', // Темный success
    800: '#166534', // Success текст
    900: '#14532d', // Очень темный success
    950: '#052e16', // Практически черный
  },

  // Warning: Оранжевый (ожидание, предупреждения)
  warning: {
    50: '#fffbeb', // Фон warning уведомлений
    100: '#fef3c7', // Светлый warning фон
    200: '#fde68a', // Warning border
    300: '#fcd34d', // Warning hover
    400: '#fbbf24', // Warning active
    500: '#f59e0b', // Основной warning
    600: '#d97706', // Warning кнопки
    700: '#b45309', // Темный warning
    800: '#92400e', // Warning текст
    900: '#78350f', // Очень темный warning
    950: '#451a03', // Практически черный
  },

  // Error: Красный (ошибки, отклонения)
  error: {
    50: '#fef2f2', // Фон error уведомлений
    100: '#fee2e2', // Светлый error фон
    200: '#fecaca', // Error border
    300: '#fca5a5', // Error hover
    400: '#f87171', // Error active
    500: '#ef4444', // Основной error
    600: '#dc2626', // Error кнопки
    700: '#b91c1c', // Темный error
    800: '#991b1b', // Error текст
    900: '#7f1d1d', // Очень темный error
    950: '#450a0a', // Практически черный
  },

  // === NEUTRAL COLORS ===
  // Gray: Основная нейтральная палитра
  gray: {
    50: '#f9fafb', // Светлейший фон
    100: '#f3f4f6', // Карточки, секции
    200: '#e5e7eb', // Границы, разделители
    300: '#d1d5db', // Неактивные элементы
    400: '#9ca3af', // Placeholder текст
    500: '#6b7280', // Вторичный текст
    600: '#4b5563', // Основной текст
    700: '#374151', // Заголовки
    800: '#1f2937', // Темный текст
    900: '#111827', // Очень темный
    950: '#030712', // Практически черный
  },

  // === CRYPTO SPECIFIC COLORS ===
  // Bitcoin: Оранжевый
  bitcoin: {
    50: '#fff7ed',
    500: '#f97316', // Основной цвет Bitcoin
    600: '#ea580c',
    900: '#9a3412',
  },

  // Ethereum: Синий
  ethereum: {
    50: '#eff6ff',
    500: '#627eea', // Основной цвет Ethereum
    600: '#4c6ef5',
    900: '#1e40af',
  },

  // USDT: Зеленый
  usdt: {
    50: '#f0fdf4',
    500: '#26a269', // Основной цвет USDT
    600: '#16a34a',
    900: '#14532d',
  },

  // Litecoin: Серебристый
  litecoin: {
    50: '#f8fafc',
    500: '#64748b', // Основной цвет Litecoin
    600: '#475569',
    900: '#1e293b',
  },

  // === GRADIENT DEFINITIONS ===
  gradients: {
    primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    secondary: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    crypto: 'linear-gradient(135deg, #f97316 0%, #3b82f6 50%, #a855f7 100%)',
  },

  // === SPECIAL COLORS ===
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  current: 'currentColor',
};

export default colors;
