'use client';

import {
  getBanksForCurrency,
  type FiatCurrency,
  type CryptoCurrency,
  getDefaultTokenStandard,
  EXCHANGE_DEFAULTS,
  FIAT_CURRENCIES,
} from '@repo/constants';
import { calculateUahAmount, getCurrencyLimits } from '@repo/exchange-core';
import { useFormWithNextIntl } from '@repo/hooks';
import { securityEnhancedHeroExchangeFormSchema } from '@repo/utils';
import { useMemo } from 'react';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

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
    return FIAT_CURRENCIES.includes(currency as (typeof FIAT_CURRENCIES)[number])
      ? getBanksForCurrency(currency as FiatCurrency)
      : [];
  }, [form.values.toCurrency]);

  // Динамические лимиты для текущей криптовалюты
  const limits = useMemo(() => {
    return getCurrencyLimits(form.values.fromCurrency as CryptoCurrency);
  }, [form.values.fromCurrency]);

  const isValid =
    form.isValid &&
    Number(form.values.fromAmount) >= limits.minCrypto &&
    calculatedAmount >= 100 && // минимум UAH остается 100
    Boolean(form.values.selectedBankId);

  return {
    form,
    calculatedAmount,
    banks,
    isValid,
    constants: {
      minCryptoAmount: limits.minCrypto,
      minUahAmount: 100,
      limits,
    },
  };
}
