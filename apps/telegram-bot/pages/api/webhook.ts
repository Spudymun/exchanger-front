import { HTTP_STATUS, TELEGRAM_API, TELEGRAM_OPERATOR_MESSAGES, OPERATOR_CANCEL_REASONS } from '@repo/constants';
import { getPrismaClient } from '@repo/session-management';
import { createEnvironmentLogger, gracefulHandler } from '@repo/utils';

import type { NextApiRequest, NextApiResponse } from 'next';

import { editTelegramMessage, type InlineKeyboard } from '../../src/lib/telegram-api-helpers';
import { handleTelegramUpdate, completeOrderViaCallback, cancelOrderViaCallback } from '../../src/lib/telegram-bot';
import { updateAllOrderMessages } from '../../src/lib/telegram-message-tracker';

import type { TelegramUpdate } from '../../src/lib/types';

const logger = createEnvironmentLogger('telegram-webhook');

/**
 * Получить topicId из базы данных для сообщения заявки
 */
async function getTopicIdForOrder(orderId: string, messageId: number): Promise<number | undefined> {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      logger.warn('DATABASE_URL not configured, cannot retrieve topicId');
      return undefined;
    }

    const prisma = getPrismaClient({
      url: databaseUrl,
      maxConnections: 3,
      connectionTimeout: 10000,
      appName: 'telegram-webhook',
    });

    const message = await prisma.telegramOrderMessage.findFirst({
      where: {
        orderId,
        messageId: BigInt(messageId),
      },
      select: {
        topicId: true,
      },
    });

    return message?.topicId ?? undefined;
  } catch (error) {
    logger.error('Failed to get topicId from database', {
      orderId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

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
      const operatorName = callbackQuery.from.first_name || callbackQuery.from.id;

      const updatedText = `${originalText}\n\n✅ **Заявка взята в работу оператором ${operatorName}**`;

      // Кнопки для работы с заявкой (показываем всем в групповом чате, API проверит права)
      const orderKeyboard = {
        inline_keyboard: [
          [
            {
              text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_COMPLETE,
              callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_COMPLETE_ORDER(orderId),
            },
          ],
          [
            {
              text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_CANCEL_ORDER,
              callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_CANCEL_ORDER(orderId),
            },
          ],
        ],
      };

      // Обновляем ВСЕ сообщения этой заявки во всех темах (синхронизация)
      const updatedCount = await updateAllOrderMessages({
        orderId,
        newText: updatedText,
        newKeyboard: orderKeyboard,
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

    // Если нажата кнопка "Отмена" - возвращаем ОБЕ кнопки (Завершить + Отменить)
    if (callbackQuery.data?.startsWith('cancel_complete_') && callbackQuery.message) {
      const orderId = callbackQuery.data.replace('cancel_complete_', '');

      // Возвращаем ОБЕ кнопки для работы с заявкой
      const orderKeyboard: InlineKeyboard = {
        inline_keyboard: [
          [
            {
              text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_COMPLETE,
              callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_COMPLETE_ORDER(orderId),
            },
          ],
          [
            {
              text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_CANCEL_ORDER,
              callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_CANCEL_ORDER(orderId),
            },
          ],
        ],
      };

      // Убираем текст подтверждения
      const originalText = callbackQuery.message.text?.replace(/\n\n⚠️ \*\*Подтверждение:.*$/, '') || callbackQuery.message.text || '';

      // Получаем topicId из БД
      const topicId = await getTopicIdForOrder(orderId, callbackQuery.message.message_id);

      // Используем editTelegramMessage для обновления сообщения с поддержкой Topics
      const success = await editTelegramMessage({
        chatId: String(callbackQuery.message.chat.id),
        messageId: BigInt(callbackQuery.message.message_id),
        topicId,
        text: originalText,
        keyboard: orderKeyboard,
      });

      if (!success) {
        await fetch(
          `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callbackQuery.id,
              text: '❌ Не удалось обновить сообщение',
              show_alert: true,
            }),
          }
        );
        logger.error('Failed to cancel complete confirmation', { orderId, topicId });
        return;
      }

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

      logger.info('Complete order cancelled', { orderId, topicId });
      return;
    }

    // Если это нажатие "Отменить заявку" - показываем причины отмены
    if (callbackQuery.data?.startsWith('cancel_order_') && callbackQuery.message) {
      const orderId = callbackQuery.data.replace('cancel_order_', '');
      
      // Используем индексы (0-5) вместо строк для экономии байтов в callback_data
      const reasonButtons = Object.values(OPERATOR_CANCEL_REASONS).map((reason, index) => [{
        text: reason.label,
        callback_data: `scr_${orderId}_${index}`, // scr = select_cancel_reason, короткий формат
      }]);

      const backButton = [{
        text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_BACK,
        callback_data: `bto_${orderId}`, // bto = back_to_order, короткий формат
      }];

      const reasonsKeyboard: InlineKeyboard = {
        inline_keyboard: [...reasonButtons, backButton],
      };

      // Получаем topicId из БД
      const topicId = await getTopicIdForOrder(orderId, callbackQuery.message.message_id);

      // Используем editTelegramMessage для обновления сообщения с поддержкой Topics
      const success = await editTelegramMessage({
        chatId: String(callbackQuery.message.chat.id),
        messageId: BigInt(callbackQuery.message.message_id),
        topicId,
        text: `${callbackQuery.message.text}\n\n⚠️ **Выберите причину отмены:**`,
        keyboard: reasonsKeyboard,
      });

      if (!success) {
        // Если не удалось обновить сообщение - показываем ошибку
        await fetch(
          `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callbackQuery.id,
              text: '❌ Не удалось обновить сообщение',
              show_alert: true,
            }),
          }
        );
        logger.error('Failed to show cancel reasons', { orderId, topicId });
        return;
      }

      // Успешно - отвечаем на callback query
      await fetch(
        `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
          }),
        }
      );

      logger.info('Cancel order reasons shown', { orderId, topicId });
      return;
    }

    // Если это выбор причины отмены - показываем подтверждение (формат: scr_ORDER_ID_INDEX)
    if (callbackQuery.data?.startsWith('scr_') && callbackQuery.message) {
      const parts = callbackQuery.data.replace('scr_', '').split('_');
      const orderId = parts[0] || '';
      const reasonIndex = parseInt(parts[1] || '0', 10);

      // Получаем reason по индексу
      const reasons = Object.values(OPERATOR_CANCEL_REASONS);
      const reason = reasons[reasonIndex];
      
      if (!reason) {
        logger.error('Invalid reason index', { reasonIndex, orderId });
        return;
      }

      const confirmKeyboard = {
        inline_keyboard: [
          [
            {
              text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_CONFIRM_CANCEL_YES,
              callback_data: `ccl_${orderId}_${reasonIndex}`, // ccl = confirm_cancel, короткий формат
            },
          ],
          [
            {
              text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_BACK,
              callback_data: `cancel_order_${orderId}`, // Возврат к выбору причин
            },
          ],
        ],
      };

      const originalText = callbackQuery.message.text?.replace(/\n\n⚠️ \*\*Выберите причину отмены:[\s\S]*$/, '') || callbackQuery.message.text || '';

      await fetch(
        `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.EDIT_MESSAGE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            text: `${originalText}\n\n⚠️ **Подтвердите отмену заявки**`,
            parse_mode: 'Markdown',
            reply_markup: confirmKeyboard,
          }),
        }
      );

      await fetch(
        `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
          }),
        }
      );

      logger.info('Cancel confirmation shown', { orderId, reasonIndex, reasonId: reason.id });
      return;
    }

    // Если это кнопка "Назад" - возвращаемся к кнопкам заявки (формат: bto_ORDER_ID)
    if (callbackQuery.data?.startsWith('bto_') && callbackQuery.message) {
      const orderId = callbackQuery.data.replace('bto_', '');

      const orderKeyboard = {
        inline_keyboard: [
          [
            {
              text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_COMPLETE,
              callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_COMPLETE_ORDER(orderId),
            },
          ],
          [
            {
              text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_CANCEL_ORDER,
              callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_CANCEL_ORDER(orderId),
            },
          ],
        ],
      };

      const originalText = callbackQuery.message.text?.replace(/\n\n⚠️ \*\*[\s\S]*$/, '') || callbackQuery.message.text;

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
            reply_markup: orderKeyboard,
          }),
        }
      );

      await fetch(
        `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
          }),
        }
      );

      logger.info('Returned to order buttons', { orderId });
      return;
    }

    // Если это подтверждение отмены - выполняем отмену через tRPC (формат: ccl_ORDER_ID_INDEX)
    if (callbackQuery.data?.startsWith('ccl_') && callbackQuery.message) {
      const parts = callbackQuery.data.replace('ccl_', '').split('_');
      const orderId = parts[0] || '';
      const reasonIndex = parseInt(parts[1] || '0', 10);
      const telegramOperatorId = String(callbackQuery.from.id);

      // Получаем reason по индексу
      const reasons = Object.values(OPERATOR_CANCEL_REASONS);
      const reason = reasons[reasonIndex];
      
      if (!reason) {
        logger.error('Invalid reason index in confirmation', { reasonIndex, orderId });
        return;
      }

      logger.info('Order cancellation confirmed, processing...', {
        orderId,
        reasonIndex,
        reasonId: reason.id,
        operatorId: callbackQuery.from.id,
      });

      // Находим label причины отмены
      const reasonLabel: string = reason.label;

      // Вызов функции для отмены заказа
      const result = await cancelOrderViaCallback(orderId, telegramOperatorId, reasonLabel);

      if (result.success) {
        // Успех - показываем уведомление
        await fetch(
          `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callbackQuery.id,
              text: '❌ Заявка успешно отменена!',
              show_alert: false,
            }),
          }
        );

        logger.info('Order cancelled successfully', { orderId, reasonId: reason.id });
      } else {
        // Ошибка - показываем модальное окно
        let errorMessage = '❌ Ошибка отмены заявки\n\n';

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
            case 'SYSTEM_ERROR':
              errorMessage += `Системная ошибка: ${result.error.message}`;
              break;
            default:
              errorMessage += result.error.message;
          }
        } else {
          errorMessage += 'Неизвестная ошибка при отмене заявки';
        }

        await fetch(
          `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callbackQuery.id,
              text: errorMessage,
              show_alert: true, // Модальное окно для ошибок
            }),
          }
        );

        logger.error('Order cancellation failed', { 
          orderId, 
          errorCode: result.error?.code,
          errorMessage: result.error?.message
        });
      }

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
