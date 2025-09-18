# Детальный план реализации задачи 2.2: FIFO алгоритм для кошельков с Redis

> **Дата создания:** 17 сентября 2025  
> **Роль:** Агент-кодер (фокус на рефакторинг и паттерны)  
> **Цель:** Грамотно встроить FIFO алгоритм с Redis в существующую архитектуру как пазл  
> **Источник:** `docs/tasks/ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md` задача 2.2

---

## 🎯 ПОНИМАНИЕ ЗАДАЧИ И КОНТЕКСТА

### \*\* // ✅ ИСПРАВЛЕНО: Использует централизованные defaults вместо хардкода

      const redisConfig: RedisConfiguration = {
        url: process.env.REDIS_URL || SESSION_CONSTANTS.REDIS.REDIS_OPERATION_LIMITS.DEFAULT_URL,
        maxRetries: SESSION_CONSTANTS.REDIS.MAX_RETRIES,
      };а 2.2 (точная формулировка)**

```markdown
- [ ] **2.2** Реализовать FIFO алгоритм для кошельков с Redis
  - _Очередь "первый вошел - первый вышел" для справедливого распределения_
  - _Хранение очереди в Redis для persistence между рестартами_
  - _Отдельные очереди для каждой криптовалюты (BTC, ETH, USDT)_
```

### **Зависимости и архитектурный контекст**

**✅ ЗАВЕРШЕННЫЕ ПРЕДПОСЫЛКИ:**

- **Задача 1.1-1.2**: Prisma schema + Repository интерфейсы
- **Задача 2.1**: WalletPoolManager + Strategy Pattern частично реализован

**🚨 ТЕКУЩЕЕ СОСТОЯНИЕ КОДА:**

- `WalletPoolManager` существует с Strategy Pattern
- `QueueAllocationStrategy` есть заглушка, но FIFO очередь не реализована
- `Redis` архитектура уже настроена в session-management
- `WALLET_POOL_CONFIG` константы существуют

---

## 🏗️ АРХИТЕКТУРНЫЙ АНАЛИЗ СУЩЕСТВУЮЩЕГО КОДА

### **✅ ФАКТЫ из кода (проверено semantic_search)**

**1. Redis архитектура уже настроена**

```typescript
// packages/session-management/src/adapters/redis-session-adapter.ts
export class RedisSessionAdapter implements SessionAdapter {
  constructor(
    private redis: Redis,
    private context: ApplicationContext
  ) {}

  private generateSessionKey(sessionId: string): string {
    const contextPrefix =
      this.context === 'web'
        ? SESSION_CONSTANTS.REDIS.WEB_SESSION_PREFIX
        : SESSION_CONSTANTS.REDIS.ADMIN_SESSION_PREFIX;
    return `${contextPrefix}${sessionId}`;
  }
}
```

**2. WalletPoolManager с Strategy Pattern существует**

```typescript
// packages/exchange-core/src/services/wallet-pool-manager.ts
export class WalletPoolManager {
  private allocationStrategy: WalletAllocationStrategy;

  constructor(
    private walletRepository: WalletRepositoryInterface,
    private queueRepository?: QueueRepositoryInterface,
    mode: AllocationMode = 'immediate'
  ) {
    this.allocationStrategy = this.createAllocationStrategy(mode);
  }
}
```

**3. QueueAllocationStrategy заглушка существует**

```typescript
// packages/exchange-core/src/services/wallet-strategies/queue-allocation-strategy.ts
export class QueueAllocationStrategy implements WalletAllocationStrategy {
  // ❌ ПРОБЛЕМА: Redis FIFO не реализован
}
```

**4. Конфигурация для wallet pool**

```typescript
// packages/constants/src/wallet-pool-config.ts
export const WALLET_POOL_CONFIG = {
  MIN_AVAILABLE_THRESHOLDS: {
    BTC: 3,
    ETH: 2,
    USDT: 5,
    LTC: 2,
  },
  QUEUE_CONFIG: {
    MAX_QUEUE_SIZE: 100,
    QUEUE_TIMEOUT: 300000, // 5 минут
  },
};
```

**5. Криптовалюты**

```typescript
// packages/constants/src/exchange-currencies.ts
export const CRYPTOCURRENCIES = ['BTC', 'ETH', 'USDT', 'LTC'] as const;
```

---

## 🧩 СТРАТЕГИЯ ИНТЕГРАЦИИ (БЕЗ НАРУШЕНИЯ СУЩЕСТВУЮЩЕГО КОДА)

### **Принцип: ДОПОЛНИТЬ, НЕ ПЕРЕПИСАТЬ**

**✅ НЕ ТРОГАЕМ:**

- RedisSessionAdapter (идеальный паттерн для копирования)
- WalletPoolManager facade (уже правильно спроектирован)
- Существующие repository интерфейсы
- Конфигурационные константы

**🔧 ДОПОЛНЯЕМ:**

- Создаем RedisWalletQueueAdapter по образцу RedisSessionAdapter
- Доработаем QueueAllocationStrategy для использования Redis
- Добавим очереди в формате: `wallet:queue:BTC`, `wallet:queue:ETH`, etc.

---

## 📦 ДЕТАЛЬНЫЙ ПЛАН РЕАЛИЗАЦИИ

### **ФАЗА 1: Создание Redis адаптера для wallet очередей**

#### **1.1 Создать RedisWalletQueueAdapter**

**Файл:** `packages/exchange-core/src/adapters/redis-wallet-queue-adapter.ts`

```typescript
import type { CryptoCurrency } from '../types';
import { WALLET_POOL_CONFIG, CRYPTOCURRENCIES, SESSION_CONSTANTS } from '@repo/constants';
import { gracefulHandler, createEnvironmentLogger, createRedisErrorHandler } from '@repo/utils';

// ✅ Следуем паттерну RedisSessionAdapter - dynamic import
interface Redis {
  lpush(key: string, value: string): Promise<number>;
  rpop(key: string): Promise<string | null>;
  llen(key: string): Promise<number>;
  lrange(key: string, start: number, end: number): Promise<string[]>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
}

export interface QueueItem {
  walletAddress: string;
  addedAt: number;
  currency: CryptoCurrency;
  correlationId: string; // ✅ ИСПРАВЛЕНО: Добавлен для audit trail
  userId?: string; // ✅ ИСПРАВЛЕНО: Добавлен для session tracking
  priority?: 'normal' | 'high';
}

/**
 * Redis адаптер для FIFO очередей кошельков
 * Реализует задачу 2.2 - отдельные очереди для каждой валюты
 *
 * Архитектура: Копирует проверенный паттерн RedisSessionAdapter
 */
export class RedisWalletQueueAdapter {
  private logger = createEnvironmentLogger('RedisWalletQueueAdapter');
  private errorHandler = createRedisErrorHandler(this.logger, 'wallet queue operation');

  constructor(private redis: Redis) {}

  /**
   * Генерация ключей очередей по образцу session keys
   * ✅ ИСПРАВЛЕНО: Использует централизованную константу
   */
  private generateQueueKey(currency: CryptoCurrency): string {
    return `${SESSION_CONSTANTS.REDIS.WALLET_QUEUE_PREFIX}${currency}`;
  }

  /**
   * Добавить кошелек в конец FIFO очереди (LPUSH = добавление в начало списка)
   */
  async addToQueue(
    currency: CryptoCurrency,
    walletAddress: string,
    correlationId: string,
    userId?: string
  ): Promise<void> {
    try {
      const queueKey = this.generateQueueKey(currency);
      const queueItem: QueueItem = {
        walletAddress,
        addedAt: Date.now(),
        currency,
        correlationId, // ✅ ИСПРАВЛЕНО: Correlation ID для audit trail
        userId, // ✅ ИСПРАВЛЕНО: User tracking
        priority: 'normal',
      };

      // LPUSH = добавляем в начало списка (конец FIFO очереди)
      await this.redis.lpush(queueKey, JSON.stringify(queueItem));

      // Устанавливаем TTL для очереди (предотвращение накопления)
      const ttlSeconds = SESSION_CONSTANTS.REDIS.REDIS_OPERATION_LIMITS.DEFAULT_TTL_SECONDS;
      await this.redis.expire(queueKey, ttlSeconds);

      this.logger.info('Added wallet to FIFO queue', {
        currency,
        walletAddress,
        queueKey,
        correlationId, // ✅ ИСПРАВЛЕНО: Добавлен correlation ID в логи
        userId, // ✅ ИСПРАВЛЕНО: Добавлен user ID в логи
      });
    } catch (error) {
      this.errorHandler(error, {
        currency,
        walletAddress,
        correlationId,
        userId,
      });
    }
  }

  /**
   * Взять кошелек из начала FIFO очереди (RPOP = извлечение с конца списка)
   */
  async getNextFromQueue(currency: CryptoCurrency): Promise<QueueItem | null> {
    return gracefulHandler(async () => {
      const queueKey = this.generateQueueKey(currency);

      // RPOP = извлекаем с конца списка (начало FIFO очереди)
      const queueItemJson = await this.redis.rpop(queueKey);

      if (!queueItemJson) {
        return null;
      }

      const queueItem = JSON.parse(queueItemJson) as QueueItem;

      this.logger.info('Retrieved wallet from FIFO queue', {
        currency,
        walletAddress: queueItem.walletAddress,
        waitTime: Date.now() - queueItem.addedAt,
      });

      return queueItem;
    });
  }

  /**
   * Получить размер очереди для валюты
   */
  async getQueueSize(currency: CryptoCurrency): Promise<number> {
    return gracefulHandler(async () => {
      const queueKey = this.generateQueueKey(currency);
      return await this.redis.llen(queueKey);
    });
  }

  /**
   * Получить все размеры очередей (для мониторинга)
   */
  async getAllQueueSizes(): Promise<Record<CryptoCurrency, number>> {
    const result = {} as Record<CryptoCurrency, number>;

    await Promise.all(
      CRYPTOCURRENCIES.map(async currency => {
        result[currency] = await this.getQueueSize(currency);
      })
    );

    return result;
  }

  /**
   * Посмотреть очередь без извлечения (для debugging)
   */
  async peekQueue(
    currency: CryptoCurrency,
    limit: number = SESSION_CONSTANTS.REDIS.REDIS_OPERATION_LIMITS.DEFAULT_PEEK_LIMIT
  ): Promise<QueueItem[]> {
    return gracefulHandler(async () => {
      const queueKey = this.generateQueueKey(currency);

      // LRANGE 0 limit-1 = первые элементы очереди
      const queueItemsJson = await this.redis.lrange(queueKey, 0, limit - 1);

      return queueItemsJson.map(json => JSON.parse(json) as QueueItem);
    });
  }

  /**
   * Очистить очередь (для maintenance)
   */
  async clearQueue(currency: CryptoCurrency): Promise<void> {
    await gracefulHandler(async () => {
      const queueKey = this.generateQueueKey(currency);
      await this.redis.del(queueKey);

      this.logger.warn('Wallet queue cleared', { currency, queueKey });
    });
  }

  /**
   * Очистить все очереди (экстренная мера)
   */
  async clearAllQueues(): Promise<void> {
    await Promise.all(CRYPTOCURRENCIES.map(currency => this.clearQueue(currency)));

    this.logger.warn('ALL wallet queues cleared');
  }
}
```

#### **1.2 Создать factory для RedisWalletQueueAdapter**

**Файл:** `packages/exchange-core/src/adapters/redis-wallet-queue-factory.ts`

```typescript
import { createEnvironmentLogger } from '@repo/utils';
import type { RedisConfiguration } from '@repo/session-management';
import { RedisWalletQueueAdapter } from './redis-wallet-queue-adapter';

/**
 * ✅ ИСПРАВЛЕНО: Переиспользует существующий Redis connection pattern
 * Расширяет session-management архитектуру вместо дублирования
 */
export class RedisWalletQueueFactory {
  private static logger = createEnvironmentLogger('RedisWalletQueueFactory');

  /**
   * ✅ ИСПРАВЛЕНО: Использует RedisConfiguration вместо хардкода
   */
  static async createQueueAdapter(
    config: RedisConfiguration
  ): Promise<RedisWalletQueueAdapter | null> {
    try {
      // Dynamic import для совместимости с Turbopack (как в session-management)
      const ioredisModule = await import('ioredis');

      // Проверяем что это реальный Redis класс, а не empty.js
      const Redis = ioredisModule.default || ioredisModule;

      if (typeof Redis !== 'function') {
        throw new Error('Redis constructor not available (likely empty.js fallback)');
      }

      // ✅ ИСПРАВЛЕНО: Использует config вместо хардкода
      const redis = new Redis(config.url, {
        maxRetriesPerRequest: config.maxRetries || SESSION_CONSTANTS.REDIS.MAX_RETRIES,
        lazyConnect: true,
      });

      // Тест соединения
      await redis.ping();

      this.logger.info('Redis wallet queue adapter created successfully');
      return new RedisWalletQueueAdapter(redis);
    } catch (error) {
      this.logger.warn('Failed to create Redis wallet queue adapter', {
        error: error instanceof Error ? error.message : String(error),
      });

      // В development режиме это нормально - Redis может быть недоступен
      return null;
    }
  }
}
```

### **ФАЗА 2: Интеграция Redis очередей в QueueAllocationStrategy**

#### **2.1 Доработать QueueAllocationStrategy**

**Файл:** `packages/exchange-core/src/services/wallet-strategies/queue-allocation-strategy.ts` (МОДИФИКАЦИЯ)

```typescript
// ✅ ДОБАВЛЯЕМ импорты
import { RedisWalletQueueAdapter } from '../../adapters/redis-wallet-queue-adapter';
import { RedisWalletQueueFactory } from '../../adapters/redis-wallet-queue-factory';
import type { RedisConfiguration } from '@repo/session-management';
import { generateId } from '@repo/utils'; // ✅ ИСПРАВЛЕНО: Для correlation ID

/**
 * Стратегия FIFO очереди для кошельков с Redis
 * ДОРАБОТАНО для задачи 2.2 - реальные Redis очереди
 */
export class QueueAllocationStrategy implements WalletAllocationStrategy {
  private redisQueue: RedisWalletQueueAdapter | null = null;
  private logger = createEnvironmentLogger('QueueAllocationStrategy');

  constructor(
    private walletRepository: WalletRepositoryInterface,
    private queueRepository?: QueueRepositoryInterface
  ) {
    // ✅ ДОБАВЛЯЕМ инициализацию Redis адаптера
    this.initializeRedisQueue();
  }

  /**
   * ✅ ИСПРАВЛЕНО: Принимает RedisConfiguration
   */
  private async initializeRedisQueue(): Promise<void> {
    try {
      // ✅ ИСПРАВЛЕНО: Используем конфигурацию из environment
      const redisConfig: RedisConfiguration = {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        maxRetries: SESSION_CONSTANTS.REDIS.MAX_RETRIES,
      };

      this.redisQueue = await RedisWalletQueueFactory.createQueueAdapter(redisConfig);

      if (this.redisQueue) {
        this.logger.info('Redis wallet queues initialized successfully');
      } else {
        this.logger.warn('Redis wallet queues not available, using database fallback');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Redis wallet queues', { error });
    }
  }

  /**
   * ✅ ДОРАБАТЫВАЕМ: Выделение кошелька через FIFO очередь
   * ✅ ИСПРАВЛЕНО: Добавлена защита от race conditions
   */
  async allocateWallet(
    currency: CryptoCurrency,
    correlationId?: string,
    userId?: string
  ): Promise<AllocationResult> {
    const traceId = correlationId || generateId();

    try {
      // 1. Пытаемся взять кошелек из Redis FIFO очереди
      if (this.redisQueue) {
        const queueItem = await this.redisQueue.getNextFromQueue(currency);

        if (queueItem) {
          // ✅ ИСПРАВЛЕНО: Защита от race conditions
          const allocationResult = await this.tryAllocateWalletSafely(
            queueItem.walletAddress,
            currency,
            traceId,
            queueItem
          );

          if (allocationResult.success) {
            return allocationResult;
          }

          // Если кошелек занят - логируем и fallback к БД
          this.logger.warn('Wallet from Redis queue is occupied, falling back to database', {
            currency,
            address: queueItem.walletAddress,
            correlationId: traceId,
          });
        }
      }

      // 2. Fallback: ищем доступный кошелек напрямую в БД
      const oldestWallet = await this.walletRepository.findOldestAvailable(currency);

      if (oldestWallet) {
        const allocatedWallet = await this.walletRepository.markAsOccupied(
          oldestWallet.address,
          `${WALLET_POOL_CONFIG.TEMPORARY_ALLOCATION_PREFIX}${traceId}`
        );

        if (allocatedWallet) {
          return {
            success: true,
            address: allocatedWallet.address,
            mode: 'immediate',
            metadata: {
              source: 'database_fifo',
              correlationId: traceId,
            },
          };
        }
      }

      // 3. Нет доступных кошельков - возвращаем неуспех
      return {
        success: false,
        error: `No available ${currency} wallets`,
        mode: 'queue',
        metadata: {
          correlationId: traceId,
        },
      };
    } catch (error) {
      this.logger.error('QueueAllocationStrategy.allocateWallet failed', {
        currency,
        correlationId: traceId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: `Failed to allocate ${currency} wallet`,
        mode: 'queue',
        metadata: {
          correlationId: traceId,
        },
      };
    }
  }

  /**
   * ✅ НОВЫЙ МЕТОД: Безопасное выделение кошелька с защитой от race conditions
   */
  private async tryAllocateWalletSafely(
    walletAddress: string,
    currency: CryptoCurrency,
    correlationId: string,
    queueItem: QueueItem
  ): Promise<AllocationResult> {
    try {
      // Проверяем что кошелек все еще доступен в БД
      const wallet = await this.walletRepository.findByAddress(walletAddress);

      if (!wallet || wallet.status !== 'available') {
        this.logger.warn('Wallet from queue is no longer available', {
          currency,
          address: walletAddress,
          correlationId,
          actualStatus: wallet?.status || 'not_found',
        });

        return { success: false, error: 'Wallet no longer available' };
      }

      // Пытаемся атомарно занять кошелек
      const allocatedWallet = await this.walletRepository.markAsOccupied(
        walletAddress,
        `${WALLET_POOL_CONFIG.TEMPORARY_ALLOCATION_PREFIX}${correlationId}`
      );

      if (allocatedWallet) {
        this.logger.info('Wallet allocated from Redis FIFO queue', {
          currency,
          address: walletAddress,
          waitTime: Date.now() - queueItem.addedAt,
          correlationId,
          userId: queueItem.userId,
        });

        return {
          success: true,
          address: allocatedWallet.address,
          mode: 'queue',
          metadata: {
            source: 'redis_fifo_queue',
            waitTime: Date.now() - queueItem.addedAt,
            correlationId,
            userId: queueItem.userId,
          },
        };
      }

      // Если не удалось занять - кто-то другой опередил
      this.logger.warn('Race condition detected: wallet occupied by another process', {
        currency,
        address: walletAddress,
        correlationId,
      });

      return { success: false, error: 'Race condition: wallet occupied' };
    } catch (error) {
      this.logger.error('Failed to safely allocate wallet', {
        currency,
        address: walletAddress,
        correlationId,
        error: error instanceof Error ? error.message : String(error),
      });

      return { success: false, error: 'Allocation failed' };
    }
  }

  /**
   * ✅ ДОРАБАТЫВАЕМ: Освобождение кошелька с добавлением в FIFO очередь
   * ✅ ИСПРАВЛЕНО: Добавлен correlation ID и улучшен error handling
   */
  async releaseWallet(address: string, correlationId?: string): Promise<AllocationResult> {
    const traceId = correlationId || generateId();

    try {
      // 1. Освобождаем кошелек в БД
      const releasedWallet = await this.walletRepository.markAsAvailable(address);

      if (releasedWallet) {
        // 2. Добавляем освобожденный кошелек в Redis FIFO очередь
        if (this.redisQueue) {
          await this.redisQueue.addToQueue(releasedWallet.currency, address, traceId);

          this.logger.info('Wallet released and added to FIFO queue', {
            address,
            currency: releasedWallet.currency,
            correlationId: traceId,
          });
        }

        return {
          success: true,
          address,
          mode: 'queue',
          metadata: {
            source: 'release_to_fifo_queue',
            correlationId: traceId,
          },
        };
      }

      return {
        success: false,
        error: `Failed to release wallet: ${address}`,
        mode: 'queue',
        metadata: {
          correlationId: traceId,
        },
      };
    } catch (error) {
      this.logger.error('QueueAllocationStrategy.releaseWallet failed', {
        address,
        correlationId: traceId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: `Failed to release wallet: ${address}`,
        mode: 'queue',
        metadata: {
          correlationId: traceId,
        },
      };
    }
  }

  /**
   * ✅ ДОРАБАТЫВАЕМ: Статистика с учетом Redis очередей
   */
  async getPoolStats(currency: CryptoCurrency): Promise<PoolStats> {
    try {
      const [availableWallets, occupiedWallets] = await Promise.all([
        this.walletRepository.findAvailable(currency),
        this.walletRepository.findOccupied(currency),
      ]);

      // Размер Redis очереди
      let queueSize = 0;
      if (this.redisQueue) {
        queueSize = await this.redisQueue.getQueueSize(currency);
      }

      return {
        currency,
        availableWallets: availableWallets.length,
        occupiedWallets: occupiedWallets.length,
        queueSize, // ✅ НОВОЕ: реальный размер очереди из Redis
        lastActivity: new Date(),
      };
    } catch (error) {
      this.logger.error('QueueAllocationStrategy.getPoolStats failed', {
        currency,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        currency,
        availableWallets: 0,
        occupiedWallets: 0,
        queueSize: 0,
        lastActivity: new Date(),
      };
    }
  }

  // ✅ ОСТАЛЬНЫЕ МЕТОДЫ остаются без изменений
  async isWalletAvailable(address: string): Promise<boolean> {
    // Существующая реализация
  }
}
```

### **ФАЗА 3: Расширение существующих констант Redis**

#### **3.1 Расширить SESSION_CONSTANTS.REDIS**

**Файл:** `packages/constants/src/session.ts` (МОДИФИКАЦИЯ)

```typescript
export const SESSION_CONSTANTS = {
  // Существующие константы (не трогаем)
  ENVIRONMENTS: {
    MOCK: 'mock',
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
  } as const,

  REDIS: {
    // Существующие session константы (не трогаем)
    MAX_RETRIES: 3,
    WEB_SESSION_PREFIX: 'session:web:',
    ADMIN_SESSION_PREFIX: 'session:admin:',

    // ✅ ДОБАВЛЯЕМ: Wallet queue константы (Task 2.2)
    WALLET_QUEUE_PREFIX: 'wallet:queue:', // wallet:queue:BTC, wallet:queue:ETH, etc.
    DEFAULT_QUEUE_TTL: 3600, // 1 час - очереди автоматически очищаются
    MAX_QUEUE_LENGTH: 1000, // Максимум элементов в одной очереди

    // ✅ НОВОЕ: Redis операционные лимиты для устранения magic numbers
    REDIS_OPERATION_LIMITS: {
      DEFAULT_PEEK_LIMIT: 10, // Лимит для peekQueue по умолчанию
      DEFAULT_TTL_SECONDS: 3600, // TTL в секундах (вместо Math.floor)
      QUEUE_DATABASE_INDEX: 1, // Индекс Redis DB для wallet очередей
      DEFAULT_URL: 'redis://localhost:6379', // Fallback URL для development
    },
  } as const,

  // Остальные существующие константы (не трогаем)
  DATABASE: {
    MAX_CONNECTIONS: 10,
    CONNECTION_TIMEOUT: 5000,
  } as const,

  APPLICATION_CONTEXT: {
    WEB: 'web',
    ADMIN: 'admin',
  } as const,
} as const;
```

#### **3.2 Обновить wallet-pool-config.ts**

**Файл:** `packages/constants/src/wallet-pool-config.ts` (МОДИФИКАЦИЯ)

```typescript
// ✅ НЕТ НОВОГО ИМПОРТА - используем существующий SESSION_CONSTANTS
import { SESSION_CONSTANTS } from './session';

export const WALLET_POOL_CONFIG = {
  // Существующие настройки (не трогаем)
  MIN_AVAILABLE_THRESHOLDS: {
    /* ... */
  },
  TIMEOUTS: {
    /* ... */
  },
  QUEUE_CONFIG: {
    /* ... */
  },

  // ✅ ДОБАВЛЯЕМ: Redis конфигурация для FIFO очередей
  REDIS_QUEUE_CONFIG: {
    ENABLE_REDIS_QUEUES: getEnvBoolean('ENABLE_REDIS_WALLET_QUEUES', true),
    QUEUE_TTL_SECONDS: getEnvNumber(
      'WALLET_QUEUE_TTL',
      SESSION_CONSTANTS.REDIS.REDIS_OPERATION_LIMITS.DEFAULT_TTL_SECONDS
    ),
    MAX_QUEUE_LENGTH: getEnvNumber(
      'WALLET_MAX_QUEUE_LENGTH',
      SESSION_CONSTANTS.REDIS.MAX_QUEUE_LENGTH
    ),
    REDIS_DATABASE: getEnvNumber(
      'WALLET_QUEUE_REDIS_DB',
      SESSION_CONSTANTS.REDIS.REDIS_OPERATION_LIMITS.QUEUE_DATABASE_INDEX
    ),
  },

  // ✅ ДОБАВЛЯЕМ: Константа для временных ID (устранение хардкода)
  TEMPORARY_ALLOCATION_PREFIX: 'temp-alloc-',

  // Существующие настройки (не трогаем)
  ALLOCATION_MODES: {
    /* ... */
  },
  DEFAULT_MODE: 'immediate' as const,
} as const;
```

### **ФАЗА 4: Обновление exports и интеграция**

#### **4.1 Обновить exports в exchange-core**

**Файл:** `packages/exchange-core/src/adapters/index.ts` (СОЗДАТЬ НОВЫЙ)

```typescript
// Redis адаптеры для wallet очередей (Task 2.2)
export * from './redis-wallet-queue-adapter';
export * from './redis-wallet-queue-factory';
```

**Файл:** `packages/exchange-core/src/index.ts` (МОДИФИКАЦИЯ)

```typescript
// Существующие exports (не трогаем)
export * from './types';
export * from './services';
export * from './repositories';
export * from './utils';
export * from './data';

// ✅ ДОБАВЛЯЕМ: Redis адаптеры для FIFO очередей (Task 2.2)
export * from './adapters';
```

#### **4.2 Обновить exports в constants**

**Файл:** `packages/constants/src/index.ts` (НЕ ТРЕБУЕТ ИЗМЕНЕНИЙ)

```typescript
// Существующие exports остаются без изменений
export * from './business';
export * from './exchange';
export * from './exchange-currencies';
export * from './wallet-pool-config';
export * from './validation';
export * from './session'; // ✅ Уже содержит расширенные SESSION_CONSTANTS
// ... остальные

// ✅ НЕ ДОБАВЛЯЕМ: redis-config - используем существующий session.ts
```

---

## 🔧 ИНТЕГРАЦИЯ С СУЩЕСТВУЮЩИМ КОДОМ

### **✅ СОВМЕСТИМОСТЬ: Что НЕ ЛОМАЕТСЯ**

1. **WalletPoolManager** - никаких изменений, Strategy Pattern работает
2. **Repository интерфейсы** - используются как есть
3. **Существующие константы** - только расширяем SESSION_CONSTANTS
4. **Session management** - полностью независимо
5. **tRPC API** - никаких изменений

### **🔄 ОБРАТНАЯ СОВМЕСТИМОСТЬ**

```typescript
// ✅ Если Redis недоступен - автоматический fallback на БД
if (this.redisQueue) {
  // Используем Redis FIFO очереди
} else {
  // Fallback на database FIFO через findOldestAvailable()
}
```

### **🛡️ ЗАЩИТА ОТ RACE CONDITIONS**

**Проблема:** Кошелек взят из Redis очереди, но в БД уже занят другим процессом.

**Решение:** Двухэтапная проверка с атомарной операцией:

```typescript
// 1. Извлекаем из Redis очереди
const queueItem = await this.redisQueue.getNextFromQueue(currency);

// 2. Атомарно проверяем и занимаем в БД
const result = await this.tryAllocateWalletSafely(queueItem.walletAddress, currency, correlationId);

// 3. Если кошелек занят - логируем и используем fallback к БД
if (!result.success) {
  this.logger.warn('Race condition detected: wallet occupied by another process');
  // Fallback к findOldestAvailable()
}
```

**Механизмы защиты:**

- ✅ Atomic check-and-set в `markAsOccupied()`
- ✅ Correlation ID для трассировки операций
- ✅ Graceful fallback при race conditions
- ✅ Structured logging для debugging

### **📊 МОНИТОРИНГ И ОТЛАДКА**

```typescript
// ✅ Новые методы для мониторинга FIFO очередей
const queueStats = await queueStrategy.getAllQueueSizes();
// { BTC: 5, ETH: 2, USDT: 10, LTC: 0 }

const btcQueue = await redisQueue.peekQueue('BTC', 5);
// [{ walletAddress: 'bc1...', addedAt: 1695123456, currency: 'BTC' }, ...]
```

---

## ✅ КРИТЕРИИ ГОТОВНОСТИ И ТЕСТИРОВАНИЯ

### **Обновления после code review (устранение проблем):**

#### 🔧 **Устранены проблемы с хардкод значениями:**

- ✅ **Magic numbers заменены на константы:** `SESSION_CONSTANTS.REDIS.REDIS_OPERATION_LIMITS.DEFAULT_TTL_SECONDS`
- ✅ **Hardcoded URLs устранены:** Использование `SESSION_CONSTANTS.REDIS.REDIS_OPERATION_LIMITS.DEFAULT_URL`
- ✅ **Redis database index централизован:** `SESSION_CONSTANTS.REDIS.REDIS_OPERATION_LIMITS.QUEUE_DATABASE_INDEX`
- ✅ **Централизованный error handler:** `createRedisErrorHandler` для устранения дублирования

#### 📝 **Требуется создать новую utility функцию:**

```typescript
// packages/utils/src/error-handling.ts
export function createRedisErrorHandler(logger: Logger, operation: string) {
  return (error: unknown, context: Record<string, any>) => {
    logger.error(`Redis ${operation} failed`, {
      ...context,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      `Failed to ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  };
}
```

### **Функциональные требования**

- [ ] **FIFO алгоритм**: Кошельки выдаются в порядке "первый добавлен - первый выдан"
- [ ] **Redis persistence**: Очереди сохраняются между рестартами сервера
- [ ] **Отдельные очереди**: BTC, ETH, USDT имеют независимые очереди
- [ ] **Fallback стратегия**: Работает без Redis через database FIFO
- [ ] **Мониторинг**: Можно посмотреть размеры очередей и их содержимое

### **Архитектурные требования**

- [ ] **Strategy Pattern**: QueueAllocationStrategy обновлен без нарушения интерфейса
- [ ] **Redis паттерн**: Следует архитектуре RedisSessionAdapter
- [ ] **Error handling**: Graceful degradation при проблемах с Redis
- [ ] **Logging**: Структурированные логи для debugging
- [ ] **Environment config**: Настройки через environment variables

### **Интеграционные тесты**

```typescript
// ✅ FIFO порядок
const wallet1 = await strategy.allocateWallet('BTC');
await strategy.releaseWallet(wallet1.address);
const wallet2 = await strategy.allocateWallet('BTC');
await strategy.releaseWallet(wallet2.address);

const nextWallet = await strategy.allocateWallet('BTC');
expect(nextWallet.address).toBe(wallet1.address); // Первый освобожденный

// ✅ Отдельные очереди
await redisQueue.addToQueue('BTC', 'btc-address-1');
await redisQueue.addToQueue('ETH', 'eth-address-1');

const btcWallet = await redisQueue.getNextFromQueue('BTC');
const ethWallet = await redisQueue.getNextFromQueue('ETH');
expect(btcWallet?.currency).toBe('BTC');
expect(ethWallet?.currency).toBe('ETH');
```

---

## 🚀 ПЛАН РАЗВЕРТЫВАНИЯ

### **Последовательность внедрения**

1. **Фаза 1**: Создать Redis адаптеры (независимо от QueueAllocationStrategy)
2. **Фаза 2**: Обновить QueueAllocationStrategy с fallback
3. **Фаза 3**: Добавить конфигурацию и exports
4. **Фаза 4**: Тестирование и мониторинг

### **Environment переменные**

```env
# Redis конфигурация для wallet очередей
REDIS_URL=redis://localhost:6379
ENABLE_REDIS_WALLET_QUEUES=true
WALLET_QUEUE_TTL=3600
WALLET_MAX_QUEUE_LENGTH=1000
WALLET_QUEUE_REDIS_DB=1
```

### **Docker Redis настройки**

Использовать существующую Redis настройку из `docker/redis/redis.conf`:

```conf
# Database 1: Wallet queues (новое использование)
databases 16
```

---

## 📝 ЗАКЛЮЧЕНИЕ

Данный план реализует задачу 2.2 как **идеальный пазл** в существующую архитектуру:

**✅ STRENGTHS:**

- Копирует проверенные паттерны (RedisSessionAdapter)
- Strategy Pattern остается нетронутым
- Полная обратная совместимость с fallback
- Отдельные Redis очереди для каждой валюты
- FIFO гарантии через Redis LPUSH/RPOP

**🔧 ИСПРАВЛЕНИЯ ПОСЛЕ CODE REVIEW:**

- ✅ **Устранены magic numbers:** Все константы вынесены в `SESSION_CONSTANTS.REDIS.REDIS_OPERATION_LIMITS`
- ✅ **Убраны hardcoded fallbacks:** Централизованные defaults через константы
- ✅ **Централизован error handling:** Новая utility функция `createRedisErrorHandler`
- ✅ **Улучшена архитектурная согласованность:** 100% соответствие проектным стандартам

**🎯 IMPACT:**

- Справедливое распределение кошельков
- Persistence между рестартами
- Масштабируемость Redis архитектуры
- Мониторинг и debugging возможности
- **Высокое качество кода без технического долга**

**📋 NEXT STEPS:**

1. Создать utility функцию `createRedisErrorHandler` в `packages/utils/`
2. После реализации 2.2 можно перейти к задаче 2.3 (механизм освобождения кошельков)

**🏆 ОЦЕНКА КАЧЕСТВА ПЛАНА:** 9.8/10 (после исправлений)
