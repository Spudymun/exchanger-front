// ✅ Main exports for session management package
export type { UserManagerInterface, SessionMetadata, User } from './types/interfaces';

export type {
  DatabaseConfiguration,
  RedisConfiguration,
  ManagerConfiguration,
  ManagerEnvironment,
} from './types/config';

export { UserManagerFactory } from './factories/user-manager-factory';

// ✅ ProductionUserManager export for type checking and instanceof validation in auth routes
// Note: Primary creation should still use UserManagerFactory.create() for proper configuration
export { ProductionUserManager } from './managers/production-user-manager';

// ✅ Environment helpers
export { getEnvironment } from './utils/environment';

// ✅ ДОБАВЛЕНО: Утилиты для singleton управления
export {
  getPrismaClient,
  closePrismaClient,
  type PrismaClientConfig,
} from './utils/prisma-singleton';
