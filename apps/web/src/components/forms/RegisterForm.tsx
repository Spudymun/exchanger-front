'use client';

import { AUTH_FIELD_IDS } from '@repo/constants';
import { RegisterFormData, RegisterFormProps } from '@repo/exchange-core';
import { useFormWithNextIntl } from '@repo/hooks';
import {
  AuthEmailField,
  AuthPasswordField,
  AuthConfirmPasswordField,
  AuthCaptchaField,
  AuthSubmitButton,
  AuthSwitchButton
} from '@repo/ui';
import { registerSchema } from '@repo/utils';
import { useTranslations } from 'next-intl';
import React from 'react';

import { createAuthFormSubmitHandler, createAuthFormErrorHandler } from '../../hooks/useAuthFormConfig';
import { useAuthMutationAdapter } from '../../hooks/useAuthMutationAdapter';


/**
 * Register Form Component
 * Рефакторинг: использует переиспользуемые компоненты полей
 * - AuthEmailField, AuthPasswordField, AuthConfirmPasswordField, AuthCaptchaField - устраняют дублирование
 * - Централизованные константы из @repo/constants
 * - Типы из @repo/exchange-core
 */
// Custom hook для логики формы регистрации согласно CODE_STYLE_GUIDE.md
function useRegisterForm(onSuccess?: () => void) {
  const { register } = useAuthMutationAdapter();
  const tValidation = useTranslations('AdvancedExchangeForm');

  const form = useFormWithNextIntl<RegisterFormData>({
    initialValues: { email: '', password: '', confirmPassword: '', captcha: '' },
    validationSchema: registerSchema,
    t: tValidation,
    onSubmit: async (values: RegisterFormData) => {
      try {
        await register.mutateAsync({
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
          captcha: values.captcha,
          // Убрано: captchaVerified - избыточность устранена
        });
        if (onSuccess) {
          createAuthFormSubmitHandler(onSuccess)();
        }
      } catch (error) {
        createAuthFormErrorHandler()(error);
      }
    },
  });

  return { form, tValidation };
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { form, tValidation } = useRegisterForm(onSuccess);
  const { register } = useAuthMutationAdapter();
  const t = useTranslations('Layout.forms.register');
  const tCaptcha = useTranslations('Layout.captcha');

  return (
    <div className="auth-form-container">
      <form onSubmit={form.handleSubmit} className="auth-form-fields">
        <AuthEmailField
          form={form}
          isLoading={register.isPending}
          t={t}
          fieldId={AUTH_FIELD_IDS.REGISTER.EMAIL}
        />
        <AuthPasswordField
          form={form}
          isLoading={register.isPending}
          t={tValidation}
          fieldId={AUTH_FIELD_IDS.REGISTER.PASSWORD}
        />
        <AuthConfirmPasswordField
          form={form}
          isLoading={register.isPending}
          t={tValidation}
          fieldId={AUTH_FIELD_IDS.REGISTER.CONFIRM_PASSWORD}
        />
        <AuthCaptchaField
          form={form}
          isLoading={register.isPending}
          t={tCaptcha}
        />
        <AuthSubmitButton
          form={form}
          isLoading={register.isPending}
          t={t}
        />
        <AuthSwitchButton
          onSwitch={onSwitchToLogin}
          isLoading={register.isPending}
        >
          {t('switchToLogin')}
        </AuthSwitchButton>
      </form>
    </div>
  );
}
