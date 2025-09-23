import { HTTP_STATUS, TELEGRAM_OPERATOR_MESSAGES, TELEGRAM_API } from '@repo/constants';
import { createEnvironmentLogger, gracefulHandler } from '@repo/utils';

import type { NextApiRequest, NextApiResponse } from 'next';

const logger = createEnvironmentLogger('telegram-notify-operators');

interface NotificationPayload {
  order: {
    id: string;
    email: string;
    cryptoAmount: string;
    currency: string;
    uahAmount: string;
  };
  depositAddress: string;
  walletType: 'fresh' | 'reused';
}

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
 */
function validateAuth(req: NextApiRequest): boolean {
  const authHeader = req.headers.authorization;
  return authHeader === `Bearer ${process.env.API_SECRET_KEY}`;
}

/**
 * Валидация payload уведомления
 */
function validatePayload(body: unknown): PayloadValidationResult {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Invalid payload' };
  }

  const typedBody = body as Record<string, unknown>;
  const { order, depositAddress, walletType } = typedBody;

  if (!order || !depositAddress || !walletType) {
    return { 
      isValid: false, 
      error: 'Missing required fields: order, depositAddress, walletType' 
    };
  }

  if (!['fresh', 'reused'].includes(walletType as string)) {
    return { 
      isValid: false, 
      error: 'Invalid walletType. Must be "fresh" or "reused"' 
    };
  }

  return { isValid: true };
}

/**
 * Создание сообщения для операторов
 */
function createOperatorMessage(payload: NotificationPayload): string {
  const { order, depositAddress, walletType } = payload;

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
 * Создание inline клавиатуры
 */
function createInlineKeyboard(orderId: string): InlineKeyboard {
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
  orderId: string
): Promise<boolean> {
  try {
    const telegramApiUrl = `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.SEND_MESSAGE}`;
    
    const response = await fetch(telegramApiUrl, {
      method: TELEGRAM_API.PARAMS.METHOD,
      headers: { 'Content-Type': TELEGRAM_API.PARAMS.CONTENT_TYPE },
      body: JSON.stringify({
        chat_id: operatorId.trim(),
        text: message,
        parse_mode: TELEGRAM_API.PARAMS.PARSE_MODE,
        reply_markup: keyboard,
      }),
    });

    if (response.ok) {
      logger.info('Operator notified successfully', {
        operatorId: operatorId.trim(),
        orderId,
      });
      return true;
    } else {
      throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    logger.warn('Failed to notify operator', {
      operatorId: operatorId.trim(),
      orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
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
 * Отправка уведомлений всем операторам
 */
async function sendOperatorNotifications(
  message: string,
  keyboard: InlineKeyboard,
  orderId: string
): Promise<{ notifiedCount: number; errorCount: number; totalOperators: number }> {
  const operatorIds = getAuthorizedOperators();
  
  if (operatorIds.length === 0) {
    return { notifiedCount: 0, errorCount: 0, totalOperators: 0 };
  }

  let notifiedCount = 0;
  
  for (const operatorId of operatorIds) {
    const success = await notifyOperator(operatorId, message, keyboard, orderId);
    if (success) {
      notifiedCount++;
    }
  }

  const errorCount = operatorIds.length - notifiedCount;
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
  
  // Создание сообщения и клавиатуры
  const message = createOperatorMessage(payload);
  const keyboard = createInlineKeyboard(payload.order.id);

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

  // Отправка уведомлений
  const result = await sendOperatorNotifications(message, keyboard, payload.order.id);

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