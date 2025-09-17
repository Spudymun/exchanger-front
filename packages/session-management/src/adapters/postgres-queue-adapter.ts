import { PrismaClient } from '@prisma/client';

import type { CryptoCurrency } from '@repo/constants';
import type { QueueRepositoryInterface } from '@repo/exchange-core/src/repositories/queue-repository-interface';
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
 * ✅ Clean Prisma queue object matching database schema
 */
interface PrismaQueue {
  id: string;
  orderId: string;
  currency: string;
  priority: number;
  createdAt: Date;
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

  constructor(private prismaClient: PrismaClient) {
    super(prismaClient);
  }

  async addToQueue(_entry: Omit<QueueEntry, 'id' | 'createdAt'>): Promise<QueueEntry> {
    this.validateRequired(_entry, 'entry');
    this.validateSchema(); // Выбросит централизованную ошибку

    // Unreachable code but required for TypeScript
    return {
      id: '',
      orderId: _entry.orderId,
      currency: _entry.currency,
      priority: _entry.priority,
      createdAt: new Date(),
    };
  }

  async getNextInQueue(_currency: CryptoCurrency): Promise<QueueEntry | null> {
    this.validateRequired(_currency, 'currency');
    this.validateSchema();
    return null; // Unreachable due to validateSchema()
  }

  async removeFromQueue(_entryId: string): Promise<void> {
    this.validateRequired(_entryId, 'entryId');
    this.validateSchema();
    // Unreachable due to validateSchema()
  }

  async getQueueSize(_currency: CryptoCurrency): Promise<number> {
    this.validateRequired(_currency, 'currency');
    this.validateSchema();
    return 0; // Unreachable due to validateSchema()
  }

  async getQueuePosition(_orderId: string): Promise<number | null> {
    this.validateRequired(_orderId, 'orderId');
    this.validateSchema();
    return null; // Unreachable due to validateSchema()
  }

  /**
   * ✅ Map Prisma queue object to domain QueueEntry
   * Follows existing mapping patterns from PostgresOrderAdapter
   */
  private mapPrismaToQueue(prismaQueue: PrismaQueue): QueueEntry {
    return {
      id: prismaQueue.id,
      orderId: prismaQueue.orderId,
      currency: prismaQueue.currency as CryptoCurrency,
      priority: prismaQueue.priority,
      createdAt: prismaQueue.createdAt,
    };
  }
}
