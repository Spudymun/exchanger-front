/**
 * Централизованная фабрика mock данных для тестирования
 * Устраняет дублирование mock данных между UI тестами и core (Rule 20)
 */

import { UI_NUMERIC_CONSTANTS } from '@repo/constants';

import type { User } from '../types';

import { MOCK_USER_EMAILS, MOCK_AUTH_DATA, MOCK_TIMESTAMPS } from './mock-data';

// === INTERFACES FOR UI TESTING ===

/**
 * Интерфейс для UI тестов DataTable - упрощенная версия User
 * Используется в Stories и UI тестах
 * Расширяет Record для совместимости с DataTable
 */
export interface UITestUser extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

/**
 * Базовый интерфейс для тестовых данных
 * Расширяет Record для совместимости с DataTable
 */
export interface TestData extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
}

// === MOCK DATA FACTORIES ===

/**
 * Создает mock пользователей для UI тестов
 */
export function createUITestUsers(): UITestUser[] {
  return [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Admin',
      status: 'active',
      lastLogin: '2024-01-15',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'User',
      status: 'active',
      lastLogin: '2024-01-14',
    },
    {
      id: UI_NUMERIC_CONSTANTS.MOCK_DATA_ROWS,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'User',
      status: 'inactive',
      lastLogin: '2024-01-10',
    },
  ];
}

/**
 * Создает базовые тестовые данные для DataTable тестов
 */
export function createTestData(): TestData[] {
  return [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: UI_NUMERIC_CONSTANTS.MOCK_DATA_ROWS, name: 'Bob Johnson', email: 'bob@example.com' },
  ];
}

/**
 * Создает полные User объекты для core тестов
 * Использует централизованные константы из mock-data.ts
 */
export function createCoreUsers(): User[] {
  return [
    {
      id: 'user_1',
      email: MOCK_USER_EMAILS.TEST_USER,
      hashedPassword: MOCK_AUTH_DATA.EXAMPLE_HASH,
      isVerified: true,
      createdAt: new Date(MOCK_TIMESTAMPS.BASE_CREATED_AT),
      lastLoginAt: new Date(MOCK_TIMESTAMPS.LAST_LOGIN_AT),
    },
    {
      id: 'user_2',
      email: MOCK_USER_EMAILS.ADMIN_USER,
      hashedPassword: MOCK_AUTH_DATA.ADMIN_HASH,
      isVerified: true,
      createdAt: new Date(MOCK_TIMESTAMPS.BASE_CREATED_AT),
      lastLoginAt: new Date(MOCK_TIMESTAMPS.LAST_LOGIN_AT),
    },
  ];
}

/**
 * Создает кастомные mock данные с заданными параметрами
 */
export function createCustomTestUsers(count: number): UITestUser[] {
  const ADMIN_INDEX = 0;
  const EVEN_DIVISOR = 2;
  const BASE_DAY = 15;
  const PADDING_LENGTH = 2;
  const INDEX_OFFSET = 1;

  return Array.from({ length: count }, (_, index) => ({
    id: index + INDEX_OFFSET,
    name: `User ${index + INDEX_OFFSET}`,
    email: `user${index + INDEX_OFFSET}@test.com`,
    role: index === ADMIN_INDEX ? 'Admin' : 'User',
    status: (index % EVEN_DIVISOR === ADMIN_INDEX ? 'active' : 'inactive') as 'active' | 'inactive',
    lastLogin: `2024-01-${String(BASE_DAY - index).padStart(PADDING_LENGTH, '0')}`,
  }));
}
