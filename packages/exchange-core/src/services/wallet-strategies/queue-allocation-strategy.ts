import type { QueueRepositoryInterface, WalletRepositoryInterface } from '../../repositories';
import type { QueueEntry } from '../../repositories/queue-repository-interface';
import type { WalletInfo } from '../../repositories/wallet-repository-interface.js';
import type { CryptoCurrency } from '../../types';
import { createQueueEmailNotifier, type QueueEmailNotifier } from '../queue-email-notifier';

import type {
  WalletAllocationStrategy,
  AllocationResult,
  PoolStats,
} from './wallet-allocation-strategy';

/**
 * Стратегия FIFO очереди для кошельков
 * Реализует AC3.2-3.4 требования
 */
export class QueueAllocationStrategy implements WalletAllocationStrategy {
  private emailNotifier: QueueEmailNotifier;

  constructor(
    private walletRepository: WalletRepositoryInterface,
    private queueRepository: QueueRepositoryInterface
  ) {
    this.emailNotifier = createQueueEmailNotifier();
  }

  async allocateWallet(currency: CryptoCurrency): Promise<AllocationResult> {
    try {
      // Пытаемся найти свободный кошелек (FIFO)
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

      // Нет свободных кошельков - добавляем в очередь
      const queueEntry = await this.queueRepository.addToQueue({
        orderId: `queue-${Date.now()}`,
        currency,
        priority: 1, // Стандартный приоритет
      });

      return {
        success: false, // Кошелек не выделен немедленно
        queuePosition: await this.getQueuePosition(queueEntry.id, currency),
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
      // Освобождаем кошелек
      const walletInfo = await this.walletRepository.markAsAvailable(address);

      if (!walletInfo) {
        return {
          success: false,
          error: 'Wallet not found',
        };
      }

      // Обрабатываем очередь для этой валюты
      return await this.processQueue(address, walletInfo);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown release error',
      };
    }
  }

  /**
   * Обработать очередь при освобождении кошелька
   */
  private async processQueue(address: string, walletInfo: WalletInfo): Promise<AllocationResult> {
    const nextInQueue = await this.queueRepository.getNextInQueue(walletInfo.currency);

    if (nextInQueue) {
      return await this.assignWalletToNextInQueue(address, walletInfo, nextInQueue);
    }

    return {
      success: true,
      address,
      walletInfo,
    };
  }

  /**
   * Выделить кошелек следующему в очереди
   */
  private async assignWalletToNextInQueue(
    address: string,
    walletInfo: WalletInfo,
    nextInQueue: QueueEntry
  ): Promise<AllocationResult> {
    // Автоматически выделяем кошелек следующему в очереди
    const assignedWallet = await this.walletRepository.markAsOccupied(address, nextInQueue.orderId);

    // Удаляем из очереди
    await this.queueRepository.removeFromQueue(nextInQueue.id);

    // 🎯 TASK 5.2: Отправка email уведомления о готовности кошелька
    await this.sendEmailNotificationSafely(nextInQueue.orderId, address, walletInfo.currency);

    return {
      success: true,
      address,
      walletInfo: assignedWallet || walletInfo,
    };
  }

  /**
   * Безопасная отправка email уведомления
   */
  private async sendEmailNotificationSafely(
    orderId: string,
    address: string,
    currency: CryptoCurrency
  ): Promise<void> {
    try {
      await this.emailNotifier.sendWalletReadyEmail(orderId, address, currency);
    } catch (emailError) {
      // Не прерываем workflow при ошибке email - кошелек уже выделен
      const { createEnvironmentLogger } = await import('@repo/utils');
      const logger = createEnvironmentLogger('QueueAllocationStrategy');
      logger.error('Failed to send wallet ready email', {
        orderId,
        address,
        currency,
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
      });
    }
  }

  async getPoolStats(currency: CryptoCurrency): Promise<PoolStats> {
    try {
      const [allWallets, availableWallets, occupiedWallets, queueSize] = await Promise.all([
        this.walletRepository.findByCurrency(currency),
        this.walletRepository.findAvailable(currency),
        this.walletRepository.findOccupied(currency),
        this.queueRepository.getQueueSize(currency),
      ]);

      return {
        currency,
        totalWallets: allWallets.length,
        availableWallets: availableWallets.length,
        occupiedWallets: occupiedWallets.length,
        queueSize,
        lastActivity: new Date(),
      };
    } catch {
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
      return wallet ? !wallet.isOccupied : false;
    } catch {
      return false;
    }
  }

  /**
   * Получить позицию в очереди
   */
  private async getQueuePosition(queueId: string, _currency: CryptoCurrency): Promise<number> {
    const DEFAULT_POSITION = 1;

    try {
      const position = await this.queueRepository.getQueuePosition(queueId);
      return position ?? DEFAULT_POSITION;
    } catch {
      return DEFAULT_POSITION; // Fallback позиция
    }
  }
}
