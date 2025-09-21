/**
 * Email Service Error Constants
 * Централизованные константы ошибок для email провайдеров
 *
 * @description Константы ошибок для SMTP и API email провайдеров
 * @category Email Service
 * @since 1.0.0
 */

/**
 * Категории ошибок email провайдеров
 */
export const EMAIL_ERROR_CATEGORIES = {
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  EMAIL_VALIDATION_ERROR: 'EMAIL_VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Сообщения ошибок для email провайдеров
 */
export const EMAIL_ERROR_MESSAGES = {
  GMAIL_ADDRESS_REQUIRED: 'Valid Gmail email address is required',
  GMAIL_DOMAIN_REQUIRED: 'Gmail email address must end with @gmail.com',
  APP_PASSWORD_REQUIRED: 'Gmail app password is required and must be a non-empty string',
  FROM_NAME_REQUIRED: 'From name is required and must be a non-empty string',
  CONNECTION_TEST_FAILED: 'Gmail SMTP connection test failed',
  CONNECTION_TEST_SUCCESS: 'Gmail SMTP connection test successful',
  TRANSPORTER_CLOSED: 'Gmail SMTP transporter closed',
} as const;

/**
 * Конфигурация retry для различных типов ошибок
 */
export const EMAIL_ERROR_RETRY_CONFIG = {
  [EMAIL_ERROR_CATEGORIES.AUTHENTICATION_ERROR]: false,
  [EMAIL_ERROR_CATEGORIES.CONNECTION_ERROR]: true,
  [EMAIL_ERROR_CATEGORIES.RATE_LIMIT_ERROR]: true,
  [EMAIL_ERROR_CATEGORIES.EMAIL_VALIDATION_ERROR]: false,
  [EMAIL_ERROR_CATEGORIES.UNKNOWN_ERROR]: false,
} as const;

/**
 * Типы для TypeScript
 */
export type EmailErrorCategory =
  (typeof EMAIL_ERROR_CATEGORIES)[keyof typeof EMAIL_ERROR_CATEGORIES];
export type EmailErrorMessage = (typeof EMAIL_ERROR_MESSAGES)[keyof typeof EMAIL_ERROR_MESSAGES];
