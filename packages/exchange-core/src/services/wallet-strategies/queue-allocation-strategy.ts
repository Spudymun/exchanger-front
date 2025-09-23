import { WALLET_ALLOCATION_UTILS, WALLET_ALLOCATION_CONSTANTS } from '@repo/constants';

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
      /**
       * Пытаемся найти свободный кошелек (FIFO)
       */
      const availableResult = await this.tryAllocateAvailableWallet(currency);
      if (availableResult) return availableResult;

      /**
       * 🆕 НОВАЯ ЛОГИКА: Ищем самый старый занятый кошелек
       */
      const occupiedResult = await this.tryAllocateOldestOccupiedWallet(currency);
      if (occupiedResult) return occupiedResult;

      /**
       * Нет ни свободных, ни занятых кошельков - добавляем в очередь
       */
      return await this.addToQueue(currency);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown allocation error',
      };
    }
  }

  /**
   * Попытка выделить доступный кошелек
   */
  private async tryAllocateAvailableWallet(currency: CryptoCurrency): Promise<AllocationResult | null> {
    const availableWallet = await this.walletRepository.findOldestAvailable(currency);

    if (!availableWallet) return null;

    /**
     * Отмечаем кошелек как занятый
     */
    const walletInfo = await this.walletRepository.markAsOccupied(
      availableWallet.address,
      WALLET_ALLOCATION_UTILS.generateAllocationKey()
    );

    return {
      success: true,
      address: availableWallet.address,
      walletInfo: walletInfo || availableWallet,
      usedOldestOccupiedWallet: false, // Использован свободный кошелек
    };
  }

  /**
   * 🆕 Попытка выделить самый старый занятый кошелек
   */
  private async tryAllocateOldestOccupiedWallet(currency: CryptoCurrency): Promise<AllocationResult | null> {
    const oldestOccupiedWallet = await this.walletRepository.findOldestOccupied(currency);

    if (!oldestOccupiedWallet) return null;

    /**
     * 🆕 НЕМЕДЛЕННОЕ создание заявки с занятым кошельком
     */
    return {
      success: true, // ✅ СРАЗУ успех вместо очереди
      address: oldestOccupiedWallet.address,
      walletInfo: oldestOccupiedWallet,
      usedOldestOccupiedWallet: true, // 🆕 Флаг использования занятого
    };
  }

  /**
   * Добавление в очередь при отсутствии кошельков
   */
  private async addToQueue(currency: CryptoCurrency): Promise<AllocationResult> {
    const queueEntry = await this.queueRepository.addToQueue({
      orderId: WALLET_ALLOCATION_UTILS.generateQueueKey(),
      currency,
      priority: WALLET_ALLOCATION_CONSTANTS.PRIORITIES.STANDARD,
    });

    return {
      success: false, // Кошелек не выделен немедленно
      queuePosition: await this.getQueuePosition(queueEntry.id, currency),
    };
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
    currency: CryptoCurrency,
    useAsyncQueue = false // ✅ НОВЫЙ параметр для async обработки (по умолчанию выключен)
  ): Promise<void> {
    try {
      if (useAsyncQueue && this.emailNotifier.sendWalletReadyEmailAsync) {
        await this.tryAsyncEmailSend(orderId, address, currency);
        return;
      }

      // ✅ СУЩЕСТВУЮЩЕЕ: Синхронная отправка (по умолчанию)
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

  private async tryAsyncEmailSend(
    orderId: string,
    address: string,
    currency: CryptoCurrency
  ): Promise<void> {
    const { orderManager, userManager } = await import('../../data/manager');
    const order = await orderManager.findById(orderId);

    if (!order) {
      // Fallback к синхронной отправке если не найден order
      await this.emailNotifier.sendWalletReadyEmail(orderId, address, currency);
      return;
    }

    const user = await userManager.findById(order.userId);
    if (!user) {
      // Fallback к синхронной отправке если не найден user
      await this.emailNotifier.sendWalletReadyEmail(orderId, address, currency);
      return;
    }

    await this.emailNotifier.sendWalletReadyEmailAsync?.(order, user, address, currency);
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
