/**
 * Валидация полей формы с next-intl
 */

import { z } from 'zod';

import { NextIntlValidationConfig, VALIDATION_KEYS } from './constants';
import {
    validateSingleEmail,
    validateSinglePassword,
    validateSingleConfirmPassword,
    validateSingleCaptcha
} from './single-field';

/**
 * Валидирует отдельное поле с использованием next-intl переводов
 */
export function validateFieldWithNextIntl<T extends Record<string, unknown>>(params: {
    validationSchema: z.ZodSchema<T>;
    values: T;
    fieldName: string;
    config: NextIntlValidationConfig;
}): { isValid: boolean; error: string | null } {
    const { values, fieldName, config } = params;
    const fieldValue = values[fieldName as keyof T];

    return validateFieldByType(fieldName, fieldValue, values, config);
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
function validateGenericField(fieldValue: unknown, config: NextIntlValidationConfig): { isValid: boolean; error: string | null } {
    if (!fieldValue || String(fieldValue).trim() === '') {
        return { isValid: false, error: config.t(VALIDATION_KEYS.REQUIRED) };
    }

    return { isValid: true, error: null };
}