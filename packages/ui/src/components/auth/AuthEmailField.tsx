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
    form: UseFormReturn<T>;
    isLoading: boolean;
    t: (key: string) => string;
    fieldId: string;
}

export const AuthEmailField = <T extends EmailFormFields = EmailFormFields>({
    form,
    isLoading,
    t,
    fieldId
}: AuthEmailFieldProps<T>) => (
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