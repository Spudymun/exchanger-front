import {
  CRYPTOCURRENCIES,
  EXCHANGE_VALIDATION_MESSAGES,
  VALIDATION_MESSAGES,
  VALIDATION_BOUNDS,
} from '@repo/constants';
import { createValidationResult, type ValidationResult } from '@repo/utils';

import type { CryptoCurrency } from '../types';

import { isAmountWithinLimits } from './calculations';

/**
 * Business-specific validation functions for exchange operations
 * Separated from basic validators for better organization
 */

/**
 * Validate cryptocurrency type
 */
export function validateCurrency(currency: string): ValidationResult {
  const errors: string[] = [];

  if (!CRYPTOCURRENCIES.includes(currency as CryptoCurrency)) {
    errors.push(EXCHANGE_VALIDATION_MESSAGES.CURRENCY_INVALID);
  }

  return createValidationResult(errors);
}

/**
 * Validate cryptocurrency amount for exchange
 */
export function validateCryptoAmount(amount: number, currency: CryptoCurrency): ValidationResult {
  const errors: string[] = [];

  if (!amount || amount <= VALIDATION_BOUNDS.MIN_VALUE) {
    errors.push(VALIDATION_MESSAGES.AMOUNT_INVALID);
  } else {
    const limitCheck = isAmountWithinLimits(amount, currency);
    if (!limitCheck.isValid && limitCheck.reason) {
      errors.push(limitCheck.reason);
    }
  }

  return createValidationResult(errors);
}
