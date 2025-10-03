import type { CryptoCurrency } from '../types/currency';

export interface WalletInfo {
  id: string;
  address: string;
  currency: CryptoCurrency;
  isOccupied: boolean;
  assignedOrderId?: string;
  createdAt: Date;
  lastUsedAt?: Date;
  tokenStandard?: string; // ✅ ИСПРАВЛЕНО: добавляем tokenStandard для получения сети из кошелька
  totalOrders?: number; // ✅ ДОБАВЛЕНО: для балансировки нагрузки в Balanced Round-Robin
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
  // ✅ ИСПРАВЛЕНО: поддержка tokenStandard для multi-network токенов
  findOldestAvailable(currency: CryptoCurrency, tokenStandard?: string): Promise<WalletInfo | null>;
  findByOrderId(orderId: string): Promise<WalletInfo | null>;

  // Поиск самого старого занятого кошелька для умной очереди
  // ✅ ИСПРАВЛЕНО: поддержка tokenStandard для multi-network токенов
  findOldestOccupied(currency: CryptoCurrency, tokenStandard?: string): Promise<WalletInfo | null>;

  // ✅ НОВОЕ: Поиск наименее используемого занятого кошелька для балансировки нагрузки
  // Устраняет Race Condition через распределение по totalOrders
  findLeastUsedOccupied(
    currency: CryptoCurrency,
    tokenStandard?: string
  ): Promise<WalletInfo | null>;

  // ✅ ДОБАВЛЕНО: методы для получения уникальных валют и стандартов токенов из БД
  // Для миграции CRYPTO_SELECTOR_DATABASE_MIGRATION_PLAN.md
  findDistinctCurrencies(): Promise<CryptoCurrency[]>;
  findDistinctTokenStandards(): Promise<string[]>;
}
