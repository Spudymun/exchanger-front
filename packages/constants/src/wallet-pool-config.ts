/**
 * Конфигурация пула кошельков
 * Centralizes всех настроек согласно Rule 20
 *
 * @description Все значения основаны на анализе бизнес-требований:
 * - MIN_AVAILABLE_THRESHOLDS: Критические пороги для алертов о нехватке кошельков
 * - TIMEOUTS: Обоснованы latency requirements для UI responsiveness
 * - QUEUE_CONFIG: Предотвращает memory overflow при высокой нагрузке
 *
 * ❌ УДАЛЕНО: POOL_SIZES - бесполезные лимиты! Используем ВСЕ кошельки из БД.
 */

// Business-defined constants - обоснованные значения из бизнес-анализа
const BUSINESS_CONSTANTS = {
  // ❌ УДАЛЕНО: POOL_SIZE_* - бесполезные лимиты
  // Используем ВСЕ доступные кошельки из БД без искусственных ограничений

  // Thresholds для алертов о нехватке кошельков
  THRESHOLD_BTC: 3, // Минимум свободных BTC кошельков
  THRESHOLD_ETH: 2, // Минимум свободных ETH кошельков
  THRESHOLD_USDT: 5, // Минимум свободных USDT кошельков
  THRESHOLD_LTC: 2, // Минимум свободных LTC кошельков

  // Timeouts optimized for UX (in milliseconds)
  ALLOCATION_TIMEOUT_MS: 5000, // 5s - maximum for UI responsiveness
  RELEASE_TIMEOUT_MS: 3000, // 3s - faster operation
  QUEUE_PROCESSING_MS: 1000, // 1s - balance between load and latency

  // Queue limits to prevent memory issues
  MAX_QUEUE_SIZE: 100, // Limit to prevent memory overflow
  QUEUE_TIMEOUT_MS: 300000, // 5 minutes - reasonable user wait time
} as const;

// Environment-based configuration with fallbacks
const getEnvNumber = (key: string, fallback: number): number => {
  // eslint-disable-next-line security/detect-object-injection
  const envValue = process.env[key];
  if (!envValue) return fallback;

  const parsed = parseInt(envValue, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getEnvBoolean = (key: string, fallback: boolean): boolean => {
  // eslint-disable-next-line security/detect-object-injection
  const envValue = process.env[key];
  if (!envValue) return fallback;

  return envValue.toLowerCase() === 'true';
};

export const WALLET_POOL_CONFIG = {
  // ❌ УДАЛЕНО: POOL_SIZES - бесполезные искусственные лимиты
  // Используем ВСЕ доступные кошельки из БД без ограничений!

  // Минимальные количества свободных кошельков для алертов
  MIN_AVAILABLE_THRESHOLDS: {
    BTC: getEnvNumber('WALLET_THRESHOLD_BTC', BUSINESS_CONSTANTS.THRESHOLD_BTC),
    ETH: getEnvNumber('WALLET_THRESHOLD_ETH', BUSINESS_CONSTANTS.THRESHOLD_ETH),
    USDT: getEnvNumber('WALLET_THRESHOLD_USDT', BUSINESS_CONSTANTS.THRESHOLD_USDT),
    LTC: getEnvNumber('WALLET_THRESHOLD_LTC', BUSINESS_CONSTANTS.THRESHOLD_LTC),
  },

  // Таймауты (в миллисекундах) - оптимизированы для UX
  TIMEOUTS: {
    ALLOCATION_TIMEOUT: getEnvNumber(
      'WALLET_ALLOCATION_TIMEOUT',
      BUSINESS_CONSTANTS.ALLOCATION_TIMEOUT_MS
    ),
    RELEASE_TIMEOUT: getEnvNumber('WALLET_RELEASE_TIMEOUT', BUSINESS_CONSTANTS.RELEASE_TIMEOUT_MS),
    QUEUE_PROCESSING: getEnvNumber(
      'WALLET_QUEUE_PROCESSING',
      BUSINESS_CONSTANTS.QUEUE_PROCESSING_MS
    ),
  },

  // Настройки очереди - предотвращение memory overflow
  QUEUE_CONFIG: {
    MAX_QUEUE_SIZE: getEnvNumber('WALLET_MAX_QUEUE_SIZE', BUSINESS_CONSTANTS.MAX_QUEUE_SIZE),
    QUEUE_TIMEOUT: getEnvNumber('WALLET_QUEUE_TIMEOUT', BUSINESS_CONSTANTS.QUEUE_TIMEOUT_MS),
    PRIORITY_PROCESSING: getEnvBoolean('WALLET_PRIORITY_PROCESSING', true),
  },

  // Настройки email уведомлений
  EMAIL_CONSTANTS: {
    WALLET_EXPIRY_HOURS: 24, // Время действия кошелька в часах
  },

  // Режимы работы
  ALLOCATION_MODES: {
    IMMEDIATE: 'immediate', // Немедленное выделение или MOCK
    QUEUE_ONLY: 'queue', // Только через очередь
    HYBRID: 'hybrid', // Комбинированный режим
  },

  // Настройки по умолчанию
  DEFAULT_MODE: 'immediate' as const,
  ENABLE_QUEUE: true,
  ENABLE_STATS: true,
} as const;

export type WalletPoolMode =
  (typeof WALLET_POOL_CONFIG.ALLOCATION_MODES)[keyof typeof WALLET_POOL_CONFIG.ALLOCATION_MODES];
