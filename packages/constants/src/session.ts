export const SESSION_CONSTANTS = {
  ENVIRONMENTS: {
    MOCK: 'mock',
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
  } as const,

  MIGRATION_STRATEGIES: {
    MOCK_ONLY: 'mock-only',
    PRODUCTION_ONLY: 'production-only',
    GRADUAL: 'gradual',
    WRITE_THROUGH: 'mock-with-write-through',
  } as const,

  REDIS: {
    // ✅ TTL moved to AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS in validation.ts (avoid duplication)
    MAX_RETRIES: 3,
    // ✅ Direct prefixes for multi-app namespace
    WEB_SESSION_PREFIX: 'session:web:',
    ADMIN_SESSION_PREFIX: 'session:admin:',

    // ✅ Redis операционные лимиты с высоким качеством
    REDIS_OPERATION_LIMITS: {
      /** TTL для wallet очередей в секундах (1 час) */
      DEFAULT_TTL_SECONDS: 3600,
      /** Максимальная длина очереди для предотвращения memory overflow */
      MAX_QUEUE_LENGTH: 1000,
      /** Лимит элементов для peek операций */
      DEFAULT_PEEK_LIMIT: 10,
      /** Лимит элементов для статистики очереди */
      STATS_LIMIT: 10,
      /** База данных Redis для wallet очередей (отделена от sessions) */
      QUEUE_DATABASE_INDEX: 1,
      /** Environment variable name для Redis URL */
      REDIS_URL_ENV: 'REDIS_URL',
      /** Таймаут подключения к Redis в миллисекундах */
      CONNECTION_TIMEOUT_MS: 5000,
      /** Максимальное время ожидания операции в Redis */
      OPERATION_TIMEOUT_MS: 3000,
    },

    // ✅ Приоритеты очередей wallet
    QUEUE_PRIORITIES: {
      LOW: 1,
      NORMAL: 5,
      HIGH: 10,
      URGENT: 20,
    } as const,

    // ✅ Значения по умолчанию для очередей
    QUEUE_DEFAULTS: {
      PRIORITY: 'normal' as const,
      INITIAL_TIME: 0,
      EMPTY_SIZE: 0,
      QUEUE_START: 0,
      INDEX_OFFSET: 1,
    } as const,
  } as const,

  DATABASE: {
    // ✅ Environment-based connection limits:
    // - Development: 5 connections × ~20-25 processes (hot-reload) = ~100-125 theoretical
    // - Production: 20 connections × ~3-5 instances = 60-100 connections
    MAX_CONNECTIONS:
      process.env.NODE_ENV === 'production'
        ? 20 // eslint-disable-line no-magic-numbers
        : 5, // eslint-disable-line no-magic-numbers

    // ✅ Таймаут установки нового соединения (в миллисекундах)
    CONNECTION_TIMEOUT: 5000,

    // ✅ Pool timeout - максимальное время ожидания свободного соединения из пула (в миллисекундах)
    // Если все соединения заняты, запрос подождёт это время перед выбросом ошибки P2024
    POOL_TIMEOUT:
      process.env.NODE_ENV === 'production'
        ? 20000 // eslint-disable-line no-magic-numbers
        : 10000, // eslint-disable-line no-magic-numbers
  } as const,

  // ✅ НОВЫЕ константы для application context
  APPLICATION_CONTEXT: {
    WEB: 'web',
    ADMIN: 'admin',
  } as const,
} as const;

export type SessionEnvironment =
  (typeof SESSION_CONSTANTS.ENVIRONMENTS)[keyof typeof SESSION_CONSTANTS.ENVIRONMENTS];

export type SessionMigrationStrategy =
  (typeof SESSION_CONSTANTS.MIGRATION_STRATEGIES)[keyof typeof SESSION_CONSTANTS.MIGRATION_STRATEGIES];

// ✅ НОВЫЙ тип для application context
export type ApplicationContext =
  (typeof SESSION_CONSTANTS.APPLICATION_CONTEXT)[keyof typeof SESSION_CONSTANTS.APPLICATION_CONTEXT];
