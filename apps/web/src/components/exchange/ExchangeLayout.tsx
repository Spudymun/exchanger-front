'use client';

import { type CryptoCurrency } from '@repo/constants';
import { getMinCryptoAmountForUI } from '@repo/exchange-core';
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
  SubmitButton,
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
  // Функция для автоматического обновления суммы при смене валюты
  const handleCurrencyChange = (newCurrency: string) => {
    // Получаем минимальную сумму для новой валюты напрямую
    const minAmountForCurrency = getMinCryptoAmountForUI(newCurrency as CryptoCurrency);

    // Обновляем сумму до минимальной для новой валюты
    form.setValue('fromAmount', minAmountForCurrency.toString());
  };

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
          onCurrencyChange={handleCurrencyChange}
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
  return (
    <section className="security-section bg-muted/50 border border-border rounded-lg p-6">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('security.title')}</h2>
      </header>

      <div className="space-y-4">
        {/* CAPTCHA Field - теперь использует централизованные переводы из Layout.captcha */}
        <FormCaptchaField
          form={form as unknown as UseFormReturn<{ captcha: string }>}
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

// Exchange Terms Section Component
function ExchangeTermsSection({
  form: _form,
  t,
}: {
  form: UseFormReturn<SecurityEnhancedFullExchangeForm>;
  t: (key: string) => string;
}) {
  return (
    <section className="exchange-terms-section bg-muted/50 border border-border rounded-lg p-6">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('exchangeTerms.title')}</h2>
      </header>

      <div className="space-y-4">
        {/* Processing Time */}
        <div className="terms-item">
          <h3 className="font-medium text-foreground mb-2">
            {t('exchangeTerms.processingTime.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('exchangeTerms.processingTime.description')}
          </p>
        </div>

        {/* Confirmations */}
        <div className="terms-item">
          <h3 className="font-medium text-foreground mb-2">
            {t('exchangeTerms.confirmations.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('exchangeTerms.confirmations.description')}
          </p>
        </div>

        {/* Operational Details */}
        <div className="terms-item">
          <h3 className="font-medium text-foreground mb-2">
            {t('exchangeTerms.operationalDetails.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('exchangeTerms.operationalDetails.description')}
          </p>
        </div>
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

      {/* Submit Section - РЕАЛИЗОВАНО */}
      <section className="submit-section">
        <ExchangeForm.ActionArea variant="separated">
          <SubmitButton form={form} context="exchange" t={t} variant="default" size="lg" />
        </ExchangeForm.ActionArea>
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
    <div className="exchange-layout">
      {/* Exchange Terms Section - на самом верху */}
      <div className="mb-8">
        <ExchangeTermsSection form={form} t={t} />
      </div>

      {/* Two-Column Layout using Compound Components */}
      <ExchangeForm.CardPair layout="horizontal">
        <SendingSection form={form} t={t} />
        <ReceivingSection form={form} t={t} calculatedAmount={calculatedAmount} />
      </ExchangeForm.CardPair>

      <AdditionalSections form={form} t={t} />
    </div>
  );
}
