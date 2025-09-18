import { createEnvironmentLogger } from '@repo/utils';

import { EmailServiceFactory } from '../factories/email-service-factory';
import type { CryptoAddressEmailData, EmailProviderConfig, EmailSendResult } from '../types/index';

import { EmailTemplateService } from './email-template-service';

/**
 * Main Email Service for sending crypto address emails
 */
export class EmailService {
  private static logger = createEnvironmentLogger('EmailService');

  /**
   * Send crypto address email to user
   */
  static async sendCryptoAddress(
    data: CryptoAddressEmailData,
    config?: Partial<EmailProviderConfig>
  ): Promise<EmailSendResult> {
    try {
      this.logger.info('Sending crypto address email', {
        orderId: data.orderId,
        currency: data.currency,
        to: data.userEmail,
      });

      // Generate email content from template
      const emailMessage = await EmailTemplateService.generateCryptoAddressEmail(data);

      // Get email provider and send
      const provider = EmailServiceFactory.create(config);
      const result = await provider.send(emailMessage);

      if (result.success) {
        this.logger.info('Crypto address email sent successfully', {
          orderId: data.orderId,
          to: data.userEmail,
          messageId: result.messageId,
        });
      } else {
        this.logger.error('Failed to send crypto address email', {
          orderId: data.orderId,
          to: data.userEmail,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Email service error', {
        orderId: data.orderId,
        to: data.userEmail,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
