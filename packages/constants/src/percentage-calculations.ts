/**
 * Константы для вычисления процентов и математических операций
 * Согласно ai-agent-rules.yml (правило 19) - все константы должны быть централизованы
 */

export const PERCENTAGE_CALCULATIONS = {
  /** Базовое значение для конвертации процентов (100%) */
  PERCENT_BASE: 100,
  /** Основание десятичной системы */
  DECIMAL_BASE: 10,
  /** Количество знаков после запятой для округления UAH */
  UAH_ROUNDING_PRECISION: 2,
} as const;

export type PercentageCalculations = typeof PERCENTAGE_CALCULATIONS;
