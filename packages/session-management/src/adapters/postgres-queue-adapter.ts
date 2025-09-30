import { PrismaClient, QueuePriority } from '@prisma/client';

import type { CryptoCurrency } from '@repo/constants';
import { SESSION_CONSTANTS } from '@repo/constants';
import type { QueueRepositoryInterface } from '@repo/exchange-core';
import { createEnvironmentLogger } from '@repo/utils';

import { BasePostgresAdapter } from './base-postgres-adapter';

/**
 * QueueEntry type definition (mirroring exchange-core interface)
 */
interface QueueEntry {
  id: string;
  orderId: string;
  currency: CryptoCurrency;
  priority: number;
  createdAt: Date;
}

/**
 * ✅ Clean Prisma queue object matching REAL database schema
 */
interface PrismaQueue {
  id: string;
  orderId: string;
  walletId?: string | null;
  currency: string;
  priority: QueuePriority;
  position: number;
  createdAt: Date;
  processedAt?: Date | null;
  expiresAt?: Date | null;
  retryCount: number;
  lastError?: string | null;
  metadata?: unknown;
}

/**
 * ✅ PostgreSQL adapter for Queue repository operations
 * Наследует от BasePostgresAdapter для устранения дублирования (Rule 20)
 *
 * NOTE: Requires WalletQueue model in Prisma schema:
 * model WalletQueue {
 *   id        String    @id @default(cuid())
 *   orderId   String
 *   currency  String
 *   priority  Int       @default(1)
 *   createdAt DateTime  @default(now())
 *   @@map("wallet_queues"))
 * }
 */
export class PostgresQueueAdapter extends BasePostgresAdapter implements QueueRepositoryInterface {
  private logger = createEnvironmentLogger('PostgresQueueAdapter');

  constructor(protected prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * ✅ Adds order to queue with REAL Prisma queries
   */
  async addToQueue(entry: Omit<QueueEntry, 'id' | 'createdAt'>): Promise<QueueEntry> {
    this.validateRequired(entry, 'entry');

    try {
      const position = await this.getNextPosition();

      const createdQueue = await this.prisma.walletQueue.create({
        data: {
          orderId: entry.orderId,
          currency: entry.currency,
          priority: this.mapPriorityToPrisma(entry.priority),
          position,
          retryCount: 0,
        },
      });

      this.logger.info(`Added order ${entry.orderId} to queue at position ${position}`);
      return this.mapToDomain(createdQueue);
    } catch (error) {
      this.logger.error('Failed to add to queue:', { error: String(error) });
      throw error;
    }
  }

  /**
   * ✅ Gets next queue entry with REAL Prisma queries
   */
  async getNextInQueue(currency?: CryptoCurrency): Promise<QueueEntry | null> {
    try {
      const where: { currency?: string } = {};
      if (currency) {
        where.currency = currency;
      }

      const nextQueue = await this.prisma.walletQueue.findFirst({
        where,
        orderBy: [
          { priority: 'desc' }, // Higher priority first (URGENT > HIGH > NORMAL > LOW)
          { position: 'asc' }, // Then by position (first in queue)
          { createdAt: 'asc' }, // Then by creation time
        ],
      });

      return nextQueue ? this.mapToDomain(nextQueue) : null;
    } catch (error) {
      this.logger.error('Failed to get next in queue:', { error: String(error) });
      throw error;
    }
  }

  /**
   * ✅ Removes entry from queue with REAL Prisma queries
   */
  async removeFromQueue(entryId: string): Promise<void> {
    this.validateRequired(entryId, 'entryId');

    try {
      await this.prisma.walletQueue.delete({
        where: { id: entryId },
      });

      this.logger.info(`Removed queue entry ${entryId}`);
    } catch (error) {
      this.logger.error(`Failed to remove queue entry ${entryId}:`, { error: String(error) });
      throw error;
    }
  }

  /**
   * ✅ Gets queue size with REAL Prisma queries
   */
  async getQueueSize(currency?: CryptoCurrency): Promise<number> {
    try {
      const where: { currency?: string } = {};
      if (currency) {
        where.currency = currency;
      }

      return await this.prisma.walletQueue.count({ where });
    } catch (error) {
      this.logger.error('Failed to get queue size:', { error: String(error) });
      throw error;
    }
  }

  /**
   * ✅ Gets queue position with REAL Prisma queries
   */
  async getQueuePosition(orderId: string): Promise<number | null> {
    this.validateRequired(orderId, 'orderId');

    try {
      const queueEntry = await this.prisma.walletQueue.findFirst({
        where: { orderId },
      });

      return queueEntry?.position ?? null;
    } catch (error) {
      this.logger.error(`Failed to get queue position for ${orderId}:`, { error: String(error) });
      throw error;
    }
  }

  /**
   * Gets the next available position in the queue
   */
  private async getNextPosition(): Promise<number> {
    const lastEntry = await this.prisma.walletQueue.findFirst({
      orderBy: { position: 'desc' },
    });

    return (lastEntry?.position ?? 0) + 1;
  }

  /**
   * ✅ Map Prisma queue object to domain QueueEntry
   * Follows existing mapping patterns from PostgresOrderAdapter
   */
  private mapToDomain(prismaQueue: PrismaQueue): QueueEntry {
    return {
      id: prismaQueue.id,
      orderId: prismaQueue.orderId,
      currency: prismaQueue.currency as CryptoCurrency,
      priority: this.mapPriorityToDomain(prismaQueue.priority),
      createdAt: prismaQueue.createdAt,
    };
  }

  /**
   * Maps Prisma QueuePriority enum to domain number
   */
  private mapPriorityToDomain(priority: QueuePriority): number {
    switch (priority) {
      case QueuePriority.LOW:
        return SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.LOW;
      case QueuePriority.NORMAL:
        return SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.NORMAL;
      case QueuePriority.HIGH:
        return SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.HIGH;
      case QueuePriority.URGENT:
        return SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.URGENT;
      default:
        return SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.NORMAL; // Default to NORMAL
    }
  }

  /**
   * Maps domain priority number to Prisma QueuePriority enum
   */
  private mapPriorityToPrisma(priority: number): QueuePriority {
    switch (priority) {
      case SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.LOW:
        return QueuePriority.LOW;
      case SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.NORMAL:
        return QueuePriority.NORMAL;
      case SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.HIGH:
        return QueuePriority.HIGH;
      case SESSION_CONSTANTS.REDIS.QUEUE_PRIORITIES.URGENT:
        return QueuePriority.URGENT;
      default:
        return QueuePriority.NORMAL; // Default fallback
    }
  }
}
