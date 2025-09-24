// Domain-specific error types
export type ExchangeErrorType = 
  | 'wallet_allocation_failed'
  | 'insufficient_liquidity'
  | 'rate_expired'
  | 'exchange_limit_exceeded';

export type UserErrorType =
  | 'invalid_credentials' 
  | 'account_suspended'
  | 'verification_required'
  | 'kyc_failed';

export type PaymentErrorType = 
  | 'payment_failed'
  | 'card_declined'
  | 'insufficient_funds'
  | 'payment_timeout';

// Base error categories
export type ErrorCategory = 'business' | 'system' | 'validation';

export interface DomainError<T = string> {
  type: T;
  category: ErrorCategory;
  message: string;
  userMessage?: string; // Override default user message
  context?: Record<string, unknown>;
}

// Domain error creators
export type ExchangeError = DomainError<ExchangeErrorType>;
export type UserError = DomainError<UserErrorType>;
export type PaymentError = DomainError<PaymentErrorType>;