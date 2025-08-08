import type { ExchangeFormData, ExchangeStep } from './exchange-store';

// Дефолтные значения для Exchange Store
export const DEFAULT_FORM_DATA: ExchangeFormData = {
  fromCurrency: null,
  toCurrency: null,
  selectedBank: null,
  fromAmount: '',
  toAmount: '',
  recipientData: {
    cardNumber: '',
    recipientName: '',
    phone: '',
  },
  userEmail: '',
  agreementAccepted: false,
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
