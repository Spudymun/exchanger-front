/**
 * @deprecated
 * This package is legacy and should not be used in new development.
 * Use tRPC instead for type-safe API communication.
 * 
 * For migration help, see:
 * - apps/web/server/trpc.ts (tRPC server setup)
 * - apps/web/lib/trpc.ts (tRPC client setup)
 * - ARCHITECTURE.md (API best practices)
 */

// Keep minimal exports for backward compatibility
export { apiClient, ApiClient } from './client'

// Types
export type { User, Transaction } from './types'
