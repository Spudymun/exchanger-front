import { SESSION_CONSTANTS } from '@repo/constants';
import { userManager as mockUserManager } from '@repo/exchange-core';

import { PostgreSQLUserAdapter } from '../adapters/postgres-user-adapter';
import { RedisSessionAdapter } from '../adapters/redis-session-adapter';
import { ProductionUserManager } from '../managers/production-user-manager';

// 🔧 Constants to avoid duplication and magic numbers
const DEBUG_CONSTANTS = {
  ENV_VAR_SET: 'установлен',
  ENV_VAR_NOT_SET: 'не установлен',
  ENV_VAR_MISSING: 'отсутствует',
  CONFIG_PRESENT: 'есть в config',
  CONFIG_MISSING: 'нет в config',
  DATABASE_URL_LENGTH: 30,
  REDIS_URL_LENGTH: 20,
} as const;
import type {
  UserManagerInterface,
  ManagerEnvironment,
  DatabaseAdapter,
  SessionAdapter,
  User,
  CreateUserData,
  SessionMetadata,
} from '../types/index';
import { getPrismaClient, type PrismaClientConfig } from '../utils/prisma-singleton';

// ✅ Используем реальный паттерн environment detection из проекта
function getEnvironment(): ManagerEnvironment {
  const nodeEnv = process.env.NODE_ENV;

  // Fallback на NODE_ENV (убрал SESSION_ENVIRONMENT для простоты)
  switch (nodeEnv) {
    case 'production':
      return SESSION_CONSTANTS.ENVIRONMENTS.PRODUCTION;
    case 'development':
      return SESSION_CONSTANTS.ENVIRONMENTS.DEVELOPMENT;
    default:
      return SESSION_CONSTANTS.ENVIRONMENTS.MOCK;
  }
}

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
}

/**
 * 🏭 Factory for creating UserManager instances based on environment configuration
 */
export class UserManagerFactory {
  // ✅ Singleton instance для production optimization
  private static cachedUserManager: UserManagerInterface | null = null;
  private static cachedConfig: string | null = null;

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
   * 🔍 Debug logging helper to reduce complexity
   */
  private static logEnvironmentDebug(
    environment: ManagerEnvironment,
    config: ManagerConfiguration
  ): void {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('🔍 UserManagerFactory DEBUG:', {
        NODE_ENV: process.env.NODE_ENV,
        detected_environment: environment,
        DATABASE_URL: process.env.DATABASE_URL
          ? DEBUG_CONSTANTS.ENV_VAR_SET
          : DEBUG_CONSTANTS.ENV_VAR_NOT_SET,
        DATABASE_URL_value: this.formatEnvValue(
          process.env.DATABASE_URL,
          DEBUG_CONSTANTS.DATABASE_URL_LENGTH
        ),
        REDIS_URL: process.env.REDIS_URL
          ? DEBUG_CONSTANTS.ENV_VAR_SET
          : DEBUG_CONSTANTS.ENV_VAR_NOT_SET,
        REDIS_URL_value: this.formatEnvValue(
          process.env.REDIS_URL,
          DEBUG_CONSTANTS.REDIS_URL_LENGTH
        ),
        FORCE_MOCK_MODE: process.env.FORCE_MOCK_MODE || DEBUG_CONSTANTS.ENV_VAR_NOT_SET,
        config_database: config.database?.url
          ? DEBUG_CONSTANTS.CONFIG_PRESENT
          : DEBUG_CONSTANTS.CONFIG_MISSING,
        config_redis: config.redis?.url
          ? DEBUG_CONSTANTS.CONFIG_PRESENT
          : DEBUG_CONSTANTS.CONFIG_MISSING,
      });
    }
  }

  /**
   * 🔧 Helper to format environment variable values
   */
  private static formatEnvValue(value: string | undefined, maxLength: number): string {
    return value ? value.substring(0, maxLength) + '...' : DEBUG_CONSTANTS.ENV_VAR_MISSING;
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
        databaseUrl: databaseUrl ? DEBUG_CONSTANTS.ENV_VAR_SET : DEBUG_CONSTANTS.ENV_VAR_NOT_SET,
        redisUrl: redisUrl ? DEBUG_CONSTANTS.ENV_VAR_SET : DEBUG_CONSTANTS.ENV_VAR_NOT_SET,
        forceMock: process.env.FORCE_MOCK_MODE || DEBUG_CONSTANTS.ENV_VAR_NOT_SET,
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

  private static async createProductionManager(
    config: ManagerConfiguration
  ): Promise<ProductionUserManager> {
    if (!config.database?.url || !config.redis?.url) {
      throw new Error('Production environment requires database and redis configuration');
    }

    const databaseAdapter = await this.createDatabaseAdapter(config.database);
    const sessionAdapter = await this.createSessionAdapter(config.redis);

    return new ProductionUserManager(databaseAdapter, sessionAdapter);
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
    };
  }

  private static async createSessionAdapter(
    redisConfig: NonNullable<ManagerConfiguration['redis']>
  ): Promise<SessionAdapter> {
    const { Redis } = await import('ioredis');
    const redis = new Redis(redisConfig.url, {
      maxRetriesPerRequest: redisConfig.maxRetries || SESSION_CONSTANTS.REDIS.MAX_RETRIES,
    });

    return new RedisSessionAdapter(redis);
  }

  // ✅ Utility methods для singleton management
  static clearCache(): void {
    this.cachedUserManager = null;
    this.cachedConfig = null;
  }

  static getCachedInstance(): UserManagerInterface | null {
    return this.cachedUserManager;
  }

  // ✅ Optimized method for context.ts - uses cached instance for production performance
  static async createForContext(): Promise<UserManagerInterface> {
    // В production режиме всегда используем cached instance если возможно
    if (process.env.NODE_ENV === 'production' && this.cachedUserManager) {
      return this.cachedUserManager;
    }

    // Для development и первого создания используем обычный create
    return await this.create();
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

  async findBySessionId(sessionId: string): Promise<User | undefined> {
    return this.mockManager.findBySessionId(sessionId);
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
  async createSession(userId: string, _metadata: SessionMetadata, _ttl: number): Promise<string> {
    const { generateSessionId } = await import('@repo/exchange-core');
    const sessionId = generateSessionId();
    await this.update(userId, { sessionId });
    return sessionId;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const user = await this.findBySessionId(sessionId);
    if (user) {
      await this.update(user.id, { sessionId: undefined });
    }
  }

  async extendSession(_sessionId: string, _ttl: number): Promise<void> {
    // Mock: ничего не делаем, TTL управляется browser cookie
  }
}
