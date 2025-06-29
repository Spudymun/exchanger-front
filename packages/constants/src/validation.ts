/**
 * Validation rules and limits
 */

export const VALIDATION_LIMITS = {
  // User data
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,

  // Names
  FIRST_NAME_MIN_LENGTH: 1,
  FIRST_NAME_MAX_LENGTH: 50,
  LAST_NAME_MIN_LENGTH: 1,
  LAST_NAME_MAX_LENGTH: 50,

  // Financial
  MIN_ORDER_AMOUNT: 0.01,
  MAX_ORDER_AMOUNT: 1000000,
  MIN_WITHDRAWAL_AMOUNT: 10,
  MAX_WITHDRAWAL_AMOUNT: 100000,

  // Trading
  ORDER_ITEMS_MAX: 50,
  PORTFOLIO_ASSETS_MAX: 100,
  OPEN_ORDERS_MAX: 20,

  // Content
  DESCRIPTION_MAX_LENGTH: 500,
  COMMENT_MAX_LENGTH: 1000,
  TITLE_MAX_LENGTH: 100,

  // File uploads
  AVATAR_MAX_SIZE_MB: 5,
  DOCUMENT_MAX_SIZE_MB: 10,
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  SUPPORTED_DOCUMENT_FORMATS: ['pdf', 'doc', 'docx'],

  // API
  REQUEST_TIMEOUT_MS: 30000,
  MAX_REQUESTS_PER_MINUTE: 100,

  // Pagination
  MIN_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20,
} as const;

export const VALIDATION_PATTERNS = {
  // Email regex (basic)
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Password requirements: at least 8 chars, 1 uppercase, 1 lowercase, 1 number
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,

  // Username: alphanumeric and underscores only
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,

  // Phone number (international format)
  PHONE: /^\+?[1-9]\d{1,14}$/,

  // Crypto wallet addresses (basic patterns)
  BTC_ADDRESS: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,

  // URLs
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,

  // Numbers
  POSITIVE_NUMBER: /^\d+(\.\d+)?$/,
  INTEGER: /^\d+$/,

  // Alphanumeric only
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
} as const;

export const VALIDATION_MESSAGES = {
  // Required fields
  FIELD_REQUIRED: 'Это поле обязательно',
  EMAIL_REQUIRED: 'Email обязателен',
  PASSWORD_REQUIRED: 'Пароль обязателен',

  // Format errors
  EMAIL_INVALID: 'Неверный формат email',
  PASSWORD_WEAK:
    'Пароль должен содержать минимум 8 символов, включая заглавную букву, строчную букву и цифру',
  USERNAME_INVALID: 'Имя пользователя может содержать только буквы, цифры и подчеркивания',
  PHONE_INVALID: 'Неверный формат номера телефона',
  URL_INVALID: 'Неверный формат URL',

  // Length errors
  TOO_SHORT: 'Слишком короткое значение',
  TOO_LONG: 'Слишком длинное значение',
  EMAIL_TOO_LONG: 'Email не может быть длиннее 255 символов',
  PASSWORD_TOO_SHORT: 'Пароль должен быть не менее 8 символов',
  USERNAME_TOO_SHORT: 'Имя пользователя должно быть не менее 3 символов',

  // Number errors
  NUMBER_INVALID: 'Введите корректное число',
  NUMBER_TOO_SMALL: 'Значение слишком маленькое',
  NUMBER_TOO_LARGE: 'Значение слишком большое',
  AMOUNT_INVALID: 'Неверная сумма',

  // File upload errors
  FILE_TOO_LARGE: 'Файл слишком большой',
  FILE_FORMAT_UNSUPPORTED: 'Неподдерживаемый формат файла',

  // Business logic errors
  INSUFFICIENT_BALANCE: 'Недостаточно средств',
  ORDER_AMOUNT_TOO_SMALL: 'Сумма заказа слишком мала',
  ORDER_AMOUNT_TOO_LARGE: 'Сумма заказа слишком велика',

  // Authentication errors
  INVALID_CREDENTIALS: 'Неверные учетные данные',
  ACCOUNT_LOCKED: 'Аккаунт заблокирован',
  TOKEN_EXPIRED: 'Токен истек',

  // Generic errors
  SOMETHING_WENT_WRONG: 'Что-то пошло не так',
  NETWORK_ERROR: 'Ошибка сети',
  SERVER_ERROR: 'Ошибка сервера',
} as const;

// Validation helper functions
export const VALIDATION_HELPERS = {
  isEmail: (value: string) => VALIDATION_PATTERNS.EMAIL.test(value),
  isStrongPassword: (value: string) => VALIDATION_PATTERNS.PASSWORD.test(value),
  isValidUsername: (value: string) => VALIDATION_PATTERNS.USERNAME.test(value),
  isPositiveNumber: (value: string) => VALIDATION_PATTERNS.POSITIVE_NUMBER.test(value),
  isWithinLength: (value: string, min: number, max: number) =>
    value.length >= min && value.length <= max,
} as const;

// Type exports
export type ValidationPattern = (typeof VALIDATION_PATTERNS)[keyof typeof VALIDATION_PATTERNS];
export type ValidationMessage = (typeof VALIDATION_MESSAGES)[keyof typeof VALIDATION_MESSAGES];

/**
 * ExchangeGO specific validation constants
 */

// ExchangeGO валидационные ограничения
export const EXCHANGE_VALIDATION_LIMITS = {
  ORDER_ID_LENGTH: 36,
  CRYPTO_ADDRESS_MAX_LENGTH: 100,
  CARD_NUMBER_LENGTH: 16,
} as const;

// ExchangeGO regex паттерны
export const EXCHANGE_VALIDATION_PATTERNS = {
  CARD_NUMBER: /^\d{16}$/,
  CRYPTO_AMOUNT: /^\d+(\.\d{1,8})?$/,
  UAH_AMOUNT: /^\d+(\.\d{1,2})?$/,
} as const;

// ExchangeGO сообщения валидации
export const EXCHANGE_VALIDATION_MESSAGES = {
  AMOUNT_TOO_LOW: 'Минимальная сумма: $10',
  AMOUNT_TOO_HIGH: 'Максимальная сумма: $5000',
  CURRENCY_INVALID: 'Неподдерживаемая криптовалюта',
  CARD_NUMBER_INVALID: 'Некорректный номер карты',
} as const;
