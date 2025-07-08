/**
 * @fileoverview Transaction interface definition
 * Centralized transaction type definition used across the application
 *
 * @author AI Agent
 * @since 2024
 */

import type { TRANSACTION_TYPES, TRANSACTION_STATUSES } from '@repo/constants';

export interface Transaction {
  /** Unique transaction identifier */
  id: string;

  /** User ID who owns this transaction */
  userId: string;

  /** Transaction amount */
  amount: number;

  /** Currency code */
  currency: string;

  /** Transaction type */
  type: (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

  /** Current transaction status */
  status: (typeof TRANSACTION_STATUSES)[keyof typeof TRANSACTION_STATUSES];

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

export type TransactionType = Transaction['type'];
export type TransactionStatus = Transaction['status'];
