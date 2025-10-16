/**
 * Telegram Webhook Proxy
 * 
 * Принимает webhook от Telegram API и проксирует внутрь Docker network к telegram-bot service.
 * Добавляет валидацию secret_token для защиты от фейковых webhook'ов.
 */

import { HTTP_STATUS } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

import type { NextApiRequest, NextApiResponse } from 'next';

const logger = createEnvironmentLogger('telegram-webhook-proxy');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({ error: 'Method not allowed' });
  }

  // ✅ Валидация secret_token от Telegram (только в production)
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  
  // В development ngrok может терять headers через 307 redirect
  if (process.env.NODE_ENV === 'production' && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || req.socket.remoteAddress;
    
    logger.warn('Invalid webhook secret token', {
      providedToken: secretToken ? '[REDACTED]' : 'none',
      ip,
    });
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'Unauthorized' });
  }
  
  // В development логируем наличие токена для отладки
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('Development mode: secret_token validation skipped', {
      hasToken: !!secretToken,
    });
  }

  // Проксируем запрос к telegram-bot service
  try {
    const telegramBotUrl = process.env.TELEGRAM_BOT_URL || 'http://telegram-bot:3003';
    
    const response = await fetch(`${telegramBotUrl}/api/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    logger.info('Webhook proxied to telegram-bot', {
      status: response.status,
      updateId: req.body?.update_id,
    });

    return res.status(response.status).json(data);
  } catch (error) {
    logger.error('Failed to proxy webhook to telegram-bot', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to process webhook',
    });
  }
}
