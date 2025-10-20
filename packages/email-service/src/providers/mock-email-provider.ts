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
    // Компактное логирование параметров письма
    this.logger.info('📧 Email сформирован (Mock Mode)', {
      from: `${this.fromName} <${this.fromEmail}>`,
      to: message.to,
      subject: message.subject,
      contentSize: `${message.html.length} chars`,
      note: '⚠️ Отправка возможна только с верифицированным доменом',
    });

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
