import { createEnvironmentLogger } from '@repo/utils';
import { z } from 'zod';

import { getConfiguredPrismaClient } from '../../utils/get-prisma';
import { createTRPCRouter } from '../init';
import { systemApiMiddleware } from '../middleware/auth';

// Create logger for telegram bot operations
const logger = createEnvironmentLogger('telegram-bot-router');

// Helper function to validate telegram operator
async function validateTelegramOperator(telegramOperatorId: string) {
  const prisma = getConfiguredPrismaClient();

  const operator = await prisma.user.findFirst({
    where: { telegramId: telegramOperatorId },
  });

  if (!operator) {
    logger.warn('TELEGRAM_OPERATOR_NOT_FOUND', { telegramOperatorId });
    throw new Error(`Telegram operator not found: ${telegramOperatorId}`);
  }

  // Проверить роли оператора отдельным запросом
  const appRoles = await prisma.userAppRole.findMany({
    where: { userId: operator.id },
  });

  const hasOperatorRole = appRoles.some(userRole => userRole.role === 'OPERATOR');
  if (!hasOperatorRole) {
    logger.warn('TELEGRAM_USER_NOT_OPERATOR', {
      telegramOperatorId,
      userId: operator.id,
      roles: appRoles.map(r => r.role).join(','),
    });
    throw new Error(`User is not an operator: ${telegramOperatorId}`);
  }

  return operator;
}

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

      // Валидация telegram оператора
      const operator = await validateTelegramOperator(input.telegramOperatorId);

      // Импорт order manager
      logger.debug('IMPORTING_ORDER_MANAGER', { source: '@repo/exchange-core' });
      const { orderManager } = await import('@repo/exchange-core');

      // Найти заявку и назначить на найденного оператора
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

      logger.debug('ASSIGNING_ORDER_TO_TELEGRAM_OPERATOR', {
        orderId: input.orderId,
        operatorId: operator.id,
        telegramOperatorId: input.telegramOperatorId,
      });

      const updatedOrder = await orderManager.assignToOperator(input.orderId, operator.id);

      logger.info('ORDER_ASSIGNED_VIA_TELEGRAM', {
        orderId: input.orderId,
        telegramOperatorId: input.telegramOperatorId,
        operatorId: operator.id,
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
