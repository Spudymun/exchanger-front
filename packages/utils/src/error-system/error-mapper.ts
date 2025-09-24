import { TRPCError } from '@trpc/server';

import type { DomainError, ErrorCategory } from './domain-errors';

// Constants
const SERVICE_UNAVAILABLE_MESSAGE = 'server.errors.internal.serviceUnavailable';
const DOMAIN_ERROR_PREFIX = '[DOMAIN_ERROR]';
const OPS_ALERT_PREFIX = '[OPS_ALERT]';

// Error mapping configuration
interface ErrorMappingConfig {
  category: ErrorCategory;
  defaultUserMessage: string;
  logLevel: 'error' | 'warn' | 'info';
  shouldNotifyOps: boolean;
}

// Centralized error mappings
const ERROR_MAPPINGS = new Map<string, ErrorMappingConfig>([
  // Exchange domain
  ['wallet_allocation_failed', {
    category: 'system',
    defaultUserMessage: 'server.errors.business.walletAllocationFailed',
    logLevel: 'error',
    shouldNotifyOps: true
  }],
  ['insufficient_liquidity', {
    category: 'business', 
    defaultUserMessage: 'server.errors.exchange.insufficientLiquidity',
    logLevel: 'warn',
    shouldNotifyOps: false
  }],
  ['rate_expired', {
    category: 'business',
    defaultUserMessage: 'server.errors.exchange.rateExpired', 
    logLevel: 'info',
    shouldNotifyOps: false
  }],
  
  // User domain
  ['invalid_credentials', {
    category: 'business',
    defaultUserMessage: 'server.errors.auth.invalidCredentials',
    logLevel: 'info', 
    shouldNotifyOps: false
  }],
  ['account_suspended', {
    category: 'business',
    defaultUserMessage: 'server.errors.auth.accountSuspended',
    logLevel: 'warn',
    shouldNotifyOps: true
  }],
  
  // Payment domain  
  ['payment_failed', {
    category: 'system',
    defaultUserMessage: SERVICE_UNAVAILABLE_MESSAGE,
    logLevel: 'error',
    shouldNotifyOps: true
  }],
  ['card_declined', {
    category: 'business', 
    defaultUserMessage: 'server.errors.payment.cardDeclined',
    logLevel: 'info',
    shouldNotifyOps: false
  }]
]);

// Smart error mapper
export class ErrorMapper {
  static mapToTRPCError<T extends string>(domainError: DomainError<T>): TRPCError {
    const config = ERROR_MAPPINGS.get(domainError.type);
    
    if (!config) {
      // Fallback for unmapped errors
      return new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: SERVICE_UNAVAILABLE_MESSAGE
      });
    }

    // Use custom user message or default from mapping
    const userMessage = domainError.userMessage ?? config.defaultUserMessage;
    
    // Log based on configuration
    this.logError(domainError, config);
    
    // Notify ops if needed
    if (config.shouldNotifyOps) {
      this.notifyOperations(domainError, config);
    }

    // Map category to TRPC code
    const trpcCode = this.categoryToTRPCCode(config.category);
    
    return new TRPCError({
      code: trpcCode,
      message: userMessage,
      cause: domainError
    });
  }

  private static categoryToTRPCCode(category: ErrorCategory) {
    switch (category) {
      case 'business':
        return 'BAD_REQUEST' as const;
      case 'validation':
        return 'BAD_REQUEST' as const;  
      case 'system':
        return 'INTERNAL_SERVER_ERROR' as const;
      default:
        return 'INTERNAL_SERVER_ERROR' as const;
    }
  }

  private static logError<T extends string>(error: DomainError<T>, config: ErrorMappingConfig) {
    const logData = {
      type: error.type,
      category: error.category,
      message: error.message,
      context: error.context,
      timestamp: new Date().toISOString()
    };

    switch (config.logLevel) {
      case 'error':
        // eslint-disable-next-line no-console
        console.error(DOMAIN_ERROR_PREFIX, logData);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(DOMAIN_ERROR_PREFIX, logData);
        break;
      case 'info':
        // eslint-disable-next-line no-console
        console.info(DOMAIN_ERROR_PREFIX, logData);
        break;
    }
  }

  private static async notifyOperations<T extends string>(
    error: DomainError<T>, 
    config: ErrorMappingConfig
  ) {
    // Here would be integration with monitoring/alerting
    // Slack, PagerDuty, etc.
    // eslint-disable-next-line no-console
    console.error(OPS_ALERT_PREFIX, {
      type: error.type,
      severity: config.logLevel,
      context: error.context
    });
  }
}