import { UI_DEBOUNCE_CONSTANTS } from '@repo/constants';
import type { CryptoCurrency } from '@repo/exchange-core';
import { securityEnhancedEmailSchema } from '@repo/utils';

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
    const { fromAmount } = exchangeStore.formData;

    if (fromAmount && !isNaN(Number(fromAmount)) && Number(fromAmount) > 0) {
      const debounceTimeout = setTimeout(() => {
        exchangeStore.calculateExchange();
      }, UI_DEBOUNCE_CONSTANTS.EXCHANGE_CALCULATION_DELAY);

      return () => clearTimeout(debounceTimeout);
    }
  }, [exchangeStore.formData.fromAmount, exchangeStore.formData.fromCurrency, exchangeStore]);

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

    // Use Zod schema for email validation
    if (!formData.userEmail) {
      errors.push('Enter email for notifications');
    } else {
      const result = securityEnhancedEmailSchema.safeParse(formData.userEmail);
      if (!result.success) {
        errors.push('Enter correct email address');
      }
    }

    // Amount validation
    if (!formData.fromAmount || isNaN(Number(formData.fromAmount))) {
      errors.push('Enter correct amount');
    } else {
      const amount = Number(formData.fromAmount);
      if (amount <= 0) {
        errors.push('Amount must be greater than 0');
      }
    }

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
    exchangeStore.updateFormData({ fromAmount: amount });
  };

  const setFromCurrency = (currency: CryptoCurrency | null) => {
    exchangeStore.updateFormData({ fromCurrency: currency });
  };

  const setUserEmail = (email: string) => {
    exchangeStore.updateFormData({ userEmail: email });
  };

  const setRecipientData = (data: Partial<typeof exchangeStore.formData.recipientData>) => {
    exchangeStore.updateRecipientData(data);
  };

  return {
    setFromAmount,
    setFromCurrency,
    setUserEmail,
    setRecipientData,
  };
}
