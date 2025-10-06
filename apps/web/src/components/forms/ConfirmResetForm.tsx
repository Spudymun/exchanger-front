'use client';

import { AUTH_FIELD_IDS } from '@repo/constants';
import { useFormWithNextIntl, UseFormReturn } from '@repo/hooks';
import {
  AuthForm,
  FormEmailField,
  FormResetCodeField,
  AuthSubmitButton,
  FormField,
  FormControl,
  FormLabel,
  FormMessage,
  Input,
} from '@repo/ui';
import {
  fullySecurityEnhancedConfirmResetPasswordSchema,
  FullySecurityEnhancedConfirmResetPassword,
} from '@repo/utils';
import { useTranslations } from 'next-intl';
import React from 'react';

import {
  createAuthFormSubmitHandler,
  createAuthFormErrorHandler,
} from '../../hooks/useAuthFormConfig';
import { usePasswordMutations } from '../../hooks/usePasswordMutations';

/**
 * Confirm Password Reset Form
 * Step 2: Enter code + new password
 *
 * Следует pattern LoginForm.tsx
 */

interface ConfirmResetFormProps {
  email: string; // Передаётся из RequestResetForm
  onSuccess?: () => void;
  onBackToRequest?: () => void;
}

// Custom hook для логики формы
function useConfirmResetForm(email: string, onSuccess?: () => void) {
  const { resetPassword } = usePasswordMutations();
  const tValidation = useTranslations('AdvancedExchangeForm');

  const form = useFormWithNextIntl<FullySecurityEnhancedConfirmResetPassword>({
    initialValues: {
      email: email, // Pre-fill из предыдущего шага
      resetCode: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    validationSchema: fullySecurityEnhancedConfirmResetPasswordSchema,
    t: tValidation,
    onSubmit: async (values: FullySecurityEnhancedConfirmResetPassword) => {
      try {
        await resetPassword.mutateAsync({
          email: values.email,
          resetCode: values.resetCode,
          newPassword: values.newPassword,
          confirmNewPassword: values.confirmNewPassword,
        });

        // После успеха пользователь автоматически залогинен (см. backend)
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

export function ConfirmResetForm({ email, onSuccess, onBackToRequest }: ConfirmResetFormProps) {
  const { form, tValidation } = useConfirmResetForm(email, onSuccess);
  const { resetPassword } = usePasswordMutations();
  const t = useTranslations('Layout.forms.forgotPassword');

  return (
    <AuthForm
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      isLoading={form.isSubmitting || resetPassword.isPending}
      t={tValidation}
      fieldId={AUTH_FIELD_IDS.FORGOT_PASSWORD.RESET_CODE}
      formType="login"
      defaultErrorStyling="disabled"
    >
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <FormEmailField />
          <FormResetCodeField />
          
          {/* Custom field для newPassword (schema использует newPassword, не password) */}
          <FormField name="newPassword" error={form.errors.newPassword}>
            <FormLabel htmlFor={AUTH_FIELD_IDS.FORGOT_PASSWORD.NEW_PASSWORD} className="required">
              {tValidation('newPassword.label')}
            </FormLabel>
            <FormControl>
              <Input
                {...form.getFieldProps('newPassword')}
                id={AUTH_FIELD_IDS.FORGOT_PASSWORD.NEW_PASSWORD}
                type="password"
                placeholder={tValidation('newPassword.placeholder')}
                disabled={resetPassword.isPending}
                required
              />
            </FormControl>
            <FormMessage />
          </FormField>

          {/* Custom field для confirmNewPassword */}
          <FormField name="confirmNewPassword" error={form.errors.confirmNewPassword}>
            <FormLabel htmlFor={AUTH_FIELD_IDS.FORGOT_PASSWORD.CONFIRM_NEW_PASSWORD} className="required">
              {tValidation('confirmNewPassword.label')}
            </FormLabel>
            <FormControl>
              <Input
                {...form.getFieldProps('confirmNewPassword')}
                id={AUTH_FIELD_IDS.FORGOT_PASSWORD.CONFIRM_NEW_PASSWORD}
                type="password"
                placeholder={tValidation('confirmNewPassword.placeholder')}
                disabled={resetPassword.isPending}
                required
              />
            </FormControl>
            <FormMessage />
          </FormField>
          
          {/* Hint: Code expires in 15 minutes */}
          <p className="text-xs text-muted-foreground">{t('confirmStep.codeExpires')}</p>
        </AuthForm.FieldWrapper>

        <AuthForm.ActionsWrapper>
          <AuthSubmitButton>
            {resetPassword.isPending ? t('confirmStep.submitting') : t('confirmStep.submit')}
          </AuthSubmitButton>

          {onBackToRequest && (
            <button
              type="button"
              onClick={onBackToRequest}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={resetPassword.isPending}
            >
              {t('confirmStep.resendCode')}
            </button>
          )}
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
