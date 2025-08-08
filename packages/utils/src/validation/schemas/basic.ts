import { VALIDATION_LIMITS } from '@repo/constants';
import { z } from 'zod';

/**
 * Базовые схемы валидации
 * Содержит email, пароли, ID и базовые типы
 */

// === БАЗОВЫЕ СХЕМЫ ===

/**
 * Email валидация - строгая Zod валидация БЕЗ хардкода сообщений
 * Сообщения обрабатываются через createNextIntlZodErrorMap
 */
export const emailSchema = z.string().min(1).max(VALIDATION_LIMITS.EMAIL_MAX_LENGTH).email();

/**
 * Новая схема пароля с усиленными требованиями безопасности
 * Соответствует современным стандартам OWASP
 */
export const passwordSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH)
  .max(VALIDATION_LIMITS.PASSWORD_MAX_LENGTH)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/
  );

/**
 * Схема нового пароля (алиас для ясности в формах)
 */
export const newPasswordSchema = passwordSchema;

/**
 * Легаси схема пароля для совместимости с существующими аккаунтами
 * Менее строгие требования для поддержки старых паролей
 */
export const legacyPasswordSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH)
  .max(VALIDATION_LIMITS.PASSWORD_MAX_LENGTH);

/**
 * Схема имени пользователя
 */
export const usernameSchema = z
  .string()
  .min(VALIDATION_LIMITS.USERNAME_MIN_LENGTH)
  .max(VALIDATION_LIMITS.USERNAME_MAX_LENGTH)
  .regex(/^[a-zA-Z0-9_-]+$/);

/**
 * Базовая схема ID
 */
export const idSchema = z.string().min(1);
