export { TelegramQueueProducer } from './telegram-queue-producer';
export { TelegramQueueFactory } from './telegram-queue-factory';
export type { TelegramNotification, QueueHealthStatus } from './types';

import { TelegramQueueFactory } from './telegram-queue-factory';

/**
 * Helper функция для быстрого получения Producer instance
 *
 * @returns Promise<TelegramQueueProducer>
 *
 * @example
 * ```typescript
 * import { getTelegramQueue } from '@repo/utils';
 *
 * const queue = await getTelegramQueue();
 * await queue.enqueue({
 *   order: { id: '123', amount: 100 },
 *   notificationType: 'ORDER_CREATED'
 * });
 * ```
 */
export async function getTelegramQueue() {
  return TelegramQueueFactory.create();
}
