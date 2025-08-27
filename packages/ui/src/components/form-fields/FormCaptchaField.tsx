import { AUTH_CAPTCHA_CONFIG } from '@repo/constants';
import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { useMathCaptchaLocal, CAPTCHA_CONFIGS_LOCAL } from '../../lib/useMathCaptchaLocal';
import { FormField, FormMessage } from '../ui/form';
import { MathCaptcha } from '../ui/math-captcha';

/**
 * Универсальное поле CAPTCHA для всех форм
 * Рефакторинг: переименовано из AuthCaptchaField для универсального использования
 * Использует централизованную конфигурацию из констант
 * Устранена избыточность двойного поля captcha/captchaVerified
 */
interface CaptchaFormFields {
  captcha: string;
  // Убрано: captchaVerified - избыточность устранена
}

interface FormCaptchaFieldProps<T extends CaptchaFormFields = CaptchaFormFields> {
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

  // Мемоизированные callbacks с стабильными зависимостями
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

  // Мемоизированная функция для получения сообщения об ошибке
  const getErrorMessage = React.useCallback(() => t('error'), [t]);

  // Стабильная ссылка на setValue
  const stableSetValue = React.useCallback(
    (value: string) => {
      if (form.setValue) {
        form.setValue('captcha' as keyof T, value as T[keyof T]);
      }
    },
    [form.setValue]
  );

  // Effects для управления состоянием
  React.useEffect(() => {
    // Синхронизируем captcha ответ с формой только при изменении captcha состояния
    const currentValue = form.values.captcha || '';
    if (captcha.userAnswer !== currentValue) {
      stableSetValue(captcha.userAnswer);
    }
  }, [captcha.userAnswer, form.values.captcha, stableSetValue]);

  React.useEffect(() => {
    if (captcha.isVerified) {
      clearCaptchaError();
    }
  }, [captcha.isVerified, clearCaptchaError]);

  React.useEffect(() => {
    if (captcha.hasError && captcha.userAnswer.trim() !== '') {
      setCaptchaError(getErrorMessage());
    }
  }, [captcha.hasError, captcha.userAnswer, setCaptchaError, getErrorMessage]);

  return { captcha, captchaError: form.errors.captcha };
}

export const FormCaptchaField = <T extends CaptchaFormFields = CaptchaFormFields>(
  props: FormCaptchaFieldProps<T>
) => {
  const { form, isLoading = false, t } = props;

  // Guard clause for required props when used without context
  if (!form || !t) {
    console.warn('FormCaptchaField: form and t props are required when used without context');
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
