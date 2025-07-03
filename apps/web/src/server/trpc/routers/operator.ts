import { createTRPCRouter } from '../init';

/**
 * Operator API роутер
 * Доступен только для пользователей с ролью OPERATOR
 * Включает операции по обработке заявок, мониторингу операций
 */
export const operatorRouter = createTRPCRouter({
  // Операции оператора будут реализованы в TASK 2.5
  // Примеры: обработка заявок, управление ордерами, мониторинг сделок
});
