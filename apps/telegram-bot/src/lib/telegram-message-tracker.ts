/**
 * Telegram Message Tracker
 * Утилита для трекинга и обновления Telegram сообщений о заявках
 * 
 * @module telegram-message-tracker
 */

import type { PrismaClient } from '@prisma/client';
import type { TelegramNotificationType } from '@repo/constants';
import { TELEGRAM_API } from '@repo/constants';
import { getPrismaClient, type PrismaClientConfig } from '@repo/session-management';
import { createEnvironmentLogger } from '@repo/utils';

const logger = createEnvironmentLogger('telegram-message-tracker');

/**
 * Получение настроенного Prisma Client для telegram-bot
 */
function getTelegramBotPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is required. ' + 'Please set it in .env file.'
    );
  }

  const config: PrismaClientConfig = {
    url: databaseUrl,
    maxConnections: 3, // Telegram bot использует меньше соединений
    connectionTimeout: 10000,
    appName: 'telegram-bot',
  };

  return getPrismaClient(config);
}

/**
 * Параметры для сохранения информации о Telegram сообщении
 */
interface SaveMessageInfoParams {
  orderId: string;
  chatId: string;
  messageId: number;
  notificationType: TelegramNotificationType;
  topicId?: number;
}

/**
 * Сохранение информации о Telegram сообщении в БД
 * 
 * @param params - Параметры сохранения сообщения
 */
export async function saveTelegramMessageInfo(
  params: SaveMessageInfoParams
): Promise<void> {
  const { orderId, chatId, messageId, notificationType, topicId } = params;
  
  try {
    const prisma = getTelegramBotPrismaClient();

    await prisma.telegramOrderMessage.upsert({
      where: {
        telegram_order_message_unique: {
          orderId,
          notificationType,
        },
      },
      update: {
        chatId,
        messageId: BigInt(messageId),
        topicId,
        updatedAt: new Date(),
      },
      create: {
        orderId,
        chatId,
        messageId: BigInt(messageId),
        topicId,
        notificationType,
      },
    });

    logger.info('Telegram message info saved', {
      orderId,
      chatId,
      messageId,
      notificationType,
      topicId,
    });
  } catch (error) {
    logger.error('Failed to save telegram message info', {
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Получение информации о Telegram сообщении для обновления
 * 
 * @param orderId - ID заявки
 * @param notificationType - Тип уведомления
 * @returns Информация о сообщении или null если не найдено
 */
export async function getTelegramMessageInfo(
  orderId: string,
  notificationType: TelegramNotificationType
): Promise<{ chatId: string; messageId: number; topicId?: number } | null> {
  try {
    const prisma = getTelegramBotPrismaClient();

    const messageInfo = await prisma.telegramOrderMessage.findUnique({
      where: {
        telegram_order_message_unique: {
          orderId,
          notificationType,
        },
      },
    });

    if (!messageInfo) {
      logger.debug('No telegram message info found', { orderId, notificationType });
      return null;
    }

    return {
      chatId: messageInfo.chatId,
      messageId: Number(messageInfo.messageId),
      topicId: messageInfo.topicId ?? undefined,
    };
  } catch (error) {
    logger.error('Failed to get telegram message info', {
      orderId,
      notificationType,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Удаление информации о Telegram сообщении (cleanup)
 * 
 * @param orderId - ID заявки
 * @param notificationType - Тип уведомления (опционально, если не указан - удаляются все)
 */
export async function deleteTelegramMessageInfo(
  orderId: string,
  notificationType?: TelegramNotificationType
): Promise<void> {
  try {
    const prisma = getTelegramBotPrismaClient();

    const deleteOperation = notificationType
      ? prisma.telegramOrderMessage.delete({
          where: {
            telegram_order_message_unique: {
              orderId,
              notificationType,
            },
          },
        })
      : prisma.telegramOrderMessage.deleteMany({
          where: { orderId },
        });

    await deleteOperation;

    logger.info('Telegram message info deleted', { orderId, notificationType });
  } catch (error) {
    logger.error('Failed to delete telegram message info', {
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Параметры для обновления всех сообщений заказа
 */
interface UpdateAllOrderMessagesParams {
  orderId: string;
  newText?: string;
  newKeyboard?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
}

/**
 * Обновление ВСЕХ Telegram сообщений для конкретной заявки
 * Используется для синхронизации состояния кнопок и текста между разными темами
 * 
 * @param params - Параметры обновления
 * @returns Количество успешно обновлённых сообщений
 */
export async function updateAllOrderMessages(
  params: UpdateAllOrderMessagesParams
): Promise<number> {
  const { orderId, newText, newKeyboard } = params;
  
  try {
    const prisma = getTelegramBotPrismaClient();
    
    // Получаем ВСЕ сообщения для этой заявки
    const messages = await prisma.telegramOrderMessage.findMany({
      where: { orderId },
    });

    if (messages.length === 0) {
      logger.debug('No messages found for order', { orderId });
      return 0;
    }

    logger.info('Updating all order messages', {
      orderId,
      messageCount: messages.length,
      hasNewText: !!newText,
      hasNewKeyboard: !!newKeyboard,
    });

    let successCount = 0;

    // Обновляем каждое сообщение через Telegram API
    for (const message of messages) {
      try {
        const telegramApiUrl = process.env.TELEGRAM_API_URL || TELEGRAM_API.BASE_URL;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
          logger.error('TELEGRAM_BOT_TOKEN not configured');
          continue;
        }

        const params = new URLSearchParams({
          chat_id: message.chatId,
          message_id: String(message.messageId),
        });

        if (message.topicId) {
          params.append('message_thread_id', String(message.topicId));
        }

        if (newText) {
          params.append('text', newText);
          params.append('parse_mode', 'HTML');
        }

        if (newKeyboard) {
          params.append('reply_markup', JSON.stringify(newKeyboard));
        }

        const url = `${telegramApiUrl}/bot${botToken}/editMessageText?${params.toString()}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errorData = await response.json();
          logger.warn('Failed to edit message', {
            orderId,
            chatId: message.chatId,
            messageId: String(message.messageId),
            notificationType: message.notificationType,
            error: errorData,
          });
          continue;
        }

        successCount++;
        
        logger.debug('Message updated successfully', {
          orderId,
          chatId: message.chatId,
          messageId: String(message.messageId),
          notificationType: message.notificationType,
        });
        
      } catch (editError) {
        logger.error('Error editing individual message', {
          orderId,
          chatId: message.chatId,
          messageId: String(message.messageId),
          error: editError instanceof Error ? editError.message : String(editError),
        });
      }
    }

    logger.info('Order messages update completed', {
      orderId,
      totalMessages: messages.length,
      successCount,
      failedCount: messages.length - successCount,
    });

    return successCount;
    
  } catch (error) {
    logger.error('Failed to update all order messages', {
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}
