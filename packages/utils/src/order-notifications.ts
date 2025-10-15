import type { Order } from '@repo/exchange-core';

import { createEnvironmentLogger } from './logger';
import { getTelegramQueue } from './telegram-queue';

const logger = createEnvironmentLogger('order-notifications');

/**
 * Отправка уведомления операторам об отмене заявки
 *
 * @param order - Объект заказа для отправки уведомления
 * @param userEmail - Email пользователя, отменившего заказ
 * @param initiator - Инициатор отмены: 'user' | 'operator' | 'system'
 *
 * @architecture
 * - Использует BullMQ очередь для надежной доставки уведомлений
 * - Graceful degradation: fallback к прямой отправке при проблемах с Redis
 * - НЕ блокирует отмену заказа при сбоях уведомлений
 *
 * @see apps/telegram-bot/src/workers/telegram-notification-worker.ts - Worker обработчик
 * @see packages/utils/src/telegram-queue/telegram-queue-producer.ts - Producer
 */
export async function sendCancellationNotification(
  order: Order,
  userEmail: string,
  initiator: 'user' | 'operator' | 'system' = 'user'
): Promise<void> {
  try {
    const queue = await getTelegramQueue();

    await queue.enqueue({
      orderId: order.id,
      notificationType: 'order_cancelled',
      payload: {
        order: {
          id: order.publicId, // ✅ publicId для отображения в Telegram
          internalId: order.id, // ✅ UUID для связи с БД (updateAllOrderMessages)
          email: userEmail,
          cryptoAmount: String(order.cryptoAmount),
          currency: order.currency,
          uahAmount: String(order.uahAmount),
          status: 'cancelled',
        },
        depositAddress: order.depositAddress || 'N/A',
        walletType: 'fresh',
        notificationType: 'order_cancelled',
        metadata: {
          initiator,
          cancelledAt: new Date().toISOString(),
        },
      },
    });

    logger.info('CANCELLATION_NOTIFICATION_ENQUEUED', {
      orderId: order.id,
      initiator,
    });
  } catch (error) {
    logger.error('CANCELLATION_NOTIFICATION_FAILED', {
      orderId: order.id,
      initiator,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // НЕ прерываем выполнение - отмена заявки успешна даже без уведомления
  }
}
