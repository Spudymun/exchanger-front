import { UI_DEBOUNCE_CONSTANTS } from '@repo/constants';
import type { CryptoCurrency } from '@repo/exchange-core';
import { emailSchema, validateWithZodSchema } from '@repo/utils';
import React from 'react';

import type { ExchangeStore } from '../state/exchange-store';
import { useExchangeStore } from '../useExchangeStore';

/**
 * Exchange Business Logic Hook
 *
 * Handles exchange calculations, validation, and order management
 */
export function useExchange() {
  const exchangeStore = useExchangeStore();

  // Enhanced form validation
  const validateForm = useFormValidator(exchangeStore);

  // Auto-calculate when form changes
  React.useEffect(() => {
    const { fromAmount } = exchangeStore.formData; // ✅ UNIFIED: cryptoAmount → fromAmount

    if (fromAmount && !isNaN(Number(fromAmount)) && Number(fromAmount) > 0) {
      const debounceTimeout = setTimeout(() => {
        exchangeStore.calculateExchange();
      }, UI_DEBOUNCE_CONSTANTS.EXCHANGE_CALCULATION_DELAY);

      return () => clearTimeout(debounceTimeout);
    }
  }, [exchangeStore.formData.fromAmount, exchangeStore.formData.fromCurrency, exchangeStore]); // ✅ UNIFIED: cryptoAmount → fromAmount

  // Display helpers
  const getDisplayRate = useDisplayRateHelper(exchangeStore);
  const getProgress = useProgressHelper(exchangeStore);

  return {
    ...exchangeStore,
    validateForm,
    getDisplayRate,
    getProgress,
  };
}

// Separate form validator using centralized validation utilities
function useFormValidator(exchangeStore: ExchangeStore) {
  return () => {
    const { formData, calculation } = exchangeStore;
    const errors: string[] = [];

    // ✅ REFACTOR: Use centralized validation instead of duplicate email validation
    const emailValidation = validateWithZodSchema(emailSchema, formData.email);
    if (!emailValidation.isValid) {
      errors.push(...emailValidation.errors);
    }

    // Amount validation - только проверка формата
    if (!formData.fromAmount || isNaN(Number(formData.fromAmount))) {
      // ✅ UNIFIED: cryptoAmount → fromAmount
      errors.push('Enter correct amount');
    }
    // Note: Отрицательные числа нельзя ввести через UI, минимальные лимиты проверяются в Zod схемах

    // Calculation required
    if (!calculation || !calculation.isValid) {
      errors.push('Exchange calculation required');
    }

    return { isValid: errors.length === 0, errors };
  };
}

// Separate display rate helper
function useDisplayRateHelper(exchangeStore: ExchangeStore) {
  return () => {
    const { fromCurrency } = exchangeStore.formData;

    if (!fromCurrency) return null;

    const rate = exchangeStore.getRateForCurrency(fromCurrency);
    if (!rate) return null;

    return {
      currency: fromCurrency,
      rate: rate.uahRate,
      commission: rate.commission,
      formattedRate: `1 ${fromCurrency} = ${rate.uahRate.toLocaleString()} UAH`,
      formattedCommission: `Commission: ${rate.commission}%`,
    };
  };
}

// Separate progress helper
function useProgressHelper(exchangeStore: ExchangeStore) {
  return () => {
    const { currentStep, steps } = exchangeStore;
    return {
      currentStep: currentStep + 1,
      totalSteps: steps.length,
      percentage: ((currentStep + 1) / steps.length) * 100,
      isComplete: currentStep === steps.length - 1,
    };
  };
}

// Helper hook for form management
export function useExchangeForm() {
  const exchangeStore = useExchangeStore();

  const setFromAmount = (amount: string) => {
    exchangeStore.updateFormData({ fromAmount: Number(amount) }); // ✅ UNIFIED: cryptoAmount → fromAmount
  };

  const setFromCurrency = (currency: CryptoCurrency) => {
    exchangeStore.updateFormData({ fromCurrency: currency });
  };

  const setUserEmail = (email: string) => {
    exchangeStore.updateFormData({ email: email });
  };

  const setRecipientData = (cardNumber: string) => {
    exchangeStore.updateFormData({ cardNumber: cardNumber });
  };

  return {
    setFromAmount,
    setFromCurrency,
    setUserEmail,
    setRecipientData,
  };
}
