import React from 'react';

import { PasswordFormFields, AuthPasswordFieldProps } from '../../types/auth-fields';
import { FormField, FormControl, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

/**
 * Переиспользуемое поле Password для форм аутентификации
 * Устраняет дублирование между LoginForm и RegisterForm
 */

export const AuthPasswordField = <T extends PasswordFormFields = PasswordFormFields>({
  form,
  isLoading = false,
  t,
  fieldId = 'password',
}: AuthPasswordFieldProps<T>) => {
  // Guard clause for required props when used without context
  if (!form || !t) {
    console.warn(
      'AuthPasswordField: form and t props are required when used without AuthForm context'
    );
    return (
      <div className="text-sm text-muted-foreground">Password field requires form context</div>
    );
  }

  return (
    <FormField name="password" error={form.errors.password}>
      <FormLabel htmlFor={fieldId} className="required">
        {t('password.label')}
      </FormLabel>
      <FormControl>
        <Input
          {...form.getFieldProps('password')}
          id={fieldId}
          type="password"
          placeholder={t('password.placeholder')}
          disabled={isLoading}
          required
        />
      </FormControl>
      <FormMessage />
    </FormField>
  );
};
