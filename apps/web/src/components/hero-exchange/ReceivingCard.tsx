'use client';

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
  ReceivingInfo,
} from '@repo/ui';
import React from 'react';

import { useSupportedFiatCurrencies, useBanksForCurrency } from '../../hooks/useExchangeMutation';
import type { HeroExchangeFormData } from '../HeroExchangeForm';

interface ReceivingCardProps {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  calculatedAmount: number;
  t: (key: string) => string;
}

export function ReceivingCard({ form, calculatedAmount, t }: ReceivingCardProps) {
  // ✅ MIGRATION: Получаем данные из API вместо props
  const { data: supportedCurrencies } = useSupportedFiatCurrencies();
  const selectedCurrency = form.values.toCurrency as string;
  const { data: banks } = useBanksForCurrency(selectedCurrency);

  return (
    <Card className="bg-card text-card-foreground border-l-4 border-l-success shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-foreground">{t('receiving.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FiatCurrencySelector
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            currencies={supportedCurrencies}
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

        <ReceivingInfo form={form as unknown as UseFormReturn<Record<string, unknown>>} t={t} />
      </CardContent>
    </Card>
  );
}
