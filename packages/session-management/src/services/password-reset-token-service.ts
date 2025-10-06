import { createEnvironmentLogger } from '@repo/utils';

import { getPrismaClient } from '../utils/prisma-singleton';
import type { PrismaClientConfig } from '../utils/prisma-singleton';

/**
 * ✅ Service для управления токенами восстановления пароля
 *
 * Паттерн: Service Layer (аналогично EmailService из @repo/email-service)
 * - Static methods для stateless операций
 * - createEnvironmentLogger для логирования
 * - Использует getPrismaClient для database access
 * - Retry logic для unique constraint collisions
 *
 * Security features:
 * - Не раскрывает информацию о существовании пользователя
 * - Автоматическое удаление старых токенов при создании нового
 * - TTL 15 минут для токенов
 * - Проверка на использованные токены
 * - 6-значный код (36^6 = 2.2 billion combinations)
 *
 * @example
 * ```typescript
 * // Создать токен
 * const token = await PasswordResetTokenService.createToken('user@example.com');
 * if (token) {
 *   console.log(`Token created: ${token}`);
 * }
 *
 * // Верифицировать токен
 * const userId = await PasswordResetTokenService.verifyToken('ABC123');
 * if (userId) {
 *   console.log(`Valid token for user: ${userId}`);
 * }
 *
 * // Пометить токен как использованный
 * await PasswordResetTokenService.markTokenAsUsed('ABC123');
 *
 * // Удалить токен
 * await PasswordResetTokenService.deleteToken('ABC123');
 *
 * // Очистить expired tokens (cron job)
 * const deleted = await PasswordResetTokenService.cleanupExpiredTokens();
 * console.log(`Deleted ${deleted} expired tokens`);
 * ```
 */
// Константы для токенов восстановления пароля
const TOKEN_LENGTH = 6;
const TOKEN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MINUTES_15 = 15;
const MINUTES_TO_MS = 60 * 1000;
const TOKEN_TTL_MS = MINUTES_15 * MINUTES_TO_MS;
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_APP_NAME = 'password-reset-service';
const UNKNOWN_ERROR = 'Unknown error';

export class PasswordResetTokenService {
  private static logger = createEnvironmentLogger('PasswordResetTokenService');

  /**
   * ✅ Генерация уникального 6-значного кода
   *
   * Формат: ABC123 (uppercase letters + digits)
   * Collision probability: ~1 in 2.2 billion (36^6)
   *
   * @returns 6-значный alphanumeric код
   */
  private static generateToken(): string {
    let token = '';
    const randomValues = new Uint32Array(TOKEN_LENGTH);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < TOKEN_LENGTH; i++) {
      const randomValue = randomValues[i];
      if (randomValue === undefined) {
        throw new Error('Failed to generate random value');
      }
      const randomIndex = randomValue % TOKEN_CHARS.length;
      // eslint-disable-next-line security/detect-object-injection
      token += TOKEN_CHARS[randomIndex];
    }

    return token.toUpperCase();
  }

  /**
   * ✅ Найти пользователя по email
   */
  private static async findUserByEmail(
    prisma: ReturnType<typeof getPrismaClient>,
    email: string
  ): Promise<{ id: string } | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      this.logger.info('Password reset requested for non-existent email', {
        email,
      });
    }

    return user;
  }

  /**
   * ✅ Удалить старые неиспользованные токены пользователя
   */
  private static async deleteOldUserTokens(
    prisma: ReturnType<typeof getPrismaClient>,
    userId: string
  ): Promise<void> {
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId,
        used: false,
      },
    });
  }

  /**
   * ✅ Создать токен с retry logic при коллизиях
   */
  private static async createUniqueToken(
    prisma: ReturnType<typeof getPrismaClient>,
    userId: string
  ): Promise<string> {
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      const token = this.generateToken();
      const isLastAttempt = attempt === MAX_RETRY_ATTEMPTS;

      try {
        await prisma.passwordResetToken.create({
          data: {
            userId,
            token,
            expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
          },
        });

        this.logger.info('Password reset token created', {
          userId,
          token,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
        });

        return token;
      } catch {
        if (isLastAttempt) {
          throw new Error('Failed to generate unique token after max retries');
        }
        this.logger.debug('Token collision detected, retrying', {
          attempt,
          token,
        });
      }
    }

    throw new Error('Failed to create unique token');
  }

  /**
   * ✅ Создать токен восстановления для пользователя
   *
   * @param email - Email пользователя
   * @param prismaConfig - Конфигурация PrismaClient (optional для тестов)
   * @returns Сгенерированный токен или null если пользователь не найден
   *
   * Security:
   * - Не раскрывает информацию о существовании пользователя (возвращает null)
   * - Удаляет старые неиспользованные токены перед созданием нового
   * - TTL: 15 минут
   * - Retry logic для unique constraint violations
   *
   * @example
   * ```typescript
   * const token = await PasswordResetTokenService.createToken('user@example.com');
   * if (token) {
   *   console.log(`Send this code to user: ${token}`);
   * } else {
   *   console.log('User not found (but don't tell the user)');
   * }
   * ```
   */
  static async createToken(
    email: string,
    prismaConfig?: PrismaClientConfig
  ): Promise<string | null> {
    try {
      const prisma = getPrismaClient(prismaConfig || {
        url: process.env.DATABASE_URL || '',
        appName: DEFAULT_APP_NAME,
      });

      const user = await this.findUserByEmail(prisma, email);
      if (!user) {
        return null;
      }

      await this.deleteOldUserTokens(prisma, user.id);

      return await this.createUniqueToken(prisma, user.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR;
      this.logger.error('Error creating password reset token', {
        email,
        error: errorMessage,
      });
      throw new Error(`Failed to create password reset token: ${errorMessage}`);
    }
  }

  /**
   * ✅ Верификация токена восстановления
   *
   * @param token - 6-значный код из email
   * @param prismaConfig - Конфигурация PrismaClient (optional для тестов)
   * @returns userId если токен валиден, null если невалиден
   *
   * Проверки:
   * - Токен существует
   * - Не истек срок действия (expiresAt > now)
   * - Не был использован (used = false)
   *
   * @example
   * ```typescript
   * const userId = await PasswordResetTokenService.verifyToken('ABC123');
   * if (userId) {
   *   // Token is valid, proceed with password reset
   *   console.log(`Valid token for user ${userId}`);
   * } else {
   *   // Token is invalid, expired, or already used
   *   console.log('Invalid token');
   * }
   * ```
   */
  static async verifyToken(
    token: string,
    prismaConfig?: PrismaClientConfig
  ): Promise<string | null> {
    try {
      const prisma = getPrismaClient(prismaConfig || {
        url: process.env.DATABASE_URL || '',
        appName: DEFAULT_APP_NAME,
      });

      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          used: true,
        },
      });

      if (!resetToken) {
        this.logger.debug('Token not found', { token });
        return null;
      }

      if (resetToken.used) {
        this.logger.debug('Token already used', { token });
        return null;
      }

      if (resetToken.expiresAt <= new Date()) {
        this.logger.debug('Token expired', {
          token,
          expiresAt: resetToken.expiresAt.toISOString(),
        });
        return null;
      }

      this.logger.info('Token verified successfully', {
        token,
        userId: resetToken.userId,
      });

      return resetToken.userId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR;
      this.logger.error('Error verifying password reset token', {
        token,
        error: errorMessage,
      });
      return null;
    }
  }

  /**
   * ✅ Пометить токен как использованный
   *
   * @param token - 6-значный код
   * @param prismaConfig - Конфигурация PrismaClient (optional для тестов)
   * @returns true если успешно, false если токен не найден
   *
   * Используется после успешной смены пароля для предотвращения
   * повторного использования того же токена.
   *
   * @example
   * ```typescript
   * // After password reset success
   * await PasswordResetTokenService.markTokenAsUsed('ABC123');
   * ```
   */
  static async markTokenAsUsed(
    token: string,
    prismaConfig?: PrismaClientConfig
  ): Promise<boolean> {
    try {
      const prisma = getPrismaClient(prismaConfig || {
        url: process.env.DATABASE_URL || '',
        appName: DEFAULT_APP_NAME,
      });

      const result = await prisma.passwordResetToken.updateMany({
        where: {
          token,
          used: false,
        },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });

      if (result.count > 0) {
        this.logger.info('Token marked as used', { token });
        return true;
      }

      this.logger.debug('Token not found or already used', { token });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR;
      this.logger.error('Error marking token as used', {
        token,
        error: errorMessage,
      });
      return false;
    }
  }

  /**
   * ✅ Удалить токен
   *
   * @param token - 6-значный код
   * @param prismaConfig - Конфигурация PrismaClient (optional для тестов)
   * @returns true если успешно удален, false если не найден
   *
   * Используется для немедленного удаления токена после использования
   * или при отмене запроса на восстановление.
   *
   * @example
   * ```typescript
   * // Delete token after successful password reset
   * await PasswordResetTokenService.deleteToken('ABC123');
   * ```
   */
  static async deleteToken(
    token: string,
    prismaConfig?: PrismaClientConfig
  ): Promise<boolean> {
    try {
      const prisma = getPrismaClient(prismaConfig || {
        url: process.env.DATABASE_URL || '',
        appName: DEFAULT_APP_NAME,
      });

      const result = await prisma.passwordResetToken.deleteMany({
        where: { token },
      });

      if (result.count > 0) {
        this.logger.info('Token deleted', { token });
        return true;
      }

      this.logger.debug('Token not found for deletion', { token });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR;
      this.logger.error('Error deleting token', {
        token,
        error: errorMessage,
      });
      return false;
    }
  }

  /**
   * ✅ Очистить все expired tokens
   *
   * @param prismaConfig - Конфигурация PrismaClient (optional для тестов)
   * @returns Количество удаленных токенов
   *
   * Используется в cron job для периодической очистки expired токенов
   * из базы данных для экономии места и производительности.
   *
   * Рекомендуется запускать раз в час или чаще.
   *
   * @example
   * ```typescript
   * // In cron job
   * const deletedCount = await PasswordResetTokenService.cleanupExpiredTokens();
   * console.log(`Cleaned up ${deletedCount} expired tokens`);
   * ```
   */
  static async cleanupExpiredTokens(
    prismaConfig?: PrismaClientConfig
  ): Promise<number> {
    try {
      const prisma = getPrismaClient(prismaConfig || {
        url: process.env.DATABASE_URL || '',
        appName: DEFAULT_APP_NAME,
      });

      const result = await prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });

      this.logger.info('Expired tokens cleaned up', {
        deletedCount: result.count,
      });

      return result.count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR;
      this.logger.error('Error cleaning up expired tokens', {
        error: errorMessage,
      });
      return 0;
    }
  }

  /**
   * ✅ Получить статистику токенов (для мониторинга)
   *
   * @param prismaConfig - Конфигурация PrismaClient (optional для тестов)
   * @returns Статистика по токенам
   *
   * Полезно для мониторинга и алертов:
   * - Сколько активных токенов
   * - Сколько expired токенов (нужна очистка)
   * - Сколько использованных токенов
   *
   * @example
   * ```typescript
   * const stats = await PasswordResetTokenService.getTokenStats();
   * console.log(`Active: ${stats.active}, Expired: ${stats.expired}`);
   * if (stats.expired > 1000) {
   *   console.warn('Too many expired tokens, run cleanup');
   * }
   * ```
   */
  static async getTokenStats(
    prismaConfig?: PrismaClientConfig
  ): Promise<{
    total: number;
    active: number;
    expired: number;
    used: number;
  }> {
    try {
      const prisma = getPrismaClient(prismaConfig || {
        url: process.env.DATABASE_URL || '',
        appName: DEFAULT_APP_NAME,
      });

      const now = new Date();

      const [total, active, expired, used] = await Promise.all([
        prisma.passwordResetToken.count(),
        prisma.passwordResetToken.count({
          where: {
            used: false,
            expiresAt: { gt: now },
          },
        }),
        prisma.passwordResetToken.count({
          where: {
            expiresAt: { lte: now },
          },
        }),
        prisma.passwordResetToken.count({
          where: {
            used: true,
          },
        }),
      ]);

      const stats = { total, active, expired, used };

      this.logger.debug('Token statistics retrieved', stats);

      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR;
      this.logger.error('Error retrieving token statistics', {
        error: errorMessage,
      });
      return {
        total: 0,
        active: 0,
        expired: 0,
        used: 0,
      };
    }
  }
}
