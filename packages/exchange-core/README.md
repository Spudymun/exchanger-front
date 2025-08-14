# @repo/exchange-core

Основной пакет бизнес-логики для ExchangeGO - украинской криптовалютной биржи, специализирующейся на односторонних обменах криптовалют в UAH.

## 🎯 Обзор

Пакет предоставляет:

- ✅ **Строгая типизация** - TypeScript-first подход с полным покрытием типов
- ✅ **Централизованная бизнес-логика** - единое место для core функций обмена
- ✅ **Архитектурная совместимость** - интеграция с `@repo/constants` и `@repo/utils`
- ✅ **Mock Data Management** - готовые данные для разработки и тестирования
- ✅ **Валидация и безопасность** - комплексная проверка входных данных
- ✅ **Документированные API** - JSDoc документация с примерами использования

## 🏗️ Архитектура пакета

### Структура файлов

```
packages/exchange-core/src/
├── index.ts                    # Главные экспорты пакета
├── types/                      # Типы бизнес-доменов
│   ├── index.ts               # Centralized type exports
│   ├── auth.ts                # Аутентификация и сессии
│   ├── contact.ts             # Контактные данные получателей
│   ├── currency.ts            # Криптовалютные типы
│   ├── fiat.ts                # Фиатные валюты и банки
│   ├── order.ts               # Заказы и их жизненный цикл
│   ├── transaction.ts         # Транзакции и их статусы
│   └── user.ts                # Пользователи и роли
├── utils/                      # Утилиты бизнес-логики
│   ├── access-validators.ts   # Валидация доступа и ролей
│   ├── calculations.ts        # Математические вычисления
│   ├── composite-validators.ts # Комплексная валидация форм
│   ├── crypto.ts              # Криптовалютные операции
│   ├── data-sanitizers.ts     # Очистка и нормализация данных
│   └── type-guards.ts         # Type narrowing functions
├── services/                   # Сервисы без побочных эффектов
│   ├── index.ts               # Service exports
│   ├── crypto-address-generation.ts # Генерация адресов
│   └── id-generation.ts       # Генерация уникальных ID
└── data/                       # Mock data и управление данными
    ├── index.ts               # Data manager exports
    ├── manager.ts             # CRUD операции для mock данных
    ├── mock-data.ts           # Базовые mock данные
    └── mock-factory.ts        # Фабрики для создания тестовых данных
```

### Принципы архитектуры

Согласно **CODE_STYLE_GUIDE.md** и **VALIDATION_ARCHITECTURE_GUIDE.md**:

- **Pure Functions** - утилиты без побочных эффектов
- **Централизация типов** - использование `@repo/constants` для всех констант
- **Zod Integration** - валидация через схемы из `@repo/utils`
- **Single Responsibility** - каждый модуль имеет четкую ответственность

## 📚 Основные модули

### 🔧 Types

Строго типизированные интерфейсы для всех бизнес-доменов:

```typescript
import {
  type CryptoCurrency,
  type Order,
  type User,
  type ExchangeRate,
  type RecipientData,
} from '@repo/exchange-core';

// Создание заказа
const orderRequest: CreateOrderRequest = {
  email: 'user@example.com',
  cryptoAmount: 0.001,
  currency: 'BTC',
  uahAmount: 1755.0,
  recipientData: {
    cardNumber: '5168742345671234',
    bankDetails: 'ПриватБанк',
    recipientName: 'Іван Петренко',
    phone: '+380501234567',
  },
};
```

### 🧮 Calculations

Математические вычисления с комиссиями и курсами:

```typescript
import { calculateUahAmount, calculateCryptoAmount, getExchangeRate } from '@repo/exchange-core';

// Получение курса
const btcRate = getExchangeRate('BTC');
console.log(btcRate.uahRate); // 1755000

// Расчет суммы в UAH
const uahAmount = calculateUahAmount(0.001, 'BTC');
console.log(uahAmount); // 1720.95 (с учетом комиссии)

// Расчет криптовалютной суммы
const cryptoAmount = calculateCryptoAmount(1000, 'BTC');
console.log(cryptoAmount); // 0.00058064 BTC
```

### 🔐 Crypto Operations

Операции с криптовалютными адресами и валидацией:

```typescript
import {
  generateDepositAddress,
  validateCryptoAddress,
  getTransactionExplorerUrl,
} from '@repo/exchange-core';

// Генерация адреса для депозита
const btcAddress = generateDepositAddress('BTC');
console.log(btcAddress); // "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"

// Валидация адреса
const isValid = validateCryptoAddress(btcAddress, 'BTC');
console.log(isValid); // true

// URL для просмотра транзакции
const explorerUrl = getTransactionExplorerUrl('abc123def456', 'BTC');
console.log(explorerUrl); // "https://blockstream.info/tx/abc123def456"
```

### ✅ Validation System

Комплексная валидация с использованием Zod схем:

```typescript
import { validateRecipientData, isAuthenticatedUser, sanitizeOrderData } from '@repo/exchange-core';

// Валидация данных получателя
const recipientValidation = validateRecipientData({
  cardNumber: '5168742345671234',
  bankDetails: 'ПриватБанк',
  recipientName: 'Іван Петренко',
  phone: '+380501234567',
});

if (recipientValidation.success) {
  console.log('Данные корректны:', recipientValidation.data);
} else {
  console.log('Ошибки:', recipientValidation.errors);
}

// Type guards для пользователей
const user = getUser();
if (isAuthenticatedUser(user)) {
  // TypeScript знает, что user.sessionId существует
  console.log('Session ID:', user.sessionId);
}
```

### 📊 Data Management

Mock данные и CRUD операции для разработки:

```typescript
import {
  userManager,
  orderManager,
  statsManager,
  createMockUser,
  createMockOrder,
} from '@repo/exchange-core';

// Создание пользователя
const newUser = await userManager.create({
  email: 'test@example.com',
  password: 'SecurePassword123!',
});

// Получение заказов
const userOrders = await orderManager.getByUserId(newUser.id);

// Создание mock данных
const mockUser = createMockUser({
  email: 'mock@example.com',
  role: 'user',
});

const mockOrder = createMockOrder({
  currency: 'BTC',
  cryptoAmount: 0.001,
  status: 'pending',
});
```

## 🚀 Installation

Пакет автоматически доступен в монорепозитории через workspace dependencies:

```json
{
  "dependencies": {
    "@repo/exchange-core": "*"
  }
}
```

## 📖 Usage

### Базовое использование

```typescript
import {
  // Types
  type Order,
  type User,
  type CryptoCurrency,

  // Calculations
  calculateUahAmount,
  getExchangeRate,

  // Crypto operations
  generateDepositAddress,
  validateCryptoAddress,

  // Validation
  validateRecipientData,
  isAuthenticatedUser,

  // Data management
  userManager,
  orderManager,
} from '@repo/exchange-core';
```

### Создание полного flow обмена

```typescript
// 1. Получение курса
const exchangeRate = getExchangeRate('BTC');

// 2. Расчет суммы
const cryptoAmount = 0.001;
const uahAmount = calculateUahAmount(cryptoAmount, 'BTC');

// 3. Генерация адреса
const depositAddress = generateDepositAddress('BTC');

// 4. Создание заказа
const order = await orderManager.create({
  email: 'user@example.com',
  cryptoAmount,
  currency: 'BTC',
  uahAmount,
  recipientData: {
    cardNumber: '5168742345671234',
    bankDetails: 'ПриватБанк',
    recipientName: 'Іван Петренко',
    phone: '+380501234567',
  },
});

console.log('Заказ создан:', order.id);
console.log('Адрес для депозита:', order.depositAddress);
```

## 🔧 Development

### Type Checking

```bash
# Проверка типов
npm run check-types

# Build пакета
npm run build
```

### Testing

```bash
# Запуск тестов (с fallback)
npm run test
```

## 📋 Dependencies

### Runtime Dependencies

- **`@repo/constants`** - Централизованные бизнес-константы
- **`@repo/utils`** - Валидационные схемы и утилиты

### Dev Dependencies

- **`@repo/typescript-config`** - Общие настройки TypeScript

## 🎯 Best Practices

### ✅ Рекомендуется

```typescript
// ✅ Используйте типы из пакета
import { type Order, type CryptoCurrency } from '@repo/exchange-core';

// ✅ Проверяйте валидность перед использованием
const validation = validateRecipientData(data);
if (validation.success) {
  processOrder(validation.data);
}

// ✅ Используйте type guards
if (isAuthenticatedUser(user)) {
  // TypeScript автоматически сузит тип
  console.log(user.sessionId);
}

// ✅ Используйте централизованные константы
import { CRYPTOCURRENCIES } from '@repo/constants';
const supportedCurrencies: CryptoCurrency[] = CRYPTOCURRENCIES;
```

### ❌ Не рекомендуется

```typescript
// ❌ Не создавайте собственные типы для существующих доменов
interface MyOrder {
  /* дублирование */
}

// ❌ Не обходите валидацию
const order = data as Order; // Небезопасно

// ❌ Не используйте магические константы
if (currency === 'BTC') {
  /* используйте константы */
}

// ❌ Не импортируйте внутренние модули напрямую
import { calculateCommission } from '@repo/exchange-core/src/utils/calculations';
```

## 📈 Performance

### Bundle Size Optimization

- ✅ **Tree-shakeable exports** - импортируйте только необходимые функции
- ✅ **Pure functions** - все утилиты кешируются автоматически
- ✅ **Type-only imports** для интерфейсов

```typescript
// ✅ Оптимальный импорт
import type { Order } from '@repo/exchange-core';
import { calculateUahAmount } from '@repo/exchange-core';

// ❌ Импорт всего пакета
import * as ExchangeCore from '@repo/exchange-core';
```

## 🐛 Troubleshooting

### Распространенные проблемы

#### TypeScript ошибки

```bash
# Очистка кеша TypeScript
npx tsc --build --clean

# Проверка типов
npm run check-types
```

#### Проблемы с валидацией

```typescript
// Проверьте схему валидации
import { recipientDataSchema } from '@repo/utils';
const result = recipientDataSchema.safeParse(data);
console.log(result.error?.issues);
```

#### Проблемы с mock данными

```bash
# Убедитесь, что константы доступны
npm ls @repo/constants

# Проверьте импорты
import { MOCK_CRYPTO_ADDRESSES } from '@repo/constants';
```

## 🚨 Migration Notes

### От предыдущих версий

- **v0.0.1**: Базовая архитектура с централизованными типами
- Все типы теперь используют `@repo/constants`
- Валидация мигрирована на Zod схемы из `@repo/utils`
- Улучшена JSDoc документация с примерами

## 📚 Связанная документация

- **[Constants Package](../constants/README.md)** - Бизнес-константы и типы
- **[Utils Package](../utils/README.md)** - Валидационные схемы и утилиты
- **[DEVELOPER_GUIDE.md](../../docs/DEVELOPER_GUIDE.md)** - Общее руководство разработчика
- **[VALIDATION_ARCHITECTURE_GUIDE.md](../../docs/VALIDATION_ARCHITECTURE_GUIDE.md)** - Архитектура валидации
- **[CODE_STYLE_GUIDE.md](../../docs/CODE_STYLE_GUIDE.md)** - Стандарты кода

## 📄 License

Private monorepo package - not for external distribution.

---

Built with ❤️ for ExchangeGO cryptocurrency exchange platform.
