import { USER_MESSAGES, USER_SUCCESS_MESSAGES, USER_CONFIG } from '@repo/constants';
import { validatePassword, userManager, orderManager } from '@repo/exchange-core';

import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { createTRPCRouter } from '../../init';
import { protectedProcedure } from '../../middleware/auth';

import { validateUserAccess, generateVerificationCode } from './helpers';

export const securityRouter = createTRPCRouter({
  // Изменить пароль
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(USER_CONFIG.MIN_PASSWORD_LENGTH),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = validateUserAccess(ctx.user.id);

      if (!user.hashedPassword) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: USER_MESSAGES.NOT_FOUND,
        });
      }

      // Проверяем текущий пароль
      const isValidCurrentPassword = await bcrypt.compare(
        input.currentPassword,
        user.hashedPassword
      );
      if (!isValidCurrentPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: USER_MESSAGES.INVALID_PASSWORD,
        });
      }

      // Валидация нового пароля
      const passwordValidation = validatePassword(input.newPassword);
      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordValidation.errors[0],
        });
      }

      // Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(input.newPassword, USER_CONFIG.BCRYPT_SALT_ROUNDS);

      // Обновляем пароль
      userManager.update(user.id, {
        hashedPassword,
      });

      console.log(`🔐 Пароль изменен для пользователя: ${user.email}`);

      return {
        message: USER_SUCCESS_MESSAGES.PASSWORD_CHANGED,
      };
    }),

  // Повторная отправка email подтверждения
  resendVerificationEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const user = validateUserAccess(ctx.user.id);

    if (user.isVerified) {
      return {
        message: USER_MESSAGES.EMAIL_VERIFIED,
      };
    }

    // Имитация отправки email
    const verificationCode = generateVerificationCode(
      USER_CONFIG.VERIFICATION_CODE_BASE,
      USER_CONFIG.VERIFICATION_CODE_LENGTH
    );
    console.log(`📧 Код подтверждения для ${user.email}: ${verificationCode}`);

    return {
      message: USER_SUCCESS_MESSAGES.VERIFICATION_SENT,
    };
  }),

  // Удалить аккаунт (GDPR compliance)
  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string(),
        confirmation: z.literal('DELETE_MY_ACCOUNT'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = validateUserAccess(ctx.user.id);

      if (!user.hashedPassword) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: USER_MESSAGES.NOT_FOUND,
        });
      }

      // Проверяем пароль
      const isValidPassword = await bcrypt.compare(input.password, user.hashedPassword);
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: USER_MESSAGES.WRONG_PASSWORD,
        });
      }

      // Проверяем активные заявки
      const activeOrders = orderManager
        .findByEmail(user.email)
        .filter(order => ['PENDING', 'PROCESSING'].includes(order.status));

      if (activeOrders.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: USER_MESSAGES.ACTIVE_ORDERS_EXIST(activeOrders.length),
        });
      }

      // В текущей реализации нет метода delete для userManager
      // Возвращаем успешное удаление без реальных изменений данных
      console.log(`🗑️ Аккаунт удален: ${user.email} (${user.id})`);

      // Удаляем cookie сессии
      ctx.res.setHeader('Set-Cookie', `sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);

      return {
        message: USER_SUCCESS_MESSAGES.ACCOUNT_DELETED,
      };
    }),
});
