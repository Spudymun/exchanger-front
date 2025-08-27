# 🏗️ АРХИТЕКТУРНОЕ РЕШЕНИЕ: Унификация ReceivingInfo компонента

**Агент-архитектор** | **Дата:** 27 августа 2025  
**Задача:** Создание централизованного ReceivingInfo компонента без нарушения существующего функционала

---

## 📋 РЕЗЮМЕ АРХИТЕКТУРНОГО РЕШЕНИЯ

**Цель:** У---

## 📋 Implementation Plan (Agent-кодер)

**СТАТУС:** 🟢 Детальный план готов - основан на изучении документации

**ОСНОВА ПЛАНА:** Проект использует UI component архитектуру с:

- Compound Components Pattern v2.0 (packages/ui/README.md)
- TypeScript-first подход с generic interfaces
- shadcn/ui базой + Tailwind CSS
- Form integration через UseFormReturn из @repo/hooks
- Интернационализация через next-intl

### ⚡ Шаг 1: Создание ReceivingInfo компонента

**Файл:** `packages/ui/src/components/exchange/ReceivingInfo.tsx`

**Архитектура:** Копирует паттерн SendingInfo.tsx с адаптацией для fiat currency:

```typescript
'use client';

import { getBankReserve, type FiatCurrency, type BankId } from '@repo/constants';
import type { UseFormReturn } from '@repo/hooks';
import { useMemo } from 'react';

interface ReceivingInfoProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * Поле в форме для получения валюты
   * @default 'toCurrency'
   */
  currencyFieldName?: string;
  /**
   * Поле в форме для выбранного банка
   * @default 'selectedBankId'
   */
  bankFieldName?: string;
  /**
   * Передать processingTime извне
   * @default undefined (показывает стандартное время)
   */
  processingTime?: string;
}

/**
 * ✅ UNIFIED: Общий компонент для отображения информации о получении
 * Заменяет inline ReceivingInfo из ReceivingCard
 * Показывает резерв банка и время обработки
 */
export function ReceivingInfo({
  form,
  t,
  currencyFieldName = 'toCurrency',
  bankFieldName = 'selectedBankId',
  processingTime,
}: ReceivingInfoProps) {
  const toCurrency = form.values[currencyFieldName] as FiatCurrency;
  const selectedBankId = form.values[bankFieldName] as BankId;

  const { bankReserve, processingText } = useMemo(() => {
    let reserve = 0;

    if (toCurrency && selectedBankId) {
      reserve = getBankReserve(selectedBankId, toCurrency);
    }

    const processing = processingTime || t('receiving.processing');

    return {
      bankReserve: reserve,
      processingText: processing,
    };
  }, [toCurrency, selectedBankId, processingTime, t]);

  if (!toCurrency) {
    return null;
  }

  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div>
        {t('receiving.reserve')}: {bankReserve.toLocaleString()} {toCurrency}
      </div>
      <div>{processingText}</div>
    </div>
  );
}
```

**Ключевые особенности:**

1. ✅ **Generic Form Support** - работает с любой формой через UseFormReturn
2. ✅ **Dynamic Reserve Calculation** - использует getBankReserve() вместо hardcoded значений
3. ✅ **Configurable Field Names** - поддерживает разные названия полей в формах
4. ✅ **Processing Time Override** - можно передать custom время обработки
5. ✅ **Number Formatting** - использует toLocaleString() для правильного отображения больших чисел
6. ✅ **Conditional Rendering** - не показывается если нет выбранной валюты
7. ✅ **Memoization** - оптимизация вычислений через useMemo

### ⚡ Шаг 2: Экспорт компонента

**Файл:** `packages/ui/src/components/exchange/index.ts`

```typescript
// Добавить в существующий файл или создать новый:
export { SendingInfo } from './SendingInfo';
export { ReceivingInfo } from './ReceivingInfo';
```

**Файл:** `packages/ui/src/components/index.ts`

```typescript
// Добавить в секцию Exchange Components:
export { SendingInfo, ReceivingInfo } from './exchange';
```

### ⚡ Шаг 3: Удаление inline ReceivingInfo

**Файл:** `apps/web/src/components/hero-exchange/ReceivingCard.tsx`

**Удалить код:**

```typescript
// УДАЛИТЬ этот блок:
export function ReceivingInfo({
  form,
  t,
}: {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
}) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div>
        {t('receiving.reserve')}: 10,000,000 {form.values.toCurrency as string}
      </div>
      <div>{t('receiving.processing')}</div>
    </div>
  );
}
```

**Добавить import:**

```typescript
// В начало файла добавить:
import {
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ExchangeBankSelector,
  FiatCurrencySelector,
  FormField,
  FormLabel,
  FormControl,
  ReceivingInfo, // ✅ NEW IMPORT
} from '@repo/ui';
```

**Использование остается тем же:**

```typescript
<ReceivingInfo form={form} t={t} />
```

### ⚡ Шаг 4: Интеграция в exchange страницу

**НАЙДЕНА ОСНОВНАЯ EXCHANGE СТРАНИЦА:** `apps/web/src/components/exchange/ExchangeLayout.tsx`

**Текущая архитектура exchange страницы:**

- ✅ **ReceivingSection** - уже существует в ExchangeLayout.tsx (строки 79-112)
- ✅ **ExchangeForm.ExchangeCard** - использует compound components pattern
- ✅ **TypeScript Integration** - использует SecurityEnhancedFullExchangeForm типы
- ✅ **Form Architecture** - UseFormReturn с form.values и form.errors

**Текущий код ReceivingSection (строки 79-112):**

```typescript
function ReceivingSection({
  form,
  t,
  calculatedAmount = 0,
}: {
  form: UseFormReturn<SecurityEnhancedFullExchangeForm>;
  t: (key: string) => string;
  calculatedAmount?: number;
}) {
  return (
    <ExchangeForm.ExchangeCard type="receiving">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('receiving.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('receiving.subtitle')}</p>
      </header>

      <div className="receive-content space-y-4">
        <ExchangeBankSelector
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          t={t}
        />

        <CardNumberInput form={form as unknown as UseFormReturn<Record<string, unknown>>} t={t} />

        <ExchangeForm.FieldWrapper>
          <FormField name="toAmount" error={form.errors.toAmount}>
            <ExchangeForm.FieldLabel>{t('receiving.amount')}</ExchangeForm.FieldLabel>
            <FormControl>
              <Input
                value={calculatedAmount.toFixed(2)}
                readOnly
                className="bg-muted/50 text-foreground cursor-default pointer-events-none transition-none focus-visible:ring-0 focus-visible:border-input border-input"
              />
            </FormControl>
            <FormMessage />
          </FormField>
        </ExchangeForm.FieldWrapper>
      </div>
    </ExchangeForm.ExchangeCard>
  );
}
```

**ПРОБЛЕМА:** В ExchangeLayout.tsx НЕТ ReceivingInfo компонента! Там только:

- ExchangeBankSelector
- CardNumberInput
- Amount display field

**РЕШЕНИЕ:** Добавить ReceivingInfo в ReceivingSection

**Обновленный план интеграции:**

**Файл:** `apps/web/src/components/exchange/ExchangeLayout.tsx`

**Шаг 4.1:** Добавить import ReceivingInfo:

```typescript
import {
  ExchangeForm,
  TokenStandardSelector,
  CryptoCurrencySelector,
  ExchangeBankSelector,
  CryptoAmountInput,
  CardNumberInput,
  SendingInfo,
  ReceivingInfo, // ✅ NEW IMPORT
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  FormEmailField,
  FormCaptchaField,
} from '@repo/ui';
```

**Шаг 4.2:** Добавить ReceivingInfo в ReceivingSection (после amount display):

```typescript
function ReceivingSection({
  form,
  t,
  calculatedAmount = 0,
}: {
  form: UseFormReturn<SecurityEnhancedFullExchangeForm>;
  t: (key: string) => string;
  calculatedAmount?: number;
}) {
  return (
    <ExchangeForm.ExchangeCard type="receiving">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('receiving.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('receiving.subtitle')}</p>
      </header>

      <div className="receive-content space-y-4">
        <ExchangeBankSelector
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          t={t}
        />

        <CardNumberInput form={form as unknown as UseFormReturn<Record<string, unknown>>} t={t} />

        <ExchangeForm.FieldWrapper>
          <FormField name="toAmount" error={form.errors.toAmount}>
            <ExchangeForm.FieldLabel>{t('receiving.amount')}</ExchangeForm.FieldLabel>
            <FormControl>
              <Input
                value={calculatedAmount.toFixed(2)}
                readOnly
                className="bg-muted/50 text-foreground cursor-default pointer-events-none transition-none focus-visible:ring-0 focus-visible:border-input border-input"
              />
            </FormControl>
            <FormMessage />
          </FormField>
        </ExchangeForm.FieldWrapper>

        {/* ✅ NEW: ReceivingInfo component */}
        <ReceivingInfo
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          t={t}
          currencyFieldName="toCurrency"
          bankFieldName="selectedBankId"
        />
      </div>
    </ExchangeForm.ExchangeCard>
  );
}
```

**FIELD MAPPING для exchange формы:**

- ✅ **toCurrency** - SecurityEnhancedFullExchangeForm содержит toCurrency field
- ✅ **selectedBankId** - используется в ExchangeBankSelector, должно быть в форме

### ⚡ Шаг 5: Тестирование компонента

**Проверки:**

1. ✅ **Reserve Calculation** - проверить что резерв вычисляется правильно для разных банков/валют
2. ✅ **Field Names** - проверить работу с custom field names
3. ✅ **Conditional Rendering** - проверить что компонент скрывается без валюты
4. ✅ **Number Formatting** - проверить правильное форматирование больших чисел
5. ✅ **Translation Integration** - проверить работу переводов
6. ✅ **Type Safety** - проверить TypeScript compilation без ошибок

### ⚡ Шаг 6: Документирование

**Storybook Story:** `packages/ui/src/stories/ReceivingInfo.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ReceivingInfo } from '../components/exchange/ReceivingInfo';

const meta: Meta<typeof ReceivingInfo> = {
  title: 'Exchange/ReceivingInfo',
  component: ReceivingInfo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock form для демонстрации
const mockForm = {
  values: {
    toCurrency: 'UAH',
    selectedBankId: 'privatbank',
  },
} as any;

export const Default: Story = {
  args: {
    form: mockForm,
    t: (key: string) => key, // Mock translation
  },
};

export const WithCustomFields: Story = {
  args: {
    form: {
      values: {
        customCurrency: 'USD',
        customBank: 'wise',
      },
    } as any,
    t: (key: string) => key,
    currencyFieldName: 'customCurrency',
    bankFieldName: 'customBank',
  },
};
```

### 🎯 Результат реализации

1. ✅ **Устранение дублирования** - один ReceivingInfo компонент вместо inline реализации
2. ✅ **Унификация с SendingInfo** - одинаковая архитектура и паттерны использования
3. ✅ **Динамические данные** - реальные резервы банков вместо hardcoded значений
4. ✅ **Type Safety** - полная типизация с TypeScript и generic interfaces
5. ✅ **Переиспользование** - компонент можно использовать в любых формах exchange
6. ✅ **Производительность** - мемоизация вычислений и conditional rendering
7. ✅ **Соответствие Rules** - следует Rule 20 (избегание дублирования) и Rule 17 (централизованные системы)

**Архитектурная целостность сохранена:** Компонент следует установленным в проекте паттернам из packages/ui/README.md и воспроизводит архитектуру SendingInfo.tsx с адаптацией для fiat currency специфики.

---

## 🔍 VERIFICATION CHECKLISTицировать отображение информации о получении фиатной валюты через создание централизованного компонента в `packages/ui/components/exchange/ReceivingInfo.tsx`

**Подход:** Рефакторинг существующего inline компонента с сохранением всей функциональности и интеграцией с централизованными системами

**Результат:** Устранение дублирования кода, улучшение переиспользуемости, соответствие архитектурным принципам проекта

---

## 🎯 ОЦЕНКА СООТВЕТСТВИЯ ПРИНЦИПАМ ПРОЕКТА

### ✅ **Соответствие установленным паттернам:**

1. **Monorepo архитектура (Turborepo)**
   - Централизация UI компонентов в `packages/ui/`
   - Использование shared types из `packages/exchange-core/`
   - Интеграция с `packages/constants/` для бизнес-данных

2. **shadcn/ui + Tailwind CSS система**
   - Следование существующим стилевым паттернам
   - Использование design tokens из `packages/design-tokens/`
   - Консистентность с существующими exchange компонентами

3. **TypeScript-first подход**
   - Строгая типизация через exchange-core типы
   - Интеграция с existing form types
   - Type safety для fiat currency operations

4. **Централизованная архитектура состояния**
   - Использование UseFormReturn interface
   - Интеграция с exchange store patterns
   - Совместимость с tRPC data layer

---

## 🔧 ПРЕДЛОЖЕННЫЙ ШАБЛОН ПРОЕКТИРОВАНИЯ

### **Паттерн: Unified Component Strategy**

**Базовая архитектура:**

```
SendingInfo.tsx (существующий) ←──┐
                                   ├─→ Общий интерфейсный паттерн
ReceivingInfo.tsx (новый) ←───────┘
```

**Принципы дизайна:**

1. **Composition over Inheritance** - компонент принимает данные через props
2. **Single Responsibility** - отвечает только за отображение receiving информации
3. **Dependency Injection** - все внешние зависимости через props
4. **Interface Segregation** - минимальный, но достаточный props interface

### **Architectural Layers Integration:**

```typescript
// Layer 1: UI Presentation (packages/ui)
ReceivingInfo.tsx
├─ Props Interface Definition
├─ Rendering Logic
└─ Style Integration

// Layer 2: Business Logic (packages/exchange-core)
FiatCurrency types ────┐
Bank types ────────────┼─→ Type Safety
BankReserve types ─────┘

// Layer 3: Constants (packages/constants)
FIAT_CURRENCIES ───────┐
getBankReserve() ──────┼─→ Business Data
getBanksForCurrency() ─┘

// Layer 4: Localization (apps/web/messages)
receiving.* keys ──────→ i18n Integration
```

---

## 🚫 ЗАПРЕТ ИЗОБРЕТЕНИЯ ВЕЛОСИПЕДОВ

### **Переиспользование существующих решений:**

1. **✅ ПЕРЕИСПОЛЬЗОВАТЬ:**
   - **SendingInfo.tsx паттерн** - аналогичная структура props и rendering
   - **Existing translation keys** - `receiving.*` из messages/en.json, ru.json
   - **getBankReserve() функция** - из packages/constants/banks.ts
   - **FiatCurrency types** - из packages/exchange-core/types/fiat.ts
   - **Styling patterns** - text-sm text-muted-foreground space-y-1

2. **🚫 НЕ СОЗДАВАТЬ:**
   - Новые translation keys (использовать existing)
   - Новые utility functions для резервов (использовать getBankReserve)
   - Новые type definitions (использовать exchange-core types)
   - Новый styling approach (следовать SendingInfo паттерну)
   - Дублирующую business logic

3. **🔄 РЕФАКТОРИТЬ:**
   - Inline ReceivingInfo из ReceivingCard.tsx → централизованный компонент
   - Hardcoded "10,000,000" → dynamic getBankReserve() integration
   - Local component → packages/ui/components/exchange/

---

## 📋 ОПРЕДЕЛЕНИЕ КОНТРАКТОВ И ИНТЕРФЕЙСОВ

### **Props Interface Contract:**

```typescript
interface ReceivingInfoProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * Поле в форме для получения валюты
   * @default 'toCurrency'
   */
  currencyFieldName?: string;
  /**
   * Поле в форме для выбранного банка
   * @default 'selectedBankId'
   */
  bankFieldName?: string;
  /**
   * Показывать динамический резерв банка
   * @default true
   */
  showBankReserve?: boolean;
  /**
   * Показывать время обработки
   * @default true
   */
  showProcessingTime?: boolean;
}
```

### **Form Data Contract Integration:**

```typescript
// Минимальные требования к form.values:
interface MinimalFormData {
  toCurrency?: FiatCurrency | string; // 'UAH' | 'USD' | 'EUR'
  selectedBankId?: string; // bank.id from getBanksForCurrency()
}
```

### **Translation Keys Contract:**

```typescript
// Обязательные ключи локализации:
interface RequiredTranslationKeys {
  'receiving.reserve': string; // "Резерв" / "Reserve"
  'receiving.processing': string; // "Время обработки: 15-30 минут"
  'receiving.min': string; // "min" (опционально)
}
```

### **Business Logic Contract:**

```typescript
// Интеграция с централизованными системами:
interface BusinessIntegration {
  // Из packages/constants/banks.ts
  getBankReserve: (bankId: string, currency: FiatCurrency) => number;

  // Из packages/constants/fiat-currencies.ts
  FIAT_MIN_AMOUNTS: Record<FiatCurrency, number>;
  FIAT_CURRENCY_SYMBOLS: Record<FiatCurrency, string>;

  // Из packages/exchange-core/types/fiat.ts
  FiatCurrency: 'UAH' | 'USD' | 'EUR';
}
```

---

## 🔄 КОНКРЕТНЫЙ ПУТЬ ИНТЕГРАЦИИ

### **Phase 1: Создание централизованного компонента**

**Файл:** `packages/ui/src/components/exchange/ReceivingInfo.tsx`

**Действия:**

1. Создать компонент по образцу SendingInfo.tsx
2. Интегрировать с getBankReserve() для динамических резервов
3. Использовать существующие translation keys
4. Следовать established styling patterns

### **Phase 2: Рефакторинг существующего использования**

**Файл:** `apps/web/src/components/hero-exchange/ReceivingCard.tsx`

**Действия:**

1. Удалить inline ReceivingInfo компонент
2. Импортировать централизованный ReceivingInfo из @repo/ui
3. Адаптировать props для совместимости
4. Сохранить все существующее поведение

### **Phase 3: Экспорт и интеграция**

**Файлы:**

- `packages/ui/src/components/exchange/index.ts`
- `packages/ui/src/index.ts`

**Действия:**

1. Добавить export для ReceivingInfo
2. Обеспечить доступность через @repo/ui import
3. Обновить type exports если необходимо

---

## 📊 СХЕМА ВЗАИМОДЕЙСТВИЯ КОМПОНЕНТОВ

### **До рефакторинга:**

```
ReceivingCard.tsx
├─ inline ReceivingInfo (локальный)
├─ hardcoded "10,000,000" резерв
└─ статические translation keys
```

### **После рефакторинга:**

```
ReceivingCard.tsx
├─ import { ReceivingInfo } from '@repo/ui'
├─ <ReceivingInfo form={form} t={t} />
└─ передача централизованных props

ReceivingInfo.tsx (@repo/ui)
├─ getBankReserve(bankId, currency) ─→ dynamic reserves
├─ form.values.toCurrency ─────────→ FiatCurrency integration
├─ form.values.selectedBankId ─────→ Bank selection
└─ t('receiving.*') ───────────────→ localization
```

### **Data Flow:**

```
Form State (toCurrency, selectedBankId)
    ↓
ReceivingInfo Component
    ↓
getBankReserve(selectedBankId, toCurrency)
    ↓
Dynamic Reserve Display + Processing Time
```

---

## ⚡ MIGRATION STRATEGY (Сохранение функционала)

### **Backward Compatibility Guarantee:**

1. **🔒 Zero Breaking Changes**
   - ReceivingCard поведение остается идентичным
   - Все translation keys остаются теми же
   - Visual appearance не изменяется
   - User experience остается прежним

2. **📦 Progressive Enhancement**
   - Новый компонент поддерживает больше fiat currencies
   - Dynamic bank reserves вместо hardcoded значений
   - Готовность к integration в exchange страницы
   - Better type safety through централизованные types

3. **🧪 Risk Mitigation**
   - Поэтапная миграция (сначала создание, потом замена)
   - Сохранение существующих interfaces
   - No changes в form handling logic
   - Existing styling и behavior preservation

---

## ✅ VERIFICATION CHECKLIST

### **Архитектурная целостность:**

- [ ] Компонент следует established UI patterns
- [ ] Интегрируется с централизованными constants
- [ ] Использует existing types из exchange-core
- [ ] Соответствует monorepo структуре

### **Функциональная совместимость:**

- [ ] ReceivingCard работает идентично после замены
- [ ] Все translation keys работают корректно
- [ ] Dynamic резервы отображаются правильно
- [ ] Нет regression в user experience

### **Code Quality:**

- [ ] Нет дублирования кода с SendingInfo
- [ ] TypeScript типы корректны
- [ ] ESLint rules соблюдены
- [ ] Storybook documentation создана

---

## 🎯 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

**Технические улучшения:**

- ✅ Устранение code duplication между hero-exchange и ui packages
- ✅ Централизация fiat currency display logic
- ✅ Dynamic bank reserve integration
- ✅ Better maintainability через shared component

**Архитектурные преимущества:**

- ✅ Соответствие DRY принципу
- ✅ Improved separation of concerns
- ✅ Ready for exchange page integration
- ✅ Enhanced type safety

**Business Value:**

- ✅ Consistent user experience across pages
- ✅ Real-time bank reserve information
- ✅ Scalability для future fiat currencies
- ✅ Reduced maintenance overhead

---

**🏁 Результат:** Архитектурно чистое решение, которое устраняет дублирование, сохраняет весь существующий функционал и готово к масштабированию в рамках established проектных принципов.
