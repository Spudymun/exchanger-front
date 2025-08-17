import { securityEnhancedRecipientDataSchema } from '@repo/utils';
import { createValidationResult, type ValidationResult } from '@repo/utils';
import { z } from 'zod';

import type { RecipientData } from '../types';

/**
 * Complex validation functions for composite data structures
 * Updated to use centralized Zod schemas per VALIDATION_ARCHITECTURE_GUIDE.md
 */

/**
 * Validate recipient data for order creation
 * Uses centralized Zod schema instead of custom validation (Rule 20)
 */
export function validateRecipientData(recipientData?: RecipientData): ValidationResult {
  if (!recipientData) {
    return createValidationResult([]);
  }

  const result = securityEnhancedRecipientDataSchema.safeParse(recipientData);

  if (result.success) {
    return createValidationResult([]);
  }

  const errors = result.error.errors.map((err: z.ZodIssue) => err.message);
  return createValidationResult(errors);
}
