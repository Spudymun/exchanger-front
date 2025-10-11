import { ORDER_STATUSES } from '@repo/constants';
import { orderManager } from '@repo/exchange-core';
import { OrderCancellationHandler } from '@repo/exchange-core/server';
import { createEnvironmentLogger } from '@repo/utils';

const logger = createEnvironmentLogger('OrderCleanupCron');

const MINUTES_IN_INTERVAL = 5;
const MS_IN_MINUTE = 60 * 1000;
const CLEANUP_INTERVAL_MS = MINUTES_IN_INTERVAL * MS_IN_MINUTE;

/**
 * Fallback механизм для отмены истекших заказов
 * Работает независимо от Redis notifications
 * 
 * @purpose Дополнительная надежность при сбое Redis
 * @interval 5 минут
 */
export class OrderCleanupCron {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private cancellationHandler: OrderCancellationHandler;

  constructor() {
    // ✅ Создаем handler в constructor - webpack externals гарантирует что модуль не будет bundled
    this.cancellationHandler = new OrderCancellationHandler();
  }

  /**
   * Запустить периодическую проверку истекших PENDING заказов
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('OrderCleanupCron already running');
      return;
    }

    this.isRunning = true;

    this.intervalId = setInterval(() => {
      void this.cleanupExpiredOrders();
    }, CLEANUP_INTERVAL_MS);

    logger.info('OrderCleanupCron started', {
      intervalMs: CLEANUP_INTERVAL_MS,
      intervalMinutes: CLEANUP_INTERVAL_MS / (60 * 1000),
    });

    // Выполнить первую проверку сразу
    void this.cleanupExpiredOrders();
  }

  /**
   * Остановить проверку (graceful shutdown)
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    logger.info('OrderCleanupCron stopped');
  }

  /**
   * Найти и обработать истекшие PENDING заказы
   */
  private async cleanupExpiredOrders(): Promise<void> {
    try {
      // Найти все PENDING заказы
      const pendingOrders = await orderManager.findByStatus(ORDER_STATUSES.PENDING);
      const now = new Date();

      // Фильтровать только истекшие PENDING заказы
      const expiredOrders = pendingOrders.filter(
        (order) => order.expiresAt && order.expiresAt <= now
      );

      if (expiredOrders.length === 0) {
        logger.debug('No expired PENDING orders found');
        return;
      }

      logger.info('EXPIRED_PENDING_ORDERS_FOUND', {
        count: expiredOrders.length,
        orderIds: expiredOrders.map((o) => o.id).join(', '),
      });

      // Обработать каждый истекший заказ
      for (const order of expiredOrders) {
        await this.cancellationHandler.handleExpiredOrder(order.id);
      }

      logger.info('CLEANUP_CYCLE_COMPLETED', {
        processedCount: expiredOrders.length,
      });
    } catch (error) {
      logger.error('ERROR_IN_CLEANUP_CRON', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Не бросаем ошибку - следующий цикл попробует снова
    }
  }
}
