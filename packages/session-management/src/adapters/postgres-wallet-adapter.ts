import { PrismaClient, WalletStatus } from '@prisma/client';

import type { CryptoCurrency } from '@repo/constants';
import { CRYPTOCURRENCIES } from '@repo/constants';
import type { WalletRepositoryInterface, WalletInfo } from '@repo/exchange-core';
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
  tokenStandard: string | null; // ✅ ИСПРАВЛЕНО: добавляем tokenStandard из схемы базы данных
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

  async findOldestAvailable(
    currency: CryptoCurrency,
    tokenStandard?: string
  ): Promise<WalletInfo | null> {
    this.validateRequired(currency, 'currency');

    try {
      // ✅ ИСПРАВЛЕНО: поиск с учетом tokenStandard только для USDT
      const whereClause: {
        currency: string;
        status: WalletStatus;
        tokenStandard?: string;
      } = {
        currency,
        status: WalletStatus.AVAILABLE,
      };

      // Добавляем фильтр по tokenStandard только для USDT
      if (currency === 'USDT' && tokenStandard) {
        whereClause.tokenStandard = tokenStandard;
      }

      const wallet = await this.prismaClient.wallet.findFirst({
        where: whereClause,
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
          // totalOrders обновляется в findLeastUsedOccupied атомарно
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

  async findOldestOccupied(
    currency: CryptoCurrency,
    tokenStandard?: string
  ): Promise<WalletInfo | null> {
    this.validateRequired(currency, 'currency');

    // Validate currency against supported cryptocurrencies
    if (!CRYPTOCURRENCIES.includes(currency as (typeof CRYPTOCURRENCIES)[number])) {
      throw new Error(
        `Unsupported currency: ${currency}. Supported currencies: ${CRYPTOCURRENCIES.join(', ')}`
      );
    }

    try {
      // ✅ ИСПРАВЛЕНО: поиск с учетом tokenStandard только для USDT
      const whereClause: {
        currency: string;
        status: WalletStatus;
        tokenStandard?: string;
      } = {
        currency,
        status: WalletStatus.ALLOCATED, // Только занятые кошельки
      };

      // Добавляем фильтр по tokenStandard только для USDT
      if (currency === 'USDT' && tokenStandard) {
        whereClause.tokenStandard = tokenStandard;
      }

      const wallet = await this.prismaClient.wallet.findFirst({
        where: whereClause,
        orderBy: { lastUsedAt: 'asc' }, // FIFO: самый старый занятый
      });

      return wallet ? this.mapPrismaToWallet(wallet) : null;
    } catch (error) {
      this.handleError(error, 'findOldestOccupied');
    }
  }

  /**
   * 🎯 ПРАВИЛЬНАЯ РЕАЛИЗАЦИЯ: Находит кошелек с минимальным количеством заказов
   * и атомарно инкрементирует счетчик. Работает ТОЛЬКО с total_orders, игнорирует статусы.
   */
  async findLeastUsedOccupied(
    currency: CryptoCurrency,
    tokenStandard?: string
  ): Promise<WalletInfo | null> {
    this.validateRequired(currency, 'currency');

    if (!CRYPTOCURRENCIES.includes(currency as (typeof CRYPTOCURRENCIES)[number])) {
      throw new Error(
        `Unsupported currency: ${currency}. Supported currencies: ${CRYPTOCURRENCIES.join(', ')}`
      );
    }

    try {
      return await this.prismaClient.$transaction(async tx => {
        // 1. Поиск кошелька с минимальным total_orders (без учета статуса!)
        const whereClause: {
          currency: string;
          tokenStandard?: string;
          disabledAt?: null;
        } = {
          currency,
          disabledAt: null, // Исключаем только отключенные кошельки
        };

        // Фильтр по tokenStandard для multi-network токенов
        if (currency === 'USDT' && tokenStandard) {
          whereClause.tokenStandard = tokenStandard;
        }

        const wallet = await tx.wallet.findFirst({
          where: whereClause,
          orderBy: [
            { totalOrders: 'asc' }, // Основной критерий: минимум заказов
            { createdAt: 'asc' }, // При равенстве: старший кошелек
          ],
        });

        if (!wallet) {
          return null;
        }

        // 2. Атомарно инкрементируем total_orders И меняем статус только если был available
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            totalOrders: { increment: 1 },
            lastUsedAt: new Date(),
            // Меняем статус на ALLOCATED только если кошелек был AVAILABLE
            ...(wallet.status === WalletStatus.AVAILABLE && {
              status: WalletStatus.ALLOCATED,
            }),
          },
        });

        return this.mapPrismaToWallet(updatedWallet);
      });
    } catch (error) {
      this.handleError(error, 'findLeastUsedOccupied');
      return null;
    }
  }

  // ✅ ДОБАВЛЕНО: методы для получения уникальных валют и стандартов токенов из БД
  // Для миграции CRYPTO_SELECTOR_DATABASE_MIGRATION_PLAN.md
  async findDistinctCurrencies(): Promise<CryptoCurrency[]> {
    try {
      const result = await this.prismaClient.wallet.findMany({
        select: { currency: true },
        distinct: ['currency'],
      });

      return result
        .map(item => item.currency as CryptoCurrency)
        .filter(currency =>
          CRYPTOCURRENCIES.includes(currency as (typeof CRYPTOCURRENCIES)[number])
        );
    } catch (error) {
      this.handleError(error, 'findDistinctCurrencies');
    }
  }

  async findDistinctTokenStandards(): Promise<string[]> {
    try {
      const result = await this.prismaClient.wallet.findMany({
        select: { tokenStandard: true },
        distinct: ['tokenStandard'],
        where: {
          tokenStandard: { not: null },
        },
      });

      return result
        .map(item => item.tokenStandard)
        .filter(
          (standard): standard is string =>
            standard !== null && standard !== undefined && standard.length > 0
        );
    } catch (error) {
      this.handleError(error, 'findDistinctTokenStandards');
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
      tokenStandard: prismaWallet.tokenStandard || undefined, // ✅ ИСПРАВЛЕНО: маппинг tokenStandard из базы данных
    };
  }
}
