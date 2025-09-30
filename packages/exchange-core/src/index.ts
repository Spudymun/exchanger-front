/**
 * ОСНОВНОЙ ЭКСПОРТ ФАЙЛ - ОБРАТНАЯ СОВМЕСТИМОСТЬ
 * 
 * ⚠️ ВНИМАНИЕ: Этот файл сохраняет обратную совместимость, но теперь экспортирует
 * ТОЛЬКО client-safe функции для предотвращения проблем с frontend сборкой.
 * 
 * Для правильной архитектуры используйте:
 * - '@repo/exchange-core/client' - для frontend приложений
 * - '@repo/exchange-core/server' - для server-side кода
 */

// ✅ БЕЗОПАСНО: Re-export всех client-safe экспортов
export * from './client';

/**
 * МИГРАЦИОННАЯ ИНФОРМАЦИЯ:
 * 
 * Если ваш код использует server-only функции, обновите импорты:
 * 
 * БЫЛО:
 * import { QueueEmailNotifier } from '@repo/exchange-core';
 * 
 * СТАЛО:
 * import { QueueEmailNotifier } from '@repo/exchange-core/server';
 * 
 * БЫЛО:
 * import { WalletPoolManager } from '@repo/exchange-core';
 * 
 * СТАЛО:
 * import { WalletPoolManager } from '@repo/exchange-core/server';
 */
