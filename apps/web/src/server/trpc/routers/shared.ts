import {
  CRYPTOCURRENCIES,
  VALIDATION_LIMITS,
  AUTH_CONSTANTS,
  DATE_FORMAT_CONSTANTS,
  UI_NUMERIC_CONSTANTS,
  type CryptoCurrency,
} from '@repo/constants';
import { EmailMonitoringService } from '@repo/email-service';
import {
  orderManager,
  userManager,
  type Order,
} from '@repo/exchange-core';
import {
  WalletPoolManagerFactory,
  WalletAlertsService,
  WalletMonitoringProcess,
  type AlertCheckResult,
} from '@repo/exchange-core/server';
import { UserManagerFactory } from '@repo/session-management';
import {
  paginateOrders,
  sortOrders,
  getOrdersStatistics,
  securityEnhancedQuickActionsSchema,
  createInternalServerError,
} from '@repo/utils';

// Security-enhanced schemas
import {
  securityEnhancedSearchOrdersSchema,
  securityEnhancedSearchUsersSchema,
  emailMonitoringStatsQuerySchema,
} from '../../../../../../packages/utils/src/validation/security-enhanced-schemas';

import { createTRPCRouter } from '../init';
import { operatorAndSupport } from '../middleware/auth';

/**
 * Shared API роутер
 * Доступен для операторов и саппорта (общие функции)
 * Включает операции, которые могут выполнять и операторы, и саппорт
 */
export const sharedRouter = createTRPCRouter({
  // Поиск заявок (общий для operator и support)
  searchOrders: operatorAndSupport
    .input(securityEnhancedSearchOrdersSchema)
    .query(async ({ input }) => {
      // SECURITY-ENHANCED VALIDATION
      const { query, dateFrom, dateTo, status, limit, offset: _offset } = input;

      const matchesQuery = (order: Order, userEmailCache: Map<string, string>) => {
        if (!query) return true; // No query means match all
        const searchTerm = query.toLowerCase();

        // Обычные поиски (как раньше)
        const basicMatches =
          order.id.toLowerCase().includes(searchTerm) ||
          order.publicId.toLowerCase().includes(searchTerm) || // ✅ ДОБАВЛЕНО: поиск по публичному ID
          order.cryptoAmount.toString().includes(query) ||
          order.uahAmount.toString().includes(query);

        if (basicMatches) return true;

        // ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА: поиск по email через User relation (следует паттерну из exchange.ts)
        // ✅ ОПТИМИЗИРОВАНО: используем cache вместо индивидуальных DB запросов
        const userEmail = userEmailCache.get(order.userId);
        return userEmail?.toLowerCase().includes(searchTerm) || false;
      };

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

      const allOrders = await orderManager.getAll();

      // ✅ ОПТИМИЗАЦИЯ: Batch загрузка пользователей для избежания N+1 queries
      let userCache: Map<string, string> = new Map(); // userId -> email

      if (query) {
        // Если есть поисковый запрос, загружаем всех пользователей один раз
        const allUsers = await userManager.getAll();
        userCache = new Map(allUsers.map(user => [user.id, user.email]));
      }

      // Фильтруем с поддержкой email поиска через User cache
      const filteredOrders = [];
      for (const order of allOrders) {
        const queryMatch = matchesQuery(order, userCache);
        const dateMatch = matchesDate(order);
        const statusMatch = matchesStatus(order);

        if (queryMatch && dateMatch && statusMatch) {
          filteredOrders.push(order);
        }
      }

      // Используем централизованную утилиту для сортировки и ограничения
      const result = paginateOrders(sortOrders(filteredOrders), {
        limit,
        offset: UI_NUMERIC_CONSTANTS.INITIAL_OFFSET,
      });

      return result.items;
    }),

  // Поиск пользователей (общий для operator и support)
  searchUsers: operatorAndSupport
    .input(securityEnhancedSearchUsersSchema)
    .query(async ({ input }) => {
      // SECURITY-ENHANCED VALIDATION
      const { query, verified, limit, offset: _offset } = input;

      // ✅ Use async UserManagerFactory pattern with web context
      const userManager = await UserManagerFactory.createForWeb();
      const allUsers = await userManager.getAll();

      let users = allUsers.filter(user => {
        const matchesQuery =
          !query ||
          user.email.toLowerCase().includes(query.toLowerCase()) ||
          user.id.toLowerCase().includes(query.toLowerCase());

        const matchesVerified = verified === undefined || user.isVerified === verified;

        return matchesQuery && matchesVerified;
      });

      // Сортировка по дате создания и ограничение
      users = users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);

      // Возвращаем безопасную информацию о пользователях с подсчетом заказов
      return await Promise.all(
        users.map(async user => {
          const userOrders = await orderManager.findByUserId(user.id);
          return {
            id: user.id,
            email: user.email,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            ordersCount: userOrders.length,
          };
        })
      );
    }),

  // Общая статистика (доступна operator и support)
  getGeneralStats: operatorAndSupport.query(async () => {
    const orders = await orderManager.getAll();
    // ✅ Use async UserManagerFactory pattern with web context
    const userManager = await UserManagerFactory.createForWeb();
    const users = await userManager.getAll();

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
          .reduce((sum: number, o) => sum + o.cryptoAmount, 0),
      })),
    };
  }),

  // Статистика пулов кошельков (доступна operator и support)
  getWalletPoolStats: operatorAndSupport
    .input(securityEnhancedSearchOrdersSchema.pick({ currency: true }))
    .query(async ({ input }) => {
      try {
        if (!input.currency) {
          throw createInternalServerError('Currency is required for wallet pool statistics');
        }

        const walletPoolManager = await WalletPoolManagerFactory.create();
        return await walletPoolManager.getPoolStats(input.currency as CryptoCurrency);
      } catch (error) {
        console.error('[getWalletPoolStats] Error:', error);
        throw createInternalServerError('Failed to retrieve wallet pool statistics');
      }
    }),

  // Проверка критических алертов кошельков (доступна operator и support)
  checkWalletAlerts: operatorAndSupport.query(async () => {
    try {
      const alerts = await WalletAlertsService.checkAll();

      return {
        success: true,
        alertCount: alerts.length,
        alerts: alerts.map((alert: AlertCheckResult) => ({
          currency: alert.currency,
          available: alert.available,
          threshold: alert.threshold,
          isCritical: alert.isCritical,
          message: alert.message,
        })),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[checkWalletAlerts] Error:', error);
      throw createInternalServerError('Failed to check wallet alerts');
    }
  }),

  // Управление мониторингом кошельков (доступно operator и support)
  walletMonitoringControl: operatorAndSupport
    .input(securityEnhancedQuickActionsSchema.pick({ action: true }))
    .mutation(async ({ input }) => {
      try {
        const actionValue = input.action as 'start' | 'stop' | 'status';

        switch (actionValue) {
          case 'start': {
            WalletMonitoringProcess.start();
            return {
              success: true,
              message: 'Wallet monitoring started',
              status: WalletMonitoringProcess.getStatus(),
            };
          }
          case 'stop': {
            WalletMonitoringProcess.stop();
            return {
              success: true,
              message: 'Wallet monitoring stopped',
              status: WalletMonitoringProcess.getStatus(),
            };
          }
          case 'status': {
            return {
              success: true,
              message: 'Monitoring status retrieved',
              status: WalletMonitoringProcess.getStatus(),
            };
          }
          default: {
            throw createInternalServerError('Unknown monitoring action');
          }
        }
      } catch (error) {
        console.error('[walletMonitoringControl] Error:', error);
        throw createInternalServerError('Failed to control wallet monitoring');
      }
    }),

  // ✅ EMAIL MONITORING - получить статистику по провайдерам
  getEmailStatistics: operatorAndSupport
    .input(emailMonitoringStatsQuerySchema)
    .query(async ({ input }) => {
      try {
        const { provider } = input;
        const statistics = EmailMonitoringService.getProviderStatistics(provider);

        return {
          success: true,
          data: statistics,
        };
      } catch (error) {
        console.error('[getEmailStatistics] Error:', error);
        throw createInternalServerError('Failed to get email statistics');
      }
    }),

  // ✅ EMAIL MONITORING - проверить здоровье email провайдеров
  checkEmailProvidersHealth: operatorAndSupport.query(async () => {
    try {
      const healthStatus = await EmailMonitoringService.checkEmailProvidersHealth();

      return {
        success: true,
        data: healthStatus,
      };
    } catch (error) {
      console.error('[checkEmailProvidersHealth] Error:', error);
      throw createInternalServerError('Failed to check email providers health');
    }
  }),

  // Быстрые действия
  quickActions: operatorAndSupport
    .input(securityEnhancedQuickActionsSchema)
    .mutation(async ({ input, ctx }) => {
      // SECURITY-ENHANCED VALIDATION
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
            throw new Error(
              await ctx.getErrorMessage('server.errors.business.parameterRequired', {
                parameter: 'message',
              })
            );
          }
          return {
            success: true,
            message: 'Уведомление отправлено',
            recipients: params.recipients || 'all',
          };

        default:
          throw new Error(await ctx.getErrorMessage('server.errors.business.unknownAction'));
      }
    }),
});
