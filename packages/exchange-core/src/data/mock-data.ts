/**
 * Централизованные mock данные для тестирования
 * Согласно ai-agent-rules.yml (правило 20) - все константы должны быть централизованы
 */

import { generateTestOrderId } from '../services/id-generation';

// === MOCK AUTHENTICATION DATA ===
export const MOCK_AUTH_DATA = {
  /** Стандартный хеш пароля для тестовых пользователей */
  EXAMPLE_HASH: '$2b$10$example_hash',
  /** Хеш пароля для админских пользователей */
  ADMIN_HASH: '$2b$10$example_hash_admin',
} as const;

// === MOCK USER EMAILS ===
export const MOCK_USER_EMAILS = {
  /** Email тестового пользователя */
  TEST_USER: 'test@example.com',
  /** Email администратора */
  ADMIN_USER: 'admin@exchangego.com',
} as const;

// === MOCK TIMESTAMPS ===
export const MOCK_TIMESTAMPS = {
  /** Базовое время создания для тестовых данных */
  BASE_CREATED_AT: '2025-06-29T10:00:00.000Z',
  /** Время последнего входа */
  LAST_LOGIN_AT: '2025-06-29T10:00:00.000Z',
  /** Время обновления заявки */
  ORDER_UPDATED_AT: '2025-06-29T12:00:00.000Z',
  /** Время обработки заявки */
  ORDER_PROCESSED_AT: '2025-06-29T12:00:00.000Z',
  /** Timestamp для генерации первого тестового ID заявки */
  MOCK_ORDER_1_TIMESTAMP: 1703847600000,
  /** Timestamp для генерации второго тестового ID заявки */
  MOCK_ORDER_2_TIMESTAMP: 1703847660000,
} as const;

// === MOCK TRANSACTION DATA ===
export const MOCK_TRANSACTION_DATA = {
  /** Пример Bitcoin адреса */
  BTC_ADDRESS: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  /** Пример номера карты */
  CARD_NUMBER: '1234567890123456',
  /** Пример хеша транзакции */
  TX_HASH: 'example_tx_hash_123',
} as const;

// === MOCK ORDER IDS ===
/**
 * Генерируемые mock ID заявок используя IdGenerationService
 * Устранено дублирование статических ID (Rule 20)
 */
export const MOCK_ORDER_IDS = {
  /** ID первой тестовой заявки */
  ORDER_1: generateTestOrderId(MOCK_TIMESTAMPS.MOCK_ORDER_1_TIMESTAMP, 'abc123456'),
  /** ID второй тестовой заявки */
  ORDER_2: generateTestOrderId(MOCK_TIMESTAMPS.MOCK_ORDER_2_TIMESTAMP, 'def456789'),
} as const;

// === ТИПЫ ===
export type MockAuthData = typeof MOCK_AUTH_DATA;
export type MockUserEmails = typeof MOCK_USER_EMAILS;
export type MockTimestamps = typeof MOCK_TIMESTAMPS;
export type MockTransactionData = typeof MOCK_TRANSACTION_DATA;
export type MockOrderIds = typeof MOCK_ORDER_IDS;
