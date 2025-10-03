import { SESSION_CONSTANTS } from '@repo/constants';
import { getPrismaClient, type PrismaClientConfig } from '@repo/session-management';

/**
 * ✅ Унифицированный helper для получения Prisma client с правильной конфигурацией
 *
 * Гарантирует, что все роутеры используют одинаковые настройки connection pool
 * и правильный application_name для мониторинга в pg_stat_activity
 *
 * @param appName - Имя приложения для мониторинга (опционально, по умолчанию 'exchanger-web')
 * @returns Настроенный singleton instance PrismaClient
 *
 * @throws Error если DATABASE_URL не установлен
 *
 * @example
 * ```typescript
 * const prisma = getConfiguredPrismaClient();
 * const users = await prisma.user.findMany();
 * ```
 */
export function getConfiguredPrismaClient(appName = 'exchanger-web') {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is required. ' + 'Please set it in your .env file.'
    );
  }

  const config: PrismaClientConfig = {
    url: databaseUrl,
    maxConnections: SESSION_CONSTANTS.DATABASE.MAX_CONNECTIONS,
    connectionTimeout: SESSION_CONSTANTS.DATABASE.CONNECTION_TIMEOUT,
    appName,
  };

  return getPrismaClient(config);
}
