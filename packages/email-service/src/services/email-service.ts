import { EMAIL_PROVIDER_TYPES } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

import { EmailServiceFactory } from '../factories/email-service-factory';
import type {
  CryptoAddressEmailData,
  WalletReadyEmailData,
  EmailMessage,
  EmailProviderConfig,
  EmailProviderInterface,
  EmailSendResult,
  SystemAlertEmailData,
} from '../types/index';

import { EmailMonitoringService } from './email-monitoring-service';
import { EmailTemplateService } from './email-template-service';

/**
 * Main Email Service for sending crypto address emails
 */
export class EmailService {
  private static logger = createEnvironmentLogger('EmailService');
  private static readonly UNKNOWN_ERROR = 'Unknown error';
  private static readonly EMAIL_SERVICE_ERROR = 'Email service error';

  /**
   * ✅ НОВОЕ: Вспомогательный метод для записи результата email в мониторинг
   */
  private static recordEmailResultForMonitoring(
    config: Partial<EmailProviderConfig> | undefined,
    result: EmailSendResult,
    errorMessage?: string
  ): void {
    const providerType = config?.provider || EMAIL_PROVIDER_TYPES.MOCK;
    EmailMonitoringService.recordEmailResult(providerType, result, errorMessage);
  }

  /**
   * ✅ НОВОЕ: Вспомогательный метод для записи ошибки email в мониторинг
   */
  private static recordEmailErrorForMonitoring(
    config: Partial<EmailProviderConfig> | undefined,
    errorMessage: string
  ): void {
    const providerType = config?.provider || EMAIL_PROVIDER_TYPES.MOCK;
    EmailMonitoringService.recordEmailResult(
      providerType,
      { success: false, error: errorMessage },
      errorMessage
    );
  }

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
      const provider = config ? EmailServiceFactory.create(config) : EmailServiceFactory.createFromEnvironment();
      const result = await provider.send(emailMessage);

      // ✅ НОВОЕ: Записать результат для мониторинга
      this.recordEmailResultForMonitoring(config, result, result.error);

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
      const errorMessage = error instanceof Error ? error.message : this.UNKNOWN_ERROR;

      // ✅ НОВОЕ: Записать ошибку для мониторинга
      this.recordEmailErrorForMonitoring(config, errorMessage);

      this.logger.error(this.EMAIL_SERVICE_ERROR, {
        orderId: data.orderId,
        to: data.userEmail,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send wallet ready email to user (for orders from queue)
   */
  static async sendWalletReady(
    data: WalletReadyEmailData,
    config?: Partial<EmailProviderConfig>
  ): Promise<EmailSendResult> {
    try {
      this.logger.info('Sending wallet ready email', {
        orderId: data.orderId,
        currency: data.currency,
        to: data.userEmail,
      });

      // Generate email content from template
      const emailMessage = await EmailTemplateService.generateWalletReadyEmail(data);

      // Get email provider and send
      const provider = EmailServiceFactory.create(config);
      const result = await provider.send(emailMessage);

      // ✅ НОВОЕ: Записать результат для мониторинга
      this.recordEmailResultForMonitoring(config, result);

      if (result.success) {
        this.logger.info('Wallet ready email sent successfully', {
          orderId: data.orderId,
          to: data.userEmail,
          messageId: result.messageId,
        });
      } else {
        this.logger.error('Failed to send wallet ready email', {
          orderId: data.orderId,
          to: data.userEmail,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : this.UNKNOWN_ERROR;

      // ✅ НОВОЕ: Записать ошибку для мониторинга
      this.recordEmailErrorForMonitoring(config, errorMessage);

      this.logger.error(this.EMAIL_SERVICE_ERROR, {
        orderId: data.orderId,
        to: data.userEmail,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send password reset email to user
   */
  static async sendPasswordReset(
    data: import('../types/index').PasswordResetEmailData,
    config?: Partial<EmailProviderConfig>
  ): Promise<EmailSendResult> {
    try {
      this.logger.info('Sending password reset email', {
        to: data.userEmail,
      });

      // Generate email content from template
      const emailMessage = await EmailTemplateService.generatePasswordResetEmail(data);

      // Get email provider and send
      const provider = config ? EmailServiceFactory.create(config) : EmailServiceFactory.createFromEnvironment();
      const result = await provider.send(emailMessage);

      // ✅ НОВОЕ: Записать результат для мониторинга
      this.recordEmailResultForMonitoring(config, result, result.error);

      if (result.success) {
        this.logger.info('Password reset email sent successfully', {
          to: data.userEmail,
          messageId: result.messageId,
        });
      } else {
        this.logger.error('Failed to send password reset email', {
          to: data.userEmail,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : this.UNKNOWN_ERROR;

      // ✅ НОВОЕ: Записать ошибку для мониторинга
      this.recordEmailErrorForMonitoring(config, errorMessage);

      this.logger.error(this.EMAIL_SERVICE_ERROR, {
        to: data.userEmail,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send system alert emails to administrators
   */
  static async sendSystemAlert(
    data: SystemAlertEmailData,
    config?: Partial<EmailProviderConfig>
  ): Promise<EmailSendResult[]> {
    try {
      this.logger.info('Sending system alert emails', {
        alertType: data.alertType,
        alertLevel: data.alertLevel,
        recipientCount: data.recipients.length,
      });

      // Generate email messages for all recipients
      const emailMessages = await EmailTemplateService.generateSystemAlertEmail(data);

      // Get email provider and send to all recipients
      const provider = EmailServiceFactory.create(config);
      return await this.sendToAllRecipients(emailMessages, provider, data, config);
    } catch (error) {
      this.logger.error('System alert service error', {
        alertType: data.alertType,
        error: error instanceof Error ? error.message : this.UNKNOWN_ERROR,
      });

      // Return failed result for all recipients
      return data.recipients.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : this.UNKNOWN_ERROR,
      }));
    }
  }

  /**
   * Send emails to all recipients
   */
  private static async sendToAllRecipients(
    emailMessages: EmailMessage[],
    provider: EmailProviderInterface,
    data: SystemAlertEmailData,
    config?: Partial<EmailProviderConfig>
  ): Promise<EmailSendResult[]> {
    return await Promise.all(
      emailMessages.map(async message => {
        try {
          const result = await provider.send(message);

          // ✅ НОВОЕ: Записать результат для мониторинга
          this.recordEmailResultForMonitoring(config, result);

          if (result.success) {
            this.logger.info('System alert email sent successfully', {
              alertType: data.alertType,
              to: message.to,
              messageId: result.messageId,
            });
          } else {
            this.logger.error('Failed to send system alert email', {
              alertType: data.alertType,
              to: message.to,
              error: result.error,
            });
          }

          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : this.UNKNOWN_ERROR;

          // ✅ НОВОЕ: Записать ошибку для мониторинга
          this.recordEmailErrorForMonitoring(config, errorMessage);

          this.logger.error('System alert email error', {
            alertType: data.alertType,
            to: message.to,
            error: errorMessage,
          });

          return {
            success: false,
            error: errorMessage,
          };
        }
      })
    );
  }
}
