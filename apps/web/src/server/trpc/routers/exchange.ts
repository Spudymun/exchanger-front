import {
  CRYPTOCURRENCIES,
  API_DELAY_MS,
  ORDER_CREATION_DELAY_MS,
  DEFAULT_ORDER_LIMIT,
  MAX_ORDER_LIMIT,
  CURRENCY_NAMES,
} from '@repo/constants';
import {
  validateCreateOrder,
  calculateUahAmount,
  calculateCryptoAmount,
  getExchangeRate,
  getCurrencyLimits,
  generateDepositAddress,
  sanitizeEmail,
  orderManager,
  userManager,
} from '@repo/exchange-core';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '../init';
import { rateLimitMiddleware } from '../middleware/rateLimit';

// === HELPER FUNCTIONS FOR BUSINESS LOGIC ===

/**
 * Создает или находит пользователя по email
 */
function ensureUser(email: string) {
  let user = userManager.findByEmail(email);
  if (!user) {
    user = userManager.create({
      email,
      isVerified: false,
    });
  }
  return user;
}

/**
 * Подготавливает данные для создания заявки
 */
function prepareOrderRequest(input: {
  email: string;
  cryptoAmount: number;
  currency: (typeof CRYPTOCURRENCIES)[number];
  recipientData?: { cardNumber?: string; bankDetails?: string };
}) {
  const sanitizedEmail = sanitizeEmail(input.email);
  const uahAmount = calculateUahAmount(input.cryptoAmount, input.currency);

  return {
    email: sanitizedEmail,
    cryptoAmount: input.cryptoAmount,
    currency: input.currency,
    uahAmount,
    recipientData: input.recipientData,
  };
}

/**
 * Создает новую заявку в системе
 */
function createOrderInSystem(orderRequest: {
  email: string;
  cryptoAmount: number;
  currency: (typeof CRYPTOCURRENCIES)[number];
  uahAmount: number;
  recipientData?: { cardNumber?: string; bankDetails?: string };
}) {
  const depositAddress = generateDepositAddress(orderRequest.currency);

  const order = orderManager.create({
    email: orderRequest.email,
    cryptoAmount: orderRequest.cryptoAmount,
    currency: orderRequest.currency,
    uahAmount: orderRequest.uahAmount,
    status: 'pending',
    depositAddress,
    recipientData: orderRequest.recipientData,
  });

  return { order, depositAddress };
}

export const exchangeRouter = createTRPCRouter({
  // Получить текущие курсы валют
  getRates: publicProcedure.query(async () => {
    // Имитация задержки API
    await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));

    const rates = CRYPTOCURRENCIES.map(currency => getExchangeRate(currency));

    return {
      rates,
      timestamp: new Date(),
    };
  }),

  // Получить лимиты для криптовалюты
  getLimits: publicProcedure
    .input(
      z.object({
        currency: z.enum(CRYPTOCURRENCIES),
      })
    )
    .query(async ({ input }) => {
      const limits = getCurrencyLimits(input.currency);
      const rate = getExchangeRate(input.currency);

      return {
        currency: input.currency,
        limits,
        rate: {
          uahRate: rate.uahRate,
          commission: rate.commission,
        },
      };
    }),

  // Рассчитать сумму обмена
  calculateExchange: publicProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        currency: z.enum(CRYPTOCURRENCIES),
        direction: z.enum(['crypto-to-uah', 'uah-to-crypto']),
      })
    )
    .query(async ({ input }) => {
      const { amount, currency, direction } = input;

      try {
        if (direction === 'crypto-to-uah') {
          const uahAmount = calculateUahAmount(amount, currency);
          const rate = getExchangeRate(currency);

          return {
            cryptoAmount: amount,
            uahAmount,
            rate: rate.uahRate,
            commission: rate.commission,
            commissionAmount: amount * rate.uahRate * (rate.commission / 100),
          };
        } else {
          const cryptoAmount = calculateCryptoAmount(amount, currency);
          const rate = getExchangeRate(currency);

          return {
            cryptoAmount,
            uahAmount: amount,
            rate: rate.uahRate,
            commission: rate.commission,
            commissionAmount: amount * (rate.commission / 100),
          };
        }
      } catch {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ошибка расчета суммы обмена',
        });
      }
    }),

  // Создать заявку на обмен
  createOrder: rateLimitMiddleware.createOrder
    .input(
      z.object({
        email: z.string().email(),
        cryptoAmount: z.number().positive(),
        currency: z.enum(CRYPTOCURRENCIES),
        recipientData: z
          .object({
            cardNumber: z.string().optional(),
            bankDetails: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, ORDER_CREATION_DELAY_MS));

      // Подготавливаем данные заявки
      const orderRequest = prepareOrderRequest(input);

      // Валидация заявки
      const validation = validateCreateOrder(orderRequest);
      if (!validation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.errors[0],
        });
      }

      // Обеспечиваем существование пользователя
      ensureUser(orderRequest.email);

      // Создаем заявку
      const { order, depositAddress } = createOrderInSystem(orderRequest);

      return {
        orderId: order.id,
        depositAddress,
        cryptoAmount: input.cryptoAmount,
        uahAmount: orderRequest.uahAmount,
        currency: input.currency,
        status: order.status,
        createdAt: order.createdAt,
      };
    }),

  // Получить статус заявки
  getOrderStatus: publicProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const order = orderManager.findById(input.orderId);

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Заявка не найдена',
        });
      }

      return {
        id: order.id,
        status: order.status,
        cryptoAmount: order.cryptoAmount,
        uahAmount: order.uahAmount,
        currency: order.currency,
        depositAddress: order.depositAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        processedAt: order.processedAt,
        txHash: order.txHash,
      };
    }),

  // Получить историю заявок для email
  getOrderHistory: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        limit: z.number().min(1).max(MAX_ORDER_LIMIT).default(DEFAULT_ORDER_LIMIT),
      })
    )
    .query(async ({ input }) => {
      const sanitizedEmail = sanitizeEmail(input.email);
      const orders = orderManager.findByEmail(sanitizedEmail);

      // Сортируем по дате создания (новые первыми)
      const sortedOrders = orders
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, input.limit);

      return {
        orders: sortedOrders.map(order => ({
          id: order.id,
          status: order.status,
          cryptoAmount: order.cryptoAmount,
          uahAmount: order.uahAmount,
          currency: order.currency,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })),
        total: orders.length,
      };
    }),

  // Получить поддерживаемые криптовалюты
  getSupportedCurrencies: publicProcedure.query(async () => {
    return CRYPTOCURRENCIES.map(currency => {
      const rate = getExchangeRate(currency);
      const limits = getCurrencyLimits(currency);

      return {
        symbol: currency,
        name: CURRENCY_NAMES[currency as keyof typeof CURRENCY_NAMES],
        rate: rate.uahRate,
        commission: rate.commission,
        limits,
        isActive: true,
      };
    });
  }),
});
