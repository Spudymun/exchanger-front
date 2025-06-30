/**
 * ExchangeGO specific constants
 */

// Поддерживаемые криптовалюты
export const CRYPTOCURRENCIES = ['BTC', 'ETH', 'USDT', 'LTC'] as const;

// Лимиты сумм (в USD эквиваленте)
export const AMOUNT_LIMITS = {
  MIN_USD: 10,
  MAX_USD: 5000,
} as const;

// Статусы заявок ExchangeGO
export const EXCHANGE_ORDER_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Конфигурация статусов для UI ExchangeGO
export const EXCHANGE_ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Ожидание оплаты',
    color: 'warning' as const,
    icon: 'clock',
    description: 'Переведите криптовалюту на указанный адрес',
  },
  paid: {
    label: 'Оплачено',
    color: 'info' as const,
    icon: 'check-circle',
    description: 'Платеж получен, заявка в обработке',
  },
  processing: {
    label: 'В обработке',
    color: 'info' as const,
    icon: 'loader',
    description: 'Обрабатывается оператором',
  },
  completed: {
    label: 'Выполнено',
    color: 'success' as const,
    icon: 'check-circle-2',
    description: 'Средства переведены на ваш счет',
  },
  cancelled: {
    label: 'Отменено',
    color: 'destructive' as const,
    icon: 'x-circle',
    description: 'Заявка отменена',
  },
} as const;

// Комиссии (в процентах)
export const COMMISSION_RATES = {
  BTC: 2.5,
  ETH: 2.0,
  USDT: 1.5,
  LTC: 2.0,
} as const;

// Тестовые адреса для мока
export const MOCK_CRYPTO_ADDRESSES = {
  BTC: [
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    '1JVqz1z2DnGrNhyzsZ1mGV8rQqQrWjRJNJ',
  ],
  ETH: [
    '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
    '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
  ],
  USDT: [
    '0xdac17f958d2ee523a2206206994597c13d831ec7',
    '0xa0b86a33e6e306e33b7b1b61e3d2be6f8f7e4d1c',
    '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
  ],
  LTC: [
    'LTC1qaw6gqgx7h5p2f8mh9dwmf6v3f3qg6g8y6h3h4',
    'LTC1q5k8j4h3k2j1f9g8h7j6k5l4m3n2o1p0q9r8',
    'LTC1qz8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2',
  ],
} as const;

// Валидационные ограничения ExchangeGO
export const EXCHANGE_VALIDATION_LIMITS = {
  ORDER_ID_LENGTH: 36,
  CRYPTO_ADDRESS_MAX_LENGTH: 100,
  CARD_NUMBER_LENGTH: 16,
} as const;

// Regex паттерны ExchangeGO
export const EXCHANGE_VALIDATION_PATTERNS = {
  CARD_NUMBER: /^\d{16}$/,
  CRYPTO_AMOUNT: /^\d+(\.\d{1,8})?$/,
  UAH_AMOUNT: /^\d+(\.\d{1,2})?$/,
} as const;

// Сообщения валидации ExchangeGO
export const EXCHANGE_VALIDATION_MESSAGES = {
  AMOUNT_TOO_LOW: `Минимальная сумма: $${AMOUNT_LIMITS.MIN_USD}`,
  AMOUNT_TOO_HIGH: `Максимальная сумма: $${AMOUNT_LIMITS.MAX_USD}`,
  CURRENCY_INVALID: 'Неподдерживаемая криптовалюта',
  CARD_NUMBER_INVALID: 'Некорректный номер карты',
} as const;
