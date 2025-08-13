import {
  createValidationResult,
  mergeValidationResults,
  type ValidationResult,
  validateWithZodSchema,
} from '@repo/utils';
import { emailSchema, passwordSchema } from '@repo/utils';

import type { CreateOrderRequest, CreateUserRequest } from '../types';

import { validateCurrency, validateCryptoAmount } from './business-validators';
import { validateRecipientData } from './composite-validators';

/**
 * Order validation functions combining multiple validation rules
 * Separated from individual validators for better organization
 */

/**
 * Helper to validate email using Zod schema
 */
function validateEmailWithZod(email: string): ValidationResult {
  return validateWithZodSchema(emailSchema, email);
}

/**
 * Helper to validate password using Zod schema
 */
function validatePasswordWithZod(password: string): ValidationResult {
  return validateWithZodSchema(passwordSchema, password);
}

/**
 * Validate complete order creation request
 */
export function validateCreateOrder(request: CreateOrderRequest): ValidationResult {
  // Validate basic data using Zod schemas
  const emailValidation = validateEmailWithZod(request.email);
  const currencyValidation = validateCurrency(request.currency);

  // Validate amount only if currency is valid
  let amountValidation: ValidationResult = createValidationResult([]);
  if (currencyValidation.isValid) {
    amountValidation = validateCryptoAmount(request.cryptoAmount, request.currency);
  }

  // Validate recipient data
  const recipientValidation = validateRecipientData(request.recipientData);

  return mergeValidationResults(
    emailValidation,
    currencyValidation,
    amountValidation,
    recipientValidation
  );
}

/**
 * Validate user creation request
 */
export function validateCreateUser(request: CreateUserRequest): ValidationResult {
  const emailValidation = validateEmailWithZod(request.email);

  // Password validation is optional
  let passwordValidation: ValidationResult = createValidationResult([]);
  if (request.password) {
    passwordValidation = validatePasswordWithZod(request.password);
  }

  return mergeValidationResults(emailValidation, passwordValidation);
}
