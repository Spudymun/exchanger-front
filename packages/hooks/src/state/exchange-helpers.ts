import { calculateUahAmount, calculateCommission } from '@repo/exchange-core';
import type { ExchangeRate } from '@repo/exchange-core';

import type { ExchangeCalculation, ExchangeFormData } from './exchange-store';

// Вспомогательные функции для расчетов using centralized utilities
export const calculateExchangeRate = (
  formData: ExchangeFormData,
  availableRates: ExchangeRate[]
): ExchangeCalculation | null => {
  if (!formData.fromCurrency || !formData.fromAmount) {
    return null;
  }

  // ✅ UNIFIED: direct use formData.fromAmount (eliminated cryptoAmount duplication)
  if (isNaN(formData.fromAmount) || formData.fromAmount <= 0) {
    return {
      fromAmount: 0,
      toAmount: 0,
      rate: 0,
      commission: 0,
      commissionAmount: 0,
      finalAmount: 0,
      isValid: false,
      errors: ['Invalid amount'],
    };
  }

  const rate = availableRates.find((r: ExchangeRate) => r.currency === formData.fromCurrency);
  if (!rate) {
    return {
      fromAmount: formData.fromAmount, // ✅ UNIFIED: consistent fromAmount usage
      toAmount: 0,
      rate: 0,
      commission: 0,
      commissionAmount: 0,
      finalAmount: 0,
      isValid: false,
      errors: ['Курс валюты не найден'],
    };
  }

  // Use centralized calculation utilities instead of local logic
  const toAmount = calculateUahAmount(formData.fromAmount, formData.fromCurrency);
  const commissionAmount = calculateCommission(formData.fromAmount, formData.fromCurrency);
  const finalAmount = toAmount;

  return {
    fromAmount: formData.fromAmount, // ✅ UNIFIED: consistent fromAmount usage
    toAmount,
    rate: rate.uahRate,
    commission: rate.commission,
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
