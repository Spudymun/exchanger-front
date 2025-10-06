import { AUTH_CONSTANTS, VALIDATION_LIMITS } from '@repo/constants';
import { EmailService, type PasswordResetEmailData } from '@repo/email-service';
import { generateSessionId, sanitizeEmail, isAuthenticatedUser } from '@repo/exchange-core';
import {
  UserManagerFactory,
  ProductionUserManager,
  PasswordResetTokenService,
  type UserManagerInterface,
  type User,
} from '@repo/session-management';
import {
  fullySecurityEnhancedRegisterSchema, // FULLY XSS-PROTECTED REGISTER SCHEMA
  fullySecurityEnhancedLoginSchema, // FULLY XSS-PROTECTED LOGIN SCHEMA
  createValidationError,
  createBadRequestError,
  createConflictError,
  createUnauthorizedError,
  createNotFoundError,
  /*
  // ⚠️ LEGACY IMPORT - ЗАКОММЕНТИРОВАН ДЛЯ BACKWARD COMPATIBILITY
  // 
  // ВАЖНО: createUserError использовался в данном файле
  // ПРИЧИНА ЗАКОММЕНТИРОВАНИЯ: Заменен на прямые вызовы современных error creators
  // - createUserError('already_exists') → createConflictError('User with this email already exists')
  // - createUserError('user_exists_without_web_access') → createConflictError('User exists but does not have access...')
  // - createUserError('invalid_credentials') → createUnauthorizedError('Invalid credentials')
  // - createUserError('not_found') → createNotFoundError('User not found')
  //
  // createUserError,
  */
} from '@repo/utils';

import bcrypt from 'bcryptjs';

// Temporary direct imports for new schemas
import {
  securityEnhancedResetPasswordSchema,
  fullySecurityEnhancedConfirmResetPasswordSchema,
  securityEnhancedConfirmEmailSchema,
} from '../../../../../../packages/utils/src/validation/security-enhanced-schemas';

import { createDelay } from '../../utils/delay';
import { createSessionMetadata } from '../../utils/session-metadata';

import { createTRPCRouter, publicProcedure } from '../init';
import { rateLimitMiddleware } from '../middleware/rateLimit';

// ✅ Helper function to handle session cleanup
async function handleSessionCleanup(
  webUserManager: UserManagerInterface,
  sessionId: string
): Promise<void> {
  // В новой архитектуре не ищем пользователя по sessionId
  // Сессии управляются через session store

  // Phase 4: Production session deletion
  if (webUserManager instanceof ProductionUserManager) {
    await webUserManager.deleteSession(sessionId);
  }

  console.log(`🔓 User logged out with session: ${sessionId}`);
}

// ✅ Helper function to create user with session
async function createUserWithSession(
  webUserManager: UserManagerInterface,
  userData: { email: string; hashedPassword: string; isVerified: boolean },
  sessionMetadata: { ip: string; userAgent?: string }
): Promise<{ user: User; sessionId: string }> {
  let finalSessionId = generateSessionId();

  if (webUserManager instanceof ProductionUserManager) {
    // Создаем пользователя в новой архитектуре
    const user = await webUserManager.create(userData);

    // Создаем Redis сессию
    finalSessionId = await webUserManager.createSession(
      user.id,
      sessionMetadata,
      AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS
    );

    return { user, sessionId: finalSessionId };
  } else {
    // Mock mode - создаем пользователя без sessionId
    const user = await webUserManager.create(userData);

    return { user, sessionId: finalSessionId };
  }
}

// ✅ Helper function to verify password reset token and get user
async function verifyResetTokenAndGetUser(
  resetCode: string,
  expectedEmail: string
): Promise<{ user: User; webUserManager: UserManagerInterface }> {
  // Проверить токен через PasswordResetTokenService
  const userId = await PasswordResetTokenService.verifyToken(resetCode);

  if (!userId) {
    throw createBadRequestError('Invalid or expired recovery code');
  }

  const webUserManager = await UserManagerFactory.createForWeb();
  const user = await webUserManager.findById(userId);

  if (!user) {
    throw createBadRequestError('User not found');
  }

  // Дополнительная проверка: email из токена совпадает с email из запроса
  if (user.email !== expectedEmail) {
    console.error(
      `❌ Email mismatch: token userId=${userId}, request email=${expectedEmail}`
    );
    throw createBadRequestError('Invalid recovery code');
  }

  return { user, webUserManager };
}

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

      // ✅ Get user manager instance via Factory
      const webUserManager = await UserManagerFactory.createForWeb(); // ✅ БЫЛО: .create()

      // Проверяем, не существует ли уже пользователь
      const existingUser = await webUserManager.findByEmail(sanitizedEmail);
      if (existingUser) {
        // ✅ НОВАЯ ЛОГИКА: Проверяем есть ли у пользователя роль в web приложении
        const { getUserRoleForApp } = await import('@repo/exchange-core');
        const webRole = getUserRoleForApp(existingUser, 'web');

        // Throw appropriate error based on web role existence
        throw webRole
          ? createConflictError('User with this email already exists') // User has web access - real duplicate
          : createConflictError('User exists but does not have access to web application. Please contact support or use admin panel.'); // User exists but no web access
          /*
          // ⚠️ LEGACY CODE - ЗАКОММЕНТИРОВАН ДЛЯ BACKWARD COMPATIBILITY
          //
          // ОРИГИНАЛЬНЫЙ КОД:
          // ? createUserError('already_exists') // User has web access - real duplicate
          // : createUserError('user_exists_without_web_access'); // User exists but no web access
          //
          // ПРИЧИНА ЗАМЕНЫ:
          // - createUserError - промежуточная абстракция, заменена на прямые вызовы
          // - Улучшена читаемость: явно видно, какой тип ошибки возвращается
          // - Устранена зависимость от legacy error creator
          */
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(
        input.password,
        VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS
      );

      // ✅ Создаем пользователя с корректной сессией
      const sessionMetadata = createSessionMetadata(ctx.ip, ctx.req.headers);

      const { user, sessionId: finalSessionId } = await createUserWithSession(
        webUserManager,
        {
          email: sanitizedEmail,
          hashedPassword,
          isVerified: false,
        },
        sessionMetadata
      );

      // Устанавливаем cookie с session ID используя централизованную утилиту
      const { SessionCookieUtils } = await import('../../utils/session-cookie');
      SessionCookieUtils.setSessionCookie(ctx.res, finalSessionId);

      console.log(`👤 New user registered: ${sanitizedEmail}`);

      // Имитация отправки email подтверждения
      console.log(`📧 Confirmation email sent to ${sanitizedEmail}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
        },
        sessionId: finalSessionId,
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

      // ✅ Get web user manager instance
      const webUserManager = await UserManagerFactory.createForWeb(); // ✅ БЫЛО: .create()

      // Поиск пользователя
      const user = await webUserManager.findByEmail(sanitizedEmail);
      if (!user || !user.hashedPassword) {
        throw createUnauthorizedError('Invalid credentials');
        /*
        // ⚠️ LEGACY CODE - ЗАКОММЕНТИРОВАН ДЛЯ BACKWARD COMPATIBILITY
        //
        // ОРИГИНАЛЬНЫЙ КОД:
        // throw createUserError('invalid_credentials');
        //
        // ПРИЧИНА ЗАМЕНЫ:
        // - createUserError('invalid_credentials') → createUnauthorizedError('Invalid credentials')
        // - Более явное указание типа ошибки авторизации
        // - Соответствует HTTP семантике (401 Unauthorized)
        */
      }

      // Проверка пароля
      const isValidPassword = await bcrypt.compare(input.password, user.hashedPassword);
      if (!isValidPassword) {
        throw createUnauthorizedError('Invalid credentials');
        /*
        // ⚠️ LEGACY CODE - ЗАКОММЕНТИРОВАН ДЛЯ BACKWARD COMPATIBILITY
        //
        // ОРИГИНАЛЬНЫЙ КОД:
        // throw createUserError('invalid_credentials');
        //
        // ПРИЧИНА ЗАМЕНЫ: аналогично - unified error handling
        */
      }

      // ✅ Production session creation with metadata
      let finalSessionId = generateSessionId();
      const sessionMetadata = createSessionMetadata(ctx.ip, ctx.req.headers);

      // Phase 4: Production session creation with metadata FIRST
      if (webUserManager instanceof ProductionUserManager) {
        finalSessionId = await webUserManager.createSession(
          user.id,
          sessionMetadata,
          AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS
        );
      }

      // Update user last login (без sessionId в новой архитектуре)
      await webUserManager.update(user.id, {
        lastLoginAt: new Date(),
      });

      // Устанавливаем cookie используя централизованную утилиту
      const { SessionCookieUtils } = await import('../../utils/session-cookie');
      SessionCookieUtils.setSessionCookie(ctx.res, finalSessionId);

      console.log(`🔐 User logged in: ${sanitizedEmail}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
        },
        sessionId: finalSessionId,
      };
    }),

  // Выход из системы
  logout: publicProcedure.mutation(async ({ ctx }) => {
    // ✅ Production session cleanup preparation
    const sessionId =
      ctx.req.cookies.sessionId || ctx.req.headers.authorization?.replace('Bearer ', '');

    if (sessionId) {
      // ✅ Get web user manager instance
      const webUserManager = await UserManagerFactory.createForWeb(); // ✅ БЫЛО: .create()

      // Find user by session for cleanup
      await handleSessionCleanup(webUserManager, sessionId);
    }

    // Очищаем cookie используя централизованную утилиту
    const { SessionCookieUtils } = await import('../../utils/session-cookie');
    SessionCookieUtils.clearSessionCookie(ctx.res);

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

      try {
        // ✅ PRODUCTION: Создать токен через PasswordResetTokenService
        // - Автоматически проверит существование пользователя
        // - Сгенерирует crypto-safe 6-значный токен
        // - Сохранит в БД с TTL 15 минут
        // - Удалит старые неиспользованные токены этого пользователя
        const token = await PasswordResetTokenService.createToken(sanitizedEmail);

        if (token) {
          // ✅ PRODUCTION: Отправить email через EmailService
          const MINUTES_15 = 15;
          const MINUTES_TO_MS = 60 * 1000;
          const expiresAt = new Date(Date.now() + MINUTES_15 * MINUTES_TO_MS);

          const emailData: PasswordResetEmailData = {
            token,
            expiresAt,
            userEmail: sanitizedEmail,
          };

          const emailResult = await EmailService.sendPasswordReset(emailData);

          // Логирование результата
          console.log(
            emailResult.success
              ? `✅ Password reset email sent to: ${sanitizedEmail}`
              : `❌ Failed to send password reset email to: ${sanitizedEmail}. Error: ${emailResult.error || 'Unknown'}`
          );
        } else {
          // Пользователь не существует - не раскрываем это
          console.log(`� Password reset attempt for non-existent email: ${sanitizedEmail}`);
        }
      } catch (error) {
        console.error('Error in requestPasswordReset:', error);
        // Не пробрасываем ошибку наружу для security
      }

      // ✅ Всегда возвращаем успешный ответ (security best practice)
      return {
        message: 'If the specified email exists, a recovery code will be sent to it',
      };
    }),

  // Восстановление пароля (шаг 2 - сброс с кодом)
  resetPassword: publicProcedure
    .input(fullySecurityEnhancedConfirmResetPasswordSchema) // FULLY XSS-PROTECTED VALIDATION
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки
      await createDelay(AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS);

      const sanitizedEmail = sanitizeEmail(input.email);

      // ✅ ВАЖНО: input уже прошел валидацию через fullySecurityEnhancedConfirmResetPasswordSchema
      // Дополнительная валидация НЕ НУЖНА - это избыточность (Rule 20)
      
      // ✅ PRODUCTION: Верификация токена и получение пользователя
      const { user, webUserManager } = await verifyResetTokenAndGetUser(
        input.resetCode,
        sanitizedEmail
      );

      // Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(
        input.newPassword,
        VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS
      );

      // Обновляем пользователя
      await webUserManager.update(user.id, {
        hashedPassword,
      });

      // ✅ PRODUCTION: Пометить токен как использованный
      const marked = await PasswordResetTokenService.markTokenAsUsed(input.resetCode);
      if (!marked) {
        console.warn(`⚠️ Failed to mark token as used: ${input.resetCode}`);
      }

      // ✅ Production session creation with metadata after password reset
      let finalSessionId = generateSessionId();
      const sessionMetadata = createSessionMetadata(ctx.ip, ctx.req.headers);

      // Phase 4: Production session creation with metadata
      if (webUserManager instanceof ProductionUserManager) {
        finalSessionId = await webUserManager.createSession(
          user.id,
          sessionMetadata,
          AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS
        );
      }

      // Устанавливаем cookie
      ctx.res.setHeader(
        AUTH_CONSTANTS.SET_COOKIE_HEADER,
        `sessionId=${finalSessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
      );

      console.log(`✅ Password reset completed for user: ${sanitizedEmail}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
        },
        sessionId: finalSessionId,
      };
    }),

  // Подтверждение email (упрощенная версия)
  verifyEmail: publicProcedure
    .input(securityEnhancedConfirmEmailSchema)
    .mutation(async ({ input }) => {
      // SECURITY-ENHANCED VALIDATION
      const sanitizedEmail = sanitizeEmail(input.email);

      // ✅ Get web user manager instance
      const webUserManager = await UserManagerFactory.createForWeb(); // ✅ БЫЛО: .create()

      const user = await webUserManager.findByEmail(sanitizedEmail);
      if (!user) {
        throw createNotFoundError('User not found');
        /*
        // ⚠️ LEGACY CODE - ЗАКОММЕНТИРОВАН ДЛЯ BACKWARD COMPATIBILITY
        //
        // ОРИГИНАЛЬНЫЙ КОД:
        // throw createUserError('not_found');
        //
        // ПРИЧИНА ЗАМЕНЫ:
        // - createUserError('not_found') → createNotFoundError('User not found')
        // - Более ясная семантика HTTP 404 ошибки
        // - Консистентность с другими error creators
        */
      }

      if (user.isVerified) {
        return {
          message: 'Email already confirmed',
          isVerified: true,
        };
      }

      // В реальном приложении здесь была бы проверка кода
      // Для мока подтверждаем всех
      await webUserManager.update(user.id, {
        isVerified: true,
      });

      console.log(`✅ Email confirmed for user: ${sanitizedEmail}`);

      return {
        message: 'Email successfully confirmed',
        isVerified: true,
      };
    }),
});
