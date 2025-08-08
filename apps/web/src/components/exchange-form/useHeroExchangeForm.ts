'use client';

import {
  CRYPTOCURRENCIES,
  FIAT_CURRENCIES,
  getBanksForCurrency,
  type FiatCurrency,
  getDefaultTokenStandard,
} from '@repo/constants';
import { useFormWithNextIntl } from '@repo/hooks';
import { cryptoAmountStringSchema } from '@repo/utils';
import { useMemo } from 'react';
import { z } from 'zod';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

const EXCHANGE_RATE = 40.5;
const MIN_AMOUNTS = { from: 10, to: 100 };

// Чистая Zod схема БЕЗ хардкода сообщений
const heroExchangeSchema = z.object({
  fromAmount: cryptoAmountStringSchema,
  fromCurrency: z.enum(CRYPTOCURRENCIES),
  tokenStandard: z.string().optional(),
  toCurrency: z.enum(FIAT_CURRENCIES),
  selectedBankId: z.string().min(1),
});

export function useHeroExchangeForm(
  t: (key: string) => string,
  onExchange?: (data: HeroExchangeFormData) => void
) {
  const form = useFormWithNextIntl<HeroExchangeFormData>({
    initialValues: {
      fromAmount: '',
      fromCurrency: 'USDT',
      tokenStandard: getDefaultTokenStandard('USDT') || '',
      toCurrency: 'UAH',
      selectedBankId: '',
    },
    validationSchema: heroExchangeSchema,
    t,
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

  return {
    form,
    calculatedAmount,
    banks,
    isValid,
    constants: {
      EXCHANGE_RATE,
      MIN_AMOUNTS,
    },
  };
}
