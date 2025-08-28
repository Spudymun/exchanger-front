/**
 * Обработчики валидации для различных типов полей
 */

import { VALIDATION_LIMITS } from '@repo/constants';
import { z } from 'zod';

import { NextIntlValidationConfig, VALIDATION_KEYS } from './constants';

export function handleCaptchaValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'captcha') {
    return null;
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    return createCaptchaRequiredMessage(t);
  }

  if (issue.code === z.ZodIssueCode.custom) {
    return createCaptchaNotVerifiedMessage(t);
  }

  return null;
}

function createCaptchaRequiredMessage(t: NextIntlValidationConfig['t']): { message: string } {
  return { message: t(VALIDATION_KEYS.CAPTCHA_REQUIRED) };
}

function createCaptchaNotVerifiedMessage(t: NextIntlValidationConfig['t']): { message: string } {
  return { message: t(VALIDATION_KEYS.CAPTCHA_NOT_VERIFIED) };
}

function createValidationMessage(key: string, t: NextIntlValidationConfig['t']): { message: string } {
  return { message: t(key) };
}

/**
 * Проверяет, является ли ошибка связанной с пустым полем
 */
function isEmptyFieldError(issue: z.ZodIssueOptionalMessage): boolean {
  const hasEmptyInput = 'input' in issue && (issue.input === '' || issue.input === null || issue.input === undefined);
  const hasEmptyReceived = 'received' in issue && (issue.received === '' || issue.received === '""' || issue.received === 'undefined');
  return hasEmptyInput || hasEmptyReceived;
}

/**
 * Обрабатывает валидацию email поля
 */
export function handleEmailValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'email') {
    return null;
  }

  if (issue.code === z.ZodIssueCode.too_small && issue.type === 'string') {
    return createValidationMessage(VALIDATION_KEYS.EMAIL_REQUIRED, t);
  }

  if (issue.code === z.ZodIssueCode.invalid_type && issue.expected === 'string') {
    return createValidationMessage(VALIDATION_KEYS.EMAIL_REQUIRED, t);
  }

  if (issue.code === z.ZodIssueCode.custom) {
    return createValidationMessage(VALIDATION_KEYS.EMAIL_INVALID, t);
  }

  return null;
}

/**
 * Обрабатывает валидацию password поля - ОБНОВЛЕНО для работы с централизованными схемами
 */
export function handlePasswordValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'password') {
    return null;
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    return handlePasswordTooSmall(issue, t);
  }

  // ЗАЩИТА: Если поле пустое, но пришел invalid_string - показываем "обязательно"
  if (issue.code === z.ZodIssueCode.invalid_string && isEmptyFieldError(issue)) {
    return { message: t(VALIDATION_KEYS.PASSWORD_REQUIRED) };
  }

  if (issue.code === z.ZodIssueCode.invalid_string) {
    return handlePasswordInvalidString(issue, t);
  }

  // НОВОЕ: Обработка refine валидации (слабый пароль)
  if (issue.code === z.ZodIssueCode.custom) {
    return { message: t(VALIDATION_KEYS.PASSWORD_WEAK) };
  }

  return null;
}

function handlePasswordTooSmall(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } {
  const minLength =
    'minimum' in issue ? Number(issue.minimum) : VALIDATION_LIMITS.PASSWORD_MIN_LENGTH;
  const validMinLength = isNaN(minLength) ? VALIDATION_LIMITS.PASSWORD_MIN_LENGTH : minLength;
  return { message: t(VALIDATION_KEYS.PASSWORD_MIN_LENGTH, { min: String(validMinLength) }) };
}

function handlePasswordInvalidString(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } {
  // ЗАЩИТА: Если поле пустое, но пришел regex validation - показываем "обязательно" 
  if (isEmptyFieldError(issue)) {
    return { message: t(VALIDATION_KEYS.PASSWORD_REQUIRED) };
  }

  if ('validation' in issue && issue.validation === 'regex') {
    return { message: t(VALIDATION_KEYS.PASSWORD_WEAK) };
  }
  return { message: t(VALIDATION_KEYS.PASSWORD_REQUIRED) };
}

/**
 * Обрабатывает валидацию confirmPassword поля
 */
export function handleConfirmPasswordValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'confirmPassword') {
    return null;
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: t(VALIDATION_KEYS.CONFIRM_PASSWORD_REQUIRED) };
  }

  if (issue.code === z.ZodIssueCode.custom) {
    return { message: t(VALIDATION_KEYS.CONFIRM_PASSWORD_NO_MATCH) };
  }

  // Обработка regex валидации (переиспользуем логику password поля)
  if (issue.code === z.ZodIssueCode.invalid_string) {
    return handleConfirmPasswordInvalidString(issue, t);
  }

  return null;
}

/**
 * Обрабатывает invalid_string ошибки для confirmPassword поля
 * Переиспользует логику handlePasswordInvalidString
 */
function handleConfirmPasswordInvalidString(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } {
  // ЗАЩИТА: Если поле пустое, но пришел regex validation - показываем "обязательно"
  if (isEmptyFieldError(issue)) {
    return { message: t(VALIDATION_KEYS.CONFIRM_PASSWORD_REQUIRED) };
  }

  if ('validation' in issue && issue.validation === 'regex') {
    // Для пустого поля показываем "требуется", не "слабый пароль"
    return { message: t(VALIDATION_KEYS.CONFIRM_PASSWORD_REQUIRED) };
  }
  return { message: t(VALIDATION_KEYS.CONFIRM_PASSWORD_REQUIRED) };
}

/**
 * Обрабатывает валидацию полей с суммами (fromAmount, amount, etc.)
 */
export function handleAmountValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  const fieldName = issue.path?.[0];

  if (typeof fieldName !== 'string' || !fieldName.toLowerCase().includes('amount')) {
    return null;
  }

  return getAmountValidationMessage(issue, t);
}

/**
 * Получает контекст валидации из глобального хранилища
 */
function getValidationContext():
  | {
      isValid: boolean;
      reason?: string;
      localizationKey?: string;
      params?: Record<string, string | number>;
    }
  | undefined {
  return (globalThis as Record<string, unknown>).__currentValidationContext as
    | {
        isValid: boolean;
        reason?: string;
        localizationKey?: string;
        params?: Record<string, string | number>;
      }
    | undefined;
}

/**
 * Обрабатывает ошибки минимального значения суммы
 */
function handleMinAmountError(
  validationContext:
    | { localizationKey?: string; params?: Record<string, string | number> }
    | undefined,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (
    validationContext?.localizationKey === 'server.errors.business.amountTooLow' &&
    validationContext.params?.min
  ) {
    return { message: t(VALIDATION_KEYS.AMOUNT_MIN_VALUE, { min: validationContext.params.min }) };
  }
  return null;
}

/**
 * Обрабатывает ошибки максимального значения суммы
 */
function handleMaxAmountError(
  validationContext:
    | { localizationKey?: string; params?: Record<string, string | number> }
    | undefined,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (
    validationContext?.localizationKey === 'server.errors.business.amountTooHigh' &&
    validationContext.params?.max
  ) {
    return { message: t(VALIDATION_KEYS.AMOUNT_MAX_VALUE, { max: validationContext.params.max }) };
  }
  return null;
}

function handleCustomAmountError(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } {
  const validationContext = getValidationContext();

  // Используем контекст из schema если доступен
  if (validationContext && !validationContext.isValid) {
    const minResult = handleMinAmountError(validationContext, t);
    if (minResult) return minResult;

    const maxResult = handleMaxAmountError(validationContext, t);
    if (maxResult) return maxResult;
  }

  return { message: t(VALIDATION_KEYS.AMOUNT_REQUIRED) };
}

function handleAmountStringValidation(t: NextIntlValidationConfig['t']): { message: string } {
  return { message: t(VALIDATION_KEYS.AMOUNT_FORMAT) };
}

function handleAmountTypeValidation(t: NextIntlValidationConfig['t']): { message: string } {
  return { message: t(VALIDATION_KEYS.AMOUNT_FORMAT) };
}

function handleAmountSizeValidation(t: NextIntlValidationConfig['t']): { message: string } {
  return { message: t(VALIDATION_KEYS.AMOUNT_REQUIRED) || t(VALIDATION_KEYS.REQUIRED) };
}

function getAmountValidationMessage(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } {
  if (issue.code === z.ZodIssueCode.invalid_string) {
    return handleAmountStringValidation(t);
  }

  if (issue.code === z.ZodIssueCode.custom) {
    return handleCustomAmountError(issue, t);
  }

  if (issue.code === z.ZodIssueCode.invalid_type) {
    return handleAmountTypeValidation(t);
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    return handleAmountSizeValidation(t);
  }

  return { message: t(VALIDATION_KEYS.INVALID) };
}

export function handleCurrencyValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  const fieldName = issue.path?.[0];
  if (typeof fieldName !== 'string' || !fieldName.toLowerCase().includes('currency')) {
    return null;
  }
  if (issue.code === z.ZodIssueCode.custom) {
    return { message: t(VALIDATION_KEYS.CURRENCY_INVALID) };
  }
  return null;
}

export function handleCardNumberValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'cardNumber') {
    return null;
  }
  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: t(VALIDATION_KEYS.CARD_NUMBER_REQUIRED) };
  }
  if (issue.code === z.ZodIssueCode.custom) {
    if (issue.message === 'INVALID_CHARACTERS_DETECTED') {
      return { message: t(VALIDATION_KEYS.XSS_DETECTED) };
    }
    return { message: t(VALIDATION_KEYS.CARD_NUMBER_INVALID) };
  }
  return null;
}

export function handleTermsValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'agreeToTerms') {
    return null;
  }
  if (issue.code === z.ZodIssueCode.custom) {
    return { message: t(VALIDATION_KEYS.TERMS_ACCEPTANCE_REQUIRED) };
  }
  return null;
}

export function handleNameValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  const isNameField = issue.path?.some(p => 
    typeof p === 'string' && (p.includes('name') || p.includes('Name'))
  );
  
  if (!isNameField) return null;

  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: t('validation.name.tooShort') };
  }

  if (issue.code === z.ZodIssueCode.too_big) {
    return { message: t('validation.name.tooLong') };
  }

  if (issue.code === z.ZodIssueCode.invalid_string) {
    return { message: t('validation.name.invalidCharacters') };
  }

  return null;
}

export function handleGeneralValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.code === z.ZodIssueCode.too_small && issue.type === 'string') {
    return handleTooSmallString(issue.path?.[0], t);
  }

  if (issue.code === z.ZodIssueCode.invalid_type && issue.expected === 'string') {
    return { message: t(VALIDATION_KEYS.REQUIRED) };
  }

  if (issue.code === z.ZodIssueCode.custom) {
    return handleCustomValidation(issue.message, t);
  }

  return null;
}

function handleTooSmallString(fieldName: unknown, t: NextIntlValidationConfig['t']): { message: string } {
  if (typeof fieldName === 'string' && fieldName.toLowerCase().includes('bank')) {
    return createValidationMessage('validation.bank.required', t) || createValidationMessage('validation.selectBank', t);
  }
  return createValidationMessage(VALIDATION_KEYS.REQUIRED, t);
}

function handleCustomValidation(message: string | undefined, t: NextIntlValidationConfig['t']): { message: string } {
  if (message === 'XSS content detected') {
    return createValidationMessage(VALIDATION_KEYS.XSS_DETECTED, t);
  }
  return createValidationMessage(VALIDATION_KEYS.INVALID, t);
}
