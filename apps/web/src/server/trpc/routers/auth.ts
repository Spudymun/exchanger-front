import { AUTH_CONSTANTS } from '@repo/constants/validation';
import {
  validateEmail,
  validatePassword,
  sanitizeEmail,
  generateSessionId,
  userManager,
  type User,
} from '@repo/exchange-core';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '../init';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const SET_COOKIE_HEADER = 'Set-Cookie';

export const authRouter = createTRPCRouter({
  // Регистрация нового пользователя
  register: rateLimitMiddleware.register
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, AUTH_CONSTANTS.AUTH_REQUEST_DELAY_MS));

      const sanitizedEmail = sanitizeEmail(input.email);

      // Валидация данных
      const emailValidation = validateEmail(sanitizedEmail);
      const passwordValidation = validatePassword(input.password);

      if (!emailValidation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: emailValidation.errors[0],
        });
      }

      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordValidation.errors[0],
        });
      }

      // Проверяем, не существует ли уже пользователь
      const existingUser = userManager.findByEmail(sanitizedEmail);
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Пользователь с таким email уже существует',
        });
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(input.password, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);

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
        SET_COOKIE_HEADER,
        `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
      );

      console.log(`👤 Зарегистрирован новый пользователь: ${sanitizedEmail}`);

      // Имитация отправки email подтверждения
      console.log(`📧 Email подтверждения отправлен на ${sanitizedEmail}`);

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
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS));

      const sanitizedEmail = sanitizeEmail(input.email);

      // Поиск пользователя
      const user = userManager.findByEmail(sanitizedEmail);
      if (!user || !user.hashedPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Неверный email или пароль',
        });
      }

      // Проверка пароля
      const isValidPassword = await bcrypt.compare(input.password, user.hashedPassword);
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Неверный email или пароль',
        });
      }

      // Генерируем новый session ID
      const sessionId = generateSessionId();
      userManager.update(user.id, {
        sessionId,
        lastLoginAt: new Date(),
      });

      // Устанавливаем cookie
      ctx.res.setHeader(
        SET_COOKIE_HEADER,
        `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
      );

      console.log(`🔐 Пользователь вошел в систему: ${sanitizedEmail}`);

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

    console.log(`🔓 Пользователь вышел из системы`);

    return {
      message: 'Выход выполнен успешно',
    };
  }),

  // Получить текущую сессию
  getSession: publicProcedure.query(async ({ ctx }) => {
    // Если нет пользователя в контексте, возвращаем null
    if (!ctx.user) {
      return { user: null };
    }

    // Type assertion для правильной типизации
    const user = ctx.user as User;

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
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS));

      const sanitizedEmail = sanitizeEmail(input.email);

      // Проверяем, существует ли пользователь
      const user = userManager.findByEmail(sanitizedEmail);
      if (!user) {
        // Не раскрываем информацию о существовании пользователя
        console.log(`🔒 Попытка сброса пароля для несуществующего email: ${sanitizedEmail}`);
      } else {
        console.log(`🔑 Запрос на сброс пароля для: ${sanitizedEmail}`);

        // Имитация отправки email с кодом восстановления
        const resetCode = Math.random()
          .toString(AUTH_CONSTANTS.RESET_CODE_BASE)
          .substring(AUTH_CONSTANTS.RESET_CODE_START, AUTH_CONSTANTS.RESET_CODE_END)
          .toUpperCase();
        console.log(`📧 Код восстановления для ${sanitizedEmail}: ${resetCode}`);
      }

      // Всегда возвращаем успешный ответ для безопасности
      return {
        message: 'Если указанный email существует, на него будет отправлен код восстановления',
      };
    }),

  // Восстановление пароля (шаг 2 - сброс с кодом)
  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        resetCode: z.string(),
        newPassword: z.string().min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS));

      const sanitizedEmail = sanitizeEmail(input.email);

      // Валидация нового пароля
      const passwordValidation = validatePassword(input.newPassword);
      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordValidation.errors[0],
        });
      }

      // В реальном приложении здесь была бы проверка кода из базы/Redis
      // Для мока просто проверяем существование пользователя
      const user = userManager.findByEmail(sanitizedEmail);
      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Неверный код восстановления',
        });
      }

      // Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(
        input.newPassword,
        AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS
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
        SET_COOKIE_HEADER,
        `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
      );

      console.log(`🔓 Пароль изменен для пользователя: ${sanitizedEmail}`);

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
    .input(
      z.object({
        email: z.string().email(),
        verificationCode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const sanitizedEmail = sanitizeEmail(input.email);

      const user = userManager.findByEmail(sanitizedEmail);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Пользователь не найден',
        });
      }

      if (user.isVerified) {
        return {
          message: 'Email уже подтвержден',
          isVerified: true,
        };
      }

      // В реальном приложении здесь была бы проверка кода
      // Для мока подтверждаем всех
      userManager.update(user.id, {
        isVerified: true,
      });

      console.log(`✅ Email подтвержден для пользователя: ${sanitizedEmail}`);

      return {
        message: 'Email успешно подтвержден',
        isVerified: true,
      };
    }),
});
