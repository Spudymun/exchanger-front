import {
  EXCHANGE_ORDER_STATUSES,
  EXCHANGE_ORDER_STATUS_CONFIG,
  VALIDATION_LIMITS,
} from '@repo/constants';
import { orderManager } from '@repo/exchange-core';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter } from '../init';
import { operatorOnly } from '../middleware/auth';

/**
 * Operator API роутер
 * Доступен только для пользователей с ролью OPERATOR
 * Включает операции по обработке заявок, мониторингу операций
 */
export const operatorRouter = createTRPCRouter({
  // Получить заявки для обработки
  getPendingOrders: operatorOnly
    .input(
      z.object({
        limit: z
          .number()
          .min(1)
          .max(VALIDATION_LIMITS.ORDER_ITEMS_MAX)
          .default(VALIDATION_LIMITS.DEFAULT_PAGE_SIZE),
        cursor: z.string().optional(),
        status: z.enum(['PENDING', 'PROCESSING']).optional(),
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, status } = input;

      const orders = orderManager
        .getAll()
        .filter(order => {
          if (status) return order.status === status;
          return order.status === 'PENDING' || order.status === 'PROCESSING';
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Пагинация
      const startIndex = cursor ? orders.findIndex(o => o.id === cursor) + 1 : 0;
      const items = orders.slice(startIndex, startIndex + limit);
      const nextCursor = items.length === limit ? items[items.length - 1]?.id : undefined;

      return {
        items: items.map(order => ({
          ...order,
          config:
            EXCHANGE_ORDER_STATUS_CONFIG[
              order.status.toLowerCase() as keyof typeof EXCHANGE_ORDER_STATUS_CONFIG
            ],
        })),
        nextCursor,
        hasMore: !!nextCursor,
      };
    }),

  // Взять заявку в обработку
  takeOrder: operatorOnly
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const order = orderManager.findById(input.orderId);

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Заявка не найдена',
        });
      }

      if (order.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Заявка уже обрабатывается или завершена',
        });
      }

      // Обновляем статус заявки на processing
      const updatedOrder = orderManager.update(input.orderId, {
        status: 'PROCESSING',
      });

      if (!updatedOrder) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ошибка при обновлении заявки',
        });
      }

      console.log(`📋 Заявка ${input.orderId} взята в обработку оператором ${ctx.user.email}`);

      return {
        success: true,
        order: updatedOrder,
        message: 'Заявка взята в обработку',
      };
    }),

  // Обновить статус заявки
  updateOrderStatus: operatorOnly
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(['PROCESSING', 'COMPLETED', 'CANCELLED']),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const order = orderManager.findById(input.orderId);

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Заявка не найдена',
        });
      }

      // Проверка валидных переходов статусов
      const validTransitions: Record<string, string[]> = {
        PENDING: ['PROCESSING', 'CANCELLED'],
        PROCESSING: ['COMPLETED', 'CANCELLED'],
      };

      const allowedStatuses = validTransitions[order.status] || [];
      if (!allowedStatuses.includes(input.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Невозможно изменить статус с ${order.status} на ${input.status}`,
        });
      }

      const updatedOrder = orderManager.update(input.orderId, {
        status: input.status as keyof typeof EXCHANGE_ORDER_STATUSES,
        ...(input.status === 'COMPLETED' && { processedAt: new Date() }),
      });

      if (!updatedOrder) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ошибка при обновлении заявки',
        });
      }

      console.log(
        `🔄 Статус заявки ${input.orderId} изменен на ${input.status} оператором ${ctx.user.email}${
          input.comment ? `. Комментарий: ${input.comment}` : ''
        }`
      );

      return {
        success: true,
        order: updatedOrder,
        message: `Статус заявки изменен на ${input.status}`,
      };
    }),

  // Получить статистику оператора
  getMyStats: operatorOnly.query(async () => {
    const orders = orderManager.getAll();

    // В реальном приложении будет фильтрация по operatorId
    // Сейчас возвращаем общую статистику для демонстрации
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => order.createdAt.toDateString() === today);

    return {
      total: orders.length,
      today: todayOrders.length,
      completed: orders.filter(o => o.status === 'COMPLETED').length,
      processing: orders.filter(o => o.status === 'PROCESSING').length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      totalVolume: orders
        .filter(o => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + o.uahAmount, 0),
      avgProcessingTime: '15 мин', // Заглушка, в реальности расчет из логов
    };
  }),
});
