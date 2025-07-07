import type {
  CryptoCurrency,
  ExchangeRate,
  OrderStatus,
  ExchangeRecipientData,
} from '@repo/exchange-core';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import { DEFAULT_FORM_DATA, DEFAULT_STEPS, DEBOUNCE_DELAY } from './exchange-constants.js';
import {
  calculateExchangeRate,
  getNextStepIndex,
  getPrevStepIndex,
  clampStepIndex,
} from './exchange-helpers.js';

// Интерфейсы для данных формы обмена
export interface ExchangeFormData {
  fromCurrency: CryptoCurrency | null;
  toCurrency: 'UAH'; // Проект поддерживает только обмен на UAH
  fromAmount: string;
  toAmount: string;
  recipientData: ExchangeRecipientData;
  userEmail: string;
  agreementAccepted: boolean;
}

export interface ExchangeCalculation {
  fromAmount: number;
  toAmount: number;
  rate: number;
  commission: number;
  commissionAmount: number;
  finalAmount: number;
  isValid: boolean;
  errors: string[];
}

export interface ExchangeStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  canSkip: boolean;
}

export interface ExchangeOrderData {
  id: string;
  status: OrderStatus;
  depositAddress: string;
  qrCode?: string;
  timeLeft?: number; // в секундах
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeStore {
  // Form data
  formData: ExchangeFormData;

  // Calculation
  calculation: ExchangeCalculation | null;

  // UI State
  currentStep: number;
  steps: ExchangeStep[];
  isCalculating: boolean;
  isSubmitting: boolean;

  // Order data
  currentOrder: ExchangeOrderData | null;

  // Available data
  availableRates: ExchangeRate[];

  // Actions
  updateFormData: (data: Partial<ExchangeFormData>) => void;
  updateRecipientData: (data: Partial<ExchangeFormData['recipientData']>) => void;
  calculateExchange: () => void;
  resetCalculation: () => void;

  // Step management
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;

  // Order management
  setCurrentOrder: (order: ExchangeOrderData | null) => void;
  updateOrderStatus: (status: OrderStatus) => void;

  // Rates management
  updateRates: (rates: ExchangeRate[]) => void;
  getRateForCurrency: (currency: CryptoCurrency) => ExchangeRate | null;

  // Reset
  resetForm: () => void;
  resetStore: () => void;
}

// Функции actions для уменьшения размера основного store
const createFormActions = (
  set: (fn: (state: ExchangeStore) => Partial<ExchangeStore>) => void,
  get: () => ExchangeStore
) => ({
  updateFormData: (data: Partial<ExchangeFormData>) => {
    set(state => ({
      formData: { ...state.formData, ...data },
    }));

    // Автоматический пересчет при изменении валюты или суммы
    if (data.fromCurrency || data.fromAmount) {
      setTimeout(() => get().calculateExchange(), DEBOUNCE_DELAY);
    }
  },

  updateRecipientData: (data: Partial<ExchangeFormData['recipientData']>) => {
    set(state => ({
      formData: {
        ...state.formData,
        recipientData: { ...state.formData.recipientData, ...data },
      },
    }));
  },
});

const createCalculationActions = (
  set: (fn: (state: ExchangeStore) => Partial<ExchangeStore>) => void,
  get: () => ExchangeStore
) => ({
  calculateExchange: () => {
    const { formData, availableRates } = get();

    if (!formData.fromCurrency || !formData.fromAmount) {
      set(() => ({ calculation: null }));
      return;
    }

    set(() => ({ isCalculating: true }));

    try {
      const calculation = calculateExchangeRate(formData, availableRates);
      set(() => ({
        calculation,
        isCalculating: false,
      }));
    } catch {
      set(() => ({
        calculation: {
          fromAmount: 0,
          toAmount: 0,
          rate: 0,
          commission: 0,
          commissionAmount: 0,
          finalAmount: 0,
          isValid: false,
          errors: ['Ошибка расчета'],
        },
        isCalculating: false,
      }));
    }
  },

  resetCalculation: () => {
    set(() => ({ calculation: null }));
  },
});

const createStepActions = (
  set: (fn: (state: ExchangeStore) => Partial<ExchangeStore>) => void
) => ({
  nextStep: () => {
    set(state => {
      const nextStepIndex = getNextStepIndex(state.currentStep, state.steps.length);
      const updatedSteps = state.steps.map((step, index) => ({
        ...step,
        isCompleted: index < nextStepIndex,
        isActive: index === nextStepIndex,
      }));

      return {
        currentStep: nextStepIndex,
        steps: updatedSteps,
      };
    });
  },

  prevStep: () => {
    set(state => {
      const prevStepIndex = getPrevStepIndex(state.currentStep);
      const updatedSteps = state.steps.map((step, index) => ({
        ...step,
        isCompleted: index < prevStepIndex,
        isActive: index === prevStepIndex,
      }));

      return {
        currentStep: prevStepIndex,
        steps: updatedSteps,
      };
    });
  },

  goToStep: (stepIndex: number) => {
    set(state => {
      const clampedIndex = clampStepIndex(stepIndex, state.steps.length);
      const updatedSteps = state.steps.map((step, index) => ({
        ...step,
        isCompleted: index < clampedIndex,
        isActive: index === clampedIndex,
      }));

      return {
        currentStep: clampedIndex,
        steps: updatedSteps,
      };
    });
  },
});

const createOrderActions = (
  set: (fn: (state: ExchangeStore) => Partial<ExchangeStore>) => void
) => ({
  setCurrentOrder: (order: ExchangeOrderData | null) => {
    set(() => ({ currentOrder: order }));
  },

  updateOrderStatus: (status: OrderStatus) => {
    set(state => ({
      currentOrder: state.currentOrder
        ? { ...state.currentOrder, status, updatedAt: new Date() }
        : null,
    }));
  },
});

const createRatesActions = (
  set: (fn: (state: ExchangeStore) => Partial<ExchangeStore>) => void,
  get: () => ExchangeStore
) => ({
  updateRates: (rates: ExchangeRate[]) => {
    set(() => ({ availableRates: rates }));
  },

  getRateForCurrency: (currency: CryptoCurrency) => {
    const { availableRates } = get();
    return availableRates.find(r => r.currency === currency) || null;
  },
});

const createResetActions = (
  set: (fn: (state: ExchangeStore) => Partial<ExchangeStore>) => void
) => ({
  resetForm: () => {
    set(() => ({
      formData: DEFAULT_FORM_DATA,
      calculation: null,
      currentStep: 0,
      steps: DEFAULT_STEPS,
      currentOrder: null,
    }));
  },

  resetStore: () => {
    set(() => ({
      formData: DEFAULT_FORM_DATA,
      calculation: null,
      currentStep: 0,
      steps: DEFAULT_STEPS,
      isCalculating: false,
      isSubmitting: false,
      currentOrder: null,
      availableRates: [],
    }));
  },
});

export const useExchangeStore = create<ExchangeStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      formData: DEFAULT_FORM_DATA,
      calculation: null,
      currentStep: 0,
      steps: DEFAULT_STEPS,
      isCalculating: false,
      isSubmitting: false,
      currentOrder: null,
      availableRates: [],

      // Actions
      ...createFormActions(set, get),
      ...createCalculationActions(set, get),
      ...createStepActions(set),
      ...createOrderActions(set),
      ...createRatesActions(set, get),
      ...createResetActions(set),
    })),
    {
      name: 'exchange-store',
      version: 1,
    }
  )
);
