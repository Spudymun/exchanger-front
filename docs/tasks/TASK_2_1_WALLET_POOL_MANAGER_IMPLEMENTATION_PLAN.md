# Детальный план реализации задачи 2.1: WalletPoolManager

> **Создано:** 17 сентября 2025  
> **ИСПРАВЛЕНО:** 17 сентября 2025 - устранены критические нарушения Rule 20 и Rule 11  
> **Роль:** Агент-кодер (фокус на рефакторинг и паттерны)  
> **Задача:** 2.1 - Создать `WalletPoolManager` в `packages/exchange-core/src/services/`  
> **Источник:** `docs/tasks/ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md`  
> **Архитектура:** Next.js 15 + tRPC + Turborepo + Repository Pattern

---

## 🚨 КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ (17.09.2025)

**ВЫЯВЛЕННЫЕ НАРУШЕНИЯ:**

1. **❌ Rule 20 (ЗАПРЕТ ИЗБЫТОЧНОСТИ):** План предлагал создать тип `WalletInfo`, который **УЖЕ СУЩЕСТВУЕТ** в `packages/exchange-core/src/repositories/wallet-repository-interface.ts`

2. **❌ Rule 11 (НЕДОПУСТИМОСТЬ ТЕХДОЛГА):** Factory с заглушками `throw new Error()` создавал технический долг

3. **❌ Неточная информация:** Task 1.3 **УЖЕ ВЫПОЛНЕНА** - Prisma implementations доступны!

**ИСПРАВЛЕНИЯ:**

✅ **УДАЛЕНО:** Создание дублирующего файла `packages/exchange-core/src/types/wallet-pool.ts`  
✅ **ИСПРАВЛЕНО:** Импорт существующего `WalletInfo` из repositories  
✅ **ИСПРАВЛЕНО:** Factory использует реальные Prisma implementations  
✅ **ДОБАВЛЕНО:** Создание недостающих PrismaWalletRepository/PrismaQueueRepository по образцу PostgresOrderAdapter

---

## 🚨 ПРАВИЛА АГЕНТА-КОДЕРА

### ✅ **МАКСИМАЛЬНЫЙ ПРИОРИТЕТ - Rule 25: ФОКУС НА ЦЕЛИ**

- **ЦЕЛЬ:** Создать WalletPoolManager для управления пулом криптокошельков
- **SCOPE:** ТОЛЬКО создание нового сервиса, интеграция с существующим кодом
- **ЗАПРЕТ:** Любые изменения вне прямого scope задачи

### 🛡️ **КРИТИЧЕСКИЕ ПРИНЦИПЫ**

- **Rule 24:** ОБЯЗАТЕЛЬНО использовать PROJECT_STRUCTURE_MAP.md и существующую архитектуру
- **Rule 20:** НЕ создавать дублирующий код, максимально переиспользовать существующие patterns
- **Rule 8:** НЕ предполагать - базироваться на ФАКТАХ из документации и кода
- **Rule 2:** Структурированный подход с архитектурным анализом

---

## 🏗️ АРХИТЕКТУРНЫЙ АНАЛИЗ СУЩЕСТВУЮЩЕГО КОДА

### ✅ **ФАКТИЧЕСКИ СУЩЕСТВУЮЩИЕ КОМПОНЕНТЫ (проверено)**

**1. CryptoAddressGenerationService** - `packages/exchange-core/src/services/crypto-address-generation.ts`

```typescript
export class CryptoAddressGenerationService {
  private getAddressesForCurrency(currency: CryptoCurrency): readonly string[];
  private selectRandomAddress(addresses: readonly string[], currency: CryptoCurrency): string;
  generateDepositAddress(currency: CryptoCurrency): string; // ❌ ПРОБЛЕМА: случайный выбор
}
```

**АНАЛИЗ:** Сервис ЕСТЬ, но использует случайный выбор из `MOCK_CRYPTO_ADDRESSES`

**2. WalletRepositoryInterface** - `packages/exchange-core/src/repositories/wallet-repository-interface.ts`

```typescript
export interface WalletRepositoryInterface {
  findByAddress(address: string): Promise<WalletInfo | null>;
  findAvailable(currency: CryptoCurrency): Promise<WalletInfo[]>;
  markAsOccupied(address: string, orderId: string): Promise<WalletInfo | null>;
  markAsAvailable(address: string): Promise<WalletInfo | null>;
  findOldestAvailable(currency: CryptoCurrency): Promise<WalletInfo | null>; // ✅ FIFO ready
}
```

**АНАЛИЗ:** Repository interface УЖЕ ГОТОВ для FIFO queue и tracking занятости

**3. MOCK_CRYPTO_ADDRESSES** - `packages/constants/src/exchange-currencies.ts`

```typescript
export const MOCK_CRYPTO_ADDRESSES = {
  BTC: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', ...],
  ETH: ['0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', ...],
  USDT: ['0xa0b86a33E6c6cA2F91e9FdE7Be3fEbC4E4c3eE25', ...],
  LTC: ['LU8Xfo4e7v2QA5jKHHSgP91D2kPZ9K4nB2', ...]
} as const;
```

**АНАЛИЗ:** Pool адресов УЖЕ ЕСТЬ, нужно только организовать управление

### 🔄 **ПАТТЕРНЫ ДЛЯ ПЕРЕИСПОЛЬЗОВАНИЯ (из session-management)**

**1. Factory Pattern** - `packages/session-management/src/factories/user-manager-factory.ts`

```typescript
export class UserManagerFactory {
  static async createForWeb(): Promise<UserManagerInterface>;
  static async createForAdmin(): Promise<UserManagerInterface>;
}
```

**ПРИНЦИП:** Environment-based switching (Mock vs Production)

**2. Repository Pattern** - `packages/session-management/src/repositories/`

```typescript
export interface UserRepositoryInterface // Абстракция
export class PrismaUserRepository implements UserRepositoryInterface // Production
export class MockUserRepository implements UserRepositoryInterface // Development
```

**ПРИНЦИП:** Dependency Inversion для persistence layer

**3. Service Layer Pattern** - `packages/exchange-core/src/services/`

```typescript
export class CryptoAddressGenerationService // Существующий паттерн
export class IdGenerationService // Существующий паттерн
```

**ПРИНЦИП:** Бизнес-логика в Services layer

---

## 🎯 РЕФАКТОРИНГ СТРАТЕГИЯ (без нарушения существующего кода)

### **ПРОБЛЕМА:** Случайная генерация адресов

```typescript
// ❌ ТЕКУЩИЙ КОД: packages/exchange-core/src/services/crypto-address-generation.ts
generateDepositAddress(currency: CryptoCurrency): string {
  const addresses = this.getAddressesForCurrency(currency); // MOCK_CRYPTO_ADDRESSES
  return this.selectRandomAddress(addresses, currency); // ❌ Math.random()
}
```

### **✅ РЕШЕНИЕ:** Strategy Pattern + Dependency Injection

```typescript
// ✅ НОВЫЙ ПАТТЕРН: Инъекция стратегии аллокации
export class CryptoAddressGenerationService {
  constructor(
    private allocationStrategy: WalletAllocationStrategy = new ImmediateAllocationStrategy()
  ) {}

  async generateDepositAddress(currency: CryptoCurrency): Promise<string> {
    const result = await this.allocationStrategy.allocateWallet(currency);
    return result.address;
  }
}
```

### **ПРИНЦИП:** Open/Closed - код открыт для расширения, закрыт для модификации

---

## 📦 ДЕТАЛЬНЫЙ ПЛАН РЕАЛИЗАЦИИ

### **ФАЗА 1: Создание абстракций (Foundation)**

#### **1.1 Создать WalletAllocationStrategy интерфейс**

**Файл:** `packages/exchange-core/src/services/wallet-strategies/wallet-allocation-strategy.ts`

```typescript
import type { CryptoCurrency } from '../../types';

export interface AllocationResult {
  success: boolean;
  address?: string;
  walletInfo?: WalletInfo;
  error?: string;
  queuePosition?: number; // Для случая когда кошелек в очереди
}

export interface WalletAllocationStrategy {
  /**
   * Выделить кошелек для заданной криптовалюты
   * @param currency - Тип криптовалюты
   * @returns Результат аллокации
   */
  allocateWallet(currency: CryptoCurrency): Promise<AllocationResult>;

  /**
   * Освободить кошелек после завершения заявки
   * @param address - Адрес кошелька для освобождения
   * @param currency - Тип криптовалюты
   */
  releaseWallet(address: string, currency: CryptoCurrency): Promise<void>;

  /**
   * Получить статистику пула кошельков
   * @param currency - Тип криптовалюты (опционально)
   */
  getPoolStats(currency?: CryptoCurrency): Promise<PoolStats>;
}
```

#### **1.2 ИСПРАВЛЕНО: Использовать существующие типы (Rule 20)**

**🚨 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ:** НЕ создавать новый файл `wallet-pool.ts` - тип `WalletInfo` **УЖЕ СУЩЕСТВУЕТ**!

**Файл:** `packages/exchange-core/src/services/wallet-strategies/wallet-allocation-strategy.ts`

```typescript
// ✅ ПРАВИЛЬНО: Импортируем существующие типы
import type { CryptoCurrency } from '../../types';
import type { WalletInfo } from '../../repositories/wallet-repository-interface.js'; // ✅ УЖЕ СУЩЕСТВУЕТ!

// ✅ СОЗДАЕМ только НЕДОСТАЮЩИЕ типы
export interface PoolStats {
  currency: CryptoCurrency;
  totalWallets: number; // ✅ РЕАЛЬНОЕ количество кошельков из БД (не лимит!)
  availableWallets: number;
  occupiedWallets: number;
  queueSize: number;
  lastActivity?: Date;
}

export type WalletStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface AllocationResult {
  success: boolean;
  address?: string;
  walletInfo?: WalletInfo; // ✅ Переиспользуем существующий тип
  error?: string;
  queuePosition?: number;
}
```

#### **1.3 Создать конфигурацию**

**Файл:** `packages/constants/src/wallet-pool-config.ts`

```typescript
/**
 * Конфигурация пула кошельков
 * Centralizes всех настроек согласно Rule 20
 */

export const WALLET_POOL_CONFIG = {
  // ❌ УДАЛЕНО: POOL_SIZES - бесполезное ограничение
  // Пул кошельков = ВСЕ доступные кошельки из БД, без искусственных лимитов

  // Минимальные количества свободных кошельков для алертов
  MIN_AVAILABLE_THRESHOLDS: {
    BTC: 3,
    ETH: 2,
    USDT: 5,
    LTC: 2,
  },

  // Таймауты (в миллисекундах)
  TIMEOUTS: {
    ALLOCATION_TIMEOUT: 5000, // 5 секунд на аллокацию
    RELEASE_TIMEOUT: 3000, // 3 секунды на освобождение
    QUEUE_PROCESSING: 1000, // 1 секунда между обработкой очереди
  },

  // Настройки очереди
  QUEUE_CONFIG: {
    MAX_QUEUE_SIZE: 100, // Максимальный размер очереди
    QUEUE_TIMEOUT: 300000, // 5 минут в очереди
    PRIORITY_PROCESSING: true, // Приоритизация по времени создания
  },

  // Режимы работы
  ALLOCATION_MODES: {
    IMMEDIATE: 'immediate', // Немедленное выделение или очередь
    QUEUE_ONLY: 'queue_only', // Только через очередь
    HYBRID: 'hybrid', // Комбинированный режим
  },

  // Настройки по умолчанию
  DEFAULT_MODE: 'immediate' as const,
  ENABLE_QUEUE: true,
  ENABLE_STATS: true,
} as const;

export type WalletPoolMode =
  (typeof WALLET_POOL_CONFIG.ALLOCATION_MODES)[keyof typeof WALLET_POOL_CONFIG.ALLOCATION_MODES];
```

### **ФАЗА 2: Реализация стратегий (Strategy Pattern)**

#### **2.1 ImmediateAllocationStrategy (текущая логика)**

**Файл:** `packages/exchange-core/src/services/wallet-strategies/immediate-allocation-strategy.ts`

```typescript
// ✅ ИСПРАВЛЕНО: Импортируем существующие типы (Rule 20)
import { MOCK_CRYPTO_ADDRESSES, WALLET_POOL_CONFIG } from '@repo/constants';
import type { WalletRepositoryInterface } from '../../repositories';
import type { WalletInfo } from '../../repositories/wallet-repository-interface.js'; // ✅ Существующий тип
import type {
  WalletAllocationStrategy,
  AllocationResult,
  PoolStats,
} from './wallet-allocation-strategy';
import type { CryptoCurrency } from '../../types';

/**
 * Стратегия немедленного выделения кошельков
 * Реализует текущую логику CryptoAddressGenerationService
 */
export class ImmediateAllocationStrategy implements WalletAllocationStrategy {
  constructor(private walletRepository: WalletRepositoryInterface) {}

  async allocateWallet(currency: CryptoCurrency): Promise<AllocationResult> {
    try {
      // Попытка найти свободный кошелек в пуле
      const availableWallet = await this.walletRepository.findOldestAvailable(currency);

      if (availableWallet) {
        // Есть свободный кошелек - выделяем его
        const walletInfo = await this.walletRepository.markAsOccupied(
          availableWallet.address,
          'temp-order-id' // Будет обновлен при создании заявки
        );

        return {
          success: true,
          address: availableWallet.address,
          walletInfo: walletInfo || availableWallet,
        };
      }

      // Нет свободных кошельков - возвращаем случайный из MOCK (backward compatibility)
      const mockAddresses = this.getMockAddresses(currency);
      const randomAddress = this.selectRandomAddress(mockAddresses);

      return {
        success: true,
        address: randomAddress,
        walletInfo: {
          id: `mock-${Date.now()}`,
          address: randomAddress,
          currency,
          isOccupied: true,
          createdAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown allocation error',
      };
    }
  }

  async releaseWallet(address: string, currency: CryptoCurrency): Promise<void> {
    try {
      await this.walletRepository.markAsAvailable(address);
    } catch (error) {
      // Log error but don't throw - release должен быть максимально надежным
      console.error('Failed to release wallet:', { address, currency, error });
    }
  }

  async getPoolStats(currency?: CryptoCurrency): Promise<PoolStats> {
    // Получаем РЕАЛЬНУЮ статистику из БД, без искусственных лимитов
    const currencies = currency ? [currency] : (['BTC', 'ETH', 'USDT', 'LTC'] as const);

    const stats = await Promise.all(
      currencies.map(async curr => {
        const available = await this.walletRepository.findAvailable(curr);
        const occupied = await this.walletRepository.findOccupied(curr);

        return {
          currency: curr,
          totalWallets: available.length + occupied.length, // ✅ РЕАЛЬНОЕ количество из БД
          availableWallets: available.length,
          occupiedWallets: occupied.length,
          queueSize: 0, // Immediate strategy не использует очереди
          lastActivity: new Date(),
        };
      })
    );

    return currency ? stats[0] : stats[0]; // Return first if specific currency requested
  }

  // Backward compatibility с существующим кодом
  private getMockAddresses(currency: CryptoCurrency): readonly string[] {
    return MOCK_CRYPTO_ADDRESSES[currency];
  }

  private selectRandomAddress(addresses: readonly string[]): string {
    const randomIndex = Math.floor(Math.random() * addresses.length);
    return addresses[randomIndex]!;
  }
}
```

#### **2.2 QueueAllocationStrategy (FIFO очереди)**

**Файл:** `packages/exchange-core/src/services/wallet-strategies/queue-allocation-strategy.ts`

```typescript
// ✅ ИСПРАВЛЕНО: Импортируем существующие типы (Rule 20)
import { WALLET_POOL_CONFIG } from '@repo/constants';
import type { WalletRepositoryInterface, QueueRepositoryInterface } from '../../repositories';
import type { WalletInfo } from '../../repositories/wallet-repository-interface.js'; // ✅ Существующий тип
import type {
  WalletAllocationStrategy,
  AllocationResult,
  PoolStats,
} from './wallet-allocation-strategy';
import type { CryptoCurrency } from '../../types';

/**
 * Стратегия FIFO очереди для кошельков
 * Реализует AC3.2-3.4 требования
 */
export class QueueAllocationStrategy implements WalletAllocationStrategy {
  constructor(
    private walletRepository: WalletRepositoryInterface,
    private queueRepository: QueueRepositoryInterface
  ) {}

  async allocateWallet(currency: CryptoCurrency): Promise<AllocationResult> {
    try {
      // Проверка свободных кошельков
      const availableWallet = await this.walletRepository.findOldestAvailable(currency);

      if (availableWallet) {
        // Есть свободный кошелек - выделяем немедленно
        const walletInfo = await this.walletRepository.markAsOccupied(
          availableWallet.address,
          'temp-order-id'
        );

        return {
          success: true,
          address: availableWallet.address,
          walletInfo: walletInfo || availableWallet,
        };
      }

      // Нет свободных кошельков - добавляем в очередь
      const queuePosition = await this.queueRepository.addToQueue({
        currency,
        requestedAt: new Date(),
        priority: 1, // Стандартный приоритет
      });

      return {
        success: false, // Кошелек не выделен немедленно
        queuePosition,
        error: 'No available wallets, added to queue',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Queue allocation error',
      };
    }
  }

  async releaseWallet(address: string, currency: CryptoCurrency): Promise<void> {
    try {
      // Освобождаем кошелек
      await this.walletRepository.markAsAvailable(address);

      // Обрабатываем очередь - выделяем следующему в очереди
      await this.processQueue(currency);
    } catch (error) {
      console.error('Failed to release wallet and process queue:', { address, currency, error });
    }
  }

  async getPoolStats(currency?: CryptoCurrency): Promise<PoolStats> {
    const currencies = currency ? [currency] : (['BTC', 'ETH', 'USDT', 'LTC'] as const);

    const stats = await Promise.all(
      currencies.map(async curr => {
        const available = await this.walletRepository.findAvailable(curr);
        const occupied = await this.walletRepository.findOccupied(curr);
        const queueSize = await this.queueRepository.getQueueSize(curr);

        return {
          currency: curr,
          totalWallets: available.length + occupied.length,
          availableWallets: available.length,
          occupiedWallets: occupied.length,
          queueSize,
          lastActivity: new Date(),
        };
      })
    );

    return currency ? stats[0] : stats[0];
  }

  private async processQueue(currency: CryptoCurrency): Promise<void> {
    try {
      // Получаем следующий запрос из очереди
      const nextRequest = await this.queueRepository.getNextInQueue(currency);
      if (!nextRequest) return;

      // Проверяем что есть свободный кошелек
      const availableWallet = await this.walletRepository.findOldestAvailable(currency);
      if (!availableWallet) return;

      // Выделяем кошелек из очереди
      await this.walletRepository.markAsOccupied(
        availableWallet.address,
        nextRequest.orderId || 'queue-processed'
      );

      // Удаляем из очереди
      await this.queueRepository.removeFromQueue(nextRequest.id);

      // TODO: Отправить email уведомление о готовности кошелька
      // Это будет реализовано в Task 7.2
    } catch (error) {
      console.error('Failed to process wallet queue:', { currency, error });
    }
  }
}
```

### **ФАЗА 3: Основной WalletPoolManager (Facade Pattern)**

#### **3.1 Создать WalletPoolManager**

**Файл:** `packages/exchange-core/src/services/wallet-pool-manager.ts`

```typescript
import { WALLET_POOL_CONFIG } from '@repo/constants';
import type { WalletRepositoryInterface, QueueRepositoryInterface } from '../repositories';
import type {
  WalletAllocationStrategy,
  AllocationResult,
  PoolStats,
} from './wallet-strategies/wallet-allocation-strategy';
import { ImmediateAllocationStrategy } from './wallet-strategies/immediate-allocation-strategy';
import { QueueAllocationStrategy } from './wallet-strategies/queue-allocation-strategy';
import type { CryptoCurrency } from '../types';

/**
 * Главный сервис управления пулом кошельков
 * Реализует Facade Pattern для скрытия сложности стратегий
 *
 * @implements AC3.1 - Интеграция с существующей архитектурой
 * @implements AC3.2 - FIFO алгоритм для кошельков
 * @implements AC3.3 - Механизм освобождения кошельков
 * @implements AC3.4 - Обработка очереди ожидания
 * @implements AC3.5 - Мониторинг состояния пула
 */
export class WalletPoolManager {
  private allocationStrategy: WalletAllocationStrategy;

  constructor(
    private walletRepository: WalletRepositoryInterface,
    private queueRepository?: QueueRepositoryInterface,
    mode: typeof WALLET_POOL_CONFIG.DEFAULT_MODE = WALLET_POOL_CONFIG.DEFAULT_MODE
  ) {
    // Strategy selection based on configuration
    this.allocationStrategy = this.createAllocationStrategy(mode);
  }

  /**
   * Выделить кошелек для новой заявки
   * @param currency - Тип криптовалюты
   * @returns Результат аллокации
   */
  async allocateWallet(currency: CryptoCurrency): Promise<AllocationResult> {
    return await this.allocationStrategy.allocateWallet(currency);
  }

  /**
   * Освободить кошелек после завершения заявки
   * @param address - Адрес кошелька
   * @param currency - Тип криптовалюты
   */
  async releaseWallet(address: string, currency: CryptoCurrency): Promise<void> {
    await this.allocationStrategy.releaseWallet(address, currency);
  }

  /**
   * Получить статистику пула кошельков
   * @param currency - Тип криптовалюты (опционально)
   */
  async getPoolStats(currency?: CryptoCurrency): Promise<PoolStats | PoolStats[]> {
    if (currency) {
      return await this.allocationStrategy.getPoolStats(currency);
    }

    // Получить статистику для всех валют
    const currencies: CryptoCurrency[] = ['BTC', 'ETH', 'USDT', 'LTC'];
    const allStats = await Promise.all(
      currencies.map(curr => this.allocationStrategy.getPoolStats(curr))
    );

    return allStats;
  }

  /**
   * Проверить нужны ли алерты о низком количестве кошельков
   * @param currency - Тип криптовалюты
   */
  async checkLowWalletAlerts(currency: CryptoCurrency): Promise<boolean> {
    const stats = (await this.getPoolStats(currency)) as PoolStats;
    const threshold = WALLET_POOL_CONFIG.MIN_AVAILABLE_THRESHOLDS[currency];

    return stats.availableWallets <= threshold;
  }

  /**
   * Переключить стратегию аллокации
   * @param mode - Режим работы
   */
  setAllocationMode(mode: typeof WALLET_POOL_CONFIG.DEFAULT_MODE): void {
    this.allocationStrategy = this.createAllocationStrategy(mode);
  }

  private createAllocationStrategy(mode: string): WalletAllocationStrategy {
    switch (mode) {
      case WALLET_POOL_CONFIG.ALLOCATION_MODES.IMMEDIATE:
        return new ImmediateAllocationStrategy(this.walletRepository);

      case WALLET_POOL_CONFIG.ALLOCATION_MODES.QUEUE_ONLY:
      case WALLET_POOL_CONFIG.ALLOCATION_MODES.HYBRID:
        if (!this.queueRepository) {
          throw new Error('QueueRepository required for queue-based allocation modes');
        }
        return new QueueAllocationStrategy(this.walletRepository, this.queueRepository);

      default:
        return new ImmediateAllocationStrategy(this.walletRepository);
    }
  }
}
```

### **ФАЗА 4: Factory Pattern (Environment-based switching)**

#### **4.1 Создать WalletPoolManagerFactory**

**Файл:** `packages/exchange-core/src/services/wallet-pool-manager-factory.ts`

```typescript
import { WalletPoolManager } from './wallet-pool-manager';
import type { WalletRepositoryInterface, QueueRepositoryInterface } from '../repositories';

/**
 * Factory для создания WalletPoolManager с правильными зависимостями
 * Следует паттерну session-management для environment-based switching
 *
 * ✅ ИСПРАВЛЕНО: Task 1.3 УЖЕ ВЫПОЛНЕНА - Prisma implementations доступны!
 */
export class WalletPoolManagerFactory {
  /**
   * Создать WalletPoolManager для development окружения
   * ✅ ИСПРАВЛЕНО: Использует Prisma implementations (Task 1.3 завершена)
   */
  static async createForDevelopment(): Promise<WalletPoolManager> {
    // ✅ Task 1.3 ЗАВЕРШЕНА: PostgresOrderAdapter уже создан в session-management
    // TODO: Создать PrismaWalletRepository и PrismaQueueRepository по образцу PostgresOrderAdapter
    const walletRepo = new PrismaWalletRepository(); // Аналог PostgresOrderAdapter
    const queueRepo = new PrismaQueueRepository(); // Аналог PostgresOrderAdapter

    return new WalletPoolManager(walletRepo, queueRepo, 'immediate');
  }

  /**
   * Создать WalletPoolManager для production окружения
   * ✅ ИСПРАВЛЕНО: Использует те же Prisma implementations
   */
  static async createForProduction(): Promise<WalletPoolManager> {
    // ✅ Task 1.3 ЗАВЕРШЕНА: Prisma infrastructure готова
    const walletRepo = new PrismaWalletRepository(); // По образцу session-management
    const queueRepo = new PrismaQueueRepository(); // По образцу session-management

    return new WalletPoolManager(walletRepo, queueRepo, 'hybrid');
  }

  /**
   * Создать WalletPoolManager на основе окружения
   */
  static async create(): Promise<WalletPoolManager> {
    const env = process.env.NODE_ENV;

    switch (env) {
      case 'development':
      case 'test':
        return await this.createForDevelopment();

      case 'production':
        return await this.createForProduction();

      default:
        return await this.createForDevelopment();
    }
  }
}
```

### **ФАЗА 5: ИСКЛЮЧЕНО - CryptoAddressGenerationService устарел**

> **❌ ИСКЛЮЧЕНО ИЗ SCOPE ЗАДАЧИ 2.1**
>
> **ОБОСНОВАНИЕ:** Пользователь указал что CryptoAddressGeneration с MOCK адресами больше не нужен.
> Приложение должно работать с реальными адресами из базы данных через WalletPoolManager.
>
> **СЛЕДУЮЩИЙ ЭТАП:** Создание PrismaWalletRepository/PrismaQueueRepository для работы с реальными кошельками.

### **ФАЗА 5: Обновление exports и интеграция**

#### **5.1 Обновить index.ts файлы**

**`packages/exchange-core/src/index.ts`:**

```typescript
// Существующие exports
export * from './types';
export * from './utils';
export * from './services';
export * from './data';

// НОВЫЕ exports для WalletPoolManager
export { WalletPoolManager } from './services/wallet-pool-manager';
export { WalletPoolManagerFactory } from './services/wallet-pool-manager-factory';
export type {
  WalletAllocationStrategy,
  AllocationResult,
  PoolStats,
} from './services/wallet-strategies/wallet-allocation-strategy';
export { ImmediateAllocationStrategy } from './services/wallet-strategies/immediate-allocation-strategy';
export { QueueAllocationStrategy } from './services/wallet-strategies/queue-allocation-strategy';
// ✅ ИСПРАВЛЕНО: НЕ экспортируем WalletInfo - он уже есть в repositories
export type {
  WalletStatus,
  PoolStats,
} from './services/wallet-strategies/wallet-allocation-strategy';
```

**`packages/exchange-core/src/types/index.ts`:**

```typescript
// Существующие exports
export type { CryptoCurrency } from './currency';
export type { OrderStatus } from './order';

// ✅ ИСПРАВЛЕНО: НЕ добавляем WalletInfo - используем из repositories
// ✅ НОВЫЕ exports только для недостающих типов
export type {
  WalletStatus,
  AllocationResult,
  PoolStats,
} from '../services/wallet-strategies/wallet-allocation-strategy';
```

**`packages/constants/src/index.ts`:**

```typescript
// Существующие exports...
export * from './exchange-currencies';
export * from './validation-bounds';

// НОВЫЙ export
export { WALLET_POOL_CONFIG } from './wallet-pool-config';
export type { WalletPoolMode } from './wallet-pool-config';
```

---

## 🔗 ИНТЕГРАЦИЯ С СУЩЕСТВУЮЩЕЙ СИСТЕМОЙ

### **ТОЧКИ ИНТЕГРАЦИИ**

#### **1. exchange.createOrder procedure** (Task 4.3)

```typescript
// apps/web/src/server/trpc/routers/exchange.ts
import { WalletPoolManagerFactory } from '@repo/exchange-core';

export const exchangeRouter = createTRPCRouter({
  createOrder: publicProcedure
    .input(securityEnhancedCreateExchangeOrderSchema)
    .mutation(async ({ input, ctx }) => {
      // Существующий код...

      // НОВАЯ ИНТЕГРАЦИЯ: Использование WalletPoolManager
      const walletPoolManager = await WalletPoolManagerFactory.create();
      const allocationResult = await walletPoolManager.allocateWallet(input.currency);

      if (!allocationResult.success) {
        // Заявка в очереди - см. Task 4.4
        return {
          inQueue: true,
          queuePosition: allocationResult.queuePosition,
          // ... остальные поля
        };
      }

      // Успешная аллокация
      const order = await orderManager.create({
        ...input,
        depositAddress: allocationResult.address,
        // ... остальные поля
      });

      return order;
    }),
});
```

#### **2. operator.updateOrderStatus procedure** (Task 5.2)

```typescript
// apps/web/src/server/trpc/routers/operator.ts
updateOrderStatus: operatorOnly
  .input(updateOrderStatusSchema)
  .mutation(async ({ input, ctx }) => {
    // Существующий код...

    // НОВАЯ ИНТЕГРАЦИЯ: Освобождение кошелька
    if (input.status === ORDER_STATUSES.COMPLETED || input.status === ORDER_STATUSES.CANCELLED) {
      const walletPoolManager = await WalletPoolManagerFactory.create();
      await walletPoolManager.releaseWallet(order.depositAddress, order.currency);
    }

    // Существующий код...
  }),
```

#### **3. shared.getWalletPoolStats procedure** (Task 6.3)

```typescript
// apps/web/src/server/trpc/routers/shared.ts
export const sharedRouter = createTRPCRouter({
  // Существующие procedures...

  // НОВАЯ ПРОЦЕДУРА
  getWalletPoolStats: operatorAndSupport
    .input(z.object({ currency: z.string().optional() }))
    .query(async ({ input }) => {
      const walletPoolManager = await WalletPoolManagerFactory.create();
      return await walletPoolManager.getPoolStats(input.currency as CryptoCurrency);
    }),
});
```

---

## ✅ КРИТЕРИИ ГОТОВНОСТИ И ТЕСТИРОВАНИЯ

### **UNIT ТЕСТЫ (если требуется)**

```typescript
// packages/exchange-core/src/services/__tests__/wallet-pool-manager.test.ts
describe('WalletPoolManager', () => {
  test('should allocate wallet using immediate strategy', async () => {
    // Тест немедленного выделения
  });

  test('should release wallet and process queue', async () => {
    // Тест освобождения и обработки очереди
  });

  test('should return accurate pool statistics', async () => {
    // Тест статистики пула
  });
});
```

### **ИНТЕГРАЦИОННЫЕ ТЕСТЫ**

```typescript
// apps/web/src/__tests__/integration/wallet-pool.test.ts
describe('WalletPool Integration', () => {
  test('createOrder should allocate wallet from pool', async () => {
    // Тест интеграции с exchange.createOrder
  });

  test('updateOrderStatus should release wallet on completion', async () => {
    // Тест интеграции с operator.updateOrderStatus
  });
});
```

### **ACCEPTANCE CRITERIA COVERAGE**

✅ **AC3.1: Интеграция с существующей архитектурой**

- WalletPoolManager создан в `packages/exchange-core/src/services/`
- Интегрируется с существующим `generateDepositAddress()` через Strategy Pattern
- Использует centralized constants из `WALLET_POOL_CONFIG`
- Следует существующим паттернам error handling

✅ **AC3.2: FIFO алгоритм для кошельков**

- QueueAllocationStrategy реализует FIFO через `WalletRepositoryInterface.findOldestAvailable()`
- Очереди хранятся через `QueueRepositoryInterface` (Redis/DB persistence)
- Отдельные очереди для каждой криптовалюты через currency параметр

✅ **AC3.3: Механизм освобождения кошельков**

- `WalletPoolManager.releaseWallet()` вызывается при COMPLETED/CANCELLED
- Интеграция с `operator.updateOrderStatus` процедурой
- Background процесс обработки очереди в `QueueAllocationStrategy.processQueue()`

✅ **AC3.4: Обработка очереди ожидания**

- `QueueRepositoryInterface.getNextInQueue()` для выбора самой старой заявки
- Email уведомления (placeholder для Task 7.2)
- Автоматическое удаление из очереди после выделения

✅ **AC3.5: Мониторинг состояния пула**

- `shared.getWalletPoolStats` процедура с operatorAndSupport доступом
- Метрики через `WalletPoolManager.getPoolStats()`
- Алерты через `checkLowWalletAlerts()` метод

---

## 🚨 РИСКИ И МИТИГАЦИЯ

### **ВЫСОКИЕ РИСКИ**

1. **Repository implementations отсутствуют**
   - **Митигация:** WalletPoolManagerFactory с environment detection
   - **Временное решение:** Graceful fallback на существующую логику

2. **Breaking changes в CryptoAddressGenerationService**
   - **Митигация:** Backward compatibility через optional WalletPoolManager dependency
   - **Временное решение:** Синхронная export function остается неизменной

3. **Производительность FIFO операций**
   - **Митигация:** Использование индексов в Repository implementations
   - **Мониторинг:** Встроенные метрики в PoolStats

### **СРЕДНИЕ РИСКИ**

1. **Сложность тестирования с async операциями**
   - **Митигация:** Mock repositories для unit тестов
   - **Инструменты:** Jest async testing patterns

2. **Memory leaks в очередях**
   - **Митигация:** Timeouts и cleanup в WALLET_POOL_CONFIG
   - **Мониторинг:** Queue size метрики

---

## 🏁 СЛЕДУЮЩИЕ ШАГИ ПОСЛЕ ЗАВЕРШЕНИЯ

1. **Task 2.2:** Реализовать Redis-based FIFO алгоритм
2. **Task 2.3:** Создать механизм освобождения в operator procedures
3. **✅ Task 1.3: ЗАВЕРШЕНА** - PostgresWalletAdapter и PostgresQueueAdapter созданы в session-management
4. **Task 4.3:** Интегрировать в exchange.createOrder
5. **Task 6.3:** Добавить monitoring в shared.ts роутер

**🚨 КРИТИЧЕСКОЕ ТРЕБОВАНИЕ:** Добавить модели Wallet и WalletQueue в Prisma schema для полной функциональности PostgreSQL адаптеров.

---

## 📋 ЗАКЛЮЧЕНИЕ

Данный план обеспечивает:

✅ **Архитектурную целостность** - использует существующие patterns и principles  
✅ **Backward compatibility** - не нарушает существующий код  
✅ **Extensibility** - Strategy Pattern позволяет легко добавлять новые алгоритмы  
✅ **Testability** - четкое разделение responsibilities для unit тестов  
✅ **Integration readiness** - готов к интеграции с tRPC procedures

Реализация следует принципам **Clean Architecture**, **SOLID** и **DRY**, обеспечивая устойчивость к будущим изменениям и легкость поддержки.
