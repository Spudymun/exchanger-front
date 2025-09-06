// ✅ Main exports for session management package
export type {
  UserManagerInterface,
  SessionManagerInterface,
  SessionMetadata,
} from './types/interfaces';

export type {
  DatabaseConfiguration,
  RedisConfiguration,
  ManagerConfiguration,
  ManagerEnvironment,
} from './types/config';

export { UserManagerFactory } from './factories/user-manager-factory';

export { SESSION_CONSTANTS } from '@repo/constants';

// ✅ Environment helpers
export { getEnvironment } from './utils/environment';

// ✅ ДОБАВЛЕНО: Утилиты для singleton управления
export {
  getPrismaClient,
  closePrismaClient,
  type PrismaClientConfig,
} from './utils/prisma-singleton';
