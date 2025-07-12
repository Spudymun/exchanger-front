import { FIAT_CURRENCIES } from '@repo/constants';

export type FiatCurrency = (typeof FIAT_CURRENCIES)[number];

export interface FiatCurrencyInfo {
  symbol: FiatCurrency;
  name: string;
  decimals: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

export interface Bank {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  isActive: boolean;
  priority: number;
}

export interface BankReserve {
  bankId: string;
  currency: FiatCurrency;
  amount: number;
  lastUpdated: Date;
}

export interface FiatExchangeRate {
  fromCurrency: FiatCurrency;
  toCurrency: FiatCurrency;
  rate: number;
  lastUpdated: Date;
}
