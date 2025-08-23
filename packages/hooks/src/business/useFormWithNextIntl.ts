/**
 * Next-intl integrated form hook
 * Возвращает UseFormReturn для совместимости с существующими компонентами
 */

import { createNextIntlZodErrorMap } from '@repo/utils';
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
 * Создает функцию валидации формы
 */
function createFormValidator<T extends Record<string, unknown>>(
  validationSchema: z.ZodSchema<T> | undefined,
  values: T,
  errorMap: z.ZodErrorMap,
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>
) {
  return useCallback(() => {
    if (!validationSchema) return true;

    const result = validationSchema.safeParse(values, { errorMap });
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
    setErrors(newErrors);
    return false;
  }, [validationSchema, values, errorMap, setErrors]);
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

      // Если валидация успешна для всей формы, убираем ошибку для этого поля
      if (result.success) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      }

      // Если есть ошибки, проверяем есть ли ошибка именно для этого поля
      const fieldError = result.error.errors.find(
        error => error.path.length > 0 && error.path[0] === field
      );

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
 * Создает функции валидации для формы
 */
function createValidationFunctions<T extends Record<string, unknown>>(
  validationSchema: z.ZodSchema<T> | undefined,
  values: T,
  errorMap: z.ZodErrorMap,
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>
) {
  const validateFormInternal = createFormValidator(validationSchema, values, errorMap, setErrors);
  const validateFieldInternal = createFieldValidator(validationSchema, values, errorMap, setErrors);

  return { validateFormInternal, validateFieldInternal };
}

/**
 * Основной хук формы с интеграцией next-intl
 * Использует createNextIntlZodErrorMap для валидации с переводами
 */
export function useFormWithNextIntl<T extends Record<string, unknown>>(
  params: UseFormWithNextIntlParams<T>
): UseFormReturn<T> {
  const { initialValues, validationSchema, t, locale, onSubmit } = params;

  // Состояние формы
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Создаем errorMap для валидации с переводами
  const errorMap = useMemo(() => {
    return createNextIntlZodErrorMap({ t, locale });
  }, [t, locale]);

  // Получаем функции валидации
  const { validateFormInternal, validateFieldInternal } = createValidationFunctions(
    validationSchema,
    values,
    errorMap,
    setErrors
  );

  // Вычисляемые значения
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues]
  );
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  return useFormLogic({
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
    onSubmit,
  });
}

/**
 * Создает методы управления полями формы
 */
function createFieldMethods<T extends Record<string, unknown>>(
  setValues: React.Dispatch<React.SetStateAction<T>>,
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>,
  initialValues: T,
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>
) {
  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues(prev => ({ ...prev, [field]: value }));
    },
    [setValues]
  );

  const setError = useCallback(
    (field: string, error: string) => {
      setErrors(prev => ({ ...prev, [field]: error }));
    },
    [setErrors]
  );

  const clearError = useCallback(
    (field: string) => {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    },
    [setErrors]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, [setErrors]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues, setValues, setErrors, setIsSubmitting]);

  return { setValue, setError, clearError, clearErrors, reset };
}

/**
 * Создает методы валидации и отправки
 */
function createFormActions<T extends Record<string, unknown>>(params: {
  validateFormInternal: () => boolean;
  validateFieldInternal: (field: keyof T) => boolean;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmit: ((values: T) => void | Promise<void>) | undefined;
  values: T;
}) {
  const {
    validateFormInternal,
    validateFieldInternal,
    isSubmitting,
    setIsSubmitting,
    onSubmit,
    values,
  } = params;

  const validateForm = useCallback(() => {
    return validateFormInternal();
  }, [validateFormInternal]);

  const validateField = useCallback(
    (field: string) => {
      return validateFieldInternal(field as keyof T);
    },
    [validateFieldInternal]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
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
    },
    [isSubmitting, setIsSubmitting, validateForm, onSubmit, values]
  );

  return { validateForm, validateField, handleSubmit };
}

/**
 * Логика формы (упрощена для соблюдения лимита строк)
 */
/**
 * Адаптирует ошибки для совместимости с UseFormReturn
 */
function adaptErrors(errors: Partial<Record<string, string>>): Record<string, string> {
  const adaptedErrors: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value) adaptedErrors[key] = value;
  }
  return adaptedErrors;
}

/**
 * Логика формы (упрощена для соблюдения лимита строк)
 */
function useFormLogic<T extends Record<string, unknown>>(params: {
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
    onSubmit,
  } = params;

  const fieldMethods = createFieldMethods(setValues, setErrors, initialValues, setIsSubmitting);
  const formActions = createFormActions({
    validateFormInternal,
    validateFieldInternal,
    isSubmitting,
    setIsSubmitting,
    onSubmit,
    values,
  });

  const getFieldProps = useCallback(
    <K extends keyof T>(field: K): FormField<T[K]> => ({
      name: String(field),
      value: values[field],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        fieldMethods.setValue(field, e.target.value as T[K]);
      },
      onBlur: () => formActions.validateField(String(field)),
    }),
    [values, fieldMethods, formActions]
  );

  return {
    values,
    errors: adaptErrors(errors),
    isSubmitting,
    isDirty,
    isValid,
    ...fieldMethods,
    ...formActions,
    getFieldProps,
  };
}
