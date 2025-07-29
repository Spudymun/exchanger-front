'use client';

import { useForm, useNotifications } from '@repo/hooks/src/client-hooks';
import { FormField, FormControl, FormLabel, FormMessage, Input, Button } from '@repo/ui';
import { registerSchema } from '@repo/utils';
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
  const notifications = useNotifications();
  const { register } = useAuthMutation();

  const form = useForm<RegisterFormData>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: registerSchema,
    onSubmit: async values => {
      try {
        await register.mutateAsync({
          email: values.email,
          password: values.password,
        });
        notifications.success('Регистрация успешна', 'Проверьте email для подтверждения аккаунта');
        onSuccess?.();
      } catch {
        notifications.error('Ошибка регистрации', 'Попробуйте снова');
      }
    },
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={form.handleSubmit} className="space-y-4">
        <RegisterEmailField form={form} isLoading={register.isPending} />
        <RegisterPasswordField form={form} isLoading={register.isPending} />
        <RegisterConfirmPasswordField form={form} isLoading={register.isPending} />
        <RegisterSubmitButton form={form} isLoading={register.isPending} />
        <RegisterSwitchButton onSwitch={onSwitchToLogin} isLoading={register.isPending} />
      </form>
    </div>
  );
}

interface RegisterFieldProps {
  form: ReturnType<typeof useForm<RegisterFormData>>;
  isLoading: boolean;
}

const RegisterEmailField: React.FC<RegisterFieldProps> = ({ form, isLoading }) => (
  <FormField name="email" error={form.errors.email}>
    <FormLabel htmlFor="register-email" className="required">
      Email
    </FormLabel>
    <FormControl>
      <Input
        {...form.getFieldProps('email')}
        id="register-email"
        type="email"
        placeholder="your@email.com"
        disabled={isLoading}
        required
      />
    </FormControl>
    <FormMessage />
  </FormField>
);

const RegisterPasswordField: React.FC<RegisterFieldProps> = ({ form, isLoading }) => (
  <FormField name="password" error={form.errors.password}>
    <FormLabel htmlFor="register-password" className="required">
      Пароль
    </FormLabel>
    <FormControl>
      <Input
        {...form.getFieldProps('password')}
        id="register-password"
        type="password"
        placeholder="Минимум 6 символов"
        disabled={isLoading}
        required
      />
    </FormControl>
    <FormMessage />
  </FormField>
);

const RegisterConfirmPasswordField: React.FC<RegisterFieldProps> = ({ form, isLoading }) => (
  <FormField name="confirmPassword" error={form.errors.confirmPassword}>
    <FormLabel htmlFor="register-confirm-password" className="required">
      Подтвердите пароль
    </FormLabel>
    <FormControl>
      <Input
        {...form.getFieldProps('confirmPassword')}
        id="register-confirm-password"
        type="password"
        placeholder="Повторите пароль"
        disabled={isLoading}
        required
      />
    </FormControl>
    <FormMessage />
  </FormField>
);

const RegisterSubmitButton: React.FC<RegisterFieldProps> = ({ form, isLoading }) => (
  <Button type="submit" className="w-full" disabled={isLoading || !form.isValid}>
    {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
  </Button>
);

interface RegisterSwitchButtonProps {
  onSwitch?: () => void;
  isLoading: boolean;
}

const RegisterSwitchButton: React.FC<RegisterSwitchButtonProps> = ({ onSwitch, isLoading }) => {
  if (!onSwitch) return null;

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={onSwitch}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
        disabled={isLoading}
      >
        Уже есть аккаунт? Войти
      </button>
    </div>
  );
};
