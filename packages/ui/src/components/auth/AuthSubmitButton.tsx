import { SUBMIT_BUTTON_STYLES } from '@repo/constants';
import { UseFormReturn } from '@repo/hooks';

import React from 'react';

import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

/**
 * Расширенная переиспользуемая кнопка отправки для форм - УНИФИЦИРОВАННАЯ
 * Поддерживает AuthForm, ExchangeForm и Hero формы с единой логикой
 */
export interface AuthSubmitButtonProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  // СУЩЕСТВУЮЩИЕ props для обратной совместимости
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;

  // НОВЫЕ props для унификации согласно плану
  variant?: 'default' | 'secondary' | 'outline'; // Используем РЕАЛЬНЫЕ варианты из button.tsx
  size?: 'default' | 'sm' | 'lg'; // Используем РЕАЛЬНЫЕ размеры из button.tsx

  // Legacy compatibility для ExchangeFormAction
  isValid?: boolean; // fallback если form не передан
  submitStyle?: 'auth' | 'hero' | 'exchange'; // Стиль submit button
  children?: React.ReactNode;
  className?: string;
}

// КОНТЕКСТНО-зависимые стили согласно плану
function getSubmitStyles(submitStyle: 'auth' | 'hero' | 'exchange') {
  switch (submitStyle) {
    case 'hero':
      return cn(SUBMIT_BUTTON_STYLES.EXCHANGE_RESPONSIVE, SUBMIT_BUTTON_STYLES.HERO_ANIMATION);
    case 'exchange':
      return SUBMIT_BUTTON_STYLES.EXCHANGE_RESPONSIVE;
    case 'auth':
    default:
      return SUBMIT_BUTTON_STYLES.AUTH_STANDARD;
  }
}

// КОНТЕКСТНО-зависимый текст согласно плану
function getButtonText(
  children: React.ReactNode,
  t: ((key: string) => string) | undefined,
  isLoading: boolean,
  submitStyle: 'auth' | 'hero' | 'exchange'
): React.ReactNode {
  if (children) return children;

  if (!t) {
    console.warn('AuthSubmitButton: t function required for automatic text');
    return 'Submit';
  }

  switch (submitStyle) {
    case 'hero':
    case 'exchange':
      return isLoading ? t('submitting') : t('exchange');
    case 'auth':
    default:
      return isLoading ? t('submitting') : t('submit');
  }
}

// AUTO-SIZE для hero/exchange согласно плану
function getFinalSize(submitStyle: 'auth' | 'hero' | 'exchange', size: 'default' | 'sm' | 'lg') {
  if ((submitStyle === 'hero' || submitStyle === 'exchange') && size === 'default') {
    return 'lg';
  }
  return size;
}

export const AuthSubmitButton = <T extends Record<string, unknown> = Record<string, unknown>>({
  form,
  isLoading = false,
  t,
  variant = 'default',
  size = 'default',
  isValid,
  submitStyle = 'auth',
  children,
  className,
  // Исключаем non-DOM props из ...props
  fieldId: _fieldId,
  formType: _formType,
  ...domProps
}: AuthSubmitButtonProps<T> & {
  fieldId?: string;
  formType?: string;
  [key: string]: unknown;
}) => {
  // СУЩЕСТВУЮЩАЯ валидация logic (сохранена для обратной совместимости)
  const getFormValidation = (): boolean => {
    if (form) {
      return form.isValid && Object.keys(form.errors).length === 0;
    }
    return isValid ?? false;
  };

  const finalIsValid = getFormValidation();
  const finalDisabled = isLoading || !finalIsValid;

  return (
    <Button
      type="submit"
      variant={variant}
      size={getFinalSize(submitStyle, size)}
      disabled={finalDisabled}
      className={cn(getSubmitStyles(submitStyle), className)}
      {...domProps}
    >
      {getButtonText(children, t, isLoading, submitStyle)}
    </Button>
  );
};
