/**
 * ✅ Singleton для OrderCleanupCron
 * 
 * Инициализируется при первом вызове getCleanupCron()
 * Паттерн аналогичен getExpirationService() в exchange.ts
 * 
 * @module CleanupCronSingleton
 */

import { createEnvironmentLogger } from '@repo/utils';

import { OrderCleanupCron } from './order-cleanup-cron';

const logger = createEnvironmentLogger('CleanupCronSingleton');

// ✅ Интервал проверки (5 минут = 300000ms)
const CLEANUP_INTERVAL_MS = 300000;

// ✅ Global singleton pattern для hot-reload environments
let cleanupCron: OrderCleanupCron | null = null;
let initializationPromise: Promise<OrderCleanupCron> | null = null;

/**
 * Получить или создать singleton экземпляр OrderCleanupCron
 * Thread-safe через promise caching
 */
export async function getCleanupCron(): Promise<OrderCleanupCron> {
  // Если уже инициализирован - возвращаем
  if (cleanupCron) {
    return cleanupCron;
  }

  // Если инициализация в процессе - ждем её завершения
  if (initializationPromise) {
    return initializationPromise;
  }

  // Начинаем новую инициализацию
  initializationPromise = (async () => {
    try {
      logger.info('Initializing OrderCleanupCron singleton...');

      const cron = new OrderCleanupCron();
      cron.start();

      cleanupCron = cron;

      logger.info('OrderCleanupCron singleton initialized successfully', {
        intervalMs: CLEANUP_INTERVAL_MS,
      });

      return cron;
    } catch (error) {
      logger.error('Failed to initialize OrderCleanupCron singleton', {
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
 * Graceful shutdown - остановить cron
 * Вызывается при SIGTERM/SIGINT
 */
export function shutdownCleanupCron(): void {
  if (cleanupCron) {
    logger.info('Shutting down OrderCleanupCron...');
    cleanupCron.stop();
    cleanupCron = null;
    initializationPromise = null;
    logger.info('OrderCleanupCron shut down successfully');
  }
}

// ✅ Graceful shutdown handlers (аналогично instrumentation.ts)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  process.once('SIGTERM', () => {
    logger.info('SIGTERM received');
    shutdownCleanupCron();
  });

  process.once('SIGINT', () => {
    logger.info('SIGINT received');
    shutdownCleanupCron();
  });
}
