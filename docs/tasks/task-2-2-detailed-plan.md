# 📋 TASK 2.2: 🎯 АДАПТАЦИЯ КОМПОНЕНТОВ - Currency Selection & Amount Calculation

> **Статус**: 🎯 **ГОТОВ К РЕАЛИЗАЦИИ** - архитектура проанализирована, план адаптации составлен  
> **Цель**: Адаптировать существующие компоненты HeroExchangeForm для использования в ExchangeLayout без нарушения DRY принципа

## 🏗️ **АРХИТЕКТУРНЫЙ АНАЛИЗ (100% факты)**

### ✅ **Существующая архитектура:**

- ✅ **HeroExchangeForm** (`apps/web/src/components/hero-exchange/`) - полная реализация с:
  - `SendingCard.tsx` - CurrencySelector, TokenStandardSelector, AmountInput
  - `ReceivingCard.tsx` - BankSelector, CardNumberInput, DisplayAmount
- ✅ **ExchangeLayout** (`apps/web/src/components/exchange/`) - структура с placeholder контентом
- ✅ **securityEnhancedAdvancedExchangeFormSchema** - валидационная схема существует
- ✅ **useExchange хук** - бизнес-логика готова к использованию
- ✅ **Константы** - CRYPTOCURRENCIES, TOKEN_STANDARDS, BANKS_BY_CURRENCY доступны

### ❌ **Что отсутствует:**

- ❌ **TypeScript тип** для `SecurityEnhancedAdvancedExchangeForm`
- ❌ **Реальные поля** вместо placeholder контента в ExchangeLayout
- ❌ **Интеграция** ExchangeLayout с валидационной схемой

### 🎯 **Принцип адаптации (НЕ дублирования):**

**Различие контекстов:**

- **HeroExchangeForm** - landing page, Card layout, упрощенная форма
- **ExchangeLayout** - dedicated page, ExchangeForm.ExchangeCard layout, расширенная форма

**Стратегия переиспользования:**

- Извлечь логику селекторов из HeroExchangeForm
- Адаптировать для ExchangeForm.FieldWrapper структуры
- Сохранить тот же UI/UX, но в другом layout контексте

## 📐 **ПЛАН РЕАЛИЗАЦИИ АДАПТАЦИИ**

### 🔧 **ШАГ 1: Добавить недостающий TypeScript тип**

**Файл:** `packages/utils/src/validation/security-enhanced-exchange-schemas.ts`

```typescript
// Добавить в секцию TYPE EXPORTS после существующих типов:
export type SecurityEnhancedAdvancedExchangeForm = z.infer<
  typeof securityEnhancedAdvancedExchangeFormSchema
>;
```

**Обоснование:** Схема существует, но тип отсутствует - это нарушает type safety.

### 🔧 **ШАГ 2: Адаптировать SendingSection в ExchangeLayout.tsx**

**Стратегия адаптации:** Извлечь логику из `SendingCard.tsx` и адаптировать для ExchangeForm структуры

```tsx
// Адаптировать CurrencySelector из hero-exchange/SendingCard.tsx:
import { Input, Select } from '@repo/ui';
import { CRYPTOCURRENCIES } from '@repo/constants';
import { getTokenStandards } from '@repo/constants';

function SendingSection({ t, form, onAmountChange }: SendingSectionProps) {
  const { watch, setValue } = form;
  const fromCurrency = watch('fromCurrency');

  return (
    <ExchangeForm.ExchangeCard type="sending">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('sending.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('sending.subtitle')}</p>
      </header>

      <div className="send-content space-y-4">
        {/* Адаптация CurrencySelector */}
        <ExchangeForm.FieldWrapper>
          <ExchangeForm.FieldLabel>{t('sending.currency')}</ExchangeForm.FieldLabel>
          <Select
            name="fromCurrency"
            options={CRYPTOCURRENCIES.map(crypto => ({
              value: crypto,
              label: crypto,
              icon: `/crypto-icons/${crypto.toLowerCase()}.svg`,
            }))}
            placeholder={t('sending.currency.placeholder')}
            onChange={value => {
              setValue('fromCurrency', value);
              setValue('tokenStandard', ''); // Reset dependent field
            }}
          />
        </ExchangeForm.FieldWrapper>

        {/* Адаптация TokenStandardSelector */}
        <ExchangeForm.FieldWrapper>
          <ExchangeForm.FieldLabel>{t('sending.tokenStandard')}</ExchangeForm.FieldLabel>
          <Select
            name="tokenStandard"
            options={getTokenStandards(fromCurrency)}
            placeholder={t('sending.tokenStandard.placeholder')}
            disabled={!fromCurrency}
          />
        </ExchangeForm.FieldWrapper>

        {/* Адаптация AmountInput */}
        <ExchangeForm.FieldWrapper>
          <ExchangeForm.FieldLabel>{t('sending.amount')}</ExchangeForm.FieldLabel>
          <Input
            name="cryptoAmount"
            type="number"
            step="0.00000001"
            placeholder="0.00000000"
            onChange={onAmountChange}
          />
        </ExchangeForm.FieldWrapper>
      </div>
    </ExchangeForm.ExchangeCard>
  );
}
```

### 🔧 **ШАГ 3: Адаптировать ReceivingSection в ExchangeLayout.tsx**

**Стратегия адаптации:** Извлечь логику из `ReceivingCard.tsx` и адаптировать для ExchangeForm структуры

```tsx
// Адаптировать BankSelector и CardNumberInput из hero-exchange/ReceivingCard.tsx:
import { getBanksForCurrency } from '@repo/constants';

function ReceivingSection({ t, form, calculatedAmount }: ReceivingSectionProps) {
  const { watch } = form;
  const selectedBank = watch('selectedBank');

  return (
    <ExchangeForm.ExchangeCard type="receiving">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('receiving.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('receiving.subtitle')}</p>
      </header>

      <div className="receive-content space-y-4">
        {/* Адаптация BankSelector */}
        <ExchangeForm.FieldWrapper>
          <ExchangeForm.FieldLabel>{t('receiving.bank')}</ExchangeForm.FieldLabel>
          <Select
            name="selectedBank"
            options={getBanksForCurrency('UAH').map(bank => ({
              value: bank.id,
              label: bank.name,
              icon: bank.logoUrl,
            }))}
            placeholder={t('receiving.bank.placeholder')}
          />
        </ExchangeForm.FieldWrapper>

        {/* Адаптация CardNumberInput */}
        <ExchangeForm.FieldWrapper>
          <ExchangeForm.FieldLabel>{t('receiving.cardNumber')}</ExchangeForm.FieldLabel>
          <Input
            name="cardNumber"
            placeholder="**** **** **** ****"
            mask="9999 9999 9999 9999"
            inputMode="numeric"
          />
        </ExchangeForm.FieldWrapper>

        {/* Адаптация DisplayAmount */}
        <ExchangeForm.FieldWrapper>
          <ExchangeForm.FieldLabel>{t('receiving.amount')}</ExchangeForm.FieldLabel>
          <Input
            name="uahAmount"
            type="number"
            value={calculatedAmount}
            disabled
            placeholder="0.00 UAH"
            className="bg-muted"
          />
        </ExchangeForm.FieldWrapper>
      </div>
    </ExchangeForm.ExchangeCard>
  );
}
```

### 🔧 **ШАГ 4: Интеграция с useExchange и валидацией**

**Файл:** `ExchangeContainer.tsx`

```tsx
// Интегрировать с существующими хуками и схемой:
import { useExchange } from '@repo/hooks/src/business/useExchange';
import { useFormWithNextIntl } from '@repo/hooks';
import { securityEnhancedAdvancedExchangeFormSchema } from '@repo/utils';
import type { SecurityEnhancedAdvancedExchangeForm } from '@repo/utils';

export function ExchangeContainer({ locale, initialParams }: ExchangeContainerProps) {
  const t = useTranslations('AdvancedExchangeForm');

  // Форма с валидацией
  const form = useFormWithNextIntl<SecurityEnhancedAdvancedExchangeForm>({
    validationSchema: securityEnhancedAdvancedExchangeFormSchema,
    t,
    defaultValues: {
      fromCurrency: 'USDT',
      tokenStandard: 'TRC-20',
      toCurrency: 'UAH',
      cryptoAmount: 0,
      selectedBank: '',
      cardNumber: '',
      email: '',
      captchaAnswer: '',
      agreeToTerms: false,
    },
  });

  // Бизнес-логика обмена
  const { calculateAmount, getDisplayRate, isLoading: exchangeLoading } = useExchange();

  // Автоматический пересчет при изменении суммы
  const handleAmountChange = async (amount: number) => {
    const { fromCurrency, tokenStandard } = form.getValues();
    if (fromCurrency && amount > 0) {
      const calculated = await calculateAmount({
        amount,
        fromCurrency,
        tokenStandard,
        toCurrency: 'UAH',
      });
      form.setValue('uahAmount', calculated);
    }
  };

  return (
    <ExchangeForm.Container variant="full">
      <ExchangeLayout
        form={form}
        t={t}
        onAmountChange={handleAmountChange}
        calculatedAmount={form.watch('uahAmount')}
        isLoading={exchangeLoading}
      />
    </ExchangeForm.Container>
  );
}
```

## ✅ **КРИТЕРИИ ЗАВЕРШЕНИЯ**

### **1. TypeScript Type Safety:**

- ✅ Добавлен тип `SecurityEnhancedAdvancedExchangeForm`
- ✅ ExchangeContainer использует типизированную форму
- ✅ Все компоненты имеют правильные TypeScript типы

### **2. Архитектурная совместимость:**

- ✅ Сохранен принцип адаптации (НЕ дублирования)
- ✅ Логика селекторов извлечена из HeroExchangeForm
- ✅ Адаптирована для ExchangeForm.FieldWrapper структуры
- ✅ Интеграция с существующими хуками

### **3. Функциональность:**

- ✅ Currency selection работает с CRYPTOCURRENCIES
- ✅ Token standards загружаются через getTokenStandards()
- ✅ Bank selection использует getBanksForCurrency()
- ✅ Автоматический пересчет суммы через useExchange
- ✅ Валидация через securityEnhancedAdvancedExchangeFormSchema

### **4. UI/UX консистентность:**

- ✅ ExchangeForm.FieldWrapper для всех полей
- ✅ ExchangeForm.FieldLabel для лейблов
- ✅ Тот же визуальный стиль, что и в HeroExchangeForm
- ✅ Responsive layout через ExchangeForm.CardPair

## 🔄 **СВЯЗЬ С ДРУГИМИ ЗАДАЧАМИ**

**Основано на Task 2.1:**

- ✅ Использует созданную ExchangeForm compound структуру
- ✅ Опирается на ExchangeLayout с placeholder контентом

**Подготовка к Task 2.3:**

- ✅ Форма готова к добавлению email поля
- ✅ Валидационная схема уже включает email и captcha
- ✅ Структура готова к Contact Information секции

## 📊 **ПЛАН АДАПТАЦИИ vs ДУБЛИРОВАНИЯ**

| Компонент             | HeroExchangeForm | ExchangeLayout          | Статус           |
| --------------------- | ---------------- | ----------------------- | ---------------- |
| CurrencySelector      | `Card + Select`  | `FieldWrapper + Select` | ✅ **Адаптация** |
| TokenStandardSelector | `Card + Select`  | `FieldWrapper + Select` | ✅ **Адаптация** |
| AmountInput           | `Card + Input`   | `FieldWrapper + Input`  | ✅ **Адаптация** |
| BankSelector          | `Card + Select`  | `FieldWrapper + Select` | ✅ **Адаптация** |
| CardNumberInput       | `Card + Input`   | `FieldWrapper + Input`  | ✅ **Адаптация** |
| Validation            | Простая          | Security-enhanced       | ✅ **Улучшение** |

**Вывод:** Это правильная адаптация архитектуры, а не дублирование кода!

## 🎯 **ПОРЯДОК РЕАЛИЗАЦИИ**

### **Этап 1: TypeScript Type (5 минут)**

```bash
# Добавить недостающий тип в валидационную схему
edit packages/utils/src/validation/security-enhanced-exchange-schemas.ts
```

### **Этап 2: SendingSection (20 минут)**

```bash
# Заменить placeholder на адаптированные компоненты
edit apps/web/src/components/exchange/ExchangeLayout.tsx
```

### **Этап 3: ReceivingSection (20 минут)**

```bash
# Заменить placeholder на адаптированные компоненты
edit apps/web/src/components/exchange/ExchangeLayout.tsx
```

### **Этап 4: Интеграция с useExchange (15 минут)**

```bash
# Подключить автоматические расчеты
edit apps/web/src/components/exchange/ExchangeContainer.tsx
```

**Общее время реализации:** ~60 минут

---

## 🚀 **ОЖИДАЕМЫЙ РЕЗУЛЬТАТ**

После завершения Task 2.2:

✅ **Полнофункциональная форма обмена** с реальными полями вместо placeholder-ов  
✅ **Автоматический пересчет** суммы при изменении параметров  
✅ **Валидация полей** через security-enhanced схемы  
✅ **Type-safe** взаимодействие со всеми компонентами  
✅ **Адаптация без дублирования** - правильное переиспользование логики

**Готовность к Task 2.3:** 🟢 **100% готов** - форма готова к добавлению Contact Information секции
