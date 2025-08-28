import type { ExchangeStore } from './exchange-store';

// Селекторы для Exchange Store
export const selectFormData = (state: ExchangeStore) => state.formData;
export const selectCalculation = (state: ExchangeStore) => state.calculation;
export const selectCurrentStep = (state: ExchangeStore) => state.currentStep;
export const selectSteps = (state: ExchangeStore) => state.steps;
export const selectCurrentOrder = (state: ExchangeStore) => state.currentOrder;
export const selectAvailableRates = (state: ExchangeStore) => state.availableRates;

// Производные селекторы
export const selectIsFormValid = (state: ExchangeStore) => {
  const { formData, calculation } = state;
  return !!(
    formData.fromCurrency &&
    formData.fromAmount && // ✅ UNIFIED: cryptoAmount → fromAmount
    formData.cardNumber &&
    formData.email &&
    formData.agreeToTerms &&
    calculation?.isValid
  );
};

export const selectCurrentStepData = (state: ExchangeStore) => {
  return state.steps[state.currentStep];
};

export const selectCanProceedToNextStep = (state: ExchangeStore) => {
  const currentStep = state.steps[state.currentStep];
  return currentStep?.isCompleted || false;
};
