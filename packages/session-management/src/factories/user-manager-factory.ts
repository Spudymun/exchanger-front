import { SESSION_CONSTANTS } from '@repo/constants';
import { userManager as mockUserManager } from '@repo/exchange-core';

import { PostgreSQLUserAdapter } from '../adapters/postgres-user-adapter';
import { RedisSessionAdapter } from '../adapters/redis-session-adapter';
import { ProductionUserManager } from '../managers/production-user-manager';
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

export class UserManagerFactory {
  static async create(config: ManagerConfiguration = {}): Promise<UserManagerInterface> {
    const environment = config.environment || getEnvironment();
    return await this.createManagerByEnvironment(environment, config);
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
    if (config.database?.url && config.redis?.url) {
      return await this.createProductionManager(config);
    }
    // Fallback to mock если нет конфигурации
    return new MockUserManagerWrapper(mockUserManager);
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
