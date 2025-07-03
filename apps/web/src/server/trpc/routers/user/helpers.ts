import { USER_MESSAGES } from '@repo/constants';
import type { User, Order } from '@repo/exchange-core';

import { userManager, orderManager } from '@repo/exchange-core';

import { TRPCError } from '@trpc/server';

/**
 * Валидирует доступ пользователя и возвращает пользователя
 */
export const validateUserAccess = (userId: string): User => {
  const user = userManager.findById(userId);
  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: USER_MESSAGES.NOT_FOUND,
    });
  }
  return user;
};

/**
 * Валидирует доступ к заявке и возвращает заявку
 */
export const validateOrderAccess = (orderId: string, userEmail: string): Order => {
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
};

/**
 * Генерирует код подтверждения
 */
export const generateVerificationCode = (base: number, length: number): string => {
  return Math.random().toString(base).substring(2, length).toUpperCase();
};
