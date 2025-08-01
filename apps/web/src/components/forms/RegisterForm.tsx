'use client';

import { useForm, useNotifications } from '@repo/hooks/src/client-hooks';
import { FormField, FormControl, FormLabel, FormMessage, Input, Button } from '@repo/ui';
import { registerSchema } from '@repo/utils';
import { useTranslations, useLocale } from 'next-intl';
import React from 'react';

import { useAuthMutation } from '../../hooks/useAuthMutation';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

interface RegisterFormData extends Record<string, unknown> {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Register Form Component
 * Использует централизованные решения:
 * - useForm для управления формой и валидации
 * - useAuthMutation для регистрации через tRPC
 * - useNotifications для уведомлений
 * - registerSchema для валидации из @repo/utils
 */
export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuthMutation();
  const notifications = useNotifications();
  const t = useTranslations('Layout.forms.register');
  const locale = useLocale();

  const form = useForm<RegisterFormData>({
    initialValues: { email: '', password: '', confirmPassword: '' },
    validationSchema: registerSchema,
    locale: locale, // Передаем локаль для локализации валидации
    onSubmit: async values => {
      try {
        await register.mutateAsync({
          email: values.email,
          password: values.password,
        });
        notifications.success(t('successTitle'), t('successMessage'));
        onSuccess?.();
      } catch {
        notifications.error(t('errorTitle'), t('errorMessage'));
      }
    },
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={form.handleSubmit} className="space-y-4">
        <RegisterEmailField form={form} isLoading={register.isPending} t={t} />
        <RegisterPasswordField form={form} isLoading={register.isPending} t={t} />
        <RegisterConfirmPasswordField form={form} isLoading={register.isPending} t={t} />
        <RegisterSubmitButton form={form} isLoading={register.isPending} t={t} />
        <RegisterSwitchButton onSwitch={onSwitchToLogin} isLoading={register.isPending} />
      </form>
    </div>
  );
}

interface RegisterFieldProps {
  form: ReturnType<typeof useForm<RegisterFormData>>;
  isLoading: boolean;
  t: (key: string) => string;
}

const RegisterEmailField: React.FC<RegisterFieldProps> = ({ form, isLoading, t }) => (
  <FormField name="email" error={form.errors.email}>
    <FormLabel htmlFor="register-email" className="required">
      {t('email.label')}
    </FormLabel>
    <FormControl>
      <Input
        {...form.getFieldProps('email')}
        id="register-email"
        type="email"
        placeholder={t('email.placeholder')}
        disabled={isLoading}
        required
      />
    </FormControl>
    <FormMessage />
  </FormField>
);

const RegisterPasswordField: React.FC<RegisterFieldProps> = ({ form, isLoading, t }) => (
  <FormField name="password" error={form.errors.password}>
    <FormLabel htmlFor="register-password" className="required">
      {t('password.label')}
    </FormLabel>
    <FormControl>
      <Input
        {...form.getFieldProps('password')}
        id="register-password"
        type="password"
        placeholder={t('password.placeholder')}
        disabled={isLoading}
        required
      />
    </FormControl>
    <FormMessage />
  </FormField>
);

const RegisterConfirmPasswordField: React.FC<RegisterFieldProps> = ({ form, isLoading, t }) => (
  <FormField name="confirmPassword" error={form.errors.confirmPassword}>
    <FormLabel htmlFor="register-confirm-password" className="required">
      {t('confirmPassword.label')}
    </FormLabel>
    <FormControl>
      <Input
        {...form.getFieldProps('confirmPassword')}
        id="register-confirm-password"
        type="password"
        placeholder={t('confirmPassword.placeholder')}
        disabled={isLoading}
        required
      />
    </FormControl>
    <FormMessage />
  </FormField>
);

const RegisterSubmitButton: React.FC<RegisterFieldProps> = ({ form, isLoading, t }) => (
  <Button type="submit" className="w-full" disabled={isLoading || !form.isValid}>
    {isLoading ? t('submitting') : t('submit')}
  </Button>
);

interface RegisterSwitchButtonProps {
  onSwitch?: () => void;
  isLoading: boolean;
}

const RegisterSwitchButton: React.FC<RegisterSwitchButtonProps> = ({ onSwitch, isLoading }) => {
  const t = useTranslations('Layout.forms.register');

  if (!onSwitch) return null;

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={onSwitch}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
        disabled={isLoading}
      >
        {t('switchToLogin')}
      </button>
    </div>
  );
};
