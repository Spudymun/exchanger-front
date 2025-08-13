import { type CryptoCurrency } from '@repo/constants';

// Re-export the centralized type for backward compatibility
export type { CryptoCurrency };

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
