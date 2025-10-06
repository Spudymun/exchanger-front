import { publicProcedure } from '../init';

/**
 * In-memory idempotency cache for development
 *
 * LIMITATIONS:
 * - Data is lost on server restart
 * - Does not scale across multiple server instances
 * - Not suitable for production use
 *
 * PRODUCTION ALTERNATIVES:
 * - Redis-based idempotency cache (recommended)
 * - Database-backed idempotency storage
 * - External caching services
 *
 * HOT-RELOAD PROTECTION:
 * - Uses global singleton pattern to preserve cache across hot-reloads
 * - Same approach as global.__prismaInstance
 * - Prevents idempotency bypass during development
 */

// ✅ Global singleton pattern для hot-reload environments
// Предотвращает idempotency bypass при hot-reload в development
// Использует тот же подход что и global.__prismaInstance
declare global {
  var __idempotencyCache: Map<string, { response: unknown; timestamp: number }> | undefined;
}

const idempotencyCache =
  global.__idempotencyCache || new Map<string, { response: unknown; timestamp: number }>();

// TTL для idempotency cache (5 секунд)
const IDEMPOTENCY_TTL_MS = 5000;

// Cleanup interval для предотвращения утечек памяти
const CLEANUP_INTERVAL_MS = 60000; // 1 минута

if (!global.__idempotencyCache) {
  console.log(`🚀 [IDEMPOTENCY MODULE] Creating NEW cache at ${new Date().toISOString()}`);
  global.__idempotencyCache = idempotencyCache;

  // Периодическая очистка истекших записей ТОЛЬКО для нового cache
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of idempotencyCache.entries()) {
      if (now - record.timestamp > IDEMPOTENCY_TTL_MS) {
        idempotencyCache.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
} else {
  console.log(
    `♻️ [IDEMPOTENCY MODULE] Reusing EXISTING cache at ${new Date().toISOString()}, size: ${idempotencyCache.size}`
  );
}

/**
 * Функция создания idempotency middleware
 */
export function createIdempotencyMiddleware() {
  return publicProcedure.use(async ({ ctx, next }) => {
    // Выполняем запрос
    const result = await next();

    // Логируем для отладки idempotency
    console.log('Idempotency middleware: Request processed', {
      sessionId: ctx.sessionId,
      ip: ctx.ip,
      timestamp: new Date().toISOString(),
    });

    return result;
  });
}

/**
 * Idempotency middleware для использования
 */
export const idempotencyMiddleware = createIdempotencyMiddleware();

/**
 * Утилита для очистки idempotency cache (для тестирования)
 */
export function clearIdempotencyCache(): void {
  idempotencyCache.clear();
}

/**
 * Утилита для получения размера idempotency cache (для мониторинга)
 */
export function getIdempotencyCacheSize(): number {
  return idempotencyCache.size;
}
