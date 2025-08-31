# Урок 3.1: Архитектура типов в монорепозитории

> **🎯 Цель урока**: Понять как организована система типов в монорепозитории ExchangeGO и почему централизованный подход критически важен для больших проектов

## 📖 Введение: Почему типы нужно централизовать?

### 🏢 Аналогия с офисом

Представьте, что вы работаете в большой IT-компании с 5 отделами:

**Сценарий 1: Каждый отдел ведет свою документацию**

- Отдел разработки: "Пользователь имеет email и пароль"
- Отдел тестирования: "Пользователь имеет email, пароль и роль"
- Отдел поддержки: "Пользователь имеет имя, email и телефон"
- Отдел аналитики: "Пользователь имеет ID, email и дату регистрации"

**Результат**: Хаос! Никто не знает, что такое "пользователь" на самом деле.

**Сценарий 2: Единая система документооборота**

- Есть ОДИН документ "Что такое пользователь"
- Все отделы используют ОДНО определение
- При изменении обновляется ОДИН документ

**Результат**: Порядок и согласованность!

### 💻 Как это работает в коде

TypeScript типы в монорепозитории работают точно так же. Без централизации у нас хаос:

## 🤔 Проблема: Что происходит без централизации?

### 🎭 Ролевая игра: "Три разработчика, один тип"

**Персонажи:**

- 👨‍💻 **Алексей** - разработчик веб-приложения
- 👩‍💻 **Мария** - разработчик админ-панели
- 🧑‍💻 **Дмитрий** - разработчик UI-компонентов

**Ситуация:** Всем нужен тип "Валюта" для криптобиржи

---

**👨‍💻 Алексей думает:** "Мне нужен простой тип для отображения валют"

```typescript
// apps/web/src/types/currency.ts
interface Currency {
  code: string; // "BTC", "ETH"
  name: string; // "Bitcoin", "Ethereum"
}
```

**👩‍💻 Мария думает:** "Мне нужна дополнительная информация для админки"

```typescript
// apps/admin-panel/src/types/currency.ts
interface Currency {
  code: string;
  name: string;
  isActive: boolean; // Добавила поле для админки
  // Упс! Забыла синхронизировать с Алексеем
}
```

**🧑‍💻 Дмитрий думает:** "Мне нужен тип для UI компонентов"

```typescript
// packages/ui/src/types/currency.ts
interface Currency {
  symbol: string; // Упс! Назвал по-другому
  displayName: string; // И это тоже по-другому
  icon?: string; // Добавил иконку
}
```

### 💥 Что происходит дальше?

**Неделя 1:** Алексей пытается использовать компонент Дмитрия

```typescript
// ❌ ОШИБКА! TypeScript ругается
const currency = { code: "BTC", name: "Bitcoin" };
<CurrencyIcon currency={currency} />  // Ожидает symbol, а не code!
```

**Неделя 2:** Мария пытается переиспользовать код Алексея

```typescript
// ❌ ОШИБКА! Поле isActive отсутствует
const webCurrency: WebCurrency = adminCurrency; // Type mismatch!
```

**Неделя 3:** Нужно добавить новое поле во все типы

- Алексей обновляет свой файл ✅
- Мария обновляет свой файл ✅
- Дмитрий в отпуске ❌
- **Результат:** Проект не собирается!

### 🚨 Реальные проблемы в продакшене:

1. **🔄 Дублирование кода** - один тип в 3+ местах
2. **🔀 Рассинхронизация** - типы "расползаются" со временем
3. **💥 Ошибки интеграции** - компоненты не совместимы
4. **⏰ Потеря времени** - нужно искать и обновлять все копии
5. **🐛 Баги в продакшене** - разные части системы ожидают разные структуры

## ✅ Решение: Централизованная архитектура типов

### �️ Приинцип "Единого источника истины"

Представьте библиотеку с каталогом книг:

**❌ Плохо:** У каждого читателя свой список книг  
**✅ Хорошо:** Один общий каталог для всех

### 🎯 Как это работает в ExchangeGO

**Было (хаос):**

```
apps/web/types/currency.ts        ← 3 разных
apps/admin/types/currency.ts      ← определения
packages/ui/types/currency.ts     ← одного типа!
```

**Стало (порядок):**

```
packages/exchange-core/types/currency.ts  ← ОДИН источник истины
         ↑              ↑              ↑
    apps/web      apps/admin      packages/ui
    (импортирует) (импортирует)   (импортирует)
```

### 🏗️ Архитектура типов в ExchangeGO

```
📁 exchanger-front/
├── 📦 packages/
│   ├── 🎯 exchange-core/           # МОЗГ СИСТЕМЫ - бизнес-логика
│   │   └── src/types/
│   │       ├── currency.ts         # 💰 Типы валют
│   │       ├── order.ts            # 📋 Типы заявок
│   │       ├── transaction.ts      # 💸 Типы транзакций
│   │       ├── user.ts             # 👤 Типы пользователей
│   │       ├── auth.ts             # 🔐 Типы авторизации
│   │       └── index.ts            # 📤 Общий экспорт
│   │
│   ├── 🔧 constants/               # СПРАВОЧНИКИ
│   │   └── src/
│   │       ├── currencies.ts       # 📜 Список валют
│   │       └── limits.ts           # ⚖️ Лимиты обмена
│   │
│   └── 🎨 ui/                      # ИНТЕРФЕЙС
│       └── src/types/
│           └── component-props.ts  # 🧩 Типы компонентов
│
├── 🚀 apps/                        # ПРИЛОЖЕНИЯ
│   ├── web/                        # 👥 Клиентское приложение
│   ├── admin-panel/                # 🛠️ Админ-панель
│   └── docs/                       # 📚 Документация
```

### 🔄 Поток данных и типов

```
1. 🔧 constants     → Базовые константы (валюты, статусы)
        ↓
2. 🎯 exchange-core → Бизнес-типы (заявки, пользователи)
        ↓
3. 🎨 ui           → UI-типы (пропсы компонентов)
        ↓
4. 🚀 apps         → Специфичные типы приложений
```

## 🔍 Пошаговый разбор: Как это работает на практике

### 📚 Шаг 1: Создаем базовые константы

Начинаем с самого простого - списка поддерживаемых валют:

```typescript
// 📁 packages/constants/src/currencies.ts

// 🎯 ЕДИНСТВЕННОЕ место, где определяем список валют
export const CRYPTOCURRENCIES = ['BTC', 'ETH', 'USDT-TRC20', 'USDT-ERC20', 'TRX'] as const;

// 🔮 TypeScript магия: превращаем массив в union type
export type CryptoCurrency = (typeof CRYPTOCURRENCIES)[number];
// Результат: 'BTC' | 'ETH' | 'USDT-TRC20' | 'USDT-ERC20' | 'TRX'
```

**🤔 Почему `as const`?**

- Без `as const`: `string[]` (любая строка)
- С `as const`: `readonly ['BTC', 'ETH', ...]` (только эти строки)

### 📚 Шаг 2: Строим бизнес-типы на основе констант

```typescript
// 📁 packages/exchange-core/src/types/currency.ts
import { type CryptoCurrency } from '@repo/constants';

// 🔄 Re-export для удобства (можно импортировать отсюда)
export type { CryptoCurrency };

// 💰 Полная информация о валюте
export interface CurrencyInfo {
  symbol: CryptoCurrency; // ✅ Только валидные валюты!
  name: string; // "Bitcoin", "Ethereum"
  decimals: number; // 8 для BTC, 18 для ETH
  minAmount: number; // Минимальная сумма обмена
  maxAmount: number; // Максимальная сумма обмена
  isActive: boolean; // Доступна ли для обмена
}

// 📈 Курс обмена валюты
export interface ExchangeRate {
  currency: CryptoCurrency; // ✅ Тот же тип!
  usdRate: number; // Курс к доллару
  uahRate: number; // Курс к гривне
  commission: number; // Комиссия в %
  lastUpdated: Date; // Когда обновлялся курс
}
```

### 📚 Шаг 3: Используем в приложениях

**🎨 В UI компонентах:**

```typescript
// 📁 packages/ui/src/components/CurrencySelector.tsx
import { type CryptoCurrency } from '@repo/exchange-core';

interface CurrencySelectorProps {
  currencies: CryptoCurrency[];     // ✅ TypeScript знает все валюты
  selected: CryptoCurrency | null;
  onChange: (currency: CryptoCurrency) => void;
}

export function CurrencySelector({ currencies, selected, onChange }: CurrencySelectorProps) {
  return (
    <select
      value={selected ?? ''}
      onChange={(e) => onChange(e.target.value as CryptoCurrency)}
    >
      {currencies.map((currency) => (
        <option key={currency} value={currency}>
          {currency}  {/* TypeScript автодополнение работает! */}
        </option>
      ))}
    </select>
  );
}
```

**🌐 В веб-приложении:**

```typescript
// 📁 apps/web/src/pages/exchange.tsx
import { type CryptoCurrency, type CurrencyInfo } from '@repo/exchange-core';
import { CRYPTOCURRENCIES } from '@repo/constants';

export default function ExchangePage() {
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency>('BTC');

  // ✅ TypeScript проверяет, что 'BTC' действительно валидная валюта
  // ✅ Автодополнение покажет все доступные валюты

  return (
    <CurrencySelector
      currencies={CRYPTOCURRENCIES}
      selected={selectedCurrency}
      onChange={setSelectedCurrency}
    />
  );
}
```

### 🎭 Демонстрация: "До и После"

**❌ БЫЛО: Каждый сам за себя**

```typescript
// apps/web - свое определение
interface Currency {
  code: string;
  name: string;
}

// apps/admin - свое определение
interface Currency {
  code: string;
  name: string;
  isActive: boolean;
}

// packages/ui - свое определение
interface Currency {
  symbol: string;
  displayName: string;
}
```

**✅ СТАЛО: Единая система**

```typescript
// 🎯 Один источник истины
// packages/exchange-core/src/types/currency.ts
export interface CurrencyInfo {
  symbol: CryptoCurrency;
  name: string;
  decimals: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

// 🌐 Все импортируют одно и то же
// apps/web/src/components/ExchangeForm.tsx
import { type CurrencyInfo } from '@repo/exchange-core';

// 🛠️ apps/admin-panel/src/components/CurrencySettings.tsx
import { type CurrencyInfo } from '@repo/exchange-core';

// 🎨 packages/ui/src/components/CurrencyIcon.tsx
import { type CurrencyInfo } from '@repo/exchange-core';
```

### 🔄 Практический пример: Добавление новой валюты

**Задача:** Добавить поддержку Dogecoin (DOGE)

**❌ Старый способ (хаос):**

1. Найти ВСЕ места где определены валюты (3-5 файлов)
2. Обновить каждый файл отдельно
3. Надеяться, что ничего не забыли
4. Тестировать каждое приложение отдельно

**✅ Новый способ (порядок):**

```typescript
// 1️⃣ Обновляем ОДИН файл
// packages/constants/src/currencies.ts
export const CRYPTOCURRENCIES = [
  'BTC',
  'ETH',
  'USDT-TRC20',
  'USDT-ERC20',
  'TRX',
  'DOGE', // ← Добавили одну строчку
] as const;

// 2️⃣ ВСЕ приложения автоматически получают новый тип!
// TypeScript теперь знает про DOGE везде
```

**🎉 Результат:**

- ✅ Автодополнение работает во всех приложениях
- ✅ TypeScript проверяет корректность использования
- ✅ Одно изменение → обновление везде
- ✅ Невозможно забыть обновить какое-то место

## 🎯 Три золотых правила архитектуры типов

### 🥇 Правило 1: "Один источник истины" (Single Source of Truth)

**🎯 Принцип:** Каждый тип должен быть определен ТОЛЬКО в одном месте

```typescript
// ✅ ПРАВИЛЬНО - один источник
// packages/exchange-core/src/types/order.ts
export interface ExchangeOrder {
  id: string;
  fromCurrency: CryptoCurrency;
  toCurrency: 'UAH';
  amount: number;
  status: OrderStatus;
  createdAt: Date;
}
```

```typescript
// ❌ НЕПРАВИЛЬНО - дублирование
// apps/web/src/types/order.ts
interface Order {
  /* ... */
} // Копия 1

// apps/admin-panel/src/types/order.ts
interface ExchangeOrder {
  /* ... */
} // Копия 2

// packages/ui/src/types/order.ts
interface OrderData {
  /* ... */
} // Копия 3
```

**🤔 Как проверить себя:**

- Если вы копируете тип из одного файла в другой → ❌ нарушение
- Если вы создаете "похожий" тип → ❌ скорее всего нарушение
- Если тип используется в 2+ местах → ✅ должен быть централизован

### 🥈 Правило 2: "Слоистая архитектура" (Layered Architecture)

**🎯 Принцип:** Типы должны зависеть только от нижележащих слоев

```
🏗️ Архитектура зависимостей:

Layer 4: 🚀 apps          ← Может использовать все нижние слои
         ↑
Layer 3: 🎨 ui            ← Может использовать Layer 1-2
         ↑
Layer 2: 🎯 exchange-core ← Может использовать только Layer 1
         ↑
Layer 1: 🔧 constants     ← Не зависит ни от чего
```

**✅ Правильные зависимости:**

```typescript
// Layer 1: constants (база)
export const ORDER_STATUSES = ['pending', 'processing', 'completed'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Layer 2: exchange-core (бизнес-логика)
import { type OrderStatus } from '@repo/constants'; // ✅ Зависит от Layer 1
export interface ExchangeOrder {
  status: OrderStatus;
}

// Layer 3: ui (компоненты)
import { type ExchangeOrder } from '@repo/exchange-core'; // ✅ Зависит от Layer 2
export interface OrderCardProps {
  order: ExchangeOrder;
}

// Layer 4: apps (приложения)
import { type ExchangeOrder } from '@repo/exchange-core'; // ✅ Зависит от Layer 2
interface OrderPageState {
  orders: ExchangeOrder[];
}
```

**❌ Неправильные зависимости:**

```typescript
// ❌ constants зависит от exchange-core (нарушение!)
import { type ExchangeOrder } from '@repo/exchange-core';

// ❌ exchange-core зависит от ui (нарушение!)
import { type ButtonProps } from '@repo/ui';
```

### 🥉 Правило 3: "Правильные импорты" (Type Import Patterns)

**🎯 Принцип:** Импортируйте только то, что нужно, и правильным способом

```typescript
// ✅ ПРАВИЛЬНО - type-only импорт
import { type CryptoCurrency, type ExchangeOrder } from '@repo/exchange-core';

// ✅ ПРАВИЛЬНО - re-export для удобства
export type { CryptoCurrency } from '@repo/exchange-core';

// ✅ ПРАВИЛЬНО - импорт констант как значений
import { CRYPTOCURRENCIES } from '@repo/constants';

// ❌ НЕПРАВИЛЬНО - value импорт для типов
import { CryptoCurrency } from '@repo/exchange-core'; // Может добавить runtime код

// ❌ НЕПРАВИЛЬНО - импорт всего подряд
import * as ExchangeCore from '@repo/exchange-core'; // Тяжелый импорт
```

**🔍 Как различать:**

- **Типы** (interfaces, type aliases) → `import { type ... }`
- **Константы** (массивы, объекты) → `import { ... }`
- **Функции** → `import { ... }`

## 🔧 Инструменты для работы с типами

### TypeScript Project References

```json
// packages/exchange-core/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

```json
// apps/web/tsconfig.json
{
  "references": [{ "path": "../../packages/exchange-core" }, { "path": "../../packages/constants" }]
}
```

### Barrel Exports для удобства

```typescript
// packages/exchange-core/src/types/index.ts
export * from './auth';
export * from './currency';
export * from './order';
export * from './transaction';
export * from './user';
```

```typescript
// Удобный импорт
import { type CryptoCurrency, type ExchangeOrder, type UserProfile } from '@repo/exchange-core';
```

## 💡 Реальные примеры из проекта

### Пример 1: Типы для формы обмена

```typescript
// packages/exchange-core/src/types/order.ts
export interface CreateOrderRequest {
  fromCurrency: CryptoCurrency;
  toCurrency: 'UAH';
  amount: number;
  userEmail: string;
  userPhone: string;
  cardNumber: string;
}

export interface CreateOrderResponse {
  orderId: string;
  estimatedAmount: number;
  exchangeRate: number;
  commission: number;
  deadline: Date;
}
```

### Пример 2: Использование в tRPC

```typescript
// apps/web/src/server/trpc/routers/exchange.ts
import { type CreateOrderRequest, type CreateOrderResponse } from '@repo/exchange-core';

export const exchangeRouter = router({
  createOrder: publicProcedure
    .input(createOrderRequestSchema) // Zod схема на основе типа
    .output(createOrderResponseSchema)
    .mutation(async ({ input }): Promise<CreateOrderResponse> => {
      // TypeScript знает типы input и возвращаемого значения
      const order = await createExchangeOrder(input);
      return order;
    }),
});
```

### Пример 3: Использование в React компонентах

```typescript
// apps/web/src/components/ExchangeForm.tsx
import { type CreateOrderRequest } from '@repo/exchange-core';

interface ExchangeFormProps {
  onSubmit: (data: CreateOrderRequest) => Promise<void>;
}

export function ExchangeForm({ onSubmit }: ExchangeFormProps) {
  const [formData, setFormData] = useState<Partial<CreateOrderRequest>>({});

  const handleSubmit = () => {
    // TypeScript проверяет что все поля заполнены
    onSubmit(formData as CreateOrderRequest);
  };

  return (/* JSX */);
}
```

## 🧠 Проверка понимания

### 🎯 Интерактивный квиз

#### Вопрос 1: Диагностика проблемы

**Ситуация:** Разработчик Иван создал тип `User` в трех местах:

- `apps/web/src/types/user.ts`
- `apps/admin/src/types/user.ts`
- `packages/ui/src/types/user.ts`

**Что произойдет через месяц?**

**A)** Все будет работать отлично  
**B)** Типы рассинхронизируются и будут ошибки  
**C)** TypeScript автоматически синхронизирует типы

<details>
<summary>🔍 Показать ответ и объяснение</summary>

**Правильный ответ: B**

**Почему:** Через месяц каждый разработчик будет обновлять "свой" тип независимо. Результат:

- В web добавят поле `avatar: string`
- В admin добавят поле `role: UserRole`
- В ui забудут обновить вообще

**Решение:** Создать ОДИН тип в `packages/exchange-core/src/types/user.ts`

</details>

#### Вопрос 2: Архитектурное решение

**Задача:** Нужно создать тип для кнопки, которая показывает статус заявки.

**Где правильно разместить этот тип?**

**A)** `packages/constants/` - там все константы  
**B)** `packages/exchange-core/` - там бизнес-логика  
**C)** `packages/ui/` - это UI компонент

<details>
<summary>🔍 Показать ответ и объяснение</summary>

**Правильный ответ: C**

**Почему:** Это тип для UI компонента (пропсы кнопки), значит место в `packages/ui/`.

**Правильная архитектура:**

```typescript
// packages/exchange-core/src/types/order.ts
export interface ExchangeOrder {
  status: OrderStatus;
}

// packages/ui/src/types/component-props.ts
import { type ExchangeOrder } from '@repo/exchange-core';
export interface OrderStatusButtonProps {
  order: ExchangeOrder; // ✅ Использует бизнес-тип
  onClick: () => void; // ✅ UI-специфичное поведение
}
```

</details>

#### Вопрос 3: Импорты

**Какой импорт правильный для TypeScript типа?**

**A)** `import { CryptoCurrency } from '@repo/exchange-core';`  
**B)** `import { type CryptoCurrency } from '@repo/exchange-core';`  
**C)** `import * as Types from '@repo/exchange-core';`

<details>
<summary>🔍 Показать ответ и объяснение</summary>

**Правильный ответ: B**

**Почему:**

- **A** - может импортировать runtime код (увеличит bundle)
- **B** - ✅ type-only импорт (не влияет на bundle)
- **C** - импортирует ВСЕ (тяжело и неэффективно)

**Правило:** Для типов всегда используйте `import { type ... }`

</details>

### 🛠️ Практическое задание

#### Задание 1: Создание системы типов для уведомлений

**Контекст:** В ExchangeGO нужна система уведомлений для пользователей.

**Требования:**

- Типы уведомлений: `'info' | 'success' | 'warning' | 'error'`
- Поля: `id`, `type`, `title`, `message`, `createdAt`, `isRead`
- Должно использоваться в web, admin и ui

**Ваша задача:** Создайте правильную архитектуру типов

<details>
<summary>💡 Показать решение</summary>

```typescript
// 1️⃣ Шаг 1: Константы
// packages/constants/src/notifications.ts
export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// 2️⃣ Шаг 2: Бизнес-типы
// packages/exchange-core/src/types/notification.ts
import { type NotificationType } from '@repo/constants';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

// 3️⃣ Шаг 3: Экспорт
// packages/exchange-core/src/types/index.ts
export * from './notification';

// 4️⃣ Шаг 4: UI типы
// packages/ui/src/types/component-props.ts
import { type Notification } from '@repo/exchange-core';

export interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

// 5️⃣ Шаг 5: Использование в приложениях
// apps/web/src/components/NotificationList.tsx
import { type Notification } from '@repo/exchange-core';
import { type NotificationCardProps } from '@repo/ui';
```

**✅ Проверка правильности:**

- ✅ Константы в `constants`
- ✅ Бизнес-типы в `exchange-core`
- ✅ UI типы в `ui`
- ✅ Правильные зависимости между слоями
- ✅ Type-only импорты

</details>

#### Задание 2: Рефакторинг дублированных типов

**Проблема:** Найдены дублированные типы в проекте:

```typescript
// apps/web/src/types/payment.ts
interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank';
}

// apps/admin/src/types/payment.ts
interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'crypto'; // Добавили crypto
  isActive: boolean; // Добавили isActive
}
```

**Задача:** Исправьте архитектуру

<details>
<summary>💡 Показать решение</summary>

```typescript
// 1️⃣ Создаем константы
// packages/constants/src/payments.ts
export const PAYMENT_TYPES = ['card', 'bank', 'crypto'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

// 2️⃣ Создаем единый тип
// packages/exchange-core/src/types/payment.ts
import { type PaymentType } from '@repo/constants';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentType;
  isActive: boolean;
}

// 3️⃣ Удаляем дублированные файлы
// ❌ Удаляем apps/web/src/types/payment.ts
// ❌ Удаляем apps/admin/src/types/payment.ts

// 4️⃣ Обновляем импорты везде
// apps/web/src/components/PaymentSelector.tsx
import { type PaymentMethod } from '@repo/exchange-core';

// apps/admin/src/components/PaymentSettings.tsx
import { type PaymentMethod } from '@repo/exchange-core';
```

**🎯 Результат:**

- ✅ Один источник истины
- ✅ Все приложения используют актуальную версию
- ✅ Новые поля автоматически доступны везде

</details>

## 📚 Дополнительные материалы

### Официальная документация

- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [TypeScript Modules](https://www.typescriptlang.org/docs/handbook/modules.html)

### Best Practices

- [TypeScript Deep Dive - Project Structure](https://basarat.gitbook.io/typescript/project/project-structure)
- [Monorepo TypeScript Setup](https://turbo.build/repo/docs/handbook/linting/typescript)

### Инструменты

- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)
- [Turborepo TypeScript Configuration](https://turbo.build/repo/docs/handbook/linting/typescript)

## 🎯 Ключевые выводы урока

### 💡 Что вы теперь знаете:

1. **🏛️ Принцип "Единого источника истины"**
   - Каждый тип определяется ТОЛЬКО в одном месте
   - Все остальные файлы импортируют этот тип
   - Изменение в одном месте → обновление везде

2. **🏗️ Слоистая архитектура типов**

   ```
   apps (Layer 4)           ← Специфичные типы приложений
      ↑
   ui (Layer 3)             ← UI компоненты и их пропсы
      ↑
   exchange-core (Layer 2)  ← Бизнес-логика и основные типы
      ↑
   constants (Layer 1)      ← Базовые константы и перечисления
   ```

3. **📦 Правильная организация пакетов**
   - `constants` → базовые константы (валюты, статусы)
   - `exchange-core` → бизнес-типы (заявки, пользователи)
   - `ui` → типы компонентов (пропсы, состояния)
   - `apps` → специфичные типы приложений

4. **🔗 Правильные импорты**
   - Типы: `import { type TypeName } from '...'`
   - Константы: `import { CONSTANT_NAME } from '...'`
   - Функции: `import { functionName } from '...'`

### 🚀 Практические навыки:

- ✅ Умеете диагностировать проблемы дублированных типов
- ✅ Знаете как правильно организовать архитектуру типов
- ✅ Понимаете принципы зависимостей между пакетами
- ✅ Можете создавать централизованные системы типов

### 🎪 Аналогия для запоминания:

**Типы в монорепо = Библиотечная система**

- 📚 `constants` = Каталог книг (что есть в библиотеке)
- 🏛️ `exchange-core` = Главное хранилище книг
- 🎨 `ui` = Читальный зал (как книги используются)
- 🏠 `apps` = Домашние библиотеки (специфичные коллекции)

**Правило:** Все берут книги из одного места, никто не создает копии!

---

[← Назад к главе](./README.md) | [Урок 3.2: Общие типы в exchange-core →](./lesson-3.2-exchange-core-types.md)
