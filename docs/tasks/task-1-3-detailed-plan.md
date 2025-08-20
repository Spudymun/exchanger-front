# Task 1.3: Создание типов - Детальный план реализации

## 📋 Обзор задачи

**Цель**: Заменить старый ExchangeFormData на правильную структуру из acceptance criteria  
**Статус**: 🔴 К выполнению  
**Приоритет**: Высокий (блокирует остальные задачи)  
**Время выполнения**: 30 минут

## 🔍 Анализ существующей ситуации

### Старый ExchangeFormData (hooks/state/exchange-store.ts)

```ts
export interface ExchangeFormData {
  fromCurrency: CryptoCurrency | null;
  toCurrency: FiatCurrency | null;
  selectedBank: Bank | null;
  fromAmount: string;
  toAmount: string;
  recipientData: ExchangeRecipientData; // ❌ Усложненная структура
  userEmail: string;
  agreementAccepted: boolean;
}
```

**ПРОБЛЕМЫ:**

- Nullable поля (fromCurrency | null)
- Nested recipientData объект
- Отсутствие поддержки TokenStandard
- Отсутствие полей captcha и rememberData

### Новая структура из AC

```ts
interface ExchangeFormData {
  // БЕЗ "New" префикса!
  fromCurrency: CryptoCurrency;
  fromTokenStandard: TokenStandard;
  toCurrency: 'UAH';
  cryptoAmount: number;
  uahAmount: number;
  selectedBank: BankId;
  cardNumber: string;
  email: string;
  captchaAnswer: string;
  agreeToTerms: boolean;
  rememberData?: boolean;
}
```

## 📂 Что нужно сделать

### ШАГ 1: Создать недостающие типы (10 мин)

#### TokenStandard в constants/src/exchange-currencies.ts

```ts
// Добавить после существующих типов:
export type TokenStandard = 'ERC-20' | 'TRC-20' | 'BEP-20';
```

#### BankId в constants/src/banks.ts

```ts
// Добавить после существующих типов:
export type BankId = (typeof ALL_BANK_IDS)[number];
```

### ШАГ 2: Заменить ExchangeFormData (15 мин)

#### В packages/hooks/src/state/exchange-store.ts:

```ts
import type { CryptoCurrency, TokenStandard, BankId } from '@repo/constants';

export interface ExchangeFormData {
  fromCurrency: CryptoCurrency;
  fromTokenStandard: TokenStandard;
  toCurrency: 'UAH';
  cryptoAmount: number;
  uahAmount: number;
  selectedBank: BankId;
  cardNumber: string;
  email: string;
  captchaAnswer: string;
  agreeToTerms: boolean;
  rememberData?: boolean;
}
```

### ШАГ 3: Обновить DEFAULT_FORM_DATA (5 мин)

#### В packages/hooks/src/state/exchange-constants.ts:

```ts
export const DEFAULT_FORM_DATA: ExchangeFormData = {
  fromCurrency: 'USDT',
  fromTokenStandard: 'TRC-20',
  toCurrency: 'UAH',
  cryptoAmount: 0,
  uahAmount: 0,
  selectedBank: 'privatbank',
  cardNumber: '',
  email: '',
  captchaAnswer: '',
  agreeToTerms: false,
  rememberData: false,
};
```

## 🔧 Обновления в связанных файлах

### Обновить index.ts экспорты:

#### packages/constants/src/index.ts

```ts
// Добавить новые экспорты
export type { TokenStandard } from './exchange-currencies';
export type { BankId } from './banks';
```

## ✅ Критерии готовности

### Функциональные требования

- [ ] TokenStandard тип создан и экспортирован
- [ ] BankId тип создан и экспортирован
- [ ] ExchangeFormData заменен на новую структуру
- [ ] DEFAULT_FORM_DATA обновлен
- [ ] TypeScript компилируется без ошибок

### Технические требования

- [ ] Новая структура соответствует acceptance criteria
- [ ] Все экспорты обновлены
- [ ] Совместимость с useFormWithNextIntl

## 🎯 Результат

После выполнения:

- **Один правильный ExchangeFormData** вместо двух типов
- **Упрощенная плоская структура** без nested объектов
- **Поддержка всех полей** из acceptance criteria
- **Готовность к интеграции** с новой Exchange страницей

---

**Примечание**: Простое решение - заменить старый тип на правильный, без создания дублирующих названий.

## 📂 Что РЕАЛЬНО нужно создать

### ШАГ 1: Создать недостающие базовые типы (15 мин)

#### 1.1 TokenStandard в constants/src/exchange-currencies.ts

```ts
// Уже есть TOKEN_STANDARDS константа, нужен только тип:
export type TokenStandard = 'ERC-20' | 'TRC-20' | 'BEP-20';
```

#### 1.2 BankId в constants/src/banks.ts

```ts
// Уже есть ALL_BANK_IDS, нужен только тип:
export type BankId = (typeof ALL_BANK_IDS)[number];
```

### ШАГ 2: Создать NewExchangeFormData (15 мин)

#### Местоположение: packages/exchange-core/src/types/new-exchange.ts

```ts
import type { CryptoCurrency } from '@repo/constants';
import type { TokenStandard, BankId } from '@repo/constants';

export interface NewExchangeFormData {
  fromCurrency: CryptoCurrency;
  fromTokenStandard: TokenStandard;
  toCurrency: 'UAH';
  cryptoAmount: number;
  uahAmount: number;
  selectedBank: BankId;
  cardNumber: string;
  email: string;
  captchaAnswer: string;
  agreeToTerms: boolean;
  rememberData?: boolean;
}
```

### ШАГ 3: Создать validation schemas (15 мин)

#### Местоположение: packages/utils/src/validation/new-exchange-validation.ts

```ts
import { z } from 'zod';

export const newExchangeFormSchema = z.object({
  fromCurrency: z.enum(['BTC', 'ETH', 'USDT', 'LTC']),
  fromTokenStandard: z.enum(['ERC-20', 'TRC-20', 'BEP-20']),
  toCurrency: z.literal('UAH'),
  cryptoAmount: z.number().min(10).max(50000),
  uahAmount: z.number().min(400).max(2000000),
  selectedBank: z.string(),
  cardNumber: z.string().min(16).max(19),
  email: z.string().email(),
  captchaAnswer: z.string().min(1),
  agreeToTerms: z.boolean().refine(val => val === true),
  rememberData: z.boolean().optional(),
});
```

## 🔧 Интеграция с существующей архитектурой

### Обновить index.ts файлы:

#### 1. packages/constants/src/index.ts

```ts
// Добавить новые экспорты
export type { TokenStandard, BankId } from './exchange-currencies';
export type { BankId } from './banks';
```

#### 2. packages/exchange-core/src/types/index.ts

```ts
// Добавить
export * from './new-exchange';
```

#### 3. packages/utils/src/validation/index.ts

```ts
// Добавить
export * from './new-exchange-validation';
```

## ✅ Критерии готовности

### Функциональные требования

- [ ] TokenStandard тип создан в constants
- [ ] BankId тип создан в constants
- [ ] NewExchangeFormData интерфейс создан в exchange-core
- [ ] newExchangeFormSchema создан в utils
- [ ] Все типы экспортированы через index.ts

### Технические требования

- [ ] TypeScript компилируется без ошибок
- [ ] Новые типы не конфликтуют с существующими
- [ ] Соблюдена архитектура constants → utils → exchange-core
- [ ] Типы соответствуют acceptance criteria

### Качество кода

- [ ] Типы документированы с JSDoc комментариями
- [ ] Следуют naming conventions проекта
- [ ] Совместимость с useFormWithNextIntl

## 🎯 Интеграция с планом задач

После выполнения Task 1.3:

- **Task 1.4**: Zustand store будет использовать NewExchangeFormData
- **Task 2.1**: Компоненты формы получат типизацию
- **Task 3.1**: API endpoints получат типизированные payloads

---

**Примечание**: Этот план основан на анализе существующей кодовой базы и интегрируется с текущей архитектурой проекта.
