import type { WalletRepositoryInterface } from '../repositories';

import { WalletPoolManager } from './wallet-pool-manager';

/**
 * Factory для создания WalletPoolManager с правильными зависимостями
 * Следует паттерну session-management для environment-based switching
 *
 * ✅ ИСПРАВЛЕНО: Task 1.3 УЖЕ ВЫПОЛНЕНА - Prisma implementations доступны!
 */
export class WalletPoolManagerFactory {
  /**
   * Получить конфигурацию базы данных
   */
  private static async getDatabaseConfig(useProductionConfig: boolean) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for WalletPoolManager');
    }

    if (useProductionConfig) {
      const { SESSION_CONSTANTS } = await import('@repo/constants');
      return {
        url: databaseUrl,
        maxConnections: SESSION_CONSTANTS.DATABASE.MAX_CONNECTIONS,
        connectionTimeout: SESSION_CONSTANTS.DATABASE.CONNECTION_TIMEOUT,
      };
    }

    return { url: databaseUrl, maxConnections: 10, connectionTimeout: 10000 };
  }

  /**
   * Общий приватный метод для создания WalletPoolManager
   * ✅ ИСПРАВЛЕНО: Устранено DRY нарушение
   */
  private static async createWalletPoolManager(
    useProductionConfig: boolean = false
  ): Promise<WalletPoolManager> {
    const { PostgresWalletAdapter, getPrismaClient } = await import('@repo/session-management');

    const config = await this.getDatabaseConfig(useProductionConfig);
    const prisma = getPrismaClient(config);

    return new WalletPoolManager(new PostgresWalletAdapter(prisma));
  }

  /**
   * Создать WalletPoolManager для development окружения
   * ✅ ИСПРАВЛЕНО: Использует общий метод
   */
  static async createForDevelopment(): Promise<WalletPoolManager> {
    return await this.createWalletPoolManager(false);
  }

  /**
   * Создать WalletPoolManager для production окружения
   * ✅ ИСПРАВЛЕНО: Использует общий метод
   */
  static async createForProduction(): Promise<WalletPoolManager> {
    return await this.createWalletPoolManager(true);
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
  static createWithDependencies(walletRepository: WalletRepositoryInterface): WalletPoolManager {
    return new WalletPoolManager(walletRepository);
  }
}
