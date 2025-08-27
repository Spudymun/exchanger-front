import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { FormField, FormControl, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

/**
 * Универсальное поле Email для всех форм
 * Рефакторинг: переименовано из AuthEmailField для универсального использования
 * Устраняет дублирование между LoginForm, RegisterForm, ExchangeForm и другими
 */
interface EmailFormFields {
  email: string;
}

interface FormEmailFieldProps<T extends EmailFormFields = EmailFormFields> {
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;
  fieldId?: string;
}

export const FormEmailField = <T extends EmailFormFields = EmailFormFields>({
  form,
  isLoading = false,
  t,
  fieldId = 'email',
}: FormEmailFieldProps<T>) => {
  // Guard clause for required props when used without context
  if (!form || !t) {
    console.warn('FormEmailField: form and t props are required when used without context');
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
