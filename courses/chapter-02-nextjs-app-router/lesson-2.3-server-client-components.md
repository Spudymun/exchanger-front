# Урок 2.3: Server и Client Components

> **🎯 Цель урока**: Понять различия между серверными и клиентскими компонентами в App Router

## 📖 Введение

Представьте **ресторан**: **повар** (Server Component) готовит блюдо на кухне и подает готовое, а **официант** (Client Component) взаимодействует с гостями за столиком. В App Router Next.js компоненты также разделены - некоторые рендерятся на сервере, другие в браузере.

Это революционное изменение позволяет оптимизировать производительность и пользовательский опыт.

## 🔍 Основные различия

### Server Components (по умолчанию)

```typescript
// app/[locale]/exchange/page.tsx - Server Component
import { getExchangeRates } from '../../../lib/api';

export default async function ExchangePage() {
  // ✅ Выполняется на сервере
  const rates = await getExchangeRates();

  return (
    <div>
      <h1>Обмен криптовалют</h1>
      <ExchangeRatesList rates={rates} />
    </div>
  );
}
```

### Client Components (с 'use client')

```typescript
// src/components/exchange/ExchangeForm.tsx - Client Component
'use client';

import { useState } from 'react';

export function ExchangeForm() {
  // ✅ Выполняется в браузере
  const [amount, setAmount] = useState(0);

  const handleSubmit = () => {
    // Интерактивность только в клиенте
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Interactive form */}
    </form>
  );
}
```

## 📊 Сравнительная таблица

| Аспект              | Server Components | Client Components      |
| ------------------- | ----------------- | ---------------------- |
| **Рендеринг**       | На сервере        | В браузере             |
| **Интерактивность** | ❌ Нет            | ✅ Есть                |
| **State**           | ❌ Нет            | ✅ useState, useEffect |
| **API вызовы**      | ✅ Прямые         | ✅ Через fetch/tRPC    |
| **Bundle размер**   | ✅ Не включается  | ❌ Включается          |
| **SEO**             | ✅ Полностью      | ⚠️ Частично            |

## 🔧 Практические примеры из проекта

### 1. Server Component для данных

```typescript
// app/[locale]/exchange/page.tsx
import { getCurrencyList } from '../../../lib/api';
import { ExchangeContainer } from '../../../src/components/exchange/ExchangeContainer';

export default async function ExchangePage() {
  // ✅ Загружаем данные на сервере
  const currencies = await getCurrencyList();

  return (
    <div className="container mx-auto">
      {/* Передаем данные в клиентский компонент */}
      <ExchangeContainer currencies={currencies} />
    </div>
  );
}
```

### 2. Client Component для интерактивности

```typescript
// src/components/exchange/ExchangeContainer.tsx
'use client';

import { useState } from 'react';
import { Currency } from '@repo/exchange-core';

interface Props {
  currencies: Currency[];
}

export function ExchangeContainer({ currencies }: Props) {
  const [fromCurrency, setFromCurrency] = useState(currencies[0]);
  const [toCurrency, setToCurrency] = useState(currencies[1]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CurrencySelector
        currencies={currencies}
        selected={fromCurrency}
        onChange={setFromCurrency}
      />
      <CurrencySelector
        currencies={currencies}
        selected={toCurrency}
        onChange={setToCurrency}
      />
    </div>
  );
}
```

## 🎯 Рекомендации по выбору типа

### ✅ Используйте Server Components для:

- **Загрузки данных** из API/БД
- **Статического контента** (заголовки, описания)
- **SEO критичных частей**
- **Секретных операций** (API ключи)

### ✅ Используйте Client Components для:

- **Интерактивных элементов** (формы, кнопки)
- **State management** (useState, useReducer)
- **Browser APIs** (localStorage, geolocation)
- **Event handlers** (onClick, onChange)

## 🔗 Композиция компонентов

### Паттерн "Server + Client"

```typescript
// app/[locale]/exchange/page.tsx - Server
export default async function ExchangePage() {
  const rates = await getExchangeRates();

  return (
    <div>
      {/* Server Component для SEO */}
      <ExchangeHeader rates={rates} />

      {/* Client Component для интерактивности */}
      <ExchangeForm initialRates={rates} />

      {/* Server Component для статики */}
      <ExchangeInfo />
    </div>
  );
}

// src/components/exchange/ExchangeHeader.tsx - Server
interface Props {
  rates: ExchangeRate[];
}

export function ExchangeHeader({ rates }: Props) {
  return (
    <header>
      <h1>Лучшие курсы обмена</h1>
      <p>Актуальный курс: {rates[0].rate}</p>
    </header>
  );
}

// src/components/exchange/ExchangeForm.tsx - Client
'use client';

export function ExchangeForm({ initialRates }: Props) {
  const [rates, setRates] = useState(initialRates);

  // Интерактивная логика
  return <form>{/* ... */}</form>;
}
```

## 📈 Производительность

### Server Components преимущества:

```typescript
// ✅ Не влияет на bundle размер клиента
import { heavyLibrary } from 'heavy-library';
import { databaseConnection } from './db';

export default async function DataPage() {
  // Тяжелые вычисления на сервере
  const data = await heavyLibrary.process(databaseConnection);

  return <DataDisplay data={data} />;
}
```

### Client Components оптимизация:

```typescript
'use client';

import dynamic from 'next/dynamic';

// ✅ Ленивая загрузка тяжелых компонентов
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Не рендерить на сервере
});

export function Dashboard() {
  return (
    <div>
      <LightweightHeader />
      <HeavyChart />
    </div>
  );
}
```

## ✅ Проверка знаний

1. **Вопрос**: Можно ли использовать useState в Server Component?

   <details>
   <summary>Ответ</summary>

   Нет, useState доступен только в Client Components. Server Components рендерятся на сервере где нет браузерного state.
   </details>

2. **Вопрос**: Как передать данные от Server к Client Component?

   <details>
   <summary>Ответ</summary>

   Через props. Server Component загружает данные и передает их Client Component как пропсы.
   </details>

3. **Задача**: Определите тип компонента для формы поиска с автокомплитом.

   <details>
   <summary>Ответ</summary>

   Client Component - нужна интерактивность (ввод текста, обработка событий, управление состоянием).
   </details>

## 🚀 Практическое задание

**Задание**: Найдите примеры Server и Client Components в проекте:

1. **Server Components**:

   ```bash
   grep -r "export default.*function" apps/web/app/ | head -5
   ```

2. **Client Components**:

   ```bash
   grep -r "'use client'" apps/web/src/ | head -5
   ```

3. **Изучите композицию**:
   ```bash
   cat apps/web/app/[locale]/exchange/page.tsx
   ```

## 📚 Дополнительные материалы

- [Server Components документация](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Client Components документация](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Composition Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)

---

[← Урок 2.2: Файловая система маршрутизации](./lesson-2.2-file-system-routing.md) | [Урок 2.4: Metadata API и SEO оптимизация →](./lesson-2.4-metadata-api.md)
