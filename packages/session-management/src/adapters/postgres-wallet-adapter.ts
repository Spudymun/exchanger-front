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

      return wallets.map((wallet: PrismaWallet) => this.mapPrismaToWallet(wallet));
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

      return wallets.map((wallet: PrismaWallet) => this.mapPrismaToWallet(wallet));
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
      const whereClause: {
        currency: string;
        status: WalletStatus;
        tokenStandard?: string;
      } = {
        currency,
        status: WalletStatus.AVAILABLE,
      };

      if (currency === 'USDT' && tokenStandard) {
        whereClause.tokenStandard = tokenStandard;
      }

      const wallet = await this.prismaClient.wallet.findFirst({
        where: whereClause,
        orderBy: { lastUsedAt: 'asc' },
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

      return wallets.map((wallet: PrismaWallet) => this.mapPrismaToWallet(wallet));
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
   * 
   * Использует простой Prisma подход без raw SQL для избежания connection pool exhaustion
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
      const whereClause = this.buildWhereClause(currency, tokenStandard);
      const selectedWallet = await this.selectLeastUsedWallet(whereClause);
      
      if (!selectedWallet) {
        return null;
      }

      return await this.incrementWalletUsage(selectedWallet);
    } catch (error) {
      this.handleError(error, 'findLeastUsedOccupied');
      return null;
    }
  }

  /**
   * Строит WHERE условие для поиска кошельков
   */
  private buildWhereClause(currency: CryptoCurrency, tokenStandard?: string) {
    const whereClause: {
      currency: string;
      tokenStandard?: string;
      disabledAt?: null;
    } = {
      currency,
      disabledAt: null,
    };

    if (currency === 'USDT' && tokenStandard) {
      whereClause.tokenStandard = tokenStandard;
    }

    return whereClause;
  }

  /**
   * Выбирает случайный кошелек с минимальным total_orders
   */
  private async selectLeastUsedWallet(whereClause: {
    currency: string;
    tokenStandard?: string;
    disabledAt?: null;
  }) {
    const wallets = await this.prismaClient.wallet.findMany({
      where: whereClause,
      orderBy: { totalOrders: 'asc' },
      take: 10,
    });

    if (!wallets || wallets.length === 0) {
      return null;
    }

    const firstWallet = wallets[0];
    if (!firstWallet) {
      return null;
    }

    const candidateWallets = wallets.filter(
      (w: PrismaWallet) => w.totalOrders === firstWallet.totalOrders
    );

    if (candidateWallets.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * candidateWallets.length);
    const selected = candidateWallets.at(randomIndex);
    return selected ?? null;
  }

  /**
   * Атомарно инкрементирует счетчик использования кошелька
   */
  private async incrementWalletUsage(wallet: PrismaWallet) {
    const updatedWallet = await this.prismaClient.wallet.update({
      where: { id: wallet.id },
      data: {
        totalOrders: { increment: 1 },
        lastUsedAt: new Date(),
        ...(wallet.status === WalletStatus.AVAILABLE && {
          status: WalletStatus.ALLOCATED,
        }),
      },
    });

    return this.mapPrismaToWallet(updatedWallet);
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
        .map((item: { currency: string }) => item.currency as CryptoCurrency)
        .filter((currency: CryptoCurrency) =>
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
        .map((item: { tokenStandard: string | null }) => item.tokenStandard)
        .filter(
          (standard: string | null): standard is string =>
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
