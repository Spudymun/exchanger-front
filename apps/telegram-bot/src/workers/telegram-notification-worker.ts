import { TELEGRAM_QUEUE_CONSTANTS } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';
import type { TelegramNotification } from '@repo/utils/telegram-queue';
import type { Worker, Job } from 'bullmq';

const logger = createEnvironmentLogger('telegram-notification-worker');

/**
 * BullMQ Worker для обработки Telegram уведомлений
 *
 * @architecture
 * - Использует динамический импорт для совместимости с Turbopack
 * - Обрабатывает задачи из Redis очереди
 * - Автоматические retry с exponential backoff
 * - Dead Letter Queue (DLQ) для неудачных попыток после MAX_ATTEMPTS
 *
 * @see packages/utils/src/telegram-queue/telegram-queue-producer.ts - Producer
 * @see apps/telegram-bot/pages/api/notify-operators.ts - HTTP endpoint для прямых вызовов
 */
export class TelegramNotificationWorker {
  private worker: Worker<TelegramNotification> | null = null;
  private isShuttingDown = false;

  async start(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      logger.error('REDIS_URL_NOT_CONFIGURED', {
        message: 'Worker cannot start without REDIS_URL',
      });
      throw new Error('REDIS_URL is required for TelegramNotificationWorker');
    }

    logger.info('STARTING_WORKER', {
      queueName: TELEGRAM_QUEUE_CONSTANTS.QUEUE_NAME,
      concurrency: TELEGRAM_QUEUE_CONSTANTS.WORKER.CONCURRENCY,
    });

    try {
      // ✅ Динамический импорт для совместимости с Turbopack
      const { Worker } = await import('bullmq');

      this.worker = new Worker(
        TELEGRAM_QUEUE_CONSTANTS.QUEUE_NAME,
        async (job) => {
          return this.processJob(job);
        },
        {
          connection: {
            url: redisUrl,
            db: TELEGRAM_QUEUE_CONSTANTS.REDIS_DB,
          },
          concurrency: TELEGRAM_QUEUE_CONSTANTS.WORKER.CONCURRENCY,
          limiter: {
            max: TELEGRAM_QUEUE_CONSTANTS.WORKER.RATE_LIMIT.MAX,
            duration: TELEGRAM_QUEUE_CONSTANTS.WORKER.RATE_LIMIT.DURATION_MS,
          },
        }
      );

      // ✅ Event handlers для мониторинга
      this.setupEventHandlers();

      logger.info('WORKER_STARTED', {
        queueName: TELEGRAM_QUEUE_CONSTANTS.QUEUE_NAME,
      });
    } catch (error) {
      logger.error('WORKER_START_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Обработка job из очереди
   */
  private async processJob(job: Job<TelegramNotification>): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('JOB_SKIPPED_SHUTDOWN', { jobId: job.id });
      throw new Error('Worker is shutting down');
    }

    const startTime = Date.now();

    logger.info('JOB_PROCESSING_START', {
      jobId: job.id,
      orderId: job.data.orderId,
      notificationType: job.data.notificationType,
      attempt: job.attemptsMade + 1,
      maxAttempts: TELEGRAM_QUEUE_CONSTANTS.RETRY.MAX_ATTEMPTS,
    });

    try {
      await this.sendNotification(job.data);

      const duration = Date.now() - startTime;

      logger.info('JOB_COMPLETED', {
        jobId: job.id,
        orderId: job.data.orderId,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('JOB_FAILED', {
        jobId: job.id,
        orderId: job.data.orderId,
        attempt: job.attemptsMade + 1,
        maxAttempts: TELEGRAM_QUEUE_CONSTANTS.RETRY.MAX_ATTEMPTS,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error; // BullMQ автоматически retry через backoff
    }
  }

  /**
   * Отправка уведомления в Telegram через API endpoint
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async sendNotification(notification: any): Promise<void> {
    // 🔥 TEMPORARY: Эмуляция ошибки для тестирования retry
    // Убрать после тестирования!
    if (process.env.SIMULATE_TELEGRAM_ERROR === 'true') {
      throw new Error('TEST: Simulated Telegram API error for retry testing');
    }

    const telegramBotUrl = process.env.TELEGRAM_BOT_URL;

    if (!telegramBotUrl) {
      logger.error('TELEGRAM_BOT_URL_NOT_CONFIGURED', {
        orderId: notification.orderId,
      });
      throw new Error('TELEGRAM_BOT_URL is required');
    }

    const response = await fetch(`${telegramBotUrl}/api/notify-operators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification.payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
    }

    logger.debug('NOTIFICATION_SENT', {
      orderId: notification.orderId,
      status: response.status,
    });
  }

  /**
   * Настройка event handlers для мониторинга
   */
  private setupEventHandlers(): void {
    if (!this.worker) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.worker.on('completed', (job: any) => {
      logger.info('WORKER_EVENT_COMPLETED', { jobId: job.id });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.worker.on('failed', (job: any, err: Error) => {
      logger.error('WORKER_EVENT_FAILED', {
        jobId: job?.id,
        error: err.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    this.worker.on('error', (err: Error) => {
      logger.error('WORKER_ERROR', { error: err.message });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.worker.on('stalled', (jobId: string, prev: any) => {
      logger.warn('WORKER_JOB_STALLED', { jobId, prev });
    });
  }

  /**
   * Graceful shutdown worker
   */
  async stop(): Promise<void> {
    this.isShuttingDown = true;

    logger.info('WORKER_SHUTDOWN_START');

    if (this.worker) {
      await this.worker.close();
      logger.info('WORKER_SHUTDOWN_COMPLETE');
    }
  }
}
