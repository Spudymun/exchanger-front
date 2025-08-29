import { AUTH_CAPTCHA_CONFIG } from '@repo/constants';
import { UseFormReturn } from '@repo/hooks';
import { useMathCaptcha, CAPTCHA_CONFIGS } from '@repo/hooks/src/business/useMathCaptcha';
import { useTranslations } from 'next-intl';
import React from 'react';

import { CaptchaFormFields } from '../../types/auth-fields';
import { FormField, FormMessage } from '../ui/form';
import { MathCaptcha } from '../ui/math-captcha';

/**
 * Универсальное поле CAPTCHA для всех форм
 * Рефакторинг: переименовано из AuthCaptchaField для универсального использования
 * Использует централизованную конфигурацию из констант
 * Устранена избыточность двойного поля captcha/captchaVerified
 * Централизованные переводы из Layout.captcha для устранения дублирования
 */

interface FormCaptchaFieldProps<T extends CaptchaFormFields = CaptchaFormFields> {
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  // Убираем t?: (key: string) => string - используем централизованные переводы
}

/**
 * Custom hook для управления CAPTCHA логикой
 */
function useCaptchaLogic<T extends CaptchaFormFields>(form: UseFormReturn<T>) {
  // Use centralized CAPTCHA hook from @repo/hooks (eliminate duplication)
  const config = CAPTCHA_CONFIGS[AUTH_CAPTCHA_CONFIG.DIFFICULTY] || CAPTCHA_CONFIGS.medium;
  const captcha = useMathCaptcha(config);

  // Централизованные переводы капчи из Layout контекста
  const tCaptcha = useTranslations('Layout.captcha');

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
  const getErrorMessage = React.useCallback(() => tCaptcha('error'), [tCaptcha]);

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

  return { captcha, captchaError: form.errors.captcha, tCaptcha };
}

export const FormCaptchaField = <T extends CaptchaFormFields = CaptchaFormFields>(
  props: FormCaptchaFieldProps<T>
) => {
  const { form, isLoading = false } = props;

  // Guard clause for required props when used without context
  if (!form) {
    console.warn('FormCaptchaField: form prop is required');
    return <div className="text-sm text-muted-foreground">Captcha field requires form context</div>;
  }

  const { captcha, captchaError, tCaptcha } = useCaptchaLogic(form);

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
          question: tCaptcha('question'),
          placeholder: tCaptcha('placeholder'),
          refresh: tCaptcha('refresh'),
          verification: tCaptcha('verification'),
          error: tCaptcha('error'),
        }}
      />
      <FormMessage />
    </FormField>
  );
};
