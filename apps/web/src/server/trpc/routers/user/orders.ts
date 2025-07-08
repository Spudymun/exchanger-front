import { USER_SUCCESS_MESSAGES, USER_CONFIG, CANCELLABLE_ORDER_STATUSES } from '@repo/constants';
import { orderManager, validateUserAccess, validateOrderAccess } from '@repo/exchange-core';
import { sortOrders, filterOrders, paginateOrders, createOrderError } from '@repo/utils';

import { z } from 'zod';

import { createTRPCRouter } from '../../init';
import { protectedProcedure } from '../../middleware/auth';

export const ordersRouter = createTRPCRouter({
  // Получить историю заявок пользователя
  getOrderHistory: protectedProcedure
    .input(
      z.object({
        limit: z
          .number()
          .min(1)
          .max(USER_CONFIG.MAX_ORDERS_LIMIT)
          .default(USER_CONFIG.DEFAULT_ORDERS_LIMIT),
        offset: z.number().min(0).default(0),
        status: z.enum(['pending', 'paid', 'processing', 'completed', 'cancelled']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const user = validateUserAccess(ctx.user.id);
      const allOrders = orderManager.findByEmail(user.email);

      // Используем централизованные утилиты для фильтрации, сортировки и пагинации
      const result = paginateOrders(sortOrders(filterOrders(allOrders, { status: input.status })), {
        limit: input.limit,
        offset: input.offset,
      });

      return {
        orders: result.items.map(order => ({
          id: order.id,
          status: order.status,
          cryptoAmount: order.cryptoAmount,
          uahAmount: order.uahAmount,
          currency: order.currency,
          depositAddress: order.depositAddress,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          processedAt: order.processedAt,
          txHash: order.txHash,
        })),
        total: result.total,
        hasMore: result.hasMore,
      };
    }),

  // Получить детальную информацию о заявке
  getOrderDetails: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const user = validateUserAccess(ctx.user.id);
      const order = validateOrderAccess(input.orderId, user.email);

      return {
        id: order.id,
        status: order.status,
        cryptoAmount: order.cryptoAmount,
        uahAmount: order.uahAmount,
        currency: order.currency,
        depositAddress: order.depositAddress,
        recipientData: order.recipientData,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        processedAt: order.processedAt,
        txHash: order.txHash,
        // История статусов (в будущем)
        statusHistory: [
          { status: 'pending', timestamp: order.createdAt },
          ...(order.processedAt ? [{ status: order.status, timestamp: order.processedAt }] : []),
        ],
      };
    }),

  // Отменить заявку (если возможно)
  cancelOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = validateUserAccess(ctx.user.id);
      const order = validateOrderAccess(input.orderId, user.email);

      // Проверяем, можно ли отменить заявку
      if (
        !CANCELLABLE_ORDER_STATUSES.includes(
          order.status as (typeof CANCELLABLE_ORDER_STATUSES)[number]
        )
      ) {
        throw createOrderError('cannot_cancel');
      }

      // Отменяем заявку
      const updatedOrder = orderManager.update(order.id, {
        status: 'cancelled',
      });

      if (!updatedOrder) {
        throw createOrderError('update_failed');
      }

      console.log(`❌ Заявка ${order.id} отменена пользователем ${user.email}`);

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        message: USER_SUCCESS_MESSAGES.ORDER_CANCELLED,
      };
    }),
});
