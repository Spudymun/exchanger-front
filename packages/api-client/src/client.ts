// 🚨 DEPRECATED: HTTP Client
//
// This HTTP client is deprecated in favor of tRPC.
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
 * @deprecated Use tRPC instead
 * This class exists only for backward compatibility
 */
export class ApiClient {
  constructor() {
    // Note: ApiClient is deprecated. Use tRPC hooks instead.
  }
}

/**
 * @deprecated Use tRPC instead
 */
export const apiClient = new ApiClient();

// Re-export types for compatibility
export type { User, Transaction };
