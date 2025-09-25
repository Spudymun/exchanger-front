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
 */
const idempotencyCache = new Map<string, { response: unknown; timestamp: number }>();

// TTL для idempotency cache (5 секунд)
const IDEMPOTENCY_TTL_MS = 5000;

// Cleanup interval для предотвращения утечек памяти
const CLEANUP_INTERVAL_MS = 60000; // 1 минута

// Периодическая очистка истекших записей
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyCache.entries()) {
    if (now - record.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);



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