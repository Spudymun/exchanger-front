import { UI_DEBOUNCE_CONSTANTS, getBanksForCurrency } from '@repo/constants';
import type { FiatCurrency, Bank } from '@repo/exchange-core';
import { createDebounceAction } from '@repo/utils';

import type { ExchangeStore } from './exchange-store';

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

  getBanksForCurrency: (currency: FiatCurrency) => {
    return getBanksForCurrency(currency);
  },

  selectFiatCurrency: (_currency: FiatCurrency) => {
    set(state => ({
      formData: {
        ...state.formData,
        toCurrency: 'UAH', // Always UAH in current implementation
        selectedBankId: '', // Сбрасываем банк при смене валюты
        uahAmount: 0, // Сбрасываем сумму получения
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
        selectedBankId: bank.id,
        uahAmount: 0, // Сбрасываем сумму получения при смене банка
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
