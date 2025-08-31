# Урок 1.3: Архитектура пакетов и зависимости

> **🎯 Цель урока**: Понять логику разделения кода на пакеты и как они взаимодействуют в нашем проекте

## 📖 Введение

Представьте архитектуру проекта как **многоэтажное здание**:

- **Фундамент** (constants) - неизменные данные
- **Инженерные системы** (utils, exchange-core) - базовая функциональность
- **Комнаты** (ui, hooks) - переиспользуемые модули
- **Квартиры** (apps) - готовые приложения

Каждый "этаж" может использовать нижележащие, но не верхние.

## 🏗️ Архитектура нашего проекта

### Структура по уровням зависимостей:

```
┌─────────────────┐  Уровень 4: Приложения
│  apps/web/      │
│  apps/admin/    │  ← Используют всё нижнее
│  apps/docs/     │
└─────────────────┘

┌─────────────────┐  Уровень 3: UI и состояние
│  packages/ui/   │
│  packages/hooks/│  ← Используют уровни 1-2
└─────────────────┘

┌─────────────────┐  Уровень 2: Бизнес-логика
│ exchange-core/  │
│ packages/utils/ │  ← Используют уровень 1
└─────────────────┘

┌─────────────────┐  Уровень 1: Фундамент
│packages/constants│  ← Независимые
└─────────────────┘
```

## 📦 Детальный обзор пакетов

### 🎯 Уровень 1: Фундамент

#### `packages/constants/`

**Назначение**: Единый источник истины для всех констант проекта

```typescript
// packages/constants/src/currencies.ts
export const CRYPTOCURRENCIES = ['BTC', 'ETH', 'USDT-TRC20', 'USDT-ERC20', 'TRX'] as const;

export const EXCHANGE_LIMITS = {
  BTC: { min: 0.001, max: 10 },
  ETH: { min: 0.01, max: 100 },
  'USDT-TRC20': { min: 10, max: 50000 },
} as const;
```

**Почему отдельный пакет?**

- Предотвращает дублирование
- Обеспечивает консистентность данных
- Один источник для обновлений

### 🔧 Уровень 2: Бизнес-логика

#### `packages/exchange-core/`

**Назначение**: Основная бизнес-логика обменника

```typescript
// packages/exchange-core/src/utils/calculations.ts
import { EXCHANGE_RATES, EXCHANGE_LIMITS } from '@repo/constants';

export function calculateUahAmount(cryptoAmount: number, currency: CryptoCurrency): number {
  const rate = EXCHANGE_RATES[currency];
  return cryptoAmount * rate;
}

export function isAmountWithinLimits(amount: number, currency: CryptoCurrency): boolean {
  const limits = EXCHANGE_LIMITS[currency];
  return amount >= limits.min && amount <= limits.max;
}
```

**Структура**:

```
packages/exchange-core/src/
├── types/           # Типы данных
│   ├── currency.ts
│   ├── order.ts
│   └── user.ts
├── utils/           # Бизнес-функции
│   ├── calculations.ts
│   ├── validation.ts
│   └── formatters.ts
├── services/        # Сервисы
│   ├── orderManager.ts
│   └── userManager.ts
└── data/           # Моки и тестовые данные
    └── mockData.ts
```

#### `packages/utils/`

**Назначение**: Общие утилитарные функции

```typescript
// packages/utils/src/validation/schemas.ts
import { z } from 'zod';
import { CRYPTOCURRENCIES } from '@repo/constants';

export const securityEnhancedCreateOrderSchema = z.object({
  email: z.string().email().transform(sanitizeEmail),
  cryptoAmount: z.number().positive(),
  currency: z.enum(CRYPTOCURRENCIES),
  recipientData: z
    .object({
      cardNumber: z.string().optional(),
      bankDetails: z.string().optional(),
    })
    .optional(),
});
```

### 🎨 Уровень 3: UI и состояние

#### `packages/ui/`

**Назначение**: Централизованная библиотека UI компонентов

```typescript
// packages/ui/src/components/forms/CurrencySelect.tsx
import { CRYPTOCURRENCIES, CURRENCY_NAMES } from '@repo/constants';
import { Select } from '../ui/Select';

interface CurrencySelectProps {
  value: string;
  onChange: (currency: string) => void;
}

export function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  const options = CRYPTOCURRENCIES.map(currency => ({
    value: currency,
    label: CURRENCY_NAMES[currency]
  }));

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Выберите валюту"
    />
  );
}
```

**Структура UI пакета**:

```
packages/ui/src/
├── components/
│   ├── ui/              # Базовые shadcn/ui компоненты
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Select.tsx
│   ├── forms/           # Компоненты форм
│   │   ├── CurrencySelect.tsx
│   │   └── AmountInput.tsx
│   ├── exchange/        # Компоненты обмена
│   │   └── ExchangeCard.tsx
│   └── layout/          # Компоненты макета
│       ├── Header.tsx
│       └── Footer.tsx
├── styles/              # CSS стили
└── lib/                # Утилиты UI
```

#### `packages/hooks/`

**Назначение**: React хуки для состояния и логики

```typescript
// packages/hooks/src/business/useExchangeCalculation.ts
import { calculateUahAmount } from '@repo/exchange-core';
import { useState, useEffect } from 'react';

export function useExchangeCalculation(cryptoAmount: number, currency: CryptoCurrency) {
  const [uahAmount, setUahAmount] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (cryptoAmount > 0) {
      setIsCalculating(true);

      // Симуляция задержки расчета
      setTimeout(() => {
        const calculated = calculateUahAmount(cryptoAmount, currency);
        setUahAmount(calculated);
        setIsCalculating(false);
      }, 300);
    }
  }, [cryptoAmount, currency]);

  return { uahAmount, isCalculating };
}
```

### 🏢 Уровень 4: Приложения

#### `apps/web/`

**Назначение**: Основное web приложение для пользователей

```typescript
// apps/web/src/components/exchange/ExchangeForm.tsx
import { CurrencySelect, AmountInput, Button } from '@repo/ui';
import { useExchangeCalculation } from '@repo/hooks';
import { CRYPTOCURRENCIES } from '@repo/constants';

export function ExchangeForm() {
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState<CryptoCurrency>('BTC');

  const { uahAmount, isCalculating } = useExchangeCalculation(amount, currency);

  return (
    <form>
      <CurrencySelect value={currency} onChange={setCurrency} />
      <AmountInput value={amount} onChange={setAmount} />
      <div>Получите: {uahAmount} UAH</div>
      <Button disabled={isCalculating}>
        {isCalculating ? 'Расчет...' : 'Создать заявку'}
      </Button>
    </form>
  );
}
```

## 🔗 Система зависимостей

### Правила зависимостей:

1. **Уровень может зависеть только от нижних уровней**
2. **Никаких циклических зависимостей**
3. **Константы не зависят ни от чего**
4. **Приложения могут использовать всё**

### Пример зависимостей в package.json:

```json
// packages/ui/package.json
{
  "dependencies": {
    "@repo/constants": "*", // ✅ Можно - нижний уровень
    "@repo/utils": "*", // ✅ Можно - тот же уровень
    "react": "^19.1.0" // ✅ Можно - внешняя библиотека
  }
}
```

```json
// packages/constants/package.json
{
  "dependencies": {
    // ❌ Никаких internal зависимостей!
    // Только внешние библиотеки если нужно
  }
}
```

## 🎯 Почему именно такая архитектура?

### 1. **Предсказуемость**

Каждый пакет имеет четкую ответственность:

- constants - данные
- utils - функции
- ui - компоненты
- apps - приложения

### 2. **Переиспользование**

```typescript
// Один компонент используется везде
import { CurrencySelect } from '@repo/ui';

// В web приложении
<CurrencySelect />

// В админ панели
<CurrencySelect />

// В документации
<CurrencySelect />
```

### 3. **Изоляция изменений**

```bash
# Изменили константу курса
# Автоматически обновляется в:
# ✓ packages/exchange-core (расчеты)
# ✓ packages/ui (отображение)
# ✓ apps/web (пользовательский интерфейс)
# ✓ apps/admin (админка)
```

### 4. **Тестируемость**

```typescript
// Каждый пакет тестируется изолированно
// packages/exchange-core/__tests__/calculations.test.ts
import { calculateUahAmount } from '../src/utils/calculations';

test('should calculate UAH amount correctly', () => {
  const result = calculateUahAmount(1, 'BTC');
  expect(result).toBe(expected_value);
});
```

## 🔍 Анализ реального кода

### Пример 1: Поток данных

```typescript
// 1. Константа определена в constants
// packages/constants/src/currencies.ts
export const EXCHANGE_RATES = {
  BTC: 2500000, // 2.5M UAH за 1 BTC
  ETH: 90000,   // 90K UAH за 1 ETH
} as const;

// 2. Используется в бизнес-логике
// packages/exchange-core/src/utils/calculations.ts
import { EXCHANGE_RATES } from '@repo/constants';

export function calculateUahAmount(amount: number, currency: CryptoCurrency) {
  return amount * EXCHANGE_RATES[currency];
}

// 3. Хук использует бизнес-логику
// packages/hooks/src/business/useExchangeCalculation.ts
import { calculateUahAmount } from '@repo/exchange-core';

export function useExchangeCalculation(amount: number, currency: CryptoCurrency) {
  return useMemo(() => calculateUahAmount(amount, currency), [amount, currency]);
}

// 4. Компонент использует хук
// packages/ui/src/components/exchange/ExchangePreview.tsx
import { useExchangeCalculation } from '@repo/hooks';

export function ExchangePreview({ amount, currency }) {
  const uahAmount = useExchangeCalculation(amount, currency);
  return <div>Получите: {uahAmount} UAH</div>;
}

// 5. Приложение использует компонент
// apps/web/src/components/ExchangeForm.tsx
import { ExchangePreview } from '@repo/ui';

export function ExchangeForm() {
  return (
    <form>
      <ExchangePreview amount={amount} currency={currency} />
    </form>
  );
}
```

### Пример 2: Добавление новой валюты

```typescript
// Шаг 1: Добавляем в константы
// packages/constants/src/currencies.ts
export const CRYPTOCURRENCIES = [
  'BTC',
  'ETH',
  'USDT-TRC20',
  'DOGE', // ← Новая валюта
] as const;

export const EXCHANGE_RATES = {
  // ... existing rates
  DOGE: 15, // ← Курс DOGE
} as const;

// Автоматически доступно во всех пакетах!
// ✓ Валидация в utils обновилась
// ✓ UI компоненты показывают DOGE
// ✓ Расчеты включают DOGE
// ✓ Все приложения поддерживают DOGE
```

## ✅ Проверка знаний

1. **Вопрос**: Почему `packages/constants` не может зависеть от `packages/ui`?

   <details>
   <summary>Ответ</summary>

   Constants - это фундамент архитектуры (уровень 1), а UI - уровень 3. Зависимость создала бы циклическую связь и нарушила принцип слоев: нижние уровни не должны знать о верхних.
   </details>

2. **Задача**: Найдите в коде где `packages/ui` импортирует из `packages/constants`:

   ```bash
   grep -r "@repo/constants" packages/ui/src/
   ```

3. **Вопрос**: Что произойдет если добавить новую константу в `CRYPTOCURRENCIES`?

   <details>
   <summary>Ответ</summary>

   Автоматически обновятся все зависящие компоненты: валидация в utils, UI селекты, расчеты в exchange-core, все формы в приложениях. TypeScript проверит типы во всех местах использования.
   </details>

## 🚀 Практическое задание

**Задание**: Исследуйте архитектуру пакетов:

1. **Изучите зависимости**:

   ```bash
   # Посмотрите package.json в каждом пакете
   find packages/ -name "package.json" -exec echo "=== {} ===" \; -exec cat {} \;
   ```

2. **Найдите импорты между пакетами**:

   ```bash
   # Поиск всех @repo импортов
   grep -r "@repo/" packages/ --include="*.ts" --include="*.tsx" | head -20
   ```

3. **Создайте диаграмму зависимостей**:
   Нарисуйте схему кто от кого зависит на основе найденных импортов.

4. **Экспериментируйте с зависимостями**:

   ```bash
   # Посмотрите что использует constants
   grep -r "@repo/constants" packages/

   # Найдите где используется exchange-core
   grep -r "@repo/exchange-core" packages/ apps/
   ```

## 📊 Сравнение с альтернативами

| Подход              | Наша архитектура | Монолит              | Микросервисы    |
| ------------------- | ---------------- | -------------------- | --------------- |
| Переиспользование   | ✅ Высокое       | ❌ Низкое            | ❌ Дублирование |
| Типобезопасность    | ✅ Сквозная      | ✅ Внутри приложения | ❌ Нет          |
| Скорость разработки | ✅ Быстрая       | ✅ Быстрая           | ❌ Медленная    |
| Масштабируемость    | ✅ Хорошая       | ❌ Плохая            | ✅ Отличная     |
| Сложность           | ✅ Умеренная     | ✅ Низкая            | ❌ Высокая      |

## 📚 Дополнительные материалы

- [Принципы проектирования пакетов](https://blog.cleancoder.com/uncle-bob/2014/09/19/MicroServicesAndJars.html)
- [Dependency Inversion Principle](https://docs.google.com/document/d/1Y1c2v3F4K5Z7k9X7Z4k5Z7k9X7Z4k5Z7k9X7Z4k5Z7k/edit)
- [Наша архитектурная документация](../../docs/core/ARCHITECTURE.md)
- [Структура каждого пакета](../../docs/core/PROJECT_STRUCTURE_MAP.md)

---

[← Урок 1.2](./lesson-1.2-turborepo-system.md) | [Урок 1.4: Настройка окружения →](./lesson-1.4-setup-environment.md)
