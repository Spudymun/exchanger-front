import type { Order } from '@repo/exchange-core';

import { createEnvironmentLogger } from './logger';
import { getTelegramQueue } from './telegram-queue';

const logger = createEnvironmentLogger('order-notifications');

/**
 * Форматирует номер карты с пробелами каждые 4 цифры для удобного чтения и копирования
 * 
 * @param cardNumber - Номер карты (может содержать пробелы, дефисы и др.)
 * @returns Отформатированный номер карты с пробелами каждые 4 цифры
 * 
 * @example
 * formatCardNumber("1234567812345678") // "1234 5678 1234 5678"
 * formatCardNumber("4270-1234-5678-9012") // "4270 1234 5678 9012"
 * formatCardNumber("4270 1234 5678 9012") // "4270 1234 5678 9012"
 */
function formatCardNumber(cardNumber: string): string {
  // Убираем все нецифровые символы
  const digitsOnly = cardNumber.replace(/\D/g, '');
  
  // Форматируем с пробелами каждые 4 цифры
  return digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Оборачивает текст в inline code для Telegram Markdown
 * Это делает текст кликабельным для копирования в Telegram
 * 
 * @param text - Текст для оборачивания
 * @returns Текст обернутый в обратные кавычки
 */
function makeClickableCopy(text: string): string {
  return `\`${text}\``;
}


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

    // ✅ НОВОЕ: Форматируем номер карты с пробелами и делаем кликабельным для копирования
    const cardNumberFormatted = order.recipientData?.cardNumber 
      ? makeClickableCopy(formatCardNumber(order.recipientData.cardNumber))
      : undefined;

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
          bankName: order.bankName, // ✅ НОВОЕ
          cardNumberMasked: cardNumberFormatted, // ✅ ОБНОВЛЕНО: полный номер с форматированием
          fixedExchangeRate: order.fixedExchangeRate ? String(order.fixedExchangeRate) : undefined, // ✅ НОВОЕ
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

