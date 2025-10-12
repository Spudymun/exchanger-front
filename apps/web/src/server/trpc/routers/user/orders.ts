import {
  USER_SUCCESS_MESSAGES,
  CANCELLABLE_ORDER_STATUSES,
  MARKABLE_AS_PAID_STATUSES, // 🆕 TASK: Константа для валидации статусов при отметке как оплаченого
  ORDER_STATUSES,
} from '@repo/constants';
import { orderManager, validateUserAccess, validateOrderAccess, type Order } from '@repo/exchange-core';
import {
  sortOrders,
  filterOrders,
  paginateOrders,
  createBadRequestError,
  createInternalServerError,
  securityEnhancedOrderStatusSchema,
  securityEnhancedUserOrdersPaginationSchema,
  sendCancellationNotification,
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

/**
 * 🆕 TASK: Отправка уведомления операторам об оплате заявки пользователем
 * Паттерн скопирован из sendCancellationNotification (теперь в @repo/utils)
 */
async function sendPaidNotification(order: Order, userEmail: string) {
  const telegramBotUrl = process.env.TELEGRAM_BOT_URL;
  if (!telegramBotUrl) {
    console.warn('TELEGRAM_BOT_URL not configured, skipping paid notification');
    return;
  }

  try {
    await fetch(`${telegramBotUrl}/api/notify-operators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: {
          id: order.publicId, // ✅ publicId для отображения в Telegram
          internalId: order.id, // ✅ UUID для связи с БД (обновление сообщений)
          email: userEmail,
          cryptoAmount: order.cryptoAmount,
          currency: order.currency,
          uahAmount: order.uahAmount,
          status: 'paid', // 🔄 ИЗМЕНЕНО: 'paid' вместо 'cancelled'
        },
        // ⚠️ ВАЖНО: depositAddress ОБЯЗАТЕЛЕН в payload схеме
        depositAddress: order.depositAddress || 'N/A',
        walletType: 'fresh', // Неважно для оплаты, но обязательно по схеме
        // 🆕 НОВЫЙ флаг для определения типа уведомления
        notificationType: 'order_paid', // 🔄 ИЗМЕНЕНО: 'order_paid' вместо 'order_cancelled'
      }),
    });

    console.log(`✅ Telegram notification sent for paid order ${order.id}`);
  } catch (error) {
    console.error('Failed to send Telegram paid notification', {
      orderId: order.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // НЕ прерываем выполнение - оплата заявки успешна даже без уведомления
  }
}

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

      // 🆕 TASK: Отправка уведомления операторам об отмене
      await sendCancellationNotification(updatedOrder, user.email, 'user');

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        message: USER_SUCCESS_MESSAGES.ORDER_CANCELLED,
      };
    }),

  // 🆕 TASK: Отметить заявку как оплаченную
  markAsPaid: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Валидация доступа пользователя (Level 2 Security)
      const user = await validateUserAccess(ctx.user.id);

      // Валидация владения заказом (Level 3 Security)
      const order = await validateOrderAccess(input.orderId, user.email);

      // 🆕 ИДЕМПОТЕНТНОСТЬ: Если заказ уже оплачен - возвращаем success без изменений
      if (order.status === ORDER_STATUSES.PAID) {
        console.log(
          `ℹ️ Заявка ${order.id} уже имеет статус PAID, возвращаем idempotent success`
        );
        return {
          id: order.id,
          status: order.status,
          message: USER_SUCCESS_MESSAGES.ORDER_MARKED_PAID,
        };
      }

      // Проверяем, можно ли отметить заявку как оплаченную
      if (
        !MARKABLE_AS_PAID_STATUSES.includes(
          order.status as (typeof MARKABLE_AS_PAID_STATUSES)[number]
        )
      ) {
        throw createBadRequestError(
          `Order cannot be marked as paid in current status: ${order.status}`
        );
      }

      // Изменяем статус на PAID
      const updatedOrder = await orderManager.update(order.id, {
        status: ORDER_STATUSES.PAID,
      });

      if (!updatedOrder) {
        throw createInternalServerError('Order update failed');
      }

      console.log(
        `💳 Заявка ${order.id} отмечена как оплаченная пользователем ${user.email}`
      );

      // 🆕 TASK: Отправка уведомления операторам об оплате
      await sendPaidNotification(updatedOrder, user.email);

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        message: USER_SUCCESS_MESSAGES.ORDER_MARKED_PAID,
      };
    }),
});
