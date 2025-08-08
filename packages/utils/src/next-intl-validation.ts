/**
 * Next-intl integrated validation system - ПЕРЕПИСАНО ДЛЯ ЕДИНОЙ ZOD СИСТЕМЫ
 * 
 * КРИТИЧЕСКИЕ ИЗМЕНЕНИЯ:
 * 1. УДАЛЕН regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/ - заменен на emailSchema
 * 2. УДАЛЕНА константа DEFAULT_PASSWORD_MIN_LENGTH - используется из схем
 * 3. ВСЕ функции validateSingle* переписаны для использования централизованных Zod схем
 * 
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Использует централизованные Zod схемы из validation-schemas.ts
 * Устраняет дублирование валидационной логики между системами
 */

import { VALIDATION_LIMITS } from '@repo/constants';
import React from 'react';
import { z } from 'zod';

import {
  emailSchema,
  legacyPasswordSchema,
  captchaSchema,
} from './validation-schemas';

/**
 * РЕВОЛЮЦИОННОЕ РЕШЕНИЕ: Validation error map для next-intl
 * Вместо создания собственной системы переводов, интегрируется с next-intl
 */
export interface NextIntlValidationConfig {
  /**
   * Функция перевода из next-intl
   * Принимает ключ типа 'validation.email.required' и возвращает переведенное сообщение
   */
  t: (key: string, values?: Record<string, string | number>) => string;

  /**
   * Текущая локаль (для отладки и fallback)
   */
  locale?: string;
}

// Константы для устранения дублирования
const INVALID_MESSAGE_KEY = 'validation.invalid';
const REQUIRED_MESSAGE_KEY = 'validation.required';
const CAPTCHA_REQUIRED_KEY = 'validation.captcha.required';
const CAPTCHA_NOT_VERIFIED_KEY = 'validation.captcha.notVerified';

/**
 * Обрабатывает специальные случаи валидации CAPTCHA
 */
function handleCaptchaValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'captcha') {
    return null;
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    return createCaptchaRequiredMessage(t);
  }

  if (issue.code === z.ZodIssueCode.custom) {
    return createCaptchaNotVerifiedMessage(t);
  }

  return null;
}

/**
 * Создает сообщение о необходимости заполнить CAPTCHA
 * Graceful fallback если next-intl недоступен
 */
function createCaptchaRequiredMessage(t: NextIntlValidationConfig['t']): { message: string } {
  const result = t(CAPTCHA_REQUIRED_KEY);

  // Если вернулся сырой ключ, используем английский fallback (универсальный)
  if (result.includes(CAPTCHA_REQUIRED_KEY)) {
    return { message: 'Please fill CAPTCHA' };
  }

  return { message: result };
}

/**
 * Создает сообщение о необходимости подтвердить CAPTCHA
 * Graceful fallback если next-intl недоступен
 */
function createCaptchaNotVerifiedMessage(t: NextIntlValidationConfig['t']): { message: string } {
  const result = t(CAPTCHA_NOT_VERIFIED_KEY);

  // Если вернулся сырой ключ, используем английский fallback (универсальный)
  if (result.includes(CAPTCHA_NOT_VERIFIED_KEY)) {
    return { message: 'Please confirm you are not a robot' };
  }

  return { message: result };
}

/**
 * Обрабатывает валидацию email поля - ОБНОВЛЕНО для работы с централизованной emailSchema
 */
function handleEmailValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'email') {
    return null;
  }

  if (issue.code === z.ZodIssueCode.invalid_string && issue.validation === 'email') {
    return { message: t('validation.email.invalid') };
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: t('validation.email.required') };
  }

  return null;
}/**
 * Обрабатывает валидацию password поля - ОБНОВЛЕНО для работы с централизованными схемами
 */
function handlePasswordValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'password') {
    return null;
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    const minLength = Number(issue.minimum || VALIDATION_LIMITS.PASSWORD_MIN_LENGTH);
    // Добавляем дополнительную проверку на валидность числа
    const validMinLength = isNaN(minLength) ? VALIDATION_LIMITS.PASSWORD_MIN_LENGTH : minLength;
    return { message: t('validation.password.minLength', { min: String(validMinLength) }) };
  }

  if (issue.code === z.ZodIssueCode.invalid_string) {
    if (issue.validation === 'regex') {
      return { message: t('validation.password.weak') };
    }
    return { message: t('validation.password.required') };
  }

  return null;
}

/**
 * УДАЛЕНА функция createPasswordMinLengthMessage - используем прямую интерполяцию
 */

/**
 * Обрабатывает валидацию confirmPassword поля
 */
function handleConfirmPasswordValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'confirmPassword') {
    return null;
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: t('validation.confirmPassword.required') };
  }

  if (issue.code === z.ZodIssueCode.custom) {
    return { message: t('validation.confirmPassword.noMatch') };
  }

  return null;
}

/**
 * Обрабатывает общие случаи валидации
 */
function handleGeneralValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  const fieldName = issue.path?.[0];

  switch (issue.code) {
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        // Специальная обработка для поля банка
        if (typeof fieldName === 'string' && fieldName.toLowerCase().includes('bank')) {
          return { message: t('validation.bank.required') || t('validation.selectBank') };
        }
        return { message: t(REQUIRED_MESSAGE_KEY) };
      }
      break;
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === 'string') {
        return { message: t(REQUIRED_MESSAGE_KEY) };
      }
      break;
    case z.ZodIssueCode.custom:
      return { message: t(INVALID_MESSAGE_KEY) };
  }

  return null;
}

/**
 * Создает Zod error map интегрированный с next-intl
 * ПРИНЦИП: Один источник истины для переводов - next-intl
 */
export function createNextIntlZodErrorMap(config: NextIntlValidationConfig): z.ZodErrorMap {
  const { t } = config;

  return (issue, ctx) => {
    return handleValidationIssue(issue, t) || { message: ctx.defaultError };
  };
}

/**
 * Главная функция обработки всех типов ошибок валидации
 */
function handleValidationIssue(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  // Проверяем специальные случаи
  const captchaResult = handleCaptchaValidation(issue, t);
  if (captchaResult) return captchaResult;

  const emailResult = handleEmailValidation(issue, t);
  if (emailResult) return emailResult;

  const passwordResult = handlePasswordValidation(issue, t);
  if (passwordResult) return passwordResult;

  const confirmPasswordResult = handleConfirmPasswordValidation(issue, t);
  if (confirmPasswordResult) return confirmPasswordResult;

  const amountResult = handleAmountValidation(issue, t);
  if (amountResult) return amountResult;

  return handleGeneralValidation(issue, t);
}

/**
 * Обрабатывает валидацию полей с суммами (fromAmount, amount, etc.)
 */
function handleAmountValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  const fieldName = issue.path?.[0];
  if (typeof fieldName !== 'string' || !fieldName.toLowerCase().includes('amount')) {
    return null;
  }

  if (issue.code === z.ZodIssueCode.invalid_string && issue.validation === 'regex') {
    return { message: t('validation.amount.format') };
  }

  if (issue.code === z.ZodIssueCode.custom) {
    // Попытка определить тип ошибки по сообщению или данным
    return { message: t('validation.amount.positive') };
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: t('validation.amount.required') || t('validation.required') };
  }

  return null;
}

/**
 * Валидирует форму с использованием next-intl переводов
 * ПРИНЦИП: Единый источник переводов для всей системы
 */
export function validateFormWithNextIntl<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  config: NextIntlValidationConfig
): z.SafeParseReturnType<unknown, T> {
  const errorMap = createNextIntlZodErrorMap(config);
  return schema.safeParse(data, { errorMap });
}

/**
 * Валидирует отдельное поле с использованием next-intl переводов
 */
export function validateFieldWithNextIntl<T extends Record<string, unknown>>(params: {
  validationSchema: z.ZodSchema<T>;
  values: T;
  fieldName: string;
  config: NextIntlValidationConfig;
}): { isValid: boolean; error: string | null } {
  const { values, fieldName, config } = params;
  const fieldValue = values[fieldName as keyof T];

  return validateFieldByType(fieldName, fieldValue, values, config);
}

/**
 * Валидирует поле по его типу
 */
function validateFieldByType<T extends Record<string, unknown>>(
  fieldName: string,
  fieldValue: unknown,
  values: T,
  config: NextIntlValidationConfig
): { isValid: boolean; error: string | null } {
  const specificValidation = validateSpecificFieldTypes(fieldName, fieldValue, values, config);
  if (specificValidation) {
    return specificValidation;
  }

  return validateGenericField(fieldValue, config);
}

/**
 * Валидация специфичных типов полей
 */
function validateSpecificFieldTypes<T extends Record<string, unknown>>(
  fieldName: string,
  fieldValue: unknown,
  values: T,
  config: NextIntlValidationConfig
): { isValid: boolean; error: string | null } | null {
  if (fieldName === 'email') {
    return validateSingleEmail(String(fieldValue), config);
  }

  if (fieldName === 'password') {
    return validateSinglePassword(String(fieldValue), config);
  }

  if (fieldName === 'confirmPassword') {
    return validateSingleConfirmPassword(String(fieldValue), String(values.password), config);
  }

  if (fieldName === 'captcha') {
    return validateSingleCaptcha(String(fieldValue), config);
  }

  return null;
}

/**
 * Валидация общих полей
 */
function validateGenericField(fieldValue: unknown, config: NextIntlValidationConfig): { isValid: boolean; error: string | null } {
  if (!fieldValue || String(fieldValue).trim() === '') {
    return { isValid: false, error: config.t(REQUIRED_MESSAGE_KEY) };
  }

  return { isValid: true, error: null };
}

/**
 * Валидирует email поле отдельно
 */
function validateSingleEmail(value: string, config: NextIntlValidationConfig): { isValid: boolean; error: string | null } {
  const result = emailSchema.safeParse(value);

  if (result.success) {
    return { isValid: true, error: null };
  }

  // Получаем первую ошибку и переводим через next-intl
  const firstError = result.error.errors[0];
  if (firstError) {
    if (firstError.code === z.ZodIssueCode.too_small) {
      return { isValid: false, error: config.t('validation.email.required') };
    }
    if (firstError.code === z.ZodIssueCode.invalid_string && firstError.validation === 'email') {
      return { isValid: false, error: config.t('validation.email.invalid') };
    }
  }

  return { isValid: false, error: config.t('validation.email.invalid') };
}

/**
 * Валидирует password поле отдельно
 */
function validateSinglePassword(value: string, config: NextIntlValidationConfig): { isValid: boolean; error: string | null } {
  const result = legacyPasswordSchema.safeParse(value);

  if (result.success) {
    return { isValid: true, error: null };
  }

  // Получаем первую ошибку и переводим через next-intl
  const firstError = result.error.errors[0];
  if (firstError) {
    if (firstError.code === z.ZodIssueCode.too_small) {
      const minLength = Number(firstError.minimum || VALIDATION_LIMITS.PASSWORD_MIN_LENGTH);
      // Добавляем дополнительную проверку на валидность числа
      const validMinLength = isNaN(minLength) ? VALIDATION_LIMITS.PASSWORD_MIN_LENGTH : minLength;
      
      return { isValid: false, error: config.t('validation.password.minLength', { min: validMinLength }) };
    }
    if (firstError.code === z.ZodIssueCode.invalid_string && firstError.validation === 'regex') {
      return { isValid: false, error: config.t('validation.password.weak') };
    }
  }

  return { isValid: false, error: config.t('validation.password.invalid') };
}

/**
 * Валидирует confirmPassword поле отдельно
 */
function validateSingleConfirmPassword(value: string, passwordValue: string, config: NextIntlValidationConfig): { isValid: boolean; error: string | null } {
  if (!value || value.trim() === '') {
    return { isValid: false, error: config.t('validation.confirmPassword.required') };
  }

  if (value !== passwordValue) {
    return { isValid: false, error: config.t('validation.confirmPassword.noMatch') };
  }

  return { isValid: true, error: null };
}

/**
 * Валидирует captcha поле отдельно
 */
function validateSingleCaptcha(value: string, config: NextIntlValidationConfig): { isValid: boolean; error: string | null } {
  const result = captchaSchema.safeParse(value);

  if (result.success) {
    return { isValid: true, error: null };
  }

  // Получаем первую ошибку и переводим через next-intl
  const firstError = result.error.errors[0];
  if (firstError) {
    if (firstError.code === z.ZodIssueCode.too_small) {
      return { isValid: false, error: config.t('validation.captcha.required') };
    }
    if (firstError.code === z.ZodIssueCode.custom) {
      return { isValid: false, error: config.t('validation.captcha.notVerified') };
    }
  }

  return { isValid: false, error: config.t('validation.captcha.notVerified') };
}

/**
 * Хук для использования в компонентах форм
 * ПРИНЦИП: Централизованное управление валидацией с локализацией
 */
export interface UseNextIntlValidationParams<T> {
  validationSchema?: z.ZodSchema<T>;
  values: T;
  setErrors: (errors: Partial<Record<keyof T, string>> | ((prev: Partial<Record<keyof T, string>>) => Partial<Record<keyof T, string>>)) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  locale?: string;
}

/**
 * Преобразует ошибки Zod в формат для формы
 */
function convertZodErrorsToFormErrors<T extends Record<string, unknown>>(
  errors: z.ZodError['errors']
): Partial<Record<keyof T, string>> {
  const formErrors: Partial<Record<keyof T, string>> = {};

  for (const err of errors) {
    if (err.path.length === 1) {
      const fieldName = err.path[0] as keyof T;
      // eslint-disable-next-line security/detect-object-injection
      formErrors[fieldName] = err.message;
    }
  }

  return formErrors;
}

export function useNextIntlValidation<T extends Record<string, unknown>>(
  params: UseNextIntlValidationParams<T>
) {
  const { validationSchema, values, setErrors, t, locale } = params;

  const config: NextIntlValidationConfig = { t, locale };

  const validateForm = React.useCallback(() => {
    if (!validationSchema) return true;

    const result = validateFormWithNextIntl(validationSchema, values, config);

    if (result.success) {
      setErrors({} as Partial<Record<keyof T, string>>);
      return true;
    }

    const formErrors = convertZodErrorsToFormErrors<T>(result.error.errors);
    setErrors(formErrors);
    return false;
  }, [validationSchema, values, setErrors, config]);

  const validateField = React.useCallback((field: keyof T) => {
    if (!validationSchema) return true;

    const result = validateFieldWithNextIntl({
      validationSchema,
      values,
      fieldName: String(field),
      config
    });

    if (result.isValid) {
      setErrors(prev => {
        const newErrors = { ...prev };
        // eslint-disable-next-line security/detect-object-injection
        delete newErrors[field];
        return newErrors;
      });
    } else if (result.error) {
      setErrors(prev => ({
        ...prev,
        [field]: result.error
      }));
    }

    return result.isValid;
  }, [validationSchema, values, setErrors, config]);

  return {
    validateForm,
    validateField
  };
}
