import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { FormField, FormControl, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

/**
 * Переиспользуемое поле Email для форм аутентификации
 * Устраняет дублирование между LoginForm и RegisterForm
 */
interface EmailFormFields {
  email: string;
}

interface AuthEmailFieldProps<T extends EmailFormFields = EmailFormFields> {
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;
  fieldId?: string;
}

export const AuthEmailField = <T extends EmailFormFields = EmailFormFields>({
  form,
  isLoading = false,
  t,
  fieldId = 'email',
}: AuthEmailFieldProps<T>) => {
  // Guard clause for required props when used without context
  if (!form || !t) {
    console.warn(
      'AuthEmailField: form and t props are required when used without AuthForm context'
    );
    return <div className="text-sm text-muted-foreground">Email field requires form context</div>;
  }

  return (
    <FormField name="email" error={form.errors.email}>
      <FormLabel htmlFor={fieldId} className="required">
        {t('email.label')}
      </FormLabel>
      <FormControl>
        <Input
          {...form.getFieldProps('email')}
          id={fieldId}
          type="email"
          placeholder={t('email.placeholder')}
          disabled={isLoading}
          required
        />
      </FormControl>
      <FormMessage />
    </FormField>
  );
};
