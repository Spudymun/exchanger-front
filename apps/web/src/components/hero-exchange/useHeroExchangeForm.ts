'use client';

import {
  getBanksForCurrency,
  type FiatCurrency,
  type CryptoCurrency,
  getDefaultTokenStandard,
  EXCHANGE_DEFAULTS,
  FIAT_CURRENCIES,
} from '@repo/constants';
import { calculateUahAmountAsync, getCurrencyLimits } from '@repo/exchange-core';
import { useFormWithNextIntl } from '@repo/hooks';
import { useAutoMinAmount } from '@repo/hooks/src/client-hooks';
import { securityEnhancedHeroExchangeFormSchema } from '@repo/utils';
import { useMemo, useEffect, useState } from 'react';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

/**
 * 🚀 Hook для асинхронных расчетов с Smart Caching
 */
function useAsyncCalculatedAmount(fromAmount: string, fromCurrency: string) {
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  useEffect(() => {
    const amount = Number(fromAmount);
    if (amount <= 0) {
      setCalculatedAmount(0);
      return;
    }

    let isCancelled = false;

    const calculateAmount = async () => {
      try {
        const result = await calculateUahAmountAsync(amount, fromCurrency as CryptoCurrency);
        if (!isCancelled) {
          setCalculatedAmount(result);
        }
      } catch {
        if (!isCancelled) {
          setCalculatedAmount(0);
        }
      }
    };

    void calculateAmount();

    return () => {
      isCancelled = true;
    };
  }, [fromAmount, fromCurrency]);

  return calculatedAmount;
}

/**
 * Логика автозаполнения минимального количества
 */
function useAutoFillLogic(form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>) {
  const { shouldAutoFill, getMinAmount } = useAutoMinAmount(
    form.values.fromCurrency as CryptoCurrency,
    form.values.fromAmount
  );

  useEffect(() => {
    if (shouldAutoFill) {
      const minAmount = getMinAmount();
      form.setValue('fromAmount', minAmount.toString());
    }
  }, [shouldAutoFill, getMinAmount, form.setValue]);
}

export function useHeroExchangeForm(
  t: (key: string) => string,
  onExchange?: (data: HeroExchangeFormData) => Promise<void>
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
    onSubmit: async values => {
      // ✅ ФИКС: Вызываем асинхронный onExchange  
      if (onExchange) {
        await onExchange(values);
      }
    },
  });

  // Автозаполнение минимального количества
  useAutoFillLogic(form);

  // 🚀 Smart Caching: Асинхронные расчеты с мгновенным откликом
  const calculatedAmount = useAsyncCalculatedAmount(
    form.values.fromAmount as string,
    form.values.fromCurrency as string
  );

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

  const isValid = form.isValid &&
    Number(form.values.fromAmount) >= limits.minCrypto &&
    calculatedAmount >= 100 && Boolean(form.values.selectedBankId);

  const constants = { minCryptoAmount: limits.minCrypto, minUahAmount: 100, limits };

  return { form, calculatedAmount, banks, isValid, constants };
}
