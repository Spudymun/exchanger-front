/**
 * Security-Enhanced Exchange Schemas
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Validation schemas для exchange operations
 * НА ОСНОВЕ: packages/utils/src/validation-schemas.ts
 * ИНТЕГРАЦИЯ: tRPC exchange routers
 */

import { VALIDATION_LIMITS } from '@repo/constants';
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
 * SIMPLE EXCHANGE FORM SCHEMA
 */
export const securityEnhancedSimpleExchangeSchema = z.object({
  currency: z.enum(['BTC', 'ETH', 'USDT', 'LTC'] as const),
  cryptoAmount: z
    .string()
    .min(1, 'AMOUNT_REQUIRED')
    .max(SECURITY_VALIDATION_LIMITS.AMOUNT_MAX_LENGTH, 'AMOUNT_TOO_LONG')
    .refine(val => Number(val) > 0, 'AMOUNT_POSITIVE_REQUIRED')
    .refine(val => !isNaN(Number(val)), 'AMOUNT_MUST_BE_NUMBER')
    .transform(val => {
      if (containsPotentialXSS(val)) {
        throw new Error('INVALID_CHARACTERS_DETECTED');
      }
      return val.trim();
    }),
  email: emailSchema,
});

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
 * ENHANCED EXCHANGE FORM SCHEMA
 */
export const securityEnhancedExchangeSchema = z.object({
  fromCurrency: currencySchema,
  toCurrency: currencySchema,
  amount: z
    .number()
    .positive('AMOUNT_POSITIVE_REQUIRED')
    .min(VALIDATION_LIMITS.MIN_ORDER_AMOUNT, 'AMOUNT_MIN_REQUIRED')
    .max(VALIDATION_LIMITS.MAX_ORDER_AMOUNT, 'AMOUNT_MAX_EXCEEDED')
    .finite('AMOUNT_MUST_BE_FINITE'),
  email: emailSchema,
  comment: createXSSProtectedString(0, SECURITY_VALIDATION_LIMITS.COMMENT_MAX_LENGTH).optional(),
  agreeToTerms: z.boolean().refine(val => val === true, 'TERMS_AGREEMENT_REQUIRED'),
});

/**
 * ADVANCED EXCHANGE FORM SCHEMA
 */
export const securityEnhancedAdvancedExchangeFormSchema = z.object({
  fromCurrency: currencySchema,
  tokenStandard: z.string().optional(),
  cryptoAmount: z
    .string()
    .min(1, 'AMOUNT_REQUIRED')
    .refine(val => !isNaN(Number(val)), 'AMOUNT_MUST_BE_NUMBER')
    .refine(val => Number(val) > 0, 'AMOUNT_POSITIVE_REQUIRED')
    .transform(val => Number(val)),
  toCurrency: z.literal('UAH'),
  selectedBank: z.string().min(1, 'BANK_REQUIRED'),
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
  email: emailSchema,
  captchaAnswer: createXSSProtectedString(1, SECURITY_VALIDATION_LIMITS.AUTH_CODE_MAX_LENGTH),
  agreeToTerms: z.boolean().refine(val => val === true, 'TERMS_ACCEPTANCE_REQUIRED'),
});

/**
 * TYPE EXPORTS
 */
export type SecurityEnhancedSimpleExchangeForm = z.infer<
  typeof securityEnhancedSimpleExchangeSchema
>;
export type SecurityEnhancedCreateExchangeOrder = z.infer<
  typeof securityEnhancedCreateExchangeOrderSchema
>;
export type SecurityEnhancedExchangeForm = z.infer<typeof securityEnhancedExchangeSchema>;
export type SecurityEnhancedAdvancedExchangeForm = z.infer<
  typeof securityEnhancedAdvancedExchangeFormSchema
>;
