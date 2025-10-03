/**
 * Конфигурация пула кошельков
 * Centralizes всех настроек согласно Rule 20
 *
 * @description Все значения основаны на анализе бизнес-требований:
 * - MIN_AVAILABLE_THRESHOLDS: Критические пороги для алертов о нехватке кошельков
 * - TIMEOUTS: Обоснованы latency requirements для UI responsiveness
 *
 * ❌ УДАЛЕНО: POOL_SIZES - бесполезные лимиты! Используем ВСЕ кошельки из БД.
 * ❌ УДАЛЕНО: QUEUE_CONFIG - dead code, очереди не используются
 */

// Business-defined constants - обоснованные значения из бизнес-анализа
const BUSINESS_CONSTANTS = {
  // Thresholds для алертов о нехватке кошельков
  THRESHOLD_BTC: 3, // Минимум свободных BTC кошельков
  THRESHOLD_ETH: 2, // Минимум свободных ETH кошельков
  THRESHOLD_USDT: 5, // Минимум свободных USDT кошельков
  THRESHOLD_LTC: 2, // Минимум свободных LTC кошельков

  // Timeouts optimized for UX (in milliseconds)
  ALLOCATION_TIMEOUT_MS: 5000, // 5s - maximum for UI responsiveness
  RELEASE_TIMEOUT_MS: 3000, // 3s - faster operation
} as const;

// Environment-based configuration with fallbacks
const getEnvNumber = (key: string, fallback: number): number => {
  // eslint-disable-next-line security/detect-object-injection
  const envValue = process.env[key];
  if (!envValue) return fallback;

  const parsed = parseInt(envValue, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const WALLET_POOL_CONFIG = {
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
  },

  // Настройки email уведомлений
  EMAIL_CONSTANTS: {
    WALLET_EXPIRY_HOURS: 24, // Время действия кошелька в часах
  },

  // Настройки по умолчанию
  DEFAULT_MODE: 'immediate' as const,
  ENABLE_QUEUE: false, // ❌ Очередь отключена - dead code удален
  ENABLE_STATS: true,
} as const;
