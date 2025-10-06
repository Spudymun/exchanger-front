import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { FormField, FormControl, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

/**
 * Reset Code Field для password recovery
 * Следует pattern FormEmailField
 * Используется для ввода 6-значного кода восстановления
 */
export interface ResetCodeFormFields extends Record<string, unknown> {
  resetCode: string;
}

interface FormResetCodeFieldProps<T extends ResetCodeFormFields = ResetCodeFormFields> {
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;
  fieldId?: string;
}

export const FormResetCodeField = <T extends ResetCodeFormFields = ResetCodeFormFields>({
  form,
  isLoading = false,
  t,
  fieldId = 'resetCode',
}: FormResetCodeFieldProps<T>) => {
  // Guard clause (следуем pattern других field компонентов)
  if (!form || !t) {
    console.warn('FormResetCodeField: form and t props are required when used without context');
    return (
      <div className="text-sm text-muted-foreground">Reset code field requires form context</div>
    );
  }

  return (
    <FormField name="resetCode" error={form.errors.resetCode}>
      <FormLabel htmlFor={fieldId} className="required">
        {t('resetCode.label')}
      </FormLabel>
      <FormControl>
        <Input
          {...form.getFieldProps('resetCode')}
          id={fieldId}
          type="text"
          placeholder={t('resetCode.placeholder')}
          disabled={isLoading}
          maxLength={6}
          autoComplete="off"
          required
        />
      </FormControl>
      <FormMessage />
    </FormField>
  );
};
