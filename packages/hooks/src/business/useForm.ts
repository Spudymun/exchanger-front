import { I18N_CONFIG } from '@repo/constants';
import { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';

import { useNotifications } from '../useNotifications';

import { UseFormOptions, UseFormReturn, checkObjectEquality } from './useFormTypes';

// Re-export types for public API
export type { FormField, UseFormOptions, UseFormReturn } from './useFormTypes';

/**
 * @deprecated Используйте useFormWithNextIntl для новых компонентов
 * Universal form hook with Zod validation integration
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationSchema,
  onSubmit,
  validateOnBlur = true,
  locale = I18N_CONFIG.FALLBACK_LOCALE, // Используем константу вместо хардкода
  captchaMessages, // Добавляем внешние переводы для CAPTCHA
}: UseFormOptions<T>): UseFormReturn<T> {
  const notifications = useNotifications();

  // Core state
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation methods
  const validation = useFormValidation({
    validationSchema,
    values,
    setErrors,
    locale,
    captchaMessages
  });

  // Derived state
  const isDirty = useMemo(
    () => !checkObjectEquality(values, initialValues),
    [values, initialValues]
  );
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  // Form actions
  const actions = useFormActions({
    setValues: setValues,
    setErrors: setErrors,
    setIsSubmitting: setIsSubmitting,
    initialValues: initialValues,
    validation: validation,
    notifications: notifications,
    onSubmit: onSubmit,
    values: values,
    errors: errors,
    validateOnBlur: validateOnBlur,
  });

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    ...validation,
    ...actions,
  };
}

// Helper function to safely remove field from errors
function removeFieldFromErrors(
  errors: Record<string, string>,
  fieldName: string
): Record<string, string> {
  const newErrors: Record<string, string> = {};
  const entries = Object.entries(errors);

  for (const [key, value] of entries) {
    if (key !== fieldName) {
      Object.assign(newErrors, { [key]: value });
    }
  }
  return newErrors;
}

// Helper function to process validation errors
function processValidationErrors(error: z.ZodError): Record<string, string> {
  const errorEntries: Array<[string, string]> = [];

  for (const err of error.errors) {
    const field = String(err.path[0]);
    if (field && err.message) {
      errorEntries.push([field, err.message]);
    }
  }

  return Object.fromEntries(errorEntries);
}

// Helper function to handle field validation errors
function handleFieldValidationError(error: z.ZodError, fieldName: string): string | null {
  const fieldError = error.errors.find(err => err.path[0] === fieldName);
  return fieldError ? fieldError.message : null;
}

// Валидация всей формы
function validateFormWithErrorMap<T extends Record<string, unknown>>(params: {
  validationSchema: z.ZodSchema<T>;
  values: T;
  locale?: string;
  captchaMessages?: Record<string, string>; // Deprecated
}): { isValid: boolean; errors: Record<string, string> } {
  const { validationSchema, values } = params;
  // DEPRECATED: Используем базовую валидацию без кастомных сообщений
  // Новый код должен использовать useFormWithNextIntl
  const errorMap = undefined;

  try {
    if (errorMap) {
      validationSchema.parse(values, { errorMap });
    } else {
      validationSchema.parse(values);
    }
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const newErrors = processValidationErrors(error);
      return { isValid: false, errors: newErrors };
    }
    return { isValid: false, errors: {} };
  }
}

// Валидация отдельного поля
function validateFieldWithErrorMap<T extends Record<string, unknown>>(params: {
  validationSchema: z.ZodSchema<T>;
  values: T;
  fieldName: string;
  locale?: string;
  captchaMessages?: Record<string, string>; // Deprecated
}): { isValid: boolean; error: string | null } {
  const { validationSchema, values, fieldName } = params;
  // DEPRECATED: Используем базовую валидацию без кастомных сообщений
  // Новый код должен использовать useFormWithNextIntl
  const errorMap = undefined;

  try {
    if (errorMap) {
      validationSchema.parse(values, { errorMap });
    } else {
      validationSchema.parse(values);
    }
    return { isValid: true, error: null };
  } catch (error) {
    if (!(error instanceof z.ZodError)) {
      return { isValid: false, error: null };
    }

    const fieldError = handleFieldValidationError(error, fieldName);
    return { isValid: !fieldError, error: fieldError };
  }
}

// Separate validation hook
function useFormValidation<T extends Record<string, unknown>>(params: {
  validationSchema: z.ZodSchema<T> | undefined;
  values: T;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  locale?: string;
  captchaMessages?: Record<string, string>; // Deprecated
}) {
  const { validationSchema, values, setErrors, locale, captchaMessages } = params;

  const validateForm = useCallback((): boolean => {
    if (!validationSchema) return true;

    const result = validateFormWithErrorMap({ validationSchema, values, locale, captchaMessages });
    setErrors(result.errors);
    return result.isValid;
  }, [validationSchema, values, setErrors, locale, captchaMessages]);

  const validateField = useCallback(
    (field: string): boolean => {
      if (!validationSchema) return true;

      const result = validateFieldWithErrorMap({
        validationSchema,
        values,
        fieldName: field,
        locale,
        captchaMessages
      });

      if (result.isValid) {
        setErrors(prev => removeFieldFromErrors(prev, field));
      } else if (result.error) {
        setErrors(prev => ({
          ...prev,
          [field]: result.error as string,
        }));
      }

      return result.isValid;
    },
    [validationSchema, values, setErrors, locale, captchaMessages]
  );

  return { validateForm, validateField };
}

// Separate form actions hook
function useFormActions<T extends Record<string, unknown>>(params: {
  setValues: React.Dispatch<React.SetStateAction<T>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  initialValues: T;
  validation: ReturnType<typeof useFormValidation>;
  notifications: ReturnType<typeof useNotifications>;
  onSubmit: ((values: T) => void | Promise<void>) | undefined;
  values: T;
  errors: Record<string, string>;
  validateOnBlur: boolean;
}) {
  const basicActions = useFormBasicActions(params);
  const submitAction = useFormSubmitAction(params);
  const fieldPropsAction = useFormFieldProps(params);

  return {
    ...basicActions,
    ...submitAction,
    ...fieldPropsAction,
  };
}

// Basic form actions
function useFormBasicActions<T extends Record<string, unknown>>(params: {
  setValues: React.Dispatch<React.SetStateAction<T>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  initialValues: T;
}) {
  const { setValues, setErrors, setIsSubmitting, initialValues } = params;

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
      setErrors(prev => removeFieldFromErrors(prev, field));
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
  }, [setValues, setErrors, setIsSubmitting, initialValues]);

  return {
    setValue,
    setError,
    clearError,
    clearErrors,
    reset,
  };
}

// Submit action
function useFormSubmitAction<T extends Record<string, unknown>>(params: {
  validation: ReturnType<typeof useFormValidation>;
  notifications: ReturnType<typeof useNotifications>;
  onSubmit: ((values: T) => void | Promise<void>) | undefined;
  values: T;
  errors: Record<string, string>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { validation, notifications, onSubmit, values, errors, setIsSubmitting } = params;

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!validation.validateForm()) {
        const firstError = Object.values(errors)[0];
        if (firstError) {
          notifications.error('Validation error', firstError);
        }
        return;
      }

      if (!onSubmit) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        notifications.error('Form submission error', message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validation, errors, notifications, onSubmit, values, setIsSubmitting]
  );

  return { handleSubmit };
}

// Field props action
function useFormFieldProps<T extends Record<string, unknown>>(params: {
  values: T;
  validation: ReturnType<typeof useFormValidation>;
  validateOnBlur: boolean;
  setValues: React.Dispatch<React.SetStateAction<T>>;
}) {
  const { values, validation, validateOnBlur, setValues } = params;

  const getFieldProps = useCallback(
    <K extends keyof T>(field: K) => ({
      name: String(field),
      value: values[String(field)] as T[K],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        setValues(prev => ({ ...prev, [field]: e.target.value as T[K] }));
      },
      onBlur: validateOnBlur ? () => validation.validateField(String(field)) : undefined,
    }),
    [values, validation, validateOnBlur, setValues]
  );

  return { getFieldProps };
}

// FORM_VALIDATION_SCHEMAS УДАЛЕНЫ - заменены централизованными схемами из @repo/utils
