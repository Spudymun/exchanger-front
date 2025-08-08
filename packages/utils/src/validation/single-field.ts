/**
 * Валидация отдельных полей
 */

import { VALIDATION_LIMITS } from '@repo/constants';
import { z } from 'zod';

import {
  emailSchema,
  passwordSchema, // Используем полную валидацию вместо legacyPasswordSchema
  captchaSchema,
} from '../validation-schemas';

import { NextIntlValidationConfig, VALIDATION_KEYS } from './constants';

/**
 * Валидирует email поле отдельно
 */
export function validateSingleEmail(
  value: string,
  config: NextIntlValidationConfig
): { isValid: boolean; error: string | null } {
  const result = emailSchema.safeParse(value);

  if (result.success) {
    return { isValid: true, error: null };
  }

  // Получаем первую ошибку и переводим через next-intl
  const firstError = result.error.errors[0];
  if (firstError) {
    if (firstError.code === z.ZodIssueCode.too_small) {
      return { isValid: false, error: config.t(VALIDATION_KEYS.EMAIL_REQUIRED) };
    }
    if (firstError.code === z.ZodIssueCode.invalid_string && firstError.validation === 'email') {
      return { isValid: false, error: config.t(VALIDATION_KEYS.EMAIL_INVALID) };
    }
  }

  return { isValid: false, error: config.t(VALIDATION_KEYS.EMAIL_INVALID) };
}

/**
 * Валидирует password поле отдельно
 */
export function validateSinglePassword(
  value: string,
  config: NextIntlValidationConfig
): { isValid: boolean; error: string | null } {
  const result = passwordSchema.safeParse(value);

  if (result.success) {
    return { isValid: true, error: null };
  }

  const firstError = result.error.errors[0];
  const errorMessage = getPasswordErrorMessage(firstError, config);

  return { isValid: false, error: errorMessage };
}

function getPasswordErrorMessage(
  error: z.ZodIssue | undefined,
  config: NextIntlValidationConfig
): string {
  if (!error) {
    return config.t('validation.password.invalid');
  }

  if (error.code === z.ZodIssueCode.too_small) {
    const minLength = Number(error.minimum || VALIDATION_LIMITS.PASSWORD_MIN_LENGTH);
    const validMinLength = isNaN(minLength) ? VALIDATION_LIMITS.PASSWORD_MIN_LENGTH : minLength;
    return config.t(VALIDATION_KEYS.PASSWORD_MIN_LENGTH, { min: validMinLength });
  }

  if (error.code === z.ZodIssueCode.invalid_string && error.validation === 'regex') {
    return config.t(VALIDATION_KEYS.PASSWORD_WEAK);
  }

  return config.t('validation.password.invalid');
}

/**
 * Валидирует confirmPassword поле отдельно
 */
export function validateSingleConfirmPassword(
  value: string,
  passwordValue: string,
  config: NextIntlValidationConfig
): { isValid: boolean; error: string | null } {
  if (!value || value.trim() === '') {
    return { isValid: false, error: config.t(VALIDATION_KEYS.CONFIRM_PASSWORD_REQUIRED) };
  }

  if (value !== passwordValue) {
    return { isValid: false, error: config.t(VALIDATION_KEYS.CONFIRM_PASSWORD_NO_MATCH) };
  }

  return { isValid: true, error: null };
}

/**
 * Валидирует captcha поле отдельно
 */
export function validateSingleCaptcha(
  value: string,
  config: NextIntlValidationConfig
): { isValid: boolean; error: string | null } {
  const result = captchaSchema.safeParse(value);

  if (result.success) {
    return { isValid: true, error: null };
  }

  // Получаем первую ошибку и переводим через next-intl
  const firstError = result.error.errors[0];
  if (firstError) {
    if (firstError.code === z.ZodIssueCode.too_small) {
      return { isValid: false, error: config.t(VALIDATION_KEYS.CAPTCHA_REQUIRED) };
    }
    if (firstError.code === z.ZodIssueCode.custom) {
      return { isValid: false, error: config.t(VALIDATION_KEYS.CAPTCHA_NOT_VERIFIED) };
    }
  }

  return { isValid: false, error: config.t(VALIDATION_KEYS.CAPTCHA_NOT_VERIFIED) };
}
