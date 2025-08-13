import {
  VALIDATION_LIMITS,
  UI_NUMERIC_CONSTANTS,
  VALIDATION_BOUNDS,
  MAX_CRYPTO_AMOUNT,
  ORDER_STATUS_VALUES,
  TICKET_STATUS_VALUES,
  ORDER_STATUSES,
  EXCHANGE_VALIDATION_PATTERNS,
} from '@repo/constants';

import { z } from 'zod';

// Импорт централизованных утилит валидации

// Импорт схем для использования в этом файле
import {
  idSchema,
  emailSchema,
  passwordSchema,
  newPasswordSchema,
  legacyPasswordSchema,
  searchQuerySchema,
} from './validation/schemas-basic';

import { currencySchema } from './validation/schemas-crypto';
import { isEmptyString } from './validation/validation-utils';

/**
 * Централизованные схемы валидации
 * Используют константы из @repo/constants для единообразия
 * Сообщения переводов управляются через createNextIntlZodErrorMap или createZodErrorMap
 */

// === РЕЭКСПОРТ БАЗОВЫХ СХЕМ ===
export { usernameSchema, phoneInternationalSchema } from './validation/schemas-basic';

export {
  btcAddressSchema,
  ethAddressSchema,
  ltcAddressSchema,
  createCryptoAddressSchema,
  cryptoAmountStringSchema,
} from './validation/schemas-crypto';

// === ЭКСПОРТ ИМПОРТИРОВАННЫХ СХЕМ ===
// Экспортируем схемы, которые мы импортировали для использования в этом файле
export {
  idSchema,
  emailSchema,
  passwordSchema,
  newPasswordSchema,
  legacyPasswordSchema,
  searchQuerySchema,
  currencySchema,
};

// === СПЕЦИФИЧНЫЕ СХЕМЫ (остающиеся в этом файле) ===

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

// === УНИКАЛЬНЫЕ СХЕМЫ ЭТОГО ФАЙЛА ===

/**
 * Украинский номер телефона
 */
export const phoneUkraineSchema = z.string().regex(/^\+380\d{9}$/);

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
export const cryptoAmountSchema = z.number().positive().max(MAX_CRYPTO_AMOUNT);

/**
 * Валидация суммы в гривнах (числовая)
 */
export const uahAmountSchema = z.number().positive().max(MAX_UAH_AMOUNT);

/**
 * UAH сумма - строгая валидация с точностью до 2 знаков
 * Используется в формах для строковых инпутов
 */
export const uahAmountStringSchema = z
  .string()
  .regex(/^\d+\.?\d{0,2}$/)
  .refine(val => Number(val) > 0)
  .refine(val => Number(val) <= VALIDATION_BOUNDS.MAX_UAH_AMOUNT);

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
      cardNumber: z
        .string()
        .regex(
          EXCHANGE_VALIDATION_PATTERNS.CARD_NUMBER,
          'Номер карты должен содержать точно 16 цифр'
        )
        .optional(),
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
  .refine(value => {
    // Базовая проверка на заполненность через централизованную утилиту
    if (isEmptyString(value)) {
      return false;
    }
    // Дополнительная валидация делается через состояние компонента
    return true;
  });

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
  subject: z.string().min(VALIDATION_LIMITS.USERNAME_MIN_LENGTH),
  description: z.string().min(MIN_DESCRIPTION_LENGTH),
  priority: ticketPrioritySchema.default('MEDIUM'),
});

/**
 * Схема для создания тикета администратором
 */
export const createTicketAdminSchema = z.object({
  userId: idSchema,
  subject: z.string().min(VALIDATION_LIMITS.USERNAME_MIN_LENGTH),
  description: z.string().min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH),
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

// === РЕЭКСПОРТ СОСТАВНЫХ СХЕМ ===
export {
  createOrderEnhancedSchema,
  changePasswordEnhancedSchema,
  createOrderWithAddressSchema,
  updateUserProfileSchema,
} from './validation/schemas-composed';

// === КОНЕЦ ФАЙЛА ===
