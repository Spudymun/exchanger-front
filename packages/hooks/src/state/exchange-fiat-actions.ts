import { UI_DEBOUNCE_CONSTANTS } from '@repo/constants';
import type { FiatCurrency, Bank } from '@repo/exchange-core';
import { createDebounceAction } from '@repo/utils';

import type { ExchangeStore } from './exchange-store.js';

export const createFiatActions = (
  set: (fn: (state: ExchangeStore) => Partial<ExchangeStore>) => void,
  get: () => ExchangeStore
) => ({
  updateFiatCurrencies: (currencies: FiatCurrency[]) => {
    set(() => ({ availableFiatCurrencies: currencies }));
  },

  updateBanksForCurrency: (currency: FiatCurrency, banks: Bank[]) => {
    set(() => ({ availableBanks: banks }));
  },

  getBanksForCurrency: (_currency: FiatCurrency) => {
    const { availableBanks } = get();
    return availableBanks;
  },

  selectFiatCurrency: (currency: FiatCurrency) => {
    set(state => ({
      formData: {
        ...state.formData,
        toCurrency: currency,
        selectedBank: null, // Сбрасываем банк при смене валюты
        toAmount: '', // Сбрасываем сумму получения
      },
      calculation: null, // Сбрасываем расчет
    }));

    // Автоматический пересчет с debounce
    const debouncedCalculate = createDebounceAction({
      set,
      get,
      action: () => get().calculateExchange(),
      delay: UI_DEBOUNCE_CONSTANTS.EXCHANGE_CALCULATION_DELAY,
    });
    debouncedCalculate();
  },

  selectBank: (bank: Bank) => {
    set(state => ({
      formData: {
        ...state.formData,
        selectedBank: bank,
        toAmount: '', // Сбрасываем сумму получения при смене банка
      },
      calculation: null, // Сбрасываем расчет
    }));

    // Автоматический пересчет с debounce
    const debouncedCalculate = createDebounceAction({
      set,
      get,
      action: () => get().calculateExchange(),
      delay: UI_DEBOUNCE_CONSTANTS.EXCHANGE_CALCULATION_DELAY,
    });
    debouncedCalculate();
  },
});
