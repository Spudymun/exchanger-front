// Next-intl integrated form hook (UseFormReturn-compatible)

import { useNextIntlValidation, type UseNextIntlValidationParams } from '@repo/utils';
import { useCallback, useState, useMemo } from 'react';
import { z } from 'zod';

import type { UseFormReturn, FormField } from './useFormTypes';

export interface UseFormWithNextIntlParams<T extends Record<string, unknown>> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  t: (key: string, values?: Record<string, string | number>) => string;
  locale?: string;
  onSubmit?: (values: T) => void | Promise<void>;
}

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

export function useFormWithNextIntl<T extends Record<string, unknown>>(
  params: UseFormWithNextIntlParams<T>
): UseFormReturn<T> {
  const { initialValues, validationSchema, t, locale, onSubmit } = params;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationParams: UseNextIntlValidationParams<T> = {
    validationSchema,
    values,
    setErrors,
    t,
    locale,
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
    onSubmit,
  });
}

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
    onSubmit,
  } = params;

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
    onSubmit,
  });
}

// Field management methods
function createFieldMethods<T extends Record<string, unknown>>(
  setValues: React.Dispatch<React.SetStateAction<T>>,
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>
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

  return { setValue, setError, clearError, clearErrors };
}

// Form reset method
function createResetMethod<T extends Record<string, unknown>>(
  initialValues: T,
  setValues: React.Dispatch<React.SetStateAction<T>>,
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>,
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>
) {
  return useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues, setValues, setErrors, setIsSubmitting]);
}

// Validation methods
function createValidationMethods<T extends Record<string, unknown>>(
  validateFormInternal: () => boolean,
  validateFieldInternal: (field: keyof T) => boolean
) {
  const validateForm = useCallback(() => {
    return validateFormInternal();
  }, [validateFormInternal]);

  const validateField = useCallback(
    (field: string) => {
      return validateFieldInternal(field as keyof T);
    },
    [validateFieldInternal]
  );

  return { validateForm, validateField };
}

// Submit handler
function createSubmitHandler<T extends Record<string, unknown>>(params: {
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  validateForm: () => boolean;
  onSubmit: ((values: T) => void | Promise<void>) | undefined;
  values: T;
}) {
  const { isSubmitting, setIsSubmitting, validateForm, onSubmit, values } = params;

  return useCallback(
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
}

// Field props getter
function createFieldPropsGetter<T extends Record<string, unknown>>(
  values: T,
  setValue: <K extends keyof T>(field: K, value: T[K]) => void,
  validateField: (field: string) => boolean
) {
  return useCallback(
    <K extends keyof T>(field: K): FormField<T[K]> => {
      return {
        name: String(field),
        value: values[field],
        onChange: (
          e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
        ) => {
          setValue(field, e.target.value as T[K]);
        },
        onBlur: () => {
          validateField(String(field));
        },
      };
    },
    [values, setValue, validateField]
  );
}

// Adapt errors for compatibility
function adaptErrorsForCompatibility(errors: Partial<Record<string, string>>) {
  const adaptedErrors: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value) {
      adaptedErrors[key] = value;
    }
  }
  return adaptedErrors;
}

// Assemble final form return object
function assembleFormReturn<T extends Record<string, unknown>>(params: {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  methods: {
    setValue: <K extends keyof T>(field: K, value: T[K]) => void;
    setError: (field: string, error: string) => void;
    clearError: (field: string) => void;
    clearErrors: () => void;
    reset: () => void;
    validateForm: () => boolean;
    validateField: (field: string) => boolean;
    handleSubmit: (e?: React.FormEvent) => Promise<void>;
    getFieldProps: <K extends keyof T>(field: K) => FormField<T[K]>;
  };
}): UseFormReturn<T> {
  const { values, errors, isSubmitting, isDirty, isValid, methods } = params;
  const adaptedErrors = adaptErrorsForCompatibility(errors);

  return {
    values,
    errors: adaptedErrors,
    isSubmitting,
    isDirty,
    isValid,
    ...methods,
  };
}

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
    onSubmit,
  } = params;

  // Create all methods
  const fieldMethods = createFieldMethods(setValues, setErrors);
  const reset = createResetMethod(initialValues, setValues, setErrors, setIsSubmitting);
  const validationMethods = createValidationMethods(validateFormInternal, validateFieldInternal);
  const handleSubmit = createSubmitHandler({
    isSubmitting,
    setIsSubmitting,
    validateForm: validationMethods.validateForm,
    onSubmit,
    values,
  });
  const getFieldProps = createFieldPropsGetter(
    values,
    fieldMethods.setValue,
    validationMethods.validateField
  );

  // Assemble and return final object
  return assembleFormReturn({
    values,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    methods: { ...fieldMethods, reset, ...validationMethods, handleSubmit, getFieldProps },
  });
}
