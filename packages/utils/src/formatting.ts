import { DECIMAL_PRECISION, PERCENTAGE_CALCULATIONS } from '@repo/constants';

/**
 * Unified formatting utilities to eliminate code duplication
 * Centralizes all number formatting logic from utils layer
 */

/**
 * Format UAH amount with proper decimal places
 * Also used for commission amounts (same precision)
 */
export function formatUahAmount(amount: number): string {
  return amount.toFixed(PERCENTAGE_CALCULATIONS.UAH_ROUNDING_PRECISION);
}

/**
 * Format crypto amount for UI display with limited decimal places
 */
export function formatCryptoAmountForUI(amount: number, maxDecimals: number): string {
  const precision = Math.min(DECIMAL_PRECISION.CRYPTO_DECIMAL_PLACES, maxDecimals);
  return amount.toFixed(precision);
}

/**
 * Convert formatted string back to number (for reverse operations)
 */
export function parseFormattedAmount(formattedAmount: string): number {
  return Number(formattedAmount);
}
