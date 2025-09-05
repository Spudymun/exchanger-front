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
  /** Максимальная сумма в UAH */
  MAX_UAH_AMOUNT: 100000000,

  // Order amount limits (УДАЛЕНЫ - используйте getCurrencyLimits() для per-currency лимитов)
  // ❌ MIN_ORDER_AMOUNT и MAX_ORDER_AMOUNT перенесены в exchange-core
  // ✅ Используйте AMOUNT_LIMITS в exchange.ts + getCurrencyLimits()
} as const;

// Derived constants для обратной совместимости
// ❌ DEPRECATED: Используйте getCurrencyLimits() для per-currency validation
// export const MAX_CRYPTO_AMOUNT = VALIDATION_BOUNDS.MAX_ORDER_AMOUNT;

export type ValidationBounds = typeof VALIDATION_BOUNDS;
