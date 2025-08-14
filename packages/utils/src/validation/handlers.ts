/**
 * Обработчики валидации для различных типов полей
 *
 * АРХИТЕКТУРА NEXT-INTL ВАЛИДАЦИИ:
 *
 * 1. Формы используют: useTranslations('AdvancedExchangeForm') → создает функцию t
 * 2. Handlers используют: t('validation.captcha.required')
 * 3. Next-intl автоматически ищет: AdvancedExchangeForm.validation.captcha.required
 * 4. Ключ найден в JSON: возвращается переведенное сообщение
 *
 * ПОЧЕМУ ЭТО РАБОТАЕТ:
 * - useTranslations('AdvancedExchangeForm') создает функцию t с префиксом
 * - Все ключи в handlers.ts автоматически получают префикс формы
 * - Переводы лежат в структуре: FormName.validation.field.error
 */

import { VALIDATION_LIMITS } from '@repo/constants';
import { z } from 'zod';

import { NextIntlValidationConfig, VALIDATION_KEYS } from './constants';

/**
 * Обрабатывает специальные случаи валидации CAPTCHA
 *
 * МЕХАНИЗМ РАБОТЫ:
 * - Функция t получена из useTranslations('AdvancedExchangeForm')
 * - Ключ 'validation.captcha.required' превращается в 'AdvancedExchangeForm.validation.captcha.required'
 * - Next-intl ищет этот ключ в messages/ru.json и messages/en.json
 * - Возвращает переведенное сообщение или fallback
 */
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

/**
 * Создает сообщение о необходимости заполнить CAPTCHA
 * УПРОЩЕННАЯ ЛОГИКА: Доверяем next-intl, убираем сложную проверку fallback
 */
function createCaptchaRequiredMessage(t: NextIntlValidationConfig['t']): { message: string } {
  return { message: t(VALIDATION_KEYS.CAPTCHA_REQUIRED) };
}

/**
 * Создает сообщение о необходимости подтвердить CAPTCHA
 * УПРОЩЕННАЯ ЛОГИКА: Доверяем next-intl, убираем сложную проверку fallback
 */
function createCaptchaNotVerifiedMessage(t: NextIntlValidationConfig['t']): { message: string } {
  return { message: t(VALIDATION_KEYS.CAPTCHA_NOT_VERIFIED) };
}

/**
 * Обрабатывает валидацию email поля - ОБНОВЛЕНО для работы с централизованной emailSchema
 */
export function handleEmailValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'email') {
    return null;
  }

  if (issue.code === z.ZodIssueCode.invalid_string && issue.validation === 'email') {
    return { message: t(VALIDATION_KEYS.EMAIL_INVALID) };
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: t(VALIDATION_KEYS.EMAIL_REQUIRED) };
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

  if (issue.code === z.ZodIssueCode.invalid_string) {
    return handlePasswordInvalidString(issue, t);
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

  return null;
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

function handleCustomAmountError(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } {
  if (issue.message === 'AMOUNT_POSITIVE') {
    return { message: t(VALIDATION_KEYS.AMOUNT_POSITIVE) };
  }
  if (issue.message?.startsWith('AMOUNT_MIN_VALUE:')) {
    const min = issue.message.split(':')[1] || '0.01';
    return { message: t(VALIDATION_KEYS.AMOUNT_MIN_VALUE, { min }) };
  }
  if (issue.message?.startsWith('AMOUNT_MAX_VALUE:')) {
    const max = issue.message.split(':')[1] || '1000000';
    return { message: t(VALIDATION_KEYS.AMOUNT_MAX_VALUE, { max }) };
  }
  // Fallback for other custom errors
  return { message: t(VALIDATION_KEYS.AMOUNT_POSITIVE) };
}

function getAmountValidationMessage(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } {
  if (issue.code === z.ZodIssueCode.invalid_string && issue.validation === 'regex') {
    return { message: t(VALIDATION_KEYS.AMOUNT_FORMAT) };
  }

  if (issue.code === z.ZodIssueCode.custom) {
    return handleCustomAmountError(issue, t);
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: t(VALIDATION_KEYS.AMOUNT_REQUIRED) || t(VALIDATION_KEYS.REQUIRED) };
  }

  return { message: t(VALIDATION_KEYS.INVALID) };
}

/**
 * Обрабатывает валидацию поля валюты (currency)
 */
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

/**
 * Обрабатывает общие случаи валидации
 */
export function handleGeneralValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  const fieldName = issue.path?.[0];

  if (issue.code === z.ZodIssueCode.too_small && issue.type === 'string') {
    return handleTooSmallString(fieldName, t);
  }

  if (issue.code === z.ZodIssueCode.invalid_type && issue.expected === 'string') {
    return { message: t(VALIDATION_KEYS.REQUIRED) };
  }

  if (issue.code === z.ZodIssueCode.custom) {
    return { message: t(VALIDATION_KEYS.INVALID) };
  }

  return null;
}

function handleTooSmallString(
  fieldName: unknown,
  t: NextIntlValidationConfig['t']
): { message: string } {
  // Специальная обработка для поля банка
  if (typeof fieldName === 'string' && fieldName.toLowerCase().includes('bank')) {
    return { message: t('validation.bank.required') || t('validation.selectBank') };
  }
  return { message: t(VALIDATION_KEYS.REQUIRED) };
}
