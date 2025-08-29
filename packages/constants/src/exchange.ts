import { DECIMAL_PRECISION } from './decimal-precision';
import { REQUEST_TIMEOUT_CONSTANTS } from './time-constants';
import { VALIDATION_LIMITS } from './validation';

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
  AMOUNT_TOO_LOW: `Min amount: $${AMOUNT_LIMITS.MIN_USD}`, // English fallback
  AMOUNT_TOO_HIGH: `Max amount: $${AMOUNT_LIMITS.MAX_USD}`, // English fallback
  CURRENCY_INVALID: 'Unsupported cryptocurrency', // English fallback
  // CARD_NUMBER_INVALID removed: use i18n 'validation.cardNumber.invalid' instead
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
export const MIN_EXCHANGE_AMOUNT = VALIDATION_LIMITS.MIN_ORDER_AMOUNT;
export const MAX_EXCHANGE_AMOUNT = VALIDATION_LIMITS.MAX_ORDER_AMOUNT;
export const EXCHANGE_AMOUNT_PRECISION = DECIMAL_PRECISION.CRYPTO_DECIMAL_PLACES;

// API delays for exchange operations
export const API_DELAY_MS = 100;
export const ORDER_CREATION_DELAY_MS = 200;

// Order pagination limits
export const DEFAULT_ORDER_LIMIT = 20;
export const MAX_ORDER_LIMIT = 50;

/**
 * Дефолтные значения для форм обмена
 * Заменяет хардкод в useHeroExchangeForm.ts
 */
export const EXCHANGE_DEFAULTS = {
  /** Валюта по умолчанию для отправки - заменяет хардкод 'USDT' */
  FROM_CURRENCY: 'USDT' as const,
  /** Валюта по умолчанию для получения - заменяет хардкод 'UAH' */
  TO_CURRENCY: 'UAH' as const,
} as const;

export type DefaultFromCurrency = typeof EXCHANGE_DEFAULTS.FROM_CURRENCY;
export type DefaultToCurrency = typeof EXCHANGE_DEFAULTS.TO_CURRENCY;
