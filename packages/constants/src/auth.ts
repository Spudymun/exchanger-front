/**
 * Централизованные константы для аутентификации
 * Устраняет хардкод в компонентах форм
 */

/**
 * Конфигурация CAPTCHA для форм аутентификации
 */
export const AUTH_CAPTCHA_CONFIG = {
  DIFFICULTY: 'medium' as const,
  HIDE_LABEL: true,
} as const;

/**
 * Конфигурация форм аутентификации
 */
export const AUTH_FORM_CONFIG = {
  VALIDATE_ON_BLUR: true,
} as const;

/**
 * Префиксы ID для элементов форм
 * Обеспечивает уникальность ID в модальных окнах
 */
export const AUTH_FIELD_IDS = {
  LOGIN: {
    EMAIL: 'auth-login-email',
    PASSWORD: 'auth-login-password',
    CAPTCHA: 'auth-login-captcha',
  },
  REGISTER: {
    EMAIL: 'auth-register-email',
    PASSWORD: 'auth-register-password',
    CONFIRM_PASSWORD: 'auth-register-confirm-password',
    CAPTCHA: 'auth-register-captcha',
  },
} as const;

/**
 * Типы для использования в компонентах
 */
export type AuthCaptchaDifficulty = typeof AUTH_CAPTCHA_CONFIG.DIFFICULTY;
export type AuthFieldId = typeof AUTH_FIELD_IDS[keyof typeof AUTH_FIELD_IDS][keyof typeof AUTH_FIELD_IDS[keyof typeof AUTH_FIELD_IDS]];

// УДАЛЕНО: AUTH_NOTIFICATION_MESSAGES
// Теперь используются локализованные переводы из Layout.auth.messages