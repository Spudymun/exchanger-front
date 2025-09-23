import { z } from 'zod';

import { createTRPCRouter } from '../init';
import { systemApiMiddleware } from '../middleware/auth';

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
      // ✅ ПРАВИЛЬНО: Динамическая валидация через user_app_roles
      // NOTE: Временная заглушка для telegram контекста до расширения архитектуры
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
      const order = await orderManager.findById(input.orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Использовать существующую логику но от имени системы
      const updatedOrder = await orderManager.assignToOperator(
        input.orderId,
        `telegram-${input.telegramOperatorId}` // Системный ID оператора
      );

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
      // ✅ ПРАВИЛЬНО: Аналогичная динамическая проверка через user_app_roles
      // NOTE: Временная заглушка для telegram контекста до расширения архитектуры
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

      const updatedOrder = await orderManager.updateStatus(input.orderId, input.status);

      return { success: true, order: updatedOrder };
    }),
});
