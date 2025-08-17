/**
 * Security-Enhanced Validation Schemas
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Расширение существующей validation системы
 * НА ОСНОВЕ:
 * - packages/utils/src/validation-schemas.ts (существующие patterns)
 * - packages/utils/src/validation/schemas-basic.ts (базовые схемы)
 * - @repo/constants/VALIDATION_LIMITS (централизованные константы)
 * - OWASP XSS Prevention Guidelines
 *
 * ПРИНЦИПЫ:
 * 1. Single Source of Truth - используем существующие константы
 * 2. Separation of Concerns - XSS protection как отдельный слой
 * 3. Consistency - интеграция с существующей next-intl системой
 * 4. Fail-Fast - валидация на раннем этапе
 */

import { VALIDATION_LIMITS } from '@repo/constants';
import { z } from 'zod';

import { emailSchema, passwordSchema } from './schemas-basic';
import { currencySchema } from './schemas-crypto';

import {
  createXSSProtectedString,
  containsPotentialXSS,
  SECURITY_VALIDATION_LIMITS,
  SECURITY_PATTERNS,
} from './security-utils';

/**
 * CAPTCHA SCHEMA с enhanced security - ПРАВИЛЬНАЯ АРХИТЕКТУРА
 * Использует локализованные ключи как оригинальная captchaSchema
 */
export const securityEnhancedCaptchaSchema = z
  .string()
  .min(1) // Используем стандартную проверку как в оригинале
  .refine(value => {
    // XSS защита перед основной проверкой
    if (containsPotentialXSS(value)) {
      return false;
    }
    // Базовая проверка на заполненность (как в оригинале)
    if (value.trim().length === 0) {
      return false;
    }
    return true;
  });

/**
 * EMAIL SCHEMA с enhanced security (базовая версия)
 */
export const securityEnhancedEmailSchema = emailSchema; // Используем существующую проверенную схему

// Импортируем существующие базовые схемы для расширения

/**
 * SIMPLE EXCHANGE FORM SCHEMA для базовой формы обмена
 * ЦЕЛЬ: Защита от XSS в простой форме exchange
 * ПОЛЯ: currency, cryptoAmount, email
 * НА ОСНОВЕ: existing ExchangeForm.tsx structure
 */
export const securityEnhancedSimpleExchangeSchema = z.object({
  // Currency выбор из enum без XSS угроз
  currency: z.enum(['BTC', 'ETH', 'USDT', 'LTC'] as const),

  // Crypto amount с XSS protection (как строка для ввода)
  cryptoAmount: z
    .string()
    .min(1, 'AMOUNT_REQUIRED')
    .max(SECURITY_VALIDATION_LIMITS.AMOUNT_MAX_LENGTH, 'AMOUNT_TOO_LONG')
    .refine(val => Number(val) > 0, 'AMOUNT_POSITIVE_REQUIRED')
    .refine(val => !isNaN(Number(val)), 'AMOUNT_MUST_BE_NUMBER')
    .transform(val => {
      // XSS protection for amount strings
      if (containsPotentialXSS(val)) {
        throw new Error('INVALID_CHARACTERS_DETECTED');
      }
      return val.trim();
    }),

  // Email с existing protection
  email: emailSchema,
});

/**
 * AUTH FORMS SCHEMAS с enhanced security
 * ЦЕЛЬ: Защита от XSS в формах авторизации
 * НА ОСНОВЕ: loginSchema, registerSchema из validation-schemas.ts
 */
export const securityEnhancedLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  captcha: securityEnhancedCaptchaSchema, // ИСПОЛЬЗУЕМ SECURITY-ENHANCED VERSION
});

export const securityEnhancedRegisterSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH),
    captcha: securityEnhancedCaptchaSchema, // ИСПОЛЬЗУЕМ SECURITY-ENHANCED VERSION
  })
  .refine(data => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'PASSWORD_CONFIRMATION_MISMATCH',
  });

/**
 * UPDATE NOTIFICATIONS SCHEMA с enhanced security
 * ЦЕЛЬ: Защита настроек пользователя от XSS
 * НА ОСНОВЕ: updateNotificationsSchema из validation-schemas.ts
 */
export const securityEnhancedUpdateNotificationsSchema = z.object({
  notifications: z
    .object({
      email: z.boolean().default(true),
      orderUpdates: z.boolean().default(true),
      marketing: z.boolean().default(false),
    })
    .optional(),
});

/**
 * AUTHENTICATION SCHEMAS с enhanced security
 * ЦЕЛЬ: Защита форм аутентификации от XSS атак
 * НА ОСНОВЕ: resetPasswordSchema, confirmResetPasswordSchema, confirmEmailSchema, changePasswordSchema
 * ИНТЕГРАЦИЯ: tRPC auth routers
 */

/**
 * RESET PASSWORD SCHEMA с enhanced security
 */
export const securityEnhancedResetPasswordSchema = z.object({
  email: emailSchema, // УЖЕ защищён от XSS
});

/**
 * CONFIRM RESET PASSWORD SCHEMA с enhanced security
 */
export const securityEnhancedConfirmResetPasswordSchema = z.object({
  email: emailSchema,
  resetCode: createXSSProtectedString(1, SECURITY_VALIDATION_LIMITS.AUTH_CODE_MAX_LENGTH).refine(
    val => val.length > 0,
    'RESET_CODE_REQUIRED'
  ),
  newPassword: passwordSchema, // УЖЕ имеет валидацию
});

/**
 * CONFIRM EMAIL SCHEMA с enhanced security
 */
export const securityEnhancedConfirmEmailSchema = z.object({
  email: emailSchema,
  verificationCode: createXSSProtectedString(
    1,
    SECURITY_VALIDATION_LIMITS.AUTH_CODE_MAX_LENGTH
  ).refine(val => val.length > 0, 'VERIFICATION_CODE_REQUIRED'),
});

/**
 * CHANGE PASSWORD SCHEMA с enhanced security
 */
export const securityEnhancedChangePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'PASSWORD_CONFIRMATION_MISMATCH',
  });

/**
 * SUPPORT SCHEMAS с enhanced security
 * ЦЕЛЬ: Защита форм поддержки от XSS атак
 * НА ОСНОВЕ: createTicketSchema, createTicketAdminSchema
 * ИНТЕГРАЦИЯ: tRPC support routers
 */

/**
 * CREATE TICKET SCHEMA с enhanced security
 */
export const securityEnhancedCreateTicketSchema = z.object({
  subject: createXSSProtectedString(
    VALIDATION_LIMITS.USERNAME_MIN_LENGTH,
    SECURITY_VALIDATION_LIMITS.SUBJECT_MAX_LENGTH
  ),
  description: createXSSProtectedString(
    SECURITY_VALIDATION_LIMITS.MESSAGE_MIN_LENGTH,
    SECURITY_VALIDATION_LIMITS.MESSAGE_MAX_LENGTH
  ),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

/**
 * CREATE TICKET ADMIN SCHEMA с enhanced security
 */
export const securityEnhancedCreateTicketAdminSchema = z.object({
  userId: z.string().uuid('INVALID_USER_ID'),
  subject: createXSSProtectedString(
    VALIDATION_LIMITS.USERNAME_MIN_LENGTH,
    SECURITY_VALIDATION_LIMITS.SUBJECT_MAX_LENGTH
  ),
  description: createXSSProtectedString(
    VALIDATION_LIMITS.PASSWORD_MIN_LENGTH,
    SECURITY_VALIDATION_LIMITS.MESSAGE_MAX_LENGTH
  ),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  category: createXSSProtectedString(1, SECURITY_VALIDATION_LIMITS.TAG_MAX_LENGTH),
});

/**
 * SEARCH SCHEMAS с enhanced security
 * ЦЕЛЬ: Защита поисковых форм от XSS атак
 * НА ОСНОВЕ: searchOrdersSchema, searchUsersSchema, searchKnowledgeSchema
 * ИНТЕГРАЦИЯ: tRPC shared routers
 */

/**
 * SEARCH ORDERS SCHEMA с enhanced security
 */
export const securityEnhancedSearchOrdersSchema = z.object({
  query: createXSSProtectedString(0, 100).optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  currency: currencySchema.optional(),
  dateFrom: z.string().optional(), // STRING dates для совместимости
  dateTo: z.string().optional(), // STRING dates для совместимости
  // Pagination fields
  limit: z.number().min(1).max(100).default(SECURITY_VALIDATION_LIMITS.SEARCH_DEFAULT_LIMIT),
  offset: z.number().min(0).default(0),
});

/**
 * SEARCH USERS SCHEMA с enhanced security
 */
export const securityEnhancedSearchUsersSchema = z.object({
  query: createXSSProtectedString(0, 100).optional(),
  verified: z.boolean().optional(), // CORRECTED to match original schema
  // Pagination fields
  limit: z.number().min(1).max(100).default(SECURITY_VALIDATION_LIMITS.SEARCH_DEFAULT_LIMIT),
  offset: z.number().min(0).default(0),
});

/**
 * SEARCH KNOWLEDGE SCHEMA с enhanced security
 */
export const securityEnhancedSearchKnowledgeSchema = z.object({
  query: createXSSProtectedString(1, SECURITY_VALIDATION_LIMITS.SEARCH_QUERY_MAX_LENGTH),
  category: createXSSProtectedString(0, SECURITY_VALIDATION_LIMITS.TAG_MAX_LENGTH).optional(),
  limit: z.number().min(1).max(100).default(SECURITY_VALIDATION_LIMITS.SEARCH_DEFAULT_LIMIT), // DEFAULT LIMIT FOR SEARCH RESULTS
});

/**
 * CREATE EXCHANGE ORDER SCHEMA с enhanced security
 * ЦЕЛЬ: Защита backend API от XSS в данных заказов
 * НА ОСНОВЕ: createExchangeOrderSchema из validation-schemas.ts
 * ИНТЕГРАЦИЯ: tRPC routers
 */
export const securityEnhancedCreateExchangeOrderSchema = z.object({
  // Email с existing protection
  email: emailSchema,

  // Amount с XSS protection
  cryptoAmount: z
    .number()
    .positive('AMOUNT_POSITIVE_REQUIRED')
    .min(VALIDATION_LIMITS.MIN_ORDER_AMOUNT, 'AMOUNT_MIN_REQUIRED')
    .max(VALIDATION_LIMITS.MAX_ORDER_AMOUNT, 'AMOUNT_MAX_EXCEEDED')
    .finite('AMOUNT_MUST_BE_FINITE'),

  // UAH amount для расчётов
  uahAmount: z
    .number()
    .positive('UAH_AMOUNT_POSITIVE_REQUIRED')
    .finite('UAH_AMOUNT_MUST_BE_FINITE'),

  // Currency selection
  currency: currencySchema,

  // Payment details с XSS protection
  paymentDetails: z
    .object({
      cardNumber: z
        .string()
        .min(SECURITY_VALIDATION_LIMITS.CARD_NUMBER_MIN_LENGTH, 'CARD_NUMBER_TOO_SHORT')
        .max(SECURITY_VALIDATION_LIMITS.CARD_NUMBER_MAX_LENGTH, 'CARD_NUMBER_TOO_LONG')
        .regex(/^\d+$/, 'CARD_NUMBER_DIGITS_ONLY')
        .transform(val => {
          // XSS protection для card numbers
          if (containsPotentialXSS(val)) {
            throw new Error('INVALID_CHARACTERS_DETECTED');
          }
          return val.replace(/\s/g, ''); // Remove spaces
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
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Расширение существующей exchangeFormSchema
 * НА ОСНОВЕ: validation-schemas.ts patterns
 * ИНТЕГРАЦИЯ: С существующими константами и схемами
 */
export const securityEnhancedExchangeSchema = z.object({
  // Используем СУЩЕСТВУЮЩИЕ схемы currencies для consistency
  fromCurrency: currencySchema,
  toCurrency: currencySchema,

  // Amount validation с EXISTING constants
  amount: z
    .number()
    .positive('AMOUNT_POSITIVE_REQUIRED')
    .min(VALIDATION_LIMITS.MIN_ORDER_AMOUNT, 'AMOUNT_MIN_REQUIRED')
    .max(VALIDATION_LIMITS.MAX_ORDER_AMOUNT, 'AMOUNT_MAX_EXCEEDED')
    .finite('AMOUNT_MUST_BE_FINITE'),

  // Email с EXISTING schema + XSS protection
  email: emailSchema, // УЖЕ имеет все нужные проверки

  // Comment с XSS protection
  comment: createXSSProtectedString(0, SECURITY_VALIDATION_LIMITS.COMMENT_MAX_LENGTH).optional(),

  // User Agreement
  agreeToTerms: z.boolean().refine(val => val === true, 'TERMS_AGREEMENT_REQUIRED'),
});

/**
 * ENHANCED USER PROFILE SCHEMA
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Для user-generated content с строгой валидацией
 * SECURITY FOCUS: Защита от XSS в profile данных
 */
export const securityEnhancedUserProfileSchema = z.object({
  // Name с XSS protection и length limits
  name: createXSSProtectedString(
    SECURITY_VALIDATION_LIMITS.NAME_MIN_LENGTH,
    VALIDATION_LIMITS.FIRST_NAME_MAX_LENGTH
  ),

  // Bio с XSS protection
  bio: createXSSProtectedString(0, SECURITY_VALIDATION_LIMITS.BIO_MAX_LENGTH).optional(),

  // Website URL с strict validation
  website: z
    .string()
    .url('WEBSITE_INVALID_URL')
    .refine(
      url => url.startsWith('http://') || url.startsWith('https://'),
      'WEBSITE_PROTOCOL_REQUIRED'
    )
    .optional(),

  // Phone - используем существующие patterns если есть
  phone: z
    .string()
    .regex(SECURITY_PATTERNS.PHONE, 'PHONE_INVALID_FORMAT')
    .max(SECURITY_VALIDATION_LIMITS.PHONE_MAX_LENGTH, 'PHONE_MAX_LENGTH')
    .optional(),
});

/**
 * ENHANCED CONTACT FORM SCHEMA
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Для contact/support форм с high security
 */
export const securityEnhancedContactSchema = z.object({
  // Name с XSS protection
  name: createXSSProtectedString(
    SECURITY_VALIDATION_LIMITS.NAME_MIN_LENGTH,
    VALIDATION_LIMITS.FIRST_NAME_MAX_LENGTH
  ),

  // Email - используем EXISTING validation
  email: emailSchema,

  // Subject с XSS protection
  subject: createXSSProtectedString(
    SECURITY_VALIDATION_LIMITS.SUBJECT_MIN_LENGTH,
    SECURITY_VALIDATION_LIMITS.SUBJECT_MAX_LENGTH
  ),

  // Message с XSS protection и reasonable limits
  message: createXSSProtectedString(
    SECURITY_VALIDATION_LIMITS.MESSAGE_MIN_LENGTH,
    SECURITY_VALIDATION_LIMITS.MESSAGE_MAX_LENGTH
  ),

  // Category для лучшей organization
  category: z
    .enum(['support', 'technical', 'billing', 'general'], {
      errorMap: () => ({ message: 'CATEGORY_INVALID' }),
    })
    .default('general'),
});

/**
 * ENHANCED ADMIN CONTENT SCHEMA
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Для admin-созданного content с relaxed XSS но strict validation
 * RATIONALE: Admins trusted, но все равно нужна базовая защита
 */
export const securityEnhancedAdminContentSchema = z.object({
  // Title с minimal XSS protection (admins need formatting)
  title: createXSSProtectedString(
    SECURITY_VALIDATION_LIMITS.TITLE_MIN_LENGTH,
    SECURITY_VALIDATION_LIMITS.TITLE_MAX_LENGTH
  ),

  // Content - более relaxed validation для admin content
  content: z
    .string()
    .min(SECURITY_VALIDATION_LIMITS.CONTENT_MIN_LENGTH, 'CONTENT_MIN_LENGTH')
    .max(SECURITY_VALIDATION_LIMITS.CONTENT_MAX_LENGTH, 'CONTENT_MAX_LENGTH'),

  // Slug для URL
  slug: z
    .string()
    .regex(SECURITY_PATTERNS.SLUG, 'SLUG_INVALID_FORMAT')
    .min(SECURITY_VALIDATION_LIMITS.SLUG_MIN_LENGTH, 'SLUG_MIN_LENGTH')
    .max(SECURITY_VALIDATION_LIMITS.SLUG_MAX_LENGTH, 'SLUG_MAX_LENGTH'),

  // Status
  status: z
    .enum(['draft', 'published', 'archived'], {
      errorMap: () => ({ message: 'STATUS_INVALID' }),
    })
    .default('draft'),

  // Tags
  tags: z
    .array(
      createXSSProtectedString(
        SECURITY_VALIDATION_LIMITS.TAG_MIN_LENGTH,
        SECURITY_VALIDATION_LIMITS.TAG_MAX_LENGTH
      )
    )
    .max(SECURITY_VALIDATION_LIMITS.TAGS_MAX_COUNT, 'TAGS_MAX_COUNT')
    .default([]),
});

/**
 * TYPE EXPORTS для TypeScript integration
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Экспорт типов для использования в компонентах
 */
export type SecurityEnhancedSimpleExchangeForm = z.infer<
  typeof securityEnhancedSimpleExchangeSchema
>;
export type SecurityEnhancedLoginForm = z.infer<typeof securityEnhancedLoginSchema>;
export type SecurityEnhancedRegisterForm = z.infer<typeof securityEnhancedRegisterSchema>;
export type SecurityEnhancedUpdateNotifications = z.infer<
  typeof securityEnhancedUpdateNotificationsSchema
>;
// Authentication types
export type SecurityEnhancedResetPassword = z.infer<typeof securityEnhancedResetPasswordSchema>;
export type SecurityEnhancedConfirmResetPassword = z.infer<
  typeof securityEnhancedConfirmResetPasswordSchema
>;
export type SecurityEnhancedConfirmEmail = z.infer<typeof securityEnhancedConfirmEmailSchema>;
export type SecurityEnhancedChangePassword = z.infer<typeof securityEnhancedChangePasswordSchema>;
// Support types
export type SecurityEnhancedCreateTicket = z.infer<typeof securityEnhancedCreateTicketSchema>;
export type SecurityEnhancedCreateTicketAdmin = z.infer<
  typeof securityEnhancedCreateTicketAdminSchema
>;
// Search types
export type SecurityEnhancedSearchOrders = z.infer<typeof securityEnhancedSearchOrdersSchema>;
export type SecurityEnhancedSearchUsers = z.infer<typeof securityEnhancedSearchUsersSchema>;
export type SecurityEnhancedSearchKnowledge = z.infer<typeof securityEnhancedSearchKnowledgeSchema>;
// Exchange types
export type SecurityEnhancedCreateExchangeOrder = z.infer<
  typeof securityEnhancedCreateExchangeOrderSchema
>;
export type SecurityEnhancedExchangeForm = z.infer<typeof securityEnhancedExchangeSchema>;
export type SecurityEnhancedUserProfile = z.infer<typeof securityEnhancedUserProfileSchema>;
export type SecurityEnhancedContactForm = z.infer<typeof securityEnhancedContactSchema>;
export type SecurityEnhancedAdminContent = z.infer<typeof securityEnhancedAdminContentSchema>;

/**
 * SUPPORT ADMIN SCHEMAS с enhanced security
 * Перенесены из validation-schemas.ts для полного покрытия
 */

/**
 * GET TICKETS SCHEMA с enhanced security
 */
export const securityEnhancedGetTicketsSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  // Pagination
  limit: z.number().min(1).max(100).default(SECURITY_VALIDATION_LIMITS.SEARCH_DEFAULT_LIMIT),
  offset: z.number().min(0).default(0),
});

/**
 * UPDATE TICKET STATUS SCHEMA с enhanced security
 */
export const securityEnhancedUpdateTicketStatusSchema = z.object({
  ticketId: z.string().uuid('INVALID_TICKET_ID'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  comment: createXSSProtectedString(0, SECURITY_VALIDATION_LIMITS.MESSAGE_MAX_LENGTH).optional(),
});

/**
 * TERMINATE SESSION SCHEMA с enhanced security
 */
export const securityEnhancedTerminateSessionSchema = z.object({
  sessionId: z.string().uuid('INVALID_SESSION_ID'),
});

/**
 * ADDITIONAL SCHEMAS - заменяют оставшиеся legacy schemas
 */

// ORDER STATUS SCHEMA с enhanced security
export const securityEnhancedOrderStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'cancelled',
  'failed',
] as const);

// PAGINATION SCHEMAS с enhanced security
export const securityEnhancedOffsetPaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(SECURITY_VALIDATION_LIMITS.SEARCH_DEFAULT_LIMIT),
  offset: z.number().min(0).default(0),
});

export const securityEnhancedCursorPaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(SECURITY_VALIDATION_LIMITS.SEARCH_DEFAULT_LIMIT),
  cursor: createXSSProtectedString(0, 100).optional(),
});

// Additional types
export type SecurityEnhancedGetTickets = z.infer<typeof securityEnhancedGetTicketsSchema>;
export type SecurityEnhancedUpdateTicketStatus = z.infer<
  typeof securityEnhancedUpdateTicketStatusSchema
>;
export type SecurityEnhancedTerminateSession = z.infer<
  typeof securityEnhancedTerminateSessionSchema
>;
export type SecurityEnhancedCaptcha = z.infer<typeof securityEnhancedCaptchaSchema>;
export type SecurityEnhancedEmail = z.infer<typeof securityEnhancedEmailSchema>;
export type SecurityEnhancedOrderStatus = z.infer<typeof securityEnhancedOrderStatusSchema>;
export type SecurityEnhancedOffsetPagination = z.infer<
  typeof securityEnhancedOffsetPaginationSchema
>;
export type SecurityEnhancedCursorPagination = z.infer<
  typeof securityEnhancedCursorPaginationSchema
>;
