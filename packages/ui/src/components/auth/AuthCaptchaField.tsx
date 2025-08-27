import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { FormCaptchaField } from '../form-fields/FormCaptchaField';

/**
 * @deprecated Используйте FormCaptchaField из '@repo/ui/form-fields'
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
 * @deprecated Используйте FormCaptchaField из '@repo/ui/form-fields'
 * Этот компонент сохранен для обратной совместимости
 */
export const AuthCaptchaField = <T extends CaptchaFormFields = CaptchaFormFields>(
  props: AuthCaptchaFieldProps<T>
) => {
  // Просто переадресуем на новый универсальный компонент
  return <FormCaptchaField {...props} />;
};
