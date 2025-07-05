/**
 * Rate limiting configuration for ExchangeGO
 */

// Rate limiting конфигурация
export const RATE_LIMITS = {
  CREATE_ORDER: {
    points: 3,
    duration: 3600, // 1 час
    blockDuration: 3600,
  },
  REGISTER: {
    points: 5,
    duration: 86400, // 24 часа
    blockDuration: 86400,
  },
  LOGIN: {
    points: 10,
    duration: 900, // 15 минут
    blockDuration: 900,
  },
  RESET_PASSWORD: {
    points: 3,
    duration: 3600, // 1 час
    blockDuration: 3600,
  },
} as const;

// Ошибки rate limiting
export const RATE_LIMIT_MESSAGES = {
  CREATE_ORDER: 'Превышен лимит создания заявок. Попробуйте через час.',
  REGISTER: 'Превышен лимит регистраций. Попробуйте завтра.',
  LOGIN: 'Слишком много попыток входа. Попробуйте через 15 минут.',
  RESET_PASSWORD: 'Превышен лимит сброса пароля. Попробуйте через час.',
} as const;
