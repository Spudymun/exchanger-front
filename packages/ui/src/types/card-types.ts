/**
 * Types for saved card management
 */

import type { UseFormReturn } from '@repo/hooks';

export interface SavedCard {
  id: string;
  lastFourDigits: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb' | 'diners' | 'unknown';
  expiryMonth?: string;
  expiryYear?: string;
  nickname?: string; // "Моя основная карта"
  isDefault?: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export interface CardSelectorProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  fieldName?: string;
  placeholder?: string;
  savedCards?: SavedCard[];
  onCardSelect?: (card: SavedCard) => void;
  onSaveCard?: (cardNumber: string) => void;
  allowSaveCard?: boolean;
  showCardIcons?: boolean;
}
