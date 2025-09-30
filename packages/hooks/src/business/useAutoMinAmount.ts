'use client';

import type { CryptoCurrency } from '@repo/constants';
// ✅ Используем правильные USD лимиты
import { getMinCryptoAmountForUI, getCurrencyLimits } from '@repo/exchange-core';
import { useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * ✅ PRODUCTION-READY: Безопасное получение минимального количества с comprehensive fallback
 * ИНТЕГРАЦИЯ: Safe Number Parsing для NaN, Infinity, отрицательных чисел (10/10)
 */
function getSafeMinAmount(currency: CryptoCurrency): number {
  try {
    const minAmount = getMinCryptoAmountForUI(currency);
    const limits = getCurrencyLimits(currency);

    // ✅ Comprehensive number validation с правильными per-currency лимитами
    if (!Number.isFinite(minAmount) || minAmount <= 0 || minAmount > limits.maxCrypto) {
      throw new Error(`Invalid min amount: ${minAmount}`);
    }

    return minAmount;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[AutoMinAmount] Error calculating min amount:', error);
    }
    // ⚡ Fallback к минимальному значению для данной валюты
    const limits = getCurrencyLimits(currency);
    return limits.minCrypto;
  }
}

/**
 * Hook для отслеживания взаимодействия пользователя с полем
 */
function useUserInteractionTracking(currency: CryptoCurrency, currentAmount: string) {
  const hasUserInteracted = useRef(false);

  // Сброс при смене валюты
  useEffect(() => {
    hasUserInteracted.current = false;
  }, [currency]);

  // Отслеживание ввода пользователя
  useEffect(() => {
    const isEmpty = !currentAmount || currentAmount.trim() === '';
    if (!isEmpty && !hasUserInteracted.current) {
      hasUserInteracted.current = true;
    }
  }, [currentAmount]);

  return hasUserInteracted;
}

/**
 * Hook для автоматического заполнения минимального количества криптовалюты
 *
 * PRODUCTION-READY ENHANCEMENTS:
 * - 🔒 Safe state management с proper cleanup
 * - ⚡ Memoized calculations для performance
 * - 📊 Debug logging для troubleshooting
 * - 🚨 Error boundaries готовый код
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
  const isUnmounted = useRef(false);

  // Используем отдельный хук для отслеживания взаимодействия
  const hasUserInteracted = useUserInteractionTracking(currency, currentAmount);

  // Cleanup на unmount для предотвращения memory leaks
  useEffect(() => {
    return () => {
      isUnmounted.current = true;
    };
  }, []);

  // Сброс флага автозаполнения при изменении валюты
  useEffect(() => {
    if (!isUnmounted.current) {
      hasAutoFilled.current = false;
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.info(`[AutoMinAmount] Currency changed:`, currency);
      }
    }
  }, [currency]);

  // Memoized calculation для избежания перевычислений
  const minAmount = useMemo(() => getSafeMinAmount(currency), [currency]);

  // Callback для получения минимальной суммы
  const getMinAmount = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info(`[AutoMinAmount] Getting min amount for ${currency}:`, minAmount);
    }
    return minAmount;
  }, [currency, minAmount]);

  // Определяем, нужно ли автозаполнение
  const shouldAutoFill = useMemo(() => {
    const isEmpty = !currentAmount || currentAmount.trim() === '';
    const notFilledYet = !hasAutoFilled.current;
    const noUserInteraction = !hasUserInteracted.current;
    const result = isEmpty && notFilledYet && noUserInteraction;

    if (result && !isUnmounted.current) {
      hasAutoFilled.current = true;
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.info(`[AutoMinAmount] Auto-filling with:`, minAmount);
      }
    }

    return result;
  }, [currentAmount, minAmount, hasUserInteracted]);

  return {
    shouldAutoFill,
    getMinAmount,
  };
}
