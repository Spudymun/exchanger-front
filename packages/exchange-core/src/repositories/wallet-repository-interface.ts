import type { CryptoCurrency } from '../types/currency';

export interface WalletInfo {
  id: string;
  address: string;
  currency: CryptoCurrency;
  isOccupied: boolean;
  assignedOrderId?: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

/**
 * Repository interface для управления кошельками
 * Подготовка для задач 2.1-2.3 (Wallet Pool Management)
 */
export interface WalletRepositoryInterface {
  // Базовые операции
  findByAddress(address: string): Promise<WalletInfo | null>;
  findByCurrency(currency: CryptoCurrency): Promise<WalletInfo[]>;
  findAvailable(currency: CryptoCurrency): Promise<WalletInfo[]>;
  findOccupied(currency: CryptoCurrency): Promise<WalletInfo[]>;

  // Управление статусом
  markAsOccupied(address: string, orderId: string): Promise<WalletInfo | null>;
  markAsAvailable(address: string): Promise<WalletInfo | null>;

  // Поиск для FIFO очереди (задача 2.2)
  findOldestAvailable(currency: CryptoCurrency): Promise<WalletInfo | null>;
  findByOrderId(orderId: string): Promise<WalletInfo | null>;
}
