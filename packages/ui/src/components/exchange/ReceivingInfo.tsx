'use client';

import { getBankReserve, type FiatCurrency, type BankId } from '@repo/constants';
import type { UseFormReturn } from '@repo/hooks';
import { useMemo } from 'react';

interface ReceivingInfoProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * Поле в форме для получения валюты
   * @default 'toCurrency'
   */
  currencyFieldName?: string;
  /**
   * Поле в форме для выбранного банка
   * @default 'selectedBankId'
   */
  bankFieldName?: string;
  /**
   * Передать processingTime извне
   * @default undefined (показывает стандартное время)
   */
  processingTime?: string;
}

/**
 * ✅ UNIFIED: Общий компонент для отображения информации о получении
 * Заменяет inline ReceivingInfo из ReceivingCard
 * Показывает резерв банка и время обработки
 *
 * @param currencyFieldName - имя поля валюты в форме
 * @param bankFieldName - имя поля банка в форме
 * @param processingTime - переопределить время обработки
 */
export function ReceivingInfo({
  form,
  t,
  currencyFieldName = 'toCurrency',
  bankFieldName = 'selectedBankId',
  processingTime,
}: ReceivingInfoProps) {
  const toCurrency = form.values[currencyFieldName as keyof typeof form.values] as FiatCurrency;
  const selectedBankId = form.values[bankFieldName as keyof typeof form.values] as BankId;

  const { bankReserve, processingText } = useMemo(() => {
    let reserve = 0;

    if (toCurrency && selectedBankId) {
      reserve = getBankReserve(selectedBankId, toCurrency);
    }

    const processing = processingTime || t('receiving.processing');

    return {
      bankReserve: reserve,
      processingText: processing,
    };
  }, [toCurrency, selectedBankId, processingTime, t]);

  if (!toCurrency) {
    return null;
  }

  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div>
        {t('receiving.reserve')}: {bankReserve.toLocaleString()} {toCurrency}
      </div>
      <div>{processingText}</div>
    </div>
  );
}
