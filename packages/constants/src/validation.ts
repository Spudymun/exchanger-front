import { AMOUNT_LIMITS } from './exchange'; // ✅ Используем правильные лимиты из exchange.ts
import { REQUEST_TIMEOUT_CONSTANTS } from './time-constants';

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

  // Financial - ✅ Используем правильные exchange-specific лимиты
  // ❌ MIN_ORDER_AMOUNT/MAX_ORDER_AMOUNT УДАЛЕНЫ - используйте getCurrencyLimits()
  MIN_USD_AMOUNT: AMOUNT_LIMITS.MIN_USD, // $10 в USD эквиваленте
  MAX_USD_AMOUNT: AMOUNT_LIMITS.MAX_USD, // $5000 в USD эквиваленте
  MIN_WITHDRAWAL_AMOUNT: 10,
  MAX_WITHDRAWAL_AMOUNT: 100000,

  // Card validation
  CARD_NUMBER_MIN_LENGTH: 13, // Visa 13-digit cards
  CARD_NUMBER_MAX_LENGTH: 19, // American Express extended

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

/**
 * Regex паттерны для валидации
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Централизованные паттерны для переиспользования
 * Перенесены из packages/utils/src/validation/schemas-basic.ts
 */
export const VALIDATION_PATTERNS = {
  /**
   * Email валидация - упрощенный безопасный паттерн
   * Формат: text@domain.extension
   * Исключает пробелы и требует @ и точку в домене
   */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/u,

  /**
   * Bitcoin адреса - поддерживает Legacy и Bech32 форматы
   * Legacy: начинается с 1 или 3, длина 25-34 символа, Base58
   * Bech32: начинается с bc1, длина 39-59 символов, только строчные
   */
  BTC_ADDRESS: /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/u,

  /**
   * Ethereum адреса - стандартный формат
   * Начинается с 0x, затем 40 hex символов (0-9, a-f, A-F)
   */
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/u,

  /**
   * Litecoin адреса - Legacy формат
   * Начинается с L, M или 3, длина 26-33 символа, Base58
   */
  LTC_ADDRESS: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/u,

  /**
   * Имена/фамилии - латиница и кириллица
   * Разрешены: буквы, пробелы, дефисы, апострофы
   */
  NAME: /^[a-zA-Zа-яА-ЯёЁ\s'-]+$/u,
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
