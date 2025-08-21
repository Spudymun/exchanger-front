# 📋 TASK 2.2: Currency Selection & Amount Calculation Components

> **Цель**: Реализовать currency selection, amount input/display и real-time exchange rate calculation для двухколоночного layout формы exchange.

## 🎯 **Scope Definition - на 100% основано на архитектурном анализе**

### Создаваемые файлы:

- `apps/web/app/[locale]/exchange/components/CurrencyPairSection.tsx` - главный компонент для валютного обмена
- `apps/web/app/[locale]/exchange/components/SendingSection.tsx` - левая колонка "Отдаете"
- `apps/web/app/[locale]/exchange/components/ReceivingSection.tsx` - правая колонка "Получаете"
- `apps/web/app/[locale]/exchange/components/ExchangeRateDisplay.tsx` - отображение курса

### Интеграция с существующими системами:

- **API Integration**: `useExchangeRates`, `useExchangeMutation` hooks (СУЩЕСТВУЮТ)
- **Constants**: `CRYPTOCURRENCIES`, `TOKEN_STANDARDS`, `UAH_BANKS` (ГОТОВО в task 1.2)
- **Types**: `CryptoCurrency`, `TokenStandard`, `BankId` (ГОТОВО в task 1.3)
- **UI Components**: `Select`, `Input`, `Button` from `@repo/ui` (СУЩЕСТВУЮТ)
- **Validation**: `securityEnhancedAdvancedExchangeFormSchema` (ГОТОВО в task 1.1)

### Architectural Requirements from Acceptance Criteria:

- Real-time exchange rate calculation через `trpc.exchange.calculateExchange`
- Currency limits integration через `trpc.exchange.getLimits`
- Bank selection с dynamic limits loading
- Amount calculation с proper formatting и validation

## 📐 **Technical Implementation Plan**

### 1. **Main Currency Pair Section** (`CurrencyPairSection.tsx`)

```tsx
// apps/web/app/[locale]/exchange/components/CurrencyPairSection.tsx
'use client';

import { UseFormReturn } from '@repo/hooks';
import { ExchangeFormData } from '@repo/exchange-core/src/types';
import { SendingSection } from './SendingSection';
import { ReceivingSection } from './ReceivingSection';
import { ExchangeRateDisplay } from './ExchangeRateDisplay';
import { trpc } from '@/lib/trpc-provider';
import { useEffect } from 'react';

interface CurrencyPairSectionProps {
  form: UseFormReturn<ExchangeFormData>;
  t: (key: string) => string;
}

export function CurrencyPairSection({ form, t }: CurrencyPairSectionProps) {
  const { values, setFieldValue } = form;

  // Real-time exchange rate calculation
  const { data: exchangeRates } = trpc.exchange.getRates.useQuery(undefined, {
    refetchInterval: 30000, // Update every 30 seconds
    staleTime: 30000,
  });

  const { data: calculation } = trpc.exchange.calculateExchange.useQuery(
    {
      amount: values.cryptoAmount,
      currency: values.fromCurrency,
      direction: 'crypto-to-uah',
    },
    {
      enabled: values.cryptoAmount > 0 && !!values.fromCurrency,
      refetchOnWindowFocus: false,
    }
  );

  // Update UAH amount when calculation changes
  useEffect(() => {
    if (calculation?.uahAmount) {
      setFieldValue('uahAmount', calculation.uahAmount);
    }
  }, [calculation?.uahAmount, setFieldValue]);

  return (
    <div className="currency-pair-section">
      {/* Exchange Rate Display */}
      <ExchangeRateDisplay
        currentRate={calculation?.rate}
        commission={calculation?.commission}
        fromCurrency={values.fromCurrency}
        t={t}
      />

      {/* Two-Column Currency Layout */}
      <div className="currency-grid grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
        <SendingSection form={form} t={t} />
        <ReceivingSection form={form} t={t} calculation={calculation} />
      </div>
    </div>
  );
}
```

### 2. **Sending Section** (`SendingSection.tsx`)

```tsx
// apps/web/app/[locale]/exchange/components/SendingSection.tsx
'use client';

import { UseFormReturn } from '@repo/hooks';
import { ExchangeFormData, CryptoCurrency } from '@repo/exchange-core/src/types';
import { CRYPTOCURRENCIES, TOKEN_STANDARDS } from '@repo/constants/src/exchange';
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
import { trpc } from '@/lib/trpc-provider';

interface SendingSectionProps {
  form: UseFormReturn<ExchangeFormData>;
  t: (key: string) => string;
}

export function SendingSection({ form, t }: SendingSectionProps) {
  const { values, getFieldProps, setFieldValue } = form;

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
```

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
```

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
