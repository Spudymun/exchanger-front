
import { HTTP_STATUS, TELEGRAM_OPERATOR_MESSAGES, TELEGRAM_API } from '@repo/constants';
import type { TelegramNotificationType, TelegramNotificationPayload } from '@repo/constants';
import { createEnvironmentLogger, gracefulHandler } from '@repo/utils';
import type { NextApiRequest, NextApiResponse } from 'next';

import { saveTelegramMessageInfo } from '../../src/lib/telegram-message-tracker';

const logger = createEnvironmentLogger('telegram-notify-operators');

// ✅ Используем централизованный тип из @repo/constants
type NotificationPayload = TelegramNotificationPayload;

interface PayloadValidationResult {
  isValid: boolean;
  error?: string;
}

interface InlineKeyboard {
  inline_keyboard: Array<Array<{
    text: string;
    callback_data: string;
  }>>;
}

/**
 * Валидация аутентификации между приложениями
 * В Docker сети проверка не нужна - внешнего доступа нет
 */
function validateAuth(_req: NextApiRequest): boolean {
  logger.debug('TELEGRAM_NOTIFY_AUTH_SKIP', {
    reason: 'Docker network - no external access, auth not needed',
  });
  return true; // Всегда разрешаем в изолированной Docker сети
}

/**
 * Валидация payload уведомления
 */
function validatePayload(body: unknown): PayloadValidationResult {
  logger.debug('TELEGRAM_NOTIFY_PAYLOAD_VALIDATION', {
    hasBody: !!body,
    bodyType: typeof body,
  });

  if (!body || typeof body !== 'object') {
    logger.warn('TELEGRAM_NOTIFY_INVALID_PAYLOAD_TYPE', { bodyType: typeof body });
    return { isValid: false, error: 'Invalid payload' };
  }

  const typedBody = body as Record<string, unknown>;
  const { order, depositAddress, walletType } = typedBody;

  logger.debug('TELEGRAM_NOTIFY_PAYLOAD_FIELDS', {
    hasOrder: !!order,
    hasDepositAddress: !!depositAddress,
    hasWalletType: !!walletType,
    walletTypeValue: String(walletType),
  });

  if (!order || !depositAddress || !walletType) {
    logger.warn('TELEGRAM_NOTIFY_MISSING_FIELDS', {
      order: !!order,
      depositAddress: !!depositAddress,
      walletType: !!walletType,
    });
    return { 
      isValid: false, 
      error: 'Missing required fields: order, depositAddress, walletType' 
    };
  }

  const validWalletTypes = ['fresh', 'reused'];
  const isValidWalletType = validWalletTypes.includes(walletType as string);

  logger.debug('TELEGRAM_NOTIFY_WALLET_TYPE_VALIDATION', {
    walletType: String(walletType),
    validTypesCount: validWalletTypes.length,
    isValid: isValidWalletType,
  });

  if (!isValidWalletType) {
    logger.warn('TELEGRAM_NOTIFY_INVALID_WALLET_TYPE', {
      provided: String(walletType),
      expectedOptions: 'fresh|reused',
    });
    return { 
      isValid: false, 
      error: 'Invalid walletType. Must be "fresh" or "reused"' 
    };
  }

  const orderData = order as Record<string, unknown>;
  logger.debug('TELEGRAM_NOTIFY_PAYLOAD_VALID', { orderId: String(orderData?.id) });
  return { isValid: true };
}

/**
 * Создание сообщения для операторов
 */
function createOperatorMessage(payload: NotificationPayload): string {
  const { order, depositAddress, walletType, notificationType, metadata } = payload;

  // 🆕 TASK: Обработка уведомления об отмене заявки
  if (notificationType === 'order_cancelled') {
    return TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.ORDER_CANCELLED_MESSAGE(
      order,
      metadata?.initiator
    );
  }

  // 🆕 TASK: Обработка уведомления об оплате заявки
  if (notificationType === 'order_paid') {
    return TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.ORDER_PAID_MESSAGE(order);
  }

  // Существующая логика для новых заявок
  const baseInfo = TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.ORDER_INFO(
    {
      id: order.id,
      email: order.email,
      cryptoAmount: order.cryptoAmount,
      currency: order.currency,
      uahAmount: order.uahAmount,
    },
    depositAddress
  );

  const orderHeader = TELEGRAM_OPERATOR_MESSAGES.HEADERS.NEW_ORDER(order.id);

  return walletType === 'fresh'
    ? TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.FRESH_WALLET_MESSAGE(
        `${orderHeader}\n\n${baseInfo}`,
        order.id
      )
    : TELEGRAM_OPERATOR_MESSAGES.TEMPLATES.REUSED_WALLET_MESSAGE(
        `${orderHeader}\n\n${baseInfo}`,
        order.id
      );
}

/**
 * Создание inline клавиатуры в зависимости от типа уведомления
 */
function createInlineKeyboard(
  orderId: string, 
  notificationType?: 'new_order' | 'order_cancelled' | 'order_paid'
): InlineKeyboard {
  // Для отмененных заявок - только кнопка "Детали", без "Взять в работу"
  if (notificationType === 'order_cancelled') {
    return {
      inline_keyboard: [
        [
          {
            text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_DETAILS,
            callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_ORDER_DETAILS(orderId),
          },
        ],
      ],
    };
  }

  // Для новых заявок и оплаченных - полная клавиатура
  return {
    inline_keyboard: [
      [
        {
          text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_TAKE,
          callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_TAKE_ORDER(orderId),
        },
        {
          text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_DETAILS,
          callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_ORDER_DETAILS(orderId),
        },
      ],
    ],
  };
}

/**
 * Отправка уведомления одному оператору
 */
async function notifyOperator(
  operatorId: string,
  message: string,
  keyboard: InlineKeyboard,
  internalOrderId: string, // UUID для сохранения в БД
  topicId?: number,
  notificationType?: TelegramNotificationType
): Promise<boolean> {
  logger.debug('TELEGRAM_NOTIFY_SINGLE_OPERATOR', {
    operatorId: operatorId.trim(),
    internalOrderId,
    messageLength: message.length,
    keyboardButtons: keyboard.inline_keyboard.length,
    topicId: topicId || 'none',
  });

  try {
    const telegramApiUrl = `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.SEND_MESSAGE}`;
    
    const requestPayload: {
      chat_id: string;
      text: string;
      parse_mode: string;
      reply_markup: InlineKeyboard;
      message_thread_id?: number;
    } = {
      chat_id: operatorId.trim(),
      text: message,
      parse_mode: TELEGRAM_API.PARAMS.PARSE_MODE,
      reply_markup: keyboard,
    };
    
    // 🆕 TELEGRAM TOPICS: Добавляем message_thread_id если указан
    if (topicId) {
      requestPayload.message_thread_id = topicId;
    }

    logger.debug('TELEGRAM_API_REQUEST', {
      operatorId: operatorId.trim(),
      internalOrderId,
      topicId: topicId || 'General',
      url: telegramApiUrl.replace(process.env.TELEGRAM_BOT_TOKEN || '', '[TOKEN]'),
      payloadSize: JSON.stringify(requestPayload).length,
    });
    
    const response = await fetch(telegramApiUrl, {
      method: TELEGRAM_API.PARAMS.METHOD,
      headers: { 'Content-Type': TELEGRAM_API.PARAMS.CONTENT_TYPE },
      body: JSON.stringify(requestPayload),
    });

    logger.debug('TELEGRAM_API_RESPONSE', {
      operatorId: operatorId.trim(),
      internalOrderId,
      topicId: topicId || 'General',
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (response.ok) {
      // ✅ Сохранить message_id в БД для возможности обновления
      const responseData = await response.json();
      if (responseData.result?.message_id && notificationType) {
        await saveTelegramMessageInfo({
          orderId: internalOrderId, // ✅ UUID для связи с Order.id
          chatId: operatorId.trim(),
          messageId: responseData.result.message_id,
          notificationType,
          topicId,
        });
      }

      logger.info('Operator notified successfully', {
        operatorId: operatorId.trim(),
        internalOrderId,
        topicId: topicId || 'General',
        messageId: responseData.result?.message_id,
        responseStatus: response.status,
      });
      return true;
    } else {
      const responseText = await response.text();
      logger.error('TELEGRAM_API_ERROR_RESPONSE', {
        operatorId: operatorId.trim(),
        internalOrderId,
        topicId: topicId || 'General',
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText,
      });
      throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    logger.warn('Failed to notify operator', {
      operatorId: operatorId.trim(),
      internalOrderId,
      topicId: topicId || 'General',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return false;
  }
}

/**
 * Получение IP клиента из заголовков
 */
function getClientIp(req: NextApiRequest): string {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (Array.isArray(xForwardedFor)) {
    return xForwardedFor[0] || 'unknown';
  }
  return xForwardedFor || req.connection?.remoteAddress || 'unknown';
}

/**
 * Получение списка авторизованных операторов
 */
function getAuthorizedOperators(): string[] {
  return process.env.AUTHORIZED_TELEGRAM_OPERATORS?.split(',') || [];
}

/**
 * 🆕 TELEGRAM TOPICS: Получение Topic ID по типу уведомления
 * 
 * Возвращает message_thread_id для отправки сообщения в конкретную тему супергруппы.
 * Если Topics не настроены - возвращает undefined (сообщение идёт в General topic).
 * 
 * @param notificationType - Тип уведомления
 * @returns message_thread_id или undefined
 */
function getTopicIdForNotificationType(
  notificationType?: 'new_order' | 'order_cancelled' | 'order_paid'
): number | undefined {
  if (!notificationType) {
    return undefined;
  }
  
  const topicIdStr = (() => {
    switch (notificationType) {
      case 'new_order':
        return process.env.TELEGRAM_NEW_ORDERS_TOPIC_ID;
      case 'order_cancelled':
        return process.env.TELEGRAM_CANCELLED_ORDERS_TOPIC_ID;
      case 'order_paid':
        return process.env.TELEGRAM_PAID_ORDERS_TOPIC_ID;
      default:
        return undefined;
    }
  })();
  
  return topicIdStr ? parseInt(topicIdStr, 10) : undefined;
}

/**
 * Отправка уведомлений всем операторам
 * 
 * 🆕 TELEGRAM TOPICS: Поддержка тем (вкладок) внутри группы Orders
 * - new_order → TELEGRAM_NEW_ORDERS_TOPIC_ID
 * - order_cancelled → TELEGRAM_CANCELLED_ORDERS_TOPIC_ID
 * - order_paid → TELEGRAM_PAID_ORDERS_TOPIC_ID
 * - fallback → General topic (если Topics не настроены)
 */
async function sendOperatorNotifications(
  message: string,
  keyboard: InlineKeyboard,
  publicOrderId: string, // publicId для отображения
  internalOrderId: string, // UUID для сохранения в БД
  notificationType?: 'new_order' | 'order_cancelled' | 'order_paid'
): Promise<{ notifiedCount: number; errorCount: number; totalOperators: number }> {
  
  // 🆕 TELEGRAM TOPICS: Получаем Topic ID для типа уведомления
  const topicId = getTopicIdForNotificationType(notificationType);
  
  const ordersChatId = process.env.TELEGRAM_ORDERS_CHAT_ID;
  
  if (ordersChatId) {
    // Route 1: Send to Orders channel (with topic if configured)
    logger.info('TELEGRAM_NOTIFICATION_TO_ORDERS_CHANNEL', {
      notificationType: notificationType || 'new_order',
      chatId: ordersChatId,
      topicId: topicId || 'General',
      publicOrderId,
      internalOrderId,
      messageLength: message.length,
    });
    
    const success = await notifyOperator(
      ordersChatId, 
      message, 
      keyboard, 
      internalOrderId, // ✅ UUID для сохранения в БД
      topicId,
      notificationType || 'new_order'
    );
    
    if (success) {
      logger.info('Notification sent to Orders channel', {
        publicOrderId,
        internalOrderId,
        notificationType: notificationType || 'new_order',
        chatId: ordersChatId,
        topicId: topicId || 'General',
      });
      
      return {
        notifiedCount: 1,
        errorCount: 0,
        totalOperators: 1,
      };
    } else {
      logger.warn('Failed to send to Orders channel, falling back to broadcast', {
        publicOrderId,
        internalOrderId,
        chatId: ordersChatId,
      });
      // Fallback будет выполнен ниже
    }
  }
  
  // Route 2: Fallback to broadcast (backward compatibility или если канал не настроен)
  logger.info('TELEGRAM_ORDERS_FALLBACK_BROADCAST', {
    reason: ordersChatId ? 'Channel send failed' : 'Orders channel not configured',
    notificationType: notificationType || 'new_order',
    publicOrderId,
    internalOrderId,
  });
  
  const operatorIds = getAuthorizedOperators();
  
  logger.info('TELEGRAM_NOTIFY_ALL_OPERATORS_START', {
    publicOrderId,
    internalOrderId,
    totalOperators: operatorIds.length,
    operatorIds: operatorIds.join(','),
  });
  
  if (operatorIds.length === 0) {
    logger.warn('TELEGRAM_NO_AUTHORIZED_OPERATORS', { publicOrderId, internalOrderId });
    return { notifiedCount: 0, errorCount: 0, totalOperators: 0 };
  }

  let notifiedCount = 0;
  
  for (const operatorId of operatorIds) {
    logger.debug('TELEGRAM_NOTIFY_OPERATOR_ATTEMPT', {
      publicOrderId,
      internalOrderId,
      operatorId,
      attemptNumber: notifiedCount + 1,
      totalOperators: operatorIds.length,
    });

    const success = await notifyOperator(
      operatorId, 
      message, 
      keyboard, 
      internalOrderId, // ✅ UUID для сохранения в БД
      undefined,
      notificationType || 'new_order'
    );
    if (success) {
      notifiedCount++;
      logger.debug('TELEGRAM_NOTIFY_OPERATOR_SUCCESS', {
        publicOrderId,
        internalOrderId,
        operatorId,
        successCount: notifiedCount,
      });
    } else {
      logger.warn('TELEGRAM_NOTIFY_OPERATOR_FAILED', {
        publicOrderId,
        internalOrderId,
        operatorId,
        failedCount: (operatorIds.length - notifiedCount - 1),
      });
    }
  }

  const errorCount = operatorIds.length - notifiedCount;
  
  logger.info('TELEGRAM_NOTIFY_ALL_OPERATORS_COMPLETE', {
    publicOrderId,
    internalOrderId,
    totalOperators: operatorIds.length,
    notifiedCount,
    errorCount,
    successRate: `${((notifiedCount / operatorIds.length) * 100).toFixed(1)}%`,
  });

  return { notifiedCount, errorCount, totalOperators: operatorIds.length };
}

/**
 * Обработка уведомлений операторов
 */
async function processNotifications(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // Валидация аутентификации
  if (!validateAuth(req)) {
    const clientIp = getClientIp(req);
    logger.warn('Unauthorized notification request', {
      ip: clientIp,
      userAgent: req.headers['user-agent'],
    });
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'Unauthorized' });
    return;
  }

  // Валидация payload
  const payloadValidation = validatePayload(req.body);
  if (!payloadValidation.isValid) {
    logger.warn('Invalid notification payload', { 
      error: payloadValidation.error,
    });
    res.status(HTTP_STATUS.BAD_REQUEST).json({ error: payloadValidation.error });
    return;
  }

  const payload = req.body as NotificationPayload;

  // ✅ ВАЖНО: internalId ОБЯЗАТЕЛЕН для корректной работы с БД
  if (!payload.order.internalId) {
    logger.error('MISSING_INTERNAL_ORDER_ID', {
      publicId: payload.order.id,
      notificationType: payload.notificationType,
    });
    res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Missing required field: order.internalId' 
    });
    return;
  }
  
  // Создание сообщения и клавиатуры
  const message = createOperatorMessage(payload);
  // ✅ ВАЖНО: Используем internalId для callback_data (UUID для БД операций)
  const keyboard = createInlineKeyboard(
    payload.order.internalId, // UUID для callback
    payload.notificationType
  );

  // Получение и проверка операторов
  const operatorIds = getAuthorizedOperators();
  
  if (operatorIds.length === 0) {
    logger.warn('No authorized operators configured');
    res.status(HTTP_STATUS.OK).json({ 
      success: true, 
      message: 'No operators to notify',
      notifiedCount: 0 
    });
    return;
  }

  // 🆕 Отправка уведомлений с учетом типа
  const result = await sendOperatorNotifications(
    message,
    keyboard,
    payload.order.id, // publicId для отображения
    payload.order.internalId, // UUID для БД
    payload.notificationType // Передаем тип для роутинга по каналам
  );

  // 🆕 ВАЖНО: Для отмененных заявок обновляем ВСЕ существующие сообщения
  if (payload.notificationType === 'order_cancelled' && payload.order.internalId) {
    const { updateAllOrderMessages } = await import('../../src/lib/telegram-message-tracker');
    
    const cancelledMessage = message; // Используем то же сообщение что отправили
    const cancelledKeyboard = { inline_keyboard: [[{
      text: '📋 Детали',
      callback_data: `details_${payload.order.internalId}`, // ✅ UUID для callback
    }]] };

    const updatedCount = await updateAllOrderMessages({
      orderId: payload.order.internalId, // ✅ UUID для поиска в БД
      newText: cancelledMessage,
      newKeyboard: cancelledKeyboard,
    });

    logger.info('UPDATED_EXISTING_MESSAGES_FOR_CANCELLED_ORDER', {
      orderId: payload.order.id,
      updatedCount,
    });
  }

  logger.info('Notification batch completed', {
    orderId: payload.order.id,
    walletType: payload.walletType,
    ...result,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
}

/**
 * HTTP API endpoint для отправки уведомлений операторам о новых заявках
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({ error: 'Method not allowed' });
    return;
  }

  const result = await gracefulHandler(
    async () => processNotifications(req, res),
    { fallback: null }
  );

  if (result === null) {
    logger.error('Critical error in notification handler');
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error',
    });
  }
}