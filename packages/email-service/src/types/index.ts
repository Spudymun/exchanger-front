import type { CryptoCurrency, EmailProviderType } from '@repo/constants';

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
  provider: EmailProviderType;
  apiKey?: string;
  fromEmail: string;
  fromName: string;
}

/**
 * Base interface for crypto-related email template data
 */
export interface BaseCryptoEmailData {
  orderId: string;
  cryptoAddress: string;
  currency: CryptoCurrency;
  amount: number;
  expiresAt: Date;
  userEmail: string;
  tokenStandard?: string; // ✅ ДОБАВЛЕНО: поддержка multi-network токенов для правильного отображения сети
}

/**
 * Crypto address email template data
 * Type alias to base interface to eliminate duplication
 */
export type CryptoAddressEmailData = BaseCryptoEmailData;

/**
 * Wallet ready email template data (for orders from queue)
 * Type alias to base interface to eliminate duplication
 */
export type WalletReadyEmailData = BaseCryptoEmailData;

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
  | 'wallet-ready' // 🆕 НОВЫЙ для заявок из очереди
  | 'order-confirmation'
  | 'order-status-update';
