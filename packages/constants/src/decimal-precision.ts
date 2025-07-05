/**
 * Константы для точности десятичных дробей валют
 * Согласно ai-agent-rules.yml (правило 19) - все константы должны быть централизованы
 */

export const DECIMAL_PRECISION = {
  /** Количество знаков после запятой для UAH */
  UAH_DECIMAL_PLACES: 2,
  /** Количество знаков после запятой для криптовалют */
  CRYPTO_DECIMAL_PLACES: 8,
  /** Максимальное количество знаков для UI отображения */
  UI_MAX_DECIMAL_PLACES: 8,
  /** Длина случайной части в ID заявки */
  ORDER_ID_RANDOM_LENGTH: 9,
} as const;

export type DecimalPrecision = typeof DECIMAL_PRECISION;
