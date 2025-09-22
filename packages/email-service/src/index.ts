// Main service export
export { EmailService } from './services/email-service';

// Rate-limited service export
export { RateLimitedEmailService } from './utils/rate-limited-email-service';

// Factory export
export { EmailServiceFactory } from './factories/email-service-factory';

// Template service export
export { EmailTemplateService } from './services/email-template-service';

// Provider exports
export { MockEmailProvider } from './providers/mock-email-provider';
export { SendGridEmailProvider } from './providers/sendgrid-email-provider';
export { ResendEmailProvider } from './providers/resend-email-provider';
export { GmailSmtpEmailProvider } from './providers/gmail-smtp-email-provider';

// Type exports
export type {
  EmailMessage,
  EmailProviderInterface,
  EmailSendResult,
  EmailProviderConfig,
  BaseCryptoEmailData, // 🆕 НОВЫЙ базовый тип
  CryptoAddressEmailData,
  WalletReadyEmailData,
  SystemAlertEmailData,
  EmailEnvironment,
  EmailTemplateType,
} from './types/index';
