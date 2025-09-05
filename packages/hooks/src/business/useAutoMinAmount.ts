'use client';

import type { CryptoCurrency } from '@repo/constants';
import { getMinCryptoAmountForUI } from '@repo/exchange-core';
import { useEffect, useRef } from 'react';

/**
 * Hook для автоматического заполнения минимального количества криптовалюты
 *
 * Следует принципам:
 * - Срабатывает только при первой загрузке страницы (mount)
 * - Заполняет только пустые поля
 * - Использует существующую функцию getMinCryptoAmountForUI()
 *
 * @param currency - Выбранная криптовалюта
 * @param currentAmount - Текущее значение поля amount
 * @returns Объект с флагом shouldAutoFill и функцией getMinAmount
 */
export function useAutoMinAmount(currency: CryptoCurrency, currentAmount: string) {
  const hasAutoFilled = useRef(false);

  // Сброс флага при изменении валюты
  useEffect(() => {
    hasAutoFilled.current = false;
  }, [currency]);

  const shouldAutoFill = !hasAutoFilled.current && currentAmount === '';

  const getMinAmount = () => {
    if (shouldAutoFill) {
      hasAutoFilled.current = true;
    }
    return getMinCryptoAmountForUI(currency);
  };

  return {
    shouldAutoFill,
    getMinAmount,
  };
}
