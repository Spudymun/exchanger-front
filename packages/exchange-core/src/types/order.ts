import type { OrderStatus } from '@repo/constants';

import type { RecipientData } from './contact';
import type { CryptoCurrency } from './currency';

export interface CreateOrderRequest {
  email: string; // ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА: входной email от UI
  cryptoAmount: number;
  currency: CryptoCurrency;
  uahAmount: number;
  recipientData?: RecipientData;
}

export interface Order {
  id: string;
  userId: string; // ✅ ОБНОВЛЕНО: новая архитектура с userId
  cryptoAmount: number;
  currency: CryptoCurrency;
  uahAmount: number;
  tokenStandard?: string;
  status: OrderStatus;
  depositAddress: string;
  recipientData?: RecipientData;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  txHash?: string;
  // ✅ УДАЛЕНО: email - теперь через userId -> User relation
}
