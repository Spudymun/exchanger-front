import { UI_NUMERIC_CONSTANTS, DECIMAL_PRECISION } from '@repo/constants';

/**
 * Service for generating various types of IDs
 * Moved from validation.ts to eliminate side effects from utils layer
 */
export class IdGenerationService {
  /**
   * Generate unique order ID with timestamp and random suffix
   * @param deterministicTimestamp - для тестов можно передать фиксированный timestamp
   */
  generateOrderId(deterministicTimestamp?: number): string {
    const timestamp = deterministicTimestamp ?? Date.now();
    const randomSuffix = Math.random()
      .toString(UI_NUMERIC_CONSTANTS.ID_GENERATION_BASE)
      .substr(UI_NUMERIC_CONSTANTS.SUBSTR_START_INDEX, DECIMAL_PRECISION.ORDER_ID_RANDOM_LENGTH);

    return `order_${timestamp}_${randomSuffix}`;
  }

  /**
   * Generate deterministic order ID for testing
   * @param testTimestamp - фиксированный timestamp для детерминированных тестов
   * @param testSuffix - фиксированный суффикс для детерминированных тестов
   */
  generateTestOrderId(testTimestamp: number, testSuffix: string): string {
    return `order_${testTimestamp}_${testSuffix}`;
  }

  /**
   * Generate secure session ID using crypto API
   */
  generateSessionId(): string {
    return crypto.randomUUID();
  }

  /**
   * Generate transaction ID for tracking
   */
  generateTransactionId(): string {
    const hexBase = 16;
    const substrStart = 2;
    const randomLength = 8;
    return `tx_${Date.now()}_${Math.random().toString(hexBase).substr(substrStart, randomLength)}`;
  }
}

// Export convenience functions for backward compatibility
const idService = new IdGenerationService();

export function generateOrderId(deterministicTimestamp?: number): string {
  return idService.generateOrderId(deterministicTimestamp);
}

export function generateTestOrderId(testTimestamp: number, testSuffix: string): string {
  return idService.generateTestOrderId(testTimestamp, testSuffix);
}

export function generateSessionId(): string {
  return idService.generateSessionId();
}

export function generateId(): string {
  return idService.generateSessionId();
}

export function generateTransactionId(): string {
  return idService.generateTransactionId();
}
