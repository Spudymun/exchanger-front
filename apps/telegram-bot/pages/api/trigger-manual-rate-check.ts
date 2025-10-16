import { HTTP_STATUS } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';
import type { NextApiRequest, NextApiResponse } from 'next';

import { checkOutdatedRates } from '../../src/services/manual-rate-checker';

const logger = createEnvironmentLogger('trigger-manual-rate-check');

/**
 * API Endpoint для ручного триггера проверки manual rates
 * 
 * Использование:
 *   POST /api/trigger-manual-rate-check
 * 
 * @author AI Agent
 * @date 2025-10-16
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({ error: 'Method not allowed' });
    return;
  }

  try {
    logger.info('Manual rate check triggered');
    await checkOutdatedRates();
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Manual rate check completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Manual rate check failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
