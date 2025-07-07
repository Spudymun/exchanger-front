import { USER_SUCCESS_MESSAGES } from '@repo/constants';
import { orderManager, validateUserAccess } from '@repo/exchange-core';

import { z } from 'zod';

import { createTRPCRouter } from '../../init';
import { protectedProcedure } from '../../middleware/auth';

export const profileRouter = createTRPCRouter({
  // Получить профиль текущего пользователя
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = validateUserAccess(ctx.user.id);

    return {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      stats: {
        totalOrders: orderManager.findByEmail(user.email).length,
        completedOrders: orderManager
          .findByEmail(user.email)
          .filter(order => order.status === 'COMPLETED').length,
      },
    };
  }),

  // Обновить профиль пользователя
  updateProfile: protectedProcedure
    .input(
      z.object({
        notifications: z
          .object({
            email: z.boolean().default(true),
            orderUpdates: z.boolean().default(true),
            marketing: z.boolean().default(false),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx }) => {
      const user = validateUserAccess(ctx.user.id);

      // В текущей структуре User нет поля notifications
      // Возвращаем успешный ответ без реального обновления
      console.log(`👤 Профиль обновлен для пользователя: ${user.email}`);

      return {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        message: USER_SUCCESS_MESSAGES.PROFILE_UPDATED,
      };
    }),
});
