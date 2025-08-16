import { AUTH_CAPTCHA_CONFIG } from '@repo/constants';
import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { useMathCaptchaLocal, CAPTCHA_CONFIGS_LOCAL } from '../../lib/useMathCaptchaLocal';
import { FormField, FormMessage } from '../ui/form';
import { MathCaptcha } from '../ui/math-captcha';

/**
 * Переиспользуемое поле CAPTCHA для форм аутентификации - ИСПРАВЛЕННАЯ АРХИТЕКТУРА
 * Использует централизованную конфигурацию из констант
 * Устранена избыточность двойного поля captcha/captchaVerified
 */
interface CaptchaFormFields {
  captcha: string;
  // Убрано: captchaVerified - избыточность устранена
}

interface AuthCaptchaFieldProps<T extends CaptchaFormFields = CaptchaFormFields> {
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;
}

/**
 * Custom hook для управления CAPTCHA логикой
 */
function useCaptchaLogic<T extends CaptchaFormFields>(
  form: UseFormReturn<T>,
  t: (key: string) => string
) {
  // Use local CAPTCHA hook to avoid dependency on @repo/hooks
  const config =
    CAPTCHA_CONFIGS_LOCAL[AUTH_CAPTCHA_CONFIG.DIFFICULTY] || CAPTCHA_CONFIGS_LOCAL.medium;
  const captcha = useMathCaptchaLocal(config);

  // Мемоизированные callbacks
  const updateCaptchaValue = React.useCallback(
    (value: string) => {
      form.setValue('captcha', value);
    },
    [form.setValue]
  );

  const clearCaptchaError = React.useCallback(() => {
    if (form.clearError) {
      form.clearError('captcha');
    }
  }, [form.clearError]);

  const setCaptchaError = React.useCallback(
    (message: string) => {
      if (form.setError) {
        form.setError('captcha', message);
      }
    },
    [form.setError]
  );

  // Effects для управления состоянием
  React.useEffect(() => {
    updateCaptchaValue(captcha.userAnswer);
  }, [captcha.userAnswer, updateCaptchaValue]);

  React.useEffect(() => {
    if (captcha.isVerified) {
      clearCaptchaError();
    }
  }, [captcha.isVerified, clearCaptchaError]);

  React.useEffect(() => {
    if (captcha.hasError && captcha.userAnswer.trim() !== '') {
      setCaptchaError(t('error'));
    }
  }, [captcha.hasError, captcha.userAnswer, setCaptchaError, t]);

  return { captcha, captchaError: form.errors.captcha };
}

export const AuthCaptchaField = <T extends CaptchaFormFields = CaptchaFormFields>(
  props: AuthCaptchaFieldProps<T>
) => {
  const { form, isLoading = false, t } = props;

  // Guard clause for required props when used without context
  if (!form || !t) {
    console.warn(
      'AuthCaptchaField: form and t props are required when used without AuthForm context'
    );
    return <div className="text-sm text-muted-foreground">Captcha field requires form context</div>;
  }

  const { captcha, captchaError } = useCaptchaLogic(form, t);

  return (
    <FormField name="captcha" error={captchaError}>
      <MathCaptcha
        name="captcha"
        question={captcha.challenge.question}
        userAnswer={captcha.userAnswer}
        isVerified={captcha.isVerified}
        hasError={captcha.hasError}
        onAnswerChange={captcha.setUserAnswer}
        onBlur={captcha.onBlur}
        onRefresh={captcha.refreshChallenge}
        disabled={isLoading}
        hideLabel={AUTH_CAPTCHA_CONFIG.HIDE_LABEL}
        labels={{
          question: t('question'),
          placeholder: t('placeholder'),
          refresh: t('refresh'),
          verification: t('verification'),
          error: t('error'),
        }}
      />
      <FormMessage />
    </FormField>
  );
};
