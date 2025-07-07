import { EXCHANGE_VALIDATION_PATTERNS, EXCHANGE_VALIDATION_MESSAGES } from '@repo/constants';
import { createValidationResult, type ValidationResult } from '@repo/utils';

import type { RecipientData } from '../types';

/**
 * Complex validation functions for composite data structures
 * Separated from simple validators for better organization
 */

/**
 * Validate recipient data for order creation
 */
export function validateRecipientData(recipientData?: RecipientData): ValidationResult {
  const errors: string[] = [];

  if (
    recipientData?.cardNumber &&
    !EXCHANGE_VALIDATION_PATTERNS.CARD_NUMBER.test(recipientData.cardNumber)
  ) {
    errors.push(EXCHANGE_VALIDATION_MESSAGES.CARD_NUMBER_INVALID);
  }

  return createValidationResult(errors);
}
