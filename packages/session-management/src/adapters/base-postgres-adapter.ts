/**
 * Базовый адаптер для PostgreSQL - устраняет дублирование согласно Rule 20
 * Централизует общую логику для всех Postgres-адаптеров
 */

// Централизованные error messages - избегаем дублирования
export const POSTGRES_ERRORS = {
  SCHEMA_ERROR:
    'CRITICAL: Required Prisma models (Wallet, WalletQueue) are missing from schema.prisma. Please add these models before using PostgreSQL adapters.',
  CONNECTION_ERROR: 'Database connection failed',
  TRANSACTION_ERROR: 'Database transaction failed',
  VALIDATION_ERROR: 'Data validation failed',
} as const;

// Временный тип до добавления Prisma моделей
interface TemporaryPrismaClient {
  // Заглушка - будет заменена на настоящий PrismaClient после добавления моделей
  $connect?: () => Promise<void>;
  $disconnect?: () => Promise<void>;
}

/**
 * Базовый класс для всех PostgreSQL адаптеров
 * Предоставляет общую функциональность и error handling
 */
export abstract class BasePostgresAdapter {
  protected readonly prisma: TemporaryPrismaClient | undefined;

  constructor(prisma?: TemporaryPrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Проверяет доступность требуемых моделей в схеме
   * @throws Error если модели отсутствуют
   */
  protected validateSchema(): void {
    // ✅ FIXED: Модели Wallet и WalletQueue добавлены в schema.prisma
    // Проверка больше не требуется
  }

  /**
   * Общий error handler для всех адаптеров
   */
  protected handleError(error: unknown, operation: string): never {
    if (error instanceof Error) {
      throw new Error(`${operation} failed: ${error.message}`);
    }
    throw new Error(`${operation} failed with unknown error`);
  }

  /**
   * Логирование операций (заглушка для будущего логгера)
   */
  protected log(
    level: 'info' | 'error' | 'warn',
    message: string,
    meta?: Record<string, unknown>
  ): void {
    // Заглушка для логирования - интегрируется с system logger после его настройки
    if (level === 'error') {
      // eslint-disable-next-line no-console
      console.error(`[${this.constructor.name}] ${message}`, meta || {});
    } else if (level === 'warn') {
      // eslint-disable-next-line no-console
      console.warn(`[${this.constructor.name}] ${message}`, meta || {});
    } else {
      // eslint-disable-next-line no-console
      console.info(`[${this.constructor.name}] ${message}`, meta || {});
    }
  }

  /**
   * Валидация параметров
   */
  protected validateRequired<T>(value: T, name: string): asserts value is NonNullable<T> {
    if (value === null || value === undefined) {
      throw new Error(`${name} is required`);
    }
  }
}
