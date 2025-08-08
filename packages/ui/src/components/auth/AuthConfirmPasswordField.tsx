import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { FormField, FormControl, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

/**
 * Поле подтверждения пароля для формы регистрации
 * Специфично для регистрации, но выделено для консистентности
 */
interface ConfirmPasswordFormFields {
    confirmPassword: string;
}

interface AuthConfirmPasswordFieldProps<T extends ConfirmPasswordFormFields = ConfirmPasswordFormFields> {
    form: UseFormReturn<T>;
    isLoading: boolean;
    t: (key: string) => string;
    fieldId: string;
}

export const AuthConfirmPasswordField = <T extends ConfirmPasswordFormFields = ConfirmPasswordFormFields>({
    form,
    isLoading,
    t,
    fieldId
}: AuthConfirmPasswordFieldProps<T>) => (
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