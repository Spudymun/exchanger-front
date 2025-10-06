'use client';

import { AUTH_FIELD_IDS } from '@repo/constants';
import { useFormWithNextIntl, UseFormReturn } from '@repo/hooks';
import { AuthForm, FormEmailField, AuthSubmitButton } from '@repo/ui';
import { securityEnhancedResetPasswordSchema, SecurityEnhancedResetPassword } from '@repo/utils';
import { useTranslations } from 'next-intl';
import React from 'react';

import {
  createAuthFormSubmitHandler,
  createAuthFormErrorHandler,
} from '../../hooks/useAuthFormConfig';
import { usePasswordMutations } from '../../hooks/usePasswordMutations';

/**
 * Request Password Reset Form
 * Step 1: Request reset code via email
 *
 * Следует pattern LoginForm.tsx
 * ВАЖНО: Captcha НЕ используется согласно securityEnhancedResetPasswordSchema
 */

interface RequestResetFormProps {
  onSuccess?: (email: string) => void;
  onBackToLogin?: () => void;
}

// Custom hook для логики формы (следуем LoginForm pattern)
function useRequestResetForm(onSuccess?: (email: string) => void) {
  const { requestPasswordReset } = usePasswordMutations();
  const tValidation = useTranslations('AdvancedExchangeForm');

  const form = useFormWithNextIntl<SecurityEnhancedResetPassword>({
    initialValues: {
      email: '',
    },
    validationSchema: securityEnhancedResetPasswordSchema,
    t: tValidation,
    onSubmit: async (values: SecurityEnhancedResetPassword) => {
      try {
        await requestPasswordReset.mutateAsync({
          email: values.email,
        });

        // После успеха вызываем callback с email для следующего шага
        if (onSuccess) {
          createAuthFormSubmitHandler(() => onSuccess(values.email))();
        }
      } catch (error) {
        createAuthFormErrorHandler()(error);
      }
    },
  });

  return { form, tValidation };
}

export function RequestResetForm({ onSuccess, onBackToLogin }: RequestResetFormProps) {
  const { form, tValidation } = useRequestResetForm(onSuccess);
  const { requestPasswordReset } = usePasswordMutations();
  const t = useTranslations('Layout.forms.forgotPassword');

  return (
    <AuthForm
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      isLoading={form.isSubmitting || requestPasswordReset.isPending}
      t={tValidation}
      fieldId={AUTH_FIELD_IDS.FORGOT_PASSWORD.EMAIL}
      formType="login"
      defaultErrorStyling="disabled"
    >
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <FormEmailField />
        </AuthForm.FieldWrapper>

        <AuthForm.ActionsWrapper>
          <AuthSubmitButton>
            {requestPasswordReset.isPending ? t('requestStep.submitting') : t('requestStep.submit')}
          </AuthSubmitButton>

          {onBackToLogin && (
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={requestPasswordReset.isPending}
            >
              {t('backToLogin')}
            </button>
          )}
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
