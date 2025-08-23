'use client';

import {
  getBanksForCurrency,
  type FiatCurrency,
  getDefaultTokenStandard,
  EXCHANGE_DEFAULTS,
} from '@repo/constants';
import { useFormWithNextIntl } from '@repo/hooks';
import { securityEnhancedSimpleExchangeFormSchema } from '@repo/utils';
import { useMemo } from 'react';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

const EXCHANGE_RATE = 40.5;
const MIN_AMOUNTS = { from: 10, to: 100 };

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
    validationSchema: securityEnhancedSimpleExchangeFormSchema,
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
