import {
  CRYPTOCURRENCIES,
  VALIDATION_LIMITS,
  AUTH_CONSTANTS,
  DATE_FORMAT_CONSTANTS,
  UI_NUMERIC_CONSTANTS,
} from '@repo/constants';
import { orderManager, userManager, type Order } from '@repo/exchange-core';
import {
  paginateOrders,
  sortOrders,
  getOrdersStatistics,
  searchOrdersSchema,
  searchUsersSchema,
  quickActionsSchema,
} from '@repo/utils';

import { createTRPCRouter } from '../init';
import { operatorAndSupport } from '../middleware/auth';

/**
 * Shared API роутер
 * Доступен для операторов и саппорта (общие функции)
 * Включает операции, которые могут выполнять и операторы, и саппорт
 */
export const sharedRouter = createTRPCRouter({
  // Поиск заявок (общий для operator и support)
  searchOrders: operatorAndSupport.input(searchOrdersSchema).query(async ({ input }) => {
    const { query, dateFrom, dateTo, status, limit } = input;

    const matchesQuery = (order: Order) =>
      order.id.toLowerCase().includes(query.toLowerCase()) ||
      order.email.toLowerCase().includes(query.toLowerCase()) ||
      order.cryptoAmount.toString().includes(query) ||
      order.uahAmount.toString().includes(query);

    const matchesDate = (order: Order) => {
      if (!dateFrom && !dateTo) return true;
      const orderDate = order.createdAt
        .toISOString()
        .split(DATE_FORMAT_CONSTANTS.ISO_DATE_TIME_SEPARATOR)[
        DATE_FORMAT_CONSTANTS.DATE_PART_INDEX
      ];
      if (!orderDate) return false;
      if (dateFrom && orderDate < dateFrom) return false;
      if (dateTo && orderDate > dateTo) return false;
      return true;
    };

    const matchesStatus = (order: Order) => !status || order.status === status;

    const orders = orderManager
      .getAll()
      .filter(order => matchesQuery(order) && matchesDate(order) && matchesStatus(order));

    // Используем централизованную утилиту для сортировки и ограничения
    const result = paginateOrders(sortOrders(orders), {
      limit,
      offset: UI_NUMERIC_CONSTANTS.INITIAL_OFFSET,
    });

    return result.items;
  }),

  // Поиск пользователей (общий для operator и support)
  searchUsers: operatorAndSupport.input(searchUsersSchema).query(async ({ input }) => {
    const { query, verified, limit } = input;

    let users = userManager.getAll().filter(user => {
      const matchesQuery =
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.id.toLowerCase().includes(query.toLowerCase());

      const matchesVerified = verified === undefined || user.isVerified === verified;

      return matchesQuery && matchesVerified;
    });

    // Сортировка по дате создания и ограничение
    users = users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);

    // Возвращаем безопасную информацию о пользователях
    return users.map(user => ({
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      ordersCount: orderManager.getAll().filter(o => o.email === user.email).length,
    }));
  }),

  // Общая статистика (доступна operator и support)
  getGeneralStats: operatorAndSupport.query(async () => {
    const orders = orderManager.getAll();
    const users = userManager.getAll();

    // Используем централизованную утилиту для статистики заказов
    const orderStats = getOrdersStatistics(orders);

    const today = new Date().toDateString();

    return {
      orders: {
        total: orderStats.total,
        today: orderStats.today,
        pending: orderStats.byStatus.pending || 0,
        processing: orderStats.byStatus.processing || 0,
        completed: orderStats.byStatus.completed || 0,
      },
      users: {
        total: users.length,
        verified: users.filter(u => u.isVerified).length,
        newToday: users.filter(u => u.createdAt.toDateString() === today).length,
      },
      currencies: CRYPTOCURRENCIES.map(currency => ({
        currency,
        orders: orders.filter(o => o.currency === currency).length,
        volume: orders
          .filter(o => o.currency === currency)
          .reduce((sum, o) => sum + o.cryptoAmount, 0),
      })),
    };
  }),

  // Быстрые действия
  quickActions: operatorAndSupport.input(quickActionsSchema).mutation(async ({ input }) => {
    const { action, params } = input;

    switch (action) {
      case 'REFRESH_RATES':
        // Имитация обновления курсов
        await new Promise(resolve => setTimeout(resolve, AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS));
        return { success: true, message: 'Курсы обновлены', timestamp: new Date() };

      case 'CLEAR_CACHE':
        // Имитация очистки кэша
        return {
          success: true,
          message: 'Кэш очищен',
          clearedItems: VALIDATION_LIMITS.ORDER_ITEMS_MAX,
        };

      case 'SEND_NOTIFICATION':
        // Имитация отправки уведомления
        if (!params?.message) {
          throw new Error('Требуется параметр message');
        }
        return {
          success: true,
          message: 'Уведомление отправлено',
          recipients: params.recipients || 'all',
        };

      default:
        throw new Error('Неизвестное действие');
    }
  }),
});
