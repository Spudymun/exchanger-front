'use client';

import { AUTH_FIELD_IDS } from '@repo/constants';
import { LoginFormData, LoginFormProps } from '@repo/exchange-core';
import { useFormWithNextIntl, UseFormReturn } from '@repo/hooks';
import {
  AuthForm,
  FormEmailField,
  AuthPasswordField,
  AuthCaptchaField,
  AuthSubmitButton,
  AuthSwitchButton,
} from '@repo/ui';
import { fullySecurityEnhancedLoginSchema } from '@repo/utils';
import { useTranslations } from 'next-intl';
import React from 'react';

import {
  createAuthFormSubmitHandler,
  createAuthFormErrorHandler,
} from '../../hooks/useAuthFormConfig';
import { useAuthMutationAdapter } from '../../hooks/useAuthMutationAdapter';

/**
 * Login Form Component
 * Рефакторинг: использует переиспользуемые компоненты полей
 * - AuthEmailField, AuthPasswordField, AuthCaptchaField - устраняют дублирование
 * - Централизованные константы из @repo/constants
 * - Типы из @repo/exchange-core
 */
// Custom hook для логики формы логина согласно CODE_STYLE_GUIDE.md
function useLoginForm(onSuccess?: () => void) {
  const { login } = useAuthMutationAdapter();
  const tValidation = useTranslations('AdvancedExchangeForm');

  const form = useFormWithNextIntl<LoginFormData>({
    initialValues: { email: '', password: '', captcha: '' },
    validationSchema: fullySecurityEnhancedLoginSchema,
    t: tValidation,
    onSubmit: async (values: LoginFormData) => {
      try {
        await login.mutateAsync({
          email: values.email,
          password: values.password,
          captcha: values.captcha,
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

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { form, tValidation } = useLoginForm(onSuccess);
  const { login } = useAuthMutationAdapter();
  const t = useTranslations('Layout.forms.login');

  return (
    <AuthForm
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      isLoading={login.isPending}
      t={tValidation}
      fieldId={AUTH_FIELD_IDS.LOGIN.EMAIL}
      formType="login"
    >
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <FormEmailField />
          <AuthPasswordField />
          <AuthCaptchaField />
        </AuthForm.FieldWrapper>
        <AuthForm.ActionsWrapper>
          <AuthSubmitButton />
          <AuthSwitchButton onSwitch={onSwitchToRegister} isLoading={login.isPending}>
            {t('switchToRegister')}
          </AuthSwitchButton>
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
