import { WALLET_POOL_CONFIG } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

import type { QueueRepositoryInterface, WalletRepositoryInterface } from '../repositories';
import type { CryptoCurrency } from '../types';

import { ImmediateAllocationStrategy } from './wallet-strategies/immediate-allocation-strategy';
// Прямой импорт для серверной части - не экспортируется в services/index.ts
import { QueueAllocationStrategy } from './wallet-strategies/queue-allocation-strategy';
import type {
  WalletAllocationStrategy,
  AllocationResult,
  PoolStats,
} from './wallet-strategies/wallet-allocation-strategy';

const logger = createEnvironmentLogger('wallet-pool-manager');

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
   * ✅ ИСПРАВЛЕНО: поддержка tokenStandard для multi-network токенов
   */
  async allocateWallet(currency: CryptoCurrency, tokenStandard?: string): Promise<AllocationResult> {
    logger.info('WALLET_ALLOCATION_REQUEST', {
      currency,
      tokenStandard,
      strategyType: this.allocationStrategy.constructor.name,
    });

    const result = await this.allocationStrategy.allocateWallet(currency, tokenStandard);
    
    logger.info('WALLET_ALLOCATION_RESULT', {
      currency,
      tokenStandard,
      success: result.success,
      address: result.address,
      queuePosition: result.queuePosition,
      usedOldestOccupiedWallet: result.usedOldestOccupiedWallet,
      error: result.error,
    });

    return result;
  }

  /**
   * Освободить кошелек по адресу
   * @implements AC3.3 - механизм освобождения
   */
  async releaseWallet(address: string): Promise<AllocationResult> {
    logger.info('WALLET_RELEASE_REQUEST', {
      address,
      strategyType: this.allocationStrategy.constructor.name,
    });

    const result = await this.allocationStrategy.releaseWallet(address);
    
    logger.info('WALLET_RELEASE_RESULT', {
      address,
      success: result.success,
      error: result.error,
    });

    return result;
  }

  /**
   * Получить статистику пула кошельков
   * @implements AC3.5 - мониторинг состояния
   */
  async getPoolStats(currency: CryptoCurrency): Promise<PoolStats> {
    logger.debug('WALLET_POOL_STATS_REQUEST', { currency });
    
    const stats = await this.allocationStrategy.getPoolStats(currency);
    
    logger.debug('WALLET_POOL_STATS_RESULT', {
      currency,
      totalWallets: stats.totalWallets,
      availableWallets: stats.availableWallets,
      occupiedWallets: stats.occupiedWallets,
      queueSize: stats.queueSize,
    });

    return stats;
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
   * Проверить критические пороги кошельков для alerting системы
   * @implements AC6.4 - система оповещений о критически низком количестве кошельков
   */
  async checkThresholds(currencies?: CryptoCurrency[]): Promise<
    Array<{
      currency: CryptoCurrency;
      available: number;
      threshold: number;
      isCritical: boolean;
    }>
  > {
    const currenciesToCheck = currencies || (['BTC', 'ETH', 'USDT', 'LTC'] as CryptoCurrency[]);

    return await Promise.all(
      currenciesToCheck.map(async currency => {
        const stats = await this.getPoolStats(currency);
        // eslint-disable-next-line security/detect-object-injection
        const threshold = WALLET_POOL_CONFIG.MIN_AVAILABLE_THRESHOLDS[currency];

        return {
          currency,
          available: stats.availableWallets,
          threshold,
          isCritical: stats.availableWallets <= threshold,
        };
      })
    );
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
