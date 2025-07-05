import { DECIMAL_PRECISION } from './decimal-precision';
import { VALIDATION_BOUNDS } from './validation-bounds';

/**
 * ExchangeGO specific constants
 */

// Лимиты сумм (в USD эквиваленте)
export const AMOUNT_LIMITS = {
  MIN_USD: 10,
  MAX_USD: 5000,
} as const;

// Статусы заявок ExchangeGO
export const EXCHANGE_ORDER_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Конфигурация статусов для UI ExchangeGO
export const EXCHANGE_ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Ожидание оплаты',
    color: 'warning' as const,
    icon: 'clock',
    description: 'Переведите криптовалюту на указанный адрес',
  },
  paid: {
    label: 'Оплачено',
    color: 'info' as const,
    icon: 'check-circle',
    description: 'Платеж получен, заявка в обработке',
  },
  processing: {
    label: 'В обработке',
    color: 'info' as const,
    icon: 'loader',
    description: 'Обрабатывается оператором',
  },
  completed: {
    label: 'Выполнено',
    color: 'success' as const,
    icon: 'check-circle-2',
    description: 'Средства переведены на ваш счет',
  },
  cancelled: {
    label: 'Отменено',
    color: 'destructive' as const,
    icon: 'x-circle',
    description: 'Заявка отменена',
  },
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

  // Safe validators to prevent ReDoS attacks
  CRYPTO_AMOUNT: (() => {
    const cryptoAmountValidator = (amount: string): boolean => {
      // Validate crypto amount format: number with up to 8 decimal places
      if (!/^\d+$/.test(amount.replace('.', ''))) return false;
      const parts = amount.split('.');
      if (parts.length > VALIDATION_BOUNDS.MAX_SPLIT_PARTS) return false;
      if (parts.length === VALIDATION_BOUNDS.MAX_SPLIT_PARTS && parts[VALIDATION_BOUNDS.SINGLE_ELEMENT].length > DECIMAL_PRECISION.CRYPTO_DECIMAL_PLACES) return false;
      return parts[VALIDATION_BOUNDS.MIN_VALUE].length > VALIDATION_BOUNDS.MIN_VALUE && /^\d+$/.test(parts[VALIDATION_BOUNDS.MIN_VALUE]);
    };
    return { test: cryptoAmountValidator };
  })(),

  UAH_AMOUNT: (() => {
    const uahAmountValidator = (amount: string): boolean => {
      // Validate UAH amount format: number with up to 2 decimal places
      if (!/^\d+$/.test(amount.replace('.', ''))) return false;
      const parts = amount.split('.');
      if (parts.length > VALIDATION_BOUNDS.MAX_SPLIT_PARTS) return false;
      if (parts.length === VALIDATION_BOUNDS.MAX_SPLIT_PARTS && parts[VALIDATION_BOUNDS.SINGLE_ELEMENT].length > DECIMAL_PRECISION.UAH_DECIMAL_PLACES) return false;
      return parts[VALIDATION_BOUNDS.MIN_VALUE].length > VALIDATION_BOUNDS.MIN_VALUE && /^\d+$/.test(parts[VALIDATION_BOUNDS.MIN_VALUE]);
    };
    return { test: uahAmountValidator };
  })(),
} as const;

// Сообщения валидации ExchangeGO
export const EXCHANGE_VALIDATION_MESSAGES = {
  AMOUNT_TOO_LOW: `Минимальная сумма: $${AMOUNT_LIMITS.MIN_USD}`,
  AMOUNT_TOO_HIGH: `Максимальная сумма: $${AMOUNT_LIMITS.MAX_USD}`,
  CURRENCY_INVALID: 'Неподдерживаемая криптовалюта',
  CARD_NUMBER_INVALID: 'Некорректный номер карты',
} as const;

// Exchange router constants
export const EXCHANGE_STATUS_PROCESSING = 'processing';
export const EXCHANGE_STATUS_COMPLETED = 'completed';
export const EXCHANGE_STATUS_FAILED = 'failed';

// Exchange request processing
export const EXCHANGE_REQUEST_TIMEOUT_MS = 30000;
export const EXCHANGE_RETRY_ATTEMPTS = 3;
export const EXCHANGE_RETRY_DELAY_MS = 1000;

// Exchange validation
export const MIN_EXCHANGE_AMOUNT = 0.01;
export const MAX_EXCHANGE_AMOUNT = 1000000;
export const EXCHANGE_AMOUNT_PRECISION = 8;

// API delays for exchange operations
export const API_DELAY_MS = 100;
export const ORDER_CREATION_DELAY_MS = 200;

// Order pagination limits
export const DEFAULT_ORDER_LIMIT = 20;
export const MAX_ORDER_LIMIT = 50;
