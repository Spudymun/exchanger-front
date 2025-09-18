/**
 * Redis Wallet Queue Factory - Corrected Version
 *
 * ИСПРАВЛЕНИЯ АРХИТЕКТУРЫ:
 * ✅ Follows UserManagerFactory pattern exactly
 * ✅ Singleton pattern с кешированием
 * ✅ Dynamic import для Redis
 * ✅ Graceful fallback при ошибках
 * ✅ Environment-ready configuration
 */

import { SESSION_CONSTANTS } from '@repo/constants';
import { createEnvironmentLogger, gracefulHandler } from '@repo/utils';

import { RedisWalletQueueAdapter } from '../adapters/redis-wallet-queue-adapter';
import type { WalletQueueAdapter } from '../types/wallet-queue-adapter';

// ✅ Configuration interface (следуем паттерну session-management)
export interface QueueAdapterConfiguration {
  redis?: {
    url: string;
    maxRetries?: number;
  };
}

/**
 * Factory for creating Redis Wallet Queue Adapters
 * ✅ ИСПРАВЛЕНО: Следует паттерну UserManagerFactory
 */
export class RedisWalletQueueFactory {
  // ✅ Singleton pattern с кешированием (как в UserManagerFactory)
  private static cachedAdapter: WalletQueueAdapter | null = null;
  private static cachedConfig: string | null = null;
  private static readonly logger = createEnvironmentLogger('RedisWalletQueueFactory');

  /**
   * Create Redis Wallet Queue Adapter instance
   * ✅ ИСПРАВЛЕНО: Singleton pattern с конфигурацией
   */
  static async create(config: QueueAdapterConfiguration = {}): Promise<WalletQueueAdapter> {
    // ✅ Production optimization: use cached instance if config matches
    const configKey = JSON.stringify(config);
    if (this.cachedAdapter && this.cachedConfig === configKey) {
      return this.cachedAdapter;
    }

    this.logConfigurationDebug(config);
    const adapter = await this.createRedisAdapter(config);

    // ✅ Cache the instance for production performance
    this.cachedAdapter = adapter;
    this.cachedConfig = configKey;

    return adapter;
  }

  /**
   * Debug logging helper (следуем паттерну UserManagerFactory)
   */
  private static logConfigurationDebug(config: QueueAdapterConfiguration): void {
    const REDIS_URL_PREVIEW_LENGTH = 30;
    const SUBSTRING_START_INDEX = 0;

    this.logger.info('Creating Redis Wallet Queue Adapter', {
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      REDIS_URL_set: Boolean(process.env.REDIS_URL),
      REDIS_URL_preview:
        process.env.REDIS_URL?.substring(SUBSTRING_START_INDEX, REDIS_URL_PREVIEW_LENGTH) + '...' ||
        'missing',
      config_redis_provided: Boolean(config.redis?.url),
    });
  }

  /**
   * Create Redis adapter with dynamic import and graceful fallback
   * ✅ ИСПРАВЛЕНО: Следует паттерну session-management
   */
  private static async createRedisAdapter(
    config: QueueAdapterConfiguration
  ): Promise<WalletQueueAdapter> {
    const result = await gracefulHandler(
      async () => {
        const redis = await this.createRedisConnection(config);

        this.logger.info('Redis wallet queue adapter created successfully');
        return new RedisWalletQueueAdapter(redis);
      },
      { fallback: null }
    );

    // Если gracefulHandler вернул null, используем fallback adapter
    if (result === null) {
      this.logger.warn('Failed to create Redis wallet queue adapter, using fallback');
      return this.createFallbackAdapter();
    }

    return result;
  }

  /**
   * Create Redis connection with proper configuration
   */
  private static async createRedisConnection(config: QueueAdapterConfiguration) {
    // ✅ Dynamic import для совместимости с Turbopack (как в UserManagerFactory)
    const Redis = await this.importRedisModule();

    // ✅ Configuration с defaults (как в session-management)
    const connectionConfig = this.buildRedisConfig(config);

    const redis = new Redis(connectionConfig.url, {
      maxRetriesPerRequest: connectionConfig.maxRetries,
      lazyConnect: true,
    });

    // Тест соединения
    await redis.ping();

    return redis;
  }

  /**
   * Import Redis module dynamically
   */
  private static async importRedisModule() {
    const ioredisModule = await import('ioredis');

    // Проверяем что это реальный Redis класс, а не empty.js
    const Redis = ioredisModule.default || ioredisModule;

    if (typeof Redis !== 'function') {
      throw new Error('Redis constructor not available (likely empty.js fallback)');
    }

    return Redis;
  }

  /**
   * Build Redis configuration from config and environment
   */
  private static buildRedisConfig(config: QueueAdapterConfiguration) {
    const redisUrl = config.redis?.url || process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('Redis URL not configured - set REDIS_URL environment variable');
    }

    const maxRetries = config.redis?.maxRetries || SESSION_CONSTANTS.REDIS.MAX_RETRIES;

    return { url: redisUrl, maxRetries };
  }

  /**
   * Create fallback adapter for development/testing
   * ✅ НОВОЕ: Graceful fallback для development mode
   */
  private static createFallbackAdapter(): WalletQueueAdapter {
    const logger = this.logger;
    logger.warn('Using in-memory fallback wallet queue adapter');

    // Простой in-memory fallback адаптер с correct constants
    const EMPTY_SIZE = 0;
    const EMPTY_PROCESSED = 0;
    const EMPTY_WAIT_TIME = 0;

    return {
      async addToQueue() {
        logger.warn('Fallback: addToQueue called (no-op)');
      },
      async getNextFromQueue() {
        return null;
      },
      async getQueueSize() {
        return EMPTY_SIZE;
      },
      async getAllQueueSizes() {
        return {} as Record<string, number>;
      },
      async peekQueue() {
        return [];
      },
      async getQueueStats() {
        return {
          size: EMPTY_SIZE,
          lastUpdated: Date.now(),
          totalProcessed: EMPTY_PROCESSED,
          averageWaitTime: EMPTY_WAIT_TIME,
        };
      },
      async clearQueue() {
        logger.warn('Fallback: clearQueue called (no-op)');
      },
      async checkHealth() {
        return false;
      },
    } as WalletQueueAdapter;
  }

  /**
   * Reset factory state (for testing purposes)
   * ✅ Следует паттерну UserManagerFactory
   */
  static reset(): void {
    this.logger.info('Resetting RedisWalletQueueFactory state');
    this.cachedAdapter = null;
    this.cachedConfig = null;
  }

  /**
   * Check if adapter instance exists
   */
  static hasInstance(): boolean {
    return this.cachedAdapter !== null;
  }
}
