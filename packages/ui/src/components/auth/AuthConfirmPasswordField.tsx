import React from 'react';

import { ConfirmPasswordFormFields, AuthConfirmPasswordFieldProps } from '../../types/auth-fields';
import { FormField, FormControl, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

/**
 * Переиспользуемое поле ConfirmPassword для форм аутентификации
 * Устраняет дублирование между LoginForm и RegisterForm
 */

export const AuthConfirmPasswordField = <
  T extends ConfirmPasswordFormFields = ConfirmPasswordFormFields,
>({
  form,
  isLoading = false,
  t,
  fieldId = 'confirmPassword',
}: AuthConfirmPasswordFieldProps<T>) => {
  // Guard clause for required props when used without context
  if (!form || !t) {
    console.warn(
      'AuthConfirmPasswordField: form and t props are required when used without AuthForm context'
    );
    return (
      <div className="text-sm text-muted-foreground">
        Confirm password field requires form context
      </div>
    );
  }

  return (
    <FormField name="confirmPassword" error={form.errors.confirmPassword}>
      <FormLabel htmlFor={fieldId} className="required">
        {t('confirmPassword.label')}
      </FormLabel>
      <FormControl>
        <Input
          {...form.getFieldProps('confirmPassword')}
          id={fieldId}
          type="password"
          placeholder={t('confirmPassword.placeholder')}
          disabled={isLoading}
          required
        />
      </FormControl>
      <FormMessage />
    </FormField>
  );
};
