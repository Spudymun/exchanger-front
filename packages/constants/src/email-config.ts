/**
 * Email Service Configuration Constants
 * Централизованная конфигурация системы отправки email
 *
 * @description Константы для управления поведением email отправки в разных окружениях
 * @category Email Service
 * @since 1.0.0
 */

/**
 * Типы email уведомлений в системе
 */
export const EMAIL_NOTIFICATION_TYPES = {
  CRYPTO_ADDRESS: 'CRYPTO_ADDRESS', // Отправка адреса для пополнения
  ORDER_STATUS: 'ORDER_STATUS', // Изменение статуса заявки
  QUEUE_READY: 'QUEUE_READY', // Заявка из очереди получила адрес
  SYSTEM_ALERT: 'SYSTEM_ALERT', // Системные уведомления
  MARKETING: 'MARKETING', // Маркетинговые email
} as const;

export type EmailNotificationType =
  (typeof EMAIL_NOTIFICATION_TYPES)[keyof typeof EMAIL_NOTIFICATION_TYPES];

/**
 * Конфигурация включения/отключения email отправки
 * Позволяет гибко управлять отправкой email по типам и окружениям
 */
export const EMAIL_SENDING_CONFIG = {
  /**
   * Глобальное включение/отключение всех email
   * При false - все email будут отключены независимо от других настроек
   */
  GLOBAL_ENABLED: {
    development: true, // В разработке по умолчанию отключено
    staging: true, // В staging включено для тестирования
    production: true, // В production всегда включено
  },

  /**
   * Детальная конфигурация по типам уведомлений
   */
  BY_TYPE: {
    [EMAIL_NOTIFICATION_TYPES.CRYPTO_ADDRESS]: {
      development: true, // ✅ ВКЛЮЧЕНО для тестирования в разработке
      staging: true,
      production: true,
      description: 'Email с адресом для пополнения криптовалюты',
    },

    [EMAIL_NOTIFICATION_TYPES.ORDER_STATUS]: {
      development: false, // Отключено в разработке
      staging: true,
      production: true,
      description: 'Уведомления об изменении статуса заявки',
    },

    [EMAIL_NOTIFICATION_TYPES.QUEUE_READY]: {
      development: false, // Отключено в разработке
      staging: true,
      production: true,
      description: 'Уведомление о выделении адреса для заявки из очереди',
    },

    [EMAIL_NOTIFICATION_TYPES.SYSTEM_ALERT]: {
      development: true, // Системные алерты важны даже в разработке
      staging: true,
      production: true,
      description: 'Критические системные уведомления',
    },

    [EMAIL_NOTIFICATION_TYPES.MARKETING]: {
      development: false, // Маркетинг отключен в разработке
      staging: false,
      production: true,
      description: 'Маркетинговые и промо email',
    },
  },

  /**
   * Конфигурация fallback поведения
   */
  FALLBACK: {
    /**
     * Что делать если email отправка отключена
     */
    DISABLED_ACTION: 'LOG_ONLY', // LOG_ONLY | SILENT | THROW_ERROR

    /**
     * Логировать ли отключенные email в консоль
     */
    LOG_DISABLED_EMAILS: true,

    /**
     * Префикс для логов отключенных email
     */
    LOG_PREFIX: '[EMAIL_DISABLED]',
  },
} as const;

/**
 * Типы для TypeScript
 */
export type Environment = keyof typeof EMAIL_SENDING_CONFIG.GLOBAL_ENABLED;
export type EmailTypeConfig = (typeof EMAIL_SENDING_CONFIG.BY_TYPE)[EmailNotificationType];
export type FallbackAction = typeof EMAIL_SENDING_CONFIG.FALLBACK.DISABLED_ACTION;

/**
 * Утилитарные константы для проверки статуса email
 * Упрощенные константы для избежания сложности функций
 */

/**
 * Предопределенные проверки для development окружения
 */
export const EMAIL_ENABLED_IN_DEVELOPMENT = {
  GLOBAL: EMAIL_SENDING_CONFIG.GLOBAL_ENABLED.development,
  CRYPTO_ADDRESS: EMAIL_SENDING_CONFIG.BY_TYPE.CRYPTO_ADDRESS.development,
  ORDER_STATUS: EMAIL_SENDING_CONFIG.BY_TYPE.ORDER_STATUS.development,
  QUEUE_READY: EMAIL_SENDING_CONFIG.BY_TYPE.QUEUE_READY.development,
  SYSTEM_ALERT: EMAIL_SENDING_CONFIG.BY_TYPE.SYSTEM_ALERT.development,
  MARKETING: EMAIL_SENDING_CONFIG.BY_TYPE.MARKETING.development,
} as const;

/**
 * Предопределенные проверки для staging окружения
 */
export const EMAIL_ENABLED_IN_STAGING = {
  GLOBAL: EMAIL_SENDING_CONFIG.GLOBAL_ENABLED.staging,
  CRYPTO_ADDRESS: EMAIL_SENDING_CONFIG.BY_TYPE.CRYPTO_ADDRESS.staging,
  ORDER_STATUS: EMAIL_SENDING_CONFIG.BY_TYPE.ORDER_STATUS.staging,
  QUEUE_READY: EMAIL_SENDING_CONFIG.BY_TYPE.QUEUE_READY.staging,
  SYSTEM_ALERT: EMAIL_SENDING_CONFIG.BY_TYPE.SYSTEM_ALERT.staging,
  MARKETING: EMAIL_SENDING_CONFIG.BY_TYPE.MARKETING.staging,
} as const;

/**
 * Предопределенные проверки для production окружения
 */
export const EMAIL_ENABLED_IN_PRODUCTION = {
  GLOBAL: EMAIL_SENDING_CONFIG.GLOBAL_ENABLED.production,
  CRYPTO_ADDRESS: EMAIL_SENDING_CONFIG.BY_TYPE.CRYPTO_ADDRESS.production,
  ORDER_STATUS: EMAIL_SENDING_CONFIG.BY_TYPE.ORDER_STATUS.production,
  QUEUE_READY: EMAIL_SENDING_CONFIG.BY_TYPE.QUEUE_READY.production,
  SYSTEM_ALERT: EMAIL_SENDING_CONFIG.BY_TYPE.SYSTEM_ALERT.production,
  MARKETING: EMAIL_SENDING_CONFIG.BY_TYPE.MARKETING.production,
} as const;

/**
 * Константы для логирования
 */
export const EMAIL_LOG_MESSAGES = {
  GLOBALLY_DISABLED: (env: Environment) =>
    `${EMAIL_SENDING_CONFIG.FALLBACK.LOG_PREFIX} Email отправка глобально отключена для окружения: ${env}`,

  TYPE_DISABLED: (type: EmailNotificationType, env: Environment) =>
    `${EMAIL_SENDING_CONFIG.FALLBACK.LOG_PREFIX} Email типа "${type}" отключен для окружения: ${env}`,

  WOULD_SEND: (type: EmailNotificationType, to: string) =>
    `${EMAIL_SENDING_CONFIG.FALLBACK.LOG_PREFIX} Был бы отправлен email типа "${type}" на: ${to}`,
} as const;
