import { emailSchema } from '@repo/utils';

import {
  useExchangeStore as useExchangeStoreBase,
  type ExchangeStore,
} from './state/exchange-store';
import { useNotifications } from './useNotifications';

// Helper function to validate basic form fields
const validateBasicFields = (formData: ExchangeStore['formData']) => {
  const errors: Record<string, string[]> = {};

  if (!formData.fromCurrency) {
    errors.fromCurrency = ['Select currency to exchange'];
  }

  if (!formData.cryptoAmount || formData.cryptoAmount <= 0) {
    errors.cryptoAmount = ['Enter correct amount'];
  }

  if (!formData.cardNumber) {
    errors.cardNumber = ['Enter card number'];
  }

  if (!formData.agreeToTerms) {
    errors.agreement = ['Agreement must be accepted'];
  }

  return errors;
};

// Helper function to validate email using Zod schema
const validateEmailField = (userEmail: string) => {
  if (!userEmail) {
    return ['Enter email'];
  }

  const result = emailSchema.safeParse(userEmail);
  return result.success ? [] : result.error.issues.map(issue => issue.message);
};

// Validation helper using centralized validation utilities
const createValidationFunction = (
  store: ExchangeStore,
  notifications: ReturnType<typeof useNotifications>
) => {
  return () => {
    const { formData, calculation } = store;
    const errors = validateBasicFields(formData);

    // Use centralized email validation
    const emailErrors = validateEmailField(formData.email);
    if (emailErrors.length > 0) {
      errors.email = emailErrors;
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
          formData.cryptoAmount &&
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
    if (formData.cryptoAmount && formData.cryptoAmount > 0) progress++;
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
