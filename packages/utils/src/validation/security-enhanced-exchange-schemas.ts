/**
 * Security-Enhanced Exchange Schemas
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Validation schemas для exchange operations
 * НА ОСНОВЕ: packages/utils/src/validation-schemas.ts
 * ИНТЕГРАЦИЯ: tRPC exchange routers
 */

import { VALIDATION_LIMITS } from '@repo/constants';
import { isAmountWithinLimits, type CryptoCurrency } from '@repo/exchange-core';
import { z } from 'zod';

import { sanitizeCardNumber, luhnCheck, validateCardLength } from './card-validation';
import { emailSchema } from './schemas-basic';
import { currencySchema } from './schemas-crypto';
import {
  createXSSProtectedString,
  containsPotentialXSS,
  SECURITY_VALIDATION_LIMITS,
} from './security-utils';

/**
 * CREATE EXCHANGE ORDER SCHEMA
 */
export const securityEnhancedCreateExchangeOrderSchema = z.object({
  email: emailSchema,
  cryptoAmount: z
    .number()
    .positive('AMOUNT_POSITIVE_REQUIRED')
    .min(VALIDATION_LIMITS.MIN_ORDER_AMOUNT, 'AMOUNT_MIN_REQUIRED')
    .max(VALIDATION_LIMITS.MAX_ORDER_AMOUNT, 'AMOUNT_MAX_EXCEEDED')
    .finite('AMOUNT_MUST_BE_FINITE'),
  uahAmount: z
    .number()
    .positive('UAH_AMOUNT_POSITIVE_REQUIRED')
    .finite('UAH_AMOUNT_MUST_BE_FINITE'),
  currency: currencySchema,
  paymentDetails: z
    .object({
      cardNumber: z
        .string()
        .min(SECURITY_VALIDATION_LIMITS.CARD_NUMBER_MIN_LENGTH, 'CARD_NUMBER_TOO_SHORT')
        .max(SECURITY_VALIDATION_LIMITS.CARD_NUMBER_MAX_LENGTH, 'CARD_NUMBER_TOO_LONG')
        .regex(/^\d+$/, 'CARD_NUMBER_DIGITS_ONLY')
        .transform(val => {
          if (containsPotentialXSS(val)) {
            throw new Error('INVALID_CHARACTERS_DETECTED');
          }
          return val.replace(/\s/g, '');
        })
        .optional(),
      bankDetails: createXSSProtectedString(
        0,
        SECURITY_VALIDATION_LIMITS.MESSAGE_MAX_LENGTH
      ).optional(),
    })
    .optional(),
});

/**
 * TYPE EXPORTS
 */

// Глобальное хранилище для передачи validation результатов в handlers
const currentValidationContext: {
  isValid: boolean;
  reason?: string;
  localizationKey?: string;
  params?: Record<string, string | number>;
} | null = null;

/**
 * Получить текущий контекст валидации для handlers
 */
export function getCurrentValidationContext() {
  return currentValidationContext;
}

/**
 * Check if amount is valid format
 */
function validateAmountFormat(fromAmount: string): number | null {
  if (!fromAmount || fromAmount === '' || Number.isNaN(Number(fromAmount))) {
    return null; // Skip if invalid format - handled by field validation
  }

  return Number(fromAmount);
}

/**
 * Validate crypto amount against business limits
 */
function validateBusinessLimits(amount: number, fromCurrency: string, ctx: z.RefinementCtx): void {
  try {
    const validation = isAmountWithinLimits(amount, fromCurrency as CryptoCurrency);

    if (!validation.isValid) {
      // Сохраняем контекст в глобальную переменную
      (globalThis as Record<string, unknown>).__currentValidationContext = validation;

      // НЕ устанавливаем message - позволяем errorMap обработать!
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fromAmount'],
        // БЕЗ message - позволяем errorMap работать!
      });
    }
  } catch {
    // Skip validation on error - don't block form if business logic fails
  }
}

/**
 * Business logic validation helper for crypto amounts
 */
function validateCryptoAmountLimits(
  fromAmount: string,
  fromCurrency: string,
  ctx: z.RefinementCtx
): void {
  const amount = validateAmountFormat(fromAmount);
  if (amount === null || !fromCurrency) {
    return;
  }

  validateBusinessLimits(amount, fromCurrency, ctx);
}

/**
 * SIMPLE EXCHANGE FORM SCHEMA
 * Для hero форм и базовых exchange операций - с интеграцией business validation
 */
export const securityEnhancedSimpleExchangeFormSchema = z
  .object({
    fromAmount: z
      .string()
      .min(1) // БЕЗ кастомного сообщения - позволяем errorMap работать
      .refine(val => {
        // Allow empty string
        if (val === '') return true;
        // Simple numeric validation without unsafe regex
        const num = Number(val);
        if (Number.isNaN(num)) return false;
        // Check decimal places
        const decimalParts = val.split('.');
        if (decimalParts.length > 2) return false;
        return true;
      }), // БЕЗ кастомного сообщения - позволяем errorMap работать
    fromCurrency: currencySchema,
    tokenStandard: z.string().optional(),
    toCurrency: z.string(),
    selectedBankId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    validateCryptoAmountLimits(data.fromAmount, data.fromCurrency, ctx);
  });

/**
 * UNIFIED EXCHANGE FORM SCHEMA - Композиция Simple схемы с дополнительными полями
 * ✅ SECURITY-ENHANCED: Унифицированная схема обмена (расширение Simple схемы)
 *
 * Наследует проверенную валидацию от securityEnhancedSimpleExchangeFormSchema
 * и добавляет дополнительные поля для расширенной формы обмена
 */
const unifiedExchangeBaseSchema = z.object({
  // Базовые поля из Simple схемы
  fromAmount: z
    .string()
    .min(1) // БЕЗ кастомного сообщения - позволяем errorMap работать
    .refine(val => {
      // Allow empty string
      if (val === '') return true;
      // Simple numeric validation without unsafe regex
      const num = Number(val);
      if (Number.isNaN(num)) return false;
      // Check decimal places
      const decimalParts = val.split('.');
      if (decimalParts.length > 2) return false;
      return true;
    }), // БЕЗ кастомного сообщения - позволяем errorMap работать
  fromCurrency: currencySchema,
  tokenStandard: z.string().optional(),
  toCurrency: z.string(),
  selectedBankId: z.string().optional(),

  // Дополнительные поля для расширенной формы обмена
  email: emailSchema,
  cardNumber: z
    .string()
    .min(1, 'CARD_NUMBER_REQUIRED')
    .transform(val => {
      if (containsPotentialXSS(val)) {
        throw new z.ZodError([
          {
            code: 'custom',
            message: 'INVALID_CHARACTERS_DETECTED',
            path: [],
          },
        ]);
      }
      return sanitizeCardNumber(val);
    })
    .refine(sanitized => validateCardLength(sanitized), 'INVALID_CARD_LENGTH')
    .refine(sanitized => luhnCheck(sanitized), 'INVALID_CARD_NUMBER'),
  captchaAnswer: createXSSProtectedString(1, SECURITY_VALIDATION_LIMITS.AUTH_CODE_MAX_LENGTH),
  agreeToTerms: z.boolean().refine(val => val === true, 'TERMS_ACCEPTANCE_REQUIRED'),
});

export const securityEnhancedUnifiedExchangeFormSchema = unifiedExchangeBaseSchema.superRefine(
  (data, ctx) => {
    // Используем ту же business validation что и в Simple схеме
    validateCryptoAmountLimits(data.fromAmount, data.fromCurrency, ctx);
  }
);

// ✅ Схема для hero формы (pick от базовой схемы без superRefine)
export const securityEnhancedHeroExchangeFormSchema = unifiedExchangeBaseSchema
  .pick({
    fromAmount: true,
    fromCurrency: true,
    tokenStandard: true,
    toCurrency: true,
    selectedBankId: true,
  })
  .superRefine((data, ctx) => {
    // Используем ту же business validation что и в Simple схеме
    validateCryptoAmountLimits(data.fromAmount, data.fromCurrency, ctx);
  });

/**
 * TYPE EXPORTS
 */
export type SecurityEnhancedCreateExchangeOrder = z.infer<
  typeof securityEnhancedCreateExchangeOrderSchema
>;

export type SecurityEnhancedSimpleExchangeForm = z.infer<
  typeof securityEnhancedSimpleExchangeFormSchema
>;

export type SecurityEnhancedUnifiedExchangeForm = z.infer<
  typeof securityEnhancedUnifiedExchangeFormSchema
>;

export type SecurityEnhancedHeroExchangeForm = z.infer<
  typeof securityEnhancedHeroExchangeFormSchema
>;
