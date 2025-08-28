import type { UseFormReturn } from '@repo/hooks';

/**
 * AuthForm Context Value - Generic типизация по паттерну DataTableContextValue
 * Следует стандартам документации COMPOUND_COMPONENTS_MIGRATION_GUIDE.md
 */
export interface AuthFormContextValue {
  form?: UseFormReturn<Record<string, unknown>>;
  isLoading?: boolean;
  t?: (key: string) => string;
  fieldId?: string;
  formType?: 'login' | 'register';
  onSubmit?: (data?: Record<string, unknown>) => void | Promise<void>;
  validationErrors?: Record<string, string>;
  defaultErrorStyling?: 'auto' | 'disabled' | 'forced';
}
