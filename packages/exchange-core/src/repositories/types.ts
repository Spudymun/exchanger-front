/**
 * 📁 Файл: packages/exchange-core/src/repositories/types.ts
 * 🎯 Цель: Централизованные типы для Repository Layer
 * 📋 AC: AC2.1A, AC2.3, AC3.4 - типы для всех интерфейсов
 * 🏗️ Архитектура: Clean Architecture + Repository Pattern
 * 🔧 Правило: Rule 20 - Single Source of Truth для типов
 */

// AC2.1A: Session metadata for enhanced user operations
export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
  appContext: 'web' | 'admin';
}

// AC2.3: Order data types
export interface OrderFilters {
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAfter?: Date;
  createdBefore?: Date;
  minAmount?: number;
  maxAmount?: number;
  currencyFrom?: string;
  currencyTo?: string;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// AC3.4: Queue types
export interface QueueJobData {
  type: 'order_processing' | 'payment_verification' | 'notification';
  orderId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface QueueJob {
  id: string;
  data: QueueJobData;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledFor?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Wallet types for FIFO operations
export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Audit types
export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Common repository result types
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface BulkOperationResult<T = unknown> {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    index: number;
    error: string;
    data?: T;
  }>;
}
