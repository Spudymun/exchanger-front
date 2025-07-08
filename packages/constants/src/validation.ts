import { REQUEST_TIMEOUT_CONSTANTS } from './time-constants';
import { VALIDATION_BOUNDS } from './validation-bounds';

/**
 * Validation rules and limits - ОБЩИЕ для всех приложений
 * ExchangeGO специфичные константы находятся в exchange.ts
 */

export const VALIDATION_LIMITS = {
  // User data
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,

  // Password security
  BCRYPT_SALT_ROUNDS: 10,

  // Names
  FIRST_NAME_MIN_LENGTH: 1,
  FIRST_NAME_MAX_LENGTH: 50,
  LAST_NAME_MIN_LENGTH: 1,
  LAST_NAME_MAX_LENGTH: 50,

  // Financial
  MIN_ORDER_AMOUNT: VALIDATION_BOUNDS.MIN_ORDER_AMOUNT,
  MAX_ORDER_AMOUNT: VALIDATION_BOUNDS.MAX_ORDER_AMOUNT,
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
  REQUEST_TIMEOUT_MS: REQUEST_TIMEOUT_CONSTANTS.DEFAULT_API_TIMEOUT,
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

  // Crypto wallet addresses (consolidated from regex-patterns.ts)
  BTC_ADDRESS: /^(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/,
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  USDT_ADDRESS: /^0x[a-fA-F0-9]{40}$/, // USDT uses Ethereum format
  LTC_ADDRESS: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1[a-z0-9]{39,59}$/,

  // Card validation
  CARD_NUMBER: /^\d{16}$/,

  // URLs - using function instead of regex for security (prevents ReDoS attacks)
  URL: (() => {
    const urlValidator = (url: string): boolean => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    };
    // Create regex-like object with test method for compatibility
    return { test: urlValidator };
  })(),

  // Numbers (safe regex patterns to prevent ReDoS attacks)
  POSITIVE_NUMBER: /^\d+\.?\d*$/,
  INTEGER: /^\d+$/,

  // Amount format validation (centralized from exchange.ts and useForm.ts)
  CRYPTO_AMOUNT_STRING: /^\d+\.?\d{0,8}$/,
  UAH_AMOUNT_STRING: /^\d+\.?\d{0,2}$/,

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

// Authentication constants
export const AUTH_CONSTANTS = {
  // Session durations (предвычисленные значения - no calculations in constants)
  SESSION_MAX_AGE_SECONDS: 604800, // 7 дней (7 * 24 * 60 * 60)
  SESSION_COOKIE_NAME: 'sessionId',

  // Request delays (milliseconds)
  AUTH_REQUEST_DELAY_MS: 300,
  LOGIN_REQUEST_DELAY_MS: 500,

  // Password reset
  RESET_CODE_LENGTH: 6,
  RESET_CODE_BASE: 36,
  RESET_CODE_START: 2,
  RESET_CODE_END: 8,

  // HTTP headers
  SET_COOKIE_HEADER: 'Set-Cookie',
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
