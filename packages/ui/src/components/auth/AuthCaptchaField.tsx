import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { CaptchaFormFields } from '../../types/auth-fields';
import { FormCaptchaField } from '../form-fields/FormCaptchaField';

/**
 * @deprecated Use FormCaptchaField from '@repo/ui/form-fields' instead.
 * This is a legacy wrapper. Will be removed in next major version.
 * Migration: Simply replace import and component name - API is identical.
 *
 * Переиспользуемое поле CAPTCHA для форм аутентификации - ИСПРАВЛЕННАЯ АРХИТЕКТУРА
 * Использует централизованную конфигурацию из констант
 * Устранена избыточность двойного поля captcha/captchaVerified
 */

interface AuthCaptchaFieldProps<T extends CaptchaFormFields = CaptchaFormFields> {
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;
}

/**
 * @deprecated Use FormCaptchaField from @repo/ui/form-fields instead.
 * This is a legacy wrapper. Will be removed in next major version.
 * Migration: Simply replace import and component name - API is identical.
 * Этот компонент сохранен для обратной совместимости
 */
export const AuthCaptchaField = <T extends CaptchaFormFields = CaptchaFormFields>(
  props: AuthCaptchaFieldProps<T>
) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'AuthCaptchaField is deprecated. Use FormCaptchaField from @repo/ui/form-fields instead.'
    );
  }
  // Просто переадресуем на новый универсальный компонент
  return <FormCaptchaField {...props} />;
};
