'use client';

import {
  getBanksForCurrency,
  type FiatCurrency,
  type CryptoCurrency,
  getDefaultTokenStandard,
  EXCHANGE_DEFAULTS,
  FIAT_CURRENCIES,
} from '@repo/constants';
import { getCurrencyLimits } from '@repo/exchange-core';
import { useFormWithNextIntl } from '@repo/hooks';
import { useAutoMinAmount } from '@repo/hooks/src/client-hooks';
import { securityEnhancedHeroExchangeFormSchema, calculateNetAmount } from '@repo/utils';
import { useMemo, useEffect, useState } from 'react';

import { useDefaultBank } from '../../hooks/useDefaultBank';
import { useExchangeRates } from '../../hooks/useExchangeMutation';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

/**
 * 🚀 Hook для расчетов суммы получения
 * NOTE: useExchangeRates внутри - React Query кеширует и де-дублирует запросы автоматически
 */
function useAsyncCalculatedAmount(
  fromAmount: string,
  fromCurrency: string
) {
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const { data: ratesData } = useExchangeRates();

  useEffect(() => {
    const amount = Number(fromAmount);
    if (amount <= 0) {
      setCalculatedAmount(0);
      return;
    }

    const currentRate = ratesData?.rates?.find((r: { currency: CryptoCurrency }) => r.currency === fromCurrency);
    if (!currentRate) {
      setCalculatedAmount(0);
      return;
    }

    // Простая калькуляция: amount * rate * (1 - commission)
    const grossAmount = amount * currentRate.uahRate;
    const netAmount = calculateNetAmount(grossAmount, currentRate.commission);
    setCalculatedAmount(Number(netAmount.toFixed(2)));
  }, [fromAmount, fromCurrency, ratesData]);

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
  // ✅ ERROR BOUNDARY: Используем централизованный хук с обработкой ошибок
  const { defaultBank, fallbackBankId } = useDefaultBank();

  const form = useFormWithNextIntl<HeroExchangeFormData>({
    initialValues: {
      fromAmount: '',
      fromCurrency: EXCHANGE_DEFAULTS.FROM_CURRENCY,
      tokenStandard: getDefaultTokenStandard(EXCHANGE_DEFAULTS.FROM_CURRENCY) || '',
      toCurrency: EXCHANGE_DEFAULTS.TO_CURRENCY,
      selectedBankId: '', // ✅ MIGRATION: Устанавливается в useEffect ниже
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

  // 🚀 Расчёт суммы получения (React Query де-дублирует useExchangeRates автоматически)
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

  // ✅ ERROR BOUNDARY: Устанавливаем дефолтный банк с fallback механизмом
  useEffect(() => {
    const bankIdToSet = defaultBank?.id || fallbackBankId;
    if (bankIdToSet && !form.values.selectedBankId) {
      form.setValue('selectedBankId', bankIdToSet);
    }
  }, [defaultBank, fallbackBankId]); // ✅ ФИКС: убираем form из зависимостей чтобы избежать бесконечного цикла

  // Динамические лимиты для текущей криптовалюты
  const limits = useMemo(() => {
    return getCurrencyLimits(form.values.fromCurrency as CryptoCurrency);
  }, [form.values.fromCurrency]);

  const isValid =
    form.isValid &&
    Number(form.values.fromAmount) >= limits.minCrypto &&
    calculatedAmount >= 100 &&
    Boolean(form.values.selectedBankId);

  const constants = { minCryptoAmount: limits.minCrypto, minUahAmount: 100, limits };

  return { form, calculatedAmount, banks, isValid, constants };
}
