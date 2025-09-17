/**
 * Exported types for tRPC router - CLIENT SAFE
 * This file contains ONLY types and should not import any server-side code
 * 
 * IMPORTANT: This file must NOT import from any server-side modules
 * to avoid pulling in ioredis and other server dependencies into client bundle
 */

// Re-export the type definition without importing the actual implementation
// This avoids pulling in any server-side dependencies
export type { AppRouter } from './routers';