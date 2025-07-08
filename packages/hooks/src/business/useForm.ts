import { VALIDATION_PATTERNS } from '@repo/constants';
import { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';

import { useNotifications } from '../useNotifications.js';

// Interfaces
export interface FormField<T> {
  name: string;
  value: T;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onBlur?: () => void;
}

export interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnBlur?: boolean;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  validateForm: () => boolean;
  validateField: (field: string) => boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearErrors: () => void;
  reset: () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  getFieldProps: <K extends keyof T>(field: K) => FormField<T[K]>;
}

// Helper function to check object equality
function checkObjectEquality<T>(obj1: T, obj2: T): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Universal form hook with Zod validation integration
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationSchema,
  onSubmit,
  validateOnBlur = true,
}: UseFormOptions<T>): UseFormReturn<T> {
  const notifications = useNotifications();

  // Core state
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation methods
  const validation = useFormValidation(validationSchema, values, setErrors);

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

// Separate validation hook
function useFormValidation<T extends Record<string, unknown>>(
  validationSchema: z.ZodSchema<T> | undefined,
  values: T,
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
) {
  const validateForm = useCallback((): boolean => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = processValidationErrors(error);
        setErrors(newErrors);
      }
      return false;
    }
  }, [validationSchema, values, setErrors]);

  const validateField = useCallback(
    (field: string): boolean => {
      if (!validationSchema) return true;

      const fieldName = field;

      try {
        validationSchema.parse(values);
        setErrors(prev => removeFieldFromErrors(prev, fieldName));
        return true;
      } catch (error) {
        if (!(error instanceof z.ZodError)) {
          return false;
        }

        const fieldError = handleFieldValidationError(error, fieldName);
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [fieldName]: fieldError,
          }));
        }
        return false;
      }
    },
    [validationSchema, values, setErrors]
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
          notifications.error('Ошибка валидации', firstError);
        }
        return;
      }

      if (!onSubmit) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
        notifications.error('Ошибка отправки формы', message);
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

const MIN_PASSWORD_LENGTH = 8;

// Validation schemas
export const FORM_VALIDATION_SCHEMAS = {
  email: z.string().email('Введите корректный email адрес'),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, 'Пароль должен содержать минимум 8 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать строчную букву')
    .regex(/[0-9]/, 'Пароль должен содержать цифру'),
  amount: z
    .string()
    .regex(VALIDATION_PATTERNS.CRYPTO_AMOUNT_STRING, 'Введите корректную сумму')
    .refine(val => Number(val) > 0, 'Сумма должна быть больше 0'),
  phone: z.string().regex(/^\+380\d{9}$/, 'Введите номер телефона в формате +380XXXXXXXXX'),
};
