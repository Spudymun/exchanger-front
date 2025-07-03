/**
 * Business domain constants
 */

export const USER_ROLES = {
  ADMIN: 'admin', // Только admin-panel
  OPERATOR: 'operator', // apps/web - обработка заявок
  SUPPORT: 'support', // apps/web - техподдержка
  USER: 'user', // Обычные пользователи (клиенты)
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING_VERIFICATION: 'pending_verification',
} as const;

export const ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP: 'stop',
  STOP_LIMIT: 'stop_limit',
} as const;

export const ORDER_STATUSES = {
  PENDING: 'pending',
  OPEN: 'open',
  PARTIALLY_FILLED: 'partially_filled',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

export const TRANSACTION_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  TRANSFER: 'transfer',
} as const;

export const TRANSACTION_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const CURRENCY_TYPES = {
  FIAT: 'fiat',
  CRYPTO: 'crypto',
  STABLE: 'stable',
} as const;

export const SUPPORTED_CURRENCIES = {
  // Fiat
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  RUB: 'RUB',

  // Crypto
  BTC: 'BTC',
  ETH: 'ETH',
  LTC: 'LTC',

  // Stablecoins
  USDT: 'USDT',
  USDC: 'USDC',
  DAI: 'DAI',
} as const;

export const KYC_LEVELS = {
  NONE: 0,
  BASIC: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
} as const;

export const NOTIFICATION_TYPES = {
  ORDER_FILLED: 'order_filled',
  ORDER_CANCELLED: 'order_cancelled',
  DEPOSIT_COMPLETED: 'deposit_completed',
  WITHDRAWAL_COMPLETED: 'withdrawal_completed',
  PRICE_ALERT: 'price_alert',
  SECURITY_ALERT: 'security_alert',
} as const;

// Type exports
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
export type OrderType = (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];
export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];
export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[keyof typeof TRANSACTION_STATUSES];
export type CurrencyType = (typeof CURRENCY_TYPES)[keyof typeof CURRENCY_TYPES];
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[keyof typeof SUPPORTED_CURRENCIES];
export type KycLevel = (typeof KYC_LEVELS)[keyof typeof KYC_LEVELS];
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
