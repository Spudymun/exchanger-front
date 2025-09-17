// ✅ Types-only exports - SAFE FOR CLIENT IMPORT
// This file contains ONLY types and interfaces without any runtime dependencies
// Can be safely imported in client-side code without pulling ioredis

// Re-export all types from types/index.ts  
export type * from './types/index';

// Export only the type definitions for factories and managers
// WITHOUT importing the actual implementations
export type { UserManagerFactory } from './factories/user-manager-factory';
export type { ProductionUserManager } from './managers/production-user-manager';

// Environment types only
export type { ManagerEnvironment } from './types/config';