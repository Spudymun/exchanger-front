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

// Mock crypto addresses for testing/demo purposes
export const MOCK_CRYPTO_ADDRESSES = {
  BTC: [
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis block address
    '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
  ],
  ETH: [
    '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
    '0x742d35Cc6634C0532925a3b8D43C693C1e8AE95C',
    '0x8ba1f109551bD432803012645Hac136c47F63b',
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  ],
  USDT: [
    '0xa0b86a33E6c6cA2F91e9FdE7Be3fEbC4E4c3eE25',
    '0x3fE9C7c9b0F8F7f0c5f5e3c9a2c1c9f8e7d6c5b4',
    '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
    '0x6b175474e89094c44da98b954eedeac495271d0f',
  ],
  LTC: [
    'LU8Xfo4e7v2QA5jKHHSgP91D2kPZ9K4nB2',
    'ltc1qfy2nxhxlw4p8e3j4h7n6q9d8c7b6a5g4f3e2d',
    'M9o7s6t3a2b8c7d6e5f4g3h2i1j0k9l8m',
    'LTC_ADDRESS_FOR_TESTING_PURPOSES_ONLY',
  ],
} as const;
