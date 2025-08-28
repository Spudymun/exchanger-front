/**
 * Обработчики валидации для различных типов полей
 *
 * АРХИТЕКТУРА NEXT-INTL ВАЛИДАЦИИ:
 *
 * 1. Формы используют: useTranslations('AdvancedExchangeForm') → создает функцию t
 * 2  // НОВОЕ: получаем контекст из schema  
  const validationContext = (globalThis as Record<string, unknown>).__currentValidationContext as {
    isValid: boolean;
    reason?: string;
    localizationKey?: string;
    params?: Record<string, string | number>;
  } | undefined;Handlers используют: t('validation.captcha.required')
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
 * Проверяет является ли ошибка связанной с невалидным форматом email
 */
function isEmailFormatError(issue: z.ZodIssueOptionalMessage): boolean {
  return (
    issue.code === z.ZodIssueCode.invalid_string &&
    (issue.validation === 'email' || issue.validation === 'regex')
  );
}

/**
 * Обрабатывает валидацию email поля - ОБНОВЛЕНО для работы с централизованной emailSchema
 * ИСПРАВЛЕНИЕ: Обработка refine валидации для правильного приоритета сообщений
 */
export function handleEmailValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'email') {
    return null;
  }

  // ПРИОРИТЕТ 1: Пустое поле - всегда показываем "Email обязателен"
  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: t(VALIDATION_KEYS.EMAIL_REQUIRED) };
  }

  // ПРИОРИТЕТ 2: Невалидный формат через refine
  if (issue.code === z.ZodIssueCode.custom) {
    return { message: t(VALIDATION_KEYS.EMAIL_INVALID) };
  }

  // ПРИОРИТЕТ 3: Невалидный формат через встроенные валидации (legacy)
  if (isEmailFormatError(issue)) {
    return { message: t(VALIDATION_KEYS.EMAIL_INVALID) };
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

/**
 * Обрабатывает legacy формат сообщений через строку
 */
function handleLegacyAmountError(
  message: string | undefined,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (message?.startsWith('AMOUNT_MIN_VALUE:')) {
    const min = message.split(':')[1] || '0.01';
    return { message: t(VALIDATION_KEYS.AMOUNT_MIN_VALUE, { min }) };
  }

  if (message?.startsWith('AMOUNT_MAX_VALUE:')) {
    const max = message.split(':')[1] || '1000000';
    return { message: t(VALIDATION_KEYS.AMOUNT_MAX_VALUE, { max }) };
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

  // LEGACY: поддержка старого формата через message
  const legacyResult = handleLegacyAmountError(issue.message, t);
  if (legacyResult) return legacyResult;

  return { message: t(VALIDATION_KEYS.AMOUNT_REQUIRED) };
}

/**
 * Обрабатывает ошибки формата строки для сумм
 */
function handleAmountStringValidation(t: NextIntlValidationConfig['t']): { message: string } {
  return { message: t(VALIDATION_KEYS.AMOUNT_FORMAT) };
}

/**
 * Обрабатывает ошибки неправильного типа для сумм
 */
function handleAmountTypeValidation(t: NextIntlValidationConfig['t']): { message: string } {
  return { message: t(VALIDATION_KEYS.AMOUNT_FORMAT) };
}

/**
 * Обрабатывает ошибки минимального размера для сумм
 */
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
 * Обрабатывает специальные случаи валидации номера карты
 */
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
    // Для refine без кастомного сообщения - общая ошибка валидации карты
    return { message: t(VALIDATION_KEYS.CARD_NUMBER_INVALID) };
  }

  return null;
}

/**
 * Обрабатывает специальные случаи валидации согласия с условиями
 */
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
    // Проверяем на XSS валидацию
    if (issue.message === 'XSS content detected') {
      return { message: t(VALIDATION_KEYS.XSS_DETECTED) };
    }
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
