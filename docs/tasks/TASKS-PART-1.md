# 🚀 ExchangeGO Development Tasks - Part 1: Foundation & Core

**Дата создания:** 29 июня 2025  
**Статус:** В разработке  
**Покрытие:** Фундаментальная архитектура, константы, core-логика

---

## 📋 Общая информация

### Принципы разбиения задач:

- ✅ **Одна сессия = одна задача** (1-2 часа)
- ✅ **Production-ready подход** с самого начала
- ✅ **Все edge cases** покрыты в каждой задаче
- ✅ **Детальные чек-листы** для контроля качества

### Мок-данные стратегия:

- **JSON файлы** для хранения данных
- **Статичные тестовые крипто-адреса**
- **Консольный вывод** для email уведомлений
- **tRPC моки** внутри процедур

---

## 🏗️ PHASE 1: PROJECT FOUNDATION

### TASK 1.1: Создать exchange-core пакет с базовой архитектурой

**Время:** 1.5 часа  
**Приоритет:** 🔴 Критический

#### Описание

Создать новый пакет `packages/exchange-core/` с базовой структурой для всей бизнес-логики ExchangeGO.

#### Технические требования

```
packages/exchange-core/
├── src/
│   ├── types/
│   │   ├── index.ts           # Экспорт всех типов
│   │   ├── currency.ts        # Типы криптовалют
│   │   ├── order.ts           # Типы заявок
│   │   └── user.ts            # Типы пользователей
│   ├── utils/
│   │   ├── index.ts           # Экспорт утилит
│   │   ├── calculations.ts    # Расчеты курсов/комиссий
│   │   └── validation.ts      # Валидация данных
│   ├── constants/
│   │   └── index.ts           # Локальные константы
│   └── index.ts               # Главный экспорт
├── package.json
├── tsconfig.json
└── README.md
```

#### Реализация

1. **Создать package.json**

```json
{
  "name": "@repo/exchange-core",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@repo/constants": "workspace:*",
    "@repo/utils": "workspace:*"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*"
  }
}
```

2. **Типы криптовалют (src/types/currency.ts)**

```typescript
import { CRYPTOCURRENCIES } from '@repo/constants';

export type CryptoCurrency = (typeof CRYPTOCURRENCIES)[number];

export interface CurrencyInfo {
  symbol: CryptoCurrency;
  name: string;
  decimals: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

export interface ExchangeRate {
  currency: CryptoCurrency;
  usdRate: number;
  uahRate: number;
  commission: number;
  lastUpdated: Date;
}
```

3. **Типы заявок (src/types/order.ts)**

```typescript
import { ORDER_STATUSES } from '@repo/constants';
import type { CryptoCurrency } from './currency';

export type OrderStatus = keyof typeof ORDER_STATUSES;

export interface CreateOrderRequest {
  email: string;
  cryptoAmount: number;
  currency: CryptoCurrency;
  uahAmount: number;
  recipientData?: {
    cardNumber?: string;
    bankDetails?: string;
  };
}

export interface Order {
  id: string;
  email: string;
  cryptoAmount: number;
  currency: CryptoCurrency;
  uahAmount: number;
  status: OrderStatus;
  depositAddress: string;
  recipientData?: {
    cardNumber?: string;
    bankDetails?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  txHash?: string;
}
```

4. **Типы пользователей (src/types/user.ts)**

```typescript
export interface User {
  id: string;
  email: string;
  hashedPassword?: string;
  sessionId?: string;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface CreateUserRequest {
  email: string;
  password?: string;
  sessionId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
```

#### Юзкейсы и Edge Cases

1. **Валидация типов**
   - ✅ Все типы строго типизированы
   - ✅ Использование констант из @repo/constants
   - ✅ Опциональные поля правильно типизированы

2. **Расширяемость**
   - ✅ Интерфейсы легко расширяются
   - ✅ Типы поддерживают будущие криптовалюты
   - ✅ Статусы заявок легко добавляются

#### Чек-лист готовности

- [ ] Пакет создан в packages/exchange-core/
- [ ] package.json настроен с правильными зависимостями
- [ ] Все типы экспортированы из src/index.ts
- [ ] TypeScript компилируется без ошибок
- [ ] Типы импортируются в других пакетах
- [ ] README.md документирует основные типы

---

### TASK 1.2: Расширить @repo/constants для ExchangeGO

**Время:** 1 час  
**Приоритет:** 🔴 Критический

#### Описание

Добавить все необходимые константы для ExchangeGO в существующий пакет @repo/constants.

#### Файлы для создания/обновления

1. **packages/constants/src/exchange.ts**

```typescript
// Поддерживаемые криптовалюты
export const CRYPTOCURRENCIES = ['BTC', 'ETH', 'USDT', 'LTC'] as const;

// Лимиты сумм (в USD эквиваленте)
export const AMOUNT_LIMITS = {
  MIN_USD: 10,
  MAX_USD: 5000,
} as const;

// Статусы заявок
export const ORDER_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Конфигурация статусов для UI
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Ожидание оплаты',
    color: 'warning' as const,
    icon: 'clock',
    description: 'Переведите криптовалюту на указанный адрес',
  },
  paid: {
    label: 'Оплачено',
    color: 'info' as const,
    icon: 'check-circle',
    description: 'Платеж получен, заявка в обработке',
  },
  processing: {
    label: 'В обработке',
    color: 'info' as const,
    icon: 'loader',
    description: 'Обрабатывается оператором',
  },
  completed: {
    label: 'Выполнено',
    color: 'success' as const,
    icon: 'check-circle-2',
    description: 'Средства переведены на ваш счет',
  },
  cancelled: {
    label: 'Отменено',
    color: 'destructive' as const,
    icon: 'x-circle',
    description: 'Заявка отменена',
  },
} as const;

// Комиссии (в процентах)
export const COMMISSION_RATES = {
  BTC: 2.5,
  ETH: 2.0,
  USDT: 1.5,
  LTC: 2.0,
} as const;

// Тестовые адреса для мока
export const MOCK_CRYPTO_ADDRESSES = {
  BTC: [
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    '1JVqz1z2DnGrNhyzsZ1mGV8rQqQrWjRJNJ',
  ],
  ETH: [
    '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
    '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
  ],
  USDT: [
    '0xdac17f958d2ee523a2206206994597c13d831ec7',
    '0xa0b86a33e6e306e33b7b1b61e3d2be6f8f7e4d1c',
    '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
  ],
  LTC: [
    'LTC1qaw6gqgx7h5p2f8mh9dwmf6v3f3qg6g8y6h3h4',
    'LTC1q5k8j4h3k2j1f9g8h7j6k5l4m3n2o1p0q9r8',
    'LTC1qz8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2',
  ],
} as const;
```

2. **packages/constants/src/rate-limits.ts**

```typescript
// Rate limiting конфигурация
export const RATE_LIMITS = {
  CREATE_ORDER: {
    points: 3,
    duration: 3600, // 1 час
    blockDuration: 3600,
  },
  REGISTER: {
    points: 5,
    duration: 86400, // 24 часа
    blockDuration: 86400,
  },
  LOGIN: {
    points: 10,
    duration: 900, // 15 минут
    blockDuration: 900,
  },
  RESET_PASSWORD: {
    points: 3,
    duration: 3600, // 1 час
    blockDuration: 3600,
  },
} as const;

// Ошибки rate limiting
export const RATE_LIMIT_MESSAGES = {
  CREATE_ORDER: 'Превышен лимит создания заявок. Попробуйте через час.',
  REGISTER: 'Превышен лимит регистраций. Попробуйте завтра.',
  LOGIN: 'Слишком много попыток входа. Попробуйте через 15 минут.',
  RESET_PASSWORD: 'Превышен лимит сброса пароля. Попробуйте через час.',
} as const;
```

3. **packages/constants/src/validation.ts**

```typescript
// Валидационные ограничения
export const VALIDATION_LIMITS = {
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  ORDER_ID_LENGTH: 36,
  CRYPTO_ADDRESS_MAX_LENGTH: 100,
  CARD_NUMBER_LENGTH: 16,
} as const;

// Regex паттерны
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  CARD_NUMBER: /^\d{16}$/,
  CRYPTO_AMOUNT: /^\d+(\.\d{1,8})?$/,
  UAH_AMOUNT: /^\d+(\.\d{1,2})?$/,
} as const;

// Сообщения валидации
export const VALIDATION_MESSAGES = {
  EMAIL_INVALID: 'Некорректный email адрес',
  EMAIL_REQUIRED: 'Email обязателен',
  PASSWORD_WEAK:
    'Пароль должен содержать минимум 8 символов, включая заглавную букву, строчную букву и цифру',
  PASSWORD_REQUIRED: 'Пароль обязателен',
  AMOUNT_TOO_LOW: `Минимальная сумма: $${AMOUNT_LIMITS.MIN_USD}`,
  AMOUNT_TOO_HIGH: `Максимальная сумма: $${AMOUNT_LIMITS.MAX_USD}`,
  AMOUNT_INVALID: 'Некорректная сумма',
  CURRENCY_INVALID: 'Неподдерживаемая криптовалюта',
  CARD_NUMBER_INVALID: 'Некорректный номер карты',
} as const;
```

4. **Обновить packages/constants/src/index.ts**

```typescript
// Существующие экспорты
export * from './api';
export * from './business';
export * from './ui';
export * from './validation';

// Новые экспорты для ExchangeGO
export * from './exchange';
export * from './rate-limits';
```

#### Юзкейсы и Edge Cases

1. **Криптовалюты**
   - ✅ Поддержка 4 основных криптовалют
   - ✅ Легкое добавление новых валют
   - ✅ Тестовые адреса для каждой валюты

2. **Статусы заявок**
   - ✅ Полный жизненный цикл заявки
   - ✅ UI конфигурация для каждого статуса
   - ✅ Понятные описания для пользователей

3. **Rate Limiting**
   - ✅ Защита от спама заявок
   - ✅ Защита от брутфорса аутентификации
   - ✅ Дифференцированные лимиты

4. **Валидация**
   - ✅ Безопасные паттерны
   - ✅ Понятные сообщения об ошибках
   - ✅ Поддержка украинских реалий

#### Чек-лист готовности

- [ ] Все файлы созданы в packages/constants/src/
- [ ] Константы экспортированы из главного index.ts
- [ ] TypeScript компилируется без ошибок
- [ ] Константы можно импортировать в других пакетах
- [ ] Все статусы заявок имеют UI конфигурацию
- [ ] Валидационные сообщения на украинском языке

---

### TASK 1.3: Создать exchange-core утилиты и валидацию

**Время:** 2 часа  
**Приоритет:** 🔴 Критический

#### Описание

Реализовать core утилиты для расчетов, валидации и работы с криптовалютами.

#### Реализация

1. **packages/exchange-core/src/utils/calculations.ts**

```typescript
import { COMMISSION_RATES, AMOUNT_LIMITS } from '@repo/constants';
import type { CryptoCurrency, ExchangeRate } from '../types';

// Мок курсы (в реальном приложении будут браться с API)
const MOCK_RATES: Record<CryptoCurrency, ExchangeRate> = {
  BTC: {
    currency: 'BTC',
    usdRate: 45000,
    uahRate: 1800000, // 45000 * 40 (примерный курс UAH/USD)
    commission: COMMISSION_RATES.BTC,
    lastUpdated: new Date(),
  },
  ETH: {
    currency: 'ETH',
    usdRate: 3000,
    uahRate: 120000,
    commission: COMMISSION_RATES.ETH,
    lastUpdated: new Date(),
  },
  USDT: {
    currency: 'USDT',
    usdRate: 1,
    uahRate: 40,
    commission: COMMISSION_RATES.USDT,
    lastUpdated: new Date(),
  },
  LTC: {
    currency: 'LTC',
    usdRate: 100,
    uahRate: 4000,
    commission: COMMISSION_RATES.LTC,
    lastUpdated: new Date(),
  },
};

/**
 * Получить текущий курс криптовалюты
 */
export function getExchangeRate(currency: CryptoCurrency): ExchangeRate {
  return MOCK_RATES[currency];
}

/**
 * Рассчитать сумму в UAH с учетом комиссии
 */
export function calculateUahAmount(cryptoAmount: number, currency: CryptoCurrency): number {
  const rate = getExchangeRate(currency);
  const grossAmount = cryptoAmount * rate.uahRate;
  const commission = grossAmount * (rate.commission / 100);
  return Number((grossAmount - commission).toFixed(2));
}

/**
 * Рассчитать сумму криптовалюты из UAH
 */
export function calculateCryptoAmount(uahAmount: number, currency: CryptoCurrency): number {
  const rate = getExchangeRate(currency);
  const grossAmount = uahAmount / (1 - rate.commission / 100);
  const cryptoAmount = grossAmount / rate.uahRate;

  // Округление до 8 знаков для криптовалют
  return Number(cryptoAmount.toFixed(8));
}

/**
 * Рассчитать комиссию в UAH
 */
export function calculateCommission(cryptoAmount: number, currency: CryptoCurrency): number {
  const rate = getExchangeRate(currency);
  const grossAmount = cryptoAmount * rate.uahRate;
  const commission = grossAmount * (rate.commission / 100);
  return Number(commission.toFixed(2));
}

/**
 * Проверить, что сумма в пределах лимитов
 */
export function isAmountWithinLimits(
  cryptoAmount: number,
  currency: CryptoCurrency
): { isValid: boolean; reason?: string } {
  const usdAmount = cryptoAmount * getExchangeRate(currency).usdRate;

  if (usdAmount < AMOUNT_LIMITS.MIN_USD) {
    return {
      isValid: false,
      reason: `Минимальная сумма: $${AMOUNT_LIMITS.MIN_USD}`,
    };
  }

  if (usdAmount > AMOUNT_LIMITS.MAX_USD) {
    return {
      isValid: false,
      reason: `Максимальная сумма: $${AMOUNT_LIMITS.MAX_USD}`,
    };
  }

  return { isValid: true };
}

/**
 * Получить информацию о лимитах для криптовалюты
 */
export function getCurrencyLimits(currency: CryptoCurrency) {
  const rate = getExchangeRate(currency);
  return {
    minCrypto: AMOUNT_LIMITS.MIN_USD / rate.usdRate,
    maxCrypto: AMOUNT_LIMITS.MAX_USD / rate.usdRate,
    minUSD: AMOUNT_LIMITS.MIN_USD,
    maxUSD: AMOUNT_LIMITS.MAX_USD,
  };
}
```

2. **packages/exchange-core/src/utils/validation.ts**

```typescript
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES, CRYPTOCURRENCIES } from '@repo/constants';
import type { CryptoCurrency, CreateOrderRequest, CreateUserRequest } from '../types';
import { isAmountWithinLimits } from './calculations';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Валидация email
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push(VALIDATION_MESSAGES.EMAIL_REQUIRED);
  } else if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
    errors.push(VALIDATION_MESSAGES.EMAIL_INVALID);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Валидация пароля
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push(VALIDATION_MESSAGES.PASSWORD_REQUIRED);
  } else if (!VALIDATION_PATTERNS.PASSWORD.test(password)) {
    errors.push(VALIDATION_MESSAGES.PASSWORD_WEAK);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Валидация криптовалюты
 */
export function validateCurrency(currency: string): ValidationResult {
  const errors: string[] = [];

  if (!CRYPTOCURRENCIES.includes(currency as CryptoCurrency)) {
    errors.push(VALIDATION_MESSAGES.CURRENCY_INVALID);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Валидация суммы криптовалюты
 */
export function validateCryptoAmount(amount: number, currency: CryptoCurrency): ValidationResult {
  const errors: string[] = [];

  if (!amount || amount <= 0) {
    errors.push(VALIDATION_MESSAGES.AMOUNT_INVALID);
  } else {
    const limitCheck = isAmountWithinLimits(amount, currency);
    if (!limitCheck.isValid && limitCheck.reason) {
      errors.push(limitCheck.reason);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Валидация создания заявки
 */
export function validateCreateOrder(request: CreateOrderRequest): ValidationResult {
  const errors: string[] = [];

  // Валидация email
  const emailValidation = validateEmail(request.email);
  errors.push(...emailValidation.errors);

  // Валидация криптовалюты
  const currencyValidation = validateCurrency(request.currency);
  errors.push(...currencyValidation.errors);

  // Валидация суммы
  if (currencyValidation.isValid) {
    const amountValidation = validateCryptoAmount(request.cryptoAmount, request.currency);
    errors.push(...amountValidation.errors);
  }

  // Валидация номера карты (если указан)
  if (request.recipientData?.cardNumber) {
    if (!VALIDATION_PATTERNS.CARD_NUMBER.test(request.recipientData.cardNumber)) {
      errors.push(VALIDATION_MESSAGES.CARD_NUMBER_INVALID);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Валидация создания пользователя
 */
export function validateCreateUser(request: CreateUserRequest): ValidationResult {
  const errors: string[] = [];

  // Валидация email
  const emailValidation = validateEmail(request.email);
  errors.push(...emailValidation.errors);

  // Валидация пароля (если указан)
  if (request.password) {
    const passwordValidation = validatePassword(request.password);
    errors.push(...passwordValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Санитизация email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Генерация безопасного session ID
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Генерация ID заявки
 */
export function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

3. **packages/exchange-core/src/utils/crypto.ts**

```typescript
import { MOCK_CRYPTO_ADDRESSES } from '@repo/constants';
import type { CryptoCurrency } from '../types';

/**
 * Получить случайный адрес для депозита (мок)
 */
export function generateDepositAddress(currency: CryptoCurrency): string {
  const addresses = MOCK_CRYPTO_ADDRESSES[currency];
  const randomIndex = Math.floor(Math.random() * addresses.length);
  return addresses[randomIndex];
}

/**
 * Валидация формата крипто-адреса (базовая проверка)
 */
export function validateCryptoAddress(address: string, currency: CryptoCurrency): boolean {
  switch (currency) {
    case 'BTC':
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
    case 'ETH':
    case 'USDT':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'LTC':
      return /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(address);
    default:
      return false;
  }
}

/**
 * Получить explorer URL для транзакции
 */
export function getTransactionExplorerUrl(txHash: string, currency: CryptoCurrency): string {
  const explorers = {
    BTC: 'https://blockchair.com/bitcoin/transaction',
    ETH: 'https://etherscan.io/tx',
    USDT: 'https://etherscan.io/tx',
    LTC: 'https://blockchair.com/litecoin/transaction',
  };

  return `${explorers[currency]}/${txHash}`;
}

/**
 * Получить название сети для криптовалюты
 */
export function getNetworkName(currency: CryptoCurrency): string {
  const networks = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USDT: 'Ethereum (ERC-20)',
    LTC: 'Litecoin',
  };

  return networks[currency];
}
```

4. **Обновить packages/exchange-core/src/index.ts**

```typescript
// Типы
export * from './types';

// Утилиты
export * from './utils/calculations';
export * from './utils/validation';
export * from './utils/crypto';

// Константы (реэкспорт для удобства)
export {
  CRYPTOCURRENCIES,
  ORDER_STATUSES,
  ORDER_STATUS_CONFIG,
  COMMISSION_RATES,
  AMOUNT_LIMITS,
  RATE_LIMITS,
  VALIDATION_MESSAGES,
} from '@repo/constants';
```

#### Юзкейсы и Edge Cases

1. **Расчеты**
   - ✅ Точные расчеты с учетом комиссий
   - ✅ Правильное округление для криптовалют
   - ✅ Проверка лимитов в USD эквиваленте
   - ✅ Обработка граничных значений

2. **Валидация**
   - ✅ Комплексная валидация заявок
   - ✅ Безопасные regex паттерны
   - ✅ Понятные сообщения об ошибках
   - ✅ Санитизация входных данных

3. **Крипто-утилиты**
   - ✅ Генерация адресов из пула
   - ✅ Базовая валидация адресов
   - ✅ Поддержка blockchain explorers
   - ✅ Информация о сетях

#### Чек-лист готовности

- [ ] Все утилиты созданы в packages/exchange-core/src/utils/
- [ ] Функции покрывают все бизнес-сценарии
- [ ] TypeScript компилируется без ошибок
- [ ] Все функции экспортированы из главного index.ts
- [ ] Расчеты дают правильные результаты
- [ ] Валидация отклоняет некорректные данные
- [ ] Мок-данные реалистичны

---

### TASK 1.4: Создать мок-данные и JSON хранилище

**Время:** 1 час  
**Приоритет:** 🟡 Важный

#### Описание

Создать JSON файлы для хранения мок-данных и утилиты для работы с ними.

#### Реализация

1. **packages/exchange-core/src/data/users.json**

```json
{
  "users": [
    {
      "id": "user_1",
      "email": "test@example.com",
      "hashedPassword": "$2b$10$example_hash",
      "isVerified": true,
      "createdAt": "2025-06-29T10:00:00.000Z",
      "lastLoginAt": "2025-06-29T10:00:00.000Z"
    },
    {
      "id": "user_2",
      "email": "admin@exchangego.com",
      "hashedPassword": "$2b$10$example_hash_admin",
      "isVerified": true,
      "createdAt": "2025-06-29T10:00:00.000Z",
      "lastLoginAt": "2025-06-29T10:00:00.000Z"
    }
  ]
}
```

2. **packages/exchange-core/src/data/orders.json**

```json
{
  "orders": [
    {
      "id": "order_1703847600000_abc123",
      "email": "test@example.com",
      "cryptoAmount": 0.001,
      "currency": "BTC",
      "uahAmount": 1755.0,
      "status": "completed",
      "depositAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "recipientData": {
        "cardNumber": "1234567890123456"
      },
      "createdAt": "2025-06-29T10:00:00.000Z",
      "updatedAt": "2025-06-29T12:00:00.000Z",
      "processedAt": "2025-06-29T12:00:00.000Z",
      "txHash": "example_tx_hash_123"
    },
    {
      "id": "order_1703847660000_def456",
      "email": "test@example.com",
      "cryptoAmount": 1.0,
      "currency": "ETH",
      "uahAmount": 117600.0,
      "status": "processing",
      "depositAddress": "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe",
      "createdAt": "2025-06-29T11:00:00.000Z",
      "updatedAt": "2025-06-29T11:30:00.000Z"
    }
  ]
}
```

3. **packages/exchange-core/src/data/manager.ts**

```typescript
import usersData from './users.json';
import ordersData from './orders.json';
import type { User, Order } from '../types';
import { generateOrderId, generateSessionId } from '../utils/validation';

// In-memory хранилище (в реальном приложении будет база данных)
let users: User[] = usersData.users.map(u => ({
  ...u,
  createdAt: new Date(u.createdAt),
  lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : undefined,
}));

let orders: Order[] = ordersData.orders.map(o => ({
  ...o,
  createdAt: new Date(o.createdAt),
  updatedAt: new Date(o.updatedAt),
  processedAt: o.processedAt ? new Date(o.processedAt) : undefined,
}));

// Пользователи
export const userManager = {
  findByEmail: (email: string): User | undefined => {
    return users.find(u => u.email === email);
  },

  findById: (id: string): User | undefined => {
    return users.find(u => u.id === id);
  },

  create: (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const user: User = {
      id: `user_${Date.now()}`,
      createdAt: new Date(),
      ...userData,
    };
    users.push(user);
    return user;
  },

  update: (id: string, updates: Partial<User>): User | undefined => {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    users[index] = { ...users[index], ...updates };
    return users[index];
  },

  getAll: (): User[] => users,

  count: (): number => users.length,
};

// Заявки
export const orderManager = {
  findById: (id: string): Order | undefined => {
    return orders.find(o => o.id === id);
  },

  findByEmail: (email: string): Order[] => {
    return orders.filter(o => o.email === email);
  },

  create: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order => {
    const order: Order = {
      id: generateOrderId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...orderData,
    };
    orders.push(order);
    return order;
  },

  update: (id: string, updates: Partial<Order>): Order | undefined => {
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return undefined;

    orders[index] = {
      ...orders[index],
      ...updates,
      updatedAt: new Date(),
    };
    return orders[index];
  },

  getAll: (): Order[] => orders,

  getByStatus: (status: Order['status']): Order[] => {
    return orders.filter(o => o.status === status);
  },

  count: (): number => orders.length,

  getRecent: (limit: number = 10): Order[] => {
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  },
};

// Статистика
export const statsManager = {
  getTotalOrders: (): number => orders.length,

  getTotalUsers: (): number => users.length,

  getOrdersByStatus: () => {
    const stats: Record<string, number> = {};
    orders.forEach(order => {
      stats[order.status] = (stats[order.status] || 0) + 1;
    });
    return stats;
  },

  getTotalVolume: (): number => {
    return orders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + order.uahAmount, 0);
  },
};
```

#### Чек-лист готовности

- [ ] JSON файлы созданы с реалистичными данными
- [ ] Data manager предоставляет все необходимые методы
- [ ] Типы данных соответствуют интерфейсам
- [ ] Менеджер экспортирован из exchange-core
- [ ] Данные корректно преобразуются в/из JSON

---

## 📊 Статус Progress Part 1

### Завершенные задачи: 0/4

- [ ] TASK 1.1: Создать exchange-core пакет
- [ ] TASK 1.2: Расширить @repo/constants
- [ ] TASK 1.3: Создать exchange-core утилиты
- [ ] TASK 1.4: Создать мок-данные

### Следующие части:

- **TASKS-PART-2.md** - API Layer & tRPC
- **TASKS-PART-3.md** - Authentication & Security
- **TASKS-PART-4.md** - State Management & Hooks
- **TASKS-PART-5.md** - UI Components & Forms
- **TASKS-PART-6.md** - Pages & User Flow
- **TASKS-PART-7.md** - Admin Panel
- **TASKS-PART-8.md** - Testing & Quality
- **TASKS-PART-9.md** - Production Setup & Deployment

---

**Дата создания:** 29 июня 2025  
**Версия:** 1.0  
**Следующая часть:** TASKS-PART-2.md
