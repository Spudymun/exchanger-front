import type { ExchangeStore } from './state/exchange-store.js';
import { useExchangeStore as useExchangeStoreBase } from './state/exchange-store.js';
import { useNotifications } from './useNotifications.js';

// Types
type ExchangeStoreInstance = ExchangeStore;
type NotificationsInstance = ReturnType<typeof useNotifications>;

// Базовые enhanced методы
const createBasicEnhancedMethods = (
  store: ExchangeStoreInstance,
  notifications: NotificationsInstance
) => ({
  updateFormData: (data: Parameters<ExchangeStoreInstance['updateFormData']>[0]) => {
    store.updateFormData(data);

    if (data.fromCurrency) {
      notifications.info('Валюта выбрана', `Выбрана валюта: ${data.fromCurrency}`);
    }
  },

  calculateExchange: () => {
    store.calculateExchange();

    if (store.isCalculating) {
      notifications.showProgress('Расчет курса обмена');
    }
  },
});

// Step navigation методы
const createStepEnhancedMethods = (
  store: ExchangeStoreInstance,
  notifications: NotificationsInstance
) => ({
  nextStep: () => {
    const currentStep = store.currentStep;
    store.nextStep();

    if (store.currentStep > currentStep) {
      notifications.success('Переход к следующему шагу');
    }
  },

  prevStep: () => {
    const currentStep = store.currentStep;
    store.prevStep();

    if (store.currentStep < currentStep) {
      notifications.info('Возврат к предыдущему шагу');
    }
  },

  goToStep: (stepIndex: number) => {
    const currentStep = store.currentStep;
    store.goToStep(stepIndex);

    if (store.currentStep !== currentStep && stepIndex >= 0 && stepIndex < store.steps.length) {
      const steps = store.steps;
      const step = steps.at(stepIndex);
      const stepName = step ? step.title : `Шаг ${stepIndex + 1}`;
      notifications.info('Переход к шагу', stepName);
    }
  },
});

// Order management методы
const createOrderEnhancedMethods = (
  store: ExchangeStoreInstance,
  notifications: NotificationsInstance
) => ({
  setCurrentOrder: (order: Parameters<ExchangeStoreInstance['setCurrentOrder']>[0]) => {
    store.setCurrentOrder(order);

    if (order) {
      notifications.handleExchangeSuccess(
        store.formData.fromCurrency || 'Крипто',
        'UAH',
        parseFloat(store.formData.fromAmount) || 0
      );
    }
  },

  updateOrderStatus: (status: Parameters<ExchangeStoreInstance['updateOrderStatus']>[0]) => {
    const oldStatus = store.currentOrder?.status;
    store.updateOrderStatus(status);

    if (oldStatus !== status && store.currentOrder) {
      notifications.handleOrderStatusChange(store.currentOrder.id, status);
    }
  },

  resetForm: () => {
    store.resetForm();
    notifications.info('Форма очищена');
  },

  resetStore: () => {
    store.resetStore();
    notifications.info('Все данные очищены');
  },
});

// Validation методы
const createValidationMethods = (
  store: ExchangeStoreInstance,
  notifications: NotificationsInstance
) => ({
  validateForm: () => {
    const { formData, calculation } = store;
    const errors: Record<string, string[]> = {};

    if (!formData.fromCurrency) {
      errors.fromCurrency = ['Выберите валюту для обмена'];
    }

    if (!formData.fromAmount || parseFloat(formData.fromAmount) <= 0) {
      errors.fromAmount = ['Введите корректную сумму'];
    }

    if (!formData.recipientData.cardNumber) {
      errors.cardNumber = ['Введите номер карты'];
    }

    if (!formData.userEmail) {
      errors.userEmail = ['Введите email'];
    }

    if (!formData.agreementAccepted) {
      errors.agreement = ['Необходимо принять соглашение'];
    }

    if (!calculation?.isValid) {
      errors.calculation = ['Некорректный расчет обмена'];
    }

    if (Object.keys(errors).length > 0) {
      notifications.handleFormValidation(errors);
      return false;
    }

    return true;
  },
});

// Helper методы
const createHelperMethods = (store: ExchangeStoreInstance) => ({
  canProceedToNextStep: () => {
    const { currentStep, formData, calculation } = store;

    switch (currentStep) {
      case 0:
        return !!(
          formData.fromCurrency &&
          formData.fromAmount &&
          formData.recipientData.cardNumber &&
          formData.userEmail &&
          calculation?.isValid
        );
      case 1:
        return formData.agreementAccepted;
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
    if (formData.fromAmount && parseFloat(formData.fromAmount) > 0) progress++;
    if (formData.recipientData.cardNumber) progress++;
    if (formData.userEmail) progress++;
    if (calculation?.isValid) progress++;
    if (formData.agreementAccepted) progress++;

    return Math.round((progress / totalSteps) * 100);
  },
});

// Enhanced Exchange Store wrapper с интеграцией уведомлений
export const useExchangeStore = () => {
  const store = useExchangeStoreBase();
  const notifications = useNotifications();

  return {
    // Все методы и состояние из базового store
    ...store,

    // Enhanced методы
    ...createBasicEnhancedMethods(store, notifications),
    ...createStepEnhancedMethods(store, notifications),
    ...createOrderEnhancedMethods(store, notifications),

    // Utility методы
    ...createValidationMethods(store, notifications),
    ...createHelperMethods(store),
  };
};

export type UseExchangeStoreReturn = ReturnType<typeof useExchangeStore>;
