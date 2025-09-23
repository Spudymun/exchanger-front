import { HTTP_STATUS } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

import type { NextApiRequest, NextApiResponse } from 'next';

const logger = createEnvironmentLogger('telegram-bot-health');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'telegram-bot',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    };

    logger.info('Health check requested', healthData);
    res.status(HTTP_STATUS.OK).json(healthData);
  } catch (error) {
    logger.error('Health check failed', { error: String(error) });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
