import { ORDER_STATUS_CONFIG, VALIDATION_LIMITS, ORDER_STATUSES } from '@repo/constants';
import { orderManager, WalletPoolManagerFactory } from '@repo/exchange-core';
import {
  paginateOrders,
  filterOrders,
  sortOrders,
  getOrdersStatistics,
  createOrderError,
  createBadRequestError,
  filterOrdersForOperator,
  canTransitionStatus,
  isFinalStatus,
  securityEnhancedOperatorOrdersSchema,
  securityEnhancedUpdateOrderStatusSchema,
  orderIdSchema,
  SECURITY_VALIDATION_LIMITS,
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
        status: securityEnhancedOperatorOrdersSchema.shape.status,
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, status } = input;
      const allOrders = await orderManager.getAll();

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
    .input(z.object({ orderId: orderIdSchema }))
    .mutation(async ({ input, ctx }) => {
      const order = await orderManager.findById(input.orderId);

      if (!order) {
        throw createOrderError('not_found', input.orderId);
      }

      if (order.status !== ORDER_STATUSES.PENDING) {
        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.orderProcessing')
        );
      }

      // ✅ ИСПРАВЛЕНИЕ: Используем assignToOperator вместо простого update для корректного audit tracking
      const updatedOrder = await orderManager.assignToOperator(input.orderId, ctx.user.id);

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
    .input(securityEnhancedUpdateOrderStatusSchema)
    .mutation(async ({ input, ctx }) => {
      const order = await orderManager.findById(input.orderId);

      if (!order) {
        throw createOrderError('not_found', input.orderId);
      }

      // Проверка валидных переходов статусов
      if (!canTransitionStatus(order.status, input.status)) {
        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.statusTransition', {
            currentStatus: order.status,
            newStatus: input.status,
          })
        );
      }

      const updatedOrder = await orderManager.update(input.orderId, {
        status: input.status,
        ...(input.status === ORDER_STATUSES.COMPLETED && { processedAt: new Date() }),
      });

      if (!updatedOrder) {
        throw createOrderError('update_failed');
      }

      // 🎯 TASK 2.3: Автоматическое освобождение кошелька при финальном статусе
      if (isFinalStatus(updatedOrder)) {
        try {
          const walletManager = await WalletPoolManagerFactory.create();
          await walletManager.releaseWallet(updatedOrder.depositAddress);
          console.log(
            `🔓 Кошелек ${updatedOrder.depositAddress} освобожден для заявки ${input.orderId}`
          );
        } catch (walletError) {
          console.error(
            `❌ Ошибка освобождения кошелька для заявки ${input.orderId}:`,
            walletError
          );
          // Не прерываем выполнение, так как статус уже обновлен
        }
      }

      console.log(
        `🔄 Статус заявки ${input.orderId} изменен на ${input.status} оператором ${ctx.user.email}${
          input.operatorNote ? `. Комментарий: ${input.operatorNote}` : ''
        }`
      );

      return {
        success: true,
        order: updatedOrder,
        message: `Статус заявки изменен на ${input.status}`,
      };
    }),

  // Получить статистику оператора
  getMyStats: operatorOnly.query(async ({ ctx }) => {
    const operatorOrders = await orderManager.findByOperator(ctx.user.id);
    const statsData = getOrdersStatistics(operatorOrders);

    return {
      total: statsData.total,
      totalVolume: statsData.totalVolume,
      averageAmount: statsData.averageAmount,
      byStatus: statsData.byStatus,
      today: statsData.today,
    };
  }),

  // Получить заявки назначенные оператору
  getAssignedOrders: operatorOnly
    .input(
      z.object({
        limit: z
          .number()
          .min(1)
          .max(VALIDATION_LIMITS.ORDER_ITEMS_MAX)
          .default(VALIDATION_LIMITS.DEFAULT_PAGE_SIZE),
        cursor: z.string().optional(),
        status: securityEnhancedOperatorOrdersSchema.shape.status.optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor, status } = input;

      // Используем существующий метод orderManager.findByOperator
      const operatorOrders = await orderManager.findByOperator(ctx.user.id);

      // Фильтрация по статусу если указан
      const filteredOrders = status ? filterOrders(operatorOrders, { status }) : operatorOrders;

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

  // Получить персонализированную статистику нагрузки оператора
  getWorkloadStats: operatorOnly.query(async ({ ctx }) => {
    const operatorOrders = await orderManager.findByOperator(ctx.user.id);
    const stats = getOrdersStatistics(operatorOrders);

    return {
      assigned: operatorOrders.length,
      completed: stats.byStatus.completed || 0,
      processing: stats.byStatus.processing || 0,
      totalVolume: stats.totalVolume,
      averageAmount: stats.averageAmount,
    };
  }),

  // Эскалация заявки на саппорт
  escalateToSupport: operatorOnly
    .input(
      z.object({
        orderId: orderIdSchema,
        reason: z
          .string()
          .min(SECURITY_VALIDATION_LIMITS.MESSAGE_MIN_LENGTH)
          .max(SECURITY_VALIDATION_LIMITS.COMMENT_MAX_LENGTH),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { orderId, reason, priority } = input;

      const order = await orderManager.findById(orderId);
      if (!order) {
        throw createOrderError('not_found', orderId);
      }

      // Проверка что заявка назначена этому оператору
      const operatorOrders = await orderManager.findByOperator(ctx.user.id);
      const isAssigned = operatorOrders.some(o => o.id === orderId);

      if (!isAssigned) {
        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.orderNotAssigned')
        );
      }

      // Возвращаем заявку в общий пул (статус PENDING, убираем оператора)
      const updatedOrder = await orderManager.update(orderId, {
        status: ORDER_STATUSES.PENDING,
        assignedOperatorId: undefined,
        assignedAt: undefined,
        escalationReason: reason,
        escalationPriority: priority,
        escalatedAt: new Date(),
        escalatedBy: ctx.user.id,
      });

      if (!updatedOrder) {
        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.orderUpdateFailed')
        );
      }

      return {
        success: true,
        message: await ctx.getErrorMessage('operator.escalatedSuccessfully'),
        order: {
          ...updatedOrder,
          config:
            ORDER_STATUS_CONFIG[
              updatedOrder.status.toLowerCase() as keyof typeof ORDER_STATUS_CONFIG
            ],
        },
      };
    }),
});
