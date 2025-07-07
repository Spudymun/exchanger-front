import { USER_MESSAGES } from '@repo/constants';
import { TRPCError } from '@trpc/server';

import { userManager, orderManager } from '../data';
import type { User, Order } from '../types';

/**
 * Access validation functions for user and order operations
 * Centralized business logic for tRPC authentication and authorization
 */

/**
 * Validates user access and returns the user
 * @param userId - User ID to validate
 * @returns User object if found
 * @throws TRPCError if user not found
 */
export function validateUserAccess(userId: string): User {
  const user = userManager.findById(userId);
  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: USER_MESSAGES.NOT_FOUND,
    });
  }
  return user;
}

/**
 * Validates order access for a specific user and returns the order
 * @param orderId - Order ID to validate
 * @param userEmail - Email of the user requesting access
 * @returns Order object if found and user has access
 * @throws TRPCError if order not found or access denied
 */
export function validateOrderAccess(orderId: string, userEmail: string): Order {
  const order = orderManager.findById(orderId);
  if (!order) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: USER_MESSAGES.ORDER_NOT_FOUND,
    });
  }

  if (order.email !== userEmail) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: USER_MESSAGES.NO_ORDER_ACCESS,
    });
  }

  return order;
}

/**
 * Generates verification code for email verification
 * @param base - Number base for code generation
 * @param length - Length of the generated code
 * @returns Generated verification code
 */
export function generateVerificationCode(base: number, length: number): string {
  const STRING_START_INDEX = 2;
  return Math.random().toString(base).substring(STRING_START_INDEX, length).toUpperCase();
}
