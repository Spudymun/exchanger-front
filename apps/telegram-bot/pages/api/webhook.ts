import { HTTP_STATUS } from '@repo/constants';
import { createEnvironmentLogger, gracefulHandler } from '@repo/utils';

import type { NextApiRequest, NextApiResponse } from 'next';

import { handleTelegramUpdate } from '../../src/lib/telegram-bot';

import type { TelegramUpdate } from '../../src/lib/types';

const logger = createEnvironmentLogger('telegram-webhook');

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

      // В реальном боте здесь была бы отправка ответа через Telegram API
      // Для базовой версии просто логируем результат
      if (responseMessage) {
        logger.info('Bot response generated', {
          response: responseMessage,
          userId: update.message?.from?.id,
        });
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
