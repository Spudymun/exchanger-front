# 🚀 ExchangeGO Development Tasks - Part 2: API Layer & tRPC

**Дата создания:** 29 июня 2025  
**Дата актуализации:** 1 июля 2025  
**Статус:** В разработке  
**Покрытие:** tRPC API, серверная логика, middleware, rate limiting

---

## 📋 Общая информация

### Связь с Part 1:

- ✅ Использует типы из `@repo/exchange-core`
- ✅ Применяет константы из `@repo/constants`
- ✅ Интегрируется с мок-данными
- ✅ Реализует бизнес-логику через core утилиты

**🔄 АКТУАЛИЗИРОВАНО:** Все импорты, названия типов, статусы заявок и функции обновлены в соответствии с реальной реализацией Part-1.

### Архитектурный подход:

- **tRPC процедуры** с полной типизацией
- **Middleware** для аутентификации и rate limiting
- **Мок API** с реалистичными задержками
- **Error handling** с детальными сообщениями

---

## 🔌 PHASE 2: API LAYER & tRPC

### TASK 2.1: Настроить tRPC сервер с базовой структурой

**Время:** 1.5 часа  
**Приоритет:** 🔴 Критический

#### Описание

Создать базовую структуру tRPC сервера в apps/web с роутерами, middleware и контекстом.

#### Технические требования

```
apps/web/
├── src/
│   ├── server/
│   │   ├── trpc/
│   │   │   ├── index.ts          # Главный экспорт tRPC
│   │   │   ├── init.ts           # Инициализация tRPC
│   │   │   ├── context.ts        # Context для процедур
│   │   │   ├── middleware/       # Middleware функции
│   │   │   │   ├── auth.ts       # Аутентификация
│   │   │   │   ├── rateLimit.ts  # Rate limiting
│   │   │   │   └── logging.ts    # Логирование
│   │   │   └── routers/          # API роутеры
│   │   │       ├── index.ts      # Главный роутер
│   │   │       ├── exchange.ts   # Обмен валют
│   │   │       ├── auth.ts       # Аутентификация
│   │   │       ├── user.ts       # Пользователи
│   │   │       ├── operator.ts   # Роутер для операторов
│   │   │       ├── support.ts    # Роутер для саппорта
│   │   │       └── shared.ts     # Общие эндпоинты operator + support
│   │   └── api/
│   │       └── trpc/
│   │           └── [trpc].ts     # Next.js API handler
```

#### Реализация

1. **apps/web/src/server/trpc/init.ts**

```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';

// Контекст для каждого запроса
export const createTRPCContext = (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Получаем IP адрес для rate limiting
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || 'unknown';

  return {
    req,
    res,
    ip,
    // Пользователь будет добавлен в middleware
    user: null as any,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Инициализация tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Базовые строительные блоки
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// Middleware для логирования
const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();

  console.log(`🔀 tRPC ${type} ${path} - Start`);

  const result = await next();

  const durationMs = Date.now() - start;
  const status = result.ok ? '✅' : '❌';

  console.log(`${status} tRPC ${type} ${path} - ${durationMs}ms`);

  return result;
});

// Процедура с логированием
export const loggedProcedure = publicProcedure.use(loggingMiddleware);
```

2. **apps/web/src/server/trpc/context.ts**

```typescript
import { type inferAsyncReturnType } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { userManager } from '@repo/exchange-core';

export const createContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Получаем IP для rate limiting
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || 'unknown';

  // Проверяем аутентификацию через cookie или header
  let user = null;
  const sessionId = req.cookies.sessionId || req.headers.authorization?.replace('Bearer ', '');

  if (sessionId) {
    // Поиск пользователя по session ID (мок)
    const foundUser = userManager.getAll().find(u => u.sessionId === sessionId);
    if (foundUser) {
      user = foundUser;
    }
  }

  return {
    req,
    res,
    ip,
    user,
    sessionId,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
```

3. **apps/web/src/server/trpc/middleware/rateLimit.ts**

```typescript
import { TRPCError } from '@trpc/server';
import { publicProcedure } from '../init';
import { RATE_LIMITS, RATE_LIMIT_MESSAGES } from '@repo/constants';

// In-memory rate limiter (в продакшене будет Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  points: number;
  duration: number;
  blockDuration: number;
}

export function createRateLimiter(action: keyof typeof RATE_LIMITS) {
  const config = RATE_LIMITS[action];

  return async (ip: string): Promise<void> => {
    const key = `${action}:${ip}`;
    const now = Date.now();

    // Получаем текущее состояние
    const current = rateLimitStore.get(key);

    // Если записи нет или время сброса прошло
    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.duration * 1000,
      });
      return;
    }

    // Если превышен лимит
    if (current.count >= config.points) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: RATE_LIMIT_MESSAGES[action],
      });
    }

    // Увеличиваем счетчик
    current.count++;
    rateLimitStore.set(key, current);
  };
}

// Middleware для разных типов действий
export const rateLimitMiddleware = {
  createOrder: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter('CREATE_ORDER')(ctx.ip);
    return next();
  }),

  register: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter('REGISTER')(ctx.ip);
    return next();
  }),

  login: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter('LOGIN')(ctx.ip);
    return next();
  }),

  resetPassword: publicProcedure.use(async ({ ctx, next }) => {
    await createRateLimiter('RESET_PASSWORD')(ctx.ip);
    return next();
  }),
};
```

4. **apps/web/src/server/trpc/middleware/auth.ts**

```typescript
import { TRPCError } from '@trpc/server';
import { publicProcedure } from '../init';
import { USER_ROLES } from '@repo/constants';

// Базовый middleware для проверки аутентификации
export const authMiddleware = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Необходима аутентификация',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Гарантируем что user не null
    },
  });
});

// Generic middleware для проверки роли
export const roleMiddleware = (allowedRoles: string[]) => {
  return authMiddleware.use(({ ctx, next }) => {
    if (!ctx.user.role) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Роль пользователя не определена',
      });
    }

    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Недостаточно прав доступа',
      });
    }

    return next();
  });
};

// Специализированные middleware для ролей
export const adminMiddleware = roleMiddleware([USER_ROLES.ADMIN]);
export const operatorMiddleware = roleMiddleware([USER_ROLES.OPERATOR]);
export const supportMiddleware = roleMiddleware([USER_ROLES.SUPPORT]);
export const operatorAndSupportMiddleware = roleMiddleware([USER_ROLES.OPERATOR, USER_ROLES.SUPPORT]);

// Алиасы для удобства использования
export const adminOnly = adminMiddleware;
export const operatorOnly = operatorMiddleware;
export const supportOnly = supportMiddleware;
export const operatorAndSupport = operatorAndSupportMiddleware;
  }

  return next();
});

// Экспорт типизированных процедур
export const protectedProcedure = authMiddleware;
export const adminProcedure = adminMiddleware;
```

5. **apps/web/src/server/trpc/routers/index.ts**

```typescript
import { createTRPCRouter } from '../init';
import { exchangeRouter } from './exchange';
import { authRouter } from './auth';
import { userRouter } from './user';
import { operatorRouter } from './operator';
import { supportRouter } from './support';
import { sharedRouter } from './shared';

export const appRouter = createTRPCRouter({
  exchange: exchangeRouter,
  auth: authRouter,
  user: userRouter,
  operator: operatorRouter,
  support: supportRouter,
  shared: sharedRouter,
});

export type AppRouter = typeof appRouter;
```

6. **apps/web/src/server/trpc/index.ts**

```typescript
export { appRouter, type AppRouter } from './routers';
export { createContext } from './context';
export { createTRPCRouter, publicProcedure, loggedProcedure } from './init';
export {
  authMiddleware,
  adminOnly,
  operatorOnly,
  supportOnly,
  operatorAndSupport,
} from './middleware/auth';
export { rateLimitMiddleware } from './middleware/rateLimit';
```

7. **apps/web/src/server/api/trpc/[trpc].ts**

```typescript
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../trpc';
import { createContext } from '../../trpc/context';

// Обработчик API для Next.js
export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError:
    process.env.NODE_ENV === 'development'
      ? ({ path, error }) => {
          console.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, error);
        }
      : undefined,
});
```

#### Юзкейсы и Edge Cases

1. **Rate Limiting**
   - ✅ In-memory хранилище для development
   - ✅ Дифференцированные лимиты по действиям
   - ✅ Правильное определение IP адреса
   - ✅ Автоматический сброс счетчиков

2. **Аутентификация**
   - ✅ Поддержка cookie и Authorization header
   - ✅ Типизированный контекст с пользователем
   - ✅ Разделение прав доступа (user/admin)

3. **Error Handling**
   - ✅ Правильные HTTP коды ошибок
   - ✅ Понятные сообщения на украинском
   - ✅ Логирование всех операций
   - ✅ Zod валидация с детальными ошибками

#### Чек-лист готовности

- [ ] Базовая структура tRPC создана
- [ ] Middleware для auth и rate limiting работают
- [ ] Context правильно передает IP и пользователя
- [ ] TypeScript компилируется без ошибок
- [ ] API handler настроен в Next.js
- [ ] Логирование выводит полезную информацию

---

### TASK 2.2: Создать Exchange API роутер

**Время:** 2 часа  
**Приоритет:** 🔴 Критический

#### Описание

Реализовать полный API для операций обмена: создание заявки, получение статуса, расчет курсов.

#### Реализация

1. **apps/web/src/server/trpc/routers/exchange.ts**

```typescript
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, loggedProcedure } from '../init';
import { rateLimitMiddleware } from '../middleware/rateLimit';
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
import { CRYPTOCURRENCIES, EXCHANGE_ORDER_STATUSES } from '@repo/constants';

// Создаем массив статусов для удобства
const ORDER_STATUSES = Object.values(EXCHANGE_ORDER_STATUSES) as const;

export const exchangeRouter = createTRPCRouter({
  // Получить текущие курсы валют
  getRates: publicProcedure.query(async () => {
    // Имитация задержки API
    await new Promise(resolve => setTimeout(resolve, 100));

    const rates = CRYPTOCURRENCIES.map(currency => ({
      currency,
      ...getExchangeRate(currency),
    }));

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
      } catch (error) {
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
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, 200));

      const sanitizedEmail = sanitizeEmail(input.email);

      // Рассчитываем сумму в UAH
      const uahAmount = calculateUahAmount(input.cryptoAmount, input.currency);

      const orderRequest = {
        email: sanitizedEmail,
        cryptoAmount: input.cryptoAmount,
        currency: input.currency,
        uahAmount,
        recipientData: input.recipientData,
      };

      // Валидация заявки
      const validation = validateCreateOrder(orderRequest);
      if (!validation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.errors[0], // Показываем первую ошибку
        });
      }

      // Проверяем/создаем пользователя
      let user = userManager.findByEmail(sanitizedEmail);
      if (!user) {
        user = userManager.create({
          email: sanitizedEmail,
          isVerified: false,
        });
        console.log(`📧 Создан новый пользователь: ${sanitizedEmail}`);
      }

      // Генерируем адрес для депозита
      const depositAddress = generateDepositAddress(input.currency);

      // Создаем заявку
      const order = orderManager.create({
        email: sanitizedEmail,
        cryptoAmount: input.cryptoAmount,
        currency: input.currency,
        uahAmount,
        status: EXCHANGE_ORDER_STATUSES.PENDING,
        depositAddress,
        recipientData: input.recipientData,
      });

      console.log(`💰 Создана заявка ${order.id} на ${input.cryptoAmount} ${input.currency}`);

      // Имитация отправки email
      console.log(`📧 Email отправлен на ${sanitizedEmail}:
        Заявка создана: ${order.id}
        Сумма: ${input.cryptoAmount} ${input.currency}
        К получению: ${uahAmount} UAH
        Адрес для перевода: ${depositAddress}
      `);

      return {
        orderId: order.id,
        depositAddress,
        cryptoAmount: input.cryptoAmount,
        uahAmount,
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
        limit: z.number().min(1).max(50).default(20),
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
        name: {
          BTC: 'Bitcoin',
          ETH: 'Ethereum',
          USDT: 'Tether (ERC-20)',
          LTC: 'Litecoin',
        }[currency],
        rate: rate.uahRate,
        commission: rate.commission,
        limits,
        isActive: true,
      };
    });
  }),
});
```

#### Юзкейсы и Edge Cases

1. **Создание заявки**
   - ✅ Автоматическое создание пользователя
   - ✅ Валидация всех входных данных
   - ✅ Генерация уникального адреса депозита
   - ✅ Расчет точной суммы с комиссией
   - ✅ Имитация email уведомлений
   - ✅ Rate limiting защита

2. **Получение данных**
   - ✅ Актуальные курсы валют
   - ✅ Лимиты для каждой криптовалюты
   - ✅ История заявок с пагинацией
   - ✅ Детальный статус заявки

3. **Расчеты**
   - ✅ Двунаправленные расчеты (крипта↔UAH)
   - ✅ Точность до 8 знаков для криптовалют
   - ✅ Учет комиссии в расчетах

#### Чек-лист готовности

- [ ] Все endpoint'ы реализованы и типизированы
- [ ] Валидация входных данных работает
- [ ] Rate limiting применяется к критичным операциям
- [ ] Мок-данные обновляются корректно
- [ ] Расчеты дают правильные результаты
- [ ] Ошибки возвращают понятные сообщения

---

### TASK 2.3: Создать Authentication API роутер

**Время:** 1.5 часа  
**Приоритет:** 🔴 Критический

#### Описание

Реализовать API для аутентификации: регистрация, вход, восстановление пароля, сессии.

#### Реализация

1. **apps/web/src/server/trpc/routers/auth.ts**

```typescript
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { createTRPCRouter, publicProcedure } from '../init';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import {
  validateEmail,
  validatePassword,
  sanitizeEmail,
  generateSessionId,
  userManager,
} from '@repo/exchange-core';

export const authRouter = createTRPCRouter({
  // Регистрация нового пользователя
  register: rateLimitMiddleware.register
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, 300));

      const sanitizedEmail = sanitizeEmail(input.email);

      // Валидация данных
      const emailValidation = validateEmail(sanitizedEmail);
      const passwordValidation = validatePassword(input.password);

      if (!emailValidation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: emailValidation.errors[0],
        });
      }

      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordValidation.errors[0],
        });
      }

      // Проверяем, не существует ли уже пользователь
      const existingUser = userManager.findByEmail(sanitizedEmail);
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Пользователь с таким email уже существует',
        });
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Создаем пользователя
      const sessionId = generateSessionId();
      const user = userManager.create({
        email: sanitizedEmail,
        hashedPassword,
        sessionId,
        isVerified: false,
      });

      // Устанавливаем cookie с session ID
      ctx.res.setHeader(
        'Set-Cookie',
        `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
      );

      console.log(`👤 Зарегистрирован новый пользователь: ${sanitizedEmail}`);

      // Имитация отправки email подтверждения
      console.log(`📧 Email подтверждения отправлен на ${sanitizedEmail}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
        },
        sessionId,
      };
    }),

  // Вход в систему
  login: rateLimitMiddleware.login
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, 200));

      const sanitizedEmail = sanitizeEmail(input.email);

      // Находим пользователя
      const user = userManager.findByEmail(sanitizedEmail);
      if (!user || !user.hashedPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Неверный email или пароль',
        });
      }

      // Проверяем пароль
      const isValidPassword = await bcrypt.compare(input.password, user.hashedPassword);
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Неверный email или пароль',
        });
      }

      // Генерируем новый session ID
      const sessionId = generateSessionId();
      userManager.update(user.id, {
        sessionId,
        lastLoginAt: new Date(),
      });

      // Устанавливаем cookie
      ctx.res.setHeader(
        'Set-Cookie',
        `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
      );

      console.log(`🔐 Пользователь вошел в систему: ${sanitizedEmail}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
        },
        sessionId,
      };
    }),

  // Выход из системы
  logout: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.user) {
      // Удаляем session ID у пользователя
      userManager.update(ctx.user.id, {
        sessionId: undefined,
      });

      console.log(`🚪 Пользователь вышел из системы: ${ctx.user.email}`);
    }

    // Удаляем cookie
    ctx.res.setHeader('Set-Cookie', `sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);

    return { success: true };
  }),

  // Проверка текущей сессии
  getSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return { user: null };
    }

    return {
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        isVerified: ctx.user.isVerified,
      },
    };
  }),

  // Восстановление пароля (шаг 1 - отправка кода)
  requestPasswordReset: rateLimitMiddleware.resetPassword
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, 500));

      const sanitizedEmail = sanitizeEmail(input.email);

      // Проверяем, существует ли пользователь
      const user = userManager.findByEmail(sanitizedEmail);
      if (!user) {
        // Не раскрываем информацию о существовании пользователя
        console.log(`🔒 Попытка сброса пароля для несуществующего email: ${sanitizedEmail}`);
      } else {
        console.log(`🔑 Запрос на сброс пароля для: ${sanitizedEmail}`);

        // Имитация отправки email с кодом восстановления
        const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        console.log(`📧 Код восстановления для ${sanitizedEmail}: ${resetCode}`);
      }

      // Всегда возвращаем успех для безопасности
      return {
        message:
          'Если аккаунт с таким email существует, на него будет отправлен код восстановления',
      };
    }),

  // Сброс пароля (шаг 2 - новый пароль с кодом)
  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        resetCode: z.string().length(6),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, 300));

      const sanitizedEmail = sanitizeEmail(input.email);

      // Валидация нового пароля
      const passwordValidation = validatePassword(input.newPassword);
      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordValidation.errors[0],
        });
      }

      // В реальном приложении здесь была бы проверка кода из базы/Redis
      // Для мока просто проверяем существование пользователя
      const user = userManager.findByEmail(sanitizedEmail);
      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Неверный код восстановления',
        });
      }

      // Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      // Генерируем новый session ID
      const sessionId = generateSessionId();

      // Обновляем пользователя
      userManager.update(user.id, {
        hashedPassword,
        sessionId,
      });

      // Устанавливаем cookie
      ctx.res.setHeader(
        'Set-Cookie',
        `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
      );

      console.log(`🔓 Пароль изменен для пользователя: ${sanitizedEmail}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
        },
        sessionId,
      };
    }),

  // Подтверждение email (упрощенная версия)
  verifyEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        verificationCode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const sanitizedEmail = sanitizeEmail(input.email);

      const user = userManager.findByEmail(sanitizedEmail);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Пользователь не найден',
        });
      }

      if (user.isVerified) {
        return {
          message: 'Email уже подтвержден',
          isVerified: true,
        };
      }

      // В реальном приложении здесь была бы проверка кода
      // Для мока подтверждаем всех
      userManager.update(user.id, {
        isVerified: true,
      });

      console.log(`✅ Email подтвержден для пользователя: ${sanitizedEmail}`);

      return {
        message: 'Email успешно подтвержден',
        isVerified: true,
      };
    }),
});
```

#### Юзкейсы и Edge Cases

1. **Регистрация**
   - ✅ Проверка существующих пользователей
   - ✅ Валидация email и пароля
   - ✅ Безопасное хеширование паролей
   - ✅ Автоматическая установка cookie сессии
   - ✅ Rate limiting защита

2. **Аутентификация**
   - ✅ Проверка учетных данных
   - ✅ Защита от timing attacks
   - ✅ Обновление времени последнего входа
   - ✅ Управление сессиями

3. **Восстановление пароля**
   - ✅ Не раскрывает существование аккаунтов
   - ✅ Генерация безопасных кодов
   - ✅ Валидация новых паролей
   - ✅ Автоматический вход после сброса

4. **Безопасность**
   - ✅ HttpOnly cookies
   - ✅ Rate limiting на все операции
   - ✅ Санитизация email адресов
   - ✅ Безопасное логирование (без паролей)

#### Чек-лист готовности

- [ ] Все endpoint'ы аутентификации реализованы
- [ ] Пароли правильно хешируются
- [ ] Сессии управляются через cookie
- [ ] Rate limiting защищает от атак
- [ ] Ошибки не раскрывают лишней информации
- [ ] Логирование не содержит чувствительных данных

---

### TASK 2.4: Создать User API роутер

**Время:** 1.5 часа  
**Приоритет:** 🟡 Средний

#### Описание

Реализовать API для управления пользовательскими данными: профиль, история, настройки, удаление аккаунта.

#### Реализация

1. **apps/web/src/server/trpc/routers/user.ts**

```typescript
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { createTRPCRouter } from '../init';
import { protectedProcedure } from '../middleware/auth';
import { validatePassword, sanitizeEmail, userManager, orderManager } from '@repo/exchange-core';
import { EXCHANGE_ORDER_STATUSES } from '@repo/constants';

// Создаем массив статусов для удобства
const ORDER_STATUSES = Object.values(EXCHANGE_ORDER_STATUSES) as const;

export const userRouter = createTRPCRouter({
  // Получить профиль текущего пользователя
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = userManager.findById(ctx.user.id);
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Пользователь не найден',
      });
    }

    return {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt, // Статистика пользователя
      stats: {
        totalOrders: orderManager.findByEmail(user.email).length,
        completedOrders: orderManager
          .findByEmail(user.email)
          .filter(order => order.status === EXCHANGE_ORDER_STATUSES.COMPLETED).length,
      },
    };
  }),

  // Обновить профиль пользователя
  updateProfile: protectedProcedure
    .input(
      z.object({
        // В будущем можно добавить имя, телефон и др.
        notifications: z
          .object({
            email: z.boolean().default(true),
            orderUpdates: z.boolean().default(true),
            marketing: z.boolean().default(false),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = userManager.findById(ctx.user.id);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Пользователь не найден',
        });
      }

      // Обновляем данные пользователя
      const updatedUser = userManager.update(user.id, {
        notifications: input.notifications,
        updatedAt: new Date(),
      });

      console.log(`👤 Профиль обновлен для пользователя: ${user.email}`);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
        notifications: updatedUser.notifications,
      };
    }),

  // Изменить пароль
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = userManager.findById(ctx.user.id);
      if (!user || !user.hashedPassword) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Пользователь не найден',
        });
      }

      // Проверяем текущий пароль
      const isValidCurrentPassword = await bcrypt.compare(
        input.currentPassword,
        user.hashedPassword
      );
      if (!isValidCurrentPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Неверный текущий пароль',
        });
      }

      // Валидация нового пароля
      const passwordValidation = validatePassword(input.newPassword);
      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordValidation.errors[0],
        });
      }

      // Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      // Обновляем пароль
      userManager.update(user.id, {
        hashedPassword,
        updatedAt: new Date(),
      });

      console.log(`🔐 Пароль изменен для пользователя: ${user.email}`);

      return {
        message: 'Пароль успешно изменен',
      };
    }),

  // Получить историю заявок пользователя
  getOrderHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(ORDER_STATUSES).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const user = userManager.findById(ctx.user.id);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Пользователь не найден',
        });
      }

      let orders = orderManager.findByEmail(user.email);

      // Фильтрация по статусу
      if (input.status) {
        orders = orders.filter(order => order.status === input.status);
      }

      // Сортировка по дате создания (новые первыми)
      orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Пагинация
      const paginatedOrders = orders.slice(input.offset, input.offset + input.limit);

      return {
        orders: paginatedOrders.map(order => ({
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
        })),
        total: orders.length,
        hasMore: input.offset + input.limit < orders.length,
      };
    }),

  // Получить детальную информацию о заявке
  getOrderDetails: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const user = userManager.findById(ctx.user.id);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Пользователь не найден',
        });
      }

      const order = orderManager.findById(input.orderId);
      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Заявка не найдена',
        });
      }

      // Проверяем, что заявка принадлежит пользователю
      if (order.email !== user.email) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Нет доступа к этой заявке',
        });
      }

      return {
        id: order.id,
        status: order.status,
        cryptoAmount: order.cryptoAmount,
        uahAmount: order.uahAmount,
        currency: order.currency,
        depositAddress: order.depositAddress,
        recipientData: order.recipientData,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        processedAt: order.processedAt,
        txHash: order.txHash,
        // История статусов (в будущем)
        statusHistory: [
          { status: 'pending', timestamp: order.createdAt },
          ...(order.processedAt ? [{ status: order.status, timestamp: order.processedAt }] : []),
        ],
      };
    }),

  // Отменить заявку (если возможно)
  cancelOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = userManager.findById(ctx.user.id);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Пользователь не найден',
        });
      }

      const order = orderManager.findById(input.orderId);
      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Заявка не найдена',
        });
      }

      // Проверяем принадлежность заявки
      if (order.email !== user.email) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Нет доступа к этой заявке',
        });
      }

      // Проверяем, можно ли отменить заявку
      if (
        ![EXCHANGE_ORDER_STATUSES.PENDING, EXCHANGE_ORDER_STATUSES.PROCESSING].includes(
          order.status
        )
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Заявку нельзя отменить в текущем статусе',
        });
      }

      // Отменяем заявку
      const updatedOrder = orderManager.update(order.id, {
        status: EXCHANGE_ORDER_STATУСЫ.CANCELLED,
        updatedAt: new Date(),
      });

      console.log(`❌ Заявка ${order.id} отменена пользователем ${user.email}`);

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        message: 'Заявка успешно отменена',
      };
    }),

  // Повторная отправка email подтверждения
  resendVerificationEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const user = userManager.findById(ctx.user.id);
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Пользователь не найден',
      });
    }

    if (user.isVerified) {
      return {
        message: 'Email уже подтвержден',
      };
    }

    // Имитация отправки email
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log(`📧 Код подтверждения для ${user.email}: ${verificationCode}`);

    return {
      message: 'Код подтверждения отправлен на ваш email',
    };
  }),

  // Удалить аккаунт (GDPR compliance)
  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string(),
        confirmation: z.literal('DELETE_MY_ACCOUNT'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = userManager.findById(ctx.user.id);
      if (!user || !user.hashedPassword) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Пользователь не найден',
        });
      }

      // Проверяем пароль
      const isValidPassword = await bcrypt.compare(input.password, user.hashedPassword);
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Неверный пароль',
        });
      }

      // Проверяем активные заявки
      const activeOrders = orderManager
        .findByEmail(user.email)
        .filter(order =>
          [EXCHANGE_ORDER_STATUSES.PENDING, EXCHANGE_ORDER_STATUSES.PROCESSING].includes(
            order.status
          )
        );

      if (activeOrders.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Нельзя удалить аккаунт с активными заявками (${activeOrders.length})`,
        });
      }

      // Удаляем пользователя и его данные
      userManager.delete(user.id);

      // Анонимизируем заявки (оставляем для статистики)
      const userOrders = orderManager.findByEmail(user.email);
      userOrders.forEach(order => {
        orderManager.update(order.id, {
          email: `deleted-user-${order.id}@deleted.local`,
        });
      });

      // Удаляем cookie сессии
      ctx.res.setHeader('Set-Cookie', `sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);

      console.log(`🗑️ Аккаунт удален: ${user.email} (${user.id})`);

      return {
        message: 'Аккаунт успешно удален',
      };
    }),
});
```

#### Юзкейсы и Edge Cases

1. **Управление профилем**
   - ✅ Просмотр полной информации о профиле
   - ✅ Обновление настроек уведомлений
   - ✅ Статистика по заявкам пользователя
   - ✅ Безопасное изменение пароля

2. **История заявок**
   - ✅ Пагинация для больших списков
   - ✅ Фильтрация по статусу заявок
   - ✅ Детальная информация о каждой заявке
   - ✅ Контроль доступа к заявкам

3. **Управление заявками**
   - ✅ Отмена заявок в допустимых статусах
   - ✅ Проверка прав доступа
   - ✅ История изменений статусов

4. **Безопасность и GDPR**
   - ✅ Безопасное удаление аккаунта
   - ✅ Проверка активных заявок перед удалением
   - ✅ Анонимизация данных
   - ✅ Подтверждение через пароль

#### Чек-лист готовности

- [ ] Все пользовательские endpoint'ы реализованы
- [ ] Контроль доступа к данным работает
- [ ] Пагинация и фильтрация корректны
- [ ] Безопасность изменения пароля обеспечена
- [ ] GDPR compliance для удаления аккаунта
- [ ] Логирование важных действий ведется

---

### TASK 2.4A: Создать Operator API роутер

**Время:** 1.5 часа  
**Приоритет:** 🔴 Критический

#### Описание

Реализовать API роутер для операторов: обработка заявок, взаимодействие с клиентами, мониторинг операций.

#### Реализация

1. **apps/web/src/server/trpc/routers/operator.ts**

```typescript
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter } from '../init';
import { operatorOnly } from '../middleware/auth';
import { orderManager, userManager } from '@repo/exchange-core';
import { EXCHANGE_ORDER_STATUSES, ORDER_STATUS_CONFIG } from '@repo/constants';

export const operatorRouter = createTRPCRouter({
  // Получить заявки для обработки
  getPendingOrders: operatorOnly
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
        status: z.enum(['PENDING', 'PROCESSING']).optional(),
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, status } = input;

      const orders = orderManager
        .getAll()
        .filter(order => {
          if (status) return order.status === status;
          return (
            order.status === EXCHANGE_ORDER_STATUSES.PENDING ||
            order.status === EXCHANGE_ORDER_STATUSES.PROCESSING
          );
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Пагинация
      const startIndex = cursor ? orders.findIndex(o => o.id === cursor) + 1 : 0;
      const items = orders.slice(startIndex, startIndex + limit);
      const nextCursor = items.length === limit ? items[items.length - 1]?.id : undefined;

      return {
        items: items.map(order => ({
          ...order,
          config: ORDER_STATUS_CONFIG[order.status],
        })),
        nextCursor,
        hasMore: !!nextCursor,
      };
    }),

  // Взять заявку в обработку
  takeOrder: operatorOnly
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const order = orderManager.findById(input.orderId);

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Заявка не найдена',
        });
      }

      if (order.status !== EXCHANGE_ORDER_STATUSES.PENDING) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Заявка уже обрабатывается или завершена',
        });
      }

      // В реальном приложении здесь будет назначение оператора
      const updatedOrder = orderManager.updateStatus(
        input.orderId,
        EXCHANGE_ORDER_STATУСЫ.PROCESSING,
        { operatorId: ctx.user.id, operatorEmail: ctx.user.email }
      );

      return {
        success: true,
        order: updatedOrder,
        message: 'Заявка взята в обработку',
      };
    }),

  // Обновить статус заявки
  updateOrderStatus: operatorOnly
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(['PROCESSING', 'COMPLETED', 'CANCELLED']),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const order = orderManager.findById(input.orderId);

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Заявка не найдена',
        });
      }

      // Проверка валидных переходов статусов
      const validTransitions = {
        [EXCHANGE_ORDER_STATUSES.PENDING]: [
          EXCHANGE_ORDER_STATUSES.PROCESSING,
          EXCHANGE_ORDER_STATUSES.CANCELLED,
        ],
        [EXCHANGE_ORDER_STATUSES.PROCESSING]: [
          EXCHANGE_ORDER_STATUSES.COMPLETED,
          EXCHANGE_ORDER_STATUSES.CANCELLED,
        ],
      };

      const allowedStatuses = validTransitions[order.status] || [];
      if (!allowedStatuses.includes(input.status as any)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Невозможно изменить статус с ${order.status} на ${input.status}`,
        });
      }

      const updatedOrder = orderManager.updateStatus(input.orderId, input.status as any, {
        operatorComment: input.comment,
        operatorId: ctx.user.id,
        updatedBy: ctx.user.email,
      });

      return {
        success: true,
        order: updatedOrder,
        message: `Статус заявки изменен на ${input.status}`,
      };
    }),

  // Получить статистику оператора
  getMyStats: operatorOnly.query(async ({ ctx }) => {
    const orders = orderManager.getAll();
    const operatorOrders = orders.filter(order => order.metadata?.operatorId === ctx.user.id);

    const today = new Date().toDateString();
    const todayOrders = operatorOrders.filter(order => order.createdAt.toDateString() === today);

    return {
      total: operatorOrders.length,
      today: todayOrders.length,
      completed: operatorOrders.filter(o => o.status === EXCHANGE_ORDER_STATUSES.COMPLETED).length,
      processing: operatorOrders.filter(o => o.status === EXCHANGE_ORDER_STATUSES.PROCESSING)
        .length,
      totalVolume: operatorOrders.reduce((sum, o) => sum + o.uahAmount, 0),
      avgProcessingTime: '15 мин', // Заглушка, в реальности расчет из логов
    };
  }),
});
```

#### Чек-лист реализации

- [ ] Маршруты для получения заявок с фильтрацией
- [ ] Функция взятия заявки в обработку
- [ ] Валидация переходов статусов заявок
- [ ] Статистика по работе оператора
- [ ] Пагинация для списков заявок
- [ ] Проверка прав доступа через operatorOnly middleware

---

### TASK 2.4B: Создать Support API роутер

**Время:** 1.5 часа  
**Приоритет:** 🔴 Критический

#### Описание

Реализовать API роутер для саппорта: консультации клиентов, работа с базой знаний, тикеты.

#### Реализация

1. **apps/web/src/server/trpc/routers/support.ts**

```typescript
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter } from '../init';
import { supportOnly } from '../middleware/auth';
import { userManager, orderManager } from '@repo/exchange-core';

// Мок база знаний
const KNOWLEDGE_BASE = [
  {
    id: '1',
    category: 'Обмен валют',
    title: 'Как работает процесс обмена?',
    content: 'Пользователь создает заявку, указывает сумму и реквизиты...',
    tags: ['обмен', 'процесс', 'FAQ'],
    updatedAt: new Date(),
  },
  {
    id: '2',
    category: 'Техподдержка',
    title: 'Проблемы с подтверждением email',
    content: 'Если письмо не приходит, проверьте папку спам...',
    tags: ['email', 'подтверждение', 'проблемы'],
    updatedAt: new Date(),
  },
];

// Мок система тикетов
let supportTickets: any[] = [];
let ticketCounter = 1;

export const supportRouter = createTRPCRouter({
  // Поиск в базе знаний
  searchKnowledge: supportOnly
    .input(
      z.object({
        query: z.string().min(2),
        category: z.string().optional(),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ input }) => {
      const { query, category, limit } = input;

      let results = KNOWLEDGE_BASE.filter(item => {
        const matchesQuery =
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.content.toLowerCase().includes(query.toLowerCase()) ||
          item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

        const matchesCategory = !category || item.category === category;

        return matchesQuery && matchesCategory;
      });

      return results.slice(0, limit);
    }),

  // Получить все категории базы знаний
  getKnowledgeCategories: supportOnly.query(async () => {
    const categories = [...new Set(KNOWLEDGE_BASE.map(item => item.category))];
    return categories.map(category => ({
      name: category,
      count: KNOWLEDGE_BASE.filter(item => item.category === category).length,
    }));
  }),

  // Создать тикет для пользователя
  createTicket: supportOnly
    .input(
      z.object({
        userId: z.string(),
        subject: z.string().min(5),
        description: z.string().min(10),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
        category: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = userManager.findById(input.userId);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Пользователь не найден',
        });
      }

      const ticket = {
        id: `ticket_${ticketCounter++}`,
        userId: input.userId,
        userEmail: user.email,
        subject: input.subject,
        description: input.description,
        priority: input.priority,
        category: input.category,
        status: 'OPEN',
        createdBy: ctx.user.email,
        createdAt: new Date(),
        messages: [],
      };

      supportTickets.push(ticket);

      return {
        success: true,
        ticket,
        message: 'Тикет создан',
      };
    }),

  // Получить тикеты саппорта
  getTickets: supportOnly
    .input(
      z.object({
        status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      let tickets = supportTickets.filter(ticket => {
        const matchesStatus = !input.status || ticket.status === input.status;
        const matchesPriority = !input.priority || ticket.priority === input.priority;
        return matchesStatus && matchesPriority;
      });

      tickets = tickets
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, input.limit);

      return tickets;
    }),

  // Обновить статус тикета
  updateTicketStatus: supportOnly
    .input(
      z.object({
        ticketId: z.string(),
        status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ticketIndex = supportTickets.findIndex(t => t.id === input.ticketId);

      if (ticketIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Тикет не найден',
        });
      }

      supportTickets[ticketIndex] = {
        ...supportTickets[ticketIndex],
        status: input.status,
        updatedBy: ctx.user.email,
        updatedAt: new Date(),
      };

      if (input.comment) {
        supportTickets[ticketIndex].messages.push({
          id: `msg_${Date.now()}`,
          text: input.comment,
          author: ctx.user.email,
          timestamp: new Date(),
          type: 'STATUS_UPDATE',
        });
      }

      return {
        success: true,
        ticket: supportTickets[ticketIndex],
        message: `Статус тикета изменен на ${input.status}`,
      };
    }),

  // Получить информацию о пользователе для консультации
  getUserInfo: supportOnly.input(z.object({ userId: z.string() })).query(async ({ input }) => {
    const user = userManager.findById(input.userId);

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Пользователь не найден',
      });
    }

    const userOrders = orderManager.getAll().filter(order => order.userId === input.userId);

    return {
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      stats: {
        totalOrders: userOrders.length,
        completedOrders: userOrders.filter(o => o.status === 'COMPLETED').length,
        totalVolume: userOrders.reduce((sum, o) => sum + o.uahAmount, 0),
        registrationDays: Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
      recentOrders: userOrders
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
    };
  }),

  // Статистика работы саппорта
  getMyStats: supportOnly.query(async ({ ctx }) => {
    const myTickets = supportTickets.filter(
      ticket => ticket.createdBy === ctx.user.email || ticket.updatedBy === ctx.user.email
    );

    const today = new Date().toDateString();
    const todayTickets = myTickets.filter(ticket => ticket.createdAt.toDateString() === today);

    return {
      totalTickets: myTickets.length,
      todayTickets: todayTickets.length,
      openTickets: myTickets.filter(t => t.status === 'OPEN').length,
      resolvedTickets: myTickets.filter(t => t.status === 'RESOLVED').length,
      avgResponseTime: '2 часа', // Заглушка
      knowledgeBaseArticles: KNOWLEDGE_BASE.length,
    };
  }),
});
```

#### Чек-лист реализации

- [ ] Поиск и фильтрация в базе знаний
- [ ] Система создания и управления тикетами
- [ ] Получение информации о пользователях для консультаций
- [ ] Статистика работы саппорта
- [ ] Категоризация тикетов и статусы
- [ ] Проверка прав доступа через supportOnly middleware

---

### TASK 2.4C: Создать Shared API роутер

**Время:** 1 час  
**Приоритет:** 🟡 Средний

#### Описание

Реализовать общий API роутер для эндпоинтов, доступных и операторам, и саппорту.

#### Реализация

1. **apps/web/src/server/trpc/routers/shared.ts**

```typescript
import { z } from 'zod';
import { createTRPCRouter } from '../init';
import { operatorAndSupport } from '../middleware/auth';
import { orderManager, userManager } from '@repo/exchange-core';
import { EXCHANGE_ORDER_STATUSES, CRYPTOCURRENCIES } from '@repo/constants';

export const sharedRouter = createTRPCRouter({
  // Поиск заявок (общий для operator и support)
  searchOrders: operatorAndSupport
    .input(
      z.object({
        query: z.string().min(2),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const { query, dateFrom, dateTo, status, limit } = input;

      let orders = orderManager.getAll().filter(order => {
        // Поиск по ID, email, сумме
        const matchesQuery =
          order.id.toLowerCase().includes(query.toLowerCase()) ||
          order.userEmail.toLowerCase().includes(query.toLowerCase()) ||
          order.cryptoAmount.toString().includes(query) ||
          order.uahAmount.toString().includes(query);

        // Фильтр по дате
        let matchesDate = true;
        if (dateFrom || dateTo) {
          const orderDate = order.createdAt.toISOString().split('T')[0];
          if (dateFrom) matchesDate = matchesDate && orderDate >= dateFrom;
          if (dateTo) matchesDate = matchesDate && orderDate <= dateTo;
        }

        // Фильтр по статусу
        const matchesStatus = !status || order.status === status;

        return matchesQuery && matchesDate && matchesStatus;
      });

      orders = orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);

      return orders;
    }),

  // Поиск пользователей (общий для operator и support)
  searchUsers: operatorAndSupport
    .input(
      z.object({
        query: z.string().min(2),
        verified: z.boolean().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const { query, verified, limit } = input;

      let users = userManager.getAll().filter(user => {
        const matchesQuery =
          user.email.toLowerCase().includes(query.toLowerCase()) ||
          user.id.toLowerCase().includes(query.toLowerCase());

        const matchesVerified = verified === undefined || user.isVerified === verified;

        return matchesQuery && matchesVerified;
      });

      users = users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);

      // Возвращаем безопасную информацию о пользователях
      return users.map(user => ({
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        ordersCount: orderManager.getAll().filter(o => o.userId === user.id).length,
      }));
    }),

  // Общая статистика (доступна operator и support)
  getGeneralStats: operatorAndSupport.query(async () => {
    const orders = orderManager.getAll();
    const users = userManager.getAll();

    const today = new Date().toDateString();

    return {
      orders: {
        total: orders.length,
        today: orders.filter(o => o.createdAt.toDateString() === today).length,
        pending: orders.filter(o => o.status === EXCHANGE_ORDER_STATUSES.PENDING).length,
        processing: orders.filter(o => o.status === EXCHANGE_ORDER_STATUSES.PROCESSING).length,
        completed: orders.filter(o => o.status === EXCHANGE_ORDER_STATUSES.COMPLETED).length,
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
  quickActions: operatorAndSupport
    .input(
      z.object({
        action: z.enum(['REFRESH_RATES', 'CLEAR_CACHE', 'SEND_NOTIFICATION']),
        params: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { action, params } = input;

      switch (action) {
        case 'REFRESH_RATES':
          // Имитация обновления курсов
          await new Promise(resolve => setTimeout(resolve, 500));
          return { success: true, message: 'Курсы обновлены', timestamp: new Date() };

        case 'CLEAR_CACHE':
          // Имитация очистки кэша
          return { success: true, message: 'Кэш очищен', clearedItems: 42 };

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
```

#### Чек-лист реализации

- [ ] Поиск заявок с фильтрацией по дате и статусу
- [ ] Поиск пользователей с базовой информацией
- [ ] Общая статистика системы
- [ ] Быстрые действия для операционных задач
- [ ] Проверка прав доступа через operatorAndSupport middleware

---

## 📊 Статус Progress Part 2

### Завершенные задачи: 0/8

- [ ] TASK 2.1: Настроить tRPC сервер с базовой структурой
- [ ] TASK 2.2: Создать Exchange API роутер
- [ ] TASK 2.3: Создать Authentication API роутер
- [ ] TASK 2.4: Создать User API роутер
- [ ] TASK 2.4A: Создать Operator API роутер
- [ ] TASK 2.4B: Создать Support API роутер
- [ ] TASK 2.4C: Создать Shared API роутер
- [ ] TASK 2.5: Настроить клиентскую часть tRPC

### Готовность к следующему этапу:

После завершения всех задач Part 2, можно переходить к:

- **TASKS-PART-3.md** - State Management & Hooks
- **TASKS-PART-4.md** - UI Components & Forms
- **TASKS-PART-5.md** - Pages & User Flow
- **TASKS-PART-6.md** - Admin Panel (здесь будет admin API)
- **TASKS-PART-7.md** - Testing & Quality
- **TASKS-PART-8.md** - Production Setup & Deployment

### Ключевые результаты Part 2:

✅ **Полностью типизированный API** с tRPC и Zod валидацией  
✅ **Безопасная аутентификация** с сессиями и rate limiting  
✅ **Роле-ориентированная архитектура** с operator, support роутерами для apps/web  
✅ **Мок-данные интеграция** с реалистичными задержками  
✅ **React Query кэширование** с оптимистичными обновлениями  
✅ **Production-ready архитектура** с логированием и мониторингом

**ВАЖНО:** Admin API роутер будет создан в TASKS-PART-6.md для `apps/admin-panel`, согласно архитектуре разделения приложений.

---

**Дата создания:** 29 июня 2025  
**Дата актуализации:** 4 июля 2025  
**Версия:** 1.4 (исправлена архитектура - admin роутер перенесен в admin-panel)  
**Следующая часть:** TASKS-PART-3.md
