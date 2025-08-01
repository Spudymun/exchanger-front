'use client';

import { useForm, useNotifications } from '@repo/hooks/src/client-hooks';
import { FormField, FormControl, FormLabel, FormMessage, Input, Button, MathCaptcha } from '@repo/ui';
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
  captcha: string;
  captchaVerified: boolean;
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
    initialValues: { email: '', password: '', captcha: '', captchaVerified: false },
    validationSchema: loginSchema,
    locale: locale, // Используем текущую локаль приложения для валидации
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
        <LoginCaptchaField form={form} isLoading={login.isPending} t={t} />
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

const LoginCaptchaField: React.FC<LoginFieldProps> = ({ form, isLoading, t }) => {
  return (
    <FormField name="captcha" error={form.errors.captcha}>
      <MathCaptcha
        name="captcha"
        difficulty="medium"
        disabled={isLoading}
        hideLabel={true}
        onAnswerChange={(answer) => form.setValue('captcha', answer)}
        onVerificationChange={(isVerified) => form.setValue('captchaVerified', isVerified)}
        labels={{
          question: t('captcha.question'),
          placeholder: t('captcha.placeholder'),
          refresh: t('captcha.refresh'),
          verification: t('captcha.verification'),
          error: t('captcha.error'),
        }}
      />
      <FormMessage />
    </FormField>
  );
};

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
