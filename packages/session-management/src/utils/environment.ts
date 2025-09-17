import { SESSION_CONSTANTS } from '@repo/constants';

import type { ManagerEnvironment } from '../types/config';

/**
 * ✅ Determines current environment from process.env.NODE_ENV
 */
export function getEnvironment(): ManagerEnvironment {
  const nodeEnv = process.env.NODE_ENV;

  switch (nodeEnv) {
    case 'production':
      return SESSION_CONSTANTS.ENVIRONMENTS.PRODUCTION;
    case 'development':
      return SESSION_CONSTANTS.ENVIRONMENTS.DEVELOPMENT;
    case 'test':
      return SESSION_CONSTANTS.ENVIRONMENTS.MOCK;
    default:
      return SESSION_CONSTANTS.ENVIRONMENTS.MOCK;
  }
}
