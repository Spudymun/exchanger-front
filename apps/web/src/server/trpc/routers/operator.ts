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
  createEnvironmentLogger,
} from '@repo/utils';
import { z } from 'zod';

import { createTRPCRouter } from '../init';
import { operatorOnly } from '../middleware/auth';

// Create logger for operator operations
const logger = createEnvironmentLogger('operator-router');

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
      logger.debug('GET_PENDING_ORDERS_REQUEST', {
        limit: input.limit,
        cursor: input.cursor,
        requestedStatus: input.status,
      });

      const { limit, cursor, status } = input;
      const allOrders = await orderManager.getAll();
      logger.debug('FETCHED_ALL_ORDERS', { totalCount: allOrders.length });

      // Используем централизованные утилиты для фильтрации, сортировки и пагинации
      const filteredOrders = status
        ? filterOrders(allOrders, { status })
        : filterOrdersForOperator(allOrders);
      logger.debug('FILTERED_ORDERS', {
        filteredCount: filteredOrders.length,
        filterApplied: status || 'operator_default',
      });

      const sortedOrders = sortOrders(filteredOrders);
      logger.debug('SORTED_ORDERS', { sortedCount: sortedOrders.length });

      const result = paginateOrders(sortedOrders, { limit, cursor }, order => order.id);
      logger.info('PENDING_ORDERS_RESPONSE', {
        returnedItems: result.items.length,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      });

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
      logger.info('TAKE_ORDER_REQUEST', {
        orderId: input.orderId,
        operatorId: ctx.user.id,
        operatorEmail: ctx.user.email,
      });

      const order = await orderManager.findById(input.orderId);
      logger.debug('ORDER_LOOKUP_RESULT', {
        orderId: input.orderId,
        found: !!order,
        currentStatus: order?.status,
        assignedOperator: order?.assignedOperatorId,
      });

      if (!order) {
        logger.warn('ORDER_NOT_FOUND', { orderId: input.orderId });
        throw createOrderError('not_found', input.orderId);
      }

      if (order.status !== ORDER_STATUSES.PENDING) {
        logger.warn('INVALID_ORDER_STATUS_FOR_ASSIGNMENT', {
          orderId: input.orderId,
          currentStatus: order.status,
          expectedStatus: ORDER_STATUSES.PENDING,
        });
        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.orderProcessing')
        );
      }

      // ✅ ИСПРАВЛЕНИЕ: Используем assignToOperator вместо простого update для корректного audit tracking
      logger.debug('ATTEMPTING_ORDER_ASSIGNMENT', {
        orderId: input.orderId,
        operatorId: ctx.user.id,
      });
      const updatedOrder = await orderManager.assignToOperator(input.orderId, ctx.user.id);

      if (!updatedOrder) {
        // Enhanced error messaging for concurrent conflicts
        logger.warn('Order assignment failed - likely concurrent access', {
          orderId: input.orderId,
          operatorId: ctx.user.id,
          operatorEmail: ctx.user.email,
        });

        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.orderAlreadyAssigned')
        );
      }

      logger.info('Order successfully assigned to operator', {
        orderId: input.orderId,
        operatorId: ctx.user.id,
        operatorEmail: ctx.user.email,
        newStatus: updatedOrder.status,
        assignedAt: updatedOrder.assignedAt?.toISOString(),
      });

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
      logger.info('UPDATE_ORDER_STATUS_REQUEST', {
        orderId: input.orderId,
        newStatus: input.status,
        operatorId: ctx.user.id,
        operatorEmail: ctx.user.email,
        operatorNote: input.operatorNote,
      });

      const order = await orderManager.findById(input.orderId);
      logger.debug('ORDER_STATUS_LOOKUP', {
        orderId: input.orderId,
        found: !!order,
        currentStatus: order?.status,
        requestedStatus: input.status,
      });

      if (!order) {
        logger.warn('ORDER_NOT_FOUND_FOR_STATUS_UPDATE', { orderId: input.orderId });
        throw createOrderError('not_found', input.orderId);
      }

      // Проверка валидных переходов статусов
      const canTransition = canTransitionStatus(order.status, input.status);
      logger.debug('STATUS_TRANSITION_VALIDATION', {
        orderId: input.orderId,
        fromStatus: order.status,
        toStatus: input.status,
        canTransition,
      });

      if (!canTransition) {
        logger.warn('INVALID_STATUS_TRANSITION', {
          orderId: input.orderId,
          fromStatus: order.status,
          toStatus: input.status,
        });
        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.statusTransition', {
            currentStatus: order.status,
            newStatus: input.status,
          })
        );
      }

      const updateData = {
        status: input.status,
        ...(input.status === ORDER_STATUSES.COMPLETED && { processedAt: new Date() }),
      };
      logger.debug('UPDATING_ORDER_STATUS', {
        orderId: input.orderId,
        updateData: JSON.stringify(updateData),
      });

      const updatedOrder = await orderManager.update(input.orderId, updateData);

      if (!updatedOrder) {
        logger.error('ORDER_STATUS_UPDATE_FAILED', { orderId: input.orderId });
        throw createOrderError('update_failed');
      }

      logger.info('ORDER_STATUS_UPDATED_SUCCESSFULLY', {
        orderId: input.orderId,
        oldStatus: order.status,
        newStatus: updatedOrder.status,
        processedAt: updatedOrder.processedAt?.toISOString(),
      });

      // 🎯 TASK 2.3: Автоматическое освобождение кошелька при финальном статусе
      const isFinal = isFinalStatus(updatedOrder);
      logger.debug('CHECKING_FINAL_STATUS', {
        orderId: input.orderId,
        status: updatedOrder.status,
        isFinalStatus: isFinal,
        depositAddress: updatedOrder.depositAddress,
      });

      if (isFinal) {
        try {
          logger.debug('ATTEMPTING_WALLET_RELEASE', {
            orderId: input.orderId,
            walletAddress: updatedOrder.depositAddress,
          });
          const walletManager = await WalletPoolManagerFactory.create();
          await walletManager.releaseWallet(updatedOrder.depositAddress);
          logger.info('Wallet released successfully for order', {
            walletAddress: updatedOrder.depositAddress,
            orderId: input.orderId,
          });
        } catch (walletError) {
          logger.error('Wallet release failed for order', {
            orderId: input.orderId,
            walletAddress: updatedOrder.depositAddress,
            error: walletError instanceof Error ? walletError.message : String(walletError),
          });
          // Не прерываем выполнение, так как статус уже обновлен
        }
      }

      logger.info('Order status updated by operator', {
        orderId: input.orderId,
        newStatus: input.status,
        operatorId: ctx.user.id,
        operatorEmail: ctx.user.email,
        operatorNote: input.operatorNote || null,
      });

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
