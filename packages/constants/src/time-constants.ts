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

/**
 * Интервалы обновления UI компонентов
 */
export const UI_REFRESH_INTERVALS = {
  /** Интервал обновления статуса заказа (30 секунд) */
  ORDER_STATUS_REFRESH: 30000,
  /** Интервал обновления данных дашборда (60 секунд) */
  DASHBOARD_REFRESH: 60000,
  /** Интервал обновления курсов валют (10 секунд) */
  CURRENCY_RATES_REFRESH: 10000,
} as const;

/**
 * Timeout константы для HTTP запросов (в миллисекундах)
 */
export const REQUEST_TIMEOUT_CONSTANTS = {
  /** Стандартный timeout для API запросов (30 секунд) */
  DEFAULT_API_TIMEOUT: 30000,
  /** Timeout для обменных операций (30 секунд) */
  EXCHANGE_REQUEST_TIMEOUT: 30000,
  /** Timeout для загрузки файлов (60 секунд) */
  FILE_UPLOAD_TIMEOUT: 60000,
} as const;

/**
 * Константы для работы с датами и форматированием
 */
export const DATE_FORMAT_CONSTANTS = {
  /** Разделитель даты и времени в ISO строке */
  ISO_DATE_TIME_SEPARATOR: 'T',
  /** Индекс части даты после split по разделителю */
  DATE_PART_INDEX: 0,
  /** Индекс части времени после split по разделителю */
  TIME_PART_INDEX: 1,
} as const;

/**
 * Константы для пагинации
 */
export const PAGINATION_CONSTANTS = {
  /** Начальный offset для пагинации */
  DEFAULT_OFFSET: 0,
  /** Стандартный лимит элементов на страницу */
  DEFAULT_LIMIT: 20,
  /** Максимальный лимит элементов на страницу */
  MAX_LIMIT: 100,
} as const;

export type TimeConstants = typeof TIME_CONSTANTS;
