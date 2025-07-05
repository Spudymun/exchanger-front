/**
 * Константы для валидации и граничных значений
 * Согласно ai-agent-rules.yml (правило 19) - все константы должны быть централизованы
 */

export const VALIDATION_BOUNDS = {
  /** Минимальное значение для валидации */
  MIN_VALUE: 0,
  /** Единичное значение для валидации массивов */
  SINGLE_ELEMENT: 1,
  /** Значение "не найдено" для поиска в массивах */
  NOT_FOUND: -1,
  /** Максимальное количество частей при разделении строки */
  MAX_SPLIT_PARTS: 2,
} as const;

export type ValidationBounds = typeof VALIDATION_BOUNDS;
