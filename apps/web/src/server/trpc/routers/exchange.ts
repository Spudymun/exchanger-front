import {
  CRYPTOCURRENCIES,
  API_DELAY_MS,
  ORDER_CREATION_DELAY_MS,
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
  type CryptoCurrency,
} from '@repo/exchange-core';
import {
  paginateOrders,
  sortOrders,
  createBadRequestError,
  createOrderError,
  getCurrencyRateSchema,
  calculateAmountSchema,
  createExchangeOrderSchema,
  orderByIdSchema,
  getOrderHistoryByEmailSchema,
} from '@repo/utils';
import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '../init';
import { rateLimitMiddleware } from '../middleware/rateLimit';

// === TYPE GUARDS ===

/**
 * Type guard для проверки валидности криптовалюты
 */
function assertValidCurrency(currency: string): asserts currency is CryptoCurrency {
  if (!CRYPTOCURRENCIES.includes(currency as CryptoCurrency)) {
    throw createBadRequestError(`Неподдерживаемая криптовалюта: ${currency}`);
  }
}

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
  getLimits: publicProcedure.input(getCurrencyRateSchema).query(async ({ input }) => {
    assertValidCurrency(input.currency);
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
  calculateExchange: publicProcedure.input(calculateAmountSchema).query(async ({ input }) => {
    const { amount, currency, direction } = input;
    assertValidCurrency(currency);

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
      throw createBadRequestError('Ошибка расчета суммы обмена');
    }
  }),

  // Создать заявку на обмен
  createOrder: rateLimitMiddleware.createOrder
    .input(
      createExchangeOrderSchema.extend({
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

      // Валидация типа валюты
      assertValidCurrency(input.currency);

      // Подготавливаем данные заявки с правильным типом
      const orderRequest = prepareOrderRequest({
        ...input,
        currency: input.currency as CryptoCurrency,
      });

      // Валидация заявки
      const validation = validateCreateOrder(orderRequest);
      if (!validation.isValid) {
        throw createBadRequestError(validation.errors[0] || 'Ошибка валидации заявки');
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
  getOrderStatus: publicProcedure.input(orderByIdSchema).query(async ({ input }) => {
    const order = orderManager.findById(input.orderId);

    if (!order) {
      throw createOrderError('not_found', input.orderId);
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
  getOrderHistory: publicProcedure.input(getOrderHistoryByEmailSchema).query(async ({ input }) => {
    const sanitizedEmail = sanitizeEmail(input.email);
    const orders = orderManager.findByEmail(sanitizedEmail);

    // Используем централизованные утилиты для сортировки и ограничения
    const result = paginateOrders(sortOrders(orders), { limit: input.limit, offset: 0 });

    return {
      orders: result.items.map(order => ({
        id: order.id,
        status: order.status,
        cryptoAmount: order.cryptoAmount,
        uahAmount: order.uahAmount,
        currency: order.currency,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      total: result.total,
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
