import type { User } from '../types';

/**
 * Type guard для проверки аутентифицированного пользователя
 * Использует type predicate для безопасного type narrowing
 */
export function isAuthenticatedUser(user: User | null): user is User {
  return user !== null;
}

/**
 * Type guard для проверки пользователя с хешированным паролем
 * Полезно для операций, требующих проверки пароля
 */
export function isUserWithPassword(user: User | null): user is User & { hashedPassword: string } {
  return user !== null && typeof user.hashedPassword === 'string';
}

/**
 * Type guard для проверки верифицированного пользователя
 */
export function isVerifiedUser(user: User | null): user is User & { isVerified: true } {
  return user !== null && user.isVerified === true;
}
