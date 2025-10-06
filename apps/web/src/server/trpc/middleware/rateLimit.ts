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

// ✅ Global singleton pattern для hot-reload environments
// Предотвращает сброс rate limit store при hot-reload в development
// Использует тот же подход что и global.__prismaInstance
declare global {
  var __rateLimitStore: Map<string, { count: number; resetTime: number }> | undefined;
}

// В development используем global для сохранения между hot-reloads
const rateLimitStore =
  global.__rateLimitStore || new Map<string, { count: number; resetTime: number }>();

if (!global.__rateLimitStore) {
  console.log(`🚀 [RATE LIMIT MODULE] Creating NEW store at ${new Date().toISOString()}`);
  global.__rateLimitStore = rateLimitStore;
} else {
  console.log(
    `♻️ [RATE LIMIT MODULE] Reusing EXISTING store at ${new Date().toISOString()}, size: ${rateLimitStore.size}`
  );
}

console.log(`🗄️ [RATE LIMIT MODULE] Store status:`, {
  size: rateLimitStore.size,
  keys: Array.from(rateLimitStore.keys()),
});

// Cleanup interval for expired records (prevent memory leaks)
const CLEANUP_INTERVAL =
  TIME_CONSTANTS.MINUTES_IN_HOUR *
  TIME_CONSTANTS.MILLISECONDS_IN_SECOND *
  TIME_CONSTANTS.SECONDS_IN_MINUTE; // 60 minutes

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
// Helper function to safely get client IP
function getClientIp(ip: string | undefined): string {
  const result = ip || 'unknown';
  console.log(`🌐 [RATE LIMIT] getClientIp called: input="${ip}" → result="${result}"`);
  return result;
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

    console.log(`🔍 [RATE LIMIT] Action: ${action}, IP: ${clientIp}, Key: ${key}`);
    console.log(`📊 [RATE LIMIT] Store size: ${rateLimitStore.size}`);
    console.log(`🗂️ [RATE LIMIT] All keys in store:`, Array.from(rateLimitStore.keys()));

    // Получаем текущее состояние
    const current = rateLimitStore.get(key);

    console.log(`📝 [RATE LIMIT] Current state:`, current);

    // Если записи нет или время сброса прошло
    if (!current || now > current.resetTime) {
      const newResetTime = now + config.duration * TIME_CONSTANTS.MILLISECONDS_IN_SECOND;
      console.log(
        `✨ [RATE LIMIT] Creating NEW record: count=1, resetTime=${new Date(newResetTime).toISOString()}`
      );
      rateLimitStore.set(key, {
        count: 1,
        resetTime: newResetTime,
      });
      console.log(`✅ [RATE LIMIT] Request ALLOWED (new window)`);
      return;
    }

    // Если превышен лимит
    if (current.count >= config.points) {
      console.log(`❌ [RATE LIMIT] LIMIT EXCEEDED! count=${current.count}, limit=${config.points}`);
      const errorKey = `rateLimit.${action}`;
      throw createRateLimitError(await getErrorMessage(errorKey));
    }

    // Увеличиваем счетчик
    current.count++;
    rateLimitStore.set(key, current);
    console.log(`➕ [RATE LIMIT] Incremented: count=${current.count}/${config.points}`);
    console.log(`✅ [RATE LIMIT] Request ALLOWED`);
  };
}

// Middleware для разных типов действий
export const rateLimitMiddleware = {
  createOrder: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter(
      'CREATE_ORDER',
      async (key, values) => await ctx.getErrorMessage(key, values)
    )(getClientIp(ctx.ip));
    return next();
  }),

  register: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter(
      'REGISTER',
      async (key, values) => await ctx.getErrorMessage(key, values)
    )(getClientIp(ctx.ip));
    return next();
  }),

  login: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter(
      'LOGIN',
      async (key, values) => await ctx.getErrorMessage(key, values)
    )(getClientIp(ctx.ip));
    return next();
  }),

  resetPassword: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter(
      'RESET_PASSWORD',
      async (key, values) => await ctx.getErrorMessage(key, values)
    )(getClientIp(ctx.ip));
    return next();
  }),

  emailSend: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter(
      'EMAIL_SEND',
      async (key, values) => await ctx.getErrorMessage(key, values)
    )(getClientIp(ctx.ip));
    return next();
  }),
};
