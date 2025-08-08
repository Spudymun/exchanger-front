/**
 * Next-intl integrated form hook
 * Возвращает UseFormReturn для совместимости с существующими компонентами
 */

import { 
  useNextIntlValidation, 
  type UseNextIntlValidationParams 
} from '@repo/utils';
import { useCallback, useState, useMemo } from 'react';
import { z } from 'zod';

import type { UseFormReturn, FormField } from './useFormTypes';

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
 * Основной хук формы с интеграцией next-intl
 * Разбит на части для соблюдения лимита строк
 */
export function useFormWithNextIntl<T extends Record<string, unknown>>(
  params: UseFormWithNextIntlParams<T>
): UseFormReturn<T> {
  const { initialValues, validationSchema, t, locale, onSubmit } = params;

  // Состояние формы
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Хук валидации с next-intl
  const validationParams: UseNextIntlValidationParams<T> = {
    validationSchema,
    values,
    setErrors,
    t,
    locale
  };

  const { validateForm: validateFormInternal, validateField: validateFieldInternal } = 
    useNextIntlValidation(validationParams);

  return useFormLogic({
    values,
    setValues,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    initialValues,
    validateFormInternal,
    validateFieldInternal,
    onSubmit
  });
}

/**
 * Логика формы (выделена отдельно для соблюдения лимита строк)
 */
function useFormLogic<T extends Record<string, unknown>>(params: {
  values: T;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  errors: Partial<Record<keyof T, string>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  initialValues: T;
  validateFormInternal: () => boolean;
  validateFieldInternal: (field: keyof T) => boolean;
  onSubmit?: (values: T) => void | Promise<void>;
}): UseFormReturn<T> {
  const {
    values,
    setValues,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    initialValues,
    validateFormInternal,
    validateFieldInternal,
    onSubmit
  } = params;

  // Производные состояния
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues]
  );
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  return createFormMethods({
    values,
    setValues,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    initialValues,
    isDirty,
    isValid,
    validateFormInternal,
    validateFieldInternal,
    onSubmit
  });
}

/**
 * Создает методы формы (выделено отдельно)
 */
function createFormMethods<T extends Record<string, unknown>>(params: {
  values: T;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  errors: Partial<Record<keyof T, string>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  initialValues: T;
  isDirty: boolean;
  isValid: boolean;
  validateFormInternal: () => boolean;
  validateFieldInternal: (field: keyof T) => boolean;
  onSubmit?: (values: T) => void | Promise<void>;
}): UseFormReturn<T> {
  const {
    values,
    setValues,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    initialValues,
    isDirty,
    isValid,
    validateFormInternal,
    validateFieldInternal,
    onSubmit
  } = params;

  // Методы управления полями
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, [setValues]);

  const setError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [setErrors]);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, [setErrors]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, [setErrors]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues, setValues, setErrors]);

  // Валидация
  const validateForm = useCallback(() => {
    return validateFormInternal();
  }, [validateFormInternal]);

  const validateField = useCallback((field: string) => {
    return validateFieldInternal(field as keyof T);
  }, [validateFieldInternal]);

  // Обработка отправки
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const isValid = validateForm();
      if (isValid && onSubmit) {
        await onSubmit(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, setIsSubmitting, validateForm, onSubmit, values]);

  // Свойства поля
  const getFieldProps = useCallback(<K extends keyof T>(field: K): FormField<T[K]> => {
    return {
      name: String(field),
      value: values[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue(field, e.target.value as T[K]);
      },
      onBlur: () => {
        validateField(String(field));
      }
    };
  }, [values, setValue, validateField]);

  // Адаптируем ошибки для совместимости
  const adaptedErrors: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value) {
      adaptedErrors[key] = value;
    }
  }

  return {
    values,
    errors: adaptedErrors,
    isSubmitting,
    isDirty,
    isValid,
    setValue,
    setError,
    clearError,
    clearErrors,
    reset,
    validateForm,
    validateField,
    handleSubmit,
    getFieldProps
  };
}
