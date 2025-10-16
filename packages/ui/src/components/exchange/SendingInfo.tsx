'use client';

import { getCurrencyLimits, type CryptoCurrency } from '@repo/exchange-core';
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
  /**
   * Передать exchangeRate извне (из useExchangeRates hook)
   */
  exchangeRate?: number;
}

/**
 * ✅ UNIFIED: Общий компонент для отображения информации об отправке
 * Заменяет дублированные SendingInfo из SendingCard и ExchangeLayout
 *
 * @param currencyFieldName - имя поля валюты в форме
 * @param minAmount - минимальная сумма (если не передана, вычисляется автоматически)
 * @param exchangeRate - курс обмена (передаётся извне через tRPC API)
 */
export function SendingInfo({
  form,
  t,
  currencyFieldName = 'fromCurrency',
  minAmount: externalMinAmount,
  exchangeRate: externalExchangeRate,
}: SendingInfoProps) {
  const fromCurrency = form.values[currencyFieldName as keyof typeof form.values] as CryptoCurrency;

  const [minAmount, setMinAmount] = useState(externalMinAmount || 0);

  useEffect(() => {
    if (!fromCurrency) {
      setMinAmount(externalMinAmount || 0);
      return;
    }

    // Установка minAmount
    if (externalMinAmount !== undefined) {
      // Hero форма - используем переданный minAmount
      setMinAmount(externalMinAmount);
    } else {
      // Exchange форма - вычисляем автоматически
      const limits = getCurrencyLimits(fromCurrency);
      setMinAmount(limits.minCrypto);
    }
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
        {t('sending.rate')}: 1 {fromCurrency} = {externalExchangeRate || 0} UAH
      </div>
    </div>
  );
}
