/**
 * ✅ PRODUCTION-READY MANAGER FACTORIES
 * 
 * Централизованные helper функции для получения production managers
 * Используй эти функции вместо импорта mock managers из @repo/exchange-core
 * 
 * @architecture
 * - Все managers создаются через UserManagerFactory
 * - Автоматически используют DATABASE_URL и REDIS_URL из process.env
 * - Production-ready в development и production окружениях
 */

import { UserManagerFactory } from '@repo/session-management';

/**
 * Получить OrderManager (production-ready с БД)
 * 
 * @returns OrderManager с реальным PostgreSQL подключением
 * 
 * @example
 * const orderManager = await getOrderManager();
 * const order = await orderManager.create({ ... });
 */
export async function getOrderManager() {
  return await UserManagerFactory.createOrderManager();
}

/**
 * Получить UserManager (production-ready с БД)
 * 
 * @returns UserManager с реальным PostgreSQL и Redis подключением
 * 
 * @example
 * const userManager = await getUserManager();
 * const user = await userManager.findByEmail('test@example.com');
 */
export async function getUserManager() {
  return await UserManagerFactory.createForWeb();
}
