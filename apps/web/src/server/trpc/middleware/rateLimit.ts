import { RATE_LIMITS, TIME_CONSTANTS } from '@repo/constants';
import { createRateLimitError } from '@repo/utils';

import { publicProcedure } from '../init';

/**
 * In-memory rate limiter for development
 *
 * LIMITATIONS:
 * - Data is lost on server restart
 * - Does not scale across multiple server instances
 * - Memory leaks possible without cleanup
 * - Not suitable for production use
 *
 * PRODUCTION ALTERNATIVES:
 * - Redis-based rate limiting (recommended)
 * - Database-backed rate limiting
 * - External services like Cloudflare or AWS API Gateway
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup interval for expired records (prevent memory leaks)
const CLEANUP_INTERVAL =
  TIME_CONSTANTS.MINUTES_IN_HOUR *
  TIME_CONSTANTS.MILLISECONDS_IN_SECOND *
  TIME_CONSTANTS.SECONDS_IN_MINUTE; // 5 minutes

// Periodic cleanup of expired records
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Get client IP address from context
 * Handles various proxy scenarios and provides fallback
 */
function getClientIp(ip: string | undefined): string {
  return ip || 'unknown';
}

export function createRateLimiter(
  action: keyof typeof RATE_LIMITS,
  getErrorMessage: (key: string, values?: Record<string, string | number>) => Promise<string>
) {
  // eslint-disable-next-line security/detect-object-injection
  const config = RATE_LIMITS[action];

  return async (ip: string): Promise<void> => {
    const clientIp = getClientIp(ip);
    const key = `${action}:${clientIp}`;
    const now = Date.now();

    // Получаем текущее состояние
    const current = rateLimitStore.get(key);

    // Если записи нет или время сброса прошло
    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.duration * TIME_CONSTANTS.MILLISECONDS_IN_SECOND,
      });
      return;
    }

    // Если превышен лимит
    if (current.count >= config.points) {
      const errorKey = `server.errors.rateLimit.${action}`;
      throw createRateLimitError(await getErrorMessage(errorKey));
    }

    // Увеличиваем счетчик
    current.count++;
    rateLimitStore.set(key, current);
  };
}

// Middleware для разных типов действий
export const rateLimitMiddleware = {
  createOrder: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter('CREATE_ORDER', async (key, values) => await ctx.getErrorMessage(key, values))(getClientIp(ctx.ip));
    return next();
  }),

  register: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter('REGISTER', async (key, values) => await ctx.getErrorMessage(key, values))(getClientIp(ctx.ip));
    return next();
  }),

  login: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter('LOGIN', async (key, values) => await ctx.getErrorMessage(key, values))(getClientIp(ctx.ip));
    return next();
  }),

  resetPassword: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter('RESET_PASSWORD', async (key, values) => await ctx.getErrorMessage(key, values))(getClientIp(ctx.ip));
    return next();
  }),
};
