// Server-only imports - защищены от client-side bundling через next.config.js
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CURRENCY_FULL_NAMES,
  NETWORK_NAMES,
  TOKEN_STANDARD_DETAILS,
  COMPANY_INFO,
  TIMEZONE_CONSTANTS,
} from '@repo/constants';
import { sanitizeHtmlContent } from '@repo/exchange-core';
import { createEnvironmentLogger } from '@repo/utils';

import type {
  CryptoAddressEmailData,
  EmailMessage,
  SystemAlertEmailData,
  WalletReadyEmailData,
  BaseCryptoEmailData,
} from '../types/index';

/**
 * Template service for generating email content
 */
export class EmailTemplateService {
  private static logger = createEnvironmentLogger('EmailTemplateService');
  private static templateCache = new Map<string, string>();

  /**
   * Load template from file with caching
   */
  private static async loadTemplate(
    templateName: string,
    extension: 'html' | 'txt'
  ): Promise<string> {
    const cacheKey = `${templateName}.${extension}`;

    const cached = this.templateCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const templatePath = path.join(__dirname, '../templates', `${templateName}.${extension}`);
      const template = await fs.readFile(templatePath, 'utf8');
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
   * Sanitizes all values to prevent XSS attacks
   */
  private static replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      // Sanitize value to prevent XSS attacks
      const sanitizedValue = sanitizeHtmlContent(value);
      // Use string replace for template variables (safer than regex)
      const placeholder = `{{${key}}}`;
      result = result.replaceAll(placeholder, sanitizedValue);
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
   * Generic template email generator to eliminate code duplication
   * Centralizes the common logic used by crypto-related email templates
   */
  private static async generateGenericTemplateEmail(
    templateName: string,
    subject: string,
    data: BaseCryptoEmailData
  ): Promise<EmailMessage> {
    const variables = {
      orderId: data.orderId,
      cryptoAddress: data.cryptoAddress,
      currency: data.currency,
      currencyFullName: CURRENCY_FULL_NAMES[data.currency],
      networkName: data.tokenStandard 
        ? `${TOKEN_STANDARD_DETAILS[data.tokenStandard as keyof typeof TOKEN_STANDARD_DETAILS]?.network} (${data.tokenStandard})`
        : NETWORK_NAMES[data.currency], // ✅ ИСПРАВЛЕНО: показываем сеть с токен стандартом для мульти-сетевых токенов
      amount: data.amount.toString(),
      expiresAt: this.formatDate(data.expiresAt),
      userEmail: data.userEmail,
      companyName: COMPANY_INFO.NAME,
    };

    const logContext = {
      orderId: data.orderId,
      currency: data.currency,
      to: data.userEmail,
    };

    // Reuse the universal template generator to eliminate duplication
    const { html, text } = await this.generateUniversalTemplateEmail(
      templateName,
      subject,
      variables,
      logContext
    );

    return {
      to: data.userEmail,
      subject,
      html,
      text,
    };
  }

  /**
   * Universal template generator for any email type - eliminates semantic duplication
   * Centralizes the loadTemplate → replaceVariables → return pattern
   */
  private static async generateUniversalTemplateEmail(
    templateName: string,
    subject: string,
    variables: Record<string, string>,
    logContext: Record<string, string | number> = {}
  ): Promise<{ html: string; text: string; subject: string }> {
    const htmlTemplate = await this.loadTemplate(templateName, 'html');
    const textTemplate = await this.loadTemplate(templateName, 'txt');

    const html = this.replaceVariables(htmlTemplate, variables);
    const text = this.replaceVariables(textTemplate, variables);

    this.logger.info(`Generated ${templateName} email`, logContext);

    return { html, text, subject };
  }

  /**
   * Generate crypto address email content
   */
  static async generateCryptoAddressEmail(data: CryptoAddressEmailData): Promise<EmailMessage> {
    const subject = `💱 Заявка №${data.orderId} создана - отправьте ${data.amount} ${data.currency}`;
    return this.generateGenericTemplateEmail('crypto-address', subject, data);
  }

  /**
   * Generate system alert email content
   */
  static async generateSystemAlertEmail(data: SystemAlertEmailData): Promise<EmailMessage[]> {
    const variables = {
      alertType: data.alertType,
      alertLevel: data.alertLevel,
      alertCount: data.alertCount.toString(),
      alertDetails: data.alertDetails,
      timestamp: this.formatDate(data.timestamp),
      companyName: COMPANY_INFO.NAME,
    };

    const subject = `🚨 ${data.alertLevel} Alert: ${data.alertType} - ${COMPANY_INFO.NAME}`;

    const logContext = {
      alertType: data.alertType,
      alertLevel: data.alertLevel,
      recipientCount: data.recipients.length.toString(),
    };

    // Используем централизованный механизм генерации
    const { html, text } = await this.generateUniversalTemplateEmail(
      'system-alert',
      subject,
      variables,
      logContext
    );

    // Создаем отдельное сообщение для каждого получателя
    return data.recipients.map(recipient => ({
      to: recipient,
      subject,
      html,
      text,
    }));
  }

  /**
   * Generate wallet ready email content (for orders from queue)
   */
  static async generateWalletReadyEmail(data: WalletReadyEmailData): Promise<EmailMessage> {
    const subject = `🎉 Адрес готов для заявки №${data.orderId} - отправьте ${data.amount} ${data.currency}`;
    return this.generateGenericTemplateEmail('wallet-ready', subject, data);
  }

  /**
   * Generate password reset email content
   */
  static async generatePasswordResetEmail(
    data: import('../types/index').PasswordResetEmailData
  ): Promise<EmailMessage> {
    const subject = `🔐 Восстановление пароля - ${COMPANY_INFO.NAME}`;

    const variables = {
      companyName: COMPANY_INFO.NAME,
      token: data.token,
      expiresAt: this.formatDate(data.expiresAt),
    };

    const logContext = {
      tokenLength: data.token.length.toString(),
      expiresAt: data.expiresAt.toISOString(),
    };

    const { html, text } = await this.generateUniversalTemplateEmail(
      'password-reset',
      subject,
      variables,
      logContext
    );

    return {
      to: data.userEmail,
      subject,
      html,
      text,
    };
  }

  /**
   * Generate auto-registration password email content
   * For users who registered automatically during order creation
   */
  static async generateAutoRegistrationPasswordEmail(
    data: import('../types/index').AutoRegistrationPasswordEmailData
  ): Promise<EmailMessage> {
    const subject = `🎉 Ваш пароль для личного кабинета - ${COMPANY_INFO.NAME}`;

    const variables = {
      companyName: COMPANY_INFO.NAME,
      userEmail: data.userEmail,
      generatedPassword: data.generatedPassword,
      orderId: data.orderId,
    };

    const logContext = {
      orderId: data.orderId,
      userEmail: data.userEmail,
    };

    const { html, text } = await this.generateUniversalTemplateEmail(
      'auto-registration-password',
      subject,
      variables,
      logContext
    );

    return {
      to: data.userEmail,
      subject,
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
