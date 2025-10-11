import { ORDER_EXPIRATION_TIME_MS } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

import type Redis from 'ioredis';

const logger = createEnvironmentLogger('OrderExpirationService');

// Константы для конвертации времени
const MILLISECONDS_IN_SECOND = 1000;
const DEFAULT_SUBSCRIPTION_COUNT = 1;
const REDIS_KEY_DELETED = 1;
const RETRY_BASE_DELAY_MS = 50;
const RETRY_MAX_DELAY_MS = 2000;

/**
 * Сервис для управления автоматической отменой заказов по истечению времени
 *
 * Использует Redis TTL + Keyspace Notifications для надежной отложенной отмены.
 *
 * @architecture
 * - Минимальная интеграция с существующим кодом
 * - Использует уже установленный Redis (ioredis)
 * - Атомарные операции для избежания race conditions
 * - Два подключения: одно для операций, второе для Pub/Sub
 *
 * @see docs/implementation/ORDER_TIMEOUT_IMPLEMENTATION_PLAN.md
 */
export class OrderExpirationService {
  private redis: Redis | null = null; // ioredis instance
  private listenerRedis: Redis | null = null; // Отдельное подключение для Pub/Sub
  private isListening = false;

  constructor(_redisUrl: string) {
    // Подключения будут созданы в initialize()
    // redisUrl не используется, т.к. берем из process.env.REDIS_URL в initialize
    this.redis = null;
    this.listenerRedis = null;
  }

  /**
   * Инициализация сервиса
   * Настраивает Redis для keyspace notifications
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic import для совместимости с Turbopack
      const ioredisModule = await import('ioredis');
      const Redis = ioredisModule.default || ioredisModule;

      if (typeof Redis !== 'function') {
        throw new Error('Redis constructor not available (likely empty.js fallback)');
      }

      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is required');
      }

      // Основное подключение для операций
      this.redis = new Redis(redisUrl, {
        lazyConnect: false,
        enableReadyCheck: true,
        enableOfflineQueue: true, // ✅ Разрешаем кеширование команд при недоступности Redis
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          // Exponential backoff: 50ms, 100ms, 200ms
          return Math.min(times * RETRY_BASE_DELAY_MS, RETRY_MAX_DELAY_MS);
        },
      });

      // Отдельное подключение для Pub/Sub (требование Redis)
      this.listenerRedis = new Redis(redisUrl, {
        lazyConnect: false,
        enableReadyCheck: true,
        enableOfflineQueue: true, // ✅ Pub/Sub также с кешированием
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          return Math.min(times * RETRY_BASE_DELAY_MS, RETRY_MAX_DELAY_MS);
        },
      });

      // Включаем keyspace notifications для expired events
      await this.redis.config('SET', 'notify-keyspace-events', 'Ex');

      logger.info('OrderExpirationService initialized', {
        redisUrl: redisUrl.replace(/\/\/.*@/, '//***@'), // Скрываем credentials
      });
    } catch (error) {
      logger.error('FAILED_TO_INITIALIZE_ORDER_EXPIRATION_SERVICE', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Запланировать автоматическую отмену заказа
   * Вызывается при создании заказа в статусе PENDING
   *
   * @param orderId - ID заказа для планирования отмены
   * @throws Бросает ошибку если не удалось установить TTL
   *         Fallback cron подхватит заказ через expiresAt
   */
  async scheduleOrderExpiration(orderId: string): Promise<void> {
    if (!this.redis) {
      throw new Error('OrderExpirationService not initialized');
    }

    const key = this.getOrderExpirationKey(orderId);
    const ttlSeconds = Math.floor(ORDER_EXPIRATION_TIME_MS / MILLISECONDS_IN_SECOND);

    try {
      // Устанавливаем ключ с TTL
      await this.redis.setex(key, ttlSeconds, orderId);

      logger.info('ORDER_EXPIRATION_SCHEDULED', {
        orderId,
        expiresInSeconds: ttlSeconds,
        expiresAt: new Date(Date.now() + ORDER_EXPIRATION_TIME_MS).toISOString(),
        redisKey: key,
      });
    } catch (error) {
      logger.error('FAILED_TO_SCHEDULE_ORDER_EXPIRATION', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
      // ✅ БРОСАЕМ ОШИБКУ - это критично для мониторинга
      // Fallback cron подхватит заказ через expiresAt в БД
      throw error;
    }
  }

  /**
   * Отменить запланированную отмену заказа
   * Вызывается когда статус заказа изменяется с PENDING на ЛЮБОЙ другой
   * (оплачен, отменен вручную, в обработке, failed, completed и т.д.)
   *
   * @param orderId - ID заказа для отмены планирования
   */
  async cancelOrderExpiration(orderId: string): Promise<void> {
    if (!this.redis) {
      logger.warn('CANCEL_ORDER_EXPIRATION_SKIPPED_NOT_INITIALIZED', { orderId });
      return;
    }

    const key = this.getOrderExpirationKey(orderId);

    try {
      const result = await this.redis.del(key);

      logger.info('ORDER_EXPIRATION_CANCELLED', {
        orderId,
        redisKey: key,
        keyDeleted: result === REDIS_KEY_DELETED,
        reason: 'order_status_changed_from_pending',
      });
    } catch (error) {
      logger.error('FAILED_TO_CANCEL_ORDER_EXPIRATION', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Не бросаем ошибку - это не критично
      // Redis ключ истечет сам, handler проверит статус и ничего не сделает
    }
  }

  /**
   * Запустить listener для обработки истекших заказов
   * Вызывается один раз при старте приложения
   *
   * @param onOrderExpired - Callback функция для обработки истекшего заказа
   */
  async startExpirationListener(onOrderExpired: (orderId: string) => Promise<void>): Promise<void> {
    if (!this.listenerRedis) {
      throw new Error('OrderExpirationService not initialized');
    }

    if (this.isListening) {
      logger.warn('Expiration listener already started');
      return;
    }

    // Подписываемся на события expired для нашего паттерна ключей
    const pattern = '__keyevent@0__:expired';

    await this.listenerRedis.psubscribe(pattern, (err: Error | null | undefined, result: unknown) => {
      if (err) {
        logger.error('FAILED_TO_SUBSCRIBE_TO_EXPIRED_EVENTS', { error: err.message });
        throw err;
      }

      const subscriptionCount = typeof result === 'number' ? result : DEFAULT_SUBSCRIPTION_COUNT;

      logger.info('SUBSCRIBED_TO_REDIS_EXPIRATION_EVENTS', {
        pattern,
        subscriptionCount,
      });
    });

    this.listenerRedis.on('pmessage', async (_pattern: string, _channel: string, expiredKey: string) => {
      // Проверяем что это наш ключ заказа
      if (expiredKey.startsWith('order:expire:')) {
        const orderId = this.extractOrderIdFromKey(expiredKey);

        logger.info('ORDER_EXPIRED_EVENT_RECEIVED', {
          orderId,
          expiredKey,
        });

        try {
          await onOrderExpired(orderId);
        } catch (error) {
          logger.error('ERROR_PROCESSING_EXPIRED_ORDER', {
            orderId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
      }
    });

    this.isListening = true;
    logger.info('OrderExpirationListener started successfully');
  }

  /**
   * Остановить сервис (graceful shutdown)
   */
  async shutdown(): Promise<void> {
    this.isListening = false;

    if (this.listenerRedis) {
      await this.listenerRedis.quit();
    }

    if (this.redis) {
      await this.redis.quit();
    }

    logger.info('OrderExpirationService shutdown complete');
  }

  // === PRIVATE METHODS ===

  private getOrderExpirationKey(orderId: string): string {
    return `order:expire:${orderId}`;
  }

  private extractOrderIdFromKey(key: string): string {
    return key.replace('order:expire:', '');
  }
}
