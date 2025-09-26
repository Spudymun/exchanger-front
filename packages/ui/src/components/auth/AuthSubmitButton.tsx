"use client";

import { SUBMIT_BUTTON_STYLES } from '@repo/constants';
import { UseFormReturn } from '@repo/hooks';

import React, { useState, useCallback, useRef } from 'react';

import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { InlineSpinner } from '../ui/spinner';

// ✅ ВЫНЕСЕННАЯ логика debounce для соблюдения лимита строк
function useDebounceProtection(
  debounceMs: number,
  preventDoubleClick: boolean
) {
  const [isDebouncing, setIsDebouncing] = useState(false);
  const lastClickRef = useRef<number>(0);

  const checkDebounce = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    // 🔍 ДЕБАГ ЛОГИ для debounce проверки
    console.log('🔍 checkDebounce DEBUG:', {
      preventDoubleClick,
      isDebouncing,
      debounceMs
    });

    if (preventDoubleClick && isDebouncing) {
      console.log('🔍 BLOCKED by debouncing!');
      event.preventDefault();
      return false;
    }

    const now = Date.now();
    const timeSinceLastClick = now - lastClickRef.current;

    if (timeSinceLastClick < debounceMs) {
      console.log('🔍 BLOCKED by debounce timer!', { timeSinceLastClick, debounceMs });
      event.preventDefault();
      return false;
    }

    console.log('🔍 Click ALLOWED');
    lastClickRef.current = now;
    setIsDebouncing(true);
    setTimeout(() => setIsDebouncing(false), debounceMs);
    
    return true;
  }, [debounceMs, preventDoubleClick, isDebouncing]);

  return { isDebouncing, checkDebounce };
}

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

  // ✅ НОВЫЕ props для Double Submit Protection
  debounceMs?: number; // по умолчанию 300ms
  preventDoubleClick?: boolean; // по умолчанию true

  // ✅ НОВЫЕ props для Enhanced Loading System
  showSpinner?: boolean; // показывать spinner при isLoading, по умолчанию true
  spinnerPosition?: 'left' | 'right' | 'center'; // позиция spinner, по умолчанию 'left'
  spinnerSize?: 'xs' | 'sm' | 'base'; // размер из InlineSpinner, по умолчанию 'sm'
  spinnerVariant?: 'default' | 'secondary' | 'muted' | 'accent'; // стиль spinner
  preserveWidth?: boolean; // сохранять ширину при loading, по умолчанию true
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

// ✅ НОВАЯ функция рендера контента с spinner
function renderButtonContent({
  children,
  isLoading,
  showSpinner,
  spinnerPosition,
  spinnerSize,
  spinnerVariant
}: {
  children: React.ReactNode;
  isLoading: boolean;
  showSpinner: boolean;
  spinnerPosition: 'left' | 'right' | 'center';
  spinnerSize: 'xs' | 'sm' | 'base';
  spinnerVariant: 'default' | 'secondary' | 'muted' | 'accent';
}): React.ReactNode {
  // 🔍 ДЕБАГ ЛОГИ для renderButtonContent
  console.log('🔍 renderButtonContent DEBUG:', {
    isLoading,
    showSpinner,
    spinnerPosition,
    spinnerSize,
    spinnerVariant,
    shouldShowSpinner: isLoading && showSpinner
  });

  if (!isLoading || !showSpinner) {
    console.log('🔍 NOT showing spinner, returning children');
    return children;
  }

  console.log('🔍 SHOWING spinner!');

  const spinner = (
    <InlineSpinner
      size={spinnerSize}
      variant={spinnerVariant}
      show={true}
    />
  );

  switch (spinnerPosition) {
    case 'left':
      return <span className="flex items-center gap-2">{spinner} {children}</span>;
    case 'right':
      return <span className="flex items-center gap-2">{children} {spinner}</span>;
    case 'center':
      return spinner;
    default:
      return <span className="flex items-center gap-2">{spinner} {children}</span>;
  }
}

// ✅ ВЫНЕСЕННАЯ функция валидации для упрощения компонента
function useFormValidation<T extends Record<string, unknown>>(
  form?: UseFormReturn<T>,
  isValid?: boolean
) {
  return useCallback((): boolean => {
    if (form) {
      return form.isValid && Object.keys(form.errors).length === 0;
    }
    return isValid ?? false;
  }, [form, isValid]);
}

// ✅ ВЫНЕСЕННАЯ функция обработки клика
function useClickHandler<T extends Record<string, unknown>>(
  checkDebounce: (event: React.MouseEvent<HTMLButtonElement>) => boolean,
  form?: UseFormReturn<T>,
  domProps?: Record<string, unknown>,
  isLoading?: boolean
) {
  return useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // ✅ ФИКС: Проверяем disabled ПЕРВЫМ делом
      const target = event.currentTarget;
      if (target.disabled) {
        console.log('🔍 Click blocked - button is disabled');
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // ✅ ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: проверяем состояние загрузки напрямую
      if (isLoading || (form && form.isSubmitting)) {
        console.log('🔍 Click blocked - form is submitting', {
          isLoading,
          'form.isSubmitting': form?.isSubmitting
        });
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      console.log('🔍 handleClick DEBUG:', {
        hasForm: !!form,
        'form?.handleSubmit': !!form?.handleSubmit,
        hasOriginalOnClick: !!domProps?.onClick,
        isDisabled: target.disabled,
        isLoading,
        'form.isSubmitting': form?.isSubmitting
      });

      if (!checkDebounce(event)) {
        console.log('🔍 Click blocked by debounce');
        return;
      }

      if (form?.handleSubmit) {
        console.log('🔍 Calling form.handleSubmit');
        event.preventDefault();
        form.handleSubmit(event);
        return;
      }

      console.log('🔍 No form, checking original onClick');
      const originalOnClick = domProps?.onClick as React.MouseEventHandler<HTMLButtonElement> | undefined;
      if (originalOnClick) {
        console.log('🔍 Calling original onClick');
        originalOnClick(event);
      } else {
        console.log('🔍 No onClick handler!');
      }
    },
    [checkDebounce, form, domProps, isLoading]
  );
}

export const AuthSubmitButton = <T extends Record<string, unknown> = Record<string, unknown>>({
  form,
  isLoading,
  t,
  variant = 'default',
  size = 'default',
  isValid,
  submitStyle = 'auth',
  children,
  className,
  debounceMs = 300,
  preventDoubleClick = true,
  // ✅ НОВЫЕ props для Enhanced Loading System
  showSpinner = true,
  spinnerPosition = 'left',
  spinnerSize = 'sm',
  spinnerVariant = 'default',
  preserveWidth = true,
  // Исключаем non-DOM props из ...props
  fieldId: _fieldId,
  formType: _formType,
  ...domProps
}: AuthSubmitButtonProps<T> & {
  fieldId?: string;
  formType?: string;
  [key: string]: unknown;
}) => {
  // ✅ ФИКС: Ref для отслеживания состояния отправки
  const isSubmittingRef = useRef(false);
  
  const { isDebouncing, checkDebounce } = useDebounceProtection(debounceMs, preventDoubleClick);
  const getFormValidation = useFormValidation(form, isValid);
  
  // ✅ ФИКС: дефолтное значение в логике, а не в параметрах
  const finalIsLoading = isLoading ?? false;
  const finalIsValid = getFormValidation();
  const finalDisabled = finalIsLoading || !finalIsValid || (preventDoubleClick && isDebouncing);

  // ✅ НОВЫЙ обработчик клика с ref защитой
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // ✅ ПРОВЕРКА 1: disabled кнопка
      const target = event.currentTarget;
      if (target.disabled) {
        console.log('🔍 Click blocked - button is disabled');
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // ✅ ПРОВЕРКА 2: ref состояние отправки
      if (isSubmittingRef.current) {
        console.log('🔍 Click blocked - already submitting via ref');
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // ✅ ПРОВЕРКА 3: debounce
      if (!checkDebounce(event)) {
        console.log('🔍 Click blocked by debounce');
        return;
      }

      console.log('🔍 handleClick DEBUG:', {
        hasForm: !!form,
        'form?.handleSubmit': !!form?.handleSubmit,
        hasOriginalOnClick: !!domProps?.onClick,
        isDisabled: target.disabled,
        isLoading,
        'form.isSubmitting': form?.isSubmitting,
        'isSubmittingRef.current': isSubmittingRef.current
      });

      // ✅ УСТАНАВЛИВАЕМ ref ДО вызова handleSubmit
      isSubmittingRef.current = true;

      if (form?.handleSubmit) {
        console.log('🔍 Calling form.handleSubmit');
        event.preventDefault();
        form.handleSubmit(event);
        
        // ✅ Сбрасываем ref через небольшую задержку (для случая быстрой отправки)
        setTimeout(() => {
          isSubmittingRef.current = false;
        }, 1000);
        return;
      }

      console.log('🔍 No form, checking original onClick');
      const originalOnClick = domProps?.onClick as React.MouseEventHandler<HTMLButtonElement> | undefined;
      if (originalOnClick) {
        console.log('🔍 Calling original onClick');
        originalOnClick(event);
      } else {
        console.log('🔍 No onClick handler!');
      }
      
      // ✅ Сбрасываем ref для non-form случаев
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 1000);
    },
    [checkDebounce, form, domProps, isLoading]
  );

  // 🔍 ДЕБАГ ЛОГИ для отслеживания проблемы в модалках
  console.log('🔍 AuthSubmitButton DEBUG:', {
    receivedIsLoading: isLoading,
    finalIsLoading,
    finalIsValid,
    finalDisabled,
    isDebouncing,
    preventDoubleClick,
    submitStyle,
    'form?.isValid': form?.isValid,
    'form?.errors': form ? Object.keys(form.errors) : 'no form'
  });

  return (
    <Button
      type="submit"
      variant={variant}
      size={getFinalSize(submitStyle, size)}
      disabled={finalDisabled}
      className={cn(
        getSubmitStyles(submitStyle),
        preserveWidth && finalIsLoading && 'min-w-[120px]',
        className
      )}
      onClick={handleClick}
      {...domProps}
    >
      {renderButtonContent({
        children: getButtonText(children, t, finalIsLoading, submitStyle),
        isLoading: finalIsLoading,
        showSpinner,
        spinnerPosition,
        spinnerSize,
        spinnerVariant
      })}
    </Button>
  );
};
