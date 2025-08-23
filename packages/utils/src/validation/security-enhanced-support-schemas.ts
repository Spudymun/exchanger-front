/**
 * Security-Enhanced Support & Admin Schemas
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Validation schemas для support и admin functions
 * НА ОСНОВЕ: packages/utils/src/validation-schemas.ts
 * ИНТЕГРАЦИЯ: tRPC support и admin routers
 */

import { VALIDATION_LIMITS } from '@repo/constants';
import { z } from 'zod';

import { emailSchema } from './schemas-basic';
import { currencySchema } from './schemas-crypto';
import {
  createXSSProtectedString,
  SECURITY_VALIDATION_LIMITS,
  SECURITY_PATTERNS,
} from './security-utils';

/**
 * BASE PAGINATION SCHEMAS
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Базовые схемы для переиспользования
 */
export const securityEnhancedLimitOnlySchema = z.object({
  limit: z.number().min(1).max(100).default(SECURITY_VALIDATION_LIMITS.SEARCH_DEFAULT_LIMIT),
});

export const securityEnhancedOffsetPaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(SECURITY_VALIDATION_LIMITS.SEARCH_DEFAULT_LIMIT),
  offset: z.number().min(0).default(0),
});

export const securityEnhancedCursorPaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(SECURITY_VALIDATION_LIMITS.SEARCH_DEFAULT_LIMIT),
  cursor: createXSSProtectedString(0, 100).optional(),
});

/**
 * USER ORDERS PAGINATION SCHEMA
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Специальная схема для user orders с USER_CONFIG константами
 */
export const securityEnhancedUserOrdersPaginationSchema = z.object({
  page: z.coerce
    .number()
    .min(VALIDATION_LIMITS.MIN_PAGE_SIZE)
    .max(VALIDATION_LIMITS.MAX_PAGE_SIZE)
    .default(VALIDATION_LIMITS.DEFAULT_PAGE_SIZE)
    .describe('Page number (1-based)'),
  pageSize: z.coerce
    .number()
    .min(VALIDATION_LIMITS.MIN_PAGE_SIZE)
    .max(VALIDATION_LIMITS.MAX_PAGE_SIZE)
    .default(VALIDATION_LIMITS.DEFAULT_PAGE_SIZE)
    .describe('Number of results per page'),
});

/**
 * NOTIFICATIONS SCHEMA
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
 * SUPPORT SCHEMAS
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

export const securityEnhancedGetTicketsSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  ...securityEnhancedOffsetPaginationSchema.shape,
});

export const securityEnhancedUpdateTicketStatusSchema = z.object({
  ticketId: z.string().uuid('INVALID_TICKET_ID'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  comment: createXSSProtectedString(0, SECURITY_VALIDATION_LIMITS.MESSAGE_MAX_LENGTH).optional(),
});

/**
 * SEARCH SCHEMAS
 */
export const securityEnhancedSearchOrdersSchema = z.object({
  query: createXSSProtectedString(0, 100).optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  currency: currencySchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  ...securityEnhancedOffsetPaginationSchema.shape,
});

export const securityEnhancedSearchUsersSchema = z.object({
  query: createXSSProtectedString(0, 100).optional(),
  verified: z.boolean().optional(),
  ...securityEnhancedOffsetPaginationSchema.shape,
});

export const securityEnhancedSearchKnowledgeSchema = z.object({
  query: createXSSProtectedString(1, SECURITY_VALIDATION_LIMITS.SEARCH_QUERY_MAX_LENGTH),
  category: createXSSProtectedString(0, SECURITY_VALIDATION_LIMITS.TAG_MAX_LENGTH).optional(),
  ...securityEnhancedLimitOnlySchema.shape,
});

/**
 * USER PROFILE SCHEMAS
 */
export const securityEnhancedUserProfileSchema = z.object({
  name: createXSSProtectedString(
    SECURITY_VALIDATION_LIMITS.NAME_MIN_LENGTH,
    VALIDATION_LIMITS.FIRST_NAME_MAX_LENGTH
  ),
  bio: createXSSProtectedString(0, SECURITY_VALIDATION_LIMITS.BIO_MAX_LENGTH).optional(),
  website: z
    .string()
    .url('WEBSITE_INVALID_URL')
    .refine(
      url => url.startsWith('http://') || url.startsWith('https://'),
      'WEBSITE_PROTOCOL_REQUIRED'
    )
    .optional(),
  phone: z
    .string()
    .regex(SECURITY_PATTERNS.PHONE, 'PHONE_INVALID_FORMAT')
    .max(SECURITY_VALIDATION_LIMITS.PHONE_MAX_LENGTH, 'PHONE_MAX_LENGTH')
    .optional(),
});

/**
 * CONTACT FORM SCHEMA
 */
export const securityEnhancedContactSchema = z.object({
  name: createXSSProtectedString(
    SECURITY_VALIDATION_LIMITS.NAME_MIN_LENGTH,
    VALIDATION_LIMITS.FIRST_NAME_MAX_LENGTH
  ),
  email: emailSchema,
  subject: createXSSProtectedString(
    SECURITY_VALIDATION_LIMITS.SUBJECT_MIN_LENGTH,
    SECURITY_VALIDATION_LIMITS.SUBJECT_MAX_LENGTH
  ),
  message: createXSSProtectedString(
    SECURITY_VALIDATION_LIMITS.MESSAGE_MIN_LENGTH,
    SECURITY_VALIDATION_LIMITS.MESSAGE_MAX_LENGTH
  ),
  category: z
    .enum(['support', 'technical', 'billing', 'general'], {
      errorMap: () => ({ message: 'CATEGORY_INVALID' }),
    })
    .default('general'),
});

/**
 * ADMIN CONTENT SCHEMA
 */
export const securityEnhancedAdminContentSchema = z.object({
  title: createXSSProtectedString(
    SECURITY_VALIDATION_LIMITS.TITLE_MIN_LENGTH,
    SECURITY_VALIDATION_LIMITS.TITLE_MAX_LENGTH
  ),
  content: z
    .string()
    .min(SECURITY_VALIDATION_LIMITS.CONTENT_MIN_LENGTH, 'CONTENT_MIN_LENGTH')
    .max(SECURITY_VALIDATION_LIMITS.CONTENT_MAX_LENGTH, 'CONTENT_MAX_LENGTH'),
  slug: z
    .string()
    .regex(SECURITY_PATTERNS.SLUG, 'SLUG_INVALID_FORMAT')
    .min(SECURITY_VALIDATION_LIMITS.SLUG_MIN_LENGTH, 'SLUG_MIN_LENGTH')
    .max(SECURITY_VALIDATION_LIMITS.SLUG_MAX_LENGTH, 'SLUG_MAX_LENGTH'),
  status: z
    .enum(['draft', 'published', 'archived'], {
      errorMap: () => ({ message: 'STATUS_INVALID' }),
    })
    .default('draft'),
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
 * ADDITIONAL SCHEMAS
 */
export const securityEnhancedTerminateSessionSchema = z.object({
  sessionId: z.string().uuid('INVALID_SESSION_ID'),
});

export const securityEnhancedOrderStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'cancelled',
  'failed',
] as const);

/**
 * TYPE EXPORTS
 */
export type SecurityEnhancedUpdateNotifications = z.infer<
  typeof securityEnhancedUpdateNotificationsSchema
>;
export type SecurityEnhancedCreateTicket = z.infer<typeof securityEnhancedCreateTicketSchema>;
export type SecurityEnhancedCreateTicketAdmin = z.infer<
  typeof securityEnhancedCreateTicketAdminSchema
>;
export type SecurityEnhancedGetTickets = z.infer<typeof securityEnhancedGetTicketsSchema>;
export type SecurityEnhancedUpdateTicketStatus = z.infer<
  typeof securityEnhancedUpdateTicketStatusSchema
>;
export type SecurityEnhancedSearchOrders = z.infer<typeof securityEnhancedSearchOrdersSchema>;
export type SecurityEnhancedSearchUsers = z.infer<typeof securityEnhancedSearchUsersSchema>;
export type SecurityEnhancedSearchKnowledge = z.infer<typeof securityEnhancedSearchKnowledgeSchema>;
export type SecurityEnhancedUserProfile = z.infer<typeof securityEnhancedUserProfileSchema>;
export type SecurityEnhancedContactForm = z.infer<typeof securityEnhancedContactSchema>;
export type SecurityEnhancedAdminContent = z.infer<typeof securityEnhancedAdminContentSchema>;
export type SecurityEnhancedTerminateSession = z.infer<
  typeof securityEnhancedTerminateSessionSchema
>;
export type SecurityEnhancedOrderStatus = z.infer<typeof securityEnhancedOrderStatusSchema>;
export type SecurityEnhancedOffsetPagination = z.infer<
  typeof securityEnhancedOffsetPaginationSchema
>;
export type SecurityEnhancedCursorPagination = z.infer<
  typeof securityEnhancedCursorPaginationSchema
>;
