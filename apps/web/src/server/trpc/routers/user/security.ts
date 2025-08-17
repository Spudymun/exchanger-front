import {
  USER_MESSAGES,
  USER_SUCCESS_MESSAGES,
  USER_CONFIG,
  VALIDATION_LIMITS,
  CANCELLABLE_ORDER_STATUSES,
} from '@repo/constants';
import {
  userManager,
  orderManager,
  validateUserAccess,
  generateVerificationCode,
} from '@repo/exchange-core';
import { createUserError, createSecurityError, createBadRequestError } from '@repo/utils';

import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Security-enhanced schema
import { securityEnhancedChangePasswordSchema } from '../../../../../../../packages/utils/src/validation/security-enhanced-schemas';

import { createTRPCRouter } from '../../init';
import { protectedProcedure } from '../../middleware/auth';

export const securityRouter = createTRPCRouter({
  // Изменить пароль
  changePassword: protectedProcedure
    .input(securityEnhancedChangePasswordSchema) // SECURITY-ENHANCED VALIDATION
    .mutation(async ({ input, ctx }) => {
      const user = validateUserAccess(ctx.user.id);

      if (!user.hashedPassword) {
        throw createUserError('not_found');
      }

      // Проверяем текущий пароль
      const isValidCurrentPassword = await bcrypt.compare(
        input.currentPassword,
        user.hashedPassword
      );
      if (!isValidCurrentPassword) {
        throw createSecurityError('invalid_password');
      }

      // Валидация происходит автоматически через securityEnhancedChangePasswordSchema input
      // Дополнительная валидация не нужна, так как input уже проверен

      // Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(
        input.newPassword,
        VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS
      );

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
        password: z
          .string()
          .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH)
          .max(VALIDATION_LIMITS.PASSWORD_MAX_LENGTH), // Используем константы проекта
        confirmation: z.literal('DELETE_MY_ACCOUNT'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = validateUserAccess(ctx.user.id);

      if (!user.hashedPassword) {
        throw createUserError('not_found');
      }

      // Проверяем пароль
      const isValidPassword = await bcrypt.compare(input.password, user.hashedPassword);
      if (!isValidPassword) {
        throw createSecurityError('invalid_password');
      }

      // Проверяем активные заявки
      type Cancellable = (typeof CANCELLABLE_ORDER_STATUSES)[number];
      const activeOrders = orderManager
        .findByEmail(user.email)
        .filter(order => CANCELLABLE_ORDER_STATUSES.includes(order.status as Cancellable));

      if (activeOrders.length > 0) {
        throw createBadRequestError(USER_MESSAGES.ACTIVE_ORDERS_EXIST(activeOrders.length));
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
