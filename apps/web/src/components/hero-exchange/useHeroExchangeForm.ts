'use client';

import {
  getBanksForCurrency,
  type FiatCurrency,
  type CryptoCurrency,
  getDefaultTokenStandard,
  EXCHANGE_DEFAULTS,
} from '@repo/constants';
import { calculateUahAmount } from '@repo/exchange-core';
import { useFormWithNextIntl } from '@repo/hooks';
import { securityEnhancedHeroExchangeFormSchema } from '@repo/utils';
import { useMemo } from 'react';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

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
    validationSchema: securityEnhancedHeroExchangeFormSchema,
    t,
    onSubmit: async values => onExchange?.(values),
  });

  const calculatedAmount = useMemo(() => {
    const amount = Number(form.values.fromAmount);
    return amount > 0 ? calculateUahAmount(amount, form.values.fromCurrency as CryptoCurrency) : 0;
  }, [form.values.fromAmount, form.values.fromCurrency]);

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
      MIN_AMOUNTS,
    },
  };
}
