import {
  CRYPTOCURRENCIES,
  API_DELAY_MS,
  ORDER_CREATION_DELAY_MS,
  CURRENCY_NAMES,
  UI_NUMERIC_CONSTANTS,
  PERCENTAGE_CALCULATIONS,
  AUTH_CONSTANTS,
} from '@repo/constants';
import { EmailService } from '@repo/email-service';
import {
  calculateUahAmount,
  calculateCryptoAmount,
  getExchangeRate,
  getCurrencyLimits,
  generateDepositAddress,
  sanitizeEmail,
  orderManager,
  userManager,
  isAmountWithinLimits,
  type CryptoCurrency,
  AutoRegistrationService,
} from '@repo/exchange-core';
import { UserManagerFactory, type SessionMetadata } from '@repo/session-management';
import {
  paginateOrders,
  sortOrders,
  createBadRequestError,
  createOrderError,
  securityEnhancedGetCurrencyRateSchema,
  securityEnhancedCalculateAmountSchema,
  securityEnhancedCreateExchangeOrderSchema,
  securityEnhancedOrderByIdSchema,
  securityEnhancedGetOrderHistoryByEmailSchema,
} from '@repo/utils';
import { z } from 'zod';

import { type Context } from '../context';
import { createTRPCRouter, publicProcedure } from '../init';
import { rateLimitMiddleware } from '../middleware/rateLimit';

// === TYPE GUARDS ===

/**
 * Type guard для проверки валидности криптовалюты
 */
async function assertValidCurrency(currency: string, ctx: Context): Promise<void> {
  if (!CRYPTOCURRENCIES.includes(currency as CryptoCurrency)) {
    throw createBadRequestError(
      await ctx.getErrorMessage('server.errors.business.unsupportedCurrency', { currency })
    );
  }
}

// === HELPER FUNCTIONS FOR BUSINESS LOGIC ===

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
 * Создает новую заявку в системе с обязательным session management
 */
async function createOrderInSystem(
  orderRequest: {
    email: string;
    cryptoAmount: number;
    currency: (typeof CRYPTOCURRENCIES)[number];
    uahAmount: number;
    recipientData?: { cardNumber?: string; bankDetails?: string };
  },
  sessionMetadata: SessionMetadata,
  existingSessionId?: string
) {
  const depositAddress = generateDepositAddress(orderRequest.currency);

  // ✅ НОВАЯ АРХИТЕКТУРА: Используем существующую Multi-App Context архитектуру
  const webUserManager = await UserManagerFactory.createForWeb();

  // ✅ НОВАЯ АРХИТЕКТУРА: Используем существующий AutoRegistrationService
  const autoRegService = new AutoRegistrationService(webUserManager);

  // ✅ ENHANCED AC2.1A: Pass existingSessionId for smart session management
  const userSession = await autoRegService.ensureUserWithSession(
    orderRequest.email,
    sessionMetadata,
    existingSessionId
  );

  const order = await orderManager.create({
    userId: userSession.user.id, // ✅ ГАРАНТИРОВАННЫЙ userId из сессии
    email: orderRequest.email, // ✅ Требуется для CreateOrderRequest interface
    cryptoAmount: orderRequest.cryptoAmount,
    currency: orderRequest.currency,
    uahAmount: orderRequest.uahAmount,
    recipientData: orderRequest.recipientData,
  });

  // ✅ Task 3.4: Send crypto address to user's email
  try {
    await EmailService.sendCryptoAddress({
      orderId: order.id,
      cryptoAddress: depositAddress,
      currency: orderRequest.currency,
      amount: orderRequest.cryptoAmount,
      expiresAt: new Date(Date.now() + ORDER_CREATION_DELAY_MS), // Set expiration time
      userEmail: orderRequest.email,
    });
  } catch (emailError) {
    console.error('Failed to send crypto address email:', emailError);
    // Continue execution even if email sending fails to not interrupt the order flow
  }

  return {
    order,
    depositAddress,
    sessionInfo: {
      sessionId: userSession.sessionId,
      isNewUser: userSession.isNewUser,
    },
  };
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
    .input(securityEnhancedGetCurrencyRateSchema)
    .query(async ({ input, ctx }) => {
      await assertValidCurrency(input.currency, ctx);
      const currency = input.currency as CryptoCurrency;
      const limits = getCurrencyLimits(currency);
      const rate = getExchangeRate(currency);

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
    .input(securityEnhancedCalculateAmountSchema)
    .query(async ({ input, ctx }) => {
      const { amount, currency, direction } = input;
      await assertValidCurrency(currency, ctx);
      const validCurrency = currency as CryptoCurrency;

      try {
        if (direction === 'crypto-to-uah') {
          const uahAmount = calculateUahAmount(amount, validCurrency);
          const rate = getExchangeRate(validCurrency);

          return {
            cryptoAmount: amount,
            uahAmount,
            rate: rate.uahRate,
            commission: rate.commission,
            commissionAmount:
              amount * rate.uahRate * (rate.commission / PERCENTAGE_CALCULATIONS.PERCENT_BASE),
          };
        } else {
          const cryptoAmount = calculateCryptoAmount(amount, validCurrency);
          const rate = getExchangeRate(validCurrency);

          return {
            cryptoAmount,
            uahAmount: amount,
            rate: rate.uahRate,
            commission: rate.commission,
            commissionAmount: amount * (rate.commission / PERCENTAGE_CALCULATIONS.PERCENT_BASE),
          };
        }
      } catch {
        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.exchangeCalculationError')
        );
      }
    }),

  // Создать заявку на обмен
  createOrder: rateLimitMiddleware.createOrder
    .input(
      securityEnhancedCreateExchangeOrderSchema.extend({
        recipientData: z
          .object({
            cardNumber: z.string().optional(),
            bankDetails: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, ORDER_CREATION_DELAY_MS));

      // Валидация типа валюты
      await assertValidCurrency(input.currency, ctx);

      // Подготавливаем данные заявки с правильным типом
      const orderRequest = prepareOrderRequest({
        ...input,
        currency: input.currency as CryptoCurrency,
      });

      // Проверяем только бизнес-условия (лимиты, курсы)
      // Input validation уже выполнена Zod schemas в input()
      const limitCheck = isAmountWithinLimits(input.cryptoAmount, input.currency as CryptoCurrency);
      if (!limitCheck.isValid && limitCheck.localizationKey) {
        throw createBadRequestError(
          await ctx.getErrorMessage(limitCheck.localizationKey, limitCheck.params)
        );
      }

      // ✅ Task 3.1: Подготовка session metadata для обязательной сессии
      const sessionMetadata: SessionMetadata = {
        ip: ctx.ip || AUTH_CONSTANTS.FALLBACK_IP,
        userAgent: ctx.req.headers['user-agent'] || AUTH_CONSTANTS.FALLBACK_USER_AGENT,
      };

      // ✅ ENHANCED Task 3.2: AC2.1A session management with existing sessionId
      const { order, depositAddress, sessionInfo } = await createOrderInSystem(
        orderRequest,
        sessionMetadata,
        ctx.sessionId
      );

      return {
        orderId: order.id,
        depositAddress,
        cryptoAmount: input.cryptoAmount,
        uahAmount: orderRequest.uahAmount,
        currency: input.currency,
        status: order.status,
        createdAt: order.createdAt,
        // ✅ Task 3.1: Дополнительная информация о сессии
        sessionInfo,
      };
    }),

  // Получить статус заявки
  getOrderStatus: publicProcedure
    .input(securityEnhancedOrderByIdSchema)
    .query(async ({ input }) => {
      const order = await orderManager.findById(input.orderId);

      if (!order) {
        throw createOrderError('not_found', input.orderId);
      }

      // ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА: получить email через userId → User
      const user = await userManager.findById(order.userId);
      const userEmail = user?.email || 'unknown@unknown.com';

      return {
        id: order.id,
        status: order.status,
        cryptoAmount: order.cryptoAmount,
        uahAmount: order.uahAmount,
        currency: order.currency,
        tokenStandard: order.tokenStandard,
        depositAddress: order.depositAddress,
        recipientData: order.recipientData,
        email: userEmail, // ✅ ПОЛУЧЕНО через связь userId → User
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        processedAt: order.processedAt,
        txHash: order.txHash,
      };
    }),

  // Получить историю заявок для email
  getOrderHistory: publicProcedure
    .input(securityEnhancedGetOrderHistoryByEmailSchema)
    .query(async ({ input }) => {
      const sanitizedEmail = sanitizeEmail(input.email);

      // ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА: email → user → orders by userId
      const user = await userManager.findByEmail(sanitizedEmail);
      if (!user) {
        return { orders: [], total: 0 }; // Не раскрываем информацию о существовании email
      }

      const orders = await orderManager.findByUserId(user.id);

      // Используем централизованные утилиты для сортировки и ограничения
      const result = paginateOrders(sortOrders(orders), {
        limit: input.limit,
        offset: UI_NUMERIC_CONSTANTS.INITIAL_OFFSET,
      });

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
