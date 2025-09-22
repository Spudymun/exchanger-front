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
 * Email provider types для всех email сервисов
 * @description Централизованный список всех поддерживаемых email провайдеров
 */
export const EMAIL_PROVIDER_TYPES = {
  SENDGRID: 'sendgrid',
  RESEND: 'resend',
  GMAIL: 'gmail',
  MOCK: 'mock',
} as const;

/**
 * Массив всех email провайдеров для использования в enum и валидации
 */
export const EMAIL_PROVIDERS = Object.values(EMAIL_PROVIDER_TYPES);

/**
 * TypeScript тип для email провайдеров
 */
export type EmailProviderType = (typeof EMAIL_PROVIDER_TYPES)[keyof typeof EMAIL_PROVIDER_TYPES];

/**
 * Типы SMTP провайдеров
 */
export type SmtpProviderName = 'gmail';
