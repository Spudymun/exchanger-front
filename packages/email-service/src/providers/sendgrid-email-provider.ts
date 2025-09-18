import { createEnvironmentLogger } from '@repo/utils';

import sgMail from '@sendgrid/mail';

import type { EmailMessage, EmailProviderInterface, EmailSendResult } from '../types/index';

/**
 * SendGrid Email Provider for production use
 */
export class SendGridEmailProvider implements EmailProviderInterface {
  private logger = createEnvironmentLogger('SendGridEmailProvider');

  constructor(
    apiKey: string,
    private fromEmail: string,
    private fromName: string
  ) {
    sgMail.setApiKey(apiKey);
    this.logger.info('SendGridEmailProvider initialized', {
      fromEmail: this.fromEmail,
      fromName: this.fromName,
    });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const msg = {
        to: message.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: message.subject,
        html: message.html,
        text: message.text,
      };

      const response = await sgMail.send(msg);

      this.logger.info('Email sent via SendGrid', {
        to: message.to,
        subject: message.subject,
        messageId: response[0]?.headers?.['x-message-id'],
      });

      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id'] as string,
      };
    } catch (error) {
      this.logger.error('SendGrid email send failed', {
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
