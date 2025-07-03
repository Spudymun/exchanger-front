import { createTRPCRouter } from '../init';

/**
 * Support API роутер
 * Доступен только для пользователей с ролью SUPPORT
 * Включает операции техподдержки, работу с тикетами
 */
export const supportRouter = createTRPCRouter({
  // Операции саппорта будут реализованы в TASK 2.5
  // Примеры: работа с тикетами, помощь пользователям, чат-поддержка
});
