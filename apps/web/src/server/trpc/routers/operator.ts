import { ORDER_STATUS_CONFIG, VALIDATION_LIMITS } from '@repo/constants';
import { orderManager } from '@repo/exchange-core';
import {
  paginateOrders,
  filterOrders,
  sortOrders,
  getOrdersStatistics,
  createOrderError,
  createBadRequestError,
  filterOrdersForOperator,
  canTransitionStatus,
} from '@repo/utils';
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
        status: z.enum(['pending', 'processing']).optional(),
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, status } = input;
      const allOrders = orderManager.getAll();

      // Используем централизованные утилиты для фильтрации, сортировки и пагинации
      const filteredOrders = status
        ? filterOrders(allOrders, { status })
        : filterOrdersForOperator(allOrders);

      const sortedOrders = sortOrders(filteredOrders);

      const result = paginateOrders(sortedOrders, { limit, cursor }, order => order.id);

      return {
        items: result.items.map(order => ({
          ...order,
          config:
            ORDER_STATUS_CONFIG[order.status.toLowerCase() as keyof typeof ORDER_STATUS_CONFIG],
        })),
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    }),

  // Взять заявку в обработку
  takeOrder: operatorOnly
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const order = orderManager.findById(input.orderId);

      if (!order) {
        throw createOrderError('not_found', input.orderId);
      }

      if (order.status !== 'pending') {
        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.orderProcessing')
        );
      }

      // Обновляем статус заявки на processing
      const updatedOrder = orderManager.update(input.orderId, {
        status: 'processing',
      });

      if (!updatedOrder) {
        throw createOrderError('update_failed');
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
        status: z.enum(['processing', 'completed', 'cancelled']),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const order = orderManager.findById(input.orderId);

      if (!order) {
        throw createOrderError('not_found', input.orderId);
      }

      // Проверка валидных переходов статусов
      if (!canTransitionStatus(order.status, input.status)) {
        throw createBadRequestError(
          `Невозможно изменить статус с ${order.status} на ${input.status}`
        );
      }

      const updatedOrder = orderManager.update(input.orderId, {
        status: input.status,
        ...(input.status === 'completed' && { processedAt: new Date() }),
      });

      if (!updatedOrder) {
        throw createOrderError('update_failed');
      }

      console.log(
        `🔄 Статус заявки ${input.orderId} изменен на ${input.status} оператором ${ctx.user.email}${input.comment ? `. Комментарий: ${input.comment}` : ''
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

    // Используем централизованную утилиту для получения статистики
    const stats = getOrdersStatistics(orders);

    return {
      total: stats.total,
      today: stats.today,
      completed: stats.byStatus.completed || 0,
      processing: stats.byStatus.processing || 0,
      pending: stats.byStatus.pending || 0,
      totalVolume: stats.totalVolume,
      avgProcessingTime: '15 мин', // Заглушка, в реальности расчет из логов
    };
  }),
});
