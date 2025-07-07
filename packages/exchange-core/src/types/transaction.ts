/**
 * @fileoverview Transaction interface definition
 * Centralized transaction type definition used across the application
 *
 * @author AI Agent
 * @since 2024
 */

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
  type: 'deposit' | 'withdrawal' | 'exchange';

  /** Current transaction status */
  status: 'pending' | 'completed' | 'failed';

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

export type TransactionType = Transaction['type'];
export type TransactionStatus = Transaction['status'];
