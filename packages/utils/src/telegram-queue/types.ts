import type { TelegramNotificationPayload } from '@repo/constants';

/**
 * Обертка для job в BullMQ очереди
 *
 * @note TelegramNotificationPayload импортируется из @repo/constants
 * чтобы избежать дублирования с notify-operators.ts
 */
export interface TelegramNotification {
  orderId: string;
  notificationType: TelegramNotificationPayload['notificationType'];
  payload: TelegramNotificationPayload;
  priority?: number;
}

/**
 * Статус здоровья Redis очереди
 */
export interface QueueHealthStatus {
  isAvailable: boolean;
  latency: number;
  error?: string;
}
