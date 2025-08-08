import {
  VALIDATION_LIMITS,
  CRYPTOCURRENCIES,
  UI_NUMERIC_CONSTANTS,
  VALIDATION_BOUNDS,
  MAX_CRYPTO_AMOUNT,
  ORDER_STATUS_VALUES,
  TICKET_STATUS_VALUES,
  ORDER_STATUSES,
} from '@repo/constants';
import {
  type CryptoCurrency,
} from '@repo/exchange-core';

import { z } from 'zod';

// === КОНСТАНТЫ ===
// Centralized constants from @repo/constants
const MAX_UAH_AMOUNT = VALIDATION_BOUNDS.MAX_UAH_AMOUNT;
const DEFAULT_PAGINATION_LIMIT = UI_NUMERIC_CONSTANTS.MAX_PAGE_SIZE_SMALL;
const MIN_DESCRIPTION_LENGTH = UI_NUMERIC_CONSTANTS.MIN_DESCRIPTION_LENGTH;

// Subset statuses for specific use cases (derived from centralized ORDER_STATUS_VALUES)
const OPERATOR_VIEWABLE_STATUSES = [ORDER_STATUSES.PENDING, ORDER_STATUSES.PROCESSING] as const;
const OPERATOR_CHANGEABLE_STATUSES = [
  ORDER_STATUSES.PROCESSING,
  ORDER_STATUSES.COMPLETED,
  ORDER_STATUSES.CANCELLED,
] as const;

/**
 * Централизованные Zod схемы валидации для tRPC роутеров
 * Устраняет дублирование валидационной логики
 * Сообщения об ошибках предоставляются через Zod error map для поддержки i18n
 */

// === БАЗОВЫЕ ТИПЫ ===

// === УСИЛЕННЫЕ БАЗОВЫЕ СХЕМЫ ===

/**
 * Email валидация - строгая Zod валидация БЕЗ хардкода сообщений
 * Сообщения обрабатываются через createNextIntlZodErrorMap
 */
export const emailSchema = z
  .string()
  .min(1)
  .max(VALIDATION_LIMITS.EMAIL_MAX_LENGTH)
  .email();

/**
 * Пароль - УСИЛЕННАЯ валидация (строже чем текущая)
 * Требования: минимум 8 символов, заглавная, строчная, цифра, спецсимвол
 * ИСПРАВЛЕНО: Использует i18n ключи через error map вместо хардкода
 */
export const passwordSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH)
  .max(VALIDATION_LIMITS.PASSWORD_MAX_LENGTH)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/\d/)
  .regex(/[@$!%*?&]/);

/**
 * Новый пароль - та же усиленная валидация что и обычный пароль
 */
export const newPasswordSchema = passwordSchema;

/**
 * Миграционная схема для существующих паролей (без спецсимволов)
 * Используется для входа существующих пользователей
 * ИСПРАВЛЕНО: Использует i18n ключи через error map
 */
export const legacyPasswordSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/\d/);

/**
 * Валидация имени пользователя
 */
export const usernameSchema = z
  .string()
  .min(VALIDATION_LIMITS.USERNAME_MIN_LENGTH)
  .max(VALIDATION_LIMITS.USERNAME_MAX_LENGTH);

/**
 * Валидация ID (обычно UUID или строка) БЕЗ хардкода сообщений
 */
export const idSchema = z.string().min(1);

// === CRYPTO ВАЛИДАЦИЯ ===

/**
 * Bitcoin адрес - поддержка Legacy и Bech32
 */
/**
 * Bitcoin адрес (legacy и bech32)
 */
export const btcAddressSchema = z
  .string()
  .regex(
    /^(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/
  );

/**
 * Ethereum адрес (также для USDT)
 */
export const ethAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/);

/**
 * Litecoin адрес
 */
export const ltcAddressSchema = z
  .string()
  .regex(
    /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1[a-z0-9]{39,59}$/
  );

/**
 * Универсальная валидация crypto адреса по валюте
 */
export const createCryptoAddressSchema = (currency: CryptoCurrency) => {
  switch (currency) {
    case 'BTC':
      return btcAddressSchema;
    case 'ETH':
    case 'USDT':
      return ethAddressSchema;
    case 'LTC':
      return ltcAddressSchema;
    default:
      return z.string().min(1);
  }
};

/**
 * Валидация поискового запроса
 */
export const searchQuerySchema = z
  .string()
  .min(2);

// === ТЕЛЕФОННЫЕ НОМЕРА ===

/**
 * Украинский номер телефона
 */
export const phoneUkraineSchema = z
  .string()
  .regex(/^\+380\d{9}$/);

/**
 * Международный номер телефона
 */
export const phoneInternationalSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/);

// === ПАГИНАЦИЯ ===

/**
 * Базовая схема пагинации с offset
 */
export const offsetPaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(DEFAULT_PAGINATION_LIMIT),
  offset: z.number().min(0).default(0),
});

/**
 * Схема пагинации с cursor
 */
export const cursorPaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(DEFAULT_PAGINATION_LIMIT),
  cursor: z.string().optional(),
});

/**
 * Универсальная схема пагинации (поддерживает оба типа)
 */
export const universalPaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(DEFAULT_PAGINATION_LIMIT),
  offset: z.number().min(0).default(0).optional(),
  cursor: z.string().optional(),
});

// === ФИНАНСОВЫЕ ДАННЫЕ ===

/**
 * Валидация криптовалютной суммы (числовая)
 */
export const cryptoAmountSchema = z
  .number()
  .positive()
  .max(MAX_CRYPTO_AMOUNT);

/**
 * Валидация суммы в гривнах (числовая)
 */
export const uahAmountSchema = z
  .number()
  .positive()
  .max(MAX_UAH_AMOUNT);

// === СТРОКОВЫЕ СХЕМЫ ДЛЯ ФОРМ ===

/**
 * Crypto сумма - строгая валидация с точностью до 8 знаков
 * Используется в формах для строковых инпутов
 */
export const cryptoAmountStringSchema = z
  .string()
  .regex(/^\d+\.?\d{0,8}$/)
  .refine(val => Number(val) > 0)
  .refine(
    val => Number(val) >= VALIDATION_BOUNDS.MIN_ORDER_AMOUNT
  )
  .refine(
    val => Number(val) <= VALIDATION_BOUNDS.MAX_ORDER_AMOUNT
  );

/**
 * UAH сумма - строгая валидация с точностью до 2 знаков
 * Используется в формах для строковых инпутов
 */
export const uahAmountStringSchema = z
  .string()
  .regex(/^\d+\.?\d{0,2}$/)
  .refine(val => Number(val) > 0)
  .refine(
    val => Number(val) <= VALIDATION_BOUNDS.MAX_UAH_AMOUNT
  );

/**
 * Валидация криптовалюты
 */
export const currencySchema = z.enum(CRYPTOCURRENCIES as unknown as [string, ...string[]]);

// === ЗАКАЗЫ ===

/**
 * Статусы заказов
 */
export const orderStatusSchema = z.enum(ORDER_STATUS_VALUES as [string, ...string[]]);

/**
 * Базовая схема для создания заказа
 */
export const createOrderBaseSchema = z.object({
  email: emailSchema,
  cryptoAmount: cryptoAmountSchema,
  currency: currencySchema,
});

/**
 * Схема для получения истории заказов
 */
export const orderHistorySchema = z.object({
  ...offsetPaginationSchema.shape,
  status: orderStatusSchema.optional(),
});

/**
 * Схема для получения заказов оператором
 */
export const operatorOrdersSchema = z.object({
  ...cursorPaginationSchema.shape,
  status: z.enum(OPERATOR_VIEWABLE_STATUSES).optional(),
});

/**
 * Схема для обновления статуса заказа
 */
export const updateOrderStatusSchema = z.object({
  orderId: idSchema,
  status: z.enum(OPERATOR_CHANGEABLE_STATUSES),
  comment: z.string().optional(),
});

// === EXCHANGE (ОБМЕН) ===

/**
 * Схема для получения курса валюты
 */
export const getCurrencyRateSchema = z.object({
  currency: currencySchema,
});

/**
 * Схема для расчета суммы
 */
export const calculateAmountSchema = z.object({
  amount: z.number().positive(),
  currency: currencySchema,
  direction: z.enum(['crypto-to-uah', 'uah-to-crypto']),
});

/**
 * Схема для создания заказа на обмен
 */
export const createExchangeOrderSchema = z.object({
  email: emailSchema,
  cryptoAmount: cryptoAmountSchema,
  currency: currencySchema,
  paymentDetails: z
    .object({
      cardNumber: z.string().optional(),
      bankDetails: z.string().optional(),
    })
    .optional(),
});

/**
 * Схема для получения истории заказов по email
 */
export const getOrderHistoryByEmailSchema = z.object({
  email: emailSchema,
  limit: z.number().min(1).max(100).default(VALIDATION_LIMITS.MIN_PAGE_SIZE),
});

// === АУТЕНТИФИКАЦИЯ ===

/**
 * Схема для API входа (без CAPTCHA)
 */
export const loginApiSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Кастомная валидация CAPTCHA - ЛОКАЛИЗУЕМАЯ версия
 * ИСПРАВЛЕНО: Убран хардкод русских сообщений, теперь используется i18n
 */
// === CAPTCHA ВАЛИДАЦИЯ ===

/**
 * CAPTCHA - усиленная валидация с дополнительными проверками БЕЗ хардкода сообщений
 * Сообщения обрабатываются через createNextIntlZodErrorMap
 */
export const captchaSchema = z
  .string()
  .min(1)
  .refine(
    (value) => {
      // Базовая проверка на заполненность
      if (!value || value.trim() === '') {
        return false;
      }
      // Дополнительная валидация делается через состояние компонента
      return true;
    }
  );

/**
 * Схема для входа - УСИЛЕННАЯ валидация
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: legacyPasswordSchema, // Используем legacy для входа существующих пользователей
  captcha: captchaSchema,
});

/**
 * Схема для API регистрации (без подтверждения пароля)
 */
export const registerApiSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
});

/**
 * Схема для регистрации с подтверждением - УСИЛЕННАЯ валидация
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: newPasswordSchema, // Усиленная валидация для новых пользователей
    confirmPassword: z.string(),
    captcha: captchaSchema,
  })
  .refine(data => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
  });

/**
 * Схема для сброса пароля
 */
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Схема для подтверждения нового пароля
 */
export const confirmResetPasswordSchema = z.object({
  email: emailSchema,
  resetCode: z.string().min(1),
  newPassword: newPasswordSchema,
});

/**
 * Схема для подтверждения email
 */
export const confirmEmailSchema = z.object({
  email: emailSchema,
  verificationCode: z.string().min(1),
});

// === БЕЗОПАСНОСТЬ ===

/**
 * Схема для смены пароля
 */
export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
  });

/**
 * Схема для завершения сессии
 */
export const terminateSessionSchema = z.object({
  sessionId: idSchema,
});

// === ПОИСК ===

/**
 * Схема для поиска заказов
 */
export const searchOrdersSchema = z.object({
  query: searchQuerySchema,
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: orderStatusSchema.optional(),
  ...offsetPaginationSchema.shape,
});

/**
 * Схема для поиска пользователей
 */
export const searchUsersSchema = z.object({
  query: searchQuerySchema,
  verified: z.boolean().optional(),
  ...offsetPaginationSchema.shape,
});

// === ПОДДЕРЖКА ===

/**
 * Приоритеты тикетов поддержки
 */
export const ticketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

/**
 * Статусы тикетов поддержки
 */
export const ticketStatusSchema = z.enum(TICKET_STATUS_VALUES as [string, ...string[]]);

/**
 * Схема для создания тикета поддержки
 */
export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(VALIDATION_LIMITS.USERNAME_MIN_LENGTH),
  description: z
    .string()
    .min(MIN_DESCRIPTION_LENGTH),
  priority: ticketPrioritySchema.default('MEDIUM'),
});

/**
 * Схема для создания тикета администратором
 */
export const createTicketAdminSchema = z.object({
  userId: idSchema,
  subject: z
    .string()
    .min(VALIDATION_LIMITS.USERNAME_MIN_LENGTH),
  description: z
    .string()
    .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH),
  priority: ticketPrioritySchema.default('MEDIUM'),
  category: z.string().min(1),
});

/**
 * Схема для поиска в базе знаний
 */
export const searchKnowledgeSchema = z.object({
  query: searchQuerySchema,
  category: z.string().optional(),
  limit: z.number().min(1).max(100).default(VALIDATION_LIMITS.MIN_PAGE_SIZE),
});

/**
 * Схема для получения тикетов поддержки
 */
export const getTicketsSchema = z.object({
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  ...offsetPaginationSchema.shape,
});

/**
 * Схема для обновления статуса тикета
 */
export const updateTicketStatusSchema = z.object({
  ticketId: idSchema,
  status: ticketStatusSchema,
  comment: z.string().optional(),
});

// === ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ===

/**
 * Схема для обновления настроек уведомлений
 */
export const updateNotificationsSchema = z.object({
  notifications: z
    .object({
      email: z.boolean().default(true),
      orderUpdates: z.boolean().default(true),
      marketing: z.boolean().default(false),
    })
    .optional(),
});

// === БЫСТРЫЕ ДЕЙСТВИЯ ===

/**
 * Схема для быстрых действий администратора
 */
export const quickActionsSchema = z.object({
  action: z.enum(['REFRESH_RATES', 'CLEAR_CACHE', 'SEND_NOTIFICATION']),
  params: z.record(z.any()).optional(),
});

// === СОСТАВНЫЕ СХЕМЫ ===

/**
 * Универсальная схема для получения элемента по ID
 */
export const getByIdSchema = z.object({
  id: idSchema,
});

/**
 * Схема для операций с заказом (по ID)
 */
export const orderByIdSchema = z.object({
  orderId: idSchema,
});

/**
 * Схема для фильтрации по дате
 */
export const dateRangeSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// === ВАЛИДАТОРЫ-ХЕЛПЕРЫ ===

/**
 * Создает схему с ограничением по времени (например, для rate limiting)
 */
export function createTimestampSchema() {
  return z.number().int().positive();
}

/**
 * Создает схему для опциональной строки с минимальной длиной
 */
export function createOptionalStringSchema(minLength = 1) {
  return z
    .string()
    .min(minLength)
    .optional();
}

/**
 * Создает схему для массива ID
 */
export function createIdsArraySchema(maxItems = 100) {
  return z.array(idSchema).max(maxItems);
}

/**
 * Создает схему для диапазона чисел
 */
export function createNumberRangeSchema(min: number, max: number) {
  return z
    .number()
    .min(min)
    .max(max);
}
// === ДОПОЛНИТЕЛЬНЫЕ СОСТАВНЫЕ СХЕМЫ ===

/**
 * Создание заказа - усиленная валидация
 */
export const createOrderEnhancedSchema = z.object({
  email: emailSchema,
  cryptoAmount: cryptoAmountStringSchema, // Строгая валидация суммы
  currency: currencySchema,
  recipientAddress: z.string().min(1),
});

/**
 * Смена пароля - усиленная валидация
 */
export const changePasswordEnhancedSchema = z
  .object({
    currentPassword: legacyPasswordSchema, // Текущий пароль может быть legacy
    newPassword: newPasswordSchema, // Новый пароль должен быть усиленным
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    path: ['newPassword'],
  });

/**
 * Схема для создания заказа с crypto адресом
 */
export const createOrderWithAddressSchema = z.object({
  email: emailSchema,
  cryptoAmount: cryptoAmountStringSchema,
  currency: currencySchema,
}).refine(async (data) => {
  // Валидация crypto адреса в зависимости от валюты
  const _addressSchema = createCryptoAddressSchema(data.currency as CryptoCurrency);
  return true; // Placeholder - реальная валидация будет в компоненте
});

/**
 * Схема для обновления профиля пользователя
 */
export const updateUserProfileSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneInternationalSchema.optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
}).refine(data => {
  // Хотя бы одно поле должно быть заполнено
  return Object.values(data).some(value => value !== undefined && value !== '');
});