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
  ReceivingInfo,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  FormEmailField,
  FormCaptchaField,
} from '@repo/ui';
import { type SecurityEnhancedFullExchangeForm } from '@repo/utils';
import React from 'react';

interface ExchangeLayoutProps {
  form: UseFormReturn<SecurityEnhancedFullExchangeForm>;
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
  form: UseFormReturn<SecurityEnhancedFullExchangeForm>;
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
        {/* Bank Selection */}
        <ExchangeBankSelector
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          t={t}
        />

        {/* Card Number */}
        {/* Card Number Input with validation */}
        <CardNumberInput form={form as unknown as UseFormReturn<Record<string, unknown>>} t={t} />

        {/* Amount Display */}
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

// Personal Data Section Component
function PersonalDataSection({
  form,
  t,
}: {
  form: UseFormReturn<SecurityEnhancedFullExchangeForm>;
  t: (key: string) => string;
}) {
  return (
    <section className="personal-data-section bg-muted/50 border border-border rounded-lg p-6">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('personalData.title')}</h2>
      </header>

      {/* Email Field - используем FormEmailField как универсальный компонент */}
      <FormEmailField
        form={form as unknown as UseFormReturn<{ email: string }>}
        t={t}
        fieldId="exchange-email"
      />
    </section>
  );
}

// Security Section Component
// Security Section Component
function SecuritySection({
  form,
  t,
}: {
  form: UseFormReturn<SecurityEnhancedFullExchangeForm>;
  t: (key: string) => string;
}) {
  // Мемоизированные props для FormCaptchaField для предотвращения бесконечных циклов
  const memoizedT = React.useCallback((key: string) => t(key), [t]);

  return (
    <section className="security-section bg-muted/50 border border-border rounded-lg p-6">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('security.title')}</h2>
      </header>

      <div className="space-y-4">
        {/* CAPTCHA Field - добавлено точно как в модальных окнах */}
        <FormCaptchaField
          form={form as unknown as UseFormReturn<{ captcha: string }>}
          t={memoizedT}
          isLoading={false}
        />

        {/* Terms Agreement */}
        <FormField name="agreeToTerms">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.values.agreeToTerms || false}
              onChange={e => form.setValue('agreeToTerms', e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <FormLabel className="text-sm">{t('security.terms.agreement')}</FormLabel>
          </div>
        </FormField>
      </div>
    </section>
  );
}

// Additional sections component
function AdditionalSections({
  form,
  t,
}: {
  form: UseFormReturn<SecurityEnhancedFullExchangeForm>;
  t: (key: string) => string;
}) {
  return (
    <div className="exchange-additional-sections mt-8 space-y-6">
      <PersonalDataSection form={form} t={t} />
      <SecuritySection form={form} t={t} />

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

      <AdditionalSections form={form} t={t} />
    </form>
  );
}
