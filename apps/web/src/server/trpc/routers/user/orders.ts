import {
  USER_MESSAGES,
  USER_SUCCESS_MESSAGES,
  USER_CONFIG,
  USER_ORDER_STATUSES,
  CANCELLABLE_ORDER_STATUSES,
} from '@repo/constants';
import { orderManager } from '@repo/exchange-core';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter } from '../../init';
import { protectedProcedure } from '../../middleware/auth';

import { validateUserAccess, validateOrderAccess } from './helpers';

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
        status: z.enum(USER_ORDER_STATUSES).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const user = validateUserAccess(ctx.user.id);
      let orders = orderManager.findByEmail(user.email);

      // Фильтрация по статусу
      if (input.status) {
        orders = orders.filter(order => order.status === input.status);
      }

      // Сортировка по дате создания (новые первыми)
      orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Пагинация
      const paginatedOrders = orders.slice(input.offset, input.offset + input.limit);

      return {
        orders: paginatedOrders.map(order => ({
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
        total: orders.length,
        hasMore: input.offset + input.limit < orders.length,
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
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: USER_MESSAGES.CANNOT_CANCEL,
        });
      }

      // Отменяем заявку
      const updatedOrder = orderManager.update(order.id, {
        status: 'CANCELLED',
      });

      if (!updatedOrder) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: USER_MESSAGES.UPDATE_ERROR,
        });
      }

      console.log(`❌ Заявка ${order.id} отменена пользователем ${user.email}`);

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        message: USER_SUCCESS_MESSAGES.ORDER_CANCELLED,
      };
    }),
});
