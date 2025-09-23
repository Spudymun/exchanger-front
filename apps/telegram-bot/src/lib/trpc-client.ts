/**
 * tRPC клиент для интеграции с основным API (apps/web)
 * Серверная реализация для использования в Telegram Bot
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

import type { AppRouter } from '../../../web/src/server/trpc/routers';

/**
 * Получение базового URL для подключения к основному API
 */
function getWebApiUrl(): string {
  // В production будет использоваться переменная окружения
  if (process.env.WEB_APP_URL) {
    return process.env.WEB_APP_URL;
  }

  throw new Error('WEB_APP_URL environment variable is required for telegram-bot');
}

/**
 * tRPC клиент для взаимодействия с основным API
 * Используется для выполнения operator.takeOrder и других процедур
 */
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getWebApiUrl()}/api/trpc`,
      transformer: superjson,
      // Передача аутентификации для операторских запросов
      headers: () => {
        return {
          'Content-Type': 'application/json',
          // ✅ ПРАВИЛЬНАЯ аутентификация через API_SECRET_KEY
          authorization: `Bearer ${process.env.API_SECRET_KEY}`,
        };
      },
    }),
  ],
});

/**
 * Типизированные методы для использования в bot handlers
 */
export const api = {
  /**
   * Telegram bot специфичные функции
   */
  telegram: {
    takeOrder: trpcClient.telegramBot.takeOrderByTelegram.mutate,
    updateOrderStatus: trpcClient.telegramBot.updateOrderStatusByTelegram.mutate,
  },

  /**
   * Получение информации о заявках
   */
  user: {
    orders: {
      getOrderHistory: trpcClient.user.orders.getOrderHistory.query,
    },
  },
} as const;
