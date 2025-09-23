/**
 * tRPC API handler для telegram-bot приложения
 * Проксирует запросы к основному API в apps/web
 */

import { HTTP_STATUS } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

import type { NextApiRequest, NextApiResponse } from 'next';

const logger = createEnvironmentLogger('telegram-bot-trpc');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Базовая заглушка для tRPC endpoint
  // Полная реализация будет добавлена после создания tRPC клиента

  logger.info('tRPC request received', {
    method: req.method,
    path: req.url,
  });

  res.status(HTTP_STATUS.OK).json({
    message: 'tRPC endpoint ready',
    timestamp: new Date().toISOString(),
  });
}
