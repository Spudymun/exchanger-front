'use client';

import { CRYPTOCURRENCIES, getBanksForCurrency, type FiatCurrency } from '@repo/constants';
import { UseFormReturn } from '@repo/hooks';
import {
  ExchangeForm,
  FormField,
  FormControl,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  TokenStandardSelector,
  CryptoCurrencySelector,
  ExchangeBankSelector,
  CryptoAmountInput,
} from '@repo/ui';

interface ExchangeLayoutProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  calculatedAmount?: number;
}

/**
 * ❌ BACKUP: Дублированный компонент - заменить на CryptoAmountInput из @repo/ui
 * @deprecated Использовать CryptoAmountInput с useValidation=false
 */
function _AmountInput({
  form,
  t,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
}) {
  return (
    <ExchangeForm.FieldWrapper>
      <FormField name="fromAmount" error={form.errors.fromAmount}>
        <ExchangeForm.FieldLabel>{t('sending.amount')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Input
            {...form.getFieldProps('fromAmount')}
            type="text"
            placeholder={t('sending.amount')}
            value={(form.values.fromAmount as string) || ''}
            onChange={e => form.setValue('fromAmount', e.target.value)}
          />
        </FormControl>
        <FormMessage />
      </FormField>
    </ExchangeForm.FieldWrapper>
  );
}

// AmountDisplay Component
function AmountDisplay({
  form,
  t,
  calculatedAmount,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  calculatedAmount: number;
}) {
  return (
    <ExchangeForm.FieldWrapper>
      <FormField name="toAmount" error={form.errors?.toAmount}>
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
  );
}

// CardNumber Input Component
function CardNumberInput({
  form,
  t,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
}) {
  return (
    <ExchangeForm.FieldWrapper>
      <FormField name="cardNumber" error={form.errors.cardNumber}>
        <ExchangeForm.FieldLabel>{t('receiving.cardNumber')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Input
            {...form.getFieldProps('cardNumber')}
            placeholder="**** **** **** ****"
            inputMode="numeric"
            className="transition-colors"
            value={(form.values.cardNumber as string) || ''}
          />
        </FormControl>
        <FormMessage />
      </FormField>
    </ExchangeForm.FieldWrapper>
  );
}
/**
 * ❌ BACKUP: Дублированный компонент - заменить на ExchangeBankSelector из @repo/ui
 * @deprecated Использовать ExchangeBankSelector без передачи banks (автовычисление)
 */
function _BankSelector({
  form,
  t,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
}) {
  // Following the same pattern as in useHeroExchangeForm.ts
  const currency = form.values.toCurrency;
  const validKeys = ['UAH', 'USD', 'EUR'] as const;
  const banks = validKeys.includes(currency as (typeof validKeys)[number])
    ? getBanksForCurrency(currency as FiatCurrency)
    : [];

  return (
    <ExchangeForm.FieldWrapper>
      <ExchangeForm.FieldLabel>{t('receiving.bank')}</ExchangeForm.FieldLabel>
      <FormField name="selectedBankId" error={form.errors.selectedBankId}>
        <FormControl>
          <Select
            value={form.values.selectedBankId as string}
            onValueChange={v => form.setValue('selectedBankId', v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('receiving.selectBank')} />
            </SelectTrigger>
            <SelectContent>
              {banks.map(bank => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormField>
    </ExchangeForm.FieldWrapper>
  );
}

// Currency selector component
/**
 * ❌ BACKUP: Дублированный компонент - заменить на CryptoCurrencySelector из @repo/ui
 * @deprecated Использовать CryptoCurrencySelector с autoSetTokenStandard=false
 */
function _CurrencySelector({
  form,
  t,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
}) {
  return (
    <ExchangeForm.FieldWrapper>
      <ExchangeForm.FieldLabel>{t('sending.cryptocurrency')}</ExchangeForm.FieldLabel>
      <FormField name="fromCurrency" error={form.errors.fromCurrency}>
        <FormControl>
          <Select
            value={form.values.fromCurrency as string}
            onValueChange={v => form.setValue('fromCurrency', v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('sending.selectCurrency')} />
            </SelectTrigger>
            <SelectContent>
              {CRYPTOCURRENCIES.map(currency => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormField>
    </ExchangeForm.FieldWrapper>
  );
}

// Sending section using Compound Components
function SendingSection({
  form,
  t,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
}) {
  return (
    <ExchangeForm.ExchangeCard type="sending">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('sending.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('sending.subtitle')}</p>
      </header>

      <div className="send-content space-y-4">
        <CryptoCurrencySelector form={form} t={t} autoSetTokenStandard={false} />

        {/* Token Standard */}
        <TokenStandardSelector form={form} t={t} />

        {/* Amount Input */}
        <CryptoAmountInput form={form} t={t} useValidation={false} />
      </div>
    </ExchangeForm.ExchangeCard>
  );
}

// Receiving section using Compound Components
function ReceivingSection({
  form,
  t,
  calculatedAmount = 0,
}: {
  form: UseFormReturn<Record<string, unknown>>;
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
        {/* Bank Selection */}
        <ExchangeBankSelector form={form} t={t} />

        {/* Card Number */}
        <CardNumberInput form={form} t={t} />

        {/* Amount Display */}
        <AmountDisplay form={form} t={t} calculatedAmount={calculatedAmount} />
      </div>
    </ExchangeForm.ExchangeCard>
  );
}

// Additional sections component
function AdditionalSections() {
  return (
    <div className="exchange-additional-sections mt-8 space-y-6">
      {/* Personal Data Section - будет реализовано в task 2.3 */}
      <section className="personal-data-section bg-muted/50 border border-border rounded-lg p-6">
        <header className="section-header mb-6">
          <h2 className="text-xl font-semibold text-foreground">Персональные данные</h2>
        </header>
        <div className="placeholder-content h-24 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Personal Data Form (Task 2.3)</span>
        </div>
      </section>

      {/* Security Section - будет реализовано в task 2.3 */}
      <section className="security-section bg-muted/50 border border-border rounded-lg p-6">
        <header className="section-header mb-6">
          <h2 className="text-xl font-semibold text-foreground">Безопасность</h2>
        </header>
        <div className="placeholder-content h-32 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Security & Verification (Task 2.3)</span>
        </div>
      </section>

      {/* Submit Section - будет реализовано в task 2.4 */}
      <section className="submit-section">
        <div className="placeholder-content h-16 bg-primary/10 border border-dashed border-primary/30 rounded-md flex items-center justify-center">
          <span className="text-sm text-primary">Submit Button & Actions (Task 2.4)</span>
        </div>
      </section>
    </div>
  );
}

export function ExchangeLayout({ form, t, calculatedAmount = 0 }: ExchangeLayoutProps) {
  return (
    <form onSubmit={form.handleSubmit} className="exchange-form">
      {/* Two-Column Layout using Compound Components */}
      <ExchangeForm.CardPair layout="horizontal">
        <SendingSection form={form} t={t} />
        <ReceivingSection form={form} t={t} calculatedAmount={calculatedAmount} />
      </ExchangeForm.CardPair>

      <AdditionalSections />
    </form>
  );
}
