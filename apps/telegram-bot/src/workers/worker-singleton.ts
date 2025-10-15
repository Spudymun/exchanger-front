/**
 * ✅ Singleton для TelegramNotificationWorker
 *
 * Инициализируется при первом вызове getTelegramWorker()
 * Паттерн аналогичен CleanupCronSingleton и вызывается в API endpoint
 *
 * @see apps/web/src/server/utils/cleanup-cron-singleton.ts - Reference pattern
 * @see apps/web/src/server/trpc/context.ts - Usage example (getCleanupCron)
 *
 * @module TelegramWorkerSingleton
 */

import { createEnvironmentLogger } from '@repo/utils';

import { TelegramNotificationWorker } from './telegram-notification-worker';

const logger = createEnvironmentLogger('TelegramWorkerSingleton');

// ✅ Global singleton pattern для hot-reload environments
let telegramWorker: TelegramNotificationWorker | null = null;
let initializationPromise: Promise<TelegramNotificationWorker> | null = null;

/**
 * Получить или создать singleton экземпляр TelegramNotificationWorker
 * Thread-safe через promise caching
 *
 * @architecture
 * - Вызывается ЛЕНИВЫМ способом при первом API запросе
 * - Аналогично getCleanupCron() в apps/web/src/server/trpc/context.ts
 */
export async function getTelegramWorker(): Promise<TelegramNotificationWorker> {
  // Если уже инициализирован - возвращаем
  if (telegramWorker) {
    return telegramWorker;
  }

  // Если инициализация в процессе - ждем её завершения
  if (initializationPromise) {
    return initializationPromise;
  }

  // Начинаем новую инициализацию
  initializationPromise = (async () => {
    try {
      logger.info('Initializing TelegramNotificationWorker singleton...');

      const worker = new TelegramNotificationWorker();
      await worker.start();

      telegramWorker = worker;

      logger.info('TelegramNotificationWorker singleton initialized successfully');

      return worker;
    } catch (error) {
      logger.error('Failed to initialize TelegramNotificationWorker singleton', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Сбросить promise чтобы можно было повторить попытку
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Graceful shutdown - остановить worker
 * Вызывается при SIGTERM/SIGINT через process handlers в API endpoint
 */
export async function shutdownTelegramWorker(): Promise<void> {
  if (telegramWorker) {
    logger.info('Shutting down TelegramNotificationWorker...');
    await telegramWorker.stop();
    telegramWorker = null;
    initializationPromise = null;
    logger.info('TelegramNotificationWorker shut down successfully');
  }
}
