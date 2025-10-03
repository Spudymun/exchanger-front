// ✅ Main exports for session management package
// Export all types through centralized types/index.ts (Rule 20 compliance)
export type * from './types/index';

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

// ✅ ДОБАВЛЕНО: Session адаптеры для Turbopack fallback
export { MemorySessionAdapter } from './adapters/memory-session-adapter';
export { RedisSessionAdapter } from './adapters/redis-session-adapter';

// ✅ ДОБАВЛЕНО: PostgreSQL адаптеры для WalletPoolManager
export { PostgresOrderAdapter } from './adapters/postgres-order-adapter';
export { PostgresWalletAdapter } from './adapters/postgres-wallet-adapter';
export { BasePostgresAdapter, POSTGRES_ERRORS } from './adapters/base-postgres-adapter';
