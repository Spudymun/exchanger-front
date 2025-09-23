import { PrismaClient, WalletStatus } from '@prisma/client';

import type { CryptoCurrency } from '@repo/constants';
import { CRYPTOCURRENCIES } from '@repo/constants';
import type {
  WalletRepositoryInterface,
  WalletInfo,
} from '@repo/exchange-core/src/repositories/wallet-repository-interface';
import { createEnvironmentLogger } from '@repo/utils';

import { BasePostgresAdapter } from './base-postgres-adapter';

/**
 * ✅ Clean Prisma wallet object matching REAL database schema
 */
interface PrismaWallet {
  id: string;
  address: string;
  currency: string;
  status: WalletStatus; // Use enum instead of hardcoded strings
  label?: string | null;
  notes?: string | null;
  totalOrders: number;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  disabledAt?: Date | null;
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

    try {
      const wallet = await this.prismaClient.wallet.findUnique({
        where: { address },
      });

      return wallet ? this.mapPrismaToWallet(wallet) : null;
    } catch (error) {
      this.handleError(error, 'findByAddress');
    }
  }

  async findAvailable(currency: CryptoCurrency): Promise<WalletInfo[]> {
    this.validateRequired(currency, 'currency');

    try {
      const wallets = await this.prismaClient.wallet.findMany({
        where: {
          currency,
          status: WalletStatus.AVAILABLE,
        },
        orderBy: { createdAt: 'asc' }, // FIFO order
      });

      return wallets.map(wallet => this.mapPrismaToWallet(wallet));
    } catch (error) {
      this.handleError(error, 'findAvailable');
    }
  }

  async findOccupied(currency: CryptoCurrency): Promise<WalletInfo[]> {
    this.validateRequired(currency, 'currency');

    try {
      const wallets = await this.prismaClient.wallet.findMany({
        where: {
          currency,
          status: WalletStatus.ALLOCATED,
        },
      });

      return wallets.map(wallet => this.mapPrismaToWallet(wallet));
    } catch (error) {
      this.handleError(error, 'findOccupied');
    }
  }

  async findOldestAvailable(currency: CryptoCurrency): Promise<WalletInfo | null> {
    this.validateRequired(currency, 'currency');

    try {
      const wallet = await this.prismaClient.wallet.findFirst({
        where: {
          currency,
          status: WalletStatus.AVAILABLE,
        },
        orderBy: { lastUsedAt: 'asc' }, // FIFO: oldest used first
      });

      return wallet ? this.mapPrismaToWallet(wallet) : null;
    } catch (error) {
      this.handleError(error, 'findOldestAvailable');
    }
  }

  async markAsOccupied(address: string, orderId: string): Promise<WalletInfo | null> {
    this.validateRequired(address, 'address');
    this.validateRequired(orderId, 'orderId');

    try {
      const wallet = await this.prismaClient.wallet.update({
        where: { address },
        data: {
          status: WalletStatus.ALLOCATED,
          lastUsedAt: new Date(),
        },
      });

      return this.mapPrismaToWallet(wallet);
    } catch (error) {
      this.handleError(error, 'markAsOccupied');
    }
  }

  async markAsAvailable(address: string): Promise<WalletInfo | null> {
    this.validateRequired(address, 'address');

    try {
      const wallet = await this.prismaClient.wallet.update({
        where: { address },
        data: {
          status: WalletStatus.AVAILABLE,
          lastUsedAt: new Date(),
        },
      });

      return this.mapPrismaToWallet(wallet);
    } catch (error) {
      this.handleError(error, 'markAsAvailable');
    }
  }

  async findByCurrency(currency: CryptoCurrency): Promise<WalletInfo[]> {
    this.validateRequired(currency, 'currency');

    try {
      const wallets = await this.prismaClient.wallet.findMany({
        where: { currency },
      });

      return wallets.map(wallet => this.mapPrismaToWallet(wallet));
    } catch (error) {
      this.handleError(error, 'findByCurrency');
    }
  }

  async findByOrderId(orderId: string): Promise<WalletInfo | null> {
    this.validateRequired(orderId, 'orderId');

    try {
      // Find wallet through Order relation
      const order = await this.prismaClient.order.findUnique({
        where: { id: orderId },
        include: { wallet: true },
      });

      return order?.wallet ? this.mapPrismaToWallet(order.wallet) : null;
    } catch (error) {
      this.handleError(error, 'findByOrderId');
    }
  }

  async findOldestOccupied(currency: CryptoCurrency): Promise<WalletInfo | null> {
    this.validateRequired(currency, 'currency');
    
    // Validate currency against supported cryptocurrencies
    if (!CRYPTOCURRENCIES.includes(currency as typeof CRYPTOCURRENCIES[number])) {
      throw new Error(`Unsupported currency: ${currency}. Supported currencies: ${CRYPTOCURRENCIES.join(', ')}`);
    }

    try {
      const wallet = await this.prismaClient.wallet.findFirst({
        where: {
          currency,
          status: WalletStatus.ALLOCATED, // Только занятые кошельки
        },
        orderBy: { lastUsedAt: 'asc' }, // FIFO: самый старый занятый
      });

      return wallet ? this.mapPrismaToWallet(wallet) : null;
    } catch (error) {
      this.handleError(error, 'findOldestOccupied');
    }
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
      isOccupied: prismaWallet.status === 'ALLOCATED', // Map status to isOccupied
      createdAt: prismaWallet.createdAt,
      assignedOrderId: undefined, // Will be populated through orders relation when needed
      lastUsedAt: prismaWallet.lastUsedAt || undefined,
    };
  }
}
