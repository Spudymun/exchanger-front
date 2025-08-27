import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { FormEmailField } from '../form-fields/FormEmailField';

/**
 * @deprecated Используйте FormEmailField из '@repo/ui/form-fields'
 * Переиспользуемое поле Email для форм аутентификации
 * Устраняет дублирование между LoginForm и RegisterForm
 */
interface EmailFormFields {
  email: string;
}

interface AuthEmailFieldProps<T extends EmailFormFields = EmailFormFields> {
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;
  fieldId?: string;
}

/**
 * @deprecated Используйте FormEmailField из '@repo/ui/form-fields'
 * Этот компонент сохранен для обратной совместимости
 */
export const AuthEmailField = <T extends EmailFormFields = EmailFormFields>(
  props: AuthEmailFieldProps<T>
) => {
  // Просто переадресуем на новый универсальный компонент
  return <FormEmailField {...props} />;
};
