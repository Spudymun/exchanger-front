/**
 * Card validation utilities for payment forms
 * Supports Luhn algorithm, BIN detection, and card formatting
 */

import { VALIDATION_LIMITS } from '@repo/constants';

// Constants
const LUHN_DOUBLE_THRESHOLD = 9;
const LUHN_MODULO = 10;
const ASCII_ZERO = 48;

const BIN_LENGTH_4 = 4;
const BIN_LENGTH_6 = 6;

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
  return (
    length >= VALIDATION_LIMITS.CARD_NUMBER_MIN_LENGTH &&
    length <= VALIDATION_LIMITS.CARD_NUMBER_MAX_LENGTH
  );
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
function getCardBrand(cardNumber: string): string {
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
 * Known test card numbers that should be blocked in production
 */
const TEST_CARD_NUMBERS = new Set([
  // Visa test cards
  '4111111111111111',
  '4012888888881881',
  '4000000000000002',
  '4000000000000010',
  '4000000000000028',
  '4000000000000036',
  '4000000000000044',
  '4000000000000059',
  '4000000000000067',
  '4000000000000075',
  '4000000000000083',
  '4000000000000091',

  // Mastercard test cards
  '5555555555554444',
  '5105105105105100',
  '2223003122003222',
  '2223000048400011',

  // American Express test cards
  '378282246310005',
  '371449635398431',
  '378734493671000',

  // Discover test cards
  '6011111111111117',
  '6011000990139424',

  // JCB test cards
  '3530111333300000',
  '3566002020360505',

  // Diners Club test cards
  '30569309025904',
  '38520000023237',
]);

/**
 * Known test BIN ranges that should be blocked
 */
const TEST_BIN_RANGES = [
  // Visa test ranges
  { start: '411111', end: '411111' }, // 4111111111111111
  { start: '401288', end: '401288' }, // 4012888888881881
  { start: '400000', end: '400000' }, // 4000000000000xxx

  // Mastercard test ranges
  { start: '555555', end: '555555' }, // 5555555555554444
  { start: '510510', end: '510510' }, // 5105105105105100
  { start: '222300', end: '222300' }, // 2223003122003222

  // Amex test ranges
  { start: '378282', end: '378282' }, // 378282246310005
  { start: '371449', end: '371449' }, // 371449635398431
  { start: '378734', end: '378734' }, // 378734493671000
];

/**
 * Checks if card number is in test BIN ranges
 */
function isTestBIN(sanitized: string): boolean {
  const bin6 = sanitized.substring(0, BIN_LENGTH_6);
  const bin4 = sanitized.substring(0, BIN_LENGTH_4);

  return TEST_BIN_RANGES.some(range => {
    const binToCheck = range.start.length === BIN_LENGTH_6 ? bin6 : bin4;
    return binToCheck >= range.start && binToCheck <= range.end;
  });
}

/**
 * Validates that card number is not a test card
 */
export function isNotTestCard(cardNumber: string): boolean {
  const sanitized = sanitizeCardNumber(cardNumber);

  // Check exact test card numbers
  if (TEST_CARD_NUMBERS.has(sanitized)) {
    return false;
  }

  // Check test BIN ranges
  if (isTestBIN(sanitized)) {
    return false;
  }

  return true;
}

/**
 * Validates card number length based on brand
 */
export function validateCardLength(cardNumber: string): boolean {
  const sanitized = sanitizeCardNumber(cardNumber);
  const brand = getCardBrand(sanitized);

  return isValidLengthForBrand(sanitized.length, brand);
}
