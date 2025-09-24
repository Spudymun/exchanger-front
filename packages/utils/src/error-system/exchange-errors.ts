import type { ExchangeError } from './domain-errors';
import { ErrorMapper } from './error-mapper';

// Domain-specific error creators with smart defaults
export class ExchangeErrors {
  static walletAllocationFailed(context?: Record<string, unknown>): ExchangeError {
    return {
      type: 'wallet_allocation_failed',
      category: 'system',
      message: 'Failed to allocate wallet from pool',
      context
    };
  }

  static insufficientLiquidity(
    required: number, 
    available: number,
    pair: string
  ): ExchangeError {
    return {
      type: 'insufficient_liquidity',
      category: 'business', 
      message: `Insufficient liquidity for ${pair}`,
      context: { required, available, pair }
    };
  }

  static rateExpired(rateId: string): ExchangeError {
    return {
      type: 'rate_expired',
      category: 'business',
      message: 'Exchange rate has expired',
      context: { rateId }
    };
  }

  // Helper to throw TRPC error directly
  static throw(error: ExchangeError): never {
    throw ErrorMapper.mapToTRPCError(error);
  }
}

// Type-safe error checker
export function isExchangeError(error: unknown): error is ExchangeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'category' in error &&
    typeof (error as Record<string, unknown>).type === 'string'
  );
}