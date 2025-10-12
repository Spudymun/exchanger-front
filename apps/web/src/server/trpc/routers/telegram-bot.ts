import type { Order } from '@repo/exchange-core';
import { createEnvironmentLogger, isUUID } from '@repo/utils';
import { z } from 'zod';

import { getConfiguredPrismaClient } from '../../utils/get-prisma';
import { createTRPCRouter } from '../init';
import { systemApiMiddleware } from '../middleware/auth';

// Create logger for telegram bot operations
const logger = createEnvironmentLogger('telegram-bot-router');

// Типы ошибок для Telegram bot операций
export type OrderErrorCode =
  | 'ORDER_NOT_FOUND'
  | 'ORDER_ALREADY_ASSIGNED'
  | 'INVALID_STATUS'
  | 'OPERATOR_NOT_FOUND'
  | 'SYSTEM_ERROR';

export interface TakeOrderResult {
  success: boolean;
  order?: Order;
  error?: {
    code: OrderErrorCode;
    message: string;
    details?: {
      assignedOperatorEmail?: string;
      currentStatus?: string;
    };
  };
}

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
    .mutation(async ({ input }): Promise<TakeOrderResult> => {
      logger.info('TELEGRAM_TAKE_ORDER_REQUEST', {
        orderId: input.orderId,
        telegramOperatorId: input.telegramOperatorId,
      });

      try {
        // Валидация telegram оператора
        const operator = await validateTelegramOperator(input.telegramOperatorId);

        // Импорт order manager
        logger.debug('IMPORTING_ORDER_MANAGER', { source: '@repo/exchange-core' });
        const { orderManager } = await import('@repo/exchange-core');

        // Найти заявку (поддержка UUID и publicId)
        logger.debug('LOOKING_UP_ORDER_FOR_TELEGRAM', { orderId: input.orderId });
        const order = isUUID(input.orderId)
          ? await orderManager.findById(input.orderId)
          : await orderManager.findByPublicId(input.orderId);

        if (!order) {
          logger.warn('ORDER_NOT_FOUND_FOR_TELEGRAM', { orderId: input.orderId });
          return {
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: `Заявка #${input.orderId} не найдена`,
            },
          };
        }

        // Проверка статуса заявки
        if (!['pending', 'paid'].includes(order.status)) {
          logger.warn('INVALID_ORDER_STATUS_FOR_ASSIGNMENT', {
            orderId: input.orderId,
            currentStatus: order.status,
          });
          return {
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: `Заявка находится в статусе ${order.status}`,
              details: {
                currentStatus: order.status,
              },
            },
          };
        }

        // Проверка не назначена ли уже заявка
        if (order.assignedOperatorId) {
          const prisma = getConfiguredPrismaClient();
          const assignedOperator = await prisma.user.findUnique({
            where: { id: order.assignedOperatorId },
            select: { email: true },
          });

          logger.warn('ORDER_ALREADY_ASSIGNED_TELEGRAM', {
            orderId: input.orderId,
            assignedTo: assignedOperator?.email,
          });

          return {
            success: false,
            error: {
              code: 'ORDER_ALREADY_ASSIGNED',
              message: 'Заявка уже взята другим оператором',
              details: {
                assignedOperatorEmail: assignedOperator?.email,
              },
            },
          };
        }

        // Попытка назначения заявки (используем UUID из найденного order)
        logger.debug('ASSIGNING_ORDER_TO_TELEGRAM_OPERATOR', {
          orderId: input.orderId,
          internalOrderId: order.id,
          operatorId: operator.id,
          telegramOperatorId: input.telegramOperatorId,
        });

        const updatedOrder = await orderManager.assignToOperator(order.id, operator.id);

        if (!updatedOrder) {
          // Concurrent conflict - другой оператор успел взять заявку
          logger.warn('CONCURRENT_ASSIGNMENT_CONFLICT', {
            orderId: input.orderId,
            internalOrderId: order.id,
            telegramOperatorId: input.telegramOperatorId,
          });

          return {
            success: false,
            error: {
              code: 'ORDER_ALREADY_ASSIGNED',
              message: 'Заявка была взята другим оператором в этот же момент',
            },
          };
        }

        logger.info('ORDER_ASSIGNED_VIA_TELEGRAM', {
          orderId: input.orderId,
          telegramOperatorId: input.telegramOperatorId,
          operatorId: operator.id,
          newStatus: updatedOrder.status,
          assignedAt: updatedOrder.assignedAt?.toISOString(),
        });

        return {
          success: true,
          order: updatedOrder,
        };
      } catch (error) {
        logger.error('TELEGRAM_TAKE_ORDER_ERROR', {
          orderId: input.orderId,
          telegramOperatorId: input.telegramOperatorId,
          error: error instanceof Error ? error.message : String(error),
        });

        // Проверка на ошибку "оператор не найден"
        if (error instanceof Error && error.message.includes('Telegram operator not found')) {
          return {
            success: false,
            error: {
              code: 'OPERATOR_NOT_FOUND',
              message: 'Ваш Telegram ID не найден в системе. Обратитесь к администратору.',
            },
          };
        }

        return {
          success: false,
          error: {
            code: 'SYSTEM_ERROR',
            message: error instanceof Error ? error.message : 'Неизвестная системная ошибка',
          },
        };
      }
    }),

  // Обновить статус через telegram bot
  updateOrderStatusByTelegram: systemApiMiddleware
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
        telegramOperatorId: z.string(),
        operatorNote: z.string().optional(),
        cancellationReason: z.string().optional(), // Причина отмены для cancelled статуса
      })
    )
    .mutation(async ({ input }): Promise<TakeOrderResult> => {
      logger.info('TELEGRAM_UPDATE_ORDER_STATUS_REQUEST', {
        orderId: input.orderId,
        newStatus: input.status,
        telegramOperatorId: input.telegramOperatorId,
        operatorNote: input.operatorNote,
      });

      try {
        // Валидация оператора
        const operator = await validateTelegramOperator(input.telegramOperatorId);

        // Получение и проверка заявки (поддержка UUID и publicId)
        const { orderManager } = await import('@repo/exchange-core');
        const order = isUUID(input.orderId)
          ? await orderManager.findById(input.orderId)
          : await orderManager.findByPublicId(input.orderId);

        if (!order) {
          return {
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: `Заявка #${input.orderId} не найдена`,
            },
          };
        }

        // Проверка прав - может ли оператор изменять эту заявку
        if (order.assignedOperatorId && order.assignedOperatorId !== operator.id) {
          logger.warn('OPERATOR_NOT_ASSIGNED_TO_ORDER', {
            orderId: input.orderId,
            assignedTo: order.assignedOperatorId,
            attemptBy: operator.id,
          });

          return {
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: 'Вы не можете изменить статус заявки, которая назначена другому оператору',
            },
          };
        }

        // Обновление статуса (используем UUID из найденного order)
        const updatedOrder = await orderManager.updateStatus(order.id, input.status);

        if (!updatedOrder) {
          return {
            success: false,
            error: {
              code: 'SYSTEM_ERROR',
              message: 'Не удалось обновить статус заявки',
            },
          };
        }

        // Создание audit log с причиной отмены (если статус = cancelled)
        if (input.status === 'cancelled' && input.cancellationReason) {
          const prisma = getConfiguredPrismaClient();
          await prisma.orderAuditLog.create({
            data: {
              orderId: input.orderId,
              action: 'operator_cancellation',
              oldValue: order.status,
              newValue: input.status,
              performedBy: operator.id,
              metadata: {
                cancellationReason: input.cancellationReason,
                operatorNote: input.operatorNote,
                source: 'telegram_bot',
                telegramOperatorId: input.telegramOperatorId,
              },
            },
          });

          logger.info('CANCELLATION_AUDIT_LOG_CREATED', {
            orderId: input.orderId,
            cancellationReason: input.cancellationReason,
            operatorId: operator.id,
          });
        }

        logger.info('ORDER_STATUS_UPDATED_VIA_TELEGRAM', {
          orderId: input.orderId,
          newStatus: updatedOrder.status,
          telegramOperatorId: input.telegramOperatorId,
          success: true,
        });

        return {
          success: true,
          order: updatedOrder,
        };
      } catch (error) {
        logger.error('TELEGRAM_UPDATE_STATUS_ERROR', {
          orderId: input.orderId,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error: {
            code: 'SYSTEM_ERROR',
            message: error instanceof Error ? error.message : 'Системная ошибка',
          },
        };
      }
    }),
});
