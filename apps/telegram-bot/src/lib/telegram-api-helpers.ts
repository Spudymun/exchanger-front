/**
 * Telegram API Helpers
 * Вспомогательные функции для работы с Telegram Bot API
 * 
 * @module telegram-api-helpers
 */

import { TELEGRAM_API } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

const logger = createEnvironmentLogger('telegram-api-helpers');

/**
 * Интерфейс InlineKeyboard для Telegram
 */
export interface InlineKeyboard {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
}

/**
 * Параметры для редактирования Telegram сообщения
 */
interface EditMessageParams {
  chatId: string;
  messageId: bigint;
  topicId?: number;
  text: string;
  keyboard: InlineKeyboard;
}

/**
 * Редактирование одного Telegram сообщения через Bot API
 * 
 * @param params - Параметры редактирования сообщения
 * @returns true если успешно, false в случае ошибки
 */
export async function editTelegramMessage(params: EditMessageParams): Promise<boolean> {
  const { chatId, messageId, topicId, text, keyboard } = params;

  try {
    const telegramApiUrl = process.env.TELEGRAM_API_URL || TELEGRAM_API.BASE_URL;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      logger.error('TELEGRAM_BOT_TOKEN not configured');
      return false;
    }

    const urlParams = new URLSearchParams({
      chat_id: chatId,
      message_id: String(messageId),
      text,
      parse_mode: 'HTML',
      reply_markup: JSON.stringify(keyboard),
    });

    if (topicId) {
      urlParams.append('message_thread_id', String(topicId));
    }

    const url = `${telegramApiUrl}/bot${botToken}/editMessageText?${urlParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.warn('Telegram API returned error', {
        chatId,
        messageId: String(messageId),
        error: errorData,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error calling Telegram API', {
      chatId,
      messageId: String(messageId),
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
