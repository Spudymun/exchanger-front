import { EXCHANGE_ORDER_STATUSES } from '@repo/constants';

import type { RecipientData } from './contact';
import type { CryptoCurrency } from './currency';

export type OrderStatus = keyof typeof EXCHANGE_ORDER_STATUSES;

export interface CreateOrderRequest {
  email: string;
  cryptoAmount: number;
  currency: CryptoCurrency;
  uahAmount: number;
  recipientData?: RecipientData;
}

export interface Order {
  id: string;
  email: string;
  cryptoAmount: number;
  currency: CryptoCurrency;
  uahAmount: number;
  status: OrderStatus;
  depositAddress: string;
  recipientData?: RecipientData;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  txHash?: string;
}
