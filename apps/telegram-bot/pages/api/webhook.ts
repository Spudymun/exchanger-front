import { HTTP_STATUS, TELEGRAM_API, TELEGRAM_OPERATOR_MESSAGES } from '@repo/constants';
import { createEnvironmentLogger, gracefulHandler } from '@repo/utils';

import type { NextApiRequest, NextApiResponse } from 'next';

import { handleTelegramUpdate, completeOrderViaCallback } from '../../src/lib/telegram-bot';
import { updateAllOrderMessages } from '../../src/lib/telegram-message-tracker';

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
    // Определяем тип сообщения: ошибка начинается с ❌
    const isError = responseMessage?.startsWith('❌') || responseMessage?.includes('Ошибка');
    
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
          show_alert: isError, // ✅ Для ошибок - модальное окно, требует нажатия OK
        }),
      }
    );

    // Если это взятие заявки в работу - обновить ВСЕ сообщения для этой заявки
    if (callbackQuery.data?.startsWith('take_order_') && callbackQuery.message) {
      const orderId = callbackQuery.data.replace('take_order_', '');
      const originalText = callbackQuery.message.text || '';
      const updatedText = `${originalText}\n\n✅ **Заявка взята в работу оператором ${callbackQuery.from.first_name || callbackQuery.from.id}**`;

      // Кнопка "Завершить заявку" (первое нажатие просит подтверждение)
      const completeKeyboard = {
        inline_keyboard: [
          [
            {
              text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_COMPLETE,
              callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_COMPLETE_ORDER(orderId),
            },
          ],
        ],
      };

      // Обновляем ВСЕ сообщения этой заявки во всех темах (синхронизация)
      const updatedCount = await updateAllOrderMessages({
        orderId,
        newText: updatedText,
        newKeyboard: completeKeyboard, // Показываем кнопку "Завершить"
      });

      logger.info('All order messages updated after taking', {
        orderId,
        updatedCount,
        operatorId: callbackQuery.from.id,
      });
    }

    // Если это первое нажатие "Завершить" - показываем подтверждение с 2 кнопками
    if (callbackQuery.data?.startsWith('complete_order_') && callbackQuery.message) {
      const orderId = callbackQuery.data.replace('complete_order_', '');

      // 2 кнопки в ряд: "Отмена" + "Да, завершить" (паттерн из OrderActions.tsx)
      const confirmKeyboard = {
        inline_keyboard: [
          [
            {
              text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_CANCEL,
              callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_CANCEL_COMPLETE(orderId),
            },
            {
              text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_CONFIRM_YES,
              callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_CONFIRM_COMPLETE(orderId),
            },
          ],
        ],
      };

      await fetch(
        `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.EDIT_MESSAGE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            text: `${callbackQuery.message.text}\n\n⚠️ **Подтверждение:** Завершить заявку и перевести средства клиенту?`,
            parse_mode: 'Markdown',
            reply_markup: confirmKeyboard,
          }),
        }
      );

      logger.info('Complete order confirmation requested', { orderId });
      return; // Не продолжаем обработку
    }

    // Если нажата кнопка "Отмена" - возвращаем кнопку "Завершить"
    if (callbackQuery.data?.startsWith('cancel_complete_') && callbackQuery.message) {
      const orderId = callbackQuery.data.replace('cancel_complete_', '');

      // Возвращаем исходную кнопку "Завершить заявку"
      const completeKeyboard = {
        inline_keyboard: [
          [
            {
              text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_COMPLETE,
              callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_COMPLETE_ORDER(orderId),
            },
          ],
        ],
      };

      // Убираем текст подтверждения
      const originalText = callbackQuery.message.text?.replace(/\n\n⚠️ \*\*Подтверждение:.*$/, '') || callbackQuery.message.text;

      await fetch(
        `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.EDIT_MESSAGE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            text: originalText,
            parse_mode: 'Markdown',
            reply_markup: completeKeyboard,
          }),
        }
      );

      // Показываем уведомление об отмене
      await fetch(
        `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: 'Отменено',
            show_alert: false,
          }),
        }
      );

      logger.info('Complete order cancelled', { orderId });
      return;
    }

    // Если это подтверждение завершения - выполняем завершение через tRPC
    if (callbackQuery.data?.startsWith('confirm_complete_') && callbackQuery.message) {
      const orderId = callbackQuery.data.replace('confirm_complete_', '');
      const telegramOperatorId = String(callbackQuery.from.id);

      logger.info('Order completion confirmed, processing...', {
        orderId,
        operatorId: callbackQuery.from.id,
      });

      // Вызываем функцию для завершения заказа
      const result = await completeOrderViaCallback(orderId, telegramOperatorId);

      if (result.success) {
        // Успех - показываем уведомление
        await fetch(
          `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callbackQuery.id,
              text: '✅ Заявка успешно завершена!',
              show_alert: false,
            }),
          }
        );

        logger.info('Order completed successfully', { orderId });
      } else {
        // Ошибка - показываем модальное окно
        let errorMessage = '❌ Ошибка завершения заявки\n\n';

        if (result.error) {
          switch (result.error.code) {
            case 'ORDER_NOT_FOUND':
              errorMessage += `Заявка #${orderId} не найдена в системе.`;
              break;
            case 'INVALID_STATUS':
              errorMessage += result.error.message;
              break;
            case 'OPERATOR_NOT_FOUND':
              errorMessage += `Оператор не найден. Авторизуйтесь через /login`;
              break;
            default:
              errorMessage += result.error.message || 'Неизвестная ошибка';
          }
        } else {
          errorMessage += result.message;
        }

        await fetch(
          `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callbackQuery.id,
              text: errorMessage,
              show_alert: true,
            }),
          }
        );

        logger.warn('Order completion failed', {
          orderId,
          errorCode: result.error?.code,
        });
      }

      return; // Завершаем обработку
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
