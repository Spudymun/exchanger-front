import type { OrderStatus } from '@repo/constants';
import { UI_DEBOUNCE_CONSTANTS } from '@repo/constants';
import type { CryptoCurrency, ExchangeRate, FiatCurrency, Bank } from '@repo/exchange-core';
import {
  createStore,
  createDebounceAction,
  createTimerActions,
  type TimerState,
} from '@repo/utils';

import { DEFAULT_FORM_DATA, DEFAULT_STEPS } from './exchange-constants';
import { createFiatActions } from './exchange-fiat-actions';
import {
  calculateExchangeRate,
  getNextStepIndex,
  getPrevStepIndex,
  clampStepIndex,
} from './exchange-helpers';

// Интерфейсы для данных формы обмена
export interface ExchangeFormData {
  fromCurrency: CryptoCurrency;
  tokenStandard: string; // string as used in real forms
  toCurrency: 'UAH';
  fromAmount: number; // ✅ UNIFIED: rename cryptoAmount → fromAmount (consistent with calculations)
  uahAmount: number; // number for calculations
  selectedBankId: string; // string as used in real forms
  cardNumber: string;
  email: string;
  captcha: string; // ✅ UNIFIED: rename captchaAnswer → captcha (consistent with auth forms)
  agreeToTerms: boolean;
  rememberData?: boolean;
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

export interface ExchangeStore extends TimerState {
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
  availableFiatCurrencies: FiatCurrency[];
  availableBanks: Bank[];

  // Actions
  updateFormData: (data: Partial<ExchangeFormData>) => void;
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

  // Fiat currency and bank management
  updateFiatCurrencies: (currencies: FiatCurrency[]) => void;
  updateBanksForCurrency: (currency: FiatCurrency, banks: Bank[]) => void;
  getBanksForCurrency: (currency: FiatCurrency) => readonly Bank[];
  selectFiatCurrency: (currency: FiatCurrency) => void;
  selectBank: (bank: Bank) => void;

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

    // Автоматический пересчет при изменении валюты или суммы с debounce
    if (data.fromCurrency || data.fromAmount) {
      const debouncedCalculate = createDebounceAction({
        set,
        get,
        action: () => get().calculateExchange(),
        delay: UI_DEBOUNCE_CONSTANTS.EXCHANGE_CALCULATION_DELAY,
        key: 'exchange-calculation',
      });
      debouncedCalculate();
    }
  },
});

const createCalculationActions = (
  set: (fn: (state: ExchangeStore) => Partial<ExchangeStore>) => void,
  get: () => ExchangeStore
) => ({
  calculateExchange: async () => {
    const { formData, availableRates } = get();

    if (!formData.fromCurrency || formData.fromAmount <= 0) {
      set(() => ({ calculation: null }));
      return;
    }

    set(() => ({ isCalculating: true }));

    try {
      const calculation = await calculateExchangeRate(formData, availableRates);
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
          errors: ['Calculation error'],
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
  set: (fn: (state: ExchangeStore) => Partial<ExchangeStore>) => void,
  get: () => ExchangeStore
) => ({
  resetForm: () => {
    // Используем централизованный timer cleanup
    const timerActions = createTimerActions(set, get);
    timerActions.clearAllTimers();

    set(() => ({
      formData: DEFAULT_FORM_DATA,
      calculation: null,
      currentStep: 0,
      steps: DEFAULT_STEPS,
      currentOrder: null,
    }));
  },

  resetStore: () => {
    // Используем централизованный timer cleanup
    const timerActions = createTimerActions(set, get);
    timerActions.clearAllTimers();

    set(() => ({
      formData: DEFAULT_FORM_DATA,
      calculation: null,
      currentStep: 0,
      steps: DEFAULT_STEPS,
      isCalculating: false,
      isSubmitting: false,
      currentOrder: null,
      availableRates: [],
      availableFiatCurrencies: [],
      availableBanks: [],
    }));
  },
});

export const useExchangeStore = createStore<ExchangeStore>(
  { name: 'exchange-store', version: 1 },
  (set, get) => ({
    // Initial state
    formData: DEFAULT_FORM_DATA,
    calculation: null,
    currentStep: 0,
    steps: DEFAULT_STEPS,
    isCalculating: false,
    isSubmitting: false,
    currentOrder: null,
    availableRates: [],
    availableFiatCurrencies: [],
    availableBanks: [],
    timers: new Map(),

    // Actions
    ...createFormActions(set, get),
    ...createCalculationActions(set, get),
    ...createStepActions(set),
    ...createOrderActions(set),
    ...createRatesActions(set, get),
    ...createFiatActions(set, get),
    ...createResetActions(set, get),
  })
);
