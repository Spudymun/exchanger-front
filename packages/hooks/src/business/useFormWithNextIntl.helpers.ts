/**
 * Вспомогательные функции для useFormWithNextIntl
 */

import { createNextIntlZodErrorMap } from '@repo/utils';
import React from 'react';
import { z } from 'zod';

/**
 * Создает функцию валидации формы
 */
export function createFormValidator<T extends Record<string, unknown>>(
  validationSchema: z.ZodSchema<T> | undefined,
  t: (key: string, values?: Record<string, string | number>) => string,
  locale?: string
) {
  if (!validationSchema) {
    return () => ({ success: true as const, data: {} as T });
  }

  return (values: T) => {
    const errorMap = createNextIntlZodErrorMap({ t, locale });
    return validationSchema.safeParse(values, { errorMap });
  };
}

/**
 * Параметры для создания действий формы
 */
interface CreateFormActionsParams<T extends Record<string, unknown>> {
  values: T;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  initialValues: T;
  validateForm: () => boolean;
  onSubmit?: (values: T) => void | Promise<void>;
}

/**
 * Создает функции для работы с полями формы
 */
function createFieldActions<T extends Record<string, unknown>>(params: CreateFormActionsParams<T>) {
  const { setValues, setErrors, setIsDirty } = params;

  const setValue = React.useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValues(prev => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    [setValues, setIsDirty]
  );

  const setError = React.useCallback(
    (field: keyof T, message: string) => {
      setErrors(prev => ({ ...prev, [field]: message }));
    },
    [setErrors]
  );

  const clearError = React.useCallback(
    (field: keyof T) => {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    },
    [setErrors]
  );

  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, [setErrors]);

  return { setValue, setError, clearError, clearErrors };
}

/**
 * Создает функции для управления формой
 */
function createFormControlActions<T extends Record<string, unknown>>(
  params: CreateFormActionsParams<T>
) {
  const {
    values,
    setValues,
    setErrors,
    setIsDirty,
    setIsSubmitting,
    initialValues,
    validateForm,
    onSubmit,
  } = params;

  const reset = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [setValues, setErrors, setIsDirty, setIsSubmitting, initialValues]);

  const handleSubmit = React.useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!validateForm()) {
        return;
      }

      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [validateForm, onSubmit, values, setIsSubmitting]
  );

  return { reset, handleSubmit };
}

/**
 * Создает функции действий формы
 */
export function createFormActions<T extends Record<string, unknown>>(
  params: CreateFormActionsParams<T>
) {
  const fieldActions = createFieldActions(params);
  const controlActions = createFormControlActions(params);

  return {
    ...fieldActions,
    ...controlActions,
    setErrors: params.setErrors,
  };
}

/**
 * Создает функцию getFieldProps
 */
export function createGetFieldProps<T extends Record<string, unknown>>(
  values: T,
  setValue: (field: keyof T, value: T[keyof T]) => void,
  validateField: (field: keyof T) => boolean
) {
  return (field: keyof T) => ({
    value: values[field],
    onChange: (value: T[keyof T]) => setValue(field, value),
    onBlur: () => validateField(field),
  });
}
