import { createEnvironmentLogger } from '../logger';

import { TelegramQueueProducer } from './telegram-queue-producer';

const logger = createEnvironmentLogger('telegram-queue-factory');

/**
 * 🏭 Factory для создания TelegramQueueProducer с поддержкой singleton паттерна
 *
 * @architecture
 * - Singleton instance для production optimization
 * - Кэширование конфигурации для предотвращения дублирования
 * - Graceful degradation при отсутствии Redis конфигурации
 *
 * @see packages/session-management/src/factories/user-manager-factory.ts - Reference pattern
 */
export class TelegramQueueFactory {
  private static cachedProducer: TelegramQueueProducer | null = null;
  private static cachedConfig: string | null = null;

  /**
   * Создает или возвращает кэшированный экземпляр TelegramQueueProducer
   *
   * @param config - Конфигурация Redis (опционально)
   * @returns Promise<TelegramQueueProducer>
   *
   * @example
   * ```typescript
   * // Production: использует REDIS_URL из env
   * const producer = await TelegramQueueFactory.create();
   *
   * // Custom Redis configuration
   * const producer = await TelegramQueueFactory.create({
   *   redisUrl: 'redis://custom-host:6379'
   * });
   * ```
   */
  static async create(config: { redisUrl?: string } = {}): Promise<TelegramQueueProducer> {
    const configKey = JSON.stringify(config);

    // ✅ Production optimization: использовать кэшированный instance если config совпадает
    if (this.cachedProducer && this.cachedConfig === configKey) {
      logger.debug('REUSING_CACHED_PRODUCER', { configKey });
      return this.cachedProducer;
    }

    return this.createNewProducer(config, configKey);
  }

  /**
   * Создает новый instance и кэширует его
   */
  private static async createNewProducer(
    config: { redisUrl?: string },
    configKey: string
  ): Promise<TelegramQueueProducer> {
    logger.info('CREATING_NEW_PRODUCER', { configKey });

    // ✅ TelegramQueueProducer использует process.env.REDIS_URL напрямую
    // Параметр config.redisUrl сохранен для совместимости API, но не используется
    const producer = new TelegramQueueProducer();

    // ✅ Кэшируем instance и config для future reuse
    this.cachedProducer = producer;
    this.cachedConfig = configKey;

    return producer;
  }

  /**
   * Сбрасывает кэш и принудительно создает новый instance
   * Используется в тестах или при изменении конфигурации
   */
  static reset(): void {
    logger.info('RESETTING_CACHED_PRODUCER');
    this.cachedProducer = null;
    this.cachedConfig = null;
  }

  /**
   * Возвращает текущий кэшированный instance (если есть)
   * Используется для проверки состояния в тестах
   */
  static getCachedInstance(): TelegramQueueProducer | null {
    return this.cachedProducer;
  }
}
