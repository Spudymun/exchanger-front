/**
 * API Contract Package
 * 
 * This package re-exports only the TYPE definitions from the web tRPC server.
 * It does NOT include any runtime code, ensuring that importing this package
 * in client applications (like telegram-bot) won't pull in server implementation.
 * 
 * Following best practices from:
 * https://github.com/trpc/trpc (monorepo type sharing)
 */

// Type-only import to avoid bundling runtime code
export type { AppRouter } from '../../../apps/web/src/server/trpc';
