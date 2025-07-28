/**
 * Basic test for useForm hook
 * Demonstrates usage and validates core functionality
 */

import { z } from 'zod';

import { useForm, FORM_VALIDATION_SCHEMAS } from './useForm';

// Example form schema
const LoginFormSchema = z.object({
  email: FORM_VALIDATION_SCHEMAS.email,
  password: FORM_VALIDATION_SCHEMAS.password,
});

type LoginFormData = z.infer<typeof LoginFormSchema>;

// Example usage
export function ExampleLoginForm() {
  const form = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: LoginFormSchema,
    onSubmit: async (values: LoginFormData) => {
      // Simulate API call
      await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
    },
    validateOnBlur: true,
  });

  const emailProps = form.getFieldProps('email');
  const passwordProps = form.getFieldProps('password');

  return {
    // Form state
    isValid: form.isValid,
    isDirty: form.isDirty,
    isSubmitting: form.isSubmitting,
    errors: form.errors,

    // Field props for UI components
    emailField: emailProps,
    passwordField: passwordProps,

    // Form actions
    handleSubmit: form.handleSubmit,
    reset: form.reset,

    // Manual field control
    setEmail: (email: string) => form.setValue('email', email),
    setPassword: (password: string) => form.setValue('password', password),

    // Manual validation
    validateForm: form.validateForm,
    validateEmail: () => form.validateField('email'),
    validatePassword: () => form.validateField('password'),
  };
}

// Example with predefined schema
export function ExampleAmountForm() {
  const form = useForm<{ amount: string }>({
    initialValues: { amount: '0' },
    validationSchema: z.object({
      amount: FORM_VALIDATION_SCHEMAS.amount,
    }),
    onSubmit: async (values: { amount: string }) => {
      await fetch('/api/exchange', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(values.amount) }),
      });
    },
  });

  return {
    amountField: form.getFieldProps('amount'),
    isValid: form.isValid,
    handleSubmit: form.handleSubmit,
  };
}
