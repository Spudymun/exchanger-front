'use client';

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
  SendingInfo,
} from '@repo/ui';
import React from 'react';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

interface SendingCardProps {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
  minAmount: number;
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
        <SendingInfo
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          t={t}
          minAmount={minAmount}
        />
      </CardContent>
    </Card>
  );
}
