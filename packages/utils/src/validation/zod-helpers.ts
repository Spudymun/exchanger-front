import { z } from 'zod';

import { createValidationResult, type ValidationResult } from '../validation-helpers';

/**
 * Универсальный helper для валидации с Zod схемами
 * Устраняет дублирование паттерна safeParse + ValidationResult
 *
 * @see CODE_REVIEW_PROTOCOLS.md - "Отсутствие дублирования кода"
 * @see ai-agent-rules.yml Rule 20 - "Запрет на избыточность"
 */
export function validateWithZodSchema<T>(schema: z.ZodSchema<T>, value: unknown): ValidationResult {
  const result = schema.safeParse(value);

  if (result.success) {
    return createValidationResult([]);
  }

  return createValidationResult(result.error.issues.map(issue => issue.message));
}
