import type { CryptoCurrency } from '@repo/constants';

/**
 * Base email message interface
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email provider interface for abstraction
 */
export interface EmailProviderInterface {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

/**
 * Result of email send operation
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Configuration for different email providers
 */
export interface EmailProviderConfig {
  provider: 'sendgrid' | 'resend' | 'mock';
  apiKey?: string;
  fromEmail: string;
  fromName: string;
}

/**
 * Crypto address email template data
 */
export interface CryptoAddressEmailData {
  orderId: string;
  cryptoAddress: string;
  currency: CryptoCurrency;
  amount: number;
  expiresAt: Date;
  userEmail: string;
}

/**
 * System alert email template data
 */
export interface SystemAlertEmailData {
  alertType: 'WALLET_THRESHOLD' | 'SYSTEM_ERROR' | 'MAINTENANCE';
  alertLevel: 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  alertCount: number;
  alertDetails: string;
  timestamp: Date;
  recipients: string[];
}

/**
 * Environment types for email service
 */
export type EmailEnvironment = 'development' | 'production' | 'test';

/**
 * Email template types
 */
export type EmailTemplateType =
  | 'crypto-address'
  | 'system-alert'
  | 'order-confirmation'
  | 'order-status-update';
