import {
  CRYPTOCURRENCIES,
  API_DELAY_MS,
  ORDER_CREATION_DELAY_MS,
  ORDER_EXPIRATION_TIME_MS,
  CURRENCY_NAMES,
  UI_NUMERIC_CONSTANTS,
  PERCENTAGE_CALCULATIONS,
  AUTH_CONSTANTS,
} from '@repo/constants';
import { RateLimitedEmailService } from '@repo/email-service';

// Constants for error messages
const UNKNOWN_ERROR_MESSAGE = 'Unknown error' as const;
import {
  calculateUahAmount,
  calculateCryptoAmount,
  getExchangeRate,
  getCurrencyLimits,
  sanitizeEmail,
  orderManager,
  userManager,
  isAmountWithinLimits,
  type CryptoCurrency,
  type Order,
  AutoRegistrationService,
  type AutoRegistrationResult,
} from '@repo/exchange-core';
import { UserManagerFactory, type SessionMetadata } from '@repo/session-management';
import {
  paginateOrders,
  sortOrders,
  createBadRequestError,
  createOrderError,
  ExchangeErrors,
  createEnvironmentLogger,
  securityEnhancedGetCurrencyRateSchema,
  securityEnhancedCalculateAmountSchema,
  securityEnhancedCreateExchangeOrderSchema,
  securityEnhancedOrderByIdSchema,
  securityEnhancedGetOrderHistoryByEmailSchema,
  isUUID,
} from '@repo/utils';
import { z } from 'zod';

import { type Context } from '../context';
import { createTRPCRouter, publicProcedure } from '../init';
import { rateLimitMiddleware } from '../middleware/rateLimit';

// ✅ Logger для централизованного логирования
const logger = createEnvironmentLogger('ExchangeRouter');

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
 * Выделяет кошелек через WalletPoolManager
 */
async function allocateWalletForOrder(currency: CryptoCurrency) {
  const { WalletPoolManagerFactory } = await import('@repo/exchange-core');
  const walletManager = await WalletPoolManagerFactory.create();
  return walletManager.allocateWallet(currency);
}

/**
 * Обрабатывает заявку в очереди при недоступности кошелька
 */
async function processQueuedOrder(
  orderRequest: {
    email: string;
    cryptoAmount: number;
    currency: (typeof CRYPTOCURRENCIES)[number];
    uahAmount: number;
    recipientData?: { cardNumber?: string; bankDetails?: string };
  },
  queuePosition: number,
  userSession: { // 🔥 ИСПРАВЛЕНО: принимаем готовую userSession
    user: { id: string };
    sessionId: string;
    isNewUser: boolean;
    authenticationMethod: string;
  }
) {
  const { WALLET_POOL_CONFIG } = await import('@repo/constants');

  const queuedOrder = await orderManager.create({
    userId: userSession.user.id,
    email: orderRequest.email,
    cryptoAmount: orderRequest.cryptoAmount,
    currency: orderRequest.currency,
    uahAmount: orderRequest.uahAmount,
    recipientData: orderRequest.recipientData,
  });

  return {
    order: queuedOrder,
    depositAddress: '', // Адрес будет назначен позже
    sessionInfo: {
      sessionId: userSession.sessionId,
      isNewUser: userSession.isNewUser,
    },
    queueInfo: {
      inQueue: true,
      position: queuePosition,
      estimatedWaitTime: Math.ceil(
        (queuePosition * WALLET_POOL_CONFIG.QUEUE_CONFIG.QUEUE_TIMEOUT) / (60 * 1000)
      ), // Минуты (60 * 1000 = 60000 ms)
    },
  };
}

/**
 * 🆕 TASK 9.3: Send Telegram notification to operators
 */
async function sendTelegramNotification(
  order: Order,
  orderRequest: { email: string },
  depositAddress: string,
  usedOldestOccupiedWallet: boolean
) {
  const telegramBotUrl = process.env.TELEGRAM_BOT_URL;
  if (!telegramBotUrl) {
    logger.warn('TELEGRAM_BOT_URL not configured, skipping Telegram notification', {
      orderId: order.id,
    });
    return;
  }

  try {
    await fetch(`${telegramBotUrl}/api/notify-operators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
      },
      body: JSON.stringify({
        order: {
          id: order.id,
          email: orderRequest.email,
          cryptoAmount: order.cryptoAmount,
          currency: order.currency,
          uahAmount: order.uahAmount,
          status: order.status,
          createdAt: order.createdAt,
        },
        depositAddress,
        walletType: usedOldestOccupiedWallet ? 'reused' : 'fresh',
      }),
    });
    
    logger.info('Telegram notification sent successfully', {
      orderId: order.id,
      walletType: usedOldestOccupiedWallet ? 'reused' : 'fresh',
    });
  } catch (telegramError) {
    logger.error('Failed to send Telegram notification', {
      orderId: order.id,
      error: telegramError instanceof Error ? telegramError.message : UNKNOWN_ERROR_MESSAGE,
    });
    // Continue execution - Telegram notification failure should not interrupt order creation
  }
}

/**
 * Обрабатывает успешную заявку с выделенным кошельком
 */
async function processSuccessfulOrder(params: {
  orderRequest: {
    email: string;
    cryptoAmount: number;
    currency: (typeof CRYPTOCURRENCIES)[number];
    uahAmount: number;
    recipientData?: { cardNumber?: string; bankDetails?: string };
  };
  depositAddress: string;
  userSession: {
    user: { id: string };
    sessionId: string;
    isNewUser: boolean;
    authenticationMethod: string;
  };
  sessionMetadata: SessionMetadata; // 🔥 ДОБАВЛЕНО: для email service
  usedOldestOccupiedWallet?: boolean;
}) {
  const {
    orderRequest,
    depositAddress,
    userSession,
    sessionMetadata,
    usedOldestOccupiedWallet = false,
  } = params;

  const order = await orderManager.create({
    userId: userSession.user.id, // ✅ ГАРАНТИРОВАННЫЙ userId из сессии
    email: orderRequest.email, // ✅ Требуется для CreateOrderRequest interface
    cryptoAmount: orderRequest.cryptoAmount,
    currency: orderRequest.currency,
    uahAmount: orderRequest.uahAmount,
    recipientData: orderRequest.recipientData,
  });

  // ✅ Task 3.4: Send crypto address to user's email with rate limiting
  try {
    await RateLimitedEmailService.sendCryptoAddress(
      {
        orderId: order.id,
        cryptoAddress: depositAddress,
        currency: orderRequest.currency,
        amount: orderRequest.cryptoAmount,
        expiresAt: new Date(Date.now() + ORDER_EXPIRATION_TIME_MS), // Set expiration time
        userEmail: orderRequest.email,
      },
      sessionMetadata.ip
    ); // Use IP address for rate limiting
  } catch (emailError) {
    logger.error('Failed to send crypto address email', {
      orderId: order.id,
      email: orderRequest.email,
      error: emailError instanceof Error ? emailError.message : UNKNOWN_ERROR_MESSAGE,
    });
    // Continue execution even if email sending fails to not interrupt the order flow
  }

  // 🆕 TASK 9.3: Send Telegram notification to operators
  await sendTelegramNotification(order, orderRequest, depositAddress, usedOldestOccupiedWallet);

  return {
    order,
    depositAddress,
    usedOldestOccupiedWallet, // 🆕 Передаем флаг в response
    sessionInfo: {
      sessionId: userSession.sessionId,
      isNewUser: userSession.isNewUser,
    },
  };
}

/**
 * Валидирует входные данные заявки
 */
async function validateOrderInput(
  input: { cryptoAmount: number; currency: string },
  ctx: { getErrorMessage: (key: string, params?: Record<string, string | number>) => Promise<string> }
) {
  logger.debug('CHECKING_AMOUNT_LIMITS', { cryptoAmount: input.cryptoAmount, currency: input.currency });
  const limitCheck = isAmountWithinLimits(input.cryptoAmount, input.currency as CryptoCurrency);
  if (!limitCheck.isValid && limitCheck.localizationKey) {
    logger.warn('AMOUNT_LIMIT_EXCEEDED', {
      cryptoAmount: input.cryptoAmount,
      currency: input.currency,
      localizationKey: limitCheck.localizationKey,
      paramsString: JSON.stringify(limitCheck.params),
    });
    throw createBadRequestError(
      await ctx.getErrorMessage(limitCheck.localizationKey, limitCheck.params)
    );
  }
  logger.debug('AMOUNT_LIMITS_PASSED', { cryptoAmount: input.cryptoAmount });
}

/**
 * Создает и устанавливает сессию пользователя с куки
 */
async function ensureUserSessionWithCookie(
  orderRequest: { email: string; currency: string },
  sessionMetadata: SessionMetadata,
  ctx: { sessionId?: string; res: { setHeader: (name: string, value: string) => void } }
) {
  const webUserManager = await UserManagerFactory.createForWeb();
  const autoRegService = new AutoRegistrationService(webUserManager);
  
  logger.debug('ENSURING_USER_SESSION_FOR_COOKIE_SETUP', {
    email: orderRequest.email,
    hasExistingSessionId: !!ctx.sessionId,
  });
  
  const userSession = await autoRegService.ensureUserWithSession(
    orderRequest.email,
    sessionMetadata,
    ctx.sessionId,
    { generatePassword: true }
  );

  logger.info('USER_SESSION_ENSURED_FOR_COOKIE', {
    email: orderRequest.email,
    userId: userSession.user.id,
    isNewUser: userSession.isNewUser,
    authMethod: userSession.authenticationMethod,
    sessionId: userSession.sessionId.substring(AUTH_CONSTANTS.LOG_TRUNCATE_START, AUTH_CONSTANTS.SESSION_ID_LOG_LENGTH) + '...',
  });

  // Установка куки сразу после создания сессии
  if (userSession.sessionId && (!ctx.sessionId || ctx.sessionId !== userSession.sessionId)) {
    const { SessionCookieUtils } = await import('../../utils/session-cookie');
    SessionCookieUtils.setSessionCookie(ctx.res, userSession.sessionId);
    
    logger.info('COOKIE_SET_AFTER_SESSION_CREATION', {
      oldSessionId: ctx.sessionId?.substring(AUTH_CONSTANTS.LOG_TRUNCATE_START, AUTH_CONSTANTS.SESSION_ID_LOG_LENGTH) + '...' || 'none',
      newSessionId: userSession.sessionId.substring(AUTH_CONSTANTS.LOG_TRUNCATE_START, AUTH_CONSTANTS.SESSION_ID_LOG_LENGTH) + '...',
      isNewUser: userSession.isNewUser,
    });
  }

  return userSession;
}

/**
 * Обрабатывает неуспешные результаты wallet allocation
 */
async function handleFailedAllocation(
  orderRequest: {
    email: string;
    cryptoAmount: number;
    currency: (typeof CRYPTOCURRENCIES)[number];
    uahAmount: number;
    recipientData?: { cardNumber?: string; bankDetails?: string };
  },
  userSession: {
    user: { id: string };
    sessionId: string;
    isNewUser: boolean;
    authenticationMethod: string;
  },
  allocationResult: { success: false; error?: string; queuePosition?: number }
) {
  logger.warn('WALLET_ALLOCATION_FAILED', {
    email: orderRequest.email,
    currency: orderRequest.currency,
    error: allocationResult.error,
    queuePosition: allocationResult.queuePosition,
  });

  if (allocationResult.queuePosition) {
    logger.info('PROCESSING_QUEUED_ORDER', {
      email: orderRequest.email,
      queuePosition: allocationResult.queuePosition,
    });
    return processQueuedOrder(orderRequest, allocationResult.queuePosition, userSession);
  }

  const errorMessage = allocationResult.error || 'Unknown error';
  logger.error('CRITICAL_WALLET_ALLOCATION_ERROR', {
    email: orderRequest.email,
    currency: orderRequest.currency,
    error: errorMessage,
  });
  ExchangeErrors.throw(
    ExchangeErrors.walletAllocationFailed({
      email: orderRequest.email,
      currency: orderRequest.currency,
      error: errorMessage
    })
  );
}

/**
 * Обрабатывает результат wallet allocation
 */
async function handleWalletAllocation(
  orderRequest: {
    email: string;
    cryptoAmount: number;
    currency: (typeof CRYPTOCURRENCIES)[number];
    uahAmount: number;
    recipientData?: { cardNumber?: string; bankDetails?: string };
  },
  userSession: {
    user: { id: string };
    sessionId: string;
    isNewUser: boolean;
    authenticationMethod: string;
  },
  sessionMetadata: SessionMetadata
) {
  logger.debug('ALLOCATING_WALLET_FOR_ORDER', { currency: orderRequest.currency });
  const allocationResult = await allocateWalletForOrder(orderRequest.currency as CryptoCurrency);
  
  logger.debug('WALLET_ALLOCATION_COMPLETE', {
    success: allocationResult.success,
    address: allocationResult.address,
    queuePosition: allocationResult.queuePosition,
    usedOldestOccupiedWallet: allocationResult.usedOldestOccupiedWallet,
    error: allocationResult.error,
  });

  if (!allocationResult.success) {
    return handleFailedAllocation(
      orderRequest, 
      userSession, 
      allocationResult as { success: false; error?: string; queuePosition?: number }
    );
  }

  // Успешная allocation
  const depositAddress = allocationResult.address;
  if (!depositAddress) {
    logger.error('WALLET_ALLOCATION_NO_ADDRESS', {
      email: orderRequest.email,
      allocationResult: JSON.stringify(allocationResult),
    });
    ExchangeErrors.throw(
      ExchangeErrors.walletAllocationFailed({
        email: orderRequest.email,
        reason: 'no_address_returned'
      })
    );
  }

  logger.info('PROCESSING_SUCCESSFUL_ORDER', {
    email: orderRequest.email,
    depositAddress,
    usedOldestOccupiedWallet: allocationResult.usedOldestOccupiedWallet,
  });

  return processSuccessfulOrder({
    orderRequest,
    depositAddress,
    userSession,
    sessionMetadata,
    usedOldestOccupiedWallet: allocationResult.usedOldestOccupiedWallet,
  });
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
  userSession: AutoRegistrationResult
) {
  logger.info('CREATE_ORDER_IN_SYSTEM_START', {
    email: orderRequest.email,
    currency: orderRequest.currency,
    cryptoAmount: orderRequest.cryptoAmount,
    uahAmount: orderRequest.uahAmount,
    hasExistingSessionId: !!userSession.sessionId,
    sessionIp: sessionMetadata.ip,
  });

  logger.info('USER_SESSION_ALREADY_ENSURED', {
    email: orderRequest.email,
    userId: userSession.user.id,
    isNewUser: userSession.isNewUser,
    authMethod: userSession.authenticationMethod,
    sessionId: userSession.sessionId.substring(AUTH_CONSTANTS.LOG_TRUNCATE_START, AUTH_CONSTANTS.SESSION_ID_LOG_LENGTH) + '...',
  });

  return handleWalletAllocation(orderRequest, userSession, sessionMetadata);
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
      // Начальное логирование
      logger.info('ORDER_CREATION_STARTED', {
        email: input.email,
        currency: input.currency,
        cryptoAmount: input.cryptoAmount,
        sessionId: ctx.sessionId,
        ip: ctx.ip,
        userAgent: ctx.req.headers['user-agent'],
      });

      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, ORDER_CREATION_DELAY_MS));

      // Валидация валюты
      logger.debug('VALIDATING_CURRENCY', { currency: input.currency });
      await assertValidCurrency(input.currency, ctx);
      logger.debug('CURRENCY_VALIDATED', { currency: input.currency });

      // Подготовка данных
      const orderRequest = prepareOrderRequest({
        ...input,
        currency: input.currency as CryptoCurrency,
      });

      // Валидация входных данных
      await validateOrderInput(input, ctx);

      // Подготовка session metadata
      const sessionMetadata: SessionMetadata = {
        ip: ctx.ip || AUTH_CONSTANTS.FALLBACK_IP,
        userAgent: ctx.req.headers['user-agent'] || AUTH_CONSTANTS.FALLBACK_USER_AGENT,
      };

      // Создание сессии с куки
      const userSession = await ensureUserSessionWithCookie(orderRequest, sessionMetadata, ctx);

      // Создание заказа
      const result = await createOrderInSystem(
        orderRequest,
        sessionMetadata,
        userSession
      );
      
      logger.info('ORDER_CREATED_SUCCESSFULLY', {
        orderId: result.order.id,
        depositAddress: result.depositAddress,
        status: result.order.status,
        userId: result.order.userId,
        sessionId: result.sessionInfo.sessionId,
        isNewUser: result.sessionInfo.isNewUser,
      });

      return {
        orderId: result.order.publicId, // ✅ ИЗМЕНЕНО: возвращаем publicId для URL
        depositAddress: result.depositAddress,
        cryptoAmount: input.cryptoAmount,
        uahAmount: orderRequest.uahAmount,
        currency: input.currency,
        status: result.order.status,
        createdAt: result.order.createdAt,
        sessionInfo: result.sessionInfo,
      };
    }),

  // Получить статус заявки
  getOrderStatus: publicProcedure
    .input(securityEnhancedOrderByIdSchema)
    .query(async ({ input }) => {
      // Определяем тип ID и используем соответствующий метод поиска
      const order = isUUID(input.orderId)
        ? await orderManager.findById(input.orderId)
        : await orderManager.findByPublicId(input.orderId);

      if (!order) {
        throw createOrderError('not_found', input.orderId);
      }

      // ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА: получить email через userId → User
      const user = await userManager.findById(order.userId);
      const userEmail = user?.email || 'unknown@unknown.com';

      return {
        id: order.publicId, // ✅ ИЗМЕНЕНО: возвращаем publicId для frontend
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
          id: order.publicId, // ✅ ИЗМЕНЕНО: возвращаем publicId для frontend
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
