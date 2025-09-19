// Security-enhanced operator schemas
import { ORDER_STATUSES } from '@repo/constants';
import { z } from 'zod';

import { createXSSProtectedStringWithLength } from './enhanced-building-blocks';
import { securityEnhancedCursorPaginationSchema } from './security-enhanced-schemas';
import { orderIdSchema } from './security-enhanced-utils';
import { SECURITY_VALIDATION_LIMITS } from './security-utils';

const _OPERATOR_CHANGEABLE_STATUSES = [
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
  orderId: orderIdSchema,
  status: z.enum(
    [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED] as const,
    {
      errorMap: () => ({ message: 'INVALID_ORDER_STATUS' }),
    }
  ),
  operatorNote: createXSSProtectedStringWithLength(
    0,
    SECURITY_VALIDATION_LIMITS.MESSAGE_MAX_LENGTH
  ).optional(),
  attachments: z
    .array(createXSSProtectedStringWithLength(1, SECURITY_VALIDATION_LIMITS.MESSAGE_MAX_LENGTH))
    .optional(),
});

export type SecurityEnhancedOperatorOrders = z.infer<typeof securityEnhancedOperatorOrdersSchema>;
export type SecurityEnhancedUpdateOrderStatus = z.infer<
  typeof securityEnhancedUpdateOrderStatusSchema
>;
