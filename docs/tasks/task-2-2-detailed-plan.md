# 📋 TASK 2.2: 🎯 ЗАПОЛНЕНИЕ ПОЛЕЙ - Currency Selection & Amount Calculation

> **Фактический статус**: 🎯 **ГОТОВ К РЕАЛИЗАЦИИ** - карточки созданы, нужно заполнить placeholder-ы реальными полями.  
> **Цель**: Заменить placeholder контент в SendingSection/ReceivingSection на реальные поля ввода валют и сумм.

## 🎯 **Фактическое состояние - основано на скриншоте**

### ✅ Что УЖЕ ЕСТЬ (основа Task 2.1):

- ✅ **Карточки "Вы отправляете"/"Вы получаете"** - созданы через ExchangeForm.ExchangeCard
- ✅ **Layout структура** - ExchangeForm.CardPair layout="horizontal" работает
- ✅ **Placeholder контент** - в SendingSection показывает "Currency Selection (Task 2.2)", "Amount Input (Task 2.2)"
- ✅ **API хуки** - useExchangeRates, useExchangeMutation уже существуют
- ✅ **Constants** - CRYPTOCURRENCIES, TOKEN_STANDARDS, BANKS_BY_CURRENCY готовы
- ✅ **Types** - ExchangeFormData с нужными полями (fromCurrency, tokenStandard, etc.)

### 🎯 Что нужно ЗАМЕНИТЬ в Task 2.2:

**В SendingSection заменить placeholder блоки:**

```tsx
// ЗАМЕНИТЬ ЭТО:
<div className="currency-selection">
  <div className="placeholder-content h-20 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
    <span className="text-sm text-muted-foreground">Currency Selection (Task 2.2)</span>
  </div>
</div>

// НА РЕАЛЬНЫЕ ПОЛЯ:
<div className="currency-selection space-y-3">
  <Select name="fromCurrency" options={CRYPTOCURRENCIES} placeholder="Выберите криптовалюту" />
  <Select name="tokenStandard" options={TOKEN_STANDARDS} placeholder="Стандарт токена" />
</div>
```

**В ReceivingSection заменить placeholder блоки:**

```tsx
// ЗАМЕНИТЬ ЭТО:
<div className="bank-selection">
  <div className="placeholder-content h-20 bg-background border border-dashed border-muted-foreground/30 rounded-md">
    <span className="text-sm text-muted-foreground">Bank Selection (Task 2.2)</span>
  </div>
</div>

// НА РЕАЛЬНЫЕ ПОЛЯ:
<div className="bank-selection space-y-3">
  <Select name="selectedBankId" options={BANKS_BY_CURRENCY.UAH} placeholder="Выберите банк" />
  <Input name="cardNumber" mask="**** **** **** ****" placeholder="Номер карты" />
</div>
```

## 📐 **Конкретные шаги реализации Task 2.2**

### 🔧 **Шаг 1: Обновить SendingSection в ExchangeLayout.tsx**

```tsx
// В SendingSection заменить placeholder-ы на:
import { Input, Select } from '@repo/ui';
import { CRYPTOCURRENCIES, TOKEN_STANDARDS } from '@repo/constants';

function SendingSection({ t, form }: { t: (key: string) => string; form: any }) {
  return (
    <ExchangeForm.ExchangeCard type="sending">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('sending.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('sending.subtitle')}</p>
      </header>

      <div className="send-content space-y-4">
        {/* Выбор криптовалюты */}
        <ExchangeForm.FieldWrapper>
          <label className="text-sm font-medium">{t('sending.currency')}</label>
          <Select
            name="fromCurrency"
            options={CRYPTOCURRENCIES.map(crypto => ({ value: crypto, label: crypto }))}
            placeholder={t('sending.currency.placeholder')}
          />
        </ExchangeForm.FieldWrapper>

        {/* Стандарт токена */}
        <ExchangeForm.FieldWrapper>
          <label className="text-sm font-medium">{t('sending.tokenStandard')}</label>
          <Select
            name="tokenStandard"
            options={TOKEN_STANDARDS.map(standard => ({ value: standard, label: standard }))}
            placeholder={t('sending.tokenStandard.placeholder')}
          />
        </ExchangeForm.FieldWrapper>

        {/* Сумма отправки */}
        <ExchangeForm.FieldWrapper>
          <label className="text-sm font-medium">{t('sending.amount')}</label>
          <Input
            name="cryptoAmount"
            type="number"
            step="0.00000001"
            placeholder="0.00000000"
            onChange={e => {
              // Автоматический пересчет будет через useExchange
            }}
          />
        </ExchangeForm.FieldWrapper>
      </div>
    </ExchangeForm.ExchangeCard>
  );
}
```

### 🔧 **Шаг 2: Обновить ReceivingSection в ExchangeLayout.tsx**

```tsx
// В ReceivingSection заменить placeholder-ы на:
import { BANKS_BY_CURRENCY } from '@repo/constants';

function ReceivingSection({ t, form }: { t: (key: string) => string; form: any }) {
  return (
    <ExchangeForm.ExchangeCard type="receiving">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('receiving.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('receiving.subtitle')}</p>
      </header>

      <div className="receive-content space-y-4">
        {/* Выбор банка */}
        <ExchangeForm.FieldWrapper>
          <label className="text-sm font-medium">{t('receiving.bank')}</label>
          <Select
            name="selectedBankId"
            options={BANKS_BY_CURRENCY.UAH.map(bank => ({
              value: bank.id,
              label: bank.name,
              icon: bank.logoUrl,
            }))}
            placeholder={t('receiving.bank.placeholder')}
          />
        </ExchangeForm.FieldWrapper>

        {/* Номер карты */}
        <ExchangeForm.FieldWrapper>
          <label className="text-sm font-medium">{t('receiving.cardNumber')}</label>
          <Input
            name="cardNumber"
            placeholder="**** **** **** ****"
            mask="9999 9999 9999 9999"
            inputMode="numeric"
          />
        </ExchangeForm.FieldWrapper>

        {/* Сумма получения (автоматическая) */}
        <ExchangeForm.FieldWrapper>
          <label className="text-sm font-medium">{t('receiving.amount')}</label>
          <Input
            name="uahAmount"
            type="number"
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

<ExchangeForm.FieldWrapper>
<Select
name="tokenStandard"
options={TOKEN_STANDARDS}
placeholder={t('sending.tokenStandard.placeholder')}
/>
</ExchangeForm.FieldWrapper>

<ExchangeForm.FieldWrapper>
<Input
name="cryptoAmount"
type="number"
placeholder={t('sending.amount.placeholder')}
/>
</ExchangeForm.FieldWrapper>

````

### 🔧 **Доработка ReceivingSection в ExchangeLayout.tsx**:

```tsx
// Добавить в существующий ReceivingSection:
import { BANKS_BY_CURRENCY } from '@repo/constants';

// В ExchangeForm.ExchangeCard для получения:
<ExchangeForm.FieldWrapper>
  <Select
    name="selectedBankId"
    options={BANKS_BY_CURRENCY.UAH}
    placeholder={t('receiving.bank.placeholder')}
  />
</ExchangeForm.FieldWrapper>

<ExchangeForm.FieldWrapper>
  <Input
    name="cardNumber"
    placeholder={t('receiving.card.placeholder')}
    mask="**** **** **** ****"
  />
</ExchangeForm.FieldWrapper>

<ExchangeForm.FieldWrapper>
  <Input
    name="uahAmount"
    type="number"
    disabled
    value={calculatedAmount}
    placeholder={t('receiving.amount.placeholder')}
  />
</ExchangeForm.FieldWrapper>
### 🔧 **Интеграция с useExchange для автоматических расчетов**:

```tsx
// В ExchangeContainer.tsx добавить:
import { useExchange } from '@repo/hooks/src/business/useExchange';
import { useExchangeRates } from '@/hooks/useExchangeMutation';

export function ExchangeContainer({ locale, initialParams }: ExchangeContainerProps) {
  const t = useTranslations('AdvancedExchangeForm');

  // Интеграция с бизнес-логикой (уже существует)
  const {
    formData,
    setFormData,
    validateForm,
    isLoading,
    getDisplayRate  // добавить вызов
  } = useExchange();

  // Курсы валют (уже существует)
  const { data: rates, isLoading: ratesLoading } = useExchangeRates();

  // Передать в ExchangeLayout:
  return (
    <ExchangeForm.Container variant="full">
      <ExchangeLayout
        form={form}
        t={t}
        rates={rates}
        displayRate={getDisplayRate}
        isLoading={isLoading || ratesLoading}
      />
    </ExchangeForm.Container>
  );
}
````

### 🔧 **Добавить ExchangeRateDisplay между секциями**:

````tsx
// В ExchangeLayout.tsx между SendingSection и ReceivingSection:
<ExchangeForm.Arrow>
  <div className="exchange-rate-display">
    <span className="rate-label">{t('rate.label')}</span>
    <span className="rate-value">
      {displayRate ? `1 ${formData.fromCurrency} = ${displayRate} UAH` : '---'}
    </span>
  </div>
</ExchangeForm.Arrow>
### 🎯 **Конкретные шаги для реализации Task 2.2**:

#### 1. **Обновить ExchangeLayout.tsx** - добавить поля в существующие секции:

```tsx
// В SendingSection добавить:
<ExchangeForm.FieldWrapper>
  <label>{t('sending.currency')}</label>
  <Select name="fromCurrency">
    {CRYPTOCURRENCIES.map(crypto => (
      <option key={crypto} value={crypto}>{crypto}</option>
    ))}
  </Select>
</ExchangeForm.FieldWrapper>

<ExchangeForm.FieldWrapper>
  <label>{t('sending.tokenStandard')}</label>
  <Select name="tokenStandard">
    {TOKEN_STANDARDS.map(standard => (
      <option key={standard} value={standard}>{standard}</option>
    ))}
  </Select>
</ExchangeForm.FieldWrapper>

<ExchangeForm.FieldWrapper>
  <label>{t('sending.amount')}</label>
  <Input
    name="cryptoAmount"
    type="number"
    placeholder="0.00"
    onChange={(e) => {
      // Автоматический пересчет через useExchange
      setFormData({ cryptoAmount: e.target.value });
    }}
  />
</ExchangeForm.FieldWrapper>
````

#### 2. **Обновить ReceivingSection** - добавить поля банков и карт:

````tsx
// В ReceivingSection добавить:
<ExchangeForm.FieldWrapper>
  <label>{t('receiving.bank')}</label>
  <Select name="selectedBankId">
    {BANKS_BY_CURRENCY.UAH.map(bank => (
      <option key={bank.id} value={bank.id}>{bank.name}</option>
    ))}
  </Select>
</ExchangeForm.FieldWrapper>

<ExchangeForm.FieldWrapper>
  <label>{t('receiving.cardNumber')}</label>
  <Input
    name="cardNumber"
    placeholder="**** **** **** ****"
    mask="9999 9999 9999 9999"
  />
</ExchangeForm.FieldWrapper>

<ExchangeForm.FieldWrapper>
  <label>{t('receiving.amount')}</label>
  <Input
    name="uahAmount"
    type="number"
    disabled
    value={formData.uahAmount || ''}
    placeholder="0.00 UAH"
  />
</ExchangeForm.FieldWrapper>
#### 3. **Добавить отображение курса через ExchangeForm.Arrow**:

```tsx
// Между SendingSection и ReceivingSection в ExchangeLayout.tsx:
<ExchangeForm.Arrow>
  <div className="exchange-rate-display text-center">
    <div className="rate-info">
      {rates && formData.fromCurrency ? (
        <>
          <span className="rate-label text-sm text-muted-foreground">
            {t('rate.current')}
          </span>
          <span className="rate-value text-lg font-semibold">
            1 {formData.fromCurrency} = {getDisplayRate()} UAH
          </span>
        </>
      ) : (
        <span className="rate-loading">{t('rate.loading')}</span>
      )}
    </div>
  </div>
</ExchangeForm.Arrow>
````

#### 4. **Интегрировать локализацию в ru.json**:

```json
// apps/web/messages/ru.json - добавить в AdvancedExchangeForm:
"sending": {
  "currency": "Отдаете валюту",
  "tokenStandard": "Стандарт токена",
  "amount": "Сумма отправки"
},
"receiving": {
  "bank": "Банк получения",
  "cardNumber": "Номер карты",
  "amount": "Сумма получения"
},
"rate": {
  "current": "Текущий курс:",
  "loading": "Загрузка курса..."
}
```

## ✅ **Success Metrics - ОБНОВЛЕНО**

### ✅ Что уже работает:

- ExchangeLayout.tsx с правильной структурой Compound Components
- useExchange хук с автоматическими расчетами
- useExchangeRates с обновлением каждые 30 секунд
- ExchangeFormData типы с правильными полями

### 🎯 Что нужно добавить:

- [ ] Поля выбора валют в SendingSection
- [ ] Поля банков и карт в ReceivingSection
- [ ] Отображение курса через ExchangeForm.Arrow
- [ ] Автоматический пересчет при изменении суммы
- [ ] Обработка loading состояний для курсов

---

**Статус**: ✅ АРХИТЕКТУРА ГОТОВА, требует реализации полей  
**Зависимости**: Task 2.1 (COMPLETED) ✅  
**Следующий шаг**: Добавить конкретные поля в существующие компоненты

// Get currency limits
const { data: limits } = trpc.exchange.getLimits.useQuery(
{ currency: values.fromCurrency },
{ enabled: !!values.fromCurrency }
);

// Handle currency change
const handleCurrencyChange = (newCurrency: CryptoCurrency) => {
setFieldValue('fromCurrency', newCurrency);

    // Reset token standard if currency doesn't support current one
    const supportedStandards = TOKEN_STANDARDS[newCurrency] || [];
    if (!supportedStandards.includes(values.fromTokenStandard)) {
      setFieldValue('fromTokenStandard', supportedStandards[0] || 'ERC-20');
    }

};

// Get available token standards for selected currency
const availableStandards = TOKEN_STANDARDS[values.fromCurrency] || [];

return (

<section className="sending-section bg-muted/50 border border-border rounded-lg p-6">
<header className="section-header mb-6">
<h2 className="text-xl font-semibold text-foreground">{t('sending.title')}</h2>
<p className="text-sm text-muted-foreground mt-1">{t('sending.subtitle')}</p>
</header>

      <div className="sending-content space-y-4">
        {/* Cryptocurrency Selection */}
        <FormField name="fromCurrency" error={form.errors.fromCurrency}>
          <FormLabel className="text-sm font-medium">{t('sending.currency')}</FormLabel>
          <FormControl>
            <Select value={values.fromCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('sending.selectCurrency')} />
              </SelectTrigger>
              <SelectContent>
                {CRYPTOCURRENCIES.map(currency => (
                  <SelectItem key={currency} value={currency}>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{currency}</span>
                      <span className="text-sm text-muted-foreground">
                        {t(`currencies.${currency}.name`)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormField>

        {/* Token Standard Selection (for USDT, USDC, etc.) */}
        {availableStandards.length > 1 && (
          <FormField name="fromTokenStandard" error={form.errors.fromTokenStandard}>
            <FormLabel className="text-sm font-medium">{t('sending.tokenStandard')}</FormLabel>
            <FormControl>
              <Select
                value={values.fromTokenStandard}
                onValueChange={value => setFieldValue('fromTokenStandard', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableStandards.map(standard => (
                    <SelectItem key={standard} value={standard}>
                      <div className="flex items-center justify-between w-full">
                        <span>{standard}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {t(`tokenStandards.${standard}.network`)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormField>
        )}

        {/* Crypto Amount Input */}
        <FormField name="cryptoAmount" error={form.errors.cryptoAmount}>
          <FormLabel className="text-sm font-medium">{t('sending.amount')}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...getFieldProps('cryptoAmount')}
                type="number"
                step="0.00000001"
                min="0"
                placeholder={t('sending.amountPlaceholder')}
                className="pr-16"
                inputMode="decimal"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {values.fromCurrency}
                </span>
              </div>
            </div>
          </FormControl>

          {/* Display limits */}
          {limits && (
            <div className="text-xs text-muted-foreground mt-1">
              {t('sending.limits', {
                min: limits.min,
                max: limits.max,
                currency: values.fromCurrency,
              })}
            </div>
          )}

          <FormMessage />
        </FormField>

        {/* Quick Amount Buttons */}
        <div className="quick-amounts">
          <p className="text-xs text-muted-foreground mb-2">{t('sending.quickAmounts')}</p>
          <div className="flex flex-wrap gap-2">
            {[0.01, 0.1, 0.5, 1.0, 5.0].map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => setFieldValue('cryptoAmount', amount)}
                className="px-3 py-1 text-xs border border-border rounded-md hover:bg-muted transition-colors"
              >
                {amount} {values.fromCurrency}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>

);
}

````

### 3. **Receiving Section** (`ReceivingSection.tsx`)

```tsx
// apps/web/app/[locale]/exchange/components/ReceivingSection.tsx
'use client';

import { UseFormReturn } from '@repo/hooks';
import { ExchangeFormData, BankId } from '@repo/exchange-core/src/types';
import { UAH_BANKS } from '@repo/constants/src/exchange';
import {
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
} from '@repo/ui';
import { RouterOutputs } from '@repo/utils';

interface ReceivingSectionProps {
  form: UseFormReturn<ExchangeFormData>;
  t: (key: string) => string;
  calculation?: RouterOutputs['exchange']['calculateExchange'];
}

export function ReceivingSection({ form, t, calculation }: ReceivingSectionProps) {
  const { values, getFieldProps, setFieldValue, errors } = form;

  // Handle bank change
  const handleBankChange = (newBankId: BankId) => {
    setFieldValue('selectedBank', newBankId);
  };

  // Format UAH amount display
  const formatUahAmount = (amount: number | undefined) => {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('uk-UA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <section className="receiving-section bg-muted/50 border border-border rounded-lg p-6">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('receiving.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('receiving.subtitle')}</p>
      </header>

      <div className="receiving-content space-y-4">
        {/* Bank Selection */}
        <FormField name="selectedBank" error={errors.selectedBank}>
          <FormLabel className="text-sm font-medium">{t('receiving.bank')}</FormLabel>
          <FormControl>
            <Select value={values.selectedBank} onValueChange={handleBankChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('receiving.selectBank')} />
              </SelectTrigger>
              <SelectContent>
                {UAH_BANKS.filter(bank => bank.isActive).map(bank => (
                  <SelectItem key={bank.id} value={bank.id}>
                    <div className="flex items-center space-x-3">
                      {bank.logoUrl && (
                        <img
                          src={bank.logoUrl}
                          alt={bank.name}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      <div>
                        <div className="font-medium">{bank.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {t('receiving.limits')}: {bank.minAmount} - {bank.maxAmount} UAH
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormField>

        {/* UAH Amount Display */}
        <FormField name="uahAmount">
          <FormLabel className="text-sm font-medium">{t('receiving.amount')}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                value={formatUahAmount(values.uahAmount)}
                readOnly
                className="pr-16 bg-muted/30 text-lg font-semibold"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-sm font-medium text-muted-foreground">UAH</span>
              </div>
            </div>
          </FormControl>

          {/* Calculation Details */}
          {calculation && (
            <div className="calculation-details text-xs text-muted-foreground mt-2 space-y-1">
              <div className="flex justify-between">
                <span>{t('receiving.rate')}:</span>
                <span>
                  1 {values.fromCurrency} = {calculation.rate} UAH
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('receiving.commission')}:</span>
                <span>
                  {calculation.commission}% (-{formatUahAmount(calculation.commissionAmount)} UAH)
                </span>
              </div>
            </div>
          )}
        </FormField>

        {/* Card Number Input */}
        <FormField name="cardNumber" error={errors.cardNumber}>
          <FormLabel className="text-sm font-medium">{t('receiving.cardNumber')}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...getFieldProps('cardNumber')}
                type="text"
                placeholder={t('receiving.cardNumberPlaceholder')}
                className="pr-16"
                inputMode="numeric"
                maxLength={19}
                onInput={e => {
                  // Format card number with spaces
                  let value = e.currentTarget.value.replace(/\D/g, '');
                  value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                  e.currentTarget.value = value;
                  setFieldValue('cardNumber', value.replace(/\s/g, ''));
                }}
              />

              {/* Payment System Icon */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {values.cardNumber.length >= 6 && (
                  <div className="w-8 h-5 bg-muted border rounded text-xs flex items-center justify-center">
                    VISA
                  </div>
                )}
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormField>

        {/* Card Validation Status */}
        {values.cardNumber && (
          <div className="card-validation text-xs">
            {errors.cardNumber ? (
              <div className="text-destructive flex items-center space-x-1">
                <span>❌</span>
                <span>{t('receiving.cardInvalid')}</span>
              </div>
            ) : values.cardNumber.length >= 13 ? (
              <div className="text-green-600 flex items-center space-x-1">
                <span>✅</span>
                <span>{t('receiving.cardValid')}</span>
              </div>
            ) : (
              <div className="text-muted-foreground">{t('receiving.cardMinLength')}</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
````

### 4. **Exchange Rate Display** (`ExchangeRateDisplay.tsx`)

```tsx
// apps/web/app/[locale]/exchange/components/ExchangeRateDisplay.tsx
'use client';

import { CryptoCurrency } from '@repo/exchange-core/src/types';
import { RefreshCw } from 'lucide-react';
import { Button } from '@repo/ui';

interface ExchangeRateDisplayProps {
  currentRate?: number;
  commission?: number;
  fromCurrency: CryptoCurrency;
  t: (key: string) => string;
}

export function ExchangeRateDisplay({
  currentRate,
  commission,
  fromCurrency,
  t,
}: ExchangeRateDisplayProps) {
  if (!currentRate) {
    return (
      <div className="exchange-rate-loading flex items-center justify-center py-4 mb-6">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t('rate.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="exchange-rate-display bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="rate-info">
          <div className="rate-primary text-lg font-semibold text-foreground">
            1 {fromCurrency} = {currentRate.toFixed(2)} UAH
          </div>
          <div className="rate-secondary text-sm text-muted-foreground">
            {t('rate.commission')}: {commission}% • {t('rate.updated')}:{' '}
            {new Date().toLocaleTimeString()}
          </div>
        </div>

        <Button type="button" variant="ghost" size="sm" className="text-primary hover:text-primary">
          <RefreshCw className="w-4 h-4" />
          <span className="sr-only">{t('rate.refresh')}</span>
        </Button>
      </div>
    </div>
  );
}
```

## 🔗 **Integration with Task 2.1**

### Update ExchangeLayout.tsx:

```tsx
// Replace placeholder content in ExchangeLayout.tsx
import { CurrencyPairSection } from './CurrencyPairSection';

// Replace the two-column grid section:
<CurrencyPairSection form={form} t={t} />;
```

## 🎨 **CSS Architecture v3.0 Classes Used**

### Semantic Classes:

- `bg-muted/50` - Section backgrounds
- `border-border` - Consistent borders
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `bg-primary/5` - Accent backgrounds

### Mobile-First Responsive:

- `grid-cols-1 md:grid-cols-2` - Responsive grid
- `space-y-4` - Consistent vertical spacing
- `gap-6 lg:gap-8` - Responsive gaps

## ✅ **Validation Criteria**

### Functional Requirements:

- [ ] Currency selection работает для всех CRYPTOCURRENCIES
- [ ] Token standard selection показывается только для поддерживаемых валют
- [ ] Real-time exchange rate calculation через tRPC
- [ ] Bank selection с отображением лимитов
- [ ] Card number formatting и validation
- [ ] Amount limits отображаются корректно

### Technical Requirements:

- [ ] TypeScript типы корректны для всех props
- [ ] Form integration работает с validation schemas
- [ ] tRPC queries оптимизированы (refetch intervals, stale time)
- [ ] Loading states обрабатываются правильно
- [ ] Error handling для API calls

### UI/UX Requirements:

- [ ] Responsive design на всех устройствах
- [ ] Accessibility (ARIA labels, semantic HTML)
- [ ] Visual feedback для validation states
- [ ] Smooth transitions и hover effects
- [ ] Real-time updates без page refreshes

---

**Статус**: ✅ Ready for implementation  
**Зависимости**: Task 2.1 (Page Structure)  
**Следующий шаг**: Task 2.3 - Personal Data & Security Section
