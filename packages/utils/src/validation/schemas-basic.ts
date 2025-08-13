/**
 * Базовые схемы валидации - основные примитивы
 * Извлечено из validation-schemas.ts для улучшения поддерживаемости
 */

import { VALIDATION_LIMITS, VALIDATION_PATTERNS } from '@repo/constants';
import { z } from 'zod';

// === КОНСТАНТЫ ===
// АРХИТЕКТУРНОЕ РЕШЕНИЕ: Используем централизованные константы из @repo/constants
// Локальные константы удалены для устранения дублирования и единого источника истины

// Для обратной совместимости экспортируем константы из централизованного источника
export const PASSWORD_MIN_LENGTH = VALIDATION_LIMITS.PASSWORD_MIN_LENGTH;
export const PASSWORD_MAX_LENGTH = VALIDATION_LIMITS.PASSWORD_MAX_LENGTH;
export const USERNAME_MIN_LENGTH = VALIDATION_LIMITS.USERNAME_MIN_LENGTH;
export const USERNAME_MAX_LENGTH = VALIDATION_LIMITS.USERNAME_MAX_LENGTH;
export const SEARCH_QUERY_MAX_LENGTH = VALIDATION_LIMITS.SEARCH_QUERY_MAX_LENGTH;

/**
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Regex паттерны перенесены в @repo/constants
 * Для обратной совместимости экспортируем PATTERNS как алиас
 */
export const PATTERNS = VALIDATION_PATTERNS;

// === БАЗОВЫЕ ТИПЫ ===
export const idSchema = z.string().min(1);

// === УСИЛЕННЫЕ БАЗОВЫЕ СХЕМЫ ===

/**
 * Усиленная схема email с правильным regex
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Без хардкод сообщений - используется createNextIntlZodErrorMap
 * Сообщения переводов обрабатываются через handlers.ts с ключами типа 'validation.email.required'
 */
export const emailSchema = z
  .string()
  .min(1)
  .email()
  .max(VALIDATION_LIMITS.EMAIL_MAX_LENGTH)
  .regex(VALIDATION_PATTERNS.EMAIL);

/**
 * Новая система паролей - усиленные требования безопасности
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Без хардкод сообщений - используется createNextIntlZodErrorMap
 * Сообщения переводов обрабатываются через handlers.ts с ключами типа 'validation.password.weak'
 *
 * ТРЕБОВАНИЯ К ПАРОЛЮ:
 * - Минимум 8 символов
 * - Хотя бы одна заглавная буква (A-Z)
 * - Хотя бы одна строчная буква (a-z)
 * - Хотя бы одна цифра (0-9)
 * - Хотя бы один специальный символ (!@#$%^&* и т.д.)
 */
export const passwordSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH)
  .regex(/[A-Z]/) // Заглавная буква
  .regex(/[a-z]/) // Строчная буква
  .regex(/[0-9]/) // Цифра
  .regex(/[^A-Za-z0-9]/); // Специальный символ

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
  .max(VALIDATION_LIMITS.PASSWORD_MAX_LENGTH);

/**
 * Имя пользователя
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Без хардкод сообщений - используется createNextIntlZodErrorMap
 *
 * ТРЕБОВАНИЯ К USERNAME:
 * - От 3 до 30 символов
 * - Только латинские буквы, цифры и подчеркивания
 * - Паттерн: /^[a-zA-Z0-9_]+$/ (без дефисов для единообразия)
 */
export const usernameSchema = z
  .string()
  .min(VALIDATION_LIMITS.USERNAME_MIN_LENGTH)
  .max(VALIDATION_LIMITS.USERNAME_MAX_LENGTH)
  .regex(/^[a-zA-Z0-9_]+$/); // Только буквы, цифры, подчеркивания

/**
 * Поисковый запрос
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Без хардкод сообщений - используется createNextIntlZodErrorMap
 *
 * ТРЕБОВАНИЯ К ПОИСКОВОМУ ЗАПРОСУ:
 * - Минимум 1 символ после trim()
 * - Максимум 100 символов
 * - Автоматическая обрезка пробелов
 */
export const searchQuerySchema = z
  .string()
  .min(1)
  .max(VALIDATION_LIMITS.SEARCH_QUERY_MAX_LENGTH)
  .trim();

/**
 * Международный номер телефона
 */
export const phoneInternationalSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
