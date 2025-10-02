import { USER_SUCCESS_MESSAGES, CANCELLABLE_ORDER_STATUSES, ORDER_STATUSES } from '@repo/constants';
import { orderManager, validateUserAccess, validateOrderAccess } from '@repo/exchange-core';
import {
  sortOrders,
  filterOrders,
  paginateOrders,
  createBadRequestError,
  createInternalServerError,
  securityEnhancedOrderStatusSchema,
  securityEnhancedUserOrdersPaginationSchema,
  /*
  // ⚠️ LEGACY IMPORTS - ЗАКОММЕНТИРОВАНЫ ДЛЯ BACKWARD COMPATIBILITY
  // 
  // ВАЖНО: В данном файле legacy error creators не использовались напрямую
  // User orders router использует только стандартные error creators
  // 
  // ПОТЕНЦИАЛЬНЫЕ LEGACY FUNCTIONS (если бы использовались):
  // - createOrderError('not_found') → createNotFoundError('Order not found')
  // - createOrderError('cannot_cancel') → createBadRequestError('Order cannot be cancelled')
  // - createOrderError('update_failed') → createInternalServerError('Order update failed')
  // - createUserError('not_found') → createNotFoundError('User not found')
  //
  // createOrderError,
  // createUserError,
  */
} from '@repo/utils';

import { z } from 'zod';

import { createTRPCRouter } from '../../init';
import { protectedProcedure } from '../../middleware/auth';

export const ordersRouter = createTRPCRouter({
  // Получить историю заявок пользователя
  getOrderHistory: protectedProcedure
    .input(
      z.object({
        ...securityEnhancedUserOrdersPaginationSchema.shape,
        status: securityEnhancedOrderStatusSchema.optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const user = await validateUserAccess(ctx.user.id);
      // ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА: email → user → orders by userId
      const allOrders = await orderManager.findByUserId(user.id);

      // Преобразуем page/pageSize в limit/offset для совместимости с существующим API
      const limit = input.pageSize;
      const offset = (input.page - 1) * input.pageSize;

      // Используем централизованные утилиты для фильтрации, сортировки и пагинации
      const result = paginateOrders(
        sortOrders(
          filterOrders(allOrders, {
            status: input.status as
              | (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES]
              | undefined,
          })
        ),
        {
          limit,
          offset,
        }
      );

      return {
        orders: result.items.map(order => ({
          id: order.publicId, // ✅ ИСПРАВЛЕНО: используем публичный ID для frontend
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
  // Отменить заявку (если возможно)
  cancelOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await validateUserAccess(ctx.user.id);
      const order = await validateOrderAccess(input.orderId, user.email);

      // Проверяем, можно ли отменить заявку
      if (
        !CANCELLABLE_ORDER_STATUSES.includes(
          order.status as (typeof CANCELLABLE_ORDER_STATUSES)[number]
        )
      ) {
        throw createBadRequestError('Order cannot be cancelled in current status');
      }

      // Отменяем заявку
      const updatedOrder = await orderManager.update(order.id, {
        status: ORDER_STATUSES.CANCELLED,
      });

      if (!updatedOrder) {
        throw createInternalServerError('Order update failed');
      }

      console.log(`❌ Заявка ${order.id} отменена пользователем ${user.email}`);

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        message: USER_SUCCESS_MESSAGES.ORDER_CANCELLED,
      };
    }),
});
