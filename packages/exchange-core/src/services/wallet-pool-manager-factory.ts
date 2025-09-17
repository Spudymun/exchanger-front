import type { QueueRepositoryInterface, WalletRepositoryInterface } from '../repositories';

import { WalletPoolManager } from './wallet-pool-manager';

/**
 * Factory для создания WalletPoolManager с правильными зависимостями
 * Следует паттерну session-management для environment-based switching
 *
 * ✅ ИСПРАВЛЕНО: Task 1.3 УЖЕ ВЫПОЛНЕНА - Prisma implementations доступны!
 */
export class WalletPoolManagerFactory {
  /**
   * Создать WalletPoolManager для development окружения
   * ✅ ИСПРАВЛЕНО: Использует Prisma implementations (Task 1.3 завершена)
   */
  static async createForDevelopment(): Promise<WalletPoolManager> {
    // ✅ РЕАЛИЗОВАНО: PostgresWalletAdapter и PostgresQueueAdapter созданы по образцу PostgresOrderAdapter
    const { PostgresWalletAdapter, PostgresQueueAdapter, getPrismaClient } = await import(
      '@repo/session-management'
    );

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for WalletPoolManager');
    }

    const prisma = getPrismaClient({
      url: databaseUrl,
      maxConnections: 10,
      connectionTimeout: 10000,
    });

    const walletRepo = new PostgresWalletAdapter(prisma);
    const queueRepo = new PostgresQueueAdapter(prisma);

    return new WalletPoolManager(walletRepo, queueRepo, 'immediate');
  }

  /**
   * Создать WalletPoolManager для production окружения
   * ✅ ИСПРАВЛЕНО: Использует те же Prisma implementations
   */
  static async createForProduction(): Promise<WalletPoolManager> {
    // ✅ РЕАЛИЗОВАНО: PostgresWalletAdapter и PostgresQueueAdapter созданы
    const { PostgresWalletAdapter, PostgresQueueAdapter, getPrismaClient } = await import(
      '@repo/session-management'
    );
    const { SESSION_CONSTANTS } = await import('@repo/constants');

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for WalletPoolManager');
    }

    const prisma = getPrismaClient({
      url: databaseUrl,
      maxConnections: SESSION_CONSTANTS.DATABASE.MAX_CONNECTIONS,
      connectionTimeout: SESSION_CONSTANTS.DATABASE.CONNECTION_TIMEOUT,
    });

    const walletRepo = new PostgresWalletAdapter(prisma);
    const queueRepo = new PostgresQueueAdapter(prisma);

    return new WalletPoolManager(walletRepo, queueRepo, 'hybrid');
  }

  /**
   * Создать WalletPoolManager на основе окружения
   */
  static async create(): Promise<WalletPoolManager> {
    const env = process.env.NODE_ENV;

    switch (env) {
      case 'development':
      case 'test':
        return await this.createForDevelopment();

      case 'production':
        return await this.createForProduction();

      default:
        return await this.createForDevelopment();
    }
  }

  /**
   * Создать простой WalletPoolManager с переданными зависимостями
   * Для тестирования и прямого использования
   */
  static createWithDependencies(
    walletRepository: WalletRepositoryInterface,
    queueRepository?: QueueRepositoryInterface,
    mode: 'immediate' | 'queue' | 'hybrid' = 'immediate'
  ): WalletPoolManager {
    return new WalletPoolManager(walletRepository, queueRepository, mode);
  }
}
