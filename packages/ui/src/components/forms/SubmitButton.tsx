import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { AuthSubmitButton } from '../auth/AuthSubmitButton';

/**
 * Универсальная кнопка отправки форм - семантически правильное имя
 * Поддерживает все типы форм: auth, exchange, hero
 *
 * ВНУТРЕННЕ ИСПОЛЬЗУЕТ AuthSubmitButton - никаких функциональных изменений!
 */
export interface SubmitButtonProps<T extends Record<string, unknown> = Record<string, unknown>> {
  // Form integration
  form?: UseFormReturn<T>;
  isLoading?: boolean;

  // Localization
  t?: (key: string) => string;

  // Appearance (соответствует button.tsx)
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';

  // Context-specific behavior - СЕМАНТИЧЕСКИ ПРАВИЛЬНО
  context?: 'auth' | 'exchange' | 'hero';

  // Legacy compatibility
  isValid?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * SubmitButton - универсальная кнопка отправки форм
 * Внутренне использует AuthSubmitButton для максимальной совместимости
 *
 * ✅ ZERO FUNCTIONAL CHANGES - только семантическое именование
 */
export const SubmitButton = <T extends Record<string, unknown> = Record<string, unknown>>({
  context = 'auth',
  ...props
}: SubmitButtonProps<T>) => {
  // Маппинг context → submitStyle для внутренней совместимости
  const submitStyle = context;

  return <AuthSubmitButton<T> submitStyle={submitStyle} {...props} />;
};

// Типы экспортируются автоматически через interface
