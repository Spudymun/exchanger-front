/**
 * React хуки для валидации с next-intl
 */

import React from 'react';
import { z } from 'zod';

import { NextIntlValidationConfig } from './constants';
import { validateFormWithNextIntl } from './core';
import { validateFieldWithNextIntl } from './field-validation';

/**
 * Хук для использования в компонентах форм
 * ПРИНЦИП: Централизованное управление валидацией с локализацией
 */
export interface UseNextIntlValidationParams<T> {
    validationSchema?: z.ZodSchema<T>;
    values: T;
    setErrors: (errors: Partial<Record<keyof T, string>> | ((prev: Partial<Record<keyof T, string>>) => Partial<Record<keyof T, string>>)) => void;
    t: (key: string, values?: Record<string, string | number>) => string;
    locale?: string;
}

/**
 * Преобразует ошибки Zod в формат для формы
 */
function convertZodErrorsToFormErrors<T extends Record<string, unknown>>(
    errors: z.ZodError['errors']
): Partial<Record<keyof T, string>> {
    const formErrors: Partial<Record<keyof T, string>> = {};

    for (const err of errors) {
        if (err.path.length === 1) {
            const fieldName = String(err.path[0]) as keyof T;
            formErrors[fieldName] = err.message;
        }
    }

    return formErrors;
}

export function useNextIntlValidation<T extends Record<string, unknown>>(
    params: UseNextIntlValidationParams<T>
) {
    const { validationSchema, values, setErrors, t, locale } = params;

    const config: NextIntlValidationConfig = { t, locale };

    const validateForm = React.useCallback(() => {
        if (!validationSchema) return true;

        const result = validateFormWithNextIntl(validationSchema, values, config);

        if (result.success) {
            setErrors({} as Partial<Record<keyof T, string>>);
            return true;
        }

        const formErrors = convertZodErrorsToFormErrors<T>(result.error.errors);
        setErrors(formErrors);
        return false;
    }, [validationSchema, values, setErrors, config]);

    const validateField = React.useCallback((field: keyof T) => {
        if (!validationSchema) return true;

        const result = validateFieldWithNextIntl({
            validationSchema,
            values,
            fieldName: String(field),
            config
        });

        if (result.isValid) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        } else if (result.error) {
            setErrors(prev => {
                const newErrors = { ...prev };
                newErrors[field] = result.error;
                return newErrors;
            });
        }

        return result.isValid;
    }, [validationSchema, values, setErrors, config]);

    return {
        validateForm,
        validateField
    };
}