import { HTTP_STATUS, TELEGRAM_API } from '@repo/constants';
import { createEnvironmentLogger, gracefulHandler } from '@repo/utils';

import type { NextApiRequest, NextApiResponse } from 'next';

import { handleTelegramUpdate } from '../../src/lib/telegram-bot';

import type { TelegramUpdate } from '../../src/lib/types';

const logger = createEnvironmentLogger('telegram-webhook');

/**
 * Отправка сообщения пользователю через Telegram API
 */
async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  try {
    const response = await fetch(
      `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.SEND_MESSAGE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    logger.debug('Telegram message sent', { chatId, textLength: text.length });
  } catch (error) {
    logger.error('Failed to send Telegram message', { chatId, error: String(error) });
  }
}

/**
 * Обработка callback query и обновление сообщения
 */
async function handleCallbackQueryResponse(
  callbackQuery: NonNullable<TelegramUpdate['callback_query']>,
  responseMessage: string | null
): Promise<void> {
  try {
    // Ответить на callback query
    await fetch(
      `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: responseMessage || 'Готово!',
          show_alert: false,
        }),
      }
    );

    // Если это взятие заявки в работу - обновить исходное сообщение
    if (callbackQuery.data?.startsWith('take_order_') && callbackQuery.message) {
      const orderId = callbackQuery.data.replace('take_order_', '');
      const originalText = callbackQuery.message.text || '';
      const updatedText = `${originalText}\n\n✅ **Заявка взята в работу оператором ${callbackQuery.from.first_name || callbackQuery.from.id}**`;

      await fetch(
        `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.EDIT_MESSAGE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            text: updatedText,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [] }, // Убрать кнопки
          }),
        }
      );

      logger.info('Order message updated', { orderId, chatId: callbackQuery.message.chat.id });
    }
  } catch (error) {
    logger.error('Failed to handle callback query', {
      callbackQueryId: callbackQuery.id,
      error: String(error),
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({ error: 'Method not allowed' });
    return;
  }

  const result = await gracefulHandler(
    async () => {
      // Базовая валидация webhook payload
      if (!req.body || typeof req.body !== 'object') {
        logger.warn('Invalid webhook payload received', { body: req.body });
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid payload' });
        return;
      }

      const update = req.body as TelegramUpdate;

      // Обработка update через telegram-bot логику
      const responseMessage = await handleTelegramUpdate(update);

      logger.info('Webhook processed successfully', {
        updateId: update.update_id,
        hasMessage: !!update.message,
        hasCallbackQuery: !!update.callback_query,
        responseGenerated: !!responseMessage,
      });

      // Отправка ответа через Telegram API
      if (responseMessage && update.message?.from?.id) {
        await sendTelegramMessage(update.message.from.id, responseMessage);
      }

      // Обработка callback queries
      if (update.callback_query) {
        await handleCallbackQueryResponse(update.callback_query, responseMessage);
      }

      res.status(HTTP_STATUS.OK).json({
        status: 'ok',
        processed: true,
        responseGenerated: !!responseMessage,
      });
    },
    { fallback: null }
  );

  if (result === null) {
    logger.error('Webhook processing failed');
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error',
    });
  }
}
