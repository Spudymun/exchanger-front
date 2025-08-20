/**
 * Card validation utilities for payment forms
 * Supports Luhn algorithm, BIN detection, and card formatting
 */

// Constants
const CARD_MIN_LENGTH = 13;
const CARD_MAX_LENGTH = 19;
const LUHN_DOUBLE_THRESHOLD = 9;
const LUHN_MODULO = 10;
const ASCII_ZERO = 48;

const VISA_LENGTH_13 = 13;
const VISA_LENGTH_16 = 16;
const VISA_LENGTH_19 = 19;
const MASTERCARD_LENGTH = 16;
const AMEX_LENGTH = 15;
const DISCOVER_LENGTH = 16;
const JCB_LENGTH_15 = 15;
const JCB_LENGTH_16 = 16;
const DINERS_LENGTH = 14;

/**
 * Sanitizes card number by removing all non-digit characters
 */
export function sanitizeCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\D/g, '');
}

/**
 * Internal function to validate card number length range
 */
function isValidCardNumberLength(length: number): boolean {
  return length >= CARD_MIN_LENGTH && length <= CARD_MAX_LENGTH;
}

/**
 * Internal function to process a single digit for Luhn algorithm
 */
function processLuhnDigit(digit: number, isEvenPosition: boolean): number {
  if (!isEvenPosition) {
    return digit;
  }

  const doubled = digit * 2;
  return doubled > LUHN_DOUBLE_THRESHOLD ? doubled - LUHN_DOUBLE_THRESHOLD : doubled;
}

/**
 * Calculate Luhn sum for card digits
 */
function calculateLuhnSum(sanitized: string): number {
  let sum = 0;
  let isEvenPosition = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    const charCode = sanitized.charCodeAt(i);
    const digit = charCode - ASCII_ZERO;
    sum += processLuhnDigit(digit, isEvenPosition);
    isEvenPosition = !isEvenPosition;
  }

  return sum;
}

/**
 * Validates card number using Luhn algorithm
 */
export function luhnCheck(cardNumber: string): boolean {
  const sanitized = sanitizeCardNumber(cardNumber);

  if (!isValidCardNumberLength(sanitized.length)) {
    return false;
  }

  const sum = calculateLuhnSum(sanitized);
  return sum % LUHN_MODULO === 0;
}

/**
 * Detects Visa cards
 */
function isVisa(sanitized: string): boolean {
  return sanitized.startsWith('4');
}

/**
 * Detects Mastercard
 */
function isMastercard(sanitized: string): boolean {
  return /^5[1-5]/.test(sanitized) || /^2[2-7]/.test(sanitized);
}

/**
 * Detects American Express
 */
function isAmex(sanitized: string): boolean {
  return /^3[47]/.test(sanitized);
}

/**
 * Card brand detection based on BIN patterns
 */
export function getCardBrand(cardNumber: string): string {
  const sanitized = sanitizeCardNumber(cardNumber);

  if (isVisa(sanitized)) return 'visa';
  if (isMastercard(sanitized)) return 'mastercard';
  if (isAmex(sanitized)) return 'amex';
  if (/^6011|^64[4-9]|^65/.test(sanitized)) return 'discover';
  if (/^35|^2131|^1800/.test(sanitized)) return 'jcb';
  if (/^30[0-5]|^36|^38/.test(sanitized)) return 'diners';

  return 'unknown';
}

/**
 * Check if length is valid for Visa
 */
function isValidVisaLength(length: number): boolean {
  return length === VISA_LENGTH_13 || length === VISA_LENGTH_16 || length === VISA_LENGTH_19;
}

/**
 * Check if length is valid for JCB
 */
function isValidJcbLength(length: number): boolean {
  return length === JCB_LENGTH_15 || length === JCB_LENGTH_16;
}

/**
 * Check if length is valid for specific brand
 */
function isValidLengthForBrand(length: number, brand: string): boolean {
  if (brand === 'visa') return isValidVisaLength(length);
  if (brand === 'mastercard') return length === MASTERCARD_LENGTH;
  if (brand === 'amex') return length === AMEX_LENGTH;
  if (brand === 'discover') return length === DISCOVER_LENGTH;
  if (brand === 'jcb') return isValidJcbLength(length);
  if (brand === 'diners') return length === DINERS_LENGTH;

  return isValidCardNumberLength(length);
}

/**
 * Validates card number length based on brand
 */
export function validateCardLength(cardNumber: string): boolean {
  const sanitized = sanitizeCardNumber(cardNumber);
  const brand = getCardBrand(sanitized);

  return isValidLengthForBrand(sanitized.length, brand);
}

/**
 * Formats card number with spaces for display
 */
export function formatCardNumber(cardNumber: string): string {
  const sanitized = sanitizeCardNumber(cardNumber);
  const brand = getCardBrand(sanitized);

  // American Express: XXXX XXXXXX XXXXX
  if (brand === 'amex') {
    return sanitized.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  }

  // Diners Club: XXXX XXXXXX XXXX
  if (brand === 'diners') {
    return sanitized.replace(/(\d{4})(\d{6})(\d{4})/, '$1 $2 $3');
  }

  // Default: XXXX XXXX XXXX XXXX
  return sanitized.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Collect validation errors for card number
 */
function collectCardErrors(sanitized: string): string[] {
  const errors: string[] = [];

  if (sanitized.length === 0) {
    errors.push('CARD_NUMBER_REQUIRED');
    return errors;
  }

  if (sanitized.length < CARD_MIN_LENGTH) {
    errors.push('CARD_NUMBER_TOO_SHORT');
  }

  if (sanitized.length > CARD_MAX_LENGTH) {
    errors.push('CARD_NUMBER_TOO_LONG');
  }

  return errors;
}

/**
 * Complete card validation combining all checks
 */
export function validateCard(cardNumber: string): {
  isValid: boolean;
  brand: string;
  errors: string[];
} {
  const sanitized = sanitizeCardNumber(cardNumber);
  const errors = collectCardErrors(sanitized);

  if (errors.length > 0) {
    return { isValid: false, brand: 'unknown', errors };
  }

  const brand = getCardBrand(sanitized);

  if (!validateCardLength(sanitized)) {
    errors.push('CARD_NUMBER_INVALID_LENGTH');
  }

  if (!luhnCheck(sanitized)) {
    errors.push('CARD_NUMBER_INVALID');
  }

  return {
    isValid: errors.length === 0,
    brand,
    errors,
  };
}
