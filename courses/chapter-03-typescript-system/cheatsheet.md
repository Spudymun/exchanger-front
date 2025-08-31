# 📋 Шпаргалка: Система типов TypeScript в монорепозитории

> **🎯 Цель:** Быстрый справочник по архитектуре типов и tRPC в ExchangeGO

## 🏛️ Архитектура типов: Единый источник истины

### ❌ Проблема без централизации

```typescript
// 🚫 ПЛОХО - дублирование типов в разных местах
// apps/web/src/types/currency.ts
interface Currency {
  code: string;
  name: string;
}

// apps/admin/src/types/currency.ts
interface Currency {
  code: string;
  name: string;
  isActive: boolean;
}

// packages/ui/src/types/currency.ts
interface Currency {
  symbol: string;
  displayName: string;
}
```

**Результат:** Хаос, рассинхронизация, ошибки интеграции

### ✅ Решение: Централизованная система

```
📁 packages/
├── 🔧 constants/           ← Layer 1: Базовые константы
├── 🎯 exchange-core/       ← Layer 2: Бизнес-типы
├── 🎨 ui/                  ← Layer 3: UI типы
└── 🚀 apps/                ← Layer 4: Специфичные типы
```

**Правило зависимостей:** Верхние слои могут использовать нижние, но НЕ наоборот

## 🔧 Практическая реализация

### 1️⃣ Создание констант (Layer 1)

```typescript
// packages/constants/src/currencies.ts
export const CRYPTOCURRENCIES = ['BTC', 'ETH', 'USDT-TRC20'] as const;
export type CryptoCurrency = (typeof CRYPTOCURRENCIES)[number];
//                           ↑
//                    TypeScript магия: массив → union type
```

### 2️⃣ Бизнес-типы (Layer 2)

```typescript
// packages/exchange-core/src/types/currency.ts
import { type CryptoCurrency } from '@repo/constants';

export interface ExchangeRate {
  currency: CryptoCurrency; // ✅ Использует Layer 1
  uahRate: number;
  commission: number;
  lastUpdated: Date;
}
```

### 3️⃣ UI типы (Layer 3)

```typescript
// packages/ui/src/types/component-props.ts
import { type ExchangeRate } from '@repo/exchange-core';

export interface CurrencyCardProps {
  rate: ExchangeRate; // ✅ Использует Layer 2
  onClick: () => void;
}
```

### 4️⃣ Использование в приложениях (Layer 4)

```typescript
// apps/web/src/components/ExchangeRates.tsx
import { type ExchangeRate } from '@repo/exchange-core';
import { type CurrencyCardProps } from '@repo/ui';

// ✅ Все типы согласованы автоматически
```

## 🎯 Золотые правила архитектуры типов

### 🥇 Правило 1: Один источник истины

- Каждый тип определяется ТОЛЬКО в одном месте
- Все остальные импортируют этот тип
- Изменение в одном месте → обновление везде

### 🥈 Правило 2: Слоистые зависимости

```
Layer 4: apps          ← Может использовать 1-3
Layer 3: ui            ← Может использовать 1-2
Layer 2: exchange-core ← Может использовать 1
Layer 1: constants     ← Не зависит ни от чего
```

### 🥉 Правило 3: Правильные импорты

```typescript
// ✅ ПРАВИЛЬНО - type-only импорт
import { type CryptoCurrency } from '@repo/exchange-core';

// ❌ НЕПРАВИЛЬНО - может добавить runtime код
import { CryptoCurrency } from '@repo/exchange-core';
```

## 🚀 tRPC: Как работает "магия" типобезопасности

### 🧠 Механизм работы (пошагово)

#### Шаг 1: Сервер экспортирует структуру API

```typescript
// apps/web/src/server/trpc/routers/exchange.ts
export const exchangeRouter = createTRPCRouter({
  getRates: publicProcedure
    .input(z.object({ currency: z.enum(['BTC', 'ETH']) }))
    .query(async ({ input }): Promise<ExchangeRate[]> => {
      return getRatesFromDB(input.currency);
    }),
});

// apps/web/src/server/trpc/index.ts
export const appRouter = createTRPCRouter({
  exchange: exchangeRouter,
});

// 🎯 КЛЮЧЕВАЯ СТРОЧКА - экспорт типа!
export type AppRouter = typeof appRouter;
```

#### Шаг 2: TypeScript анализирует структуру

```typescript
// TypeScript автоматически создает тип:
type AppRouter = {
  exchange: {
    getRates: {
      input: { currency: 'BTC' | 'ETH' };
      output: ExchangeRate[];
    };
  };
};
```

#### Шаг 3: Клиент импортирует тип

```typescript
// apps/web/lib/trpc-provider.tsx
import type { AppRouter } from '../src/server/trpc'; // ← Импорт ТИПА

const trpc = createTRPCReact<AppRouter>();
//                          ↑
//                    Передаем информацию о API
```

#### Шаг 4: Автоматическая типизация в компонентах

```typescript
// TypeScript теперь знает ВСЕ методы API:
const { data } = trpc.exchange.getRates.useQuery({
  currency: 'BTC', // ← Автокомплит покажет только 'BTC' | 'ETH'
});
// data автоматически имеет тип ExchangeRate[] | undefined
```

### 🌐 Что происходит с HTTP (реально!)

**tRPC НЕ заменяет HTTP - он его автоматизирует!**

```typescript
// Когда вы пишете:
const { data } = trpc.exchange.getRates.useQuery({ currency: 'BTC' });

// tRPC автоматически делает настоящий HTTP запрос:
```

```http
POST /api/trpc/exchange.getRates HTTP/1.1
Content-Type: application/json

{
  "json": {
    "currency": "BTC"
  }
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "result": {
    "data": [
      {
        "currency": "BTC",
        "uahRate": 1650000,
        "commission": 2.5,
        "lastUpdated": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 🔍 Проверить можно в DevTools!

Откройте Network tab и увидите реальные HTTP запросы:

- Method: POST
- URL: /api/trpc/exchange.getRates
- Type: fetch

## 🎭 tRPC vs обычный fetch

### ❌ Обычный способ (много работы)

```typescript
// 1️⃣ Ручное создание запроса
const response = await fetch('/api/exchange/rates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ currency: 'BTC' }),
});

// 2️⃣ Ручная обработка
const data = await response.json(); // any тип 😱

// 3️⃣ Ручная проверка типов
return data as ExchangeRate[]; // Надеемся что правильно 🤞
```

### ✅ tRPC способ (автоматизация)

```typescript
// Все то же самое, но автоматически:
const { data } = trpc.exchange.getRates.useQuery({ currency: 'BTC' });
//    ↑
//    ExchangeRate[] | undefined - гарантированно!
```

## 🛡️ Супер-силы типобезопасности

### 1. Ошибки на этапе компиляции

```typescript
// ❌ Не скомпилируется
trpc.exchange.nonExistentMethod.useQuery(); // Метод не существует
trpc.exchange.getRates.useQuery({ currency: 'DOGE' }); // Неподдерживаемая валюта

// ✅ Только правильный код
trpc.exchange.getRates.useQuery({ currency: 'BTC' });
```

### 2. Автоматический рефакторинг

```typescript
// Изменили тип на сервере:
interface ExchangeRate {
  currency: CryptoCurrency;
  priceUAH: number;  // ← Переименовали поле
}

// TypeScript покажет ВСЕ места для исправления:
{rates?.map(rate => (
  <span>{rate.uahRate}</span>  // ❌ Ошибка! Поле не существует
  <span>{rate.priceUAH}</span> // ✅ Исправляем
))}
```

### 3. IntelliSense как живая документация

```typescript
trpc.exchange.  // ← IDE покажет все доступные методы
//           getRates
//           createOrder
//           getHistory
```

## 🔧 Настройка tRPC в проекте

### Серверная часть

```typescript
// apps/web/src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  });

export { handler as GET, handler as POST };
```

### Клиентская часть

```typescript
// apps/web/lib/trpc-provider.tsx
import type { AppRouter } from '../src/server/trpc';

const trpc = createTRPCReact<AppRouter>();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson, // Для Date, Map, Set
    }),
  ],
});
```

## 🎯 Практические паттерны

### Создание нового API метода

```typescript
// 1️⃣ Добавляем на сервер
export const exchangeRouter = createTRPCRouter({
  // ... существующие методы

  getOrderHistory: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }): Promise<Order[]> => {
      return getOrdersFromDB(input.email);
    }),
});

// 2️⃣ Используем на клиенте (автоматически доступно!)
const { data: orders } = trpc.exchange.getOrderHistory.useQuery({
  email: 'user@example.com',
});
// orders имеет тип Order[] | undefined
```

### Обработка ошибок

```typescript
const createOrder = trpc.exchange.createOrder.useMutation({
  onError: error => {
    // error имеет типизированную структуру TRPCClientError
    if (error.data?.code === 'BAD_REQUEST') {
      setFormError(error.message);
    }
  },
  onSuccess: order => {
    // order автоматически имеет тип Order
    router.push(`/order/${order.id}`);
  },
});
```

## 🚨 Частые ошибки и их решения

### ❌ Ошибка: Дублирование типов

```typescript
// ПЛОХО - создаем копию типа
interface LocalCurrency {
  code: string;
  name: string;
}
```

```typescript
// ✅ ХОРОШО - используем централизованный тип
import { type CryptoCurrency } from '@repo/exchange-core';
```

### ❌ Ошибка: Неправильные зависимости

```typescript
// ПЛОХО - constants зависит от exchange-core
import { type Order } from '@repo/exchange-core';
```

```typescript
// ✅ ХОРОШО - соблюдаем иерархию слоев
// constants → exchange-core → ui → apps
```

### ❌ Ошибка: Value импорт для типов

```typescript
// ПЛОХО - может добавить runtime код
import { CryptoCurrency } from '@repo/exchange-core';
```

```typescript
// ✅ ХОРОШО - type-only импорт
import { type CryptoCurrency } from '@repo/exchange-core';
```

## 📚 Быстрые команды

### Добавление новой валюты

```typescript
// 1️⃣ packages/constants/src/currencies.ts
export const CRYPTOCURRENCIES = [
  'BTC',
  'ETH',
  'USDT-TRC20',
  'USDT-ERC20',
  'TRX',
  'DOGE', // ← Добавили одну строчку
] as const;

// 2️⃣ Все приложения автоматически получают новый тип!
```

### Создание нового типа

```typescript
// 1️⃣ Константы (если нужны)
// packages/constants/src/notifications.ts
export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error'] as const;

// 2️⃣ Основной тип
// packages/exchange-core/src/types/notification.ts
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

// 3️⃣ Экспорт
// packages/exchange-core/src/types/index.ts
export * from './notification';
```

## 🎯 Ключевые выводы

1. **Централизация типов** предотвращает хаос и ошибки
2. **tRPC = HTTP + автоматизация** - никакой магии, только удобство
3. **Слоистая архитектура** обеспечивает правильные зависимости
4. **Type-only импорты** оптимизируют bundle size
5. **Один источник истины** → изменение везде автоматически

---

**💡 Помните:** TypeScript и tRPC не заменяют понимание основ, они делают разработку безопаснее и быстрее!
