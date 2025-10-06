/**
 * Rate limiting configuration for ExchangeGO
 */

// Rate limiting конфигурация
export const RATE_LIMITS = {
  CREATE_ORDER: {
    points: 3, // TEMPORARY: Increased for load testing (production: 3-5)
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
  EMAIL_SEND: {
    points: 5, // 5 emails per period
    duration: 600, // 10 minutes
    blockDuration: 600,
  },
} as const;
