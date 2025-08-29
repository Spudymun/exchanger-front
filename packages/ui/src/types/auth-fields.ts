import { UseFormReturn } from '@repo/hooks';

/**
 * Централизованные типы для auth полей
 * Устраняет дублирование интерфейсов согласно Rule 20 (запрет избыточности)
 */

// Базовые интерфейсы для полей форм
export interface EmailFormFields extends Record<string, unknown> {
  email: string;
}

export interface PasswordFormFields extends Record<string, unknown> {
  password: string;
}

export interface ConfirmPasswordFormFields extends Record<string, unknown> {
  confirmPassword: string;
}

export interface CaptchaFormFields extends Record<string, unknown> {
  captcha: string;
  // Убрано: captchaVerified - избыточность устранена
}

// Базовый интерфейс для всех auth полей
// Поддерживает опциональность для использования в контексте
export interface BaseAuthFieldProps<T extends Record<string, unknown>> {
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;
  fieldId?: string;
}

// Специализированные типы
export type AuthPasswordFieldProps<T extends PasswordFormFields = PasswordFormFields> =
  BaseAuthFieldProps<T>;

export type AuthConfirmPasswordFieldProps<
  T extends ConfirmPasswordFormFields = ConfirmPasswordFormFields,
> = BaseAuthFieldProps<T>;

// AuthCaptchaFieldProps removed - use FormCaptchaField with CaptchaFormFields instead
