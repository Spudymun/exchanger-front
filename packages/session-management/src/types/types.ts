import type { User } from '@repo/exchange-core';

/**
 * Type for creating new users (compatible with existing manager)
 * ✅ Single definition - moved from index.ts to avoid duplication (Rule 20 compliance)
 */
export type CreateUserData = Omit<User, 'id' | 'createdAt'>;

/**
 * Migration strategy options
 */
export type MigrationStrategy =
  | 'mock-only'
  | 'production-only'
  | 'gradual'
  | 'mock-with-write-through';

// Re-export User type for convenience
export type { User };

// Re-export ManagerEnvironment from config (avoid duplication)
export type { ManagerEnvironment } from './config';
