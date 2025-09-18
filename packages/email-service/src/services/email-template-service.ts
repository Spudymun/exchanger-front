import fs from 'node:fs';
import path from 'node:path';

import {
  CURRENCY_FULL_NAMES,
  NETWORK_NAMES,
  COMPANY_INFO,
  TIMEZONE_CONSTANTS,
} from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

import type { CryptoAddressEmailData, EmailMessage } from '../types/index';

/**
 * Template service for generating email content
 */
export class EmailTemplateService {
  private static logger = createEnvironmentLogger('EmailTemplateService');
  private static templateCache = new Map<string, string>();

  /**
   * Load template from file with caching
   */
  private static loadTemplate(templateName: string, extension: 'html' | 'txt'): string {
    const cacheKey = `${templateName}.${extension}`;

    const cached = this.templateCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const templatePath = path.join(
        process.cwd(),
        'packages/email-service/src/templates',
        `${templateName}.${extension}`
      );
      const template = fs.readFileSync(templatePath, 'utf8');
      this.templateCache.set(cacheKey, template);
      return template;
    } catch (error) {
      this.logger.error('Failed to load email template', {
        templateName,
        extension,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(`Failed to load email template: ${templateName}.${extension}`);
    }
  }

  /**
   * Replace template variables with actual values
   */
  private static replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      // Use string replace for template variables (safer than regex)
      const placeholder = `{{${key}}}`;
      result = result.replaceAll(placeholder, value);
    }

    return result;
  }

  /**
   * Format date for email display
   */
  private static formatDate(date: Date): string {
    return date.toLocaleString(TIMEZONE_CONSTANTS.DEFAULT_LOCALE, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: TIMEZONE_CONSTANTS.DEFAULT_TIMEZONE,
    });
  }

  /**
   * Generate crypto address email content
   */
  static generateCryptoAddressEmail(data: CryptoAddressEmailData): EmailMessage {
    const variables = {
      orderId: data.orderId,
      cryptoAddress: data.cryptoAddress,
      currency: data.currency,
      currencyFullName: CURRENCY_FULL_NAMES[data.currency],
      networkName: NETWORK_NAMES[data.currency],
      amount: data.amount.toString(),
      expiresAt: this.formatDate(data.expiresAt),
      userEmail: data.userEmail,
      companyName: COMPANY_INFO.NAME, // ✅ Добавляем из констант
    };

    const htmlTemplate = this.loadTemplate('crypto-address', 'html');
    const textTemplate = this.loadTemplate('crypto-address', 'txt');

    const html = this.replaceVariables(htmlTemplate, variables);
    const text = this.replaceVariables(textTemplate, variables);

    this.logger.info('Generated crypto address email', {
      orderId: data.orderId,
      currency: data.currency,
      to: data.userEmail,
    });

    return {
      to: data.userEmail,
      subject: `💱 Заявка №${data.orderId} создана - отправьте ${data.amount} ${data.currency}`,
      html,
      text,
    };
  }

  /**
   * Clear template cache (useful for development)
   */
  static clearCache(): void {
    this.templateCache.clear();
  }
}
