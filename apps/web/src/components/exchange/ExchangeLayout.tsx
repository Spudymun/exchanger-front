'use client';

import { CRYPTOCURRENCIES, getBanksForCurrency, type FiatCurrency, isMultiNetworkToken, getTokenStandards } from '@repo/constants';
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
} from '@repo/ui';

interface ExchangeLayoutProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  calculatedAmount?: number;
}

// TokenStandardSelector Component
function TokenStandardSelector({
  form,
  t,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
}) {
  const currency = form.values.fromCurrency as string;
  const isMultiNetwork = isMultiNetworkToken(currency);

  if (!isMultiNetwork) {
    return <div className="h-[76px]"></div>;
  }

  const standards = getTokenStandards(currency);

  return (
    <ExchangeForm.FieldWrapper>
      <FormField name="tokenStandard" error={form.errors.tokenStandard}>
        <ExchangeForm.FieldLabel>{t('sending.tokenStandard')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Select
            value={form.values.tokenStandard as string}
            onValueChange={v => form.setValue('tokenStandard', v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('sending.selectStandard')} />
            </SelectTrigger>
            <SelectContent>
              {standards.map(standard => (
                <SelectItem key={standard} value={standard}>
                  {standard}
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

// AmountInput Component
function AmountInput({
  form,
  t,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
}) {
  return (
    <ExchangeForm.FieldWrapper>
      <FormField name="cryptoAmount" error={form.errors.cryptoAmount}>
        <ExchangeForm.FieldLabel>{t('sending.amount')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Input
            {...form.getFieldProps('cryptoAmount')}
            placeholder={t('sending.placeholder')}
            inputMode="decimal"
            className="transition-colors"
            value={(form.values.cryptoAmount as string) || ''}
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
  calculatedAmount 
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
  t 
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
function BankSelector({
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
      <FormField name="selectedBank" error={form.errors.selectedBank}>
        <FormControl>
          <Select
            value={form.values.selectedBank as string}
            onValueChange={v => form.setValue('selectedBank', v)}
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
function CurrencySelector({
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
  t 
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
        <CurrencySelector form={form} t={t} />

        {/* Token Standard */}
        <TokenStandardSelector form={form} t={t} />

        {/* Amount Input */}
        <AmountInput form={form} t={t} />
      </div>
    </ExchangeForm.ExchangeCard>
  );
}

// Receiving section using Compound Components
function ReceivingSection({ 
  form, 
  t,
  calculatedAmount = 0 
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
        <BankSelector form={form} t={t} />

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
