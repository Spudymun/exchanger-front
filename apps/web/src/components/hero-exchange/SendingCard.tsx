'use client';

import { type CryptoCurrency } from '@repo/constants';
import { calculateUahAmount } from '@repo/exchange-core';
import { type UseFormReturn } from '@repo/hooks';
import { useFormWithNextIntl } from '@repo/hooks/src/client-hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TokenStandardSelector,
  CryptoCurrencySelector,
  CryptoAmountInput,
} from '@repo/ui';
import React from 'react';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

interface SendingCardProps {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
  minAmount: number;
}

function SendingInfo({
  form,
  t,
  minAmount,
}: {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
  minAmount: number;
}) {
  const fromCurrency = form.values.fromCurrency as CryptoCurrency;
  const exchangeRate = calculateUahAmount(1, fromCurrency);

  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div>
        {t('sending.min')}: {minAmount} {fromCurrency}
      </div>
      <div>
        {t('sending.rate')}: 1 {fromCurrency} = {exchangeRate} UAH
      </div>
    </div>
  );
}

export function SendingCard({ form, t, minAmount }: SendingCardProps) {
  return (
    <Card className="bg-card text-card-foreground border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-foreground">{t('sending.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CryptoCurrencySelector
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            t={t}
            autoSetTokenStandard={true}
          />
          <TokenStandardSelector
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            t={t}
          />
        </div>
        <CryptoAmountInput
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          t={t}
          useValidation={true}
        />
        <SendingInfo form={form} t={t} minAmount={minAmount} />
      </CardContent>
    </Card>
  );
}
