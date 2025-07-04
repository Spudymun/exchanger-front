import { COMMISSION_RATES } from '@repo/constants';
import type { ExchangeRate } from '@repo/exchange-core';

import { DEBOUNCE_DELAY } from './exchange-constants.js';
import type { ExchangeCalculation, ExchangeFormData } from './exchange-store.js';

// Вспомогательные функции для расчетов
export const calculateExchangeRate = (
  formData: ExchangeFormData,
  availableRates: ExchangeRate[]
): ExchangeCalculation | null => {
  if (!formData.fromCurrency || !formData.fromAmount) {
    return null;
  }

  const fromAmount = parseFloat(formData.fromAmount);
  if (isNaN(fromAmount) || fromAmount <= 0) {
    return {
      fromAmount: 0,
      toAmount: 0,
      rate: 0,
      commission: 0,
      commissionAmount: 0,
      finalAmount: 0,
      isValid: false,
      errors: ['Некорректная сумма'],
    };
  }

  const rate = availableRates.find((r: ExchangeRate) => r.currency === formData.fromCurrency);
  if (!rate) {
    return {
      fromAmount,
      toAmount: 0,
      rate: 0,
      commission: 0,
      commissionAmount: 0,
      finalAmount: 0,
      isValid: false,
      errors: ['Курс валюты не найден'],
    };
  }

  const commission =
    formData.fromCurrency && COMMISSION_RATES[formData.fromCurrency]
      ? COMMISSION_RATES[formData.fromCurrency]
      : 0;
  const toAmount = fromAmount * rate.uahRate;
  const commissionAmount = toAmount * commission;
  const finalAmount = toAmount - commissionAmount;

  return {
    fromAmount,
    toAmount,
    rate: rate.uahRate,
    commission,
    commissionAmount,
    finalAmount,
    isValid: finalAmount > 0,
    errors: finalAmount <= 0 ? ['Сумма слишком мала'] : [],
  };
};

// Вспомогательные функции для управления шагами
export const getNextStepIndex = (currentStep: number, totalSteps: number): number => {
  return Math.min(currentStep + 1, totalSteps - 1);
};

export const getPrevStepIndex = (currentStep: number): number => {
  return Math.max(currentStep - 1, 0);
};

export const clampStepIndex = (stepIndex: number, totalSteps: number): number => {
  return Math.max(0, Math.min(stepIndex, totalSteps - 1));
};

// Константы для debounce
export const CALCULATION_DEBOUNCE_DELAY = DEBOUNCE_DELAY;
