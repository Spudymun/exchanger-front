'use client';

import { getDefaultTokenStandard, isMultiNetworkToken, getTokenStandards } from '@repo/constants';
import { validateCryptoAmount, type CryptoCurrency } from '@repo/exchange-core';
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
} from '@repo/ui';
import { useNumericInput } from '@repo/utils';
import React, { useState } from 'react';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

interface SendingCardProps {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
  exchangeRate: number;
  minAmount: number;
}

export function TokenStandardSelector({
  form,
  t,
}: {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
}) {
  const currency = form.values.fromCurrency as string;
  const isMultiNetwork = isMultiNetworkToken(currency);

  if (!isMultiNetwork) {
    return <div className="h-[76px]"></div>;
  }

  const standards = getTokenStandards(currency);

  return (
    <FormField name="tokenStandard" error={form.errors.tokenStandard}>
      <FormLabel>{t('sending.tokenStandard')}</FormLabel>
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
  );
}

function AmountInput({
  form,
  t,
}: {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
}) {
  const [inputError, setInputError] = useState<string>('');
  const { handleKeyDown, formatValue } = useNumericInput(form.values.fromCurrency as string);

  const validateAmount = (value: string) => {
    if (!value) return '';

    const numericValue = Number(value);
    const currency = form.values.fromCurrency as CryptoCurrency;

    const validation = validateCryptoAmount(numericValue, currency);

    if (!validation.isValid && validation.errors.length > 0) {
      return validation.errors[0];
    }

    return '';
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatValue(rawValue);

    if (inputError) setInputError('');

    form.setValue('fromAmount', formattedValue);

    const validationError = validateAmount(formattedValue);
    if (validationError) {
      setInputError(validationError);
    }
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleKeyDown(e, form.values.fromAmount as string);
  };

  return (
    <FormField name="fromAmount" error={form.errors.fromAmount || inputError}>
      <FormLabel>{t('sending.amount')}</FormLabel>
      <FormControl>
        <Input
          value={form.values.fromAmount as string}
          onChange={handleAmountChange}
          onKeyDown={handleAmountKeyDown}
          placeholder={t('sending.placeholder')}
          aria-invalid={!!(form.errors.fromAmount || inputError)}
        />
      </FormControl>
      <FormMessage />
    </FormField>
  );
}

export function CurrencySelector({
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
            {['BTC', 'ETH', 'USDT', 'LTC'].map(c => (
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
  exchangeRate,
  minAmount,
}: {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
  exchangeRate: number;
  minAmount: number;
}) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div>
        {t('sending.min')}: {minAmount} {form.values.fromCurrency as string}
      </div>
      <div>
        {t('sending.rate')}: 1 {form.values.fromCurrency as string} = {exchangeRate}{' '}
        {form.values.toCurrency as string}
      </div>
    </div>
  );
}

export function SendingCard({ form, t, exchangeRate, minAmount }: SendingCardProps) {
  return (
    <Card className="bg-card text-card-foreground border-l-4 border-l-blue-500 dark:border-l-blue-400 shadow-md shadow-blue-500/15 dark:shadow-blue-400/20 hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-foreground">{t('sending.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencySelector form={form} t={t} />
          <TokenStandardSelector form={form} t={t} />
        </div>
        <AmountInput form={form} t={t} />
        <SendingInfo form={form} t={t} exchangeRate={exchangeRate} minAmount={minAmount} />
      </CardContent>
    </Card>
  );
}
