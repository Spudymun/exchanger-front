'use client';

import { getCurrencyLimits, calculateUahAmountAsync, type CryptoCurrency } from '@repo/exchange-core';
import type { UseFormReturn } from '@repo/hooks';
import { useState, useEffect } from 'react';

interface SendingInfoProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * Поле в форме для получения валюты
   * @default 'fromCurrency'
   */
  currencyFieldName?: string;
  /**
   * Передать minAmount извне (для hero формы)
   */
  minAmount?: number;
}

/**
 * ✅ UNIFIED: Общий компонент для отображения информации об отправке
 * Заменяет дублированные SendingInfo из SendingCard и ExchangeLayout
 *
 * @param currencyFieldName - имя поля валюты в форме
 * @param minAmount - минимальная сумма (если не передана, вычисляется автоматически)
 */
export function SendingInfo({
  form,
  t,
  currencyFieldName = 'fromCurrency',
  minAmount: externalMinAmount,
}: SendingInfoProps) {
  const fromCurrency = form.values[currencyFieldName as keyof typeof form.values] as CryptoCurrency;

  const [exchangeRate, setExchangeRate] = useState(0);
  const [minAmount, setMinAmount] = useState(externalMinAmount || 0);

  useEffect(() => {
    if (!fromCurrency) {
      setExchangeRate(0);
      setMinAmount(externalMinAmount || 0);
      return;
    }

    let isCancelled = false;

    // Асинхронное получение курса через SmartPricingService
    const fetchRate = async () => {
      try {
        const rate = await calculateUahAmountAsync(1, fromCurrency);
        if (!isCancelled) {
          setExchangeRate(rate);
        }
      } catch {
        if (!isCancelled) {
          setExchangeRate(0);
        }
      }
    };

    // Установка minAmount
    if (externalMinAmount !== undefined) {
      // Hero форма - используем переданный minAmount
      setMinAmount(externalMinAmount);
    } else {
      // Exchange форма - вычисляем автоматически
      const limits = getCurrencyLimits(fromCurrency);
      setMinAmount(limits.minCrypto);
    }

    fetchRate();

    return () => {
      isCancelled = true;
    };
  }, [fromCurrency, externalMinAmount]);

  if (!fromCurrency) {
    return null;
  }

  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div>
        {t('sending.min')}: {minAmount} {fromCurrency}
      </div>
      <div>
        {t('sending.rate')}: 1 {fromCurrency} = {exchangeRate} UAH
      </div>
    </div>
  );
}
