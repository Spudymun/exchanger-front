/**
 * Основные функции валидации с next-intl
 */

import { z } from 'zod';

import { NextIntlValidationConfig } from './constants';
import {
    handleCaptchaValidation,
    handleEmailValidation,
    handlePasswordValidation,
    handleConfirmPasswordValidation,
    handleAmountValidation,
    handleGeneralValidation
} from './handlers';

/**
 * Главная функция обработки всех типов ошибок валидации
 */
function handleValidationIssue(
    issue: z.ZodIssueOptionalMessage,
    t: NextIntlValidationConfig['t']
): { message: string } | null {
    // Проверяем специальные случаи в порядке приоритета
    return (
        handleCaptchaValidation(issue, t) ||
        handleEmailValidation(issue, t) ||
        handlePasswordValidation(issue, t) ||
        handleConfirmPasswordValidation(issue, t) ||
        handleAmountValidation(issue, t) ||
        handleGeneralValidation(issue, t)
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