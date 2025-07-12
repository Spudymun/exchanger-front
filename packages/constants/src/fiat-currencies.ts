/**
 * Fiat currency-related constants for ExchangeGO
 * Based on exchanger_AC.md requirements
 */

// Поддерживаемые фиатные валюты
export const FIAT_CURRENCIES = ['UAH', 'USD', 'EUR'] as const;

// Display names for fiat currencies
export const FIAT_CURRENCY_NAMES = {
  UAH: 'Українська гривня',
  USD: 'US Dollar',
  EUR: 'Euro',
} as const;

// Currency symbols
export const FIAT_CURRENCY_SYMBOLS = {
  UAH: '₴',
  USD: '$',
  EUR: '€',
} as const;

// Minimum transaction amounts for each fiat currency
export const FIAT_MIN_AMOUNTS = {
  UAH: 100,
  USD: 5,
  EUR: 5,
} as const;

// Maximum transaction amounts for each fiat currency
export const FIAT_MAX_AMOUNTS = {
  UAH: 100000000,
  USD: 2500000,
  EUR: 2200000,
} as const;

// Decimal precision for each fiat currency
export const FIAT_CURRENCY_DECIMALS = {
  UAH: 2,
  USD: 2,
  EUR: 2,
} as const;

// Mock exchange rates for fiat currencies (relative to UAH)
export const MOCK_FIAT_RATES = {
  UAH: 1, // Base currency
  USD: 40, // 1 USD = 40 UAH
  EUR: 43, // 1 EUR = 43 UAH
} as const;
