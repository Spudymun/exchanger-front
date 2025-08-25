'use client';

import { getDefaultTokenStandard, CRYPTOCURRENCIES, type CryptoCurrency } from '@repo/constants';
import { calculateUahAmount } from '@repo/exchange-core';
import { type UseFormReturn } from '@repo/hooks';
import { useFormWithNextIntl } from '@repo/hooks/src/client-hooks';
import {
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TokenStandardSelector,
  CryptoCurrencySelector,
  CryptoAmountInput,
} from '@repo/ui';
import { useNumericInput } from '@repo/utils';
import React from 'react';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

interface SendingCardProps {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
  minAmount: number;
}

/**
 * ❌ BACKUP: Дублированный компонент - заменить на CryptoAmountInput из @repo/ui
 * @deprecated Использовать CryptoAmountInput с useValidation=true
 */
function _AmountInput({
  form,
  t,
}: {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
}) {
  const { handleKeyDown } = useNumericInput(form.values.fromCurrency as string);

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleKeyDown(e, form.values.fromAmount as string);
  };

  return (
    <FormField name="fromAmount" error={form.errors.fromAmount}>
      <FormLabel>{t('sending.amount')}</FormLabel>
      <FormControl>
        <Input
          {...form.getFieldProps('fromAmount')}
          onKeyDown={handleAmountKeyDown}
          placeholder={t('sending.placeholder')}
          aria-invalid={!!form.errors.fromAmount}
        />
      </FormControl>
      <FormMessage />
    </FormField>
  );
}

/**
 * ❌ BACKUP: Дублированный компонент - заменить на CryptoCurrencySelector из @repo/ui
 * @deprecated Использовать CryptoCurrencySelector с autoSetTokenStandard=true
 */
export function _CurrencySelector({
  form,
  t,
}: {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
}) {
  return (
    <FormField name="fromCurrency" error={form.errors.fromCurrency}>
      <FormLabel>{t('sending.cryptocurrency')}</FormLabel>
      <FormControl>
        <Select
          value={form.values.fromCurrency as string}
          onValueChange={v => {
            form.setValue('fromCurrency', v);
            const defaultStandard = getDefaultTokenStandard(v);
            if (defaultStandard) {
              form.setValue('tokenStandard', defaultStandard);
            } else {
              form.setValue('tokenStandard', '');
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CRYPTOCURRENCIES.map(c => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage />
    </FormField>
  );
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
