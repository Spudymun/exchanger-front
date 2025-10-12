import {
  CRYPTOCURRENCIES,
  API_DELAY_MS,
  ORDER_CREATION_DELAY_MS,
  ORDER_EXPIRATION_TIME_MS,
  CURRENCY_NAMES,
  UI_NUMERIC_CONSTANTS,
  PERCENTAGE_CALCULATIONS,
  AUTH_CONSTANTS,
  ORDER_STATUS_GROUPS,
  EMAIL_ENABLED_IN_DEVELOPMENT,
  EXCHANGE_DEFAULTS,
} from '@repo/constants';

import { RateLimitedEmailService } from '@repo/email-service';

// Constants for error messages
const UNKNOWN_ERROR_MESSAGE = 'Unknown error' as const;
const DATABASE_URL_REQUIRED_ERROR = 'DATABASE_URL environment variable is required' as const;
import {
  calculateUahAmountAsync,
  calculateCryptoAmountAsync,
  getExchangeRateAsync,
  getCurrencyLimits,
  sanitizeEmail,
  orderManager,
  userManager,
  isAmountWithinLimits,
  type CryptoCurrency,
  type Order,
  type WalletInfo,
} from '@repo/exchange-core';
import {
  AutoRegistrationService,
  SmartPricingService,
  OrderExpirationService,
  OrderCancellationHandler,
  type AutoRegistrationResult,
} from '@repo/exchange-core/server';
import { UserManagerFactory, type SessionMetadata } from '@repo/session-management';
import {
  paginateOrders,
  sortOrders,
  createBadRequestError,
  createNotFoundError,
  ExchangeErrors,
  createEnvironmentLogger,
  securityEnhancedGetCurrencyRateSchema,
  securityEnhancedCalculateAmountSchema,
  securityEnhancedCreateExchangeOrderSchema,
  securityEnhancedOrderByIdSchema,
  securityEnhancedGetOrderHistoryByEmailSchema,
  isUUID,
  /*
  // ⚠️ LEGACY IMPORTS - ЗАКОММЕНТИРОВАНЫ ДЛЯ BACKWARD COMPATIBILITY
  // 
  // ВАЖНО: В данном файле legacy error creators не использовались напрямую
  // Однако для единообразия с другими router файлами добавляем комментарий
  // 
  // ПОТЕНЦИАЛЬНЫЕ LEGACY FUNCTIONS (если бы использовались):
  // - createOrderError('not_found') → createNotFoundError('Order not found')
  // - createOrderError('cannot_cancel') → createBadRequestError('Order cannot be cancelled')
  // - createOrderError('access_denied') → createForbiddenError('Access to order denied')
  //
  // createOrderError,
  */
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
async function prepareOrderRequest(input: {
  email: string;
  cryptoAmount: number;
  currency: (typeof CRYPTOCURRENCIES)[number];
  tokenStandard?: string;
  recipientData?: { cardNumber?: string; bankDetails?: string };
}) {
  const sanitizedEmail = sanitizeEmail(input.email);
  
  // ✅ ОПТИМАЛЬНО: ОДИН вызов к кешу SmartPricingService
  const uahAmount = await calculateUahAmountAsync(input.cryptoAmount, input.currency);
  
  // ✅ КУРС ДЛЯ ФИКСАЦИИ: курс С комиссией как на главной странице
  // calculateUahAmountAsync(1, currency) = чистый курс - маржа компании - комиссия
  const fixedExchangeRate = await calculateUahAmountAsync(1, input.currency);

  return {
    email: sanitizedEmail,
    cryptoAmount: input.cryptoAmount,
    currency: input.currency,
    tokenStandard: input.tokenStandard,
    uahAmount,
    recipientData: input.recipientData,
    fixedExchangeRate, // ✅ Курс с комиссией, тот же что на главной
  };
}

/**
 * Выделяет кошелек через WalletPoolManager
 * ✅ ИСПРАВЛЕНО: учитывает tokenStandard для multi-network токенов (USDT)
 */
async function allocateWalletForOrder(currency: CryptoCurrency, tokenStandard?: string) {
  const { WalletPoolManagerFactory } = await import('@repo/exchange-core/server');
  const walletManager = await WalletPoolManagerFactory.create();
  return walletManager.allocateWallet(currency, tokenStandard);
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
      },
      body: JSON.stringify({
        order: {
          id: order.publicId, // ✅ publicId для отображения в Telegram
          internalId: order.id, // ✅ UUID для связи с БД (обновление сообщений)
          email: orderRequest.email,
          cryptoAmount: order.cryptoAmount,
          currency: order.currency,
          uahAmount: order.uahAmount,
          status: order.status,
          createdAt: order.createdAt,
        },
        depositAddress,
        walletType: usedOldestOccupiedWallet ? 'reused' : 'fresh',
        notificationType: 'new_order', // 🆕 Указываем тип для роутинга в правильную тему
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
 * Получает информацию о кошельке по адресу
 */
async function getWalletByAddress(depositAddress: string, orderEmail: string) {
  const { PostgresWalletAdapter, getPrismaClient } = await import('@repo/session-management');
  const { SESSION_CONSTANTS } = await import('@repo/constants');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(DATABASE_URL_REQUIRED_ERROR);
  }
  
  const prisma = getPrismaClient({
    url: databaseUrl,
    maxConnections: SESSION_CONSTANTS.DATABASE.MAX_CONNECTIONS,
  });
  const walletRepository = new PostgresWalletAdapter(prisma);
  const walletInfo = await walletRepository.findByAddress(depositAddress);
  
  if (!walletInfo) {
    logger.error('WALLET_NOT_FOUND_BY_ADDRESS', {
      depositAddress,
      orderEmail,
    });
    ExchangeErrors.throw(
      ExchangeErrors.walletAllocationFailed({
        email: orderEmail,
        reason: 'wallet_not_found_by_address'
      })
    );
  }

  return walletInfo;
}

/**
 * Отправляет email с адресом криптовалюты
 */
async function sendCryptoAddressEmail(params: {
  order: Order;
  orderRequest: { email: string; currency: CryptoCurrency; cryptoAmount: number };
  depositAddress: string;
  sessionMetadata: SessionMetadata;
  walletInfo?: WalletInfo;
}) {
  const { order, orderRequest, depositAddress, sessionMetadata, walletInfo } = params;
  logger.info('Starting email sending process', {
    orderId: order.id,
    email: orderRequest.email,
    currency: orderRequest.currency,
    amount: orderRequest.cryptoAmount,
  });

  // Проверяем конфигурацию отправки email
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const isGlobalEnabled = environment === 'production' || EMAIL_ENABLED_IN_DEVELOPMENT.GLOBAL;
  const isCryptoAddressEnabled = environment === 'production' || EMAIL_ENABLED_IN_DEVELOPMENT.CRYPTO_ADDRESS;

  if (!isGlobalEnabled || !isCryptoAddressEnabled) {
    logger.info('Email sending disabled by configuration', {
      orderId: order.id,
      email: orderRequest.email,
      environment,
      globalEnabled: isGlobalEnabled,
      cryptoAddressEnabled: isCryptoAddressEnabled,
      message: 'Email отправка отключена в конфигурации для разработки',
    });
    return;
  }
  
  try {
    // ✅ ИСПРАВЛЕНО: получаем tokenStandard только из кошелька
    const effectiveTokenStandard = walletInfo?.tokenStandard || 'TRC-20'; // fallback на TRC-20 если не определено
    
    logger.info('Token standard resolution for email', {
      orderId: order.publicId,
      walletTokenStandard: walletInfo?.tokenStandard,
      effectiveTokenStandard,
    });

    await RateLimitedEmailService.sendCryptoAddress(
      {
        orderId: order.publicId, // ✅ ИСПРАВЛЕНО: используем публичный ID для внешних коммуникаций
        cryptoAddress: depositAddress,
        currency: orderRequest.currency,
        amount: orderRequest.cryptoAmount,
        expiresAt: new Date(Date.now() + ORDER_EXPIRATION_TIME_MS),
        userEmail: orderRequest.email,
        tokenStandard: effectiveTokenStandard, // ✅ ИСПРАВЛЕНО: только из кошелька
      },
      sessionMetadata.ip
    );
  } catch (emailError) {
    logger.error('Failed to send crypto address email', {
      orderId: order.id,
      email: orderRequest.email,
      error: emailError instanceof Error ? emailError.message : UNKNOWN_ERROR_MESSAGE,
    });
    // Continue execution even if email sending fails to not interrupt the order flow
  }
}

// ✅ Singleton для OrderExpirationService
let expirationService: OrderExpirationService | null = null;

async function getExpirationService(): Promise<OrderExpirationService> {
  if (!expirationService) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required');
    }

    expirationService = new OrderExpirationService(redisUrl);
    await expirationService.initialize();

    // Запустить listener один раз
    const cancellationHandler = new OrderCancellationHandler();

    await expirationService.startExpirationListener((orderId) =>
      cancellationHandler.handleExpiredOrder(orderId)
    );

    logger.info('ORDER_EXPIRATION_SERVICE_INITIALIZED');
  }

  return expirationService;
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
    recipientData?: { cardNumber?: string; bankDetails?: string; bankId?: string };
    fixedExchangeRate?: number;
  };
  depositAddress: string;
  userSession: {
    user: { id: string };
    sessionId: string;
    isNewUser: boolean;
    authenticationMethod: string;
  };
  sessionMetadata: SessionMetadata;
  usedOldestOccupiedWallet?: boolean;
}) {
  const {
    orderRequest,
    depositAddress,
    userSession,
    sessionMetadata,
    usedOldestOccupiedWallet = false,
  } = params;

  // Получение информации о кошельке
  const walletInfo = await getWalletByAddress(depositAddress, orderRequest.email);

  // Используем зафиксированный курс из prepareOrderRequest (избегаем дублирующего API вызова)
  const fixedExchangeRate = orderRequest.fixedExchangeRate;

  // ✅ КОНВЕРТИРУЕМ externalId В UUID - получаем банк из БД
  let bankUuid: string | undefined;
  const bankExternalId = orderRequest.recipientData?.bankId || EXCHANGE_DEFAULTS.DEFAULT_BANK_ID;
  
  if (bankExternalId) {
    try {
      const { getPrismaClient } = await import('@repo/session-management');
      const databaseUrl = process.env.DATABASE_URL;
      if (databaseUrl) {
        const prisma = getPrismaClient({ url: databaseUrl });
        const bank = await prisma.bank.findUnique({
          where: { externalId: bankExternalId },
          select: { id: true }
        });
        bankUuid = bank?.id;
      }
    } catch (error) {
      logger.warn('BANK_UUID_LOOKUP_FAILED', { 
        bankExternalId, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  // Создание заказа
  const order = await orderManager.create({
    userId: userSession.user.id,
    email: orderRequest.email,
    cryptoAmount: orderRequest.cryptoAmount,
    currency: orderRequest.currency,
    uahAmount: orderRequest.uahAmount,
    recipientData: orderRequest.recipientData,
    walletId: walletInfo.id,
    bankId: bankUuid,                    // ✅ ИСПОЛЬЗУЕМ UUID банка
    fixedExchangeRate,                   // ✅ ДОБАВИТЬ (из frontend)
    expiresAt: new Date(Date.now() + ORDER_EXPIRATION_TIME_MS), // ✅ Автоматическая отмена через 90 мин
  });

  // ✅ Запланировать автоматическую отмену заказа через Redis TTL
  try {
    logger.info('ATTEMPTING_TO_SCHEDULE_ORDER_EXPIRATION', {
      orderId: order.id,
      redisUrl: process.env.REDIS_URL ? 'set' : 'missing',
    });
    
    const expService = await getExpirationService();
    
    logger.info('EXPIRATION_SERVICE_OBTAINED', {
      orderId: order.id,
      serviceInitialized: !!expService,
    });
    
    await expService.scheduleOrderExpiration(order.id);
    
    logger.info('ORDER_EXPIRATION_SCHEDULED_SUCCESSFULLY', {
      orderId: order.id,
    });
  } catch (error) {
    logger.error('FAILED_TO_SCHEDULE_ORDER_EXPIRATION', {
      orderId: order.id,
      error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Не бросаем ошибку - fallback cron подхватит через expiresAt
  }

  // Отправка email с адресом
  await sendCryptoAddressEmail({ order, orderRequest, depositAddress, sessionMetadata, walletInfo });

  // Отправка уведомления в Telegram
  await sendTelegramNotification(order, orderRequest, depositAddress, usedOldestOccupiedWallet);

  return {
    order,
    depositAddress,
    usedOldestOccupiedWallet,
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
function handleFailedAllocation(
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
  allocationResult: { success: false; error?: string }
): never {
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
    tokenStandard?: string; // ✅ ИСПРАВЛЕНО: добавляем tokenStandard
  },
  userSession: {
    user: { id: string };
    sessionId: string;
    isNewUser: boolean;
    authenticationMethod: string;
  },
  sessionMetadata: SessionMetadata
) {
  logger.debug('ALLOCATING_WALLET_FOR_ORDER', { currency: orderRequest.currency, tokenStandard: orderRequest.tokenStandard });
  const allocationResult = await allocateWalletForOrder(orderRequest.currency as CryptoCurrency, orderRequest.tokenStandard);
  
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
    tokenStandard?: string;
    uahAmount: number;
    recipientData?: { cardNumber?: string; bankDetails?: string; bankId?: string };
    fixedExchangeRate?: number;
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
  // Получить текущие курсы валют (ОБНОВЛЕНО: поддержка гибридной системы ценообразования)
  getRates: publicProcedure.query(async () => {
    // Имитация задержки API (сохраняем для UX)
    await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));

    try {
      const pricingService = new SmartPricingService();

      // Получаем курсы параллельно для производительности
      const ratePromises = CRYPTOCURRENCIES.map(currency =>
        pricingService.getSafeExchangeRate(currency)
      );

      const rates = await Promise.all(ratePromises);

      return {
        rates: rates.map(rate => ({
          currency: rate.currency,
          usdRate: rate.usdRate,
          uahRate: rate.uahRate,
          commission: rate.commission,
          lastUpdated: rate.lastUpdated,
          source: rate.source,        // Новое поле: источник данных
          spread: rate.spread,        // Новое поле: маржа
        })),
        timestamp: new Date(),
        metadata: {
          realTimeCount: rates.filter(r => r.source === 'api').length,
          fallbackCount: rates.filter(r => r.source === 'fallback').length,
        }
      };

    } catch (error) {
      logger.error('Smart pricing service failed, using legacy rates:', { 
        error: error instanceof Error ? error.message : String(error) 
      });

      // Fallback на старую систему при критических ошибках
      const rates = await Promise.all(
        CRYPTOCURRENCIES.map(async currency => await getExchangeRateAsync(currency))
      );

      return {
        rates,
        timestamp: new Date(),
        metadata: {
          realTimeCount: 0,
          fallbackCount: rates.length, // Все курсы через fallback при ошибке
          error: 'SMART_PRICING_UNAVAILABLE'
        }
      };
    }
  }),

  // Получить лимиты для криптовалюты
  getLimits: publicProcedure
    .input(securityEnhancedGetCurrencyRateSchema)
    .query(async ({ input, ctx }) => {
      await assertValidCurrency(input.currency, ctx);
      const currency = input.currency as CryptoCurrency;
      const limits = getCurrencyLimits(currency);
      const rate = await getExchangeRateAsync(currency);

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
          const uahAmount = await calculateUahAmountAsync(amount, validCurrency);
          // rate.uahRate = чистый курс БЕЗ маржи компании (только курс от SmartPricingService)
          const rate = await getExchangeRateAsync(validCurrency);

          return {
            cryptoAmount: amount,
            uahAmount,
            rate: rate.uahRate,
            commission: rate.commission,
            commissionAmount:
              amount * rate.uahRate * (rate.commission / PERCENTAGE_CALCULATIONS.PERCENT_BASE),
          };
        } else {
          const cryptoAmount = await calculateCryptoAmountAsync(amount, validCurrency);
          // rate.uahRate = чистый курс БЕЗ маржи компании (только курс от SmartPricingService)
          const rate = await getExchangeRateAsync(validCurrency);

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
            bankId: z.string().optional(), // ✅ ДОБАВЛЕНО: bankId из frontend
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

      // Проверка на дублирование активных заказов (Level 3 Protection)
      const sanitizedEmail = sanitizeEmail(input.email);
      const existingUser = await userManager.findByEmail(sanitizedEmail);
      if (existingUser) {
        const userOrders = await orderManager.findByUserId(existingUser.id);
        const activeOrders = userOrders.filter(order => 
          (ORDER_STATUS_GROUPS.ACTIVE as readonly string[]).includes(order.status)
        );
        if (activeOrders.length > 0) {
          logger.warn('DUPLICATE_ACTIVE_ORDER_PREVENTED', {
            email: sanitizedEmail,
            userId: existingUser.id,
            activeOrdersCount: activeOrders.length,
            sessionId: ctx.sessionId,
            ip: ctx.ip,
          });
          throw createBadRequestError(
            await ctx.getErrorMessage('server.errors.business.duplicateActiveOrder')
          );
        }
      }

      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, ORDER_CREATION_DELAY_MS));

      // Валидация валюты
      logger.debug('VALIDATING_CURRENCY', { currency: input.currency });
      await assertValidCurrency(input.currency, ctx);
      logger.debug('CURRENCY_VALIDATED', { currency: input.currency });

      // Подготовка данных
      const orderRequest = await prepareOrderRequest({
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
        throw createNotFoundError(`Order with ID "${input.orderId}" not found`);
      }

      // ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА: получить email через userId → User
      const user = await userManager.findById(order.userId);
      console.log('� DEBUG getOrderStatus:', { 
        orderId: input.orderId,
        orderUserId: order.userId,
        userFound: user !== null && user !== undefined, 
        userEmail: user?.email 
      });
      const userEmail = user?.email || 'unknown@unknown.com';

      // ✅ ИСПРАВЛЕНО: получаем tokenStandard через wallet связь
      let tokenStandard: string | undefined;
      if (order.depositAddress) {
        try {
          const walletInfo = await getWalletByAddress(order.depositAddress, userEmail);
          tokenStandard = walletInfo.tokenStandard;
        } catch (error) {
          logger.warn('Failed to get wallet info for tokenStandard', {
            orderId: order.publicId,
            depositAddress: order.depositAddress,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return {
        id: order.publicId, // ✅ ИЗМЕНЕНО: возвращаем publicId для frontend
        status: order.status,
        cryptoAmount: order.cryptoAmount,
        uahAmount: order.uahAmount,
        currency: order.currency,
        tokenStandard, // ✅ ИСПРАВЛЕНО: получаем из кошелька вместо заказа
        depositAddress: order.depositAddress,
        recipientData: order.recipientData,
        email: userEmail, // ✅ ПОЛУЧЕНО через связь userId → User
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        processedAt: order.processedAt,
        txHash: order.txHash,
        // ✅ ДОБАВЛЕНО: поля банка и курса для отображения в UI
        bankId: order.bankId,
        bankName: order.bankName,
        fixedExchangeRate: order.fixedExchangeRate,
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

  // Получить поддерживаемые криптовалюты из базы данных с fallback
  getSupportedCurrencies: publicProcedure.query(async () => {
    try {
      // ✅ MIGRATION: Получаем валюты из базы данных через WalletRepository
      const { PostgresWalletAdapter, getPrismaClient } = await import('@repo/session-management');
      const { SESSION_CONSTANTS } = await import('@repo/constants');
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error(DATABASE_URL_REQUIRED_ERROR);
      }
      
      const prisma = getPrismaClient({
        url: databaseUrl,
        maxConnections: SESSION_CONSTANTS.DATABASE.MAX_CONNECTIONS,
      });
      const walletRepository = new PostgresWalletAdapter(prisma);
      
      // Получаем уникальные валюты из базы данных
      const dbCurrencies = await walletRepository.findDistinctCurrencies();
      
      // Если в БД есть валюты, используем их
      if (dbCurrencies.length > 0) {
        return await Promise.all(
          dbCurrencies.map(async currency => {
            const rate = await getExchangeRateAsync(currency);
            const limits = getCurrencyLimits(currency);

            return {
              symbol: currency,
              name: CURRENCY_NAMES[currency as keyof typeof CURRENCY_NAMES],
              rate: rate.uahRate,
              commission: rate.commission,
              limits,
              isActive: true,
            };
          })
        );
      }
      
      // ✅ FALLBACK: Если база данных пуста, используем константы
      return await Promise.all(
        CRYPTOCURRENCIES.map(async currency => {
          const rate = await getExchangeRateAsync(currency);
          const limits = getCurrencyLimits(currency);

          return {
            symbol: currency,
            name: CURRENCY_NAMES[currency as keyof typeof CURRENCY_NAMES],
            rate: rate.uahRate,
            commission: rate.commission,
            limits,
            isActive: true,
          };
        })
      );
    } catch (error) {
      // ✅ ERROR FALLBACK: При ошибке БД используем константы
      console.warn('Database query failed, falling back to constants:', error);
      return Promise.all(
        CRYPTOCURRENCIES.map(async currency => {
          const rate = await getExchangeRateAsync(currency);
          const limits = getCurrencyLimits(currency);

          return {
            symbol: currency,
            name: CURRENCY_NAMES[currency as keyof typeof CURRENCY_NAMES],
            rate: rate.uahRate,
            commission: rate.commission,
            limits,
            isActive: true,
          };
        })
      );
    }
  }),

  // ✅ ДОБАВЛЕНО: Получить поддерживаемые стандарты токенов из базы данных с fallback
  getSupportedTokenStandards: publicProcedure.query(async () => {
    try {
      // ✅ MIGRATION: Получаем стандарты токенов из базы данных через WalletRepository
      const { PostgresWalletAdapter, getPrismaClient } = await import('@repo/session-management');
      const { SESSION_CONSTANTS } = await import('@repo/constants');
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error(DATABASE_URL_REQUIRED_ERROR);
      }
      
      const prisma = getPrismaClient({
        url: databaseUrl,
        maxConnections: SESSION_CONSTANTS.DATABASE.MAX_CONNECTIONS,
      });
      const walletRepository = new PostgresWalletAdapter(prisma);
      
      // Получаем уникальные стандарты токенов из базы данных
      // ✅ РЕЗУЛЬТАТ: Возвращаем массив стандартов
      return await walletRepository.findDistinctTokenStandards();
    } catch (error) {
      // ✅ ERROR FALLBACK: При ошибке БД возвращаем пустой массив (компонент использует fallback константы)
      console.warn('Database query failed in getSupportedTokenStandards, falling back to empty array:', error);
      return [];
    }
  }),
});
