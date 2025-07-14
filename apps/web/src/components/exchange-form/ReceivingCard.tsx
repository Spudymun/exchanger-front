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
}

export function FiatCurrencySelector({
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
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIAT_CURRENCIES.map(c => (
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

export function BankSelector({
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
          <SelectTrigger className="w-full">
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
}: {
  form: ReturnType<typeof useForm<HeroExchangeFormData>>;
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
    <Card className="bg-card text-card-foreground border-l-4 border-l-green-500 dark:border-l-green-400 shadow-md shadow-green-500/15 dark:shadow-green-400/20 hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-foreground">{t('receiving.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FiatCurrencySelector form={form} t={t} />
          <BankSelector form={form} banks={banks} t={t} />
        </div>

        <FormField name="toAmount">
          <FormLabel>{t('receiving.amount')}</FormLabel>
          <FormControl>
            <Input
              value={calculatedAmount.toFixed(2)}
              readOnly
              className="bg-muted/50 text-foreground"
            />
          </FormControl>
        </FormField>

        <ReceivingInfo form={form} t={t} />
      </CardContent>
    </Card>
  );
}
