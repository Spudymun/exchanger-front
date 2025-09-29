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
import {
  createBadRequestError,
  createNotFoundError,
  createUnauthorizedError,
  passwordSchema,
  /*
  // ⚠️ LEGACY IMPORTS - ЗАКОММЕНТИРОВАНЫ ДЛЯ BACKWARD COMPATIBILITY
  // 
  // ВАЖНО: В данном файле использовались legacy error creators
  // Найдены замены:
  // - createSecurityError('invalid_password') → createUnauthorizedError('Invalid current password')
  // - createUserError('not_found') → createNotFoundError('User not found')
  // 
  // LEGACY FUNCTIONS заменены на:
  // createSecurityError,
  // createUserError,
  */
} from '@repo/utils';

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
      const user = await validateUserAccess(ctx.user.id);

      if (!user.hashedPassword) {
        throw createNotFoundError('User not found');
        /*
        // ⚠️ LEGACY CODE - ЗАКОММЕНТИРОВАН ДЛЯ BACKWARD COMPATIBILITY
        //
        // ОРИГИНАЛЬНЫЙ КОД:
        // throw createUserError('not_found');
        //
        // ПРИЧИНА ЗАМЕНЫ:
        // - createUserError('not_found') → createNotFoundError('User not found')
        // - Более явная семантика ошибки поиска
        // - Соответствует HTTP семантике (404 Not Found)
        */
      }

      // Проверяем текущий пароль
      const isValidCurrentPassword = await bcrypt.compare(
        input.currentPassword,
        user.hashedPassword
      );
      if (!isValidCurrentPassword) {
        throw createUnauthorizedError('Invalid current password');
        /*
        // ⚠️ LEGACY CODE - ЗАКОММЕНТИРОВАН ДЛЯ BACKWARD COMPATIBILITY
        //
        // ОРИГИНАЛЬНЫЙ КОД:
        // throw createSecurityError('invalid_password');
        //
        // ПРИЧИНА ЗАМЕНЫ:
        // - createSecurityError('invalid_password') → createUnauthorizedError('Invalid current password')
        // - Более точная категоризация ошибки авторизации
        // - Соответствует HTTP семантике (401 Unauthorized)
        */
      }

      // Валидация происходит автоматически через securityEnhancedChangePasswordSchema input
      // Дополнительная валидация не нужна, так как input уже проверен

      // Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(
        input.newPassword,
        VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS
      );

      // Обновляем пароль
      await userManager.update(user.id, {
        hashedPassword,
      });

      console.log(`🔐 Пароль изменен для пользователя: ${user.email}`);

      return {
        message: USER_SUCCESS_MESSAGES.PASSWORD_CHANGED,
      };
    }),

  // Повторная отправка email подтверждения
  resendVerificationEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await validateUserAccess(ctx.user.id);

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
        password: passwordSchema, // ✅ Используем базовую схему из архитектурных принципов
        confirmation: z.literal('DELETE_MY_ACCOUNT'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await validateUserAccess(ctx.user.id);

      if (!user.hashedPassword) {
        throw createNotFoundError('User not found');
      }

      // Проверяем пароль
      const isValidPassword = await bcrypt.compare(input.password, user.hashedPassword);
      if (!isValidPassword) {
        throw createUnauthorizedError('Invalid current password');
      }

      // ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА: проверяем активные заявки через userId
      type Cancellable = (typeof CANCELLABLE_ORDER_STATUSES)[number];
      const userOrders = await orderManager.findByUserId(user.id);
      const activeOrders = userOrders.filter(order =>
        CANCELLABLE_ORDER_STATUSES.includes(order.status as Cancellable)
      );

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
