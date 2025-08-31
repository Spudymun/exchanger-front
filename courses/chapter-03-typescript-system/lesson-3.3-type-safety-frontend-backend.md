# Урок 3.3: Type safety между frontend и backend

> **🎯 Цель урока**: Понять как tRPC обеспечивает end-to-end типизацию между сервером и клиентом в ExchangeGO, и почему это революционно по сравнению с REST API

## 📖 Введение

Представьте, что вы работаете в ресторане:

### 🍽️ **Проблема REST API** - как в старом ресторане:

```
Клиент → Официант → Кухня
"Хочу пиццу"    ???    "Какую?"
```

- Официант не знает какие пиццы есть
- Кухня не знает что хочет клиент
- Постоянные ошибки в заказах

### 🎯 **Решение tRPC** - как в современном ресторане:

```
Клиент ← QR-код с меню ← Кухня
(Видит ровно то что может заказать)
```

- Клиент видит только доступные блюда
- Кухня знает точно что готовить
- Невозможно заказать то, чего нет

**tRPC делает то же самое для API** - клиент автоматически знает какие функции доступны на сервере и какие типы данных они ожидают.

## 🧠 Как работает "магия" tRPC?

### 🎭 Демонстрация: "Обычный REST vs tRPC"

**❌ Обычный REST API (без типизации):**

```typescript
// 🖥️ Сервер (Express.js)
app.post('/api/exchange/rates', (req, res) => {
  const { currency } = req.body; // Что тут? string? number? 🤷‍♂️

  // Надеемся что клиент передал правильные данные
  const rates = getRates(currency);
  res.json(rates); // Что возвращаем? Никто не знает 🤷‍♀️
});

// 💻 Клиент (React)
const fetchRates = async (currency: string) => {
  const response = await fetch('/api/exchange/rates', {
    method: 'POST',
    body: JSON.stringify({ currency }), // Надеемся что сервер поймет
  });

  const data = await response.json(); // data имеет тип any 😱
  return data; // Что получили? Загадка!
};
```

**✅ tRPC (с полной типизацией):**

```typescript
// 🖥️ Сервер (tRPC)
export const exchangeRouter = createTRPCRouter({
  getRates: publicProcedure
    .input(z.object({ currency: z.enum(['BTC', 'ETH']) })) // 🎯 Четкий контракт
    .query(async ({ input }): Promise<ExchangeRate[]> => {
      // 🎯 Четкий возврат
      return getRates(input.currency); // TypeScript проверяет все!
    }),
});

// 💻 Клиент (React + tRPC)
const { data } = trpc.exchange.getRates.useQuery({
  currency: 'BTC', // ✅ TypeScript знает что это валидно
});
// data автоматически имеет тип ExchangeRate[] | undefined ✨
```

### 🔧 Механизм работы tRPC (пошагово)

**Шаг 1: TypeScript извлекает информацию о типах**

```typescript
// На сервере определяем роутер
const exchangeRouter = createTRPCRouter({
  getRates: publicProcedure.input(inputSchema).query(handler),
  createOrder: publicProcedure.input(orderSchema).mutation(orderHandler),
});

// TypeScript "видит" структуру:
type ExchangeRouter = {
  getRates: {
    input: { currency: 'BTC' | 'ETH' };
    output: ExchangeRate[];
  };
  createOrder: {
    input: CreateOrderRequest;
    output: Order;
  };
};
```

**Шаг 2: Экспортируем тип всего API**

```typescript
export const appRouter = createTRPCRouter({
  exchange: exchangeRouter, // Все методы обмена
  auth: authRouter, // Все методы авторизации
  user: userRouter, // Все методы пользователей
});

// 🎯 КЛЮЧЕВАЯ СТРОЧКА - экспорт типа!
export type AppRouter = typeof appRouter;
// AppRouter теперь содержит ВСЮ информацию о API
```

**Шаг 3: Клиент импортирует этот тип**

```typescript
// На клиенте импортируем ТИП (не код!)
import type { AppRouter } from '../server/trpc';

// Создаем типизированного клиента
const trpc = createTRPCReact<AppRouter>();
//                          ↑
//                    Вся магия здесь!
```

**Шаг 4: TypeScript генерирует автокомплит**

```typescript
// Теперь TypeScript знает:
trpc.exchange.getRates     // ✅ Метод существует
trpc.exchange.createOrder  // ✅ Метод существует
trpc.exchange.deleteUser   // ❌ Метод НЕ существует - ошибка!

// И знает типы параметров:
trpc.exchange.getRates.useQuery({
  currency: 'BTC'     // ✅ Валидное значение
  currency: 'DOGE'    // ❌ Невалидное - ошибка!
});
```

## 🔍 Как это работает в ExchangeGO

### 🏗️ Архитектура tRPC в ExchangeGO

```
📁 apps/web/
├── 🖥️ src/server/trpc/
│   ├── routers/
│   │   ├── exchange.ts     ← API обмена валют
│   │   ├── auth.ts         ← API авторизации
│   │   ├── user.ts         ← API пользователей
│   │   └── index.ts        ← 🎯 Объединяет все роутеры
│   └── init.ts             ← Настройка tRPC
│
├── 💻 lib/
│   └── trpc-provider.tsx   ← 🔗 Клиентская настройка
│
└── 🎨 components/
    └── *.tsx               ← 🚀 Используют типизированный API
```

### 1️⃣ **Сервер: Создание типизированного API**

```typescript
// 📁 apps/web/src/server/trpc/routers/exchange.ts
import { z } from 'zod';
import { type ExchangeRate } from '@repo/exchange-core';

export const exchangeRouter = createTRPCRouter({
  // 💰 Получение курсов валют
  getRates: publicProcedure
    .input(
      z.object({
        currency: z.enum(['BTC', 'ETH', 'USDT-TRC20']), // 🎯 Строгая валидация
      })
    )
    .query(async ({ input }): Promise<ExchangeRate[]> => {
      // TypeScript знает что input.currency имеет правильный тип
      return await getRatesFromDB(input.currency);
    }),

  // 📋 Создание заявки
  createOrder: publicProcedure
    .input(createOrderSchema) // Zod схема валидации
    .mutation(async ({ input }): Promise<Order> => {
      return await createOrderInDB(input);
    }),
});
```

```typescript
// 📁 apps/web/src/server/trpc/routers/index.ts
import { exchangeRouter } from './exchange';
import { authRouter } from './auth';
import { userRouter } from './user';

// 🏗️ Объединяем все API в один роутер
export const appRouter = createTRPCRouter({
  exchange: exchangeRouter, // trpc.exchange.*
  auth: authRouter, // trpc.auth.*
  user: userRouter, // trpc.user.*
});

// ⭐ МАГИЧЕСКАЯ СТРОЧКА - экспорт типа!
export type AppRouter = typeof appRouter;
```

**🔮 Что происходит с `typeof appRouter`?**

TypeScript анализирует структуру `appRouter` и создает тип:

```typescript
type AppRouter = {
  exchange: {
    getRates: {
      input: { currency: 'BTC' | 'ETH' | 'USDT-TRC20' };
      output: ExchangeRate[];
    };
    createOrder: {
      input: CreateOrderRequest;
      output: Order;
    };
  };
  auth: {
    login: { input: LoginRequest; output: AuthResponse };
    logout: { input: void; output: void };
  };
  user: {
    getProfile: { input: void; output: UserProfile };
  };
};
```

### 2️⃣ **Клиент: Импорт типов и создание клиента**

```typescript
// 📁 apps/web/lib/trpc-provider.tsx
import type { AppRouter } from '../src/server/trpc';  // 🔗 Импорт ТИПА
import { createTRPCReact } from '@trpc/react-query';

// 🎯 Создаем типизированного клиента
const trpc = createTRPCReact<AppRouter>();
//                          ↑
//                    Передаем тип API

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',        // 🌐 Endpoint сервера
          transformer: superjson,  // 📦 Сериализация Date, Map, Set
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
}

export { trpc };  // 🚀 Экспортируем для использования в компонентах
```

**💡 Результат:** Теперь `trpc` знает ВСЕ методы сервера и их типы!

### 3️⃣ **Компоненты: Автоматическая типизация**

```typescript
// 📁 apps/web/src/components/ExchangeRates.tsx
import { trpc } from '@/lib/trpc-provider';

function ExchangeRates() {
  // 🎯 TypeScript автоматически знает:
  // ✅ Метод getRates существует
  // ✅ Принимает { currency: 'BTC' | 'ETH' | 'USDT-TRC20' }
  // ✅ Возвращает ExchangeRate[] | undefined
  const { data: rates, isLoading, error } = trpc.exchange.getRates.useQuery({
    currency: 'BTC'  // ← Автокомплит покажет только валидные валюты!
  });

  if (isLoading) return <div>Загрузка курсов...</div>;

  if (error) {
    // error имеет тип TRPCClientError с типизированными свойствами
    return <div>Ошибка: {error.message}</div>;
  }

  return (
    <div>
      {rates?.map(rate => (
        <div key={rate.currency}>
          {/* TypeScript знает все свойства rate: */}
          <span>{rate.currency}</span>      {/* ✅ string */}
          <span>{rate.uahRate} UAH</span>   {/* ✅ number */}
          <span>{rate.commission}%</span>   {/* ✅ number */}
          {/* rate.invalidField */}         {/* ❌ Ошибка компиляции! */}
        </div>
      ))}
    </div>
  );
}
```

### 🎭 Демонстрация автокомплита в IDE

**При вводе `trpc.` IDE покажет:**

```
trpc.
├── exchange.     ← API обмена валют
├── auth.         ← API авторизации
└── user.         ← API пользователей
```

**При вводе `trpc.exchange.` IDE покажет:**

```
trpc.exchange.
├── getRates.useQuery()      ← Получить курсы
├── createOrder.useMutation() ← Создать заявку
└── getOrderHistory.useQuery() ← История заявок
```

**При вводе параметров:**

```typescript
trpc.exchange.getRates.useQuery({
  currency: '...'  ← IDE покажет: 'BTC' | 'ETH' | 'USDT-TRC20'
});
```

## 🔄 Полный цикл type safety: От сервера до UI

### 🎯 Практический пример: API получения курсов валют

Давайте проследим как данные и типы путешествуют от базы данных до пользовательского интерфейса:

#### 🗄️ Шаг 1: Типы в базовых пакетах

```typescript
// 📁 packages/constants/src/currencies.ts
export const CRYPTOCURRENCIES = ['BTC', 'ETH', 'USDT-TRC20', 'USDT-ERC20', 'TRX'] as const;
export type CryptoCurrency = (typeof CRYPTOCURRENCIES)[number];

// 📁 packages/exchange-core/src/types/currency.ts
import { type CryptoCurrency } from '@repo/constants';

export interface ExchangeRate {
  currency: CryptoCurrency; // ✅ Строго типизированная валюта
  usdRate: number;
  uahRate: number;
  commission: number;
  lastUpdated: Date;
  isActive: boolean;
}
```

#### 🖥️ Шаг 2: Серверный API с валидацией

```typescript
// 📁 apps/web/src/server/trpc/routers/exchange.ts
import { z } from 'zod';
import { type ExchangeRate, type CryptoCurrency } from '@repo/exchange-core';
import { CRYPTOCURRENCIES } from '@repo/constants';

export const exchangeRouter = createTRPCRouter({
  getRates: publicProcedure
    .input(
      z.object({
        currency: z.enum(CRYPTOCURRENCIES), // 🎯 Валидация на основе констант
      })
    )
    .query(async ({ input }): Promise<ExchangeRate[]> => {
      // input.currency имеет тип CryptoCurrency (не просто string!)
      console.log(`Получаем курсы для ${input.currency}`);

      // Бизнес-логика
      const rates = await getRatesFromDatabase(input.currency);

      // TypeScript проверяет что возвращаем ExchangeRate[]
      return rates;
    }),
});
```

#### 🌐 Шаг 3: Реальный HTTP запрос (автоматически генерируется)

**🔍 Что происходит "под капотом" tRPC:**

Когда вы пишете:

```typescript
const { data } = trpc.exchange.getRates.useQuery({ currency: 'BTC' });
```

tRPC автоматически выполняет **настоящий HTTP запрос**:

```http
POST /api/trpc/exchange.getRates HTTP/1.1
Content-Type: application/json

{
  "json": {
    "currency": "BTC"
  }
}
```

**📡 Реальный ответ сервера:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "result": {
    "data": [
      {
        "currency": "BTC",
        "usdRate": 45000,
        "uahRate": 1650000,
        "commission": 2.5,
        "lastUpdated": "2024-01-15T10:30:00.000Z",
        "isActive": true
      }
    ]
  }
}
```

**🎯 Ключевой момент:** tRPC НЕ заменяет HTTP - он его **автоматизирует**!

### 🔧 Как это настроено в ExchangeGO

**📁 Серверная часть (Next.js API Route):**

```typescript
// apps/web/src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter, // ← Наш роутер с типами
    createContext: () => ({}),
  });

export { handler as GET, handler as POST };
```

**💻 Клиентская часть (HTTP клиент):**

```typescript
// apps/web/lib/trpc-provider.tsx
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc', // ← Реальный HTTP endpoint
      transformer: superjson, // ← Сериализация Date, Map, Set
    }),
  ],
});
```

### 🕵️ Можете проверить сами!

Откройте DevTools в браузере и посмотрите вкладку Network:

```typescript
// Когда выполняется этот код:
const { data } = trpc.exchange.getRates.useQuery({ currency: 'BTC' });

// В Network tab увидите:
// ┌─────────────────────────────────────────┐
// │ Name: exchange.getRates                 │
// │ Method: POST                            │
// │ URL: /api/trpc/exchange.getRates        │
// │ Status: 200                             │
// │ Type: fetch                             │
// └─────────────────────────────────────────┘
```

### 🤔 tRPC vs обычный fetch - в чем разница?

**❌ Обычный способ (много ручной работы):**

```typescript
// 1️⃣ Ручное создание запроса
const response = await fetch('/api/exchange/rates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ currency: 'BTC' }), // Ручная сериализация
});

// 2️⃣ Ручная обработка ответа
if (!response.ok) {
  throw new Error('Network error'); // Ручная обработка ошибок
}

const data = await response.json(); // data имеет тип any 😱

// 3️⃣ Ручная проверка типов
if (!Array.isArray(data) || !data[0]?.currency) {
  throw new Error('Invalid response format');
}

return data as ExchangeRate[]; // Надеемся что тип правильный 🤞
```

**✅ tRPC способ (автоматизация):**

```typescript
// Все то же самое, но автоматически:
const { data } = trpc.exchange.getRates.useQuery({ currency: 'BTC' });
//    ↑
//    Типизированный результат ExchangeRate[] | undefined
```

**🎯 tRPC делает ЗА ВАС:**

- ✅ Создает правильный HTTP запрос
- ✅ Сериализует параметры (включая Date, Map, Set)
- ✅ Обрабатывает ошибки сети
- ✅ Парсит JSON ответ
- ✅ Проверяет типы данных
- ✅ Кеширует результаты (через React Query)
- ✅ Обеспечивает типобезопасность

### 🔬 Детальный разбор HTTP трафика

**Реальный пример из ExchangeGO:**

```bash
# Запрос который отправляет браузер:
curl -X POST http://localhost:3000/api/trpc/exchange.getRates \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "currency": "BTC"
    }
  }'

# Ответ который приходит:
{
  "result": {
    "data": [
      {
        "currency": "BTC",
        "usdRate": 45000,
        "uahRate": 1650000,
        "commission": 2.5,
        "lastUpdated": "2024-01-15T10:30:00.000Z",
        "isActive": true
      }
    ]
  }
}
```

**🎭 Batch запросы (оптимизация):**

Если вы делаете несколько запросов одновременно:

```typescript
// Несколько запросов
const rates = trpc.exchange.getRates.useQuery({ currency: 'BTC' });
const orders = trpc.exchange.getOrders.useQuery();
const profile = trpc.user.getProfile.useQuery();
```

tRPC автоматически объединяет их в один HTTP запрос:

```http
POST /api/trpc/exchange.getRates,exchange.getOrders,user.getProfile
{
  "0": { "json": { "currency": "BTC" } },
  "1": { "json": null },
  "2": { "json": null }
}
```

#### 💻 Шаг 4: Клиентский код с автоматическими типами

```typescript
// 📁 apps/web/src/components/ExchangeRates.tsx
import { trpc } from '@/lib/trpc-provider';
import { CRYPTOCURRENCIES } from '@repo/constants';

function ExchangeRates() {
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency>('BTC');

  // 🎯 TypeScript автоматически выводит все типы:
  const {
    data: rates,        // ExchangeRate[] | undefined
    error,              // TRPCClientError | null
    isLoading,          // boolean
    refetch             // () => Promise<...>
  } = trpc.exchange.getRates.useQuery({
    currency: selectedCurrency  // ✅ TypeScript проверяет тип
  });

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    // error.message, error.data.code - все типизировано
    return <ErrorMessage message={error.message} />;
  }

  return (
    <div>
      {/* Селектор валюты */}
      <select
        value={selectedCurrency}
        onChange={(e) => setSelectedCurrency(e.target.value as CryptoCurrency)}
      >
        {CRYPTOCURRENCIES.map(currency => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </select>

      {/* Список курсов */}
      {rates?.map(rate => (
        <div key={rate.currency} className="rate-card">
          <h3>{rate.currency}</h3>
          <p>Курс: {rate.uahRate.toLocaleString()} UAH</p>
          <p>Комиссия: {rate.commission}%</p>
          <p>Обновлено: {rate.lastUpdated.toLocaleString()}</p>
          {!rate.isActive && <span className="inactive">Неактивна</span>}
        </div>
      ))}
    </div>
  );
}
```

#### 🔄 Шаг 5: Что происходит при изменении типа

**Сценарий:** Добавляем новое поле `minAmount` в `ExchangeRate`

```typescript
// 1️⃣ Обновляем тип в exchange-core
export interface ExchangeRate {
  currency: CryptoCurrency;
  usdRate: number;
  uahRate: number;
  commission: number;
  lastUpdated: Date;
  isActive: boolean;
  minAmount: number;  // ← Новое поле
}

// 2️⃣ Обновляем серверную логику
.query(async ({ input }): Promise<ExchangeRate[]> => {
  const rates = await getRatesFromDatabase(input.currency);

  // ❌ TypeScript ошибка! rates не содержит minAmount
  return rates;

  // ✅ Исправляем:
  return rates.map(rate => ({
    ...rate,
    minAmount: getMinAmountForCurrency(rate.currency)
  }));
}),

// 3️⃣ Клиентский код автоматически получает новое поле
{rates?.map(rate => (
  <div key={rate.currency}>
    <p>Минимальная сумма: {rate.minAmount}</p>  {/* ✅ Новое поле доступно! */}
  </div>
))}
```

**🎉 Результат:** Одно изменение типа → автоматическое обновление по всей цепочке!

## 🚀 Практический пример: Создание заявки

### На сервере (тип и логика)

```typescript
// apps/web/src/server/trpc/routers/exchange.ts
import { type CreateOrderRequest, type Order } from '@repo/exchange-core';
import { securityEnhancedCreateExchangeOrderSchema } from '@repo/utils';

export const exchangeRouter = createTRPCRouter({
  createOrder: publicProcedure
    .input(securityEnhancedCreateExchangeOrderSchema) // Zod схема
    .mutation(async ({ input }): Promise<Order> => {
      // input автоматически имеет тип CreateOrderRequest
      const orderRequest = prepareOrderRequest(input);

      // Создаем заявку
      const order = createOrderInSystem(orderRequest);

      return order; // TypeScript проверяет соответствие типу Order
    }),
});
```

### На клиенте (автоматические типы)

```typescript
// apps/web/src/hooks/useExchangeMutation.ts
import { type CreateOrderRequest } from '@repo/exchange-core';
import { trpc } from '@/lib/trpc-provider';

export function useExchangeMutation() {
  const createOrderMutation = trpc.exchange.createOrder.useMutation();

  const createOrder = async (data: CreateOrderRequest) => {
    // TypeScript проверяет что data соответствует серверному типу
    const result = await createOrderMutation.mutateAsync(data);

    // result автоматически имеет тип Order
    return result;
  };

  return {
    createOrder,
    isLoading: createOrderMutation.isPending,
  };
}
```

### В React компоненте

```typescript
// apps/web/src/components/ExchangeForm.tsx
import { type CreateOrderRequest } from '@repo/exchange-core';
import { useExchangeMutation } from '@/hooks/useExchangeMutation';

function ExchangeForm() {
  const { createOrder, isLoading } = useExchangeMutation();

  const handleSubmit = async (formData: any) => {
    // Типизированные данные заявки
    const orderData: CreateOrderRequest = {
      email: formData.email,
      cryptoAmount: parseFloat(formData.amount),
      currency: formData.currency,  // TypeScript проверит валидность
      uahAmount: formData.uahAmount,
      recipientData: {
        type: 'card',
        cardNumber: formData.cardNumber,
        cardHolderName: formData.cardHolderName,
      }
    };

    try {
      const order = await createOrder(orderData);
      // order автоматически имеет тип Order
      console.log('Заявка создана:', order.id);
    } catch (error) {
      // error имеет типизированную структуру tRPC ошибки
      console.error('Ошибка создания заявки:', error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Форма создания заявки */}
    </form>
  );
}
```

## ⚙️ Настройка tRPC Provider

### Клиентская конфигурация

```typescript
// apps/web/lib/trpc-provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import type { AppRouter } from '../src/server/trpc';

// Типизированный клиент
const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',              // Endpoint API
          transformer: superjson,        // Сериализация сложных типов
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export { trpc };
```

### Интеграция в приложение

```typescript
// apps/web/app/layout.tsx
import { TRPCProvider } from '@/lib/trpc-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
```

## 🔒 Типизированная обработка ошибок

### Серверные ошибки с типами

```typescript
// apps/web/src/server/trpc/routers/exchange.ts
import { createBadRequestError } from '@repo/utils';

export const exchangeRouter = createTRPCRouter({
  createOrder: publicProcedure.input(createOrderSchema).mutation(async ({ input, ctx }) => {
    // Проверка валидности валюты
    if (!CRYPTOCURRENCIES.includes(input.currency as CryptoCurrency)) {
      throw createBadRequestError(
        await ctx.getErrorMessage('server.errors.business.unsupportedCurrency', {
          currency: input.currency,
        })
      );
    }

    // Проверка лимитов
    if (!isAmountWithinLimits(input.cryptoAmount, input.currency)) {
      throw createOrderError(await ctx.getErrorMessage('server.errors.business.amountOutOfRange'));
    }

    // Создание заявки...
  }),
});
```

### Клиентская обработка ошибок

```typescript
// В React компоненте
function ExchangeForm() {
  const createOrderMutation = trpc.exchange.createOrder.useMutation({
    onError: error => {
      // error имеет типизированную структуру TRPCClientError

      if (error.data?.code === 'BAD_REQUEST') {
        // Ошибка валидации данных
        setFieldError(error.message);
      } else if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        // Внутренняя ошибка сервера
        showGenericError();
      }

      // TypeScript обеспечивает типизацию всех свойств error
    },
    onSuccess: order => {
      // order автоматически имеет тип Order
      router.push(`/order/${order.id}`);
    },
  });
}
```

## 🎯 Супер-силы tRPC: Что это дает разработчикам

### 🛡️ 1. Безопасность на этапе компиляции

**❌ Невозможные ошибки:**

```typescript
// 🚫 Несуществующий метод
const { data } = trpc.exchange.nonExistentMethod.useQuery();
//                              ↑
// TypeScript Error: Property 'nonExistentMethod' does not exist

// 🚫 Неправильные параметры
const { data } = trpc.exchange.getRates.useQuery({
  currency: 'DOGECOIN', // ← Не в списке поддерживаемых валют
});
// TypeScript Error: Argument of type '"DOGECOIN"' is not assignable

// 🚫 Неправильная структура данных
const { data } = trpc.exchange.createOrder.useMutation({
  amount: '100', // ← Должно быть number, а не string
  currency: 123, // ← Должно быть string, а не number
});
```

**✅ Только правильный код:**

```typescript
// ✅ Все проверено TypeScript'ом
const { data } = trpc.exchange.getRates.useQuery({
  currency: 'BTC', // ← Валидная валюта из enum
});

const createOrder = trpc.exchange.createOrder.useMutation();
await createOrder.mutateAsync({
  amount: 100, // ← Правильный тип number
  currency: 'ETH', // ← Правильный тип string из enum
  email: 'user@test.com', // ← Все поля соответствуют схеме
});
```

### 🔄 2. Автоматический рефакторинг по всему стеку

**Сценарий:** Переименовываем поле `uahRate` → `priceUAH`

```typescript
// 🖥️ Шаг 1: Изменяем тип на сервере
interface ExchangeRate {
  currency: CryptoCurrency;
  priceUAH: number;  // ← Переименовали поле
  commission: number;
}

// 💻 Шаг 2: TypeScript показывает ВСЕ места для исправления
{rates?.map(rate => (
  <div key={rate.currency}>
    <span>{rate.uahRate} UAH</span>  {/* ❌ Ошибка! Поле не существует */}
    <span>{rate.priceUAH} UAH</span> {/* ✅ Исправляем */}
  </div>
))}

// 🎯 Результат: Невозможно забыть обновить какое-то место!
```

### 🧠 3. IntelliSense как документация API

**IDE автоматически показывает:**

```typescript
// При вводе trpc. показывает все доступные роутеры:
trpc.
├── 💰 exchange     ← Операции с валютами
├── 🔐 auth         ← Авторизация
├── 👤 user         ← Профиль пользователя
└── 📊 analytics    ← Аналитика

// При вводе trpc.exchange. показывает все методы:
trpc.exchange.
├── 📈 getRates.useQuery()        ← Получить курсы валют
├── 📋 createOrder.useMutation()  ← Создать заявку на обмен
├── 📜 getHistory.useQuery()      ← История операций
└── 🧮 calculate.useQuery()       ← Калькулятор обмена

// При вводе параметров показывает их типы:
trpc.exchange.getRates.useQuery({
  currency: |  ← IDE покажет: 'BTC' | 'ETH' | 'USDT-TRC20' | 'USDT-ERC20' | 'TRX'
});
```

### ⚡ 4. Мгновенная обратная связь

```typescript
function ExchangeForm() {
  const createOrder = trpc.exchange.createOrder.useMutation({
    onSuccess: order => {
      // order автоматически имеет тип Order
      console.log(`Заявка ${order.id} создана`); // ✅ Автокомплит работает
      router.push(`/order/${order.id}`);
    },
    onError: error => {
      // error имеет тип TRPCClientError
      if (error.data?.code === 'BAD_REQUEST') {
        // ✅ Типизированные коды ошибок
        setFormError(error.message);
      }
    },
  });

  // TypeScript проверяет данные формы на соответствие серверной схеме
  const handleSubmit = (formData: FormData) => {
    createOrder.mutate({
      amount: Number(formData.amount), // ✅ Правильный тип
      currency: formData.currency, // ✅ Проверяется enum
      email: formData.email, // ✅ Обязательное поле
      // phone: formData.phone            // ❌ Если забыли - TypeScript напомнит
    });
  };
}
```

### 🎯 5. Нулевая синхронизация документации

**Проблема с REST API:**

```typescript
// Документация в Swagger говорит одно:
interface User {
  id: number;
  name: string;
}

// А реальный API возвращает другое:
{
  "user_id": 123,        // ← Другое название поля!
  "full_name": "John",   // ← Другое название поля!
  "email": "john@..."    // ← Дополнительное поле!
}
```

**С tRPC документация = код:**

```typescript
// Что определено в коде - то и работает
export interface User {
  id: number;
  name: string;
  email: string;
}

// Клиент получает ТОЧНО такую же структуру
const { data: user } = trpc.user.getProfile.useQuery();
// user имеет тип User - гарантированно!
```

## 💻 Практическое задание

### Задание 1: Создайте типизированный хук

Создайте хук `useOrderHistory` для получения истории заявок пользователя:

```typescript
// apps/web/src/hooks/useOrderHistory.ts
export function useOrderHistory(email: string) {
  // Ваш код здесь
  // Используйте trpc.exchange.getOrderHistory.useQuery
}
```

<details>
<summary>Показать решение</summary>

```typescript
import { trpc } from '@/lib/trpc-provider';

export function useOrderHistory(email: string, options?: { enabled?: boolean }) {
  return trpc.exchange.getOrderHistory.useQuery(
    { email },
    {
      enabled: options?.enabled && !!email,
      refetchInterval: 30000, // Обновлять каждые 30 секунд
    }
  );
}

// Использование
function OrderHistoryComponent({ userEmail }: { userEmail: string }) {
  const { data: orders, isLoading, error } = useOrderHistory(userEmail);

  if (isLoading) return <div>Загрузка истории...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;

  return (
    <div>
      {orders?.map(order => (
        <div key={order.id}>
          <span>{order.currency}</span>
          <span>{order.cryptoAmount}</span>
          <span>{order.status}</span>
        </div>
      ))}
    </div>
  );
}
```

</details>

### Задание 2: Типизированная мутация

Создайте мутацию для отмены заявки:

```typescript
// Серверная часть должна принимать { orderId: string }
// И возвращать { success: boolean, order: Order }
```

<details>
<summary>Показать решение</summary>

**Сервер:**

```typescript
// apps/web/src/server/trpc/routers/exchange.ts
cancelOrder: publicProcedure
  .input(z.object({ orderId: z.string() }))
  .mutation(async ({ input }): Promise<{ success: boolean; order: Order }> => {
    const order = await cancelOrderInDatabase(input.orderId);
    return { success: true, order };
  }),
```

**Клиент:**

```typescript
// apps/web/src/hooks/useOrderMutations.ts
export function useOrderMutations() {
  const cancelOrderMutation = trpc.exchange.cancelOrder.useMutation();

  const cancelOrder = async (orderId: string) => {
    const result = await cancelOrderMutation.mutateAsync({ orderId });
    return result; // { success: boolean; order: Order }
  };

  return { cancelOrder, isCancelling: cancelOrderMutation.isPending };
}
```

</details>

## ✅ Проверка знаний

### Вопрос 1

Что делает `export type AppRouter = typeof appRouter`?

**A)** Экспортирует функцию для создания роутера  
**B)** Экспортирует тип, содержащий информацию о всех API методах  
**C)** Создает новый роутер  
**D)** Экспортирует конфигурацию сервера

<details>
<summary>Показать ответ</summary>

**Правильный ответ: B**

`typeof appRouter` извлекает типизированную структуру всех роутеров и их методов, что позволяет TypeScript на клиенте знать какие API доступны.

</details>

### Вопрос 2

Какой инструмент используется для сериализации сложных типов данных в tRPC?

**A)** JSON.stringify  
**B)** superjson  
**C)** TypeScript  
**D)** React Query

<details>
<summary>Показать ответ</summary>

**Правильный ответ: B**

`superjson` позволяет сериализовать Date, Map, Set и другие сложные типы, которые обычный JSON не поддерживает.

</details>

## 📚 Дополнительные материалы

### tRPC Documentation

- [tRPC Official Docs](https://trpc.io/) - полная документация
- [React Query Integration](https://trpc.io/docs/react) - интеграция с React Query

### TypeScript Resources

- [TypeScript typeof](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html) - оператор typeof
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) - встроенные типы-утилиты

## 📋 Резюме урока

1. **tRPC обеспечивает end-to-end типизацию** от сервера до клиента
2. **`AppRouter` type** позволяет TypeScript знать все доступные API методы
3. **Автоматическая типизация** в React Query хуках через tRPC
4. **Безопасность на этапе компиляции** предотвращает ошибки API
5. **Автоматический рефакторинг** при изменении серверных типов
6. **IntelliSense и автокомплит** улучшают developer experience

В следующем уроке создадим практический компонент с полной типизацией от UI до API.

---

[← Урок 3.2](./lesson-3.2-exchange-core-types.md) | [Урок 3.4: Практика - создание типобезопасных компонентов →](./lesson-3.4-practice-typesafe-components.md)
