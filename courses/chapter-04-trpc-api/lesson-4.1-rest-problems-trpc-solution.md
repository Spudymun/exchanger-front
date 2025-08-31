# Урок 4.1: Проблемы REST API и решение через tRPC

> **🎯 Цель урока**: Понять ограничения традиционного REST API подхода и как tRPC решает эти проблемы в modern full-stack приложениях

## 📖 Введение

Представьте что вы заказываете еду в ресторане по телефону. **REST API** - это как разговор на разных языках: вы говорите "хочу пиццу", а повар не понимает что такое "пицца". **tRPC** - это как общий язык, где и клиент и сервер точно понимают друг друга.

В этом уроке мы разберем почему в нашем проекте обменника выбран tRPC вместо традиционного REST API.

## 🤔 Проблемы традиционного REST API

### Проблема 1: Отсутствие типизации

#### Традиционный подход (REST):

```typescript
// 📁 Клиент (Frontend)
interface CreateOrderRequest {
  email: string;
  amount: number;
  currency: string;
}

// Отправляем запрос в никуда - TypeScript не знает что происходит на сервере
async function createOrder(data: CreateOrderRequest) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  // ❌ ПРОБЛЕМА: Мы не знаем что вернет сервер!
  const result = await response.json(); // result: any
  return result; // Любой тип данных!
}
```

```typescript
// 📁 Сервер (Backend) - отдельно, TypeScript не видит связи
app.post('/api/orders', (req, res) => {
  const { email, amount, currency } = req.body;

  // ❌ ПРОБЛЕМА: А если клиент передал неправильные типы?
  // ❌ ПРОБЛЕМА: А если мы изменили API, но забыли обновить клиент?

  res.json({ id: '123', status: 'pending' });
});
```

#### ❌ Проблемы этого подхода:

1. **Нет типизации между клиентом и сервером**
2. **Ошибки обнаруживаются только в runtime**
3. **Нет автокомплита в IDE**
4. **Сложно поддерживать синхронность API**
5. **Много boilerplate кода**

### Проблема 2: Ручная валидация

```typescript
// REST: Валидация на сервере вручную
app.post('/api/orders', (req, res) => {
  const { email, amount, currency } = req.body;

  // ❌ Ручная валидация каждого поля
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid email' });
  }

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  if (!currency || !['BTC', 'ETH', 'USDT'].includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }

  // Много кода для простой валидации!
});
```

### Проблема 3: Ошибки интеграции

```typescript
// Клиент ожидает одно
interface OrderResponse {
  id: string;
  status: 'pending' | 'completed';
}

// Сервер возвращает другое (и мы узнаем об этом только в runtime!)
res.json({
  orderId: '123', // ❌ orderId вместо id
  orderStatus: 'PENDING', // ❌ PENDING вместо pending
});
```

## ✅ Решение: tRPC

### Архитектура tRPC в нашем проекте

```
📱 Client (React)     🔗 tRPC Link     🖥️ Server (Next.js API)
┌─────────────────┐   ┌─────────────┐   ┌─────────────────────┐
│ const result =  │◄──┤ Type-safe   ├──►│ export const router │
│ api.orders.     │   │ HTTP calls  │   │ = t.router({        │
│ create.mutate() │   │             │   │   create: t.proc... │
│                 │   └─────────────┘   │ });                 │
└─────────────────┘                     └─────────────────────┘
      ↑                                          ↑
      └──────── Общие типы TypeScript ─────────┘
```

### Пример tRPC в нашем проекте

#### 1. Сервер (типобезопасные процедуры):

```typescript
// 📁 apps/web/src/server/trpc/routers/exchange.ts
import { z } from 'zod';
import { CRYPTOCURRENCIES } from '@repo/constants';
import { securityEnhancedCreateExchangeOrderSchema } from '@repo/utils';

export const exchangeRouter = createTRPCRouter({
  // ✅ Типобезопасная процедура с автоматической валидацией
  createOrder: publicProcedure
    .input(securityEnhancedCreateExchangeOrderSchema) // 🛡️ Автоматическая валидация
    .mutation(async ({ input, ctx }) => {
      // input уже валидирован и типизирован!
      const { email, cryptoAmount, currency } = input;

      // Бизнес-логика
      const order = await orderManager.create({
        email,
        cryptoAmount,
        currency,
        uahAmount: calculateUahAmount(cryptoAmount, currency),
      });

      // ✅ Возвращаем типизированный результат
      return {
        id: order.id,
        status: order.status,
        depositAddress: order.depositAddress,
        expiresAt: order.expiresAt,
      };
    }),

  // ✅ Типобезопасный запрос данных
  getOrderById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const order = orderManager.findById(input.id);
    if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
    return order;
  }),
});
```

#### 2. Клиент (автоматическая типизация):

```typescript
// 📁 apps/web/src/components/exchange/ExchangeForm.tsx
import { api } from '../../utils/api';

export function ExchangeForm() {
  // ✅ Полная типизация из коробки!
  const createOrder = api.exchange.createOrder.useMutation({
    onSuccess: (data) => {
      // data автоматически типизирован!
      console.log('Order created:', data.id);
      console.log('Deposit address:', data.depositAddress);
      // TypeScript знает все поля!
    },
    onError: (error) => {
      // error тоже типизирован
      toast.error(error.message);
    }
  });

  const handleSubmit = (formData: FormData) => {
    // ✅ TypeScript проверяет типы на этапе компиляции
    createOrder.mutate({
      email: formData.email,          // string
      cryptoAmount: formData.amount,  // number
      currency: formData.currency     // 'BTC' | 'ETH' | 'USDT-TRC20' | ...
    });
    // Если передать неправильный тип - ошибка компиляции!
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* JSX формы */}
      <button
        disabled={createOrder.isLoading}
        type="submit"
      >
        {createOrder.isLoading ? 'Создание...' : 'Создать заявку'}
      </button>
    </form>
  );
}
```

## 🎯 Преимущества tRPC на примере обменника

### 1. **End-to-End типизация**

```typescript
// Изменили тип на сервере
export const exchangeRouter = createTRPCRouter({
  createOrder: publicProcedure.input(createOrderSchema).mutation(async ({ input }) => {
    return {
      id: input.id,
      status: input.status,
      // ✅ Добавили новое поле
      estimatedCompletion: new Date(),
    };
  }),
});

// На клиенте автоматически доступно новое поле!
const createOrder = api.exchange.createOrder.useMutation({
  onSuccess: data => {
    console.log(data.estimatedCompletion); // ✅ TypeScript знает об этом поле!
  },
});
```

### 2. **Автоматическая валидация**

```typescript
// Валидация происходит автоматически на основе Zod схем
export const securityEnhancedCreateExchangeOrderSchema = z.object({
  email: z.string().email().transform(sanitizeEmail),
  cryptoAmount: z.number().positive().max(1000000),
  currency: z.enum(CRYPTOCURRENCIES),
  recipientData: z
    .object({
      cardNumber: z.string().optional(),
      bankDetails: z.string().optional(),
    })
    .optional(),
});

// Клиент автоматически получает ошибки валидации
createOrder.mutate({
  email: 'invalid-email', // ❌ Автоматическая ошибка валидации
  cryptoAmount: -100, // ❌ Автоматическая ошибка валидации
  currency: 'INVALID_COIN', // ❌ TypeScript ошибка еще на этапе написания!
});
```

### 3. **Интеграция с React Query**

```typescript
// tRPC автоматически интегрируется с React Query
export function ExchangeHistory() {
  // ✅ Автоматическое кэширование, loading states, error handling
  const { data: orders, isLoading, error } = api.exchange.getOrderHistory.useQuery({
    email: user.email
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error.message} />;

  return (
    <div>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

## 🔍 Анализ реального кода проекта

### Наша структура tRPC роутеров:

```
apps/web/src/server/trpc/routers/
├── exchange.ts      # Основные операции обмена
├── auth.ts          # Авторизация пользователей
├── fiat.ts          # Работа с фиатными валютами
├── operator.ts      # Операторские функции
├── support.ts       # Техподдержка
├── user/            # Пользовательские операции
└── index.ts         # Главный роутер
```

### Пример роутера exchange.ts:

```typescript
export const exchangeRouter = createTRPCRouter({
  // Получение курса валюты
  getCurrencyRate: publicProcedure
    .input(securityEnhancedGetCurrencyRateSchema)
    .use(rateLimitMiddleware) // 🛡️ Rate limiting
    .query(async ({ input }) => {
      await delay(API_DELAY_MS); // Симуляция API
      return getExchangeRate(input.currency);
    }),

  // Расчет суммы обмена
  calculateAmount: publicProcedure
    .input(securityEnhancedCalculateAmountSchema)
    .query(async ({ input, ctx }) => {
      const { amount, currency, direction } = input;

      if (direction === 'crypto-to-uah') {
        return calculateUahAmount(amount, currency);
      } else {
        return calculateCryptoAmount(amount, currency);
      }
    }),

  // Создание заявки на обмен
  createOrder: publicProcedure
    .input(securityEnhancedCreateExchangeOrderSchema)
    .use(rateLimitMiddleware)
    .mutation(async ({ input, ctx }) => {
      await delay(ORDER_CREATION_DELAY_MS);

      const orderRequest = prepareOrderRequest(input);
      const user = ensureUser(orderRequest.email);
      const order = createOrderInSystem(orderRequest);

      return {
        success: true,
        order: {
          id: order.id,
          status: order.status,
          depositAddress: order.depositAddress,
          expiresAt: order.expiresAt,
        },
      };
    }),
});
```

## 💡 Сравнение REST vs tRPC

| Аспект           | REST API                     | tRPC                        |
| ---------------- | ---------------------------- | --------------------------- |
| **Типизация**    | ❌ Ручная синхронизация      | ✅ Автоматическая           |
| **Валидация**    | ❌ Ручная на каждом endpoint | ✅ Автоматическая через Zod |
| **Автокомплит**  | ❌ Нет                       | ✅ Полный в IDE             |
| **Ошибки**       | ❌ Runtime                   | ✅ Compile time             |
| **Boilerplate**  | ❌ Много                     | ✅ Минимум                  |
| **Документация** | ❌ Ручная                    | ✅ Автогенерируемая         |
| **Testing**      | ❌ Сложно                    | ✅ Типобезопасно            |

### Пример ошибки в REST vs tRPC:

```typescript
// REST: Ошибка обнаружится только в runtime
fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    email: 'test@test.com',
    amount: '100', // ❌ Строка вместо числа - ошибка в runtime!
    currency: 'BITCOIN', // ❌ Неправильное название валюты - ошибка в runtime!
  }),
});

// tRPC: Ошибка обнаружится на этапе написания кода
api.exchange.createOrder.mutate({
  email: 'test@test.com',
  cryptoAmount: '100', // ❌ TypeScript ошибка: Type 'string' is not assignable to type 'number'
  currency: 'BITCOIN', // ❌ TypeScript ошибка: Type '"BITCOIN"' is not assignable to type 'CryptoCurrency'
});
```

## ✅ Проверка знаний

1. **Вопрос**: В чем основная проблема REST API с точки зрения типизации?

   <details>
   <summary>Ответ</summary>

   REST API не обеспечивает типизацию между клиентом и сервером. TypeScript на клиенте не знает какие типы данных ожидает и возвращает сервер, что приводит к ошибкам в runtime.
   </details>

2. **Задача**: Найдите в коде примеры tRPC процедур:

   ```bash
   # Поиск tRPC роутеров в проекте
   find apps/web/src/server/trpc/routers/ -name "*.ts" -exec echo "=== {} ===" \; -exec head -10 {} \;
   ```

3. **Вопрос**: Как tRPC решает проблему валидации данных?

   <details>
   <summary>Ответ</summary>

   tRPC использует Zod схемы для автоматической валидации входных данных. Схема определяется один раз и автоматически применяется к входящим запросам, обеспечивая валидацию и типизацию одновременно.
   </details>

## 🚀 Практическое задание

**Задание**: Изучите существующую tRPC структуру:

1. **Изучите главный роутер**:

   ```bash
   cat apps/web/src/server/trpc/routers/index.ts
   ```

2. **Найдите все доступные процедуры**:

   ```bash
   grep -r "publicProcedure\|privateProcedure" apps/web/src/server/trpc/routers/
   ```

3. **Изучите как используется tRPC на клиенте**:

   ```bash
   grep -r "api\." apps/web/src/components/ | head -5
   ```

4. **Эксперимент**: Попробуйте вызвать несуществующую процедуру в компоненте и посмотрите на ошибку TypeScript.

## 📊 Performance сравнение

| Метрика                  | REST API              | tRPC                      |
| ------------------------ | --------------------- | ------------------------- |
| **Bundle size**          | ~15kb (axios + types) | ~8kb (встроено в Next.js) |
| **Developer Experience** | Медленная разработка  | Быстрая разработка        |
| **Type safety**          | 0% (runtime)          | 100% (compile time)       |
| **API документация**     | Ручная (OpenAPI)      | Автоматическая            |
| **Рефакторинг**          | Рискованный           | Безопасный                |

## 📚 Дополнительные материалы

- [Документация tRPC](https://trpc.io/docs)
- [tRPC vs REST API сравнение](https://trpc.io/docs/concepts)
- [Интеграция tRPC с Next.js](https://trpc.io/docs/nextjs)
- [Наша tRPC конфигурация](../../apps/web/src/server/trpc/)

---

[← Глава 4](./README.md) | [Урок 4.2: Server Routers →](./lesson-4.2-server-routers-procedures.md)
