/**
 * Конфигурация BullMQ для Telegram уведомлений
 *
 * @architecture Централизованные константы для очереди уведомлений
 */

// ✅ Константы для избежания magic numbers
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_REDIS_DB = 1;
const RATE_LIMIT_MAX_JOBS = 10;
const RATE_LIMIT_DURATION_MS = 1000;

export const TELEGRAM_QUEUE_CONSTANTS = {
  QUEUE_NAME: 'telegram-notifications',

  RETRY: {
    MAX_ATTEMPTS: 5,
    BASE_DELAY_MS: 60000, // 1 minute
    BACKOFF_TYPE: 'exponential' as const,
  },

  TIMEOUTS: {
    REDIS_OPERATION_MS: 3000,
    TELEGRAM_API_MS: 5000,
  },

  CLEANUP: {
    COMPLETED_TTL_HOURS: 24,
    COMPLETED_MAX_COUNT: 1000,
    FAILED_MAX_COUNT: 500,
  },

  WORKER: {
    /** Количество параллельных jobs в одном worker процессе */
    CONCURRENCY: process.env.TELEGRAM_QUEUE_CONCURRENCY
      ? parseInt(process.env.TELEGRAM_QUEUE_CONCURRENCY, 10)
      : DEFAULT_CONCURRENCY,
    LOCK_DURATION_MS: 30000,
    JOB_TIMEOUT_MS: 60000,
    /** Rate limiting для защиты Telegram API */
    RATE_LIMIT: {
      MAX: RATE_LIMIT_MAX_JOBS,
      DURATION_MS: RATE_LIMIT_DURATION_MS,
    },
  },

  /** Redis database index для BullMQ очереди */
  REDIS_DB: process.env.REDIS_DB_QUEUE
    ? parseInt(process.env.REDIS_DB_QUEUE, 10)
    : DEFAULT_REDIS_DB,
} as const;

export type TelegramQueueConfig = typeof TELEGRAM_QUEUE_CONSTANTS;
