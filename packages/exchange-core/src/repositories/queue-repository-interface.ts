import type { CryptoCurrency } from '../types/currency';

export interface QueueEntry {
  id: string;
  orderId: string;
  currency: CryptoCurrency;
  priority: number;
  createdAt: Date;
}

/**
 * Repository interface для управления очередями заявок
 * ДОБАВЛЕНО: Для поддержки AC2.3 (система очередей при отсутствии кошельков)
 * ДОБАВЛЕНО: Для поддержки AC3.4 (обработка очереди ожидания)
 * ОБОСНОВАНИЕ: Критерии приемки требуют FIFO queue management
 */
export interface QueueRepositoryInterface {
  // FIFO queue management для AC2.3
  addToQueue(entry: Omit<QueueEntry, 'id' | 'createdAt'>): Promise<QueueEntry>;
  getNextInQueue(currency: CryptoCurrency): Promise<QueueEntry | null>;
  removeFromQueue(entryId: string): Promise<void>;

  // Мониторинг очереди для AC3.5
  getQueueSize(currency: CryptoCurrency): Promise<number>;
  getQueuePosition(orderId: string): Promise<number | null>;
}
