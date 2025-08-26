/**
 * Константы для валидации с next-intl
 *
 * ВАЖНО: Эти ключи используются БЕЗ префикса формы!
 *
 * МЕХАНИЗМ ПРЕФИКСОВ:
 * - Ключ 'validation.captcha.required' в handlers
 * - Функция t из useTranslations('AdvancedExchangeForm')
 * - Next-intl ищет: 'AdvancedExchangeForm.validation.captcha.required'
 * - Находит в JSON: { "AdvancedExchangeForm": { "validation": { "captcha": { "required": "Введите ответ на капчу" } } } }
 *
 * ПОЭТОМУ ключи здесь НЕ содержат префикс формы - он добавляется автоматически!
 */

// Константы для устранения дублирования
export const VALIDATION_KEYS = {
  INVALID: 'validation.invalid',
  REQUIRED: 'validation.required',
  XSS_DETECTED: 'validation.xss.detected',
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
  AMOUNT_REQUIRED: 'validation.amount.required',
  AMOUNT_MIN_VALUE: 'validation.amount.minValue',
  AMOUNT_MAX_VALUE: 'validation.amount.maxValue',
  CURRENCY_INVALID: 'validation.currency.invalid',
  CARD_NUMBER_REQUIRED: 'validation.cardNumber.required',
  CARD_NUMBER_INVALID: 'validation.cardNumber.invalid',
  TERMS_ACCEPTANCE_REQUIRED: 'validation.terms.required',
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
