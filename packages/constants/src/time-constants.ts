/**
 * Константы для времени и временных интервалов
 * Согласно ai-agent-rules.yml (правило 19) - все константы должны быть централизованы
 */

export const TIME_CONSTANTS = {
  /** Количество часов в дне */
  HOURS_IN_DAY: 24,
  /** Количество минут в часе */
  MINUTES_IN_HOUR: 60,
  /** Количество секунд в минуте */
  SECONDS_IN_MINUTE: 60,
  /** Количество дней в неделе */
  DAYS_IN_WEEK: 7,
  /** Количество миллисекунд в секунде */
  MILLISECONDS_IN_SECOND: 1000,
} as const;

export type TimeConstants = typeof TIME_CONSTANTS;
