// Security-enhanced operator schemas
import { ORDER_STATUSES } from '@repo/constants';
import { z } from 'zod';

import { securityEnhancedCursorPaginationSchema } from './security-enhanced-schemas';
import { createXSSProtectedString, SECURITY_VALIDATION_LIMITS } from './security-utils';

const OPERATOR_CHANGEABLE_STATUSES = [
  ORDER_STATUSES.PROCESSING,
  ORDER_STATUSES.COMPLETED,
  ORDER_STATUSES.CANCELLED,
] as const;

const OPERATOR_VIEWABLE_STATUSES = [ORDER_STATUSES.PENDING, ORDER_STATUSES.PROCESSING] as const;

/**
 * OPERATOR ORDERS SCHEMA с enhanced security
 */
export const securityEnhancedOperatorOrdersSchema = z.object({
  ...securityEnhancedCursorPaginationSchema.shape,
  status: z.enum(OPERATOR_VIEWABLE_STATUSES).optional(),
});

/**
 * UPDATE ORDER STATUS SCHEMA с enhanced security
 */
export const securityEnhancedUpdateOrderStatusSchema = z.object({
  orderId: z.string().uuid('INVALID_ORDER_ID'),
  status: z.enum(OPERATOR_CHANGEABLE_STATUSES),
  comment: createXSSProtectedString(0, SECURITY_VALIDATION_LIMITS.COMMENT_MAX_LENGTH).optional(),
});

export type SecurityEnhancedOperatorOrders = z.infer<typeof securityEnhancedOperatorOrdersSchema>;
export type SecurityEnhancedUpdateOrderStatus = z.infer<
  typeof securityEnhancedUpdateOrderStatusSchema
>;
