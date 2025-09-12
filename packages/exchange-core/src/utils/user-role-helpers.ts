import type { ApplicationContext, UserRole } from '@repo/constants';

import type { User, UserAppRole } from '../types/user';

/**
 * ✅ Helper utilities for Multi-App User Role architecture
 * Эти функции помогают работать с новой системой ролей по приложениям
 */

/**
 * Получить роль пользователя для конкретного приложения
 */
export function getUserRoleForApp(user: User, context: ApplicationContext): UserRole | null {
  if (!user.appRoles?.length) {
    // Пользователи без ролей не имеют доступа
    return null;
  }

  const appRole = user.appRoles.find(role => role.applicationContext === context);
  return appRole?.role || null;
}

/**
 * Проверить имеет ли пользователь доступ к приложению
 */
export function userHasAccessToApp(user: User, context: ApplicationContext): boolean {
  return getUserRoleForApp(user, context) !== null;
}

/**
 * Получить все приложения к которым имеет доступ пользователь
 */
export function getUserApplications(user: User): ApplicationContext[] {
  if (!user.appRoles?.length) {
    // Пользователи без ролей не имеют доступа к приложениям
    return [];
  }

  return user.appRoles.map(role => role.applicationContext);
}

/**
 * Проверить имеет ли пользователь определенную роль в приложении
 */
export function userHasRoleInApp(
  user: User,
  context: ApplicationContext,
  requiredRole: UserRole
): boolean {
  const userRole = getUserRoleForApp(user, context);
  return userRole === requiredRole;
}

/**
 * Проверить является ли пользователь администратором в любом приложении
 */
export function isUserAdmin(user: User): boolean {
  if (!user.appRoles?.length) {
    // Пользователи без ролей не являются администраторами
    return false;
  }

  return user.appRoles.some(role => role.role === 'admin');
}

/**
 * Создать объект UserAppRole для добавления роли пользователю
 */
export function createUserAppRole(
  userId: string,
  context: ApplicationContext,
  role: UserRole
): Omit<UserAppRole, 'id' | 'createdAt'> {
  return {
    userId,
    applicationContext: context,
    role,
  };
}

/**
 * Получить дефолтную роль для приложения
 */
export function getDefaultRoleForApp(context: ApplicationContext): UserRole {
  switch (context) {
    case 'web':
      return 'user';
    case 'admin':
      return 'operator'; // или 'admin' в зависимости от бизнес-логики
    default:
      return 'user';
  }
}

/**
 * Проверяет, имеет ли пользователь указанную роль в любом приложении
 */
export function userHasCompatibleRole(user: User, requiredRole: UserRole): boolean {
  if (!user.appRoles?.length) {
    return false;
  }

  return user.appRoles.some(appRole => appRole.role === requiredRole);
}

/**
 * Получить наивысшую роль пользователя среди всех приложений
 */
export function getUserHighestRole(user: User): UserRole {
  if (!user.appRoles?.length) {
    return 'user';
  }

  // Приоритет ролей: admin > operator > support > user
  // Проверяем есть ли admin среди ролей
  if (user.appRoles.some(appRole => appRole.role === 'admin')) {
    return 'admin';
  }

  // Проверяем есть ли operator среди ролей
  if (user.appRoles.some(appRole => appRole.role === 'operator')) {
    return 'operator';
  }

  // Проверяем есть ли support среди ролей
  if (user.appRoles.some(appRole => appRole.role === 'support')) {
    return 'support';
  }

  return 'user';
}
