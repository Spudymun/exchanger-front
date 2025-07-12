import type { ExchangeFormData, ExchangeStep } from './exchange-store.js';

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
    title: 'Данные обмена',
    description: 'Введите данные для обмена валют',
    isCompleted: false,
    isActive: true,
    canSkip: false,
  },
  {
    id: 'review',
    title: 'Проверка данных',
    description: 'Проверьте правильность введенных данных',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
  {
    id: 'payment',
    title: 'Оплата',
    description: 'Отправьте криптовалюту на указанный адрес',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
  {
    id: 'completed',
    title: 'Готово',
    description: 'Обмен завершен успешно',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
];
