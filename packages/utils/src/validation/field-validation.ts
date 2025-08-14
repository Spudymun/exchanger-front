/**
 * Валидация полей формы с next-intl
 */

import { z } from 'zod';

import { NextIntlValidationConfig, VALIDATION_KEYS } from './constants';
import { createNextIntlZodErrorMap } from './core';
import {
  validateSingleEmail,
  validateSinglePassword,
  validateSingleConfirmPassword,
  validateSingleCaptcha,
} from './single-field';
import { isEmptyString } from './validation-utils';

/**
 * Валидирует отдельное поле с использованием next-intl переводов
 */
export function validateFieldWithNextIntl<T extends Record<string, unknown>>(params: {
  validationSchema: z.ZodSchema<T>;
  values: T;
  fieldName: string;
  config: NextIntlValidationConfig;
}): { isValid: boolean; error: string | null } {
  const { validationSchema, values, fieldName, config } = params;

  // First, try ZOD schema validation for the specific field
  const zodValidation = validateFieldWithZodSchema(validationSchema, values, fieldName, config);
  if (zodValidation) {
    return zodValidation;
  }

  // Fallback to legacy field-specific validation
  const fieldValue = values[fieldName as keyof T];
  return validateFieldByType(fieldName, fieldValue, values, config);
}

/**
 * Validates a single field using ZOD schema
 */
function validateFieldWithZodSchema<T extends Record<string, unknown>>(
  validationSchema: z.ZodSchema<T>,
  values: T,
  fieldName: string,
  config: NextIntlValidationConfig
): { isValid: boolean; error: string | null } | null {
  try {
    const result = validationSchema.safeParse(values);

    if (result.success) {
      return { isValid: true, error: null };
    }

    return processFieldErrors(result.error.errors, fieldName, config);
  } catch {
    return null;
  }
}

/**
 * Process ZOD errors for a specific field
 */
function processFieldErrors(
  errors: z.ZodIssue[],
  fieldName: string,
  config: NextIntlValidationConfig
): { isValid: boolean; error: string | null } {
  const fieldErrors = errors.filter(
    error => error.path.length === 1 && error.path[0] === fieldName
  );

  if (fieldErrors.length === 0) {
    return { isValid: true, error: null };
  }

  const errorMap = createNextIntlZodErrorMap(config);
  const firstError = fieldErrors[0];

  if (!firstError) {
    return { isValid: false, error: 'Validation error' };
  }

  const localizedError = errorMap(firstError, {
    defaultError: firstError.message,
    data: undefined,
  });

  return { isValid: false, error: localizedError.message };
}

/**
 * Валидирует поле по его типу
 */
function validateFieldByType<T extends Record<string, unknown>>(
  fieldName: string,
  fieldValue: unknown,
  values: T,
  config: NextIntlValidationConfig
): { isValid: boolean; error: string | null } {
  const specificValidation = validateSpecificFieldTypes(fieldName, fieldValue, values, config);
  if (specificValidation) {
    return specificValidation;
  }

  return validateGenericField(fieldValue, config);
}

/**
 * Валидация специфичных типов полей
 */
function validateSpecificFieldTypes<T extends Record<string, unknown>>(
  fieldName: string,
  fieldValue: unknown,
  values: T,
  config: NextIntlValidationConfig
): { isValid: boolean; error: string | null } | null {
  if (fieldName === 'email') {
    return validateSingleEmail(String(fieldValue), config);
  }

  if (fieldName === 'password') {
    return validateSinglePassword(String(fieldValue), config);
  }

  if (fieldName === 'confirmPassword') {
    return validateSingleConfirmPassword(String(fieldValue), String(values.password), config);
  }

  if (fieldName === 'captcha') {
    return validateSingleCaptcha(String(fieldValue), config);
  }

  return null;
}

/**
 * Валидация общих полей
 */
function validateGenericField(
  fieldValue: unknown,
  config: NextIntlValidationConfig
): { isValid: boolean; error: string | null } {
  if (isEmptyString(fieldValue)) {
    return { isValid: false, error: config.t(VALIDATION_KEYS.REQUIRED) };
  }

  return { isValid: true, error: null };
}
