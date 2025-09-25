import type { WalletRepositoryInterface } from '../../repositories';
import type { CryptoCurrency } from '../../types';

import type {
  WalletAllocationStrategy,
  AllocationResult,
  PoolStats,
} from './wallet-allocation-strategy';

/**
 * Стратегия немедленного выделения кошельков
 * Реализует только реальные кошельки из базы данных (FIFO подход)
 */
export class ImmediateAllocationStrategy implements WalletAllocationStrategy {
  constructor(private walletRepository: WalletRepositoryInterface) {}

  async allocateWallet(currency: CryptoCurrency): Promise<AllocationResult> {
    try {
      // Пытаемся найти свободный кошелек в базе данных (FIFO)
      const availableWallet = await this.walletRepository.findOldestAvailable(currency);

      if (availableWallet) {
        // Отмечаем кошелек как занятый
        const walletInfo = await this.walletRepository.markAsOccupied(
          availableWallet.address,
          `allocation-${Date.now()}`
        );

        return {
          success: true,
          address: availableWallet.address,
          walletInfo: walletInfo || availableWallet,
        };
      }

      // AC2.3: Умная очередь кошельков - используем самый старый занятый кошелек
      const oldestOccupiedWallet = await this.walletRepository.findOldestOccupied(currency);
      
      if (oldestOccupiedWallet) {
        // НЕМЕДЛЕННОЕ создание заявки с занятым кошельком (без изменения статуса кошелька)
        return {
          success: true,
          address: oldestOccupiedWallet.address,
          walletInfo: oldestOccupiedWallet,
          usedOldestOccupiedWallet: true, // Флаг для индикации режима повторного использования
        };
      }

      // Нет ни свободных, ни занятых кошельков - критическая ошибка
      return {
        success: false,
        error: `No wallets available for currency ${currency}. Wallet pool is empty.`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown allocation error',
      };
    }
  }

  async releaseWallet(address: string): Promise<AllocationResult> {
    try {
      const walletInfo = await this.walletRepository.markAsAvailable(address);

      if (walletInfo) {
        return {
          success: true,
          address,
          walletInfo,
        };
      }

      // Если кошелек не найден в базе (возможно mock), считаем операцию успешной
      return {
        success: true,
        address,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown release error',
      };
    }
  }

  async getPoolStats(currency: CryptoCurrency): Promise<PoolStats> {
    try {
      const [allWallets, availableWallets, occupiedWallets] = await Promise.all([
        this.walletRepository.findByCurrency(currency),
        this.walletRepository.findAvailable(currency),
        this.walletRepository.findOccupied(currency),
      ]);

      return {
        currency,
        totalWallets: allWallets.length,
        availableWallets: availableWallets.length,
        occupiedWallets: occupiedWallets.length,
        queueSize: 0, // ImmediateAllocation не использует очереди
        lastActivity: new Date(),
      };
    } catch {
      // Возвращаем пустую статистику при ошибке
      return {
        currency,
        totalWallets: 0,
        availableWallets: 0,
        occupiedWallets: 0,
        queueSize: 0,
        lastActivity: new Date(),
      };
    }
  }

  async isWalletAvailable(address: string): Promise<boolean> {
    try {
      const wallet = await this.walletRepository.findByAddress(address);
      return wallet ? !wallet.isOccupied : false; // Только реальные кошельки
    } catch {
      return false;
    }
  }
}
