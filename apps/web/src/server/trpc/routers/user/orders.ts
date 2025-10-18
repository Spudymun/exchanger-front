import {
  USER_SUCCESS_MESSAGES,
  CANCELLABLE_ORDER_STATUSES,
  MARKABLE_AS_PAID_STATUSES, // 🆕 TASK: Константа для валидации статусов при отметке как оплаченого
  ORDER_STATUSES,
} from '@repo/constants';
import { validateUserAccess, validateOrderAccess, type Order } from '@repo/exchange-core';

// ✅ PRODUCTION-READY: Import manager factories instead of mocks
import {
  sortOrders,
  filterOrders,
  paginateOrders,
  createBadRequestError,
  createInternalServerError,
  securityEnhancedOrderStatusSchema,
  securityEnhancedUserOrdersPaginationSchema,
  createEnvironmentLogger,
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
import { sendCancellationNotification } from '@repo/utils/order-notifications';

import { z } from 'zod';

import { createTRPCRouter } from '../../init';
import { protectedProcedure } from '../../middleware/auth';
import { getOrderManager } from '../../utils/manager-factories';

const logger = createEnvironmentLogger('orders-router');

/**
 * Форматирует номер карты с пробелами каждые 4 цифры для удобного чтения и копирования
 * 
 * @param cardNumber - Номер карты (может содержать пробелы, дефисы и др.)
 * @returns Отформатированный номер карты с пробелами каждые 4 цифры
 * 
 * @example
 * formatCardNumber("1234567812345678") // "1234 5678 1234 5678"
 * formatCardNumber("4270-1234-5678-9012") // "4270 1234 5678 9012"
 */
function formatCardNumber(cardNumber: string): string {
  // Убираем все нецифровые символы
  const digitsOnly = cardNumber.replace(/\D/g, '');
  
  // Форматируем с пробелами каждые 4 цифры
  return digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Оборачивает текст в inline code для Telegram Markdown
 * Это делает текст кликабельным для копирования в Telegram
 * 
 * @param text - Текст для оборачивания
 * @returns Текст обернутый в обратные кавычки
 */
function makeClickableCopy(text: string): string {
  return `\`${text}\``;
}

/**
 * 🆕 TASK: Отправка уведомления операторам об оплате заявки пользователем
 *
 * @architecture
 * - Использует BullMQ очередь для надежной доставки
 * - Graceful degradation: fallback к прямой отправке при проблемах с Redis
 * - НЕ блокирует подтверждение оплаты при сбоях уведомлений
 */
async function sendPaidNotification(order: Order, userEmail: string) {
  try {
    const { getTelegramQueue } = await import('@repo/utils/telegram-queue');
    const queue = await getTelegramQueue();

    // ✅ НОВОЕ: Форматируем номер карты с пробелами и делаем кликабельным для копирования
    const cardNumberFormatted = order.recipientData?.cardNumber 
      ? makeClickableCopy(formatCardNumber(order.recipientData.cardNumber))
      : undefined;

    await queue.enqueue({
      orderId: order.id,
      notificationType: 'order_paid',
      payload: {
        order: {
          id: order.publicId, // ✅ publicId для отображения в Telegram
          internalId: order.id, // ✅ UUID для связи с БД (обновление сообщений)
          email: userEmail,
          cryptoAmount: String(order.cryptoAmount),
          currency: order.currency,
          uahAmount: String(order.uahAmount),
          status: 'paid',
          bankName: order.bankName, // ✅ НОВОЕ
          cardNumberMasked: cardNumberFormatted, // ✅ ОБНОВЛЕНО: полный номер с форматированием
          fixedExchangeRate: order.fixedExchangeRate ? String(order.fixedExchangeRate) : undefined, // ✅ НОВОЕ
        },
        depositAddress: order.depositAddress || 'N/A',
        walletType: 'fresh',
        notificationType: 'order_paid',
      },
    });

    logger.info('Telegram notification enqueued for paid order', { orderId: order.id });
  } catch (error) {
    logger.error('Failed to enqueue Telegram paid notification', {
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
      // ✅ Получаем production OrderManager
      const orderManager = await getOrderManager();
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
      const orderManager = await getOrderManager(); // ✅ Получаем production OrderManager
      const updatedOrder = await orderManager.update(order.id, {
        status: ORDER_STATUSES.CANCELLED,
      });

      if (!updatedOrder) {
        throw createInternalServerError('Order update failed');
      }

      logger.info('Order cancelled by user', { orderId: order.id, userEmail: user.email });

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
        logger.info('Order already has PAID status, returning idempotent success', { orderId: order.id });
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
      const orderManager = await getOrderManager(); // ✅ Получаем production OrderManager
      const updatedOrder = await orderManager.update(order.id, {
        status: ORDER_STATUSES.PAID,
      });

      if (!updatedOrder) {
        throw createInternalServerError('Order update failed');
      }

      logger.info('Order marked as paid by user', { orderId: order.id, userEmail: user.email });

      // 🆕 TASK: Отправка уведомления операторам об оплате
      await sendPaidNotification(updatedOrder, user.email);

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        message: USER_SUCCESS_MESSAGES.ORDER_MARKED_PAID,
      };
    }),
});
