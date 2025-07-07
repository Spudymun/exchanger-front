/**
 * Regex patterns for crypto address validation
 * Moved from hardcoded patterns in crypto.ts to centralized constants
 */

export const CRYPTO_ADDRESS_PATTERNS = {
  BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
  ETH: /^0x[a-fA-F0-9]{40}$/,
  USDT: /^0x[a-fA-F0-9]{40}$/, // USDT uses Ethereum format
  LTC: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1[a-z0-9]{39,59}$/,
} as const;

/**
 * Validation patterns for different data types
 */
export const VALIDATION_REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  CARD_NUMBER: /^\d{16}$/,
} as const;
