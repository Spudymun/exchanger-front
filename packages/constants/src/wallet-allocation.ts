/**
 * Константы для системы аллокации кошельков
 * Централизует все константы связанные с аллокацией согласно Rule 17
 */

/**
 * Префиксы для создания уникальных ключей аллокации
 */
export const WALLET_ALLOCATION_CONSTANTS = {
  /**
   * Префикс для генерации ключей аллокации кошельков
   * Используется для создания уникальных идентификаторов: `${PREFIX}${timestamp}`
   */
  ALLOCATION_KEY_PREFIX: 'allocation-',

  /**
   * Префикс для генерации ключей очереди
   * Используется для создания уникальных идентификаторов очереди: `${PREFIX}${timestamp}`
   */
  QUEUE_KEY_PREFIX: 'queue-',

  /**
   * Приоритеты для очереди аллокации кошельков
   */
  PRIORITIES: {
    /**
     * Стандартный приоритет для обычных операций
     */
    STANDARD: 1,
    
    /**
     * Высокий приоритет для критических операций
     */
    HIGH: 5,
    
    /**
     * Низкий приоритет для фоновых операций
     */
    LOW: 0,
  },

  /**
   * Статусы аллокации кошельков
   */
  ALLOCATION_STATUSES: {
    PENDING: 'pending',
    ALLOCATED: 'allocated',
    FAILED: 'failed',
    EXPIRED: 'expired',
  },

  /**
   * Типы операций аллокации
   */
  OPERATION_TYPES: {
    IMMEDIATE: 'immediate',
    QUEUED: 'queued',
    RETRY: 'retry',
  },
} as const;

/**
 * Утилитарные функции для работы с аллокацией
 */
export const WALLET_ALLOCATION_UTILS = {
  /**
   * Генерирует уникальный ключ аллокации с временной меткой
   */
  generateAllocationKey: (): string => {
    return `${WALLET_ALLOCATION_CONSTANTS.ALLOCATION_KEY_PREFIX}${Date.now()}`;
  },

  /**
   * Генерирует уникальный ключ очереди с временной меткой
   */
  generateQueueKey: (): string => {
    return `${WALLET_ALLOCATION_CONSTANTS.QUEUE_KEY_PREFIX}${Date.now()}`;
  },

  /**
   * Проверяет валидность ключа аллокации
   */
  isValidAllocationKey: (key: string): boolean => {
    return key.startsWith(WALLET_ALLOCATION_CONSTANTS.ALLOCATION_KEY_PREFIX);
  },
} as const;

/**
 * Типы для TypeScript
 */
export type AllocationPriority = typeof WALLET_ALLOCATION_CONSTANTS.PRIORITIES[keyof typeof WALLET_ALLOCATION_CONSTANTS.PRIORITIES];
export type AllocationStatus = typeof WALLET_ALLOCATION_CONSTANTS.ALLOCATION_STATUSES[keyof typeof WALLET_ALLOCATION_CONSTANTS.ALLOCATION_STATUSES];
export type OperationType = typeof WALLET_ALLOCATION_CONSTANTS.OPERATION_TYPES[keyof typeof WALLET_ALLOCATION_CONSTANTS.OPERATION_TYPES];