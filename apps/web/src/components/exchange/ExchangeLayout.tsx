'use client';

import { UseFormReturn } from '@repo/hooks';
import {
  ExchangeForm,
  TokenStandardSelector,
  CryptoCurrencySelector,
  ExchangeBankSelector,
  CryptoAmountInput,
  CardNumberInput,
  SendingInfo,
  FormField,
  FormLabel,
  FormControl,
  Input,
} from '@repo/ui';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

interface ExchangeLayoutProps {
  form: UseFormReturn<HeroExchangeFormData>;
  t: (key: string) => string;
  calculatedAmount?: number;
  isValid?: boolean;
}

// Currency selector component

// Sending section using Compound Components
function SendingSection({
  form,
  t,
}: {
  form: UseFormReturn<HeroExchangeFormData>;
  t: (key: string) => string;
}) {
  return (
    <ExchangeForm.ExchangeCard type="sending">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('sending.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('sending.subtitle')}</p>
      </header>

      <div className="send-content space-y-4">
        <CryptoCurrencySelector
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          t={t}
          autoSetTokenStandard={false}
        />

        {/* Token Standard */}
        <TokenStandardSelector
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          t={t}
        />

        {/* Amount Input */}
        <CryptoAmountInput
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          t={t}
          useValidation={true}
        />

        {/* Sending Info */}
        <SendingInfo form={form as unknown as UseFormReturn<Record<string, unknown>>} t={t} />
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
  form: UseFormReturn<HeroExchangeFormData>;
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
        <ExchangeBankSelector
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          t={t}
        />

        {/* Card Number */}
        <CardNumberInput form={form as unknown as UseFormReturn<Record<string, unknown>>} t={t} />

        {/* Amount Display */}
        <FormField name="toAmount">
          <FormLabel>{t('receiving.amount')}</FormLabel>
          <FormControl>
            <Input
              value={calculatedAmount.toFixed(2)}
              readOnly
              className="bg-muted/50 text-foreground cursor-default pointer-events-none transition-none focus-visible:ring-0 focus-visible:border-input border-input"
            />
          </FormControl>
        </FormField>
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

export function ExchangeLayout({
  form,
  t,
  calculatedAmount = 0,
  isValid: _isValid,
}: ExchangeLayoutProps) {
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
