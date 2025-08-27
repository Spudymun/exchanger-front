/**
 * UNIFIED EMAIL SCHEMA
 *
 * ЕДИНСТВЕННАЯ схема email для ВСЕГО приложения
 * Решает проблему избыточности и inconsistency
 */

import { VALIDATION_LIMITS } from '@repo/constants';
import { z } from 'zod';

/**
 * UNIVERSAL EMAIL SCHEMA
 * Используется во ВСЕХ формах: auth, exchange, support, etc.
 *
 * Особенности:
 * - НЕ использует кастомные сообщения
 * - Система валидации автоматически мапит на правильные ключи
 * - z.string().min(1) → validation.email.required
 * - z.string().email() → validation.email.invalid
 */
export const unifiedEmailSchema = z
  .string()
  .min(1) // Автоматически мапится на validation.email.required
  .email() // Автоматически мапится на validation.email.invalid
  .max(VALIDATION_LIMITS.EMAIL_MAX_LENGTH);

/**
 * TYPE EXPORT
 */
export type UnifiedEmail = z.infer<typeof unifiedEmailSchema>;
