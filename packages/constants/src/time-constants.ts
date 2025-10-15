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
 * Константы для отладки UI (debounce, throttle)
 */
export const UI_DEBOUNCE_CONSTANTS = {
  /** Debounce задержка для пересчета обмена (300ms) */
  EXCHANGE_CALCULATION_DELAY: 300,
  /** Debounce задержка для поиска (150ms) */
  SEARCH_INPUT_DELAY: 150,
  /** Debounce задержка для автосохранения формы (500ms) */
  FORM_AUTOSAVE_DELAY: 500,
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
  /** Интервал обновления статуса сессии пользователя (5 минут) */
  SESSION_STATUS_REFRESH: 300000,
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
 * Общие таймауты для операций (в миллисекундах)
 */
export const OPERATION_TIMEOUT_CONSTANTS = {
  /** Стандартный таймаут для UI операций (5 секунд) */
  DEFAULT_OPERATION_TIMEOUT: 5000,
  /** Таймаут для одного компонента при сканировании (5 секунд) */
  COMPONENT_SCAN_TIMEOUT: 5000,
  /** Таймаут для glob pattern операций (5 секунд) */
  GLOB_PATTERN_TIMEOUT: 5000,
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

/**
 * Константы для времени жизни заявок и операций
 */
export const OPERATION_TIME_CONSTANTS = {
  /** Время жизни заявки на обмен в минутах */
  ORDER_EXPIRATION_MINUTES: 90,
} as const;

/**
 * Константы для временных зон и локализации времени
```

/**
 * Константы для временных зон и локализации времени
 */
export const TIMEZONE_CONSTANTS = {
  /** Основная временная зона для приложения */
  DEFAULT_TIMEZONE: 'Europe/Kiev',
  /** Основная локаль для форматирования времени */
  DEFAULT_LOCALE: 'ru-RU',
  /** Альтернативная локаль */
  ENGLISH_LOCALE: 'en-US',
} as const;

export type TimeConstants = typeof TIME_CONSTANTS;
export type TimezoneConstants = typeof TIMEZONE_CONSTANTS;
