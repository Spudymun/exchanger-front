import { VALIDATION_BOUNDS } from '@repo/constants';

/**
 * Validation helper utilities to eliminate pattern duplication
 * Centralizes validation result creation logic
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Create validation result from errors array
 * Eliminates duplication of "errors.length === VALIDATION_BOUNDS.MIN_VALUE" check
 */
export function createValidationResult(errors: string[]): ValidationResult {
  return {
    isValid: errors.length === VALIDATION_BOUNDS.MIN_VALUE,
    errors,
  };
}

/**
 * Create successful validation result
 */
export function createSuccessResult(): ValidationResult {
  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Create failed validation result with single error
 */
export function createErrorResult(error: string): ValidationResult {
  return {
    isValid: false,
    errors: [error],
  };
}

/**
 * Merge multiple validation results
 */
export function mergeValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(result => result.errors);
  return createValidationResult(allErrors);
}

/**
 * Add error to existing validation result
 */
export function addErrorToResult(result: ValidationResult, error: string): ValidationResult {
  return createValidationResult([...result.errors, error]);
}
