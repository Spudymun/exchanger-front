import { DECIMAL_PRECISION } from './decimal-precision';
import { REQUEST_TIMEOUT_CONSTANTS } from './time-constants';
import { VALIDATION_BOUNDS } from './validation-bounds';

/**
 * ExchangeGO specific constants
 */

// Лимиты сумм (в USD эквиваленте)
export const AMOUNT_LIMITS = {
  MIN_USD: 10,
  MAX_USD: 5000,
} as const;

// Валидационные ограничения ExchangeGO
export const EXCHANGE_VALIDATION_LIMITS = {
  ORDER_ID_LENGTH: 36,
  CRYPTO_ADDRESS_MAX_LENGTH: 100,
  CARD_NUMBER_LENGTH: 16,
} as const;

// Regex паттерны ExchangeGO
export const EXCHANGE_VALIDATION_PATTERNS = {
  CARD_NUMBER: /^\d{16}$/,
} as const;

// Сообщения валидации ExchangeGO
export const EXCHANGE_VALIDATION_MESSAGES = {
  AMOUNT_TOO_LOW: `Минимальная сумма: $${AMOUNT_LIMITS.MIN_USD}`,
  AMOUNT_TOO_HIGH: `Максимальная сумма: $${AMOUNT_LIMITS.MAX_USD}`,
  CURRENCY_INVALID: 'Неподдерживаемая криптовалюта',
  CARD_NUMBER_INVALID: 'Некорректный номер карты',
} as const;

// Exchange router constants (derived from centralized order statuses)
export const EXCHANGE_STATUS_PROCESSING = 'processing';
export const EXCHANGE_STATUS_COMPLETED = 'completed';
export const EXCHANGE_STATUS_FAILED = 'failed';

// Exchange request processing
export const EXCHANGE_REQUEST_TIMEOUT_MS = REQUEST_TIMEOUT_CONSTANTS.EXCHANGE_REQUEST_TIMEOUT;
export const EXCHANGE_RETRY_ATTEMPTS = 3;
export const EXCHANGE_RETRY_DELAY_MS = 1000;

// Exchange validation
export const MIN_EXCHANGE_AMOUNT = VALIDATION_BOUNDS.MIN_ORDER_AMOUNT;
export const MAX_EXCHANGE_AMOUNT = VALIDATION_BOUNDS.MAX_ORDER_AMOUNT;
export const EXCHANGE_AMOUNT_PRECISION = DECIMAL_PRECISION.CRYPTO_DECIMAL_PLACES;

// API delays for exchange operations
export const API_DELAY_MS = 100;
export const ORDER_CREATION_DELAY_MS = 200;

// Order pagination limits
export const DEFAULT_ORDER_LIMIT = 20;
export const MAX_ORDER_LIMIT = 50;
