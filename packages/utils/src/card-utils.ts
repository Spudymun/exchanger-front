/**
 * Card display utilities
 * Следует паттернам validation/card-validation.ts
 */

import { sanitizeCardNumber } from './validation/card-validation';

// Constants (следует паттерну card-validation.ts)
const LAST_FOUR_DIGITS = 4;
const MASKED_CARD_FALLBACK = '****';

/**
 * Маскирует номер карты, показывая только последние 4 цифры
 * Паттерн: как sanitizeCardNumber, но для display
 */
export function maskCardNumber(cardNumber: string): string {
  const sanitized = sanitizeCardNumber(cardNumber);

  if (sanitized.length < LAST_FOUR_DIGITS) {
    return MASKED_CARD_FALLBACK;
  }

  const lastFour = sanitized.slice(-LAST_FOUR_DIGITS);
  return `**** **** **** ${lastFour}`;
}

/**
 * Получает последние 4 цифры карты
 */
export function getLastFourDigits(cardNumber: string): string {
  const sanitized = sanitizeCardNumber(cardNumber);
  return sanitized.slice(-LAST_FOUR_DIGITS) || MASKED_CARD_FALLBACK;
}
