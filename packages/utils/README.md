# @repo/utils

Централизованная ├── validation/ # Модульная система валидации
├── index.ts # Экспорты validation подсистемы
├── zod-helpers.ts # Централизованные Zod utilities
├── constants.ts # Константы валидациилиотека утилитарных функций для ExchangeGO монорепозитория. Предоставляет чистые функции без побочных эффектов для валидации, форматирования, вычислений и управления состоянием.

## 🎯 Обзор

Пакет предоставляет:

- ✅ **Pure Functions** - утилиты без побочных эффектов
- ✅ **Type Safety** - строгая TypeScript типизация
- ✅ **Zod Integration** - централизованная система валидации
- ✅ **Next-intl Support** - полная интернационализация
- ✅ **Store Factory** - Zustand helpers с стандартизированной конфигурацией
- ✅ **Business Logic** - расчеты комиссий, форматирование валют

## 🏗️ Архитектура пакета

### Структура файлов

```
packages/utils/src/
├── index.ts                    # Главные экспорты пакета
├── calculations.ts             # Математические вычисления и комиссии
├── formatting.ts               # Форматирование для UI отображения
├── input-validation.ts         # Валидация пользовательского ввода
├── next-intl-validation.ts     # Адаптер валидации для next-intl
├── order-status.ts             # Утилиты для работы со статусами
├── order-utils.ts              # Помощники для заказов
├── scroll-utils.ts             # Управление скроллом
├── store-factory.ts            # Фабрика Zustand stores
├── trpc-errors.ts              # Генерация tRPC ошибок
├── validation-helpers.ts       # Базовые валидационные утилиты
├── validation-schemas.ts       # Zod схемы для всего проекта
└── validation/                 # Модульная система валидации
    ├── index.ts               # Экспорты validation подсистемы
    ├── zod-helpers.ts         # Централизованные Zod utilities (NEW)
    ├── constants.ts           # Константы валидации
    ├── core.ts                # Ядро валидационной системы
    ├── field-validation.ts    # Валидация отдельных полей
    ├── handlers.ts            # Обработчики validation events
    ├── hooks.ts               # React hooks для validation
    ├── schema-helpers.ts      # Помощники для Zod схем
    ├── schemas-basic.ts       # Базовые схемы (email, password)
    ├── schemas-composed.ts    # Композитные схемы
    ├── schemas-crypto.ts      # Криптовалютные схемы
    ├── schemas-utils.ts       # Утилитарные схемы
    ├── single-field.ts        # Single-field validation
    └── validation-utils.ts    # Общие validation utilities
```

### Принципы архитектуры

Согласно **CODE_STYLE_GUIDE.md**:

- **Utils** - чистые функции без побочных эффектов
- **Централизованные решения** предпочтительнее дублирования
- **Type Safety** - строгая типизация всех функций
- **Модульность** - логическое разделение по доменам

## 📚 Основные модули

### 🧮 Calculations

Математические вычисления и бизнес-логика:

```typescript
import { calculateCommissionAmount, calculateNetAmount } from '@repo/utils';

// Расчет комиссии
const commission = calculateCommissionAmount(1000, 0.02); // 20
const netAmount = calculateNetAmount(1000, 0.02); // 980
```

### 🎨 Formatting

Форматирование для UI отображения:

```typescript
import { formatCryptoAmountForUI, formatUahAmountForUI } from '@repo/utils';

// Форматирование валют
const crypto = formatCryptoAmountForUI(1.23456789, 'BTC'); // "1.234568 BTC"
const uah = formatUahAmountForUI(1234.56); // "1,234.56 ₴"
```

### ✅ Validation System

Централизованная система валидации с Zod:

```typescript
import {
  validateWithZodSchema,
  validateWithZodSchemaUI,
  emailSchema,
  cryptoAmountStringSchema,
} from '@repo/utils';

// Для бизнес-логики (ValidationResult)
const emailValidation = validateWithZodSchema(emailSchema, 'user@example.com');

// Для UI компонентов (boolean + error)
const amountValidation = validateWithZodSchemaUI(cryptoAmountStringSchema, '1.234');
```

### 🏪 Store Factory

Стандартизированная фабрика Zustand stores:

```typescript
import { createStore } from '@repo/utils';

interface MyStoreState {
  count: number;
  increment: () => void;
}

export const useMyStore = createStore<MyStoreState>('my-store', set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}));
```

### 📜 Scroll Utilities

Управление скроллом с поддержкой offset:

```typescript
import { scrollToElement, scrollToRef } from '@repo/utils';

// Скролл к элементу с отступом под fixed навигацию
scrollToElement(element, {
  offset: 80,
  behavior: 'smooth',
  block: 'center',
});

// Скролл по React ref
const headerRef = useRef<HTMLDivElement>(null);
scrollToRef(headerRef, { offset: 60 });
```

### 🏷️ Order Management

Утилиты для работы с заказами и статусами:

```typescript
import { getOrderStatusDisplayName, getOrderStatusColor, isOrderInProgress } from '@repo/utils';

const displayName = getOrderStatusDisplayName(orderStatus);
const statusColor = getOrderStatusColor(orderStatus);
const inProgress = isOrderInProgress(orderStatus);
```

## 🌐 Internationalization

Полная поддержка next-intl с validation адаптером:

```typescript
import { useNextIntlValidation } from '@repo/utils';

const { validation, errors } = useNextIntlValidation({
  schema: createOrderSchema,
  data: formData,
  locale: 'ru',
});
```

## 🔧 Installation

Пакет является частью монорепозитория:

```bash
# В корне монорепозитория
npm install
```

## 📖 Usage Examples

### Basic Validation

```typescript
import { validateCryptoAmountWithZod, validateUahAmountWithZod, emailSchema } from '@repo/utils';

// Валидация криптосуммы
const cryptoResult = validateCryptoAmountWithZod('1.234');
if (!cryptoResult.isValid) {
  console.error(cryptoResult.error);
}

// Валидация UAH суммы
const uahResult = validateUahAmountWithZod('1000.50');

// Валидация email с Zod
const emailResult = validateWithZodSchema(emailSchema, email);
```

### Advanced Store Usage

```typescript
import { createStore } from '@repo/utils';

interface ExchangeState {
  fromCurrency: CryptoCurrency;
  toCurrency: 'UAH';
  amount: string;
  updateAmount: (amount: string) => void;
  reset: () => void;
}

export const useExchangeStore = createStore<ExchangeState>(
  {
    name: 'exchange-store',
    version: 1,
    enableSubscriptions: true,
    enableDevtools: process.env.NODE_ENV === 'development',
  },
  set => ({
    fromCurrency: 'BTC',
    toCurrency: 'UAH',
    amount: '',
    updateAmount: amount => set({ amount }),
    reset: () => set({ fromCurrency: 'BTC', amount: '' }),
  })
);
```

### Input Validation Patterns

```typescript
import {
  validateNumericInput,
  validateCryptoAmountWithZod,
  formatCryptoAmountForUI,
} from '@repo/utils';

// В компоненте формы
const handleAmountChange = (value: string) => {
  // Базовая валидация ввода
  if (!validateNumericInput(value, { decimals: 8 })) {
    return;
  }

  // Zod валидация
  const validation = validateCryptoAmountWithZod(value);
  if (!validation.isValid) {
    setError(validation.error);
    return;
  }

  setAmount(value);
  setError(null);
};
```

## 🧪 Development

### Type Checking

```bash
npm run check-types
```

### Linting

```bash
npm run lint          # Standard linting
npm run lint:strict   # Strict mode with zero warnings
```

### Testing Integration

```typescript
// В тестах
import { validateWithZodSchema, emailSchema } from '@repo/utils';

test('email validation works correctly', () => {
  const result = validateWithZodSchema(emailSchema, 'test@example.com');
  expect(result.errors).toHaveLength(0);
});
```

## 🎯 Key Features

### ✅ Type Safety

- Полная TypeScript типизация всех функций
- Strict mode compatibility
- IntelliSense поддержка во всех IDE

### ✅ Performance

- Tree-shakeable exports для оптимизации bundle size
- Мемоизация где это уместно
- Ленивая загрузка validation схем

### ✅ Developer Experience

- Подробная JSDoc документация с примерами
- Consistent API across всех утилит
- Error messages на русском и английском

### ✅ Architecture Compliance

- Следует принципам CODE_STYLE_GUIDE.md
- DRY principle через centralized helpers
- Separation of concerns между модулями
- Backward compatibility при всех изменениях

## 🔗 Integration

### С другими пакетами

```typescript
// hooks пакет использует store factory
import { createStore } from '@repo/utils';

// exchange-core использует validation
import { validateWithZodSchema, emailSchema } from '@repo/utils';

// ui компоненты используют formatting
import { formatCryptoAmountForUI } from '@repo/utils';
```

### С внешними библиотеками

- **Zod** - для schema validation
- **Next-intl** - для интернационализации
- **Zustand** - для state management
- **React** - для hooks интеграции

## 📋 API Reference

### Validation Exports

```typescript
// Главные validation функции
export { validateWithZodSchema, validateWithZodSchemaUI } from './validation/zod-helpers';

// Validation schemas
export { emailSchema, passwordSchema } from './validation/schemas-basic';
export { cryptoAmountStringSchema, uahAmountStringSchema } from './validation/schemas-crypto';

// Validation helpers
export { createValidationResult, mergeValidationResults } from './validation-helpers';

// Next-intl integration
export { useNextIntlValidation } from './next-intl-validation';
```

### Formatting Exports

```typescript
export { formatCryptoAmountForUI, formatUahAmountForUI, formatPercentage } from './formatting';
```

### Calculation Exports

```typescript
export { calculateCommissionAmount, calculateNetAmount, calculatePercentage } from './calculations';
```

### Store Exports

```typescript
export { createStore, type StoreConfig } from './store-factory';
```

### Utility Exports

```typescript
export { scrollToElement, scrollToRef } from './scroll-utils';
export { createTRPCError } from './trpc-errors';
export { validateNumericInput } from './input-validation';
```

---

## 🏆 Quality Standards

Этот пакет следует высоким стандартам качества:

- ✅ **100% TypeScript** coverage
- ✅ **Centralized patterns** для избежания дублирования
- ✅ **Professional documentation** с практичными примерами
- ✅ **Architectural compliance** с принципами монорепозитория

**Готов для production использования! 🚀**
