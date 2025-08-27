import { EXCHANGE_DEFAULTS, getDefaultTokenStandard } from '@repo/constants';

import type { ExchangeFormData, ExchangeStep } from './exchange-store';

// Дефолтные значения для Exchange Store
export const DEFAULT_FORM_DATA: ExchangeFormData = {
  fromCurrency: EXCHANGE_DEFAULTS.FROM_CURRENCY,
  tokenStandard: getDefaultTokenStandard(EXCHANGE_DEFAULTS.FROM_CURRENCY) || 'TRC-20',
  toCurrency: EXCHANGE_DEFAULTS.TO_CURRENCY,
  cryptoAmount: 0,
  uahAmount: 0,
  selectedBankId: '',
  cardNumber: '',
  email: '',
  captcha: '', // ✅ UNIFIED: rename captchaAnswer → captcha (consistent with auth forms)
  agreeToTerms: false,
  rememberData: false,
};

export const DEFAULT_STEPS: ExchangeStep[] = [
  {
    id: 'form',
    title: 'Exchange Data',
    description: 'Enter data for currency exchange',
    isCompleted: false,
    isActive: true,
    canSkip: false,
  },
  {
    id: 'review',
    title: 'Data Review',
    description: 'Check the correctness of entered data',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
  {
    id: 'payment',
    title: 'Payment',
    description: 'Send cryptocurrency to the specified address',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
  {
    id: 'completed',
    title: 'Done',
    description: 'Exchange completed successfully',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
];
