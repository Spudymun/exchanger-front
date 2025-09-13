import { z } from 'zod';

// Form field interface
export interface FormField<T> {
  name: string;
  value: T;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onBlur?: () => void;
}

// Form hook options
export interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnBlur?: boolean;
  locale?: string; // Добавляем поддержку локализации
}

// Form hook return type
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
// ИСПРАВЛЕНО: Эффективная проверка равенства без JSON.stringify
export function checkObjectEquality<T extends Record<string, unknown>>(obj1: T, obj2: T): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}
