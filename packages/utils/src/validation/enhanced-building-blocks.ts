/**
 * Enhanced Building Blocks - XSS-защищенные схемы валидации
 * ЭТАП 2: Централизация XSS защиты для устранения дублирования
 */

import { z } from 'zod';

import { emailSchema, passwordSchema, usernameSchema, nameSchema, idSchema } from './schemas-basic';

import { containsPotentialXSS } from './security-utils';

/**
 * Утилита для создания XSS-защищенной схемы с правильными типами
 */
function createXSSProtectedSchema<T extends z.ZodType>(
  schema: T
): z.ZodEffects<T, z.infer<T>, z.infer<T>> {
  return schema.refine(val => !containsPotentialXSS(String(val)), 'INVALID_CHARACTERS_DETECTED');
}

/**
 * XSS-защищенные базовые схемы
 * ЦЕЛЬ: Заменить 28 дублирующихся вызовов createXSSProtectedString
 */

export const xssProtectedEmailSchema = emailSchema.refine(
  val => !containsPotentialXSS(val),
  'INVALID_CHARACTERS_DETECTED'
);

export const xssProtectedPasswordSchema = passwordSchema.refine(
  val => !containsPotentialXSS(val),
  'INVALID_CHARACTERS_DETECTED'
);

export const xssProtectedUsernameSchema = usernameSchema.refine(
  val => !containsPotentialXSS(val),
  'INVALID_CHARACTERS_DETECTED'
);

export const xssProtectedNameSchema = nameSchema.refine(
  val => !containsPotentialXSS(val),
  'INVALID_CHARACTERS_DETECTED'
);

export const xssProtectedIdSchema = idSchema.refine(
  val => !containsPotentialXSS(val),
  'INVALID_CHARACTERS_DETECTED'
);

/**
 * XSS-защищенные строковые схемы для общего использования
 */
export const xssProtectedStringSchema = createXSSProtectedSchema(z.string());
export const xssProtectedOptionalStringSchema = createXSSProtectedSchema(z.string().optional());

/**
 * Фабрика для создания XSS-защищенных строк с ограничениями длины
 */
export function createXSSProtectedStringWithLength(minLength = 0, maxLength?: number) {
  let schema = z.string();
  if (minLength > 0) schema = schema.min(minLength);
  if (maxLength) schema = schema.max(maxLength);
  return createXSSProtectedSchema(schema);
}

/**
 * XSS-защищенные числовые схемы
 */
export const xssProtectedAmountSchema = createXSSProtectedSchema(
  z
    .string()
    .min(1)
    .refine(val => {
      // Безопасная проверка формата суммы без небезопасного regex
      const parts = val.split('.');
      if (parts.length > 2) return false; // Больше одной точки
      if (parts[0] && !/^\d+$/u.test(parts[0])) return false; // Целая часть не число
      if (parts[1] && !/^\d{1,2}$/u.test(parts[1])) return false; // Дробная часть не 1-2 цифры
      return true;
    }, 'Некорректный формат суммы')
);

export const xssProtectedNumberStringSchema = createXSSProtectedSchema(
  z.string().refine(val => /^\d+$/u.test(val), 'Только цифры')
);

/**
 * Типы для TypeScript
 */
export type XSSProtectedEmail = z.infer<typeof xssProtectedEmailSchema>;
export type XSSProtectedPassword = z.infer<typeof xssProtectedPasswordSchema>;
export type XSSProtectedUsername = z.infer<typeof xssProtectedUsernameSchema>;
export type XSSProtectedName = z.infer<typeof xssProtectedNameSchema>;
export type XSSProtectedAmount = z.infer<typeof xssProtectedAmountSchema>;
