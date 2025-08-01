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

import { z } from 'zod';

import { validationMessages } from './validation-messages';

// === КОНСТАНТЫ ===
const POSITIVE_AMOUNT_MESSAGE = 'Сумма должна быть положительной';
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

/**
 * Валидация email адреса
 */
export const emailSchema = z.string().email();

/**
 * Валидация пароля
 */
export const passwordSchema = z.string().min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH);

/**
 * Валидация нового пароля (с дополнительными требованиями)
 */
export const newPasswordSchema = passwordSchema;

/**
 * Валидация имени пользователя
 */
export const usernameSchema = z
  .string()
  .min(VALIDATION_LIMITS.USERNAME_MIN_LENGTH)
  .max(VALIDATION_LIMITS.USERNAME_MAX_LENGTH);

/**
 * Валидация ID (обычно UUID или строка)
 */
export const idSchema = z.string().min(1, validationMessages.required());

/**
 * Валидация поискового запроса
 */
export const searchQuerySchema = z
  .string()
  .min(2, 'Поисковый запрос должен содержать минимум 2 символа');

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
 * Валидация криптовалютной суммы
 */
export const cryptoAmountSchema = z
  .number()
  .positive(POSITIVE_AMOUNT_MESSAGE)
  .max(MAX_CRYPTO_AMOUNT, 'Сумма не должна превышать 1,000,000');

/**
 * Валидация суммы в гривнах
 */
export const uahAmountSchema = z
  .number()
  .positive(POSITIVE_AMOUNT_MESSAGE)
  .max(MAX_UAH_AMOUNT, 'Сумма не должна превышать 100,000,000 грн');

/**
 * Валидация криптовалюты
 */
export const currencySchema = z.enum(CRYPTOCURRENCIES as unknown as [string, ...string[]], {
  errorMap: () => ({ message: 'Неподдерживаемая криптовалюта' }),
});

// === ЗАКАЗЫ ===

/**
 * Статусы заказов
 */
export const orderStatusSchema = z.enum(ORDER_STATUS_VALUES as [string, ...string[]], {
  errorMap: () => ({ message: 'Некорректный статус заказа' }),
});

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
  amount: z.number().positive(POSITIVE_AMOUNT_MESSAGE),
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
 * Схема для входа
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Схема для API регистрации (без подтверждения пароля)
 */
export const registerApiSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
});

/**
 * Схема для регистрации с подтверждением
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
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
  resetCode: z.string().min(1, validationMessages.required()),
  newPassword: newPasswordSchema,
});

/**
 * Схема для подтверждения email
 */
export const confirmEmailSchema = z.object({
  email: emailSchema,
  verificationCode: z.string().min(1, validationMessages.required()),
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
    message: validationMessages.confirmPassword.noMatch(),
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
export const ticketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
  errorMap: () => ({ message: 'Некорректный приоритет тикета' }),
});

/**
 * Статусы тикетов поддержки
 */
export const ticketStatusSchema = z.enum(TICKET_STATUS_VALUES as [string, ...string[]], {
  errorMap: () => ({ message: 'Некорректный статус тикета' }),
});

/**
 * Схема для создания тикета поддержки
 */
export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(VALIDATION_LIMITS.USERNAME_MIN_LENGTH, 'Тема должна содержать минимум 3 символа'),
  description: z
    .string()
    .min(MIN_DESCRIPTION_LENGTH, 'Описание должно содержать минимум 10 символов'),
  priority: ticketPrioritySchema.default('MEDIUM'),
});

/**
 * Схема для создания тикета администратором
 */
export const createTicketAdminSchema = z.object({
  userId: idSchema,
  subject: z
    .string()
    .min(VALIDATION_LIMITS.USERNAME_MIN_LENGTH, 'Тема должна содержать минимум 3 символа'),
  description: z
    .string()
    .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH, 'Описание должно содержать минимум 8 символов'),
  priority: ticketPrioritySchema.default('MEDIUM'),
  category: z.string().min(1, 'Категория обязательна'),
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
export function createTimestampSchema(name = 'timestamp') {
  return z.number().int().positive(`${name} должен быть положительным целым числом`);
}

/**
 * Создает схему для опциональной строки с минимальной длиной
 */
export function createOptionalStringSchema(minLength = 1, fieldName = 'поле') {
  return z
    .string()
    .min(minLength, `${fieldName} должно содержать минимум ${minLength} символов`)
    .optional();
}

/**
 * Создает схему для массива ID
 */
export function createIdsArraySchema(maxItems = 100) {
  return z.array(idSchema).max(maxItems, `Максимальное количество элементов: ${maxItems}`);
}

/**
 * Создает схему для диапазона чисел
 */
export function createNumberRangeSchema(min: number, max: number, fieldName = 'значение') {
  return z
    .number()
    .min(min, `${fieldName} не может быть меньше ${min}`)
    .max(max, `${fieldName} не может быть больше ${max}`);
}
