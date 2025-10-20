import { CONTACT_INFO, COMPANY_INFO } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

import { GmailSmtpEmailProvider } from '../providers/gmail-smtp-email-provider';
import { MockEmailProvider } from '../providers/mock-email-provider';
import { ResendEmailProvider } from '../providers/resend-email-provider';
import { SendGridEmailProvider } from '../providers/sendgrid-email-provider';
import type { EmailEnvironment, EmailProviderConfig, EmailProviderInterface } from '../types/index';

/**
 * Environment detection utility
 */
function getEmailEnvironment(): EmailEnvironment {
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv === 'test') return 'test';
  if (nodeEnv === 'production') return 'production';

  return 'development';
}

/**
 * Email Service Factory for creating email providers based on environment
 */
export class EmailServiceFactory {
  private static cachedProvider: EmailProviderInterface | null = null;
  private static cachedConfig: string | null = null;
  private static logger = createEnvironmentLogger('EmailServiceFactory');

  /**
   * Create default configuration
   */
  private static createDefaultConfig(): EmailProviderConfig {
    const environment = getEmailEnvironment();

    return {
      provider: environment === 'production' ? 'sendgrid' : 'mock',
      fromEmail: CONTACT_INFO.SUPPORT_EMAIL, // ✅ Из констант
      fromName: COMPANY_INFO.NAME, // ✅ Из констант
      apiKey: undefined, // Should be provided via config parameter
    };
  }

  /**
   * Create email provider instance based on config
   */
  private static createProvider(config: EmailProviderConfig): EmailProviderInterface {
    switch (config.provider) {
      case 'sendgrid': {
        if (!config.apiKey) {
          this.logger.warn('SendGrid API key not provided, falling back to mock provider');
          return new MockEmailProvider(config.fromEmail, config.fromName);
        }
        return new SendGridEmailProvider(config.apiKey, config.fromEmail, config.fromName);
      }
      case 'resend': {
        if (!config.apiKey) {
          this.logger.warn('Resend API key not provided, falling back to mock provider');
          return new MockEmailProvider(config.fromEmail, config.fromName);
        }
        return new ResendEmailProvider(config.apiKey, config.fromEmail, config.fromName);
      }
      case 'gmail': {
        if (!config.apiKey) {
          this.logger.warn('Gmail app password not provided, falling back to mock provider');
          return new MockEmailProvider(config.fromEmail, config.fromName);
        }
        return new GmailSmtpEmailProvider(config.apiKey, config.fromEmail, config.fromName);
      }
      case 'mock':
      default: {
        return new MockEmailProvider(config.fromEmail, config.fromName);
      }
    }
  }

  /**
   * Create email provider automatically based on environment variables
   * Tries providers in order: Resend → SendGrid → Gmail SMTP → Mock
   */
  static createFromEnvironment(): EmailProviderInterface {
    const logger = createEnvironmentLogger('EmailServiceFactory.createFromEnvironment');

    // ✅ НОВОЕ: Принудительный Mock режим для тестирования в production
    if (process.env.FORCE_MOCK_EMAIL === 'true') {
      logger.info('🧪 FORCE_MOCK_EMAIL enabled - using Mock provider in production', {
        note: 'Emails will be logged but not sent. Requires verified domain for real sending.',
      });
      return this.createMock();
    }

    // Try Resend first (modern service, configured for this project)
    if (process.env.RESEND_API_KEY) {
      logger.debug('Creating Resend provider from environment');
      return this.create({ provider: 'resend', apiKey: process.env.RESEND_API_KEY });
    }

    // Try SendGrid (premium service)
    if (process.env.SENDGRID_API_KEY) {
      logger.debug('Creating SendGrid provider from environment');
      return this.create({ provider: 'sendgrid', apiKey: process.env.SENDGRID_API_KEY });
    }

    // Try Gmail SMTP (free service)
    if (process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_PASS) {
      logger.debug('Creating Gmail SMTP provider from environment');
      return this.create({
        provider: 'gmail',
        apiKey: process.env.GMAIL_SMTP_PASS,
        fromEmail: process.env.GMAIL_SMTP_USER,
        fromName: process.env.SMTP_FROM || process.env.GMAIL_SMTP_USER,
      });
    }

    // Fallback to mock provider
    logger.debug('No email providers configured, using mock provider', {
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
      sendgridConfigured: Boolean(process.env.SENDGRID_API_KEY),
      gmailConfigured: Boolean(process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_PASS),
    });

    return this.createMock();
  }

  /**
   * Create email provider based on configuration
   */
  static create(config?: Partial<EmailProviderConfig>): EmailProviderInterface {
    const environment = getEmailEnvironment();
    const defaultConfig = this.createDefaultConfig();
    const finalConfig = { ...defaultConfig, ...config };

    // Use cached provider if config matches
    const configKey = JSON.stringify(finalConfig);
    if (this.cachedProvider && this.cachedConfig === configKey) {
      return this.cachedProvider;
    }

    this.logger.info('Creating email provider', {
      provider: finalConfig.provider,
      environment,
      fromEmail: finalConfig.fromEmail,
    });

    const provider = this.createProvider(finalConfig);

    // Cache the provider
    this.cachedProvider = provider;
    this.cachedConfig = configKey;

    return provider;
  }

  /**
   * Create mock provider for testing
   */
  static createMock(
    fromEmail = CONTACT_INFO.SUPPORT_EMAIL,
    fromName = COMPANY_INFO.NAME
  ): EmailProviderInterface {
    return new MockEmailProvider(fromEmail, fromName);
  }

  /**
   * Clear cached provider (useful for testing)
   */
  static clearCache(): void {
    this.cachedProvider = null;
    this.cachedConfig = null;
  }
}
