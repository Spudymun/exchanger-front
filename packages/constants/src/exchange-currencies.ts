/**
 * Cryptocurrency-related constants for ExchangeGO
 */

// Поддерживаемые криптовалюты
export const CRYPTOCURRENCIES = ['BTC', 'ETH', 'USDT', 'LTC'] as const;

// Комиссии (в процентах)
export const COMMISSION_RATES = {
  BTC: 2.5,
  ETH: 2.0,
  USDT: 1.5,
  LTC: 2.0,
} as const;

// Blockchain explorer URLs
export const EXPLORER_URLS = {
  BTC: 'https://blockchair.com/bitcoin/transaction',
  ETH: 'https://etherscan.io/tx',
  USDT: 'https://etherscan.io/tx',
  LTC: 'https://blockchair.com/litecoin/transaction',
} as const;

// Network names for cryptocurrencies
export const NETWORK_NAMES = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  USDT: 'Ethereum (ERC-20)',
  LTC: 'Litecoin',
} as const;

// Decimal places for each cryptocurrency
export const CURRENCY_DECIMALS = {
  BTC: 8,
  ETH: 18,
  USDT: 6,
  LTC: 8,
} as const;

// Minimum transaction amounts
export const MIN_TRANSACTION_AMOUNTS = {
  BTC: 0.00001,
  ETH: 0.001,
  USDT: 1,
  LTC: 0.001,
} as const;

// Currency symbols for display
export const CURRENCY_SYMBOLS = {
  BTC: '₿',
  ETH: 'Ξ',
  USDT: '₮',
  LTC: 'Ł',
} as const;

// Full names of cryptocurrencies
export const CURRENCY_FULL_NAMES = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  USDT: 'Tether USD',
  LTC: 'Litecoin',
} as const;

// Currency display names (centralized)
export const CURRENCY_NAMES = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  USDT: 'Tether (ERC-20)',
  LTC: 'Litecoin',
} as const;

// Mock exchange rates (в реальном приложении будут браться с API)
export const MOCK_EXCHANGE_RATES = {
  BTC: {
    usdRate: 45000,
    uahRate: 1800000, // 45000 * 40 (примерный курс UAH/USD)
  },
  ETH: {
    usdRate: 3000,
    uahRate: 120000,
  },
  USDT: {
    usdRate: 1,
    uahRate: 40,
  },
  LTC: {
    usdRate: 100,
    uahRate: 4000,
  },
} as const;
