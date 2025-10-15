import { ORDER_STATUSES } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';
import { sendCancellationNotification } from '@repo/utils/order-notifications';

import { orderManager, userManager } from '../data/manager';
import type { Order } from '../types/order';

const logger = createEnvironmentLogger('OrderCancellationHandler');

/**
 * Обработчик отмены истекших заказов
 *
 * Выполняет атомарную проверку и отмену ТОЛЬКО заказов в статусе PENDING.
 * Идемпотентен - безопасно вызывать несколько раз.
 *
 * @see docs/implementation/ORDER_TIMEOUT_IMPLEMENTATION_PLAN.md
 */
export class OrderCancellationHandler {
  /**
   * Обработать истекший заказ
   *
   * @architecture Атомарная проверка статуса для избежания race conditions
   * @important Отменяет ТОЛЬКО заказы в статусе PENDING
   *
   * @param orderId - ID заказа для обработки
   */
  async handleExpiredOrder(orderId: string): Promise<void> {
    logger.info('PROCESSING_EXPIRED_ORDER', { orderId });

    try {
      // 1. Загрузить заказ из БД
      const order = await orderManager.findById(orderId);

      if (!order) {
        logger.warn('ORDER_NOT_FOUND_FOR_EXPIRATION', { orderId });
        return;
      }

      // 2. ✅ КРИТИЧЕСКАЯ ПРОВЕРКА: заказ все еще в статусе PENDING
      if (order.status !== ORDER_STATUSES.PENDING) {
        logger.info('ORDER_ALREADY_PROCESSED', {
          orderId,
          currentStatus: order.status,
          reason: 'order_no_longer_pending',
        });
        return; // ✅ НЕ ОТМЕНЯЕМ - статус уже изменился
      }

      // 3. Проверить что время действительно истекло (дополнительная проверка)
      if (order.expiresAt && order.expiresAt > new Date()) {
        logger.warn('ORDER_NOT_YET_EXPIRED', {
          orderId,
          expiresAt: order.expiresAt.toISOString(),
          now: new Date().toISOString(),
        });
        return; // ✅ НЕ ОТМЕНЯЕМ - еще не истекло
      }

      // 4. Атомарно обновить статус заказа на cancelled
      // ✅ ВАЖНО: Используем Prisma updateMany с WHERE для атомарности
      const { getPrismaClient } = await import('@repo/session-management');
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        logger.error('DATABASE_URL_NOT_CONFIGURED', { orderId });
        return;
      }

      const prisma = getPrismaClient({ url: databaseUrl });

      const updateResult = await prisma.order.updateMany({
        where: {
          id: orderId,
          status: 'PENDING', // ✅ Prisma UPPERCASE enum
        },
        data: {
          status: 'CANCELLED', // ✅ Prisma UPPERCASE enum
          processedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // ✅ Проверка: если count=0, значит другой процесс уже обработал
      const NO_ROWS_UPDATED = 0;
      if (updateResult.count === NO_ROWS_UPDATED) {
        logger.info('ORDER_ALREADY_PROCESSED_BY_ANOTHER_PROCESS', {
          orderId,
          reason: 'status_not_pending_during_update',
        });
        return; // ✅ НЕ ОТПРАВЛЯЕМ уведомление - дубликат отмены
      }

      // 5. Загружаем обновленный заказ для отправки уведомления
      const updatedOrder = await orderManager.findById(orderId);

      if (!updatedOrder) {
        logger.error('UPDATED_ORDER_NOT_FOUND', { orderId });
        return;
      }

      logger.info('ORDER_CANCELLED_BY_EXPIRATION', {
        orderId,
        previousStatus: order.status,
        newStatus: updatedOrder.status,
      });

      // 5. Компенсационные действия: освободить кошелек
      await this.releaseOrderWallet(order);

      // 6. 🆕 Отправить уведомление операторам об автоматической отмене
      await this.notifyOperatorsAboutCancellation(updatedOrder);

      // 7. Опционально: отправить уведомление пользователю
      await this.notifyUserAboutExpiration(order);
    } catch (error) {
      logger.error('ERROR_HANDLING_EXPIRED_ORDER', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Не бросаем ошибку дальше - логируем и продолжаем
    }
  }

  /**
   * Освободить кошелек, выделенный для заказа
   */
  private async releaseOrderWallet(order: Order): Promise<void> {
    // Проверяем что у заказа есть depositAddress (адрес кошелька)
    if (!order.depositAddress) {
      logger.debug('ORDER_HAS_NO_DEPOSIT_ADDRESS', { orderId: order.id });
      return;
    }

    try {
      const { WalletPoolManagerFactory } = await import('./wallet-pool-manager-factory');
      const walletManager = await WalletPoolManagerFactory.create();

      // Освобождаем кошелек обратно в пул используя depositAddress
      await walletManager.releaseWallet(order.depositAddress);

      logger.info('WALLET_RELEASED_AFTER_ORDER_EXPIRATION', {
        orderId: order.id,
        depositAddress: order.depositAddress,
      });
    } catch (error) {
      logger.error('FAILED_TO_RELEASE_WALLET', {
        orderId: order.id,
        depositAddress: order.depositAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      // Не бросаем ошибку - это не должно блокировать отмену заказа
    }
  }

  /**
   * Уведомить операторов об автоматической отмене заказа
   *
   * @architecture Использует централизованную функцию из @repo/utils
   */
  private async notifyOperatorsAboutCancellation(order: Order): Promise<void> {
    try {
      // Получить email пользователя из БД
      const user = await userManager.findById(order.userId);
      if (!user) {
        logger.warn('USER_NOT_FOUND_FOR_NOTIFICATION', {
          orderId: order.id,
          userId: order.userId,
        });
        return;
      }

      // Отправить уведомление с инициатором 'system'
      await sendCancellationNotification(order, user.email, 'system');

      logger.info('OPERATOR_NOTIFICATION_SENT_FOR_AUTO_CANCELLATION', {
        orderId: order.id,
        userEmail: user.email,
      });
    } catch (error) {
      logger.error('FAILED_TO_NOTIFY_OPERATORS_ABOUT_CANCELLATION', {
        orderId: order.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Не бросаем ошибку - уведомление не должно блокировать отмену
    }
  }

  /**
   * Уведомить пользователя об истечении заказа
   *
   * @note Интеграция с email-service запланирована
   */
  private async notifyUserAboutExpiration(order: Order): Promise<void> {
    logger.info('ORDER_EXPIRATION_NOTIFICATION_SKIPPED', {
      orderId: order.id,
      userId: order.userId,
      reason: 'email_notification_not_implemented',
    });

    // Будущая интеграция:
    // const { emailNotifier } = await import('./queue-email-notifier');
    // await emailNotifier.notifyOrderExpired(order);
  }
}
