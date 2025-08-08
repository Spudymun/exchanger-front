import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { FormField, FormControl, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

/**
 * Переиспользуемое поле Password для форм аутентификации
 * Устраняет дублирование между LoginForm и RegisterForm
 */
interface PasswordFormFields {
    password: string;
}

interface AuthPasswordFieldProps<T extends PasswordFormFields = PasswordFormFields> {
    form: UseFormReturn<T>;
    isLoading: boolean;
    t: (key: string) => string;
    fieldId: string;
}

export const AuthPasswordField = <T extends PasswordFormFields = PasswordFormFields>({
    form,
    isLoading,
    t,
    fieldId
}: AuthPasswordFieldProps<T>) => (
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