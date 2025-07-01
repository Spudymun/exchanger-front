import { TRPCError } from '@trpc/server';

import { publicProcedure } from '../init';

// Middleware для проверки аутентификации
export const authMiddleware = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Необходима аутентификация',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Гарантируем что user не null
    },
  });
});

// Middleware для проверки админских прав
export const adminMiddleware = authMiddleware.use(({ ctx, next }) => {
  // В будущем здесь будет проверка роли админа
  if (!ctx.user.email.includes('admin')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Недостаточно прав доступа',
    });
  }

  return next();
});

// Экспорт типизированных процедур
export const protectedProcedure = authMiddleware;
export const adminProcedure = adminMiddleware;
