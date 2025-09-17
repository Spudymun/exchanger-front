import { createNotFoundError, createForbiddenError } from '@repo/utils';

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
export async function validateUserAccess(userId: string): Promise<User> {
  const user = await userManager.findById(userId);
  if (!user) {
    throw createNotFoundError(`User with ID "${userId}" not found`);
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
export async function validateOrderAccess(orderId: string, userEmail: string): Promise<Order> {
  const order = await orderManager.findById(orderId);
  if (!order) {
    throw createNotFoundError(`Order with ID "${orderId}" not found`);
  }

  // ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА: проверка доступа через userId
  const user = await userManager.findByEmail(userEmail);
  if (!user || order.userId !== user.id) {
    throw createForbiddenError('Access to order denied');
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
