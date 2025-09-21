/**
 * SMTP Provider configurations for email services
 * Централизованные константы для SMTP подключений
 *
 * @description Конфигурации SMTP провайдеров для отправки email через различные сервисы
 * @category Email Service
 * @since 1.0.0
 */

/**
 * Gmail SMTP configuration defaults
 * @description Базовые настройки SMTP для Gmail (могут переопределяться environment variables)
 * @see https://support.google.com/mail/answer/7126229
 */
export const GMAIL_SMTP_DEFAULTS = {
  HOST: 'smtp.gmail.com',
  PORT: 587,
  SECURE: false, // true для 465, false для других портов
  TLS_PORT: 465,
} as const;

/**
 * Gmail SMTP limits and requirements
 */
export const GMAIL_SMTP_LIMITS = {
  MAX_EMAILS_PER_DAY: 500, // Лимит для обычных аккаунтов Gmail
} as const;

/**
 * Gmail SMTP requirements
 */
export const GMAIL_SMTP_REQUIREMENTS = {
  APP_PASSWORD_REQUIRED: true,
  TWO_FACTOR_AUTH_REQUIRED: true,
  DESCRIPTION: 'Gmail SMTP service for free email sending',
} as const;

/**
 * Gmail domain pattern
 */
export const GMAIL_DOMAIN = '@gmail.com' as const;

/**
 * Типы SMTP провайдеров
 */
export type SmtpProviderName = 'gmail';
