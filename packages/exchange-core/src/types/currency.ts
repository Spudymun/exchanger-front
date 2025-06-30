import { CRYPTOCURRENCIES } from '@repo/constants';

export type CryptoCurrency = (typeof CRYPTOCURRENCIES)[number];

export interface CurrencyInfo {
  symbol: CryptoCurrency;
  name: string;
  decimals: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

export interface ExchangeRate {
  currency: CryptoCurrency;
  usdRate: number;
  uahRate: number;
  commission: number;
  lastUpdated: Date;
}
