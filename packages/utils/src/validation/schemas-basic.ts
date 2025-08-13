/**
 * Базовые схемы валидации - основные примитивы
 * Извлечено из validation-schemas.ts для улучшения поддерживаемости
 */

import { VALIDATION_LIMITS } from '@repo/constants';
import { z } from 'zod';

// === КОНСТАНТЫ ===
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const SEARCH_QUERY_MAX_LENGTH = 100;

export const PATTERNS = {
  // Упрощенный безопасный pattern для email валидации
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/u,
  // Bitcoin адреса
  BTC_ADDRESS: /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/u,
  // Ethereum адреса
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/u,
  // Litecoin адреса
  LTC_ADDRESS: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/u,
} as const;

// === БАЗОВЫЕ ТИПЫ ===
export const idSchema = z.string().min(1);

// === УСИЛЕННЫЕ БАЗОВЫЕ СХЕМЫ ===

/**
 * Усиленная схема email с правильным regex
 */
export const emailSchema = z
  .string()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Invalid email format' })
  .max(VALIDATION_LIMITS.EMAIL_MAX_LENGTH)
  .regex(PATTERNS.EMAIL, { message: 'Invalid email format' });

/**
 * Новая система паролей - усиленные требования безопасности
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' });

/**
 * Новые пароли используют усиленную схему
 */
export const newPasswordSchema = passwordSchema;

/**
 * Легаси пароли - более мягкие требования для существующих пользователей
 */
export const legacyPasswordSchema = z
  .string()
  .min(VALIDATION_LIMITS.LEGACY_PASSWORD_MIN_LENGTH) // Минимум для совместимости
  .max(PASSWORD_MAX_LENGTH);

/**
 * Имя пользователя
 */
export const usernameSchema = z
  .string()
  .min(USERNAME_MIN_LENGTH)
  .max(USERNAME_MAX_LENGTH)
  .regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  });

/**
 * Поисковый запрос
 */
export const searchQuerySchema = z
  .string()
  .min(1, { message: 'Search query cannot be empty' })
  .max(SEARCH_QUERY_MAX_LENGTH, { message: 'Search query is too long' })
  .trim();

/**
 * Международный номер телефона
 */
export const phoneInternationalSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
