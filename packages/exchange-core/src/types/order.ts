import type { OrderStatus } from '@repo/constants';

import type { RecipientData } from './contact';
import type { CryptoCurrency } from './currency';

export interface CreateOrderRequest {
  email: string; // ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА: входной email от UI
  cryptoAmount: number;
  currency: CryptoCurrency;
  uahAmount: number;
  recipientData?: RecipientData;
  walletId?: string; // ✅ ДОБАВЛЕНО: для привязки кошелька при создании
  bankId?: string; // ✅ ДОБАВЛЕНО: ID банка получателя
  fixedExchangeRate?: number; // ✅ ДОБАВЛЕНО: курс фиксации с frontend
}

export interface Order {
  id: string;
  publicId: string; // ✅ ДОБАВЛЕНО: внешний ID для URL и API
  userId: string; // ✅ ОБНОВЛЕНО: новая архитектура с userId
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
  // ✅ OPERATOR FIELDS: поля для операторской работы
  assignedOperatorId?: string;
  assignedAt?: Date;
  // ✅ ESCALATION FIELDS: поля для эскалации
  escalationReason?: string;
  escalationPriority?: 'low' | 'medium' | 'high';
  escalatedAt?: Date;
  escalatedBy?: string;
  // ✅ BANK AND RATE FIELDS: поля для банка получателя и курса фиксации
  bankId?: string; // UUID банка получателя
  bankName?: string; // Название банка для UI (из relation)
  fixedExchangeRate?: number; // Курс на момент создания ордера
  // ✅ УДАЛЕНО: email - теперь через userId -> User relation
  // ✅ УДАЛЕНО: tokenStandard - теперь через walletId -> Wallet relation
}

/**
 * Extended Order interface for UI components
 * Includes resolved data from relations (user email, wallet tokenStandard)
 */
export interface OrderWithUIData extends Order {
  email?: string; // From User relation
  tokenStandard?: string; // From Wallet relation
  // ✅ BANK UI DATA: данные банка для отображения в UI
  bankName?: string; // Название банка (из relation)
  bankShortName?: string; // Короткое название банка
}
