import { AUTH_CONSTANTS, VALIDATION_LIMITS } from '@repo/constants';
import {
  generateSessionId,
  sanitizeEmail,
  userManager,
  isAuthenticatedUser,
} from '@repo/exchange-core';
import {
  fullySecurityEnhancedRegisterSchema, // FULLY XSS-PROTECTED REGISTER SCHEMA
  fullySecurityEnhancedLoginSchema, // FULLY XSS-PROTECTED LOGIN SCHEMA
  createUserError,
  createValidationError,
  createBadRequestError,
} from '@repo/utils';

import bcrypt from 'bcryptjs';

// Temporary direct imports for new schemas
import {
  securityEnhancedResetPasswordSchema,
  securityEnhancedConfirmResetPasswordSchema,
  securityEnhancedConfirmEmailSchema,
} from '../../../../../../packages/utils/src/validation/security-enhanced-schemas';

import { createDelay } from '../../utils/delay';

import { createTRPCRouter, publicProcedure } from '../init';
import { rateLimitMiddleware } from '../middleware/rateLimit';

export const authRouter = createTRPCRouter({
  // Регистрация нового пользователя
  register: rateLimitMiddleware.register
    .input(fullySecurityEnhancedRegisterSchema)
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки
      await createDelay(AUTH_CONSTANTS.AUTH_REQUEST_DELAY_MS);

      // КРИТИЧНО: Проверяем CAPTCHA первым делом - простая проверка на заполненность
      if (!input.captcha || input.captcha.trim() === '') {
        throw createValidationError('CAPTCHA not filled');
      }

      // ИСПРАВЛЕНО: Убираем дублирование валидации
      // tRPC уже валидирует input через fullySecurityEnhancedRegisterSchema, дополнительная валидация избыточна
      const sanitizedEmail = sanitizeEmail(input.email);

      // Проверяем, не существует ли уже пользователь
      const existingUser = userManager.findByEmail(sanitizedEmail);
      if (existingUser) {
        throw createUserError('already_exists');
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(
        input.password,
        VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS
      );

      // Создаем пользователя
      const sessionId = generateSessionId();
      const user = userManager.create({
        email: sanitizedEmail,
        hashedPassword,
        sessionId,
        isVerified: false,
      });

      // Устанавливаем cookie с session ID
      ctx.res.setHeader(
        AUTH_CONSTANTS.SET_COOKIE_HEADER,
        `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
      );

      console.log(`👤 New user registered: ${sanitizedEmail}`);

      // Имитация отправки email подтверждения
      console.log(`📧 Confirmation email sent to ${sanitizedEmail}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
        },
        sessionId,
      };
    }),

  // Вход в систему
  login: rateLimitMiddleware.login
    .input(fullySecurityEnhancedLoginSchema)
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки
      await createDelay(AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS);

      // КРИТИЧНО: Проверяем CAPTCHA первым делом - простая проверка на заполненность
      if (!input.captcha || input.captcha.trim() === '') {
        throw createValidationError('CAPTCHA not filled');
      }

      const sanitizedEmail = sanitizeEmail(input.email);

      // Поиск пользователя
      const user = userManager.findByEmail(sanitizedEmail);
      if (!user || !user.hashedPassword) {
        throw createUserError('invalid_credentials');
      }

      // Проверка пароля
      const isValidPassword = await bcrypt.compare(input.password, user.hashedPassword);
      if (!isValidPassword) {
        throw createUserError('invalid_credentials');
      }

      // Генерируем новый session ID
      const sessionId = generateSessionId();
      userManager.update(user.id, {
        sessionId,
        lastLoginAt: new Date(),
      });

      // Устанавливаем cookie
      ctx.res.setHeader(
        AUTH_CONSTANTS.SET_COOKIE_HEADER,
        `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
      );

      console.log(`🔐 User logged in: ${sanitizedEmail}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
        },
        sessionId,
      };
    }),

  // Выход из системы
  logout: publicProcedure.mutation(async ({ ctx }) => {
    // Очищаем cookie
    ctx.res.setHeader('Set-Cookie', `sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);

    console.log(`🔓 User logged out`);

    return {
      message: 'Logout successful',
    };
  }),

  // Получить текущую сессию
  getSession: publicProcedure.query(async ({ ctx }) => {
    // Если нет пользователя в контексте, возвращаем null
    if (!isAuthenticatedUser(ctx.user)) {
      return { user: null };
    }

    // TypeScript теперь знает, что user: User
    const user = ctx.user;

    return {
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
      },
    };
  }),

  // Восстановление пароля (шаг 1 - отправка кода)
  requestPasswordReset: rateLimitMiddleware.resetPassword
    .input(securityEnhancedResetPasswordSchema) // SECURITY-ENHANCED VALIDATION
    .mutation(async ({ input }) => {
      // Имитация задержки
      await createDelay(AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS);

      const sanitizedEmail = sanitizeEmail(input.email);

      // Проверяем, существует ли пользователь
      const user = userManager.findByEmail(sanitizedEmail);
      if (!user) {
        // Не раскрываем информацию о существовании пользователя
        console.log(`🔒 Password reset attempt for non-existent email: ${sanitizedEmail}`);
      } else {
        console.log(`🔑 Password reset request for: ${sanitizedEmail}`);

        // Имитация отправки email с кодом восстановления
        const resetCode = Math.random()
          .toString(AUTH_CONSTANTS.RESET_CODE_BASE)
          .substring(AUTH_CONSTANTS.RESET_CODE_START, AUTH_CONSTANTS.RESET_CODE_END)
          .toUpperCase();
        console.log(`📧 Recovery code for ${sanitizedEmail}: ${resetCode}`);
      }

      // Всегда возвращаем успешный ответ для безопасности
      return {
        message: 'If the specified email exists, a recovery code will be sent to it',
      };
    }),

  // Восстановление пароля (шаг 2 - сброс с кодом)
  resetPassword: publicProcedure
    .input(securityEnhancedConfirmResetPasswordSchema) // SECURITY-ENHANCED VALIDATION
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки
      await createDelay(AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS);

      const sanitizedEmail = sanitizeEmail(input.email);

      // Валидация нового пароля с помощью Security Enhanced Zod схемы
      const passwordResult = securityEnhancedConfirmResetPasswordSchema.shape.newPassword.safeParse(
        input.newPassword
      );
      if (!passwordResult.success) {
        throw createValidationError(
          passwordResult.error.issues[0]?.message || 'Invalid new password format'
        );
      }

      // В реальном приложении здесь была бы проверка кода из базы/Redis
      // Для мока просто проверяем существование пользователя
      const user = userManager.findByEmail(sanitizedEmail);
      if (!user) {
        throw createBadRequestError('Invalid recovery code');
      }

      // Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(
        input.newPassword,
        VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS
      );

      // Генерируем новый session ID
      const sessionId = generateSessionId();

      // Обновляем пользователя
      userManager.update(user.id, {
        hashedPassword,
        sessionId,
      });

      // Устанавливаем cookie
      ctx.res.setHeader(
        AUTH_CONSTANTS.SET_COOKIE_HEADER,
        `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
      );

      console.log(`🔓 Password changed for user: ${sanitizedEmail}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
        },
        sessionId,
      };
    }),

  // Подтверждение email (упрощенная версия)
  verifyEmail: publicProcedure
    .input(securityEnhancedConfirmEmailSchema)
    .mutation(async ({ input }) => {
      // SECURITY-ENHANCED VALIDATION
      const sanitizedEmail = sanitizeEmail(input.email);

      const user = userManager.findByEmail(sanitizedEmail);
      if (!user) {
        throw createUserError('not_found');
      }

      if (user.isVerified) {
        return {
          message: 'Email already confirmed',
          isVerified: true,
        };
      }

      // В реальном приложении здесь была бы проверка кода
      // Для мока подтверждаем всех
      userManager.update(user.id, {
        isVerified: true,
      });

      console.log(`✅ Email confirmed for user: ${sanitizedEmail}`);

      return {
        message: 'Email successfully confirmed',
        isVerified: true,
      };
    }),
});
