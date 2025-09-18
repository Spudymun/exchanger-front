import { createEnvironmentLogger } from '@repo/utils';

import type { EmailMessage, EmailProviderInterface, EmailSendResult } from '../types/index';

/**
 * Mock Email Provider for development and testing
 * Logs emails instead of sending them
 */
export class MockEmailProvider implements EmailProviderInterface {
  private logger = createEnvironmentLogger('MockEmailProvider');

  constructor(
    private fromEmail: string,
    private fromName: string
  ) {
    this.logger.info('MockEmailProvider initialized', {
      fromEmail: this.fromEmail,
      fromName: this.fromName,
    });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    this.logger.info('📧 Mock Email Sent', {
      to: message.to,
      subject: message.subject,
      from: `${this.fromName} <${this.fromEmail}>`,
      htmlLength: message.html.length,
      textLength: message.text?.length || 0,
    });

    // Log email content in development (console allowed for mock provider)
    // eslint-disable-next-line no-console
    console.log(`
===============================================
📧 MOCK EMAIL SENT
===============================================
To: ${message.to}
From: ${this.fromName} <${this.fromEmail}>
Subject: ${message.subject}

HTML Content:
${message.html}

Text Content:
${message.text || 'No text content'}
===============================================
    `);

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    const BASE_36 = 36;
    const ID_LENGTH = 9;

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(BASE_36).substr(2, ID_LENGTH)}`,
    };
  }
}
