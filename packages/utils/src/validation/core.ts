/**
 * Основные функции валидации с next-intl
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ:
 * Единая система валидации, интегрированная с next-intl для локализации.
 *
 * ПРИНЦИП РАБОТЫ:
 * 1. Формы создают функцию t через useTranslations('FormName')
 * 2. Zod схемы используют createNextIntlZodErrorMap с этой функцией t
 * 3. При ошибке валидации handlers получают ключ типа 'validation.field.error'
 * 4. Next-intl автоматически добавляет префикс: 'FormName.validation.field.error'
 * 5. Ищется перевод в JSON файлах и возвращается локализованное сообщение
 *
 * ПОЧЕМУ НЕ НУЖНО МЕНЯТЬ АРХИТЕКТУРУ:
 * - Система работает правильно и стабильно
 * - Переводы находятся и отображаются корректно
 * - Механизм префиксов next-intl обеспечивает правильную структуру
 */

import { z } from 'zod';

import { NextIntlValidationConfig } from './constants';
import {
  handleCaptchaValidation,
  handleEmailValidation,
  handlePasswordValidation,
  handleConfirmPasswordValidation,
  handleAmountValidation,
  handleCurrencyValidation,
  handleCardNumberValidation,
  handleNameValidation,
  handleTermsValidation,
  handleGeneralValidation,
} from './handlers';

/**
 * Главная функция обработки всех типов ошибок валидации
 */
function handleValidationIssue(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  // Проверяем специальные случаи формы в порядке приоритета
  return handleFormFieldValidation(issue, t) || handleGeneralValidation(issue, t);
}

/**
 * Обрабатывает специфичные поля формы
 */
function handleFormFieldValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  return (
    handleCaptchaValidation(issue, t) ||
    handleEmailValidation(issue, t) ||
    handlePasswordValidation(issue, t) ||
    handleConfirmPasswordValidation(issue, t) ||
    handleAmountValidation(issue, t) ||
    handleCurrencyValidation(issue, t) ||
    handleCardNumberValidation(issue, t) ||
    handleNameValidation(issue, t) ||
    handleTermsValidation(issue, t)
  );
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
