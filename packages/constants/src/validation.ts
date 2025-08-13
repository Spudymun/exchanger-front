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
  LEGACY_PASSWORD_MIN_LENGTH: 6, // Для совместимости с существующими паролями
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
  SEARCH_QUERY_MAX_LENGTH: 100,

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

// ===== ДУБЛИРУЮЩИЕ СИСТЕМЫ ВАЛИДАЦИИ УДАЛЕНЫ =====
//
// VALIDATION_PATTERNS - УДАЛЕНЫ: Заменены на Zod схемы в @repo/utils
// VALIDATION_MESSAGES - УДАЛЕНЫ: Заменены на next-intl переводы
// VALIDATION_HELPERS - УДАЛЕНЫ: Не использовались
//
// МИГРАЦИЯ ЗАВЕРШЕНА:
// ✅ crypto.ts - обновлен для использования createCryptoAddressSchema
// ✅ business-validators.ts - обновлен для прямых сообщений
// ✅ trpc-errors.ts - обновлен для прямых сообщений
// ✅ CONSTANTS_EXAMPLES.ts - обновлен для использования Zod
//
// ИСПОЛЬЗУЙТЕ ВМЕСТО УДАЛЕННЫХ СИСТЕМ:
// - Zod схемы из @repo/utils/validation-schemas
// - next-intl переводы из apps/web/messages/*.json
// - createNextIntlZodErrorMap для интеграции
// =================================================

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
