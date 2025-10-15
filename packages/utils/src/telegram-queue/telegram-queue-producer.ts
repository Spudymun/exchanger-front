import type { TelegramNotificationPayload } from '@repo/constants';
import type { Queue } from 'bullmq';

import { gracefulHandler } from '../graceful-handler';
import { createEnvironmentLogger } from '../logger';

import type { TelegramNotification, QueueHealthStatus } from './types';

const logger = createEnvironmentLogger('telegram-queue-producer');

/**
 * Producer для отправки Telegram уведомлений в очередь BullMQ
 *
 * @architecture
 * - Graceful degradation: fallback к прямой отправке при недоступности Redis
 * - НЕ блокирует создание заказа при проблемах с очередью
 * - Мониторинг здоровья Redis через события
 * - Использует динамический импорт для BullMQ (совместимость с Turbopack)
 *
 * @see apps/telegram-bot/src/workers/telegram-notification-worker.ts - Consumer
 */
export class TelegramQueueProducer {
  private queue: Queue<TelegramNotification> | null = null;
  private isRedisAvailable = true;

  constructor() {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      logger.warn('REDIS_URL_NOT_CONFIGURED', {
        fallbackMode: 'direct-send',
      });
      return;
    }

    try {
      await this.initializeQueue(redisUrl);
    } catch (error) {
      this.handleInitializationError(error);
    }
  }

  private async initializeQueue(redisUrl: string): Promise<void> {
    // ✅ Динамический импорт для совместимости с Turbopack
    const [{ Queue }, { default: Redis }, { TELEGRAM_QUEUE_CONSTANTS, TIME_CONSTANTS }] = await Promise.all([
      import('bullmq'),
      import('ioredis'),
      import('@repo/constants'),
    ]);

    const redis = new Redis(redisUrl, {
      db: TELEGRAM_QUEUE_CONSTANTS.REDIS_DB,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    this.setupRedisEventHandlers(redis);

    this.queue = new Queue(TELEGRAM_QUEUE_CONSTANTS.QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        attempts: TELEGRAM_QUEUE_CONSTANTS.RETRY.MAX_ATTEMPTS,
        backoff: {
          type: TELEGRAM_QUEUE_CONSTANTS.RETRY.BACKOFF_TYPE,
          delay: TELEGRAM_QUEUE_CONSTANTS.RETRY.BASE_DELAY_MS,
        },
        removeOnComplete: {
          age: TELEGRAM_QUEUE_CONSTANTS.CLEANUP.COMPLETED_TTL_HOURS * TIME_CONSTANTS.MINUTES_IN_HOUR * TIME_CONSTANTS.SECONDS_IN_MINUTE,
          count: TELEGRAM_QUEUE_CONSTANTS.CLEANUP.COMPLETED_MAX_COUNT,
        },
        removeOnFail: false,
      },
    });

    logger.info('TELEGRAM_QUEUE_INITIALIZED', {
      db: TELEGRAM_QUEUE_CONSTANTS.REDIS_DB,
    });
  }

  private setupRedisEventHandlers(redis: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const redisClient = redis as any;

    redisClient.on('error', (err: Error) => {
      logger.error('REDIS_CONNECTION_ERROR', { error: err.message });
      this.isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      logger.info('REDIS_CONNECTED');
      this.isRedisAvailable = true;
    });

    redisClient.on('ready', () => {
      logger.info('REDIS_READY');
      this.isRedisAvailable = true;
    });
  }

  private handleInitializationError(error: unknown): void {
    logger.error('QUEUE_INITIALIZATION_FAILED', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    this.queue = null;
    this.isRedisAvailable = false;
  }

  /**
   * Добавить уведомление в очередь
   * Graceful degradation: fallback к прямой отправке
   */
  async enqueue(notification: TelegramNotification): Promise<void> {
    // 1. Попытка через очередь (preferred)
    if (this.queue && this.isRedisAvailable) {
      const queued = await gracefulHandler(
        async () => {
          if (!this.queue) return null;

          await this.queue.add('send-notification', notification, {
            priority: notification.priority || 0,
          });
          return true;
        },
        { fallback: null }
      );

      if (queued) {
        logger.info('NOTIFICATION_QUEUED', {
          orderId: notification.orderId,
          type: notification.notificationType,
        });
        return; // ✅ SUCCESS
      }

      // ❌ Queue operation failed - логируем
      logger.error('QUEUE_ADD_FAILED', {
        orderId: notification.orderId,
        reason: 'gracefulHandler returned null',
      });
    }

    // 2. Fallback: прямая отправка
    logger.warn('FALLBACK_TO_DIRECT_SEND', {
      orderId: notification.orderId,
      reason: !this.queue ? 'Queue not initialized' : 'Redis unavailable',
    });

    await this.directSend(notification.payload);
  }

  /**
   * Прямая отправка БЕЗ очереди (fallback mode)
   */
  private async directSend(payload: TelegramNotificationPayload): Promise<void> {
    const telegramBotUrl = process.env.TELEGRAM_BOT_URL;

    if (!telegramBotUrl) {
      logger.warn('TELEGRAM_BOT_URL_NOT_CONFIGURED');
      return;
    }

    try {
      const { TELEGRAM_QUEUE_CONSTANTS } = await import('@repo/constants');

      await fetch(`${telegramBotUrl}/api/notify-operators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TELEGRAM_QUEUE_CONSTANTS.TIMEOUTS.TELEGRAM_API_MS),
      });

      logger.info('DIRECT_SEND_SUCCESS', {
        orderId: payload.order.internalId,
      });
    } catch (error) {
      logger.error('DIRECT_SEND_FAILED', {
        orderId: payload.order.internalId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // НЕ throw - не прерываем создание заказа
    }
  }

  /**
   * Проверка здоровья очереди
   */
  async getHealth(): Promise<QueueHealthStatus> {
    if (!this.queue) {
      return {
        isAvailable: false,
        latency: -1,
        error: 'Queue not initialized',
      };
    }

    const start = Date.now();

    const pingResult = await gracefulHandler(
      async () => {
        if (!this.queue) return null;
        const client = await this.queue.client;
        await client.ping();
        return true;
      },
      { fallback: null }
    );

    const latency = Date.now() - start;

    return {
      isAvailable: pingResult === true,
      latency,
      error: pingResult ? undefined : 'Redis ping failed',
    };
  }
}
