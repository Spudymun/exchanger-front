import type { User } from '../types';

/**
 * Type guard для проверки аутентифицированного пользователя
 * Использует type predicate для безопасного type narrowing
 */
export function isAuthenticatedUser(user: User | null): user is User {
  return user !== null;
}
