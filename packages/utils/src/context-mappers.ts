import type { ApplicationContext } from '@repo/constants';

/**
 * Преобразует ApplicationContext в соответствующий Prisma enum
 *
 * @description Устраняет дублирование логики конвертации ApplicationContext в Prisma enum.
 * Centralizes the mapping logic that was previously duplicated in 3 places:
 * - production-user-manager.ts (lines 53, 137)
 * - postgres-user-adapter.ts (line 204)
 *
 * @param context - ApplicationContext ('web' | 'admin')
 * @returns Prisma enum value ('WEB' | 'ADMIN')
 *
 * @example
 * ```typescript
 * import { mapApplicationContextToPrisma } from '@repo/utils';
 *
 * const prismaContext = mapApplicationContextToPrisma('web'); // Returns 'WEB'
 * const adminContext = mapApplicationContextToPrisma('admin'); // Returns 'ADMIN'
 * ```
 */
export function mapApplicationContextToPrisma(context: ApplicationContext): 'WEB' | 'ADMIN' {
  return context === 'web' ? 'WEB' : 'ADMIN';
}

/**
 * Type guard to check if a value is a valid ApplicationContext
 *
 * @param value - Value to check
 * @returns true if value is a valid ApplicationContext
 */
export function isValidApplicationContext(value: unknown): value is ApplicationContext {
  return typeof value === 'string' && (value === 'web' || value === 'admin');
}
