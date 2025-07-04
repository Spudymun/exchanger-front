import { RATE_LIMITS, RATE_LIMIT_MESSAGES, MILLISECONDS_IN_SECOND } from '@repo/constants';

import { TRPCError } from '@trpc/server';

import { publicProcedure } from '../init';

// In-memory rate limiter (в продакшене будет Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function createRateLimiter(action: keyof typeof RATE_LIMITS) {
  // eslint-disable-next-line security/detect-object-injection
  const config = RATE_LIMITS[action];

  return async (ip: string): Promise<void> => {
    const key = `${action}:${ip}`;
    const now = Date.now();

    // Получаем текущее состояние
    const current = rateLimitStore.get(key);

    // Если записи нет или время сброса прошло
    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.duration * MILLISECONDS_IN_SECOND,
      });
      return;
    }

    // Если превышен лимит
    if (current.count >= config.points) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        // eslint-disable-next-line security/detect-object-injection
        message: RATE_LIMIT_MESSAGES[action],
      });
    }

    // Увеличиваем счетчик
    current.count++;
    rateLimitStore.set(key, current);
  };
}

// Middleware для разных типов действий
export const rateLimitMiddleware = {
  createOrder: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter('CREATE_ORDER')(ctx.ip || 'unknown');
    return next();
  }),

  register: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter('REGISTER')(ctx.ip || 'unknown');
    return next();
  }),

  login: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter('LOGIN')(ctx.ip || 'unknown');
    return next();
  }),

  resetPassword: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter('RESET_PASSWORD')(ctx.ip || 'unknown');
    return next();
  }),
};
