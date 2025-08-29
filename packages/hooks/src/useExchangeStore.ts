import { emailSchema, validateWithZodSchema } from '@repo/utils';

import {
  useExchangeStore as useExchangeStoreBase,
  type ExchangeStore,
} from './state/exchange-store';
import { useNotifications } from './useNotifications';

// ✅ REDUNDANCY ELIMINATION: Removed validateBasicFields() duplication
// Zod схемы уже проверяют: fromCurrency.min(1), fromAmount validation, cardNumber.min(1), agreeToTerms
// Избегаем дублирования валидационной логики - используем только Zod

// ✅ REFACTOR: Use centralized validation helper instead of duplicate email validation
// Replaces duplicate validateEmailField() with existing validateWithZodSchema

// Validation helper using centralized validation utilities
const createValidationFunction = (
  store: ExchangeStore,
  notifications: ReturnType<typeof useNotifications>
) => {
  return () => {
    const { formData, calculation } = store;
    // ✅ REDUNDANCY ELIMINATION: Only calculation validation needed here
    // Basic field validation (fromCurrency, fromAmount, cardNumber, agreeToTerms)
    // is handled by Zod schemas in forms - no duplication needed
    const errors: Record<string, string[]> = {};

    // ✅ REFACTOR: Use centralized validation instead of duplicate validateEmailField
    const emailValidation = validateWithZodSchema(emailSchema, formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.errors;
    }

    if (!calculation?.isValid) {
      errors.calculation = ['Invalid exchange calculation'];
    }

    if (Object.keys(errors).length > 0) {
      notifications.handleFormValidation(errors);
      return false;
    }

    return true;
  };
};

// Helper methods
const createHelperMethods = (store: ExchangeStore) => ({
  canProceedToNextStep: () => {
    const { currentStep, formData, calculation } = store;

    switch (currentStep) {
      case 0:
        return !!(
          formData.fromCurrency &&
          formData.fromAmount && // ✅ UNIFIED: cryptoAmount → fromAmount
          formData.cardNumber &&
          formData.email &&
          calculation?.isValid
        );
      case 1:
        return formData.agreeToTerms;
      case 2:
        return !!store.currentOrder;
      default:
        return false;
    }
  },

  getFormProgress: () => {
    const { formData, calculation } = store;
    let progress = 0;
    const totalSteps = 6;

    if (formData.fromCurrency) progress++;
    if (formData.fromAmount && formData.fromAmount > 0) progress++; // ✅ UNIFIED: cryptoAmount → fromAmount
    if (formData.cardNumber) progress++;
    if (formData.email) progress++;
    if (calculation?.isValid) progress++;
    if (formData.agreeToTerms) progress++;

    return Math.round((progress / totalSteps) * 100);
  },
});

// Enhanced Exchange Store wrapper - устранена избыточная абстракция
export const useExchangeStore = () => {
  const store = useExchangeStoreBase();
  const notifications = useNotifications();

  return {
    // Прямой доступ к store без избыточных оберток
    ...store,

    // Только реально полезные методы
    validateForm: createValidationFunction(store, notifications),
    ...createHelperMethods(store),

    // Прямой доступ к notifications для использования компонентами
    notifications,
  };
};

export type UseExchangeStoreReturn = ReturnType<typeof useExchangeStore>;
