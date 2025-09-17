import type { QueueRepositoryInterface, WalletRepositoryInterface } from '../repositories';
import type { CryptoCurrency } from '../types';

import { ImmediateAllocationStrategy } from './wallet-strategies/immediate-allocation-strategy';
import { QueueAllocationStrategy } from './wallet-strategies/queue-allocation-strategy';
import type {
  WalletAllocationStrategy,
  AllocationResult,
  PoolStats,
} from './wallet-strategies/wallet-allocation-strategy';

type AllocationMode = 'immediate' | 'queue' | 'hybrid';

/**
 * Главный сервис управления пулом кошельков
 * Реализует Facade Pattern для скрытия сложности стратегий
 *
 * @implements AC3.1 - Интеграция с существующей архитектурой
 * @implements AC3.2 - FIFO алгоритм для кошельков
 * @implements AC3.3 - Механизм освобождения кошельков
 * @implements AC3.4 - Обработка очереди ожидания
 * @implements AC3.5 - Мониторинг состояния пула
 */
export class WalletPoolManager {
  private allocationStrategy: WalletAllocationStrategy;

  constructor(
    private walletRepository: WalletRepositoryInterface,
    private queueRepository?: QueueRepositoryInterface,
    mode: AllocationMode = 'immediate'
  ) {
    // Strategy selection based on configuration
    this.allocationStrategy = this.createAllocationStrategy(mode);
  }

  /**
   * Выделить кошелек для заданной валюты
   * @implements AC3.1 - основной метод для интеграции
   */
  async allocateWallet(currency: CryptoCurrency): Promise<AllocationResult> {
    return await this.allocationStrategy.allocateWallet(currency);
  }

  /**
   * Освободить кошелек по адресу
   * @implements AC3.3 - механизм освобождения
   */
  async releaseWallet(address: string): Promise<AllocationResult> {
    return await this.allocationStrategy.releaseWallet(address);
  }

  /**
   * Получить статистику пула кошельков
   * @implements AC3.5 - мониторинг состояния
   */
  async getPoolStats(currency: CryptoCurrency): Promise<PoolStats> {
    return await this.allocationStrategy.getPoolStats(currency);
  }

  /**
   * Проверить доступность кошелька
   */
  async isWalletAvailable(address: string): Promise<boolean> {
    return await this.allocationStrategy.isWalletAvailable(address);
  }

  /**
   * Переключить стратегию выделения кошельков
   */
  async switchStrategy(mode: AllocationMode): Promise<void> {
    this.allocationStrategy = this.createAllocationStrategy(mode);
  }

  /**
   * Создать стратегию выделения на основе режима
   */
  private createAllocationStrategy(mode: AllocationMode): WalletAllocationStrategy {
    switch (mode) {
      case 'queue':
        if (!this.queueRepository) {
          throw new Error('QueueRepository required for queue-based allocation modes');
        }
        return new QueueAllocationStrategy(this.walletRepository, this.queueRepository);

      case 'hybrid':
        if (!this.queueRepository) {
          throw new Error('QueueRepository required for queue-based allocation modes');
        }
        return new QueueAllocationStrategy(this.walletRepository, this.queueRepository);

      default:
        return new ImmediateAllocationStrategy(this.walletRepository);
    }
  }
}
