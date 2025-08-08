/**
 * Обработчики валидации для различных типов полей
 */

import { VALIDATION_LIMITS } from '@repo/constants';
import { z } from 'zod';

import { NextIntlValidationConfig, VALIDATION_KEYS } from './constants';

/**
 * Обрабатывает специальные случаи валидации CAPTCHA
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
 * Graceful fallback если next-intl недоступен
 */
function createCaptchaRequiredMessage(t: NextIntlValidationConfig['t']): { message: string } {
    const result = t(VALIDATION_KEYS.CAPTCHA_REQUIRED);

    // Если вернулся сырой ключ, используем английский fallback (универсальный)
    if (result.includes(VALIDATION_KEYS.CAPTCHA_REQUIRED)) {
        return { message: 'Please fill CAPTCHA' };
    }

    return { message: result };
}

/**
 * Создает сообщение о необходимости подтвердить CAPTCHA
 * Graceful fallback если next-intl недоступен
 */
function createCaptchaNotVerifiedMessage(t: NextIntlValidationConfig['t']): { message: string } {
    const result = t(VALIDATION_KEYS.CAPTCHA_NOT_VERIFIED);

    // Если вернулся сырой ключ, используем английский fallback (универсальный)
    if (result.includes(VALIDATION_KEYS.CAPTCHA_NOT_VERIFIED)) {
        return { message: 'Please confirm you are not a robot' };
    }

    return { message: result };
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
    const minLength = Number(issue.minimum || VALIDATION_LIMITS.PASSWORD_MIN_LENGTH);
    const validMinLength = isNaN(minLength) ? VALIDATION_LIMITS.PASSWORD_MIN_LENGTH : minLength;
    return { message: t(VALIDATION_KEYS.PASSWORD_MIN_LENGTH, { min: String(validMinLength) }) };
}

function handlePasswordInvalidString(
    issue: z.ZodIssueOptionalMessage,
    t: NextIntlValidationConfig['t']
): { message: string } {
    if (issue.validation === 'regex') {
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

function getAmountValidationMessage(
    issue: z.ZodIssueOptionalMessage,
    t: NextIntlValidationConfig['t']
): { message: string } {
    if (issue.code === z.ZodIssueCode.invalid_string && issue.validation === 'regex') {
        return { message: t(VALIDATION_KEYS.AMOUNT_FORMAT) };
    }

    if (issue.code === z.ZodIssueCode.custom) {
        return { message: t(VALIDATION_KEYS.AMOUNT_POSITIVE) };
    }

    if (issue.code === z.ZodIssueCode.too_small) {
        return { message: t(VALIDATION_KEYS.AMOUNT_REQUIRED) || t(VALIDATION_KEYS.REQUIRED) };
    }

    return { message: t(VALIDATION_KEYS.INVALID) };
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