/* eslint-disable max-lines */
'use client';

import {
  CRYPTOCURRENCIES,
  FIAT_CURRENCIES,
  getBanksForCurrency,
  type FiatCurrency,
} from '@repo/constants';
import { validateCryptoAmount, type CryptoCurrency } from '@repo/exchange-core';
import { useForm } from '@repo/hooks';
import {
  Button,
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
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useMemo, useState } from 'react';
import { z } from 'zod';

export interface HeroExchangeFormData extends Record<string, unknown> {
  fromAmount: string;
  fromCurrency: string;
  toCurrency: string;
  selectedBankId: string;
}

interface HeroExchangeFormProps {
  onExchange?: (data: HeroExchangeFormData) => void;
  className?: string;
}

const EXCHANGE_RATE = 40.5;
const MIN_AMOUNTS = { from: 10, to: 100 };
const createSchema = (t: (key: string) => string) =>
  z.object({
    fromAmount: z.string().min(1, t('validation.enterAmount')),
    fromCurrency: z.enum(CRYPTOCURRENCIES),
    toCurrency: z.enum(FIAT_CURRENCIES),
    selectedBankId: z.string().min(1, t('validation.selectBank')),
  });

// Хук для логики формы
function useHeroExchangeForm(
  t: (key: string) => string,
  onExchange?: (data: HeroExchangeFormData) => void
) {
  const form = useForm<HeroExchangeFormData>({
    initialValues: { fromAmount: '', fromCurrency: 'USDT', toCurrency: 'UAH', selectedBankId: '' },
    validationSchema: createSchema(t),
    onSubmit: async values => onExchange?.(values),
  });

  const calculatedAmount = useMemo(() => {
    const amount = Number(form.values.fromAmount);
    return amount > 0 ? amount * EXCHANGE_RATE : 0;
  }, [form.values.fromAmount]);

  const banks = useMemo(() => {
    const currency = form.values.toCurrency;
    const validKeys = ['UAH', 'USD', 'EUR'] as const;
    return validKeys.includes(currency as (typeof validKeys)[number])
      ? getBanksForCurrency(currency as FiatCurrency)
      : [];
  }, [form.values.toCurrency]);

  const isValid =
    form.isValid &&
    Number(form.values.fromAmount) >= MIN_AMOUNTS.from &&
    calculatedAmount >= MIN_AMOUNTS.to &&
    Boolean(form.values.selectedBankId);

  return { form, calculatedAmount, banks, isValid };
}

function ExchangeBenefits({ t }: { t: (key: string) => string }) {
  return (
    <div className="mb-8 text-center">
      <div className="text-sm text-muted-foreground mb-4">{t('benefits.fast')}</div>
      <div className="flex justify-center gap-6 text-xs">
        <div className="font-semibold text-primary">{t('benefits.items.exchange5min')}</div>
        <div className="font-semibold text-primary">{t('benefits.items.noRegistration')}</div>
        <div className="font-semibold text-primary">{t('benefits.items.bestRate')}</div>
      </div>
    </div>
  );
}

function AmountInput({
  form,
  t,
}: {
  form: ReturnType<typeof useForm<HeroExchangeFormData>>;
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

function SendingCard({
  form,
  t,
}: {
  form: ReturnType<typeof useForm<HeroExchangeFormData>>;
  t: (key: string) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sending.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField name="fromCurrency" error={form.errors.fromCurrency}>
          <FormLabel>{t('sending.cryptocurrency')}</FormLabel>
          <FormControl>
            <Select
              value={form.values.fromCurrency as string}
              onValueChange={v => form.setValue('fromCurrency', v)}
            >
              <SelectTrigger>
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

        <AmountInput form={form} t={t} />

        <div className="text-sm text-muted-foreground space-y-1">
          <div>
            {t('sending.min')}: {MIN_AMOUNTS.from} {form.values.fromCurrency as string}
          </div>
          <div>
            {t('sending.rate')}: 1 {form.values.fromCurrency as string} = {EXCHANGE_RATE}{' '}
            {form.values.toCurrency as string}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CurrencySelector({
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

function ReceivingSelectors({
  form,
  banks,
  t,
}: {
  form: ReturnType<typeof useForm<HeroExchangeFormData>>;
  banks: ReturnType<typeof getBanksForCurrency>;
  t: (key: string) => string;
}) {
  return (
    <>
      <CurrencySelector form={form} t={t} />
      <BankSelector form={form} banks={banks} t={t} />
    </>
  );
}

function ReceivingCard({
  form,
  banks,
  calculatedAmount,
  t,
}: {
  form: ReturnType<typeof useForm<HeroExchangeFormData>>;
  banks: ReturnType<typeof getBanksForCurrency>;
  calculatedAmount: number;
  t: (key: string) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('receiving.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ReceivingSelectors form={form} banks={banks} t={t} />

        <FormField name="toAmount">
          <FormLabel>{t('receiving.amount')}</FormLabel>
          <FormControl>
            <Input value={calculatedAmount.toFixed(2)} readOnly className="bg-muted" />
          </FormControl>
        </FormField>

        <div className="text-sm text-muted-foreground space-y-1">
          <div>
            {t('receiving.min')}: {MIN_AMOUNTS.to} {form.values.toCurrency as string}
          </div>
          <div>
            {t('receiving.reserve')}: 10,000,000 {form.values.toCurrency as string}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function HeroExchangeForm({ onExchange, className }: HeroExchangeFormProps) {
  const t = useTranslations('AdvancedExchangeForm');
  const { form, calculatedAmount, banks, isValid } = useHeroExchangeForm(t, onExchange);

  return (
    <div className={className}>
      <ExchangeBenefits t={t} />
      <form onSubmit={form.handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SendingCard form={form} t={t} />
          <ReceivingCard form={form} banks={banks} calculatedAmount={calculatedAmount} t={t} />
        </div>
        <div className="flex justify-center">
          <Button type="submit" size="lg" disabled={!isValid} className="min-w-[200px]">
            <ArrowRight className="w-4 h-4 mr-2" />
            {t('exchange')}
          </Button>
        </div>
      </form>
    </div>
  );
}
