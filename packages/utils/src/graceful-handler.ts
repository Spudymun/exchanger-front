/**
 * Graceful error handling utilities
 * Централизованная система для graceful degradation в session-management системе
 */

/**
 * Опции для graceful handler
 */
export interface GracefulHandlerOptions<T> {
  /** Fallback значение при ошибке */
  fallback?: T;
}

/**
 * Централизованная функция для graceful degradation
 * Заменяет повторяющиеся try-catch блоки в session-management системе
 *
 * @param operation - Async операция которая может завершиться ошибкой
 * @param options - Опции обработки ошибок
 * @returns Результат операции или fallback значение
 */
export async function gracefulHandler<T>(
  operation: () => Promise<T>,
  options?: GracefulHandlerOptions<T>
): Promise<T | null> {
  try {
    return await operation();
  } catch {
    // Graceful degradation - возвращаем fallback или null
    return options?.fallback ?? null;
  }
}

/**
 * Синхронная версия graceful handler для синхронных операций
 */
export function gracefulHandlerSync<T>(
  operation: () => T,
  options?: GracefulHandlerOptions<T>
): T | null {
  try {
    return operation();
  } catch {
    // Graceful degradation - возвращаем fallback или null
    return options?.fallback ?? null;
  }
}
