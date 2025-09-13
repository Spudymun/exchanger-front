import { SESSION_CONSTANTS, type ApplicationContext } from '@repo/constants';
import { userManager as mockUserManager } from '@repo/exchange-core';
import { createEnvironmentLogger } from '@repo/utils';

import { PostgreSQLSessionAdapter } from '../adapters/postgres-session-adapter';
import { PostgreSQLUserAdapter } from '../adapters/postgres-user-adapter';
import { RedisSessionAdapter } from '../adapters/redis-session-adapter';
import { ProductionUserManager } from '../managers/production-user-manager';
import type { RedisConfiguration } from '../types/config';
import type {
  UserManagerInterface,
  ManagerEnvironment,
  DatabaseAdapter,
  SessionAdapter,
  User,
  CreateUserData,
  SessionMetadata,
} from '../types/index';
import { getEnvironment } from '../utils/environment';
import { getPrismaClient, type PrismaClientConfig } from '../utils/prisma-singleton';

export interface ManagerConfiguration {
  environment?: ManagerEnvironment;
  database?: {
    url: string;
    maxConnections?: number;
  };
  redis?: {
    url: string;
    maxRetries?: number;
  };
  // ✅ ДОБАВЛЯЕМ опциональный context
  context?: ApplicationContext;
}

/**
 * 🏭 Factory for creating UserManager instances based on environment configuration
 */
export class UserManagerFactory {
  // ✅ Singleton instance для production optimization
  private static cachedUserManager: UserManagerInterface | null = null;
  private static cachedConfig: string | null = null;
  private static logger = createEnvironmentLogger('UserManagerFactory');

  static async create(config: ManagerConfiguration = {}): Promise<UserManagerInterface> {
    // ✅ Production optimization: use cached instance if config matches
    const configKey = JSON.stringify(config);
    if (this.cachedUserManager && this.cachedConfig === configKey) {
      return this.cachedUserManager;
    }

    const environment = config.environment || getEnvironment();
    this.logEnvironmentDebug(environment, config);
    const userManager = await this.createManagerByEnvironment(environment, config);

    // ✅ Cache the instance for production performance
    this.cachedUserManager = userManager;
    this.cachedConfig = configKey;

    return userManager;
  }

  /**
   * 🔍 Debug logging helper using structured logging
   */
  private static logEnvironmentDebug(
    environment: ManagerEnvironment,
    config: ManagerConfiguration
  ): void {
    const DATABASE_URL_PREVIEW_LENGTH = 30;
    const REDIS_URL_PREVIEW_LENGTH = 20;

    this.logger.environmentInfo({
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      detected_environment: environment,
      DATABASE_URL_set: Boolean(process.env.DATABASE_URL),
      DATABASE_URL_preview:
        process.env.DATABASE_URL?.substring(0, DATABASE_URL_PREVIEW_LENGTH) + '...' || 'missing',
      REDIS_URL_set: Boolean(process.env.REDIS_URL),
      REDIS_URL_preview:
        process.env.REDIS_URL?.substring(0, REDIS_URL_PREVIEW_LENGTH) + '...' || 'missing',
      FORCE_MOCK_MODE: process.env.FORCE_MOCK_MODE || 'not_set',
      config_database_provided: Boolean(config.database?.url),
      config_redis_provided: Boolean(config.redis?.url),
    });
  }

  private static async createManagerByEnvironment(
    environment: ManagerEnvironment,
    config: ManagerConfiguration
  ): Promise<UserManagerInterface> {
    switch (environment) {
      case SESSION_CONSTANTS.ENVIRONMENTS.MOCK:
        return new MockUserManagerWrapper(mockUserManager);

      case SESSION_CONSTANTS.ENVIRONMENTS.DEVELOPMENT:
        return await this.createDevelopmentManager(config);

      case SESSION_CONSTANTS.ENVIRONMENTS.PRODUCTION:
        return await this.createProductionManager(config);

      default:
        throw new Error(`Unsupported environment: ${environment}`);
    }
  }

  private static async createDevelopmentManager(
    config: ManagerConfiguration
  ): Promise<UserManagerInterface> {
    // Check for forced mock mode first
    if (this.shouldUseForcedMockMode()) {
      this.logDevelopmentMode('Принудительный Mock режим активирован');
      return new MockUserManagerWrapper(mockUserManager);
    }

    const urls = this.extractEnvironmentUrls(config);
    this.logDevelopmentMode('Development Manager', urls);

    return urls.hasValidUrls
      ? await this.createProductionManagerWithUrls(config, urls)
      : this.createFallbackMockManager();
  }

  /**
   * 🎯 Check if forced mock mode is enabled
   */
  private static shouldUseForcedMockMode(): boolean {
    return process.env.FORCE_MOCK_MODE === 'true';
  }

  /**
   * 🔧 Extract database and redis URLs from config or environment
   */
  private static extractEnvironmentUrls(config: ManagerConfiguration) {
    const databaseUrl = config.database?.url || process.env.DATABASE_URL;
    const redisUrl = config.redis?.url || process.env.REDIS_URL;

    return {
      databaseUrl,
      redisUrl,
      hasValidUrls: Boolean(databaseUrl && redisUrl),
      debugInfo: {
        databaseUrl: Boolean(databaseUrl),
        redisUrl: Boolean(redisUrl),
        forceMock: process.env.FORCE_MOCK_MODE || 'not_set',
      },
    };
  }

  /**
   * 🚀 Create production manager with validated URLs
   */
  private static async createProductionManagerWithUrls(
    config: ManagerConfiguration,
    urls: ReturnType<typeof UserManagerFactory.extractEnvironmentUrls>
  ): Promise<ProductionUserManager> {
    if (!urls.databaseUrl || !urls.redisUrl) {
      throw new Error('Database and Redis URLs are required for production manager');
    }

    this.logDevelopmentMode('Используем PostgreSQL + Redis');
    return await this.createProductionManager({
      ...config,
      database: { url: urls.databaseUrl },
      redis: { url: urls.redisUrl },
    });
  }

  /**
   * 🔧 Create fallback mock manager
   */
  private static createFallbackMockManager(): MockUserManagerWrapper {
    this.logDevelopmentMode('Fallback to MockUserManagerWrapper (нет DATABASE_URL или REDIS_URL)');
    return new MockUserManagerWrapper(mockUserManager);
  }

  /**
   * 📝 Development logging helper
   */
  private static logDevelopmentMode(message: string, data?: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`🔍 ${message}`, data || '');
    }
  }

  // ✅ ОБНОВЛЯЕМ createProductionManager для поддержки context
  private static async createProductionManager(
    config: ManagerConfiguration
  ): Promise<ProductionUserManager> {
    if (!config.database?.url || !config.redis?.url) {
      throw new Error('Production environment requires database and redis configuration');
    }

    const databaseAdapter = await this.createDatabaseAdapter(config.database);
    // ✅ ПЕРЕДАЕМ context в createSessionAdapter с fallback
    const sessionAdapter = await this.createSessionAdapter(
      config.redis,
      config.context || SESSION_CONSTANTS.APPLICATION_CONTEXT.WEB
    );

    // ✅ ПЕРЕДАЕМ applicationContext в ProductionUserManager
    return new ProductionUserManager(
      databaseAdapter,
      sessionAdapter,
      config.context || SESSION_CONSTANTS.APPLICATION_CONTEXT.WEB
    );
  }

  private static async createDatabaseAdapter(
    dbConfig: NonNullable<ManagerConfiguration['database']>
  ): Promise<DatabaseAdapter> {
    // ✅ ИСПРАВЛЕНО: Используем singleton pattern вместо создания нового instance
    const prismaConfig: PrismaClientConfig = {
      url: dbConfig.url,
      maxConnections: dbConfig.maxConnections || SESSION_CONSTANTS.DATABASE.MAX_CONNECTIONS,
      connectionTimeout: SESSION_CONSTANTS.DATABASE.CONNECTION_TIMEOUT,
    };

    const prisma = getPrismaClient(prismaConfig);

    return {
      users: new PostgreSQLUserAdapter(prisma),
      sessions: new PostgreSQLSessionAdapter(prisma),
    };
  }

  // ✅ Context теперь обязательный параметр
  private static async createSessionAdapter(
    redisConfig: RedisConfiguration,
    context: ApplicationContext
  ): Promise<SessionAdapter> {
    const { Redis } = await import('ioredis');
    const redis = new Redis(redisConfig.url, {
      maxRetriesPerRequest: redisConfig.maxRetries || SESSION_CONSTANTS.REDIS.MAX_RETRIES,
    });

    // ✅ ПЕРЕДАЕМ context в RedisSessionAdapter
    return new RedisSessionAdapter(redis, context);
  }

  // ✅ Utility methods для singleton management
  static clearCache(): void {
    this.cachedUserManager = null;
    this.cachedConfig = null;
  }

  static getCachedInstance(): UserManagerInterface | null {
    return this.cachedUserManager;
  }

  // ✅ РАСШИРЯЕМ createForContext для поддержки application context
  static async createForContext(context?: ApplicationContext): Promise<UserManagerInterface> {
    // Если context не передан - используем стандартный create (backward compatibility)
    if (!context) {
      return await this.create();
    }

    // Создаем конфигурацию с указанным context
    return await this.create({
      context,
    });
  }

  // ✅ НОВЫЙ convenience метод для web приложения
  static async createForWeb(): Promise<UserManagerInterface> {
    return await this.createForContext(SESSION_CONSTANTS.APPLICATION_CONTEXT.WEB);
  }

  // ✅ НОВЫЙ convenience метод для admin приложения
  static async createForAdmin(): Promise<UserManagerInterface> {
    return await this.createForContext(SESSION_CONSTANTS.APPLICATION_CONTEXT.ADMIN);
  }
}

// ✅ Wrapper для существующего mockUserManager с async compatibility
class MockUserManagerWrapper implements UserManagerInterface {
  constructor(private mockManager: typeof mockUserManager) {}

  async findByEmail(email: string): Promise<User | undefined> {
    return this.mockManager.findByEmail(email);
  }

  async findById(id: string): Promise<User | undefined> {
    return this.mockManager.findById(id);
  }

  async findBySessionId(_sessionId: string): Promise<User | undefined> {
    // Метод удален из новой архитектуры, используйте session store
    return undefined;
  }

  async create(userData: CreateUserData): Promise<User> {
    return this.mockManager.create(userData);
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    return this.mockManager.update(id, updateData) || null;
  }

  async getAll(): Promise<User[]> {
    return this.mockManager.getAll();
  }

  async count(): Promise<number> {
    return this.mockManager.count();
  }

  // ✅ Mock implementations для session methods
  async createSession(_userId: string, _metadata: SessionMetadata, _ttl: number): Promise<string> {
    const { generateSessionId } = await import('@repo/exchange-core');
    return generateSessionId();
  }

  async deleteSession(_sessionId: string): Promise<void> {
    // В новой архитектуре сессии управляются через Redis/session store
    // Mock: ничего не делаем
  }

  async extendSession(_sessionId: string, _ttl: number): Promise<void> {
    // Mock: ничего не делаем, TTL управляется browser cookie
  }
}
