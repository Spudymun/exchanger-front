/**
 * Redis Queue Repository Implementation - Clean Version
 *
 * АРХИТЕКТУРНАЯ ИНТЕГРАЦИЯ:
 * - Implements QueueRepositoryInterface с Redis backend
 * - Modular structure следуя lint правилам
 * - High performance с error handling
 */

import { SESSION_CONSTANTS } from '@repo/constants';
import { generateId } from '@repo/exchange-core';
import { createEnvironmentLogger } from '@repo/utils';

import { RedisWalletQueueFactory } from '../factories/redis-wallet-queue-factory';
import type { CryptoCurrency } from '../types';
import type { QueueItem } from '../types/wallet-queue-adapter';

import type { QueueEntry, QueueRepositoryInterface } from './queue-repository-interface';

// ✅ Constants без дублирования priorities (используем SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES)
const CONSTANTS = {
  DEFAULT_PRIORITY: SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.LOW,
  FALLBACK_SIZE: 0,
  EMPTY_QUEUE: 0,
} as const;

// ✅ Redis interface
interface RedisClient {
  lpush(key: string, value: string): Promise<number>;
  rpop(key: string): Promise<string | null>;
  llen(key: string): Promise<number>;
  lrange(key: string, start: number, end: number): Promise<string[]>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
  ping(): Promise<string>;
}

/**
 * Redis-based Queue Repository
 */
export class RedisQueueRepository implements QueueRepositoryInterface {
  private readonly logger = createEnvironmentLogger('RedisQueueRepository');
  private adapterPromise: Promise<import('../types/wallet-queue-adapter').WalletQueueAdapter>;

  constructor(_redisClient?: RedisClient) {
    // ✅ Use environment configuration instead of passing RedisClient
    this.adapterPromise = RedisWalletQueueFactory.create();
    this.logger.info('RedisQueueRepository initialized');
  }

  private async getAdapter() {
    return await this.adapterPromise;
  }

  /**
   * Конвертация приоритета в строку
   */
  private convertPriority(numericPriority: number): 'low' | 'normal' | 'high' | 'urgent' {
    if (numericPriority >= SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.URGENT) {
      return 'urgent';
    } else if (numericPriority >= SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.HIGH) {
      return 'high';
    } else if (numericPriority >= SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.NORMAL) {
      return 'normal';
    }
    return 'low';
  }

  /**
   * Конвертация приоритета в число
   */
  private convertPriorityToNumber(priority: 'low' | 'normal' | 'high' | 'urgent'): number {
    switch (priority) {
      case 'urgent':
        return SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.URGENT;
      case 'high':
        return SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.HIGH;
      case 'normal':
        return SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.NORMAL;
      case 'low':
      default:
        return CONSTANTS.DEFAULT_PRIORITY;
    }
  }

  /**
   * Создание QueueItem из QueueEntry
   */
  private createQueueItem(entry: Omit<QueueEntry, 'id' | 'createdAt'>): {
    currency: CryptoCurrency;
    walletAddress: string;
    correlationId: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  } {
    return {
      currency: entry.currency,
      walletAddress: entry.orderId,
      correlationId: generateId(),
      priority: this.convertPriority(entry.priority),
    };
  }

  /**
   * Создание QueueEntry из QueueItem
   */
  private createQueueEntry(item: QueueItem): QueueEntry {
    return {
      id: item.correlationId,
      orderId: item.walletAddress,
      currency: item.currency,
      priority: this.convertPriorityToNumber(item.priority),
      createdAt: new Date(item.addedAt),
    };
  }

  /**
   * Добавление в очередь
   */
  async addToQueue(entry: Omit<QueueEntry, 'id' | 'createdAt'>): Promise<QueueEntry> {
    this.logger.info('Adding to queue', {
      orderId: entry.orderId,
      currency: entry.currency,
    });

    const queueItem = this.createQueueItem(entry);
    const adapter = await this.getAdapter();
    await adapter.addToQueue(queueItem);

    const createdEntry: QueueEntry = {
      id: queueItem.correlationId,
      orderId: entry.orderId,
      currency: entry.currency,
      priority: entry.priority,
      createdAt: new Date(),
    };

    this.logger.info('Added to queue', { id: createdEntry.id });
    return createdEntry;
  }

  /**
   * Извлечение из очереди - вспомогательная функция
   */
  private async extractQueueItem(currency: CryptoCurrency): Promise<QueueItem | null> {
    const adapter = await this.getAdapter();
    const queueItem = await adapter.getNextFromQueue(currency);

    if (!queueItem) {
      this.logger.debug('Queue empty', { currency });
      return null;
    }

    this.logger.info('Extracted from queue', {
      id: queueItem.correlationId,
      currency,
    });

    return queueItem;
  }

  /**
   * Получить следующий в очереди
   */
  async getNextInQueue(currency: CryptoCurrency): Promise<QueueEntry | null> {
    this.logger.debug('Getting next from queue', { currency });

    const queueItem = await this.extractQueueItem(currency);
    return queueItem ? this.createQueueEntry(queueItem) : null;
  }

  /**
   * Удалить из очереди (no-op для Redis FIFO)
   */
  async removeFromQueue(entryId: string): Promise<void> {
    this.logger.debug('Entry auto-removed by FIFO', { entryId });
  }

  /**
   * Размер очереди
   */
  async getQueueSize(currency: CryptoCurrency): Promise<number> {
    try {
      const adapter = await this.getAdapter();
      const size = await adapter.getQueueSize(currency);
      this.logger.debug('Queue size', { currency, size });
      return size;
    } catch (error) {
      this.logger.error('Queue size error', {
        currency,
        error: error instanceof Error ? error.message : String(error),
      });
      return CONSTANTS.FALLBACK_SIZE;
    }
  }

  /**
   * Поиск позиции в очереди
   */
  private async findQueuePosition(_orderId: string): Promise<number | null> {
    const adapter = await this.getAdapter();
    const allSizes = await adapter.getAllQueueSizes();

    for (const [, size] of Object.entries(allSizes)) {
      const sizeNumber = Number(size);
      if (sizeNumber > CONSTANTS.EMPTY_QUEUE) {
        return sizeNumber; // Приблизительная позиция
      }
    }

    return null;
  }

  /**
   * Позиция в очереди
   */
  async getQueuePosition(orderId: string): Promise<number | null> {
    this.logger.debug('Getting queue position', { orderId });

    try {
      return await this.findQueuePosition(orderId);
    } catch (error) {
      this.logger.error('Queue position error', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Все размеры очередей
   */
  async getAllQueueSizes(): Promise<Record<CryptoCurrency, number>> {
    const adapter = await this.getAdapter();
    return adapter.getAllQueueSizes();
  }

  /**
   * Health check
   */
  async checkHealth(): Promise<boolean> {
    const adapter = await this.getAdapter();
    return adapter.checkHealth();
  }
}
