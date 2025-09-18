/**
 * Redis Wallet Queue Adapter - Clean Version
 *
 * ИСПРАВЛЕНИЯ АРХИТЕКТУРЫ:
 * ✅ Implements WalletQueueAdapter interface
 * ✅ Использует gracefulHandler() вместо дублирования error handling
 * ✅ Использует централизованные константы из SESSION_CONSTANTS
 * ✅ Правильный naming для correlation ID (generateId вместо generateSessionId)
 */

import { SESSION_CONSTANTS, CRYPTOCURRENCIES } from '@repo/constants';
import { generateId } from '@repo/exchange-core';
import { createEnvironmentLogger, gracefulHandler } from '@repo/utils';

import type { CryptoCurrency } from '../types';
import type {
  WalletQueueAdapter,
  QueueItem,
  AddParams,
  QueueStats,
} from '../types/wallet-queue-adapter';

// ✅ Redis interface (следуем паттерну RedisSessionAdapter)
interface Redis {
  lpush(key: string, value: string): Promise<number>;
  rpop(key: string): Promise<string | null>;
  llen(key: string): Promise<number>;
  lrange(key: string, start: number, end: number): Promise<string[]>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
  ping(): Promise<string>;
}

/**
 * Redis адаптер для FIFO очередей
 * ✅ ИСПРАВЛЕНО: Implements WalletQueueAdapter interface
 */
export class RedisWalletQueueAdapter implements WalletQueueAdapter {
  private readonly logger = createEnvironmentLogger('RedisWalletQueueAdapter');
  private isHealthy = true;
  private lastHealthCheck: number = SESSION_CONSTANTS.REDIS.QUEUE_DEFAULTS.INITIAL_TIME;

  constructor(private readonly redis: Redis) {
    this.logger.info('RedisWalletQueueAdapter initialized');
  }

  /**
   * Генерация ключа очереди (следуем паттерну generateSessionKey)
   */
  private generateQueueKey(currency: CryptoCurrency): string {
    return `${SESSION_CONSTANTS.REDIS.WALLET_QUEUE_PREFIX}${currency}`;
  }

  /**
   * Создание элемента очереди
   */
  private createQueueItem(params: AddParams): QueueItem {
    return {
      walletAddress: params.walletAddress,
      currency: params.currency,
      priority: params.priority || 'normal',
      addedAt: Date.now(),
      correlationId: params.correlationId || generateId(),
      userId: params.userId,
    };
  }

  /**
   * Парсинг JSON элемента
   */
  private parseQueueItem(json: string): QueueItem | null {
    try {
      const item = JSON.parse(json) as QueueItem;
      if (!item.walletAddress || !item.currency) {
        return null;
      }
      return item;
    } catch {
      return null;
    }
  }

  /**
   * Парсинг множественных элементов
   */
  private parseMultipleItems(jsons: string[]): QueueItem[] {
    return jsons
      .map(json => this.parseQueueItem(json))
      .filter((item): item is QueueItem => item !== null);
  }

  /**
   * Проверка здоровья Redis
   */
  async checkHealth(): Promise<boolean> {
    const result = await gracefulHandler(
      async () => {
        await this.redis.ping();
        this.isHealthy = true;
        this.lastHealthCheck = Date.now();
        return true;
      },
      { fallback: false }
    );

    if (result === null) {
      this.isHealthy = false;
      return false;
    }

    return result;
  }

  /**
   * Добавление в очередь
   */
  async addToQueue(params: AddParams): Promise<void> {
    const queueItem: QueueItem = {
      walletAddress: params.walletAddress,
      addedAt: Date.now(),
      currency: params.currency,
      correlationId: params.correlationId || generateId(),
      userId: params.userId,
      priority: params.priority || 'normal',
    };
    const queueKey = this.generateQueueKey(params.currency);

    await gracefulHandler(
      async () => {
        // Добавляем в начало списка (LPUSH) для FIFO (RPOP)
        await this.redis.lpush(queueKey, JSON.stringify(queueItem));

        // Устанавливаем TTL для предотвращения накопления
        await this.redis.expire(
          queueKey,
          SESSION_CONSTANTS.REDIS.REDIS_OPERATION_LIMITS.DEFAULT_TTL_SECONDS
        );

        this.logger.info('Added to queue', {
          currency: params.currency,
          walletAddress: params.walletAddress,
          priority: queueItem.priority,
          queueKey,
        });
      },
      { fallback: undefined }
    );
  }

  /**
   * Извлечение следующего элемента
   */
  async getNextFromQueue(currency: CryptoCurrency): Promise<QueueItem | null> {
    const queueKey = this.generateQueueKey(currency);

    return gracefulHandler(
      async () => {
        const json = await this.redis.rpop(queueKey);
        if (!json) {
          return null;
        }

        const item = this.parseQueueItem(json);
        if (!item) {
          this.logger.warn('Failed to parse queue item', { currency, json });
          return null;
        }

        const waitTime = Date.now() - item.addedAt;
        this.logger.info('Extracted from queue', {
          currency,
          walletAddress: item.walletAddress,
          waitTime,
        });

        return item;
      },
      { fallback: null }
    );
  }

  /**
   * Получение размера очереди
   */
  async getQueueSize(currency: CryptoCurrency): Promise<number> {
    const queueKey = this.generateQueueKey(currency);

    const result = await gracefulHandler(
      async () => {
        return await this.redis.llen(queueKey);
      },
      { fallback: SESSION_CONSTANTS.REDIS.QUEUE_DEFAULTS.EMPTY_SIZE }
    );

    return result ?? SESSION_CONSTANTS.REDIS.QUEUE_DEFAULTS.EMPTY_SIZE;
  }

  /**
   * Получение размеров всех очередей
   */
  async getAllQueueSizes(): Promise<Record<CryptoCurrency, number>> {
    const sizes = new Map<CryptoCurrency, number>();

    for (const currency of CRYPTOCURRENCIES) {
      const size = await this.getQueueSize(currency);
      sizes.set(currency, size);
    }

    return Object.fromEntries(sizes) as Record<CryptoCurrency, number>;
  }

  /**
   * Просмотр очереди без извлечения
   */
  async peekQueue(currency: CryptoCurrency, limit?: number): Promise<QueueItem[]> {
    const queueKey = this.generateQueueKey(currency);
    const maxLimit = limit || SESSION_CONSTANTS.REDIS.REDIS_OPERATION_LIMITS.DEFAULT_PEEK_LIMIT;

    const result = await gracefulHandler(
      async () => {
        // Получаем элементы с конца списка (последние добавленные)
        const endIndex = maxLimit - SESSION_CONSTANTS.REDIS.QUEUE_DEFAULTS.INDEX_OFFSET;
        const jsons = await this.redis.lrange(queueKey, -maxLimit, endIndex);
        return this.parseMultipleItems(jsons);
      },
      { fallback: [] }
    );

    return result ?? [];
  }

  /**
   * Вычисление среднего времени ожидания
   */
  private calculateAverageWait(items: QueueItem[]): number {
    if (items.length === SESSION_CONSTANTS.REDIS.QUEUE_DEFAULTS.EMPTY_SIZE) {
      return SESSION_CONSTANTS.REDIS.QUEUE_DEFAULTS.INITIAL_TIME;
    }

    const now = Date.now();
    const totalWait = items.reduce(
      (sum: number, item) => sum + (now - item.addedAt),
      SESSION_CONSTANTS.REDIS.QUEUE_DEFAULTS.INITIAL_TIME
    );
    return Math.round(totalWait / items.length);
  }

  /**
   * Получение статистики очереди
   */
  async getQueueStats(currency: CryptoCurrency): Promise<QueueStats> {
    const [size, items] = await Promise.all([
      this.getQueueSize(currency),
      this.peekQueue(currency, SESSION_CONSTANTS.REDIS.REDIS_OPERATION_LIMITS.STATS_LIMIT),
    ]);

    const averageWaitTime = this.calculateAverageWait(items);

    return {
      size,
      lastUpdated: Date.now(),
      totalProcessed: SESSION_CONSTANTS.REDIS.QUEUE_DEFAULTS.INITIAL_TIME, // Считается отдельно
      averageWaitTime,
    };
  }

  /**
   * Очистка очереди
   */
  async clearQueue(currency: CryptoCurrency, correlationId?: string): Promise<void> {
    const queueKey = this.generateQueueKey(currency);
    const auditId = correlationId || generateId();

    const result = await gracefulHandler(
      async () => {
        const sizeBefore = await this.getQueueSize(currency);

        this.logger.warn('Clearing queue', {
          currency,
          sizeBefore,
          correlationId: auditId,
        });

        await this.redis.del(queueKey);
      },
      { fallback: undefined }
    );

    if (result === null) {
      this.logger.error('Failed to clear queue', { currency, correlationId: auditId });
      throw new Error(`Failed to clear queue for ${currency}`);
    }
  }
}
