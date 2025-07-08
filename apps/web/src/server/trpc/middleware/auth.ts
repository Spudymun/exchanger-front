import { USER_ROLES } from '@repo/constants';
import { isAuthenticatedUser } from '@repo/exchange-core';
import { createUnauthorizedError, createForbiddenError } from '@repo/utils';

import { publicProcedure } from '../init';

// Базовый middleware для проверки аутентификации
export const authMiddleware = publicProcedure.use(({ ctx, next }) => {
  if (!isAuthenticatedUser(ctx.user)) {
    throw createUnauthorizedError('Необходима аутентификация');
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
  return authMiddleware.use(({ ctx, next }) => {
    if (!ctx.user.role) {
      throw createForbiddenError('определение роли пользователя');
    }

    if (!allowedRoles.includes(ctx.user.role)) {
      throw createForbiddenError('выполнение действия с текущей ролью');
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
