import { createEnvironmentLogger } from '@repo/utils';
import { z } from 'zod';

import { createTRPCRouter } from '../init';
import { systemApiMiddleware } from '../middleware/auth';

// Create logger for telegram bot operations
const logger = createEnvironmentLogger('telegram-bot-router');

/**
 * Специальные procedures для telegram bot
 * Используют systemApiMiddleware вместо operatorOnly
 */
export const telegramBotRouter = createTRPCRouter({
  // Взять заявку через telegram bot от имени оператора
  takeOrderByTelegram: systemApiMiddleware
    .input(
      z.object({
        orderId: z.string(),
        telegramOperatorId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      logger.info('TELEGRAM_TAKE_ORDER_REQUEST', {
        orderId: input.orderId,
        telegramOperatorId: input.telegramOperatorId,
      });

      // ✅ ПРАВИЛЬНО: Динамическая валидация через user_app_roles
      // NOTE: Временная заглушка для telegram контекста до расширения архитектуры
      logger.debug('IMPORTING_ORDER_MANAGER', { source: '@repo/exchange-core' });
      const { orderManager } = await import('@repo/exchange-core');

      // NOTE: После расширения ApplicationContext добавить валидацию:
      // const { getPrismaClient } = await import('@repo/session-management');
      // const prisma = getPrismaClient();
      // const operator = await prisma.users.findFirst({
      //   where: {
      //     telegramId: input.telegramOperatorId,
      //     appRoles: {
      //       some: {
      //         applicationContext: 'TELEGRAM',
      //         role: 'OPERATOR',
      //       },
      //     },
      //   },
      // });
      // if (!operator) {
      //   throw new Error('Unauthorized telegram operator');
      // }

      // Найти заявку и назначить на системного оператора
      logger.debug('LOOKING_UP_ORDER_FOR_TELEGRAM', { orderId: input.orderId });
      const order = await orderManager.findById(input.orderId);
      
      if (!order) {
        logger.warn('ORDER_NOT_FOUND_FOR_TELEGRAM', { orderId: input.orderId });
        throw new Error('Order not found');
      }

      logger.debug('ORDER_FOUND_FOR_TELEGRAM', {
        orderId: input.orderId,
        currentStatus: order.status,
        assignedOperator: order.assignedOperatorId,
      });

      // Использовать существующую логику но от имени системы
      const systemOperatorId = `telegram-${input.telegramOperatorId}`;
      logger.debug('ASSIGNING_ORDER_TO_TELEGRAM_OPERATOR', {
        orderId: input.orderId,
        systemOperatorId,
      });

      const updatedOrder = await orderManager.assignToOperator(input.orderId, systemOperatorId);

      logger.info('ORDER_ASSIGNED_VIA_TELEGRAM', {
        orderId: input.orderId,
        telegramOperatorId: input.telegramOperatorId,
        systemOperatorId,
        newStatus: updatedOrder?.status,
        assignedAt: updatedOrder?.assignedAt?.toISOString(),
      });

      return { success: true, order: updatedOrder };
    }),

  // Обновить статус через telegram bot
  updateOrderStatusByTelegram: systemApiMiddleware
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
        telegramOperatorId: z.string(),
        operatorNote: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      logger.info('TELEGRAM_UPDATE_ORDER_STATUS_REQUEST', {
        orderId: input.orderId,
        newStatus: input.status,
        telegramOperatorId: input.telegramOperatorId,
        operatorNote: input.operatorNote,
      });

      // ✅ ПРАВИЛЬНО: Аналогичная динамическая проверка через user_app_roles
      // NOTE: Временная заглушка для telegram контекста до расширения архитектуры
      logger.debug('IMPORTING_ORDER_MANAGER_FOR_STATUS_UPDATE', { source: '@repo/exchange-core' });
      const { orderManager } = await import('@repo/exchange-core');

      // NOTE: После расширения ApplicationContext добавить валидацию:
      // const { getPrismaClient } = await import('@repo/session-management');
      // const prisma = getPrismaClient();
      // const operator = await prisma.users.findFirst({
      //   where: {
      //     telegramId: input.telegramOperatorId,
      //     appRoles: {
      //       some: {
      //         applicationContext: 'TELEGRAM',
      //         role: 'OPERATOR',
      //       },
      //     },
      //   },
      // });
      // if (!operator) {
      //   throw new Error('Unauthorized telegram operator');
      // }

      logger.debug('UPDATING_ORDER_STATUS_VIA_TELEGRAM', {
        orderId: input.orderId,
        requestedStatus: input.status,
      });

      const updatedOrder = await orderManager.updateStatus(input.orderId, input.status);

      logger.info('ORDER_STATUS_UPDATED_VIA_TELEGRAM', {
        orderId: input.orderId,
        newStatus: updatedOrder?.status,
        telegramOperatorId: input.telegramOperatorId,
        success: !!updatedOrder,
      });

      return { success: true, order: updatedOrder };
    }),
});
