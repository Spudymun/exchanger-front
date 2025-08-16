import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { Button } from '../ui/button';

/**
 * Переиспользуемая кнопка отправки для форм аутентификации - ИСПРАВЛЕННАЯ
 * Унифицирует поведение и стили с реактивным состоянием
 */
interface AuthSubmitButtonProps<T extends Record<string, unknown> = Record<string, unknown>> {
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;
}

export const AuthSubmitButton = <T extends Record<string, unknown> = Record<string, unknown>>({
  form,
  isLoading = false,
  t,
}: AuthSubmitButtonProps<T>) => {
  // Guard clause for required props when used without context
  if (!form || !t) {
    console.warn(
      'AuthSubmitButton: form and t props are required when used without AuthForm context'
    );
    return <div className="text-sm text-muted-foreground">Submit button requires form context</div>;
  }

  // ИСПРАВЛЕНИЕ: Более точная проверка состояния формы
  // Учитываем не только общую валидность, но и отсутствие ошибок
  const isFormValid = form.isValid && Object.keys(form.errors).length === 0;

  return (
    <Button type="submit" className="submit-button" disabled={isLoading || !isFormValid}>
      {isLoading ? t('submitting') : t('submit')}
    </Button>
  );
};
