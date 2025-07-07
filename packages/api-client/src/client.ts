// Legacy HTTP Client - Use tRPC instead
//
// This HTTP client should not be used in new development.
// Use tRPC hooks instead:
//
// import { trpc } from '@/lib/trpc'
//
// function MyComponent() {
//   const { data: users } = trpc.users.list.useQuery()
//   const createUser = trpc.users.create.useMutation()
//   return <div>Use tRPC hooks</div>
// }

import { User, Transaction } from './types';

/**
 * Legacy API client for backward compatibility only
 * New development should use tRPC
 */
export class ApiClient {
  constructor() {
    // Note: Use tRPC hooks for new development
  }
}

/**
 * Legacy instance for backward compatibility
 */
export const apiClient = new ApiClient();

// Re-export types for compatibility
export type { User, Transaction };
