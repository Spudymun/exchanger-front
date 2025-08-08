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
  setErrors: (
    errors:
      | Partial<Record<keyof T, string>>
      | ((prev: Partial<Record<keyof T, string>>) => Partial<Record<keyof T, string>>)
  ) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  locale?: string;
}

/**
 * Преобразует ошибки Zod в формат для формы
 */
function convertZodErrorsToFormErrors<T extends Record<string, unknown>>(
  errors: z.ZodError['errors']
): Partial<Record<keyof T, string>> {
  const formErrorsEntries: Array<[keyof T, string]> = [];

  for (const err of errors) {
    const [rawKey] = err.path;
    if (err.path.length !== 1 || typeof rawKey !== 'string') continue;
    formErrorsEntries.push([rawKey as keyof T, err.message]);
  }

  // Собираем объект без динамического индексирования и без вложенных коллбеков
  return Object.fromEntries(formErrorsEntries) as Partial<Record<keyof T, string>>;
}

function buildConfig(
  t: (key: string, values?: Record<string, string | number>) => string,
  locale?: string
): NextIntlValidationConfig {
  return { t, locale };
}

function applyFieldErrorUpdate<T extends Record<string, unknown>>(
  prev: Partial<Record<keyof T, string>>,
  field: keyof T,
  error: string | null
): Partial<Record<keyof T, string>> {
  const entries = Object.entries(prev) as Array<[keyof T, string]>;
  const out: Array<[keyof T, string]> = [];
  for (const [k, v] of entries) {
    if (k !== field) out.push([k, v]);
  }
  if (error) out.push([field, error]);
  return Object.fromEntries(out) as Partial<Record<keyof T, string>>;
}

export function useNextIntlValidation<T extends Record<string, unknown>>(
  params: UseNextIntlValidationParams<T>
) {
  const { validationSchema, values, setErrors, t, locale } = params;

  const config = React.useMemo(() => buildConfig(t, locale), [t, locale]);

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

  const validateField = React.useCallback(
    (field: keyof T) => {
      if (!validationSchema) return true;

      const result = validateFieldWithNextIntl({
        validationSchema,
        values,
        fieldName: String(field),
        config,
      });

      if (result.isValid) {
        setErrors(prev => applyFieldErrorUpdate<T>(prev, field, null));
      } else if (result.error) {
        setErrors(prev => applyFieldErrorUpdate<T>(prev, field, result.error as string));
      }

      return result.isValid;
    },
    [validationSchema, values, setErrors, config]
  );

  return { validateForm, validateField };
}
