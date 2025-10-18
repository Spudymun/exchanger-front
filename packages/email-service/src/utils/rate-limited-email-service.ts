import { RATE_LIMITS, TIME_CONSTANTS } from '@repo/constants';
import { createRateLimitError, createEnvironmentLogger } from '@repo/utils';

import { EmailService } from '../services/email-service';
import type { CryptoAddressEmailData, EmailProviderConfig, EmailSendResult } from '../types/index';

/**
 * In-memory rate limiter specifically for email operations
 * Uses the same pattern as the tRPC middleware but for email service
 */
const emailRateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup interval for expired records (prevent memory leaks)
const CLEANUP_INTERVAL =
  TIME_CONSTANTS.MINUTES_IN_HOUR *
  TIME_CONSTANTS.MILLISECONDS_IN_SECOND *
  TIME_CONSTANTS.SECONDS_IN_MINUTE; // 60 minutes

// Periodic cleanup of expired records
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of emailRateLimitStore.entries()) {
    if (now > record.resetTime) {
      emailRateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Apply rate limiting for email operations
 */
async function applyEmailRateLimit(clientIdentifier: string): Promise<void> {
  const config = RATE_LIMITS.EMAIL_SEND;
  const key = `EMAIL_SEND:${clientIdentifier}`;
  const now = Date.now();

  // Get current state
  const current = emailRateLimitStore.get(key);

  // If no record exists or reset time has passed
  if (!current || now > current.resetTime) {
    emailRateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.duration * TIME_CONSTANTS.MILLISECONDS_IN_SECOND,
    });
    return;
  }

  // If limit exceeded
  if (current.count >= config.points) {
    throw createRateLimitError('Превышен лимит отправки email. Попробуйте позже.');
  }

  // Increment counter
  current.count++;
  emailRateLimitStore.set(key, current);
}

/**
 * Rate-limited Email Service wrapper
 * Applies rate limiting before calling the actual EmailService
 */
export class RateLimitedEmailService {
  private static logger = createEnvironmentLogger('RateLimitedEmailService');

  /**
   * Send crypto address email with rate limiting applied
   * @param data Email data for sending crypto address
   * @param config Email provider configuration
   * @param clientIdentifier Unique identifier for rate limiting (IP address, user ID, etc.)
   */
  static async sendCryptoAddress(
    data: CryptoAddressEmailData,
    clientIdentifier: string,
    config?: Partial<EmailProviderConfig>
  ): Promise<EmailSendResult> {
    try {
      this.logger.info('Applying rate limit for email sending', {
        orderId: data.orderId,
        clientIdentifier,
        currency: data.currency,
      });

      // Apply rate limiting first
      await applyEmailRateLimit(clientIdentifier);

      this.logger.info('Rate limit passed, sending email', {
        orderId: data.orderId,
        clientIdentifier,
      });

      // If rate limit passes, call the actual email service
      return await EmailService.sendCryptoAddress(data, config);
    } catch (error) {
      this.logger.error('Rate-limited email service error', {
        orderId: data.orderId,
        clientIdentifier,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw the error (could be rate limit error or email service error)
      throw error;
    }
  }

  /**
   * Send auto-registration password email with rate limiting applied
   * For users who registered automatically during order creation
   * @param data Email data for sending auto-registration password
   * @param clientIdentifier Unique identifier for rate limiting (IP address, user ID, etc.)
   * @param config Email provider configuration
   */
  static async sendAutoRegistrationPassword(
    data: import('../types/index').AutoRegistrationPasswordEmailData,
    clientIdentifier: string,
    config?: Partial<EmailProviderConfig>
  ): Promise<EmailSendResult> {
    try {
      this.logger.info('Applying rate limit for auto-registration password email', {
        orderId: data.orderId,
        clientIdentifier,
      });

      // Apply rate limiting first
      await applyEmailRateLimit(clientIdentifier);

      this.logger.info('Rate limit passed, sending auto-registration password email', {
        orderId: data.orderId,
        clientIdentifier,
      });

      // If rate limit passes, call the actual email service
      return await EmailService.sendAutoRegistrationPassword(data, config);
    } catch (error) {
      this.logger.error('Rate-limited auto-registration password email service error', {
        orderId: data.orderId,
        clientIdentifier,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw the error
      throw error;
    }
  }
}
