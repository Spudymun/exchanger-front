/**
 * Утилитарные схемы валидации
 * Простые схемы для общих операций
 */

import { z } from 'zod';

import { idSchema } from './schemas-basic';

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
