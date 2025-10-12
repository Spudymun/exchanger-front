import type { Order } from '@repo/exchange-core';

import { createEnvironmentLogger } from './logger';

const logger = createEnvironmentLogger('order-notifications');

/**
 * Отправка уведомления операторам об отмене заявки
 *
 * @param order - Объект заказа для отправки уведомления
 * @param userEmail - Email пользователя, отменившего заказ
 * @param initiator - Инициатор отмены: 'user' | 'operator' | 'system'
 *
 * @architecture Централизованная функция для отправки уведомлений об отмене заказов
 * @see apps/telegram-bot/src/lib/webhook.ts - обработчик уведомлений
 */
export async function sendCancellationNotification(
  order: Order,
  userEmail: string,
  initiator: 'user' | 'operator' | 'system' = 'user'
): Promise<void> {
  const telegramBotUrl = process.env.TELEGRAM_BOT_URL;
  if (!telegramBotUrl) {
    logger.warn('TELEGRAM_BOT_URL_NOT_CONFIGURED', { orderId: order.id });
    return;
  }

  try {
    await fetch(`${telegramBotUrl}/api/notify-operators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: {
          id: order.publicId, // ✅ publicId для отображения в Telegram
          internalId: order.id, // ✅ UUID для связи с БД (updateAllOrderMessages)
          email: userEmail,
          cryptoAmount: order.cryptoAmount,
          currency: order.currency,
          uahAmount: order.uahAmount,
          status: 'cancelled',
        },
        // ⚠️ ВАЖНО: depositAddress ОБЯЗАТЕЛЕН в payload схеме
        depositAddress: order.depositAddress || 'N/A',
        walletType: 'fresh', // Неважно для отмены, но обязательно по схеме
        // 🆕 Флаг для определения типа уведомления
        notificationType: 'order_cancelled',
        // Дополнительная информация об инициаторе отмене
        metadata: {
          initiator,
          cancelledAt: new Date().toISOString(),
        },
      }),
    });

    logger.info('CANCELLATION_NOTIFICATION_SENT', {
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
