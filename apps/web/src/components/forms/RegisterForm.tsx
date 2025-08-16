'use client';

import { AUTH_FIELD_IDS } from '@repo/constants';
import { RegisterFormData, RegisterFormProps } from '@repo/exchange-core';
import { useFormWithNextIntl, UseFormReturn } from '@repo/hooks';
import {
  AuthForm,
  AuthEmailField,
  AuthPasswordField,
  AuthConfirmPasswordField,
  AuthCaptchaField,
  AuthSubmitButton,
  AuthSwitchButton,
} from '@repo/ui';
import { registerSchema } from '@repo/utils';
import { useTranslations } from 'next-intl';
import React from 'react';

import {
  createAuthFormSubmitHandler,
  createAuthFormErrorHandler,
} from '../../hooks/useAuthFormConfig';
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

  return (
    <AuthForm
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      isLoading={register.isPending}
      t={tValidation}
      fieldId={AUTH_FIELD_IDS.REGISTER.EMAIL}
      formType="register"
    >
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <AuthEmailField />
          <AuthPasswordField />
          <AuthConfirmPasswordField />
          <AuthCaptchaField />
        </AuthForm.FieldWrapper>
        <AuthForm.ActionsWrapper>
          <AuthSubmitButton />
          <AuthSwitchButton onSwitch={onSwitchToLogin} isLoading={register.isPending}>
            {t('switchToLogin')}
          </AuthSwitchButton>
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
