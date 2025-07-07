import { VALIDATION_PATTERNS, VALIDATION_MESSAGES, VALIDATION_BOUNDS } from '@repo/constants';

/**
 * Basic validation functions for common data types
 * Separated from complex business validation logic
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Create validation result from errors array
 */
function createValidationResult(errors: string[]): ValidationResult {
  return {
    isValid: errors.length === VALIDATION_BOUNDS.MIN_VALUE,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push(VALIDATION_MESSAGES.EMAIL_REQUIRED);
  } else if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
    errors.push(VALIDATION_MESSAGES.EMAIL_INVALID);
  }

  return createValidationResult(errors);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push(VALIDATION_MESSAGES.PASSWORD_REQUIRED);
  } else if (!VALIDATION_PATTERNS.PASSWORD.test(password)) {
    errors.push(VALIDATION_MESSAGES.PASSWORD_WEAK);
  }

  return createValidationResult(errors);
}
