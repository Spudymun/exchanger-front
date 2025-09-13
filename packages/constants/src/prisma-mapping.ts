/**
 * Prisma to Project Mapping Constants
 *
 * Centralized mapping constants for converting Prisma enum values to project types.
 * Used across all database adapters (PostgreSQL, potential MongoDB, MySQL, etc.)
 *
 * @see packages/session-management/src/adapters/postgres-user-adapter.ts
 * @see Future: MongoDB/MySQL adapters will reuse these constants
 */

/**
 * Mapping from Prisma UserRole enum to project UserRole type
 * Used for converting database user roles to application roles
 */
export const PRISMA_TO_PROJECT_ROLE_MAP = {
  USER: 'user' as const,
  ADMIN: 'admin' as const,
  OPERATOR: 'operator' as const,
  SUPPORT: 'support' as const,
} as const;

/**
 * Mapping from Prisma ApplicationType enum to project ApplicationContext type
 * Used for converting database application contexts to session contexts
 */
export const PRISMA_TO_PROJECT_APP_CONTEXT_MAP = {
  WEB: 'web' as const,
  ADMIN: 'admin' as const,
} as const;

/**
 * Type definitions for the mapping constants
 */
export type PrismaRoleKey = keyof typeof PRISMA_TO_PROJECT_ROLE_MAP;
export type ProjectRole = (typeof PRISMA_TO_PROJECT_ROLE_MAP)[PrismaRoleKey];

export type PrismaAppContextKey = keyof typeof PRISMA_TO_PROJECT_APP_CONTEXT_MAP;
export type ProjectAppContext = (typeof PRISMA_TO_PROJECT_APP_CONTEXT_MAP)[PrismaAppContextKey];

/**
 * Utility functions for reverse mapping (if needed in the future)
 */
export const PROJECT_TO_PRISMA_ROLE_MAP = Object.fromEntries(
  Object.entries(PRISMA_TO_PROJECT_ROLE_MAP).map(([prismaRole, projectRole]) => [
    projectRole,
    prismaRole,
  ])
) as { [K in ProjectRole]: PrismaRoleKey };

export const PROJECT_TO_PRISMA_APP_CONTEXT_MAP = Object.fromEntries(
  Object.entries(PRISMA_TO_PROJECT_APP_CONTEXT_MAP).map(([prismaContext, projectContext]) => [
    projectContext,
    prismaContext,
  ])
) as { [K in ProjectAppContext]: PrismaAppContextKey };
