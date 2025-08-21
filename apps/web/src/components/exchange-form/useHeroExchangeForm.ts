'use client';

import {
  CRYPTOCURRENCIES,
  FIAT_CURRENCIES,
  getBanksForCurrency,
  type FiatCurrency,
  getDefaultTokenStandard,
  VALIDATION_LIMITS,
  EXCHANGE_DEFAULTS,
} from '@repo/constants';
import { useFormWithNextIntl } from '@repo/hooks';
import { containsPotentialXSS } from '@repo/utils/validation/security-enhanced-utils';
import { useMemo } from 'react';
import { z } from 'zod';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

const EXCHANGE_RATE = 40.5;
const MIN_AMOUNTS = { from: 10, to: 100 };
const MAX_DECIMAL_PLACES = 8;

// Специальная схема для HeroExchangeForm с правильным минимумом и XSS защитой
const heroExchangeCryptoAmountSchema = z
  .string()
  .refine(
    val => {
      // Allow empty string
      if (val === '') return true;
      // XSS protection check
      if (containsPotentialXSS(val)) return false;
      // Check if it's a valid number
      const num = Number(val);
      if (Number.isNaN(num)) return false;
      // Check if it has reasonable decimal places (up to 8)
      const decimalParts = val.split('.');
      if (decimalParts.length > 2) return false;
      if (
        decimalParts.length === 2 &&
        decimalParts[1] &&
        decimalParts[1].length > MAX_DECIMAL_PLACES
      )
        return false;
      return true;
    },
    { message: 'AMOUNT_FORMAT' }
  )
  .refine(val => val === '' || Number(val) > 0, { message: 'AMOUNT_POSITIVE' })
  .refine(val => val === '' || Number(val) >= MIN_AMOUNTS.from, {
    message: `AMOUNT_MIN_VALUE:${MIN_AMOUNTS.from}`,
  })
  .refine(val => val === '' || Number(val) <= VALIDATION_LIMITS.MAX_ORDER_AMOUNT, {
    message: `AMOUNT_MAX_VALUE:${VALIDATION_LIMITS.MAX_ORDER_AMOUNT}`,
  });

// Чистая Zod схема с XSS защитой
const heroExchangeSchema = z.object({
  fromAmount: heroExchangeCryptoAmountSchema,
  fromCurrency: z.enum(CRYPTOCURRENCIES),
  tokenStandard: z
    .string()
    .optional()
    .refine(val => !val || !containsPotentialXSS(val), {
      message: 'INVALID_CHARACTERS_DETECTED',
    }),
  toCurrency: z.enum(FIAT_CURRENCIES),
  selectedBankId: z
    .string()
    .min(1)
    .refine(val => !containsPotentialXSS(val), {
      message: 'INVALID_CHARACTERS_DETECTED',
    }),
});

export function useHeroExchangeForm(
  t: (key: string) => string,
  onExchange?: (data: HeroExchangeFormData) => void
) {
  const form = useFormWithNextIntl<HeroExchangeFormData>({
    initialValues: {
      fromAmount: '',
      fromCurrency: EXCHANGE_DEFAULTS.FROM_CURRENCY,
      tokenStandard: getDefaultTokenStandard(EXCHANGE_DEFAULTS.FROM_CURRENCY) || '',
      toCurrency: EXCHANGE_DEFAULTS.TO_CURRENCY,
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
