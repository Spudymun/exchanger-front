/**
 * 📁 Файл: packages/exchange-core/src/repositories/index.ts
 * 🎯 Цель: Централизованный экспорт всех Repository интерфейсов
 * 📋 AC: AC2.3, AC3.4 - экспорт интерфейсов для заявок и очередей
 * 🏗️ Архитектура: Clean Architecture - Repository Layer
 * 🔧 Правило: Rule 20 - Single Source of Truth для экспортов
 */

// Экспорт Repository интерфейсов
export type { OrderRepositoryInterface } from './order-repository-interface.js';
export type { WalletRepositoryInterface, WalletInfo } from './wallet-repository-interface.js';
export type { QueueRepositoryInterface } from './queue-repository-interface.js';
export type { AuditRepositoryInterface } from './audit-repository-interface.js';

// TASK 2.2: Redis FIFO Queue Repository
export { RedisQueueRepository } from './redis-queue-repository';

// Экспорт всех типов
export type * from './types.js';

// Re-export для удобства (исключая User для избежания циклических зависимостей)
export type {
  OrderFilters,
  PaginationOptions,
  QueueJobData,
  QueueJob,
  WalletTransaction,
  AuditLogEntry,
  OperationResult,
  BulkOperationResult,
} from './types.js';
