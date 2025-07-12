'use client';

import { FIAT_CURRENCIES, getBanksForCurrency } from '@repo/constants';
import { useForm } from '@repo/hooks';
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
import React from 'react';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

interface ReceivingCardProps {
  form: ReturnType<typeof useForm<HeroExchangeFormData>>;
  banks: ReturnType<typeof getBanksForCurrency>;
  calculatedAmount: number;
  t: (key: string) => string;
  minAmount: number;
}

function FiatCurrencySelector({
  form,
  t,
}: {
  form: ReturnType<typeof useForm<HeroExchangeFormData>>;
  t: (key: string) => string;
}) {
  return (
    <FormField name="toCurrency" error={form.errors.toCurrency}>
      <FormLabel>{t('receiving.fiatCurrency')}</FormLabel>
      <FormControl>
        <Select
          value={form.values.toCurrency as string}
          onValueChange={v => {
            form.setValue('toCurrency', v);
            form.setValue('selectedBankId', '');
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIAT_CURRENCIES.map(c => (
              <SelectItem key={c} value={c}>
                {t(`fiatNames.${c}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage />
    </FormField>
  );
}

function BankSelector({
  form,
  banks,
  t,
}: {
  form: ReturnType<typeof useForm<HeroExchangeFormData>>;
  banks: ReturnType<typeof getBanksForCurrency>;
  t: (key: string) => string;
}) {
  return (
    <FormField name="selectedBankId" error={form.errors.selectedBankId}>
      <FormLabel>{t('receiving.bank')}</FormLabel>
      <FormControl>
        <Select
          value={form.values.selectedBankId as string}
          onValueChange={v => form.setValue('selectedBankId', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('receiving.selectBank')} />
          </SelectTrigger>
          <SelectContent>
            {banks.map(b => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage />
    </FormField>
  );
}

function ReceivingInfo({
  form,
  t,
  minAmount,
}: {
  form: ReturnType<typeof useForm<HeroExchangeFormData>>;
  t: (key: string) => string;
  minAmount: number;
}) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div>
        {t('receiving.min')}: {minAmount} {form.values.toCurrency as string}
      </div>
      <div>
        {t('receiving.reserve')}: 10,000,000 {form.values.toCurrency as string}
      </div>
    </div>
  );
}

export function ReceivingCard({ form, banks, calculatedAmount, t, minAmount }: ReceivingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('receiving.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FiatCurrencySelector form={form} t={t} />
        <BankSelector form={form} banks={banks} t={t} />

        <FormField name="toAmount">
          <FormLabel>{t('receiving.amount')}</FormLabel>
          <FormControl>
            <Input value={calculatedAmount.toFixed(2)} readOnly className="bg-muted" />
          </FormControl>
        </FormField>

        <ReceivingInfo form={form} t={t} minAmount={minAmount} />
      </CardContent>
    </Card>
  );
}
