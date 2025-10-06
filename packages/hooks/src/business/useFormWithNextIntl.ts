/**
 * Next-intl integrated form hook
 * Возвращает UseFormReturn для совместимости с существующими компонентами
 */

import { createNextIntlZodErrorMap } from '@repo/utils';
import { useCallback, useState, useMemo } from 'react';
import { z } from 'zod';

import type { UseFormReturn, FormField } from './useFormTypes';
import { createFormActions, createGetFieldProps } from './useFormWithNextIntl.helpers';

/**
 * Параметры для нового хука формы с next-intl
 */
export interface UseFormWithNextIntlParams<T extends Record<string, unknown>> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  t: (key: string, values?: Record<string, string | number>) => string;
  locale?: string;
  onSubmit?: (values: T) => void | Promise<void>;
}

/**
 * Внутренний интерфейс для состояния формы
 */
export interface UseFormWithNextIntlReturn<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  setValue: (field: keyof T, value: T[keyof T]) => void;
  setError: (field: keyof T, message: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  reset: () => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  validateForm: () => boolean;
  validateField: (field: keyof T) => boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  getFieldProps: (field: keyof T) => {
    value: T[keyof T];
    onChange: (value: T[keyof T]) => void;
    onBlur?: () => boolean;
  };
}

/**
 * Создает функцию валидации поля
 */
function createFieldValidator<T extends Record<string, unknown>>(
  validationSchema: z.ZodSchema<T> | undefined,
  values: T,
  errorMap: z.ZodErrorMap,
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>
) {
  return useCallback(
    (field: keyof T) => {
      if (!validationSchema) return true;

      const result = validationSchema.safeParse(values, { errorMap });

      // eslint-disable-next-line no-console
      console.warn('[DEBUG] validateField:', { 
        field, 
        success: result.success, 
        allErrors: result.success ? [] : result.error.errors.map(e => ({ path: e.path, message: e.message, code: e.code }))
      });

      if (result.success) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      }

      const fieldError = result.error.errors.find(
        error => error.path.length > 0 && error.path[0] === field
      );
      
      // eslint-disable-next-line no-console
      console.warn('[DEBUG] validateField found error for field:', { field, fieldError });
      
      if (fieldError) {
        // Есть ошибка для этого поля - устанавливаем её
        setErrors(prev => ({ ...prev, [field]: fieldError.message }));
        return false;
      } else {
        // Нет ошибки для этого поля, но есть для других - убираем ошибку для этого поля
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      }
    },
    [validationSchema, values, errorMap, setErrors]
  );
}

/**
 * Создает функцию валидации формы
 */
function createFormValidatorFn<T extends Record<string, unknown>>(
  validationSchema: z.ZodSchema<T> | undefined,
  values: T,
  errorMap: z.ZodErrorMap,
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>
) {
  return useCallback(() => {
    if (!validationSchema) return true;

    const result = validationSchema.safeParse(values, { errorMap });
    
    // eslint-disable-next-line no-console
    console.warn('[DEBUG] validateForm result:', { 
      success: result.success, 
      errors: result.success ? [] : result.error.errors.map(e => ({ path: e.path, message: e.message, code: e.code }))
    });
    
    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: Partial<Record<keyof T, string>> = {};
    for (const error of result.error.errors) {
      if (error.path.length > 0) {
        const field = error.path[0] as keyof T;
        newErrors[field] = error.message;
      }
    }
    
    // eslint-disable-next-line no-console
    console.warn('[DEBUG] validateForm newErrors:', newErrors);
    
    setErrors(newErrors);
    return false;
  }, [validationSchema, values, errorMap, setErrors]);
}

/**
 * Основная логика хука формы
 */
function useFormLogic<T extends Record<string, unknown>>(params: UseFormWithNextIntlParams<T>) {
  const { initialValues, validationSchema, t, locale, onSubmit } = params;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const errorMap = useMemo(() => createNextIntlZodErrorMap({ t, locale }), [t, locale]);

  const validateForm = createFormValidatorFn(validationSchema, values, errorMap, setErrors);
  const validateField = createFieldValidator(validationSchema, values, errorMap, setErrors);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const formActions = createFormActions({
    values,
    setValues,
    setErrors,
    setIsDirty,
    setIsSubmitting,
    initialValues,
    validateForm,
    onSubmit,
  });

  const getFieldProps = createGetFieldProps(values, formActions.setValue, validateField);

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    validateForm,
    validateField,
    ...formActions,
    getFieldProps,
  };
}

/**
 * Хук для работы с формами с поддержкой next-intl
 */
export function useFormWithNextIntl<T extends Record<string, unknown>>(
  params: UseFormWithNextIntlParams<T>
): UseFormReturn<T> {
  const formLogic = useFormLogic(params);

  return useMemo(() => {
    const formFields: Record<keyof T, FormField<T[keyof T]>> = {} as Record<
      keyof T,
      FormField<T[keyof T]>
    >;

    for (const key in params.initialValues) {
      formFields[key as keyof T] = {
        name: String(key),
        value: formLogic.values[key],
        onChange: (
          e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
        ) => {
          formLogic.setValue(key as keyof T, e.target.value as T[keyof T]);
        },
        onBlur: () => formLogic.validateField(key as keyof T),
      };
    }

    return {
      values: formLogic.values,
      errors: formLogic.errors as Record<string, string>,
      isSubmitting: formLogic.isSubmitting,
      isDirty: formLogic.isDirty,
      isValid: formLogic.isValid,
      fields: formFields,
      setValue: formLogic.setValue,
      setError: formLogic.setError,
      clearError: formLogic.clearError,
      clearErrors: formLogic.clearErrors,
      reset: formLogic.reset,
      setErrors: (errors: Record<string, string>) =>
        formLogic.setErrors(errors as Partial<Record<keyof T, string>>),
      validateForm: formLogic.validateForm,
      validateField: (field: string) => formLogic.validateField(field as keyof T),
      handleSubmit: formLogic.handleSubmit,
      getFieldProps: <K extends keyof T>(field: K): FormField<T[K]> => ({
        name: String(field),
        value: formLogic.values[field],
        onChange: (
          e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
        ) => {
          formLogic.setValue(field, e.target.value as T[K]);
        },
        onBlur: () => formLogic.validateField(field),
      }),
    };
  }, [formLogic, params.initialValues]);
}
