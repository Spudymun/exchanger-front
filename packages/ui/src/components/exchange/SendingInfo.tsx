'use client';

import { getCurrencyLimits, calculateUahAmount, type CryptoCurrency } from '@repo/exchange-core';
import type { UseFormReturn } from '@repo/hooks';
import { useMemo } from 'react';

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

  const { minAmount, exchangeRate } = useMemo(() => {
    if (!fromCurrency) {
      return { minAmount: 0, exchangeRate: 0 };
    }

    const rate = calculateUahAmount(1, fromCurrency);

    if (externalMinAmount !== undefined) {
      // Используем переданный minAmount (hero форма)
      return {
        minAmount: externalMinAmount,
        exchangeRate: rate,
      };
    } else {
      // Вычисляем minAmount автоматически (exchange форма)
      const limits = getCurrencyLimits(fromCurrency);
      return {
        minAmount: limits.minCrypto,
        exchangeRate: rate,
      };
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
        {t('sending.rate')}: 1 {fromCurrency} = {exchangeRate} UAH
      </div>
    </div>
  );
}
