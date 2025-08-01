'use client';

import { useForm, useNotifications } from '@repo/hooks/src/client-hooks';
import { FormField, FormControl, FormLabel, FormMessage, Input, Button } from '@repo/ui';
import { loginSchema } from '@repo/utils';
import { useTranslations, useLocale } from 'next-intl';
import React from 'react';

import { useAuthMutation } from '../../hooks/useAuthMutation';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

interface LoginFormData extends Record<string, unknown> {
  email: string;
  password: string;
}

/**
 * Login Form Component
 * Использует централизованные решения:
 * - useForm для управления формой и валидации
 * - useAuthMutation для авторизации через tRPC
 * - useNotifications для уведомлений
 * - loginSchema для валидации из @repo/utils
 */
export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuthMutation();
  const notifications = useNotifications();
  const t = useTranslations('Layout.forms.login');
  const locale = useLocale();

  const form = useForm<LoginFormData>({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    locale: locale, // Передаем локаль для локализации валидации
    onSubmit: async values => {
      try {
        await login.mutateAsync({
          email: values.email,
          password: values.password,
        });
        notifications.handleLoginSuccess();
        onSuccess?.();
      } catch (error) {
        notifications.handleLoginError(error);
      }
    },
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={form.handleSubmit} className="space-y-4">
        <LoginEmailField form={form} isLoading={login.isPending} t={t} />
        <LoginPasswordField form={form} isLoading={login.isPending} t={t} />
        <LoginSubmitButton form={form} isLoading={login.isPending} t={t} />
        <LoginSwitchButton onSwitch={onSwitchToRegister} isLoading={login.isPending} />
      </form>
    </div>
  );
}

interface LoginFieldProps {
  form: ReturnType<typeof useForm<LoginFormData>>;
  isLoading: boolean;
  t: (key: string) => string;
}

const LoginEmailField: React.FC<LoginFieldProps> = ({ form, isLoading, t }) => (
  <FormField name="email" error={form.errors.email}>
    <FormLabel htmlFor="login-email" className="required">
      {t('email.label')}
    </FormLabel>
    <FormControl>
      <Input
        {...form.getFieldProps('email')}
        id="login-email"
        type="email"
        placeholder={t('email.placeholder')}
        disabled={isLoading}
        required
      />
    </FormControl>
    <FormMessage />
  </FormField>
);

const LoginPasswordField: React.FC<LoginFieldProps> = ({ form, isLoading, t }) => (
  <FormField name="password" error={form.errors.password}>
    <FormLabel htmlFor="login-password" className="required">
      {t('password.label')}
    </FormLabel>
    <FormControl>
      <Input
        {...form.getFieldProps('password')}
        id="login-password"
        type="password"
        placeholder={t('password.placeholder')}
        disabled={isLoading}
        required
      />
    </FormControl>
    <FormMessage />
  </FormField>
);

const LoginSubmitButton: React.FC<LoginFieldProps> = ({ form, isLoading, t }) => (
  <Button type="submit" className="w-full" disabled={isLoading || !form.isValid}>
    {isLoading ? t('submitting') : t('submit')}
  </Button>
);

interface LoginSwitchButtonProps {
  onSwitch?: () => void;
  isLoading: boolean;
}

const LoginSwitchButton: React.FC<LoginSwitchButtonProps> = ({ onSwitch, isLoading }) => {
  const t = useTranslations('Layout.forms.login');

  if (!onSwitch) return null;

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={onSwitch}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
        disabled={isLoading}
      >
        {t('switchToRegister')}
      </button>
    </div>
  );
};
