import type { WalletInfo } from '../../repositories/wallet-repository-interface.js';
import type { CryptoCurrency } from '../../types';

export interface AllocationResult {
  success: boolean;
  address?: string;
  walletInfo?: WalletInfo;
  error?: string;
  queuePosition?: number; // Для случая когда кошелек в очереди
  usedOldestOccupiedWallet?: boolean; // Флаг использования самого старого занятого кошелька
}

export interface PoolStats {
  currency: CryptoCurrency;
  totalWallets: number;
  availableWallets: number;
  occupiedWallets: number;
  queueSize: number;
  lastActivity?: Date;
}

export type WalletStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface WalletAllocationStrategy {
  /**
   * Выделить кошелек для заданной валюты
   * ✅ ИСПРАВЛЕНО: поддержка tokenStandard для multi-network токенов (USDT)
   */
  allocateWallet(currency: CryptoCurrency, tokenStandard?: string): Promise<AllocationResult>;

  /**
   * Освободить кошелек по адресу
   */
  releaseWallet(address: string): Promise<AllocationResult>;

  /**
   * Получить статистику пула кошельков
   */
  getPoolStats(currency: CryptoCurrency): Promise<PoolStats>;

  /**
   * Проверить доступность кошелька
   */
  isWalletAvailable(address: string): Promise<boolean>;
}
