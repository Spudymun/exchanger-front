import { USER_ROLES } from '@repo/constants';
import { isAuthenticatedUser } from '@repo/exchange-core';
import { createUnauthorizedError, createForbiddenError } from '@repo/utils';

import { publicProcedure } from '../init';

// Базовый middleware для проверки аутентификации

export const authMiddleware = publicProcedure.use(async ({ ctx, next }) => {
  if (!isAuthenticatedUser(ctx.user)) {
    throw createUnauthorizedError(await ctx.getErrorMessage('server.errors.auth.required'));
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // TypeScript теперь знает, что user: User
    },
  });
});

// Generic middleware для проверки роли

export const roleMiddleware = (allowedRoles: string[]) => {
  return authMiddleware.use(async ({ ctx, next }) => {
    const { getUserRoleForApp } = await import('@repo/exchange-core');
    const userRole = getUserRoleForApp(ctx.user, 'web');

    if (!userRole) {
      throw createForbiddenError(await ctx.getErrorMessage('server.errors.auth.roleRequired'));
    }

    if (!allowedRoles.includes(userRole)) {
      throw createForbiddenError(await ctx.getErrorMessage('server.errors.auth.insufficientRole'));
    }

    return next();
  });
};

// Специализированные middleware для ролей

export const operatorMiddleware = roleMiddleware([USER_ROLES.OPERATOR]);

export const supportMiddleware = roleMiddleware([USER_ROLES.SUPPORT]);

export const operatorAndSupportMiddleware = roleMiddleware([
  USER_ROLES.OPERATOR,
  USER_ROLES.SUPPORT,
]);

// Алиасы для удобства использования

export const operatorOnly = operatorMiddleware;

export const supportOnly = supportMiddleware;

export const operatorAndSupport = operatorAndSupportMiddleware;

// Экспорт типизированных процедур (сохраняем обратную совместимость)

export const protectedProcedure = authMiddleware;
