import { ORDER_STATUS_CONFIG, VALIDATION_LIMITS, ORDER_STATUSES } from '@repo/constants';
import { orderManager, validateOrderAccess } from '@repo/exchange-core';
import { WalletPoolManagerFactory, OrderExpirationService } from '@repo/exchange-core/server';
import {
  paginateOrders,
  filterOrders,
  sortOrders,
  getOrdersStatistics,
  createBadRequestError,
  createNotFoundError,
  createInternalServerError,
  filterOrdersForOperator,
  canTransitionStatus,
  isFinalStatus,
  securityEnhancedOperatorOrdersSchema,
  securityEnhancedUpdateOrderStatusSchema,
  orderIdSchema,
  SECURITY_VALIDATION_LIMITS,
  createEnvironmentLogger,
  /*
  // ⚠️ LEGACY IMPORTS - ЗАКОММЕНТИРОВАНЫ ДЛЯ BACKWARD COMPATIBILITY
  // 
  // ВАЖНО: В данном файле legacy error creators не использовались напрямую
  // Operator router использует только стандартные error creators
  // 
  // ПОТЕНЦИАЛЬНЫЕ LEGACY FUNCTIONS (если бы использовались):
  // - createOrderError('not_found') → createNotFoundError('Order not found')
  // - createOrderError('update_failed') → createInternalServerError('Order update failed')
  // - createOrderError('cannot_cancel') → createBadRequestError('Order cannot be cancelled')
  //
  // createOrderError,
  */
} from '@repo/utils';
import { z } from 'zod';

import { createTRPCRouter } from '../init';
import { operatorOnly } from '../middleware/auth';

// Create logger for operator operations
const logger = createEnvironmentLogger('operator-router');

// Singleton для OrderExpirationService (shared с exchange.ts)
let expirationService: OrderExpirationService | null = null;

async function getExpirationService(): Promise<OrderExpirationService> {
  if (!expirationService) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required');
    }
    expirationService = new OrderExpirationService(redisUrl);
    await expirationService.initialize();
  }
  return expirationService;
}

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
        throw createNotFoundError(`Order with ID "${input.orderId}" not found`);
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
        throw createNotFoundError(`Order with ID "${input.orderId}" not found`);
      }

      // 🔒 SECURITY: Если оператор меняет статус на CANCELLED, проверить владение заказом
      if (input.status === ORDER_STATUSES.CANCELLED) {
        logger.debug('VALIDATING_ORDER_OWNERSHIP_FOR_CANCELLATION', {
          orderId: input.orderId,
          operatorEmail: ctx.user.email,
        });

        await validateOrderAccess(input.orderId, ctx.user.email);
        logger.info('ORDER_OWNERSHIP_VALIDATED', {
          orderId: input.orderId,
          operatorEmail: ctx.user.email,
        });
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
        throw createInternalServerError('Order update failed');
      }

      // ✅ Отменить запланированную отмену если статус изменился с PENDING
      if (updatedOrder.status !== ORDER_STATUSES.PENDING) {
        try {
          const expService = await getExpirationService();
          await expService.cancelOrderExpiration(updatedOrder.id);
          logger.info('ORDER_EXPIRATION_TTL_CANCELLED_ON_STATUS_CHANGE', {
            orderId: updatedOrder.id,
            newStatus: updatedOrder.status,
            reason: 'status_changed_from_pending_by_operator',
          });
        } catch (error) {
          logger.warn('FAILED_TO_CANCEL_ORDER_EXPIRATION', {
            orderId: updatedOrder.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Не критично - Redis ключ истечет сам, handler проверит статус
        }
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
        throw createNotFoundError(`Order with ID "${orderId}" not found`);
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
