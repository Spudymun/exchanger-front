import { PrismaClient } from '@prisma/client';

import type { CryptoCurrency } from '@repo/constants';
import type {
  WalletRepositoryInterface,
  WalletInfo,
} from '@repo/exchange-core/src/repositories/wallet-repository-interface';
import { createEnvironmentLogger } from '@repo/utils';

import { BasePostgresAdapter } from './base-postgres-adapter';

// Schema requirements message
const WALLET_SCHEMA_REQUIRED =
  'IMPLEMENTATION_REQUIRED: Add Wallet model to prisma/schema.prisma before using PostgresWalletAdapter';

/**
 * ✅ Clean Prisma wallet object matching database schema
 */
interface PrismaWallet {
  id: string;
  address: string;
  currency: string;
  isOccupied: boolean;
  assignedOrderId?: string | null;
  createdAt: Date;
  lastUsedAt?: Date | null;
}

/**
 * ✅ PostgreSQL adapter for Wallet repository operations
 * Наследует от BasePostgresAdapter для устранения дублирования (Rule 20)
 *
 * NOTE: Requires Wallet model in Prisma schema:
 * model Wallet {
 *   id              String    @id @default(cuid())
 *   address         String    @unique
 *   currency        String
 *   isOccupied      Boolean   @default(false)
 *   assignedOrderId String?
 *   createdAt       DateTime  @default(now())
 *   lastUsedAt      DateTime?
 *   @@map("wallets")
 * }
 */
export class PostgresWalletAdapter
  extends BasePostgresAdapter
  implements WalletRepositoryInterface
{
  private logger = createEnvironmentLogger('PostgresWalletAdapter');

  constructor(private prismaClient: PrismaClient) {
    super(prismaClient);
  }

  async findByAddress(address: string): Promise<WalletInfo | null> {
    this.validateRequired(address, 'address');

    // NOTE: Requires Wallet model in schema.prisma:
    // model Wallet {
    //   id              String    @id @default(cuid())
    //   address         String    @unique
    //   currency        String
    //   isOccupied      Boolean   @default(false)
    //   assignedOrderId String?
    //   createdAt       DateTime  @default(now())
    //   lastUsedAt      DateTime?
    //   @@map("wallets")
    // }

    throw new Error(WALLET_SCHEMA_REQUIRED);
  }

  async findAvailable(currency: CryptoCurrency): Promise<WalletInfo[]> {
    this.validateRequired(currency, 'currency');
    throw new Error(WALLET_SCHEMA_REQUIRED);
  }

  async findOccupied(currency: CryptoCurrency): Promise<WalletInfo[]> {
    this.validateRequired(currency, 'currency');
    throw new Error(WALLET_SCHEMA_REQUIRED);
  }

  async findOldestAvailable(currency: CryptoCurrency): Promise<WalletInfo | null> {
    this.validateRequired(currency, 'currency');
    throw new Error(WALLET_SCHEMA_REQUIRED);
  }

  async markAsOccupied(_address: string, _orderId: string): Promise<WalletInfo | null> {
    this.validateRequired(_address, 'address');
    this.validateRequired(_orderId, 'orderId');
    this.validateSchema();
    return null; // Unreachable due to validateSchema()
  }

  async markAsAvailable(_address: string): Promise<WalletInfo | null> {
    this.validateRequired(_address, 'address');
    this.validateSchema();
    return null; // Unreachable due to validateSchema()
  }

  async findByCurrency(_currency: CryptoCurrency): Promise<WalletInfo[]> {
    this.validateRequired(_currency, 'currency');
    this.validateSchema();
    return []; // Unreachable due to validateSchema()
  }

  async findByOrderId(_orderId: string): Promise<WalletInfo | null> {
    this.validateRequired(_orderId, 'orderId');
    this.validateSchema();
    return null; // Unreachable due to validateSchema()
  }

  /**
   * ✅ Map Prisma wallet object to domain WalletInfo
   * Follows existing mapping patterns from PostgresOrderAdapter
   */
  private mapPrismaToWallet(prismaWallet: PrismaWallet): WalletInfo {
    return {
      id: prismaWallet.id,
      address: prismaWallet.address,
      currency: prismaWallet.currency as CryptoCurrency,
      isOccupied: prismaWallet.isOccupied,
      createdAt: prismaWallet.createdAt,
      assignedOrderId: prismaWallet.assignedOrderId || undefined,
      lastUsedAt: prismaWallet.lastUsedAt || undefined,
    };
  }
}
