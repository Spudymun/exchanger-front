// Security-enhanced utility schemas
import { VALIDATION_LIMITS, EXCHANGE_VALIDATION_PATTERNS } from '@repo/constants';
import { z } from 'zod';

import { currencySchema } from './schemas-crypto';

import { securityEnhancedEmailSchema } from './security-enhanced-schemas';
import {
  createXSSProtectedString,
  SECURITY_VALIDATION_LIMITS,
  containsPotentialXSS,
} from './security-utils';

/**
 * Security-enhanced ID schema
 */
export const securityEnhancedIdSchema = z.string().uuid('INVALID_ID_FORMAT');

/**
 * Security-enhanced getById schema
 */
export const securityEnhancedGetByIdSchema = z.object({
  id: securityEnhancedIdSchema,
});

/**
 * Security-enhanced orderById schema
 */
export const securityEnhancedOrderByIdSchema = z.object({
  orderId: securityEnhancedIdSchema,
});

/**
 * Security-enhanced getOrderHistoryByEmail schema
 */
export const securityEnhancedGetOrderHistoryByEmailSchema = z.object({
  email: securityEnhancedEmailSchema,
  limit: z.number().min(1).max(100).default(VALIDATION_LIMITS.MIN_PAGE_SIZE),
});

/**
 * RECIPIENT DATA SCHEMA с enhanced security
 */
export const securityEnhancedRecipientDataSchema = z.object({
  cardNumber: z
    .string()
    .regex(EXCHANGE_VALIDATION_PATTERNS.CARD_NUMBER, 'Номер карты должен содержать точно 16 цифр')
    .optional(),
  bankDetails: createXSSProtectedString(
    0,
    SECURITY_VALIDATION_LIMITS.COMMENT_MAX_LENGTH
  ).optional(),
  recipientName: createXSSProtectedString(0, SECURITY_VALIDATION_LIMITS.NAME_MAX_LENGTH).optional(),
  phone: createXSSProtectedString(0, SECURITY_VALIDATION_LIMITS.PHONE_MAX_LENGTH).optional(),
});

/**
 * GET CURRENCY RATE SCHEMA с enhanced security
 */
export const securityEnhancedGetCurrencyRateSchema = z.object({
  currency: currencySchema,
});

/**
 * CALCULATE AMOUNT SCHEMA с enhanced security
 */
export const securityEnhancedCalculateAmountSchema = z.object({
  amount: z.number().positive(),
  currency: currencySchema,
  direction: z.enum(['crypto-to-uah', 'uah-to-crypto']),
});

export type SecurityEnhancedGetById = z.infer<typeof securityEnhancedGetByIdSchema>;
export type SecurityEnhancedOrderById = z.infer<typeof securityEnhancedOrderByIdSchema>;
export type SecurityEnhancedGetOrderHistoryByEmail = z.infer<
  typeof securityEnhancedGetOrderHistoryByEmailSchema
>;
export type SecurityEnhancedRecipientData = z.infer<typeof securityEnhancedRecipientDataSchema>;
export type SecurityEnhancedGetCurrencyRate = z.infer<typeof securityEnhancedGetCurrencyRateSchema>;

/**
 * QUICK ACTIONS SCHEMA с enhanced security
 * ЦЕЛЬ: Защита admin quick actions от XSS и injection атак
 * НА ОСНОВЕ: quickActionsSchema из schemas-utils.ts
 * ИНТЕГРАЦИЯ: tRPC shared routers для admin операций
 */
export const securityEnhancedQuickActionsSchema = z.object({
  action: z.enum(['REFRESH_RATES', 'CLEAR_CACHE', 'SEND_NOTIFICATION'], {
    errorMap: () => ({ message: 'INVALID_ACTION_TYPE' }),
  }),
  params: z
    .record(z.string())
    .optional()
    .refine(
      params => {
        if (!params) return true;
        // Проверяем каждый параметр на XSS
        return Object.values(params).every(value => !containsPotentialXSS(value));
      },
      { message: 'INVALID_CHARACTERS_DETECTED_IN_PARAMS' }
    ),
});

export type SecurityEnhancedQuickActions = z.infer<typeof securityEnhancedQuickActionsSchema>;
export type SecurityEnhancedCalculateAmount = z.infer<typeof securityEnhancedCalculateAmountSchema>;

// Re-export security utility functions
export { containsPotentialXSS, createXSSProtectedString } from './security-utils';
