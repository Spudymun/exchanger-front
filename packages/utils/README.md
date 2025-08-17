# @repo/utils

Централизованная ├── validation/ # Модульная система валидации
├── index.ts # Экспорты validation подсистемы
├── zod-helpers.ts # Централизованные Zod utilities
├── constants.ts # Константы валидациилиотека утилитарных функций для ExchangeGO монорепозитория. Предоставляет чистые функции без побочных эффектов для валидации, форматирования, вычислений и управления состоянием.

## 🎯 Обзор

Пакет предоставляет:

- ✅ **Pure Functions** - утилиты без побочных эффектов
- ✅ **Type Safety** - строгая TypeScript типизация
- ✅ **🛡️ Security-Enhanced Validation** - валидация с встроенной XSS protection
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
├── validation-schemas.ts       # 🚨 LEGACY schemas (DEPRECATED)
└── validation/                 # 🛡️ Security-Enhanced Validation System
    ├── index.ts               # Экспорты validation подсистемы
    ├── constants.ts           # Константы валидации
    ├── core.ts                # Ядро валидационной системы
    ├── field-validation.ts    # Валидация отдельных полей
    ├── handlers.ts            # Обработчики validation events
    ├── hooks.ts               # React hooks для validation
    ├── schema-helpers.ts      # Помощники для Zod схем
    ├── zod-helpers.ts         # Централизованные Zod utilities
    ├── security-utils.ts      # 🛡️ XSS protection utilities
    ├── single-field.ts        # Single-field validation
    ├── validation-utils.ts    # Общие validation utilities
    │
    ├── 📁 Building Blocks (базовые схемы)
    ├── schemas-basic.ts       # Базовые схемы (email, password, username)
    ├── schemas-crypto.ts      # Криптовалютные схемы (currency, addresses)
    │
    └── 📁 Security-Enhanced Schemas (🛡️ XSS Protected)
        ├── security-enhanced-schemas.ts    # Основные security-enhanced schemas
        ├── security-enhanced-operator.ts   # Операторские schemas
        └── security-enhanced-utils.ts      # Утилитарные security schemas
```

### 🛡️ Security-Enhanced Architecture

**Новая архитектура** основана на принципах безопасности:

- **Building Blocks** - базовые схемы без XSS рисков (`emailSchema`, `currencySchema`)
- **Security-Enhanced Schemas** - композитные схемы с XSS protection для форм
- **XSS Protection** - автоматическая защита всех text input полей
- **Legacy Deprecation** - старые schemas помечены как DEPRECATED

### Принципы архитектуры

Согласно **CODE_STYLE_GUIDE.md** и **Security-Enhanced principles**:

- **Security First** - все новые формы используют security-enhanced schemas
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

### ✅ Security-Enhanced Validation System

Современная система валидации с встроенной XSS protection:

```typescript
// 🛡️ Security-Enhanced Schemas - используй для всех новых форм
import {
  securityEnhancedLoginSchema,
  securityEnhancedCreateExchangeOrderSchema,
  securityEnhancedCreateTicketSchema,
} from '@repo/utils';

// ✅ Базовые building blocks (для композиции)
import { emailSchema, passwordSchema, currencySchema } from '@repo/utils';

// ✅ Утилиты валидации
import {
  validateWithZodSchema,
  validateWithZodSchemaUI,
  createXSSProtectedString,
} from '@repo/utils';

// Для форм с XSS protection
const loginForm = useFormWithNextIntl({
  validationSchema: securityEnhancedLoginSchema, // ✅ Защищён от XSS
  t: useTranslations('LoginForm'),
});

// Для бизнес-логики (ValidationResult)
const emailValidation = validateWithZodSchema(emailSchema, 'user@example.com');

// Для UI компонентов (boolean + error)
const validation = validateWithZodSchemaUI(securityEnhancedLoginSchema, formData);
```

### ⚠️ Legacy Validation (DEPRECATED)

```typescript
// ❌ НЕ используй legacy schemas без security enhancement
import {
  loginSchema, // DEPRECATED - уязвимо к XSS!
  createOrderSchema, // DEPRECATED - нет XSS protection!
} from '@repo/utils/validation-schemas';

// 📚 Используй Security-Enhanced Validation Guide для миграции
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

## 🌐 Internationalization & Security-Enhanced Validation

Полная поддержка next-intl с security-enhanced validation:

```typescript
import { useFormWithNextIntl } from '@repo/hooks';
import { securityEnhancedCreateTicketSchema } from '@repo/utils';

// 🛡️ Security-Enhanced форма с i18n
const form = useFormWithNextIntl({
  validationSchema: securityEnhancedCreateTicketSchema, // XSS protected
  t: useTranslations('CreateTicketForm'),
  initialValues: {
    subject: '',
    description: '',
    priority: 'MEDIUM',
  },
  onSubmit: async values => {
    // values автоматически защищены от XSS
    await createTicket(values);
  },
});
```

### Legacy Validation (DEPRECATED)

```typescript
// ❌ DEPRECATED: Legacy validation без XSS protection
import { useNextIntlValidation } from '@repo/utils';

const { validation, errors } = useNextIntlValidation({
  schema: createOrderSchema, // DEPRECATED - уязвимо к XSS!
  data: formData,
  locale: 'ru',
});

// 📚 Миграция: используй securityEnhancedCreateExchangeOrderSchema
```

## 🔧 Installation

Пакет является частью монорепозитория:

```bash
# В корне монорепозитория
npm install
```

## 📖 Usage Examples

### 🛡️ Security-Enhanced Validation

```typescript
import {
  securityEnhancedLoginSchema,
  securityEnhancedCreateExchangeOrderSchema,
  validateWithZodSchema,
  validateWithZodSchemaUI,
} from '@repo/utils';

// ✅ Security-Enhanced валидация для форм
const loginData = { email: 'test@example.com', password: 'SecurePass123!' };
const loginResult = validateWithZodSchema(securityEnhancedLoginSchema, loginData);

if (!loginResult.isValid) {
  console.error('Validation errors:', loginResult.errors);
}

// ✅ UI validation для компонентов
const exchangeResult = validateWithZodSchemaUI(securityEnhancedCreateExchangeOrderSchema, formData);

if (!exchangeResult.isValid) {
  setError(exchangeResult.error);
}
```

### Basic Building Blocks Validation

```typescript
import { emailSchema, currencySchema, validateWithZodSchema } from '@repo/utils';

// ✅ Базовые схемы для building blocks (безопасны)
const emailResult = validateWithZodSchema(emailSchema, 'user@example.com');
const currencyResult = validateWithZodSchema(currencySchema, 'BTC');

// ✅ Для композиции в security-enhanced schemas
const customSchema = z.object({
  email: emailSchema, // Базовая схема ОК
  currency: currencySchema, // Базовая схема ОК
  comment: createXSSProtectedString(0, 500), // XSS protected поле
});
```

### ❌ Legacy Validation (DEPRECATED)

```typescript
// ❌ НЕ используй legacy schemas без security enhancement
import { validateCryptoAmountWithZod, validateUahAmountWithZod } from '@repo/utils';

// ❌ DEPRECATED methods - ищи security-enhanced альтернативы
const cryptoResult = validateCryptoAmountWithZod('1.234'); // DEPRECATED
const uahResult = validateUahAmountWithZod('1000.50'); // DEPRECATED

// 📚 Миграция: используй securityEnhancedCreateExchangeOrderSchema
// для полных form schemas с XSS protection
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
// 🛡️ Security-Enhanced Schemas (основные)
export {
  securityEnhancedLoginSchema,
  securityEnhancedCreateExchangeOrderSchema,
  securityEnhancedCreateTicketSchema,
  // ... другие security-enhanced schemas
} from './validation/security-enhanced-schemas';

// 🛡️ XSS Protection утилиты
export { createXSSProtectedString, containsPotentialXSS } from './validation/security-utils';

// ✅ Building Blocks (базовые схемы)
export { emailSchema, passwordSchema, usernameSchema } from './validation/schemas-basic';
export { currencySchema, btcAddressSchema, ethAddressSchema } from './validation/schemas-crypto';

// ✅ Validation утилиты
export { validateWithZodSchema, validateWithZodSchemaUI } from './validation/zod-helpers';

// ❌ Legacy (DEPRECATED)
export { createValidationResult, mergeValidationResults } from './validation-helpers';
export { useNextIntlValidation } from './next-intl-validation'; // DEPRECATED
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
- ✅ **🛡️ Security-Enhanced Validation** с XSS protection
- ✅ **Centralized patterns** для избежания дублирования
- ✅ **Professional documentation** с практичными примерами
- ✅ **Architectural compliance** с принципами монорепозитория

## 📚 Документация

### 🛡️ Security & Validation

- **[Security-Enhanced Validation Guide](../../docs/SECURITY_ENHANCED_VALIDATION_GUIDE.md)** - **ОБЯЗАТЕЛЬНО** Руководство по security-enhanced schemas
- **[Validation & Localization Guide](../../docs/VALIDATION_LOCALIZATION_GUIDE.md)** - интеграция с next-intl
- **[Validation Architecture Guide](../../docs/VALIDATION_ARCHITECTURE_GUIDE.md)** - архитектурные принципы

### 🏗️ Architecture

- **[Architecture Guide](../../docs/ARCHITECTURE.md)** - общая архитектура проекта
- **[Developer Guide](../../docs/DEVELOPER_GUIDE.md)** - руководство разработчика

**💡 Начни с Security-Enhanced Validation Guide - это обязательно для всех разработчиков!**

---

**Готов для production использования с enterprise-grade безопасностью! 🚀**
