/**
 * Константы для валидации с next-intl
 */

// Константы для устранения дублирования
export const VALIDATION_KEYS = {
    INVALID: 'validation.invalid',
    REQUIRED: 'validation.required',
    CAPTCHA_REQUIRED: 'validation.captcha.required',
    CAPTCHA_NOT_VERIFIED: 'validation.captcha.notVerified',
    EMAIL_INVALID: 'validation.email.invalid',
    EMAIL_REQUIRED: 'validation.email.required',
    PASSWORD_MIN_LENGTH: 'validation.password.minLength',
    PASSWORD_WEAK: 'validation.password.weak',
    PASSWORD_REQUIRED: 'validation.password.required',
    CONFIRM_PASSWORD_REQUIRED: 'validation.confirmPassword.required',
    CONFIRM_PASSWORD_NO_MATCH: 'validation.confirmPassword.noMatch',
    AMOUNT_FORMAT: 'validation.amount.format',
    AMOUNT_POSITIVE: 'validation.amount.positive',
    AMOUNT_REQUIRED: 'validation.amount.required'
} as const;

/**
 * Конфигурация для next-intl валидации
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