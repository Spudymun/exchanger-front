# Task 1.3: Создание типов - ПЕРЕОСМЫСЛЕННЫЙ план реализации

## 📋 Обзор задачи

**Цель**: Создать недостающие типы TokenStandard, BankId и заменить ExchangeFormData на правильную структуру  
**Статус**: 🔴 К выполнению  
**Приоритет**: Высокий (блокирует остальные задачи)  
**Время выполнения**: 45 минут

## ✅ ПРОВЕРЕНО В РЕАЛЬНОМ КОДЕ

**Подтверждено анализом существующих компонентов:**

- `SendingCard.tsx` использует `tokenStandard` поле
- `ReceivingCard.tsx` использует `selectedBankId` поле
- `useHeroExchangeForm.ts` содержит соответствующую validation schema
- Типы TokenStandard и BankId ДЕЙСТВИТЕЛЬНО нужны

## 🔍 Анализ существующей ситуации

### ✅ ФАКТЫ ИЗ РЕАЛЬНОГО КОДА:

**1. TokenStandard НУЖЕН:**

- В `SendingCard.tsx`: `TokenStandardSelector` компонент существует
- В schema: `tokenStandard: z.string().optional()`
- Используется функция `getTokenStandards(currency)`

**2. BankId НУЖЕН:**

- В `ReceivingCard.tsx`: `BankSelector` компонент существует
- В schema: `selectedBankId: z.string().min(1)`
- Есть константа `ALL_BANK_IDS` но нет типа

**3. ExchangeFormData НЕПРАВИЛЬНЫЙ:**

```ts
// ТЕКУЩИЙ (проблемный):
export interface ExchangeFormData {
  fromCurrency: CryptoCurrency | null; // ❌ nullable
  toCurrency: FiatCurrency | null; // ❌ nullable
  selectedBank: Bank | null; // ❌ nullable + неправильный тип
  recipientData: ExchangeRecipientData; // ❌ nested объект
  // ❌ отсутствуют поля из AC
}
```

**4. НУЖНАЯ СТРУКТУРА (из анализа форм):**

```ts
// ПРАВИЛЬНЫЙ (из реального использования):
interface ExchangeFormData {
  fromCurrency: CryptoCurrency;
  tokenStandard: string; // ← используется в SendingCard
  toCurrency: 'UAH'; // ← всегда UAH в текущей форме
  cryptoAmount: number;
  uahAmount: number;
  selectedBankId: string; // ← используется в ReceivingCard
  cardNumber: string;
  email: string;
  captchaAnswer: string;
  agreeToTerms: boolean;
  rememberData?: boolean;
}
```

## 📂 ПЕРЕОСМЫСЛЕННЫЙ ПЛАН РЕАЛИЗАЦИИ

### ШАГ 1: Создать TokenStandard тип (10 мин)

**ОБОСНОВАНИЕ:** Используется в TokenStandardSelector компоненте

#### В packages/constants/src/exchange-currencies.ts:

```ts
// Добавить после существующих констант:
export type TokenStandard = 'ERC-20' | 'TRC-20' | 'BEP-20';
```

### ШАГ 2: Создать BankId тип (10 мин)

**ОБОСНОВАНИЕ:** Используется в BankSelector компоненте

#### В packages/constants/src/banks.ts:

```ts
// Добавить после ALL_BANK_IDS:
export type BankId = (typeof ALL_BANK_IDS)[number];
```

### ШАГ 3: Заменить ExchangeFormData (20 мин)

**ОБОСНОВАНИЕ:** Текущий интерфейс не соответствует реальному использованию

#### В packages/hooks/src/state/exchange-store.ts:

```ts
import type { CryptoCurrency, TokenStandard, BankId } from '@repo/constants';

// ЗАМЕНИТЬ существующий интерфейс:
export interface ExchangeFormData {
  fromCurrency: CryptoCurrency;
  tokenStandard: string; // string как в реальной схеме
  toCurrency: 'UAH';
  cryptoAmount: number; // number для вычислений
  uahAmount: number; // number для вычислений
  selectedBankId: string; // string как в реальной схеме
  cardNumber: string;
  email: string;
  captchaAnswer: string;
  agreeToTerms: boolean;
  rememberData?: boolean;
}
```

### ШАГ 4: Обновить DEFAULT_FORM_DATA (5 мин)

#### В packages/hooks/src/state/exchange-constants.ts:

```ts
export const DEFAULT_FORM_DATA: ExchangeFormData = {
  fromCurrency: 'USDT',
  tokenStandard: 'TRC-20', // default из constants
  toCurrency: 'UAH',
  cryptoAmount: 0,
  uahAmount: 0,
  selectedBankId: '', // пустая строка до выбора
  cardNumber: '',
  email: '',
  captchaAnswer: '',
  agreeToTerms: false,
  rememberData: false,
};
```

## 🔧 Обновления экспортов

### Обновить index.ts файлы:

#### packages/constants/src/index.ts

```ts
// Добавить новые экспорты:
export type { TokenStandard } from './exchange-currencies';
export type { BankId } from './banks';
```

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ

**1. tokenStandard vs fromTokenStandard:**

- В реальном коде используется `tokenStandard` (без "from")
- Следуем существующему naming convention

**2. selectedBankId vs selectedBank:**

- В реальном коде используется `selectedBankId: string`
- НЕ объект Bank, а строковый ID

**3. Amounts как numbers:**

- Для mathematical operations нужны numbers
- НЕ strings как в старом коде

## ✅ Критерии готовности

### Функциональные требования

- [ ] TokenStandard тип создан в exchange-currencies.ts
- [ ] BankId тип создан в banks.ts
- [ ] ExchangeFormData заменен на правильную структуру
- [ ] DEFAULT_FORM_DATA обновлен с правильными значениями
- [ ] Все экспорты добавлены в index.ts

### Технические требования

- [ ] TypeScript компилируется без ошибок
- [ ] Новая структура соответствует реальному использованию в формах
- [ ] Совместимость с существующими компонентами
- [ ] Follows existing naming conventions (tokenStandard, selectedBankId)

### Проверка интеграции

- [ ] SendingCard.tsx работает с новым tokenStandard
- [ ] ReceivingCard.tsx работает с новым selectedBankId
- [ ] useHeroExchangeForm schema совместима
- [ ] Exchange store использует новую структуру

## 🎯 Результат

После выполнения:

- **Правильные типы**: TokenStandard и BankId для type safety
- **Единый ExchangeFormData**: соответствует реальному использованию
- **Корректная структура**: без nullable полей и nested объектов
- **Совместимость**: с существующими компонентами форм
- **Готовность**: для интеграции с новой Exchange страницей

---

**Примечание**: План основан на критическом анализе существующего кода, а не на предположениях из документации.

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

### ШАГ 2: Создать ExchangeFormData (15 мин)

#### Местоположение: packages/exchange-core/src/types/new-exchange.ts

```ts
import type { CryptoCurrency } from '@repo/constants';
import type { TokenStandard, BankId } from '@repo/constants';

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
- [ ] ExchangeFormData интерфейс создан в exchange-core
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

- **Task 1.4**: Zustand store будет использовать ExchangeFormData
- **Task 2.1**: Компоненты формы получат типизацию
- **Task 3.1**: API endpoints получат типизированные payloads

---

**Примечание**: План основан на критическом анализе существующего кода, а не на предположениях из документации.
