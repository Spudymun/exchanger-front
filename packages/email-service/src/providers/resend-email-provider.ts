import { createEnvironmentLogger } from '@repo/utils';

import { Resend } from 'resend';

import type { EmailMessage, EmailProviderInterface, EmailSendResult } from '../types/index';

/**
 * Resend Email Provider as alternative to SendGrid
 */
export class ResendEmailProvider implements EmailProviderInterface {
  private logger = createEnvironmentLogger('ResendEmailProvider');
  private resend: Resend;

  constructor(
    apiKey: string,
    private fromEmail: string,
    private fromName: string
  ) {
    this.resend = new Resend(apiKey);
    this.logger.info('ResendEmailProvider initialized', {
      fromEmail: this.fromEmail,
      fromName: this.fromName,
    });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const response = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      if (response.error) {
        this.logger.error('Resend email send failed', {
          to: message.to,
          subject: message.subject,
          error: response.error.message,
        });

        return {
          success: false,
          error: response.error.message,
        };
      }

      this.logger.info('Email sent via Resend', {
        to: message.to,
        subject: message.subject,
        messageId: response.data?.id,
      });

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error) {
      this.logger.error('Resend email send failed', {
        to: message.to,
        subject: message.subject,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
