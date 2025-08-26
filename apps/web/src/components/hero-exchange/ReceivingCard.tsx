'use client';

import { getBanksForCurrency } from '@repo/constants';
import { useFormWithNextIntl, type UseFormReturn } from '@repo/hooks';
import {
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ExchangeBankSelector,
  FiatCurrencySelector,
  FormField,
  FormLabel,
  FormControl,
} from '@repo/ui';
import React from 'react';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

interface ReceivingCardProps {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  banks: ReturnType<typeof getBanksForCurrency>;
  calculatedAmount: number;
  t: (key: string) => string;
}

export function ReceivingInfo({
  form,
  t,
}: {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
}) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div>
        {t('receiving.reserve')}: 10,000,000 {form.values.toCurrency as string}
      </div>
      <div>{t('receiving.processing')}</div>
    </div>
  );
}

export function ReceivingCard({ form, banks, calculatedAmount, t }: ReceivingCardProps) {
  return (
    <Card className="bg-card text-card-foreground border-l-4 border-l-success shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-foreground">{t('receiving.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FiatCurrencySelector
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            t={t}
          />
          <ExchangeBankSelector
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            banks={banks}
            t={t}
          />
        </div>

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

        <ReceivingInfo form={form} t={t} />
      </CardContent>
    </Card>
  );
}
