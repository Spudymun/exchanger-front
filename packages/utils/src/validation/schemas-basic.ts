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
 * ИСПРАВЛЕНИЕ: Используем refine для контроля приоритетов валидации
 */
export const emailSchema = z
  .string()
  .min(1) // Пустая строка → too_small → "Email обязателен"
  .refine(val => {
    // Если строка не пустая, проверяем email формат
    if (val.length > 0) {
      return z.string().email().safeParse(val).success && VALIDATION_PATTERNS.EMAIL.test(val);
    }
    return true; // Пустая строка уже обработана в min(1)
  })
  .refine(val => val.length <= VALIDATION_LIMITS.EMAIL_MAX_LENGTH);

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
  .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH) // Пустая строка → too_small → "Пароль обязателен"
  .refine(val => {
    // Если строка не пустая, проверяем требования к паролю
    if (val.length > 0) {
      return /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val);
    }
    return true; // Пустая строка уже обработана в min()
  });

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

/**
 * Номер банковской карты с базовой валидацией
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Базовая схема без XSS защиты для переиспользования
 * XSS защита добавляется в security-enhanced схемах
 */
export const cardNumberSchema = z
  .string()
  .min(1)
  .refine(
    (val) => {
      // Удаляем пробелы и дефисы для проверки
      const cleaned = val.replace(/[\s-]/g, '');
      return /^\d+$/.test(cleaned) && 
             cleaned.length >= VALIDATION_LIMITS.CARD_NUMBER_MIN_LENGTH && 
             cleaned.length <= VALIDATION_LIMITS.CARD_NUMBER_MAX_LENGTH;
    },
    'Номер карты должен содержать 13-19 цифр'
  );

/**
 * Схема для имени/фамилии
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Базовая схема без XSS защиты для переиспользования
 */
export const nameSchema = z
  .string()
  .min(VALIDATION_LIMITS.FIRST_NAME_MIN_LENGTH, 'Минимум 1 символ')
  .max(VALIDATION_LIMITS.FIRST_NAME_MAX_LENGTH, 'Максимум 50 символов')
  .regex(VALIDATION_PATTERNS.NAME, 'Некорректные символы в имени')
  .trim();