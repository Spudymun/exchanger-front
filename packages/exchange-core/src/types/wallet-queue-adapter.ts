/**
 * Wallet Queue Adapter Interface
 *
 * Определяет контракт для адаптеров очередей кошельков
 * Следует паттерну SessionAdapter из session-management
 */

import type { CryptoCurrency } from '../types';

export interface QueueItem {
  walletAddress: string;
  addedAt: number;
  currency: CryptoCurrency;
  correlationId: string;
  userId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: {
    source?: string;
    context?: Record<string, unknown>;
  };
}

export interface AddParams {
  currency: CryptoCurrency;
  walletAddress: string;
  correlationId?: string;
  userId?: string;
  priority?: QueueItem['priority'];
}

export interface QueueStats {
  size: number;
  lastUpdated: number;
  totalProcessed: number;
  averageWaitTime: number;
}

/**
 * Interface для адаптеров очередей кошельков
 * Аналогично SessionAdapter, определяет базовые операции с очередями
 */
export interface WalletQueueAdapter {
  /**
   * Добавить кошелек в FIFO очередь
   */
  addToQueue(params: AddParams): Promise<void>;

  /**
   * Взять следующий кошелек из FIFO очереди
   */
  getNextFromQueue(currency: CryptoCurrency): Promise<QueueItem | null>;

  /**
   * Получить размер очереди для валюты
   */
  getQueueSize(currency: CryptoCurrency): Promise<number>;

  /**
   * Получить размеры всех очередей
   */
  getAllQueueSizes(): Promise<Record<CryptoCurrency, number>>;

  /**
   * Просмотреть очередь без извлечения
   */
  peekQueue(currency: CryptoCurrency, limit?: number): Promise<QueueItem[]>;

  /**
   * Получить статистику очереди
   */
  getQueueStats(currency: CryptoCurrency): Promise<QueueStats>;

  /**
   * Очистить очередь
   */
  clearQueue(currency: CryptoCurrency, correlationId?: string): Promise<void>;

  /**
   * Проверить здоровье адаптера
   */
  checkHealth(): Promise<boolean>;
}
