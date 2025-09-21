import {
  GMAIL_SMTP_DEFAULTS,
  GMAIL_DOMAIN,
  EMAIL_ERROR_CATEGORIES,
  EMAIL_ERROR_MESSAGES,
  EMAIL_ERROR_RETRY_CONFIG,
  REQUEST_TIMEOUT_CONSTANTS,
  UI_NUMERIC_CONSTANTS,
} from '@repo/constants';

import {
  createEnvironmentLogger,
  emailSchema,
  validateWithZodSchema,
  isEmptyString,
} from '@repo/utils';

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import type { EmailMessage, EmailProviderInterface, EmailSendResult } from '../types/index';

/**
 * Gmail SMTP Email Provider using Nodemailer
 *
 * @description Free Gmail SMTP service for email sending with app passwords
 * @requires Gmail account with 2FA enabled and App Password generated
 * @see https://support.google.com/mail/answer/7126229
 */
export class GmailSmtpEmailProvider implements EmailProviderInterface {
  private logger = createEnvironmentLogger('GmailSmtpEmailProvider');
  private transporter: Transporter;

  constructor(
    private appPassword: string,
    private gmailEmail: string,
    private fromName: string
  ) {
    // Валидация входных параметров с использованием существующих утилит
    this.validateConstructorParams(appPassword, gmailEmail, fromName);

    // Создаем SMTP транспортер с Gmail конфигурацией
    this.transporter = nodemailer.createTransport({
      host: GMAIL_SMTP_DEFAULTS.HOST,
      port: GMAIL_SMTP_DEFAULTS.PORT,
      secure: GMAIL_SMTP_DEFAULTS.SECURE,
      auth: {
        user: this.gmailEmail,
        pass: this.appPassword,
      },
      tls: {
        rejectUnauthorized: true,
      },
      connectionTimeout: REQUEST_TIMEOUT_CONSTANTS.DEFAULT_API_TIMEOUT,
      greetingTimeout: REQUEST_TIMEOUT_CONSTANTS.DEFAULT_API_TIMEOUT,
      socketTimeout: REQUEST_TIMEOUT_CONSTANTS.DEFAULT_API_TIMEOUT,
    });

    this.logger.info('GmailSmtpEmailProvider initialized', {
      gmailEmail: this.gmailEmail,
      fromName: this.fromName,
      host: GMAIL_SMTP_DEFAULTS.HOST,
      port: GMAIL_SMTP_DEFAULTS.PORT,
    });
  }

  /**
   * Валидация входных параметров конструктора
   */
  private validateConstructorParams(
    appPassword: string,
    gmailEmail: string,
    fromName: string
  ): void {
    if (isEmptyString(appPassword)) {
      throw new Error(EMAIL_ERROR_MESSAGES.APP_PASSWORD_REQUIRED);
    }

    if (isEmptyString(gmailEmail)) {
      throw new Error(EMAIL_ERROR_MESSAGES.GMAIL_ADDRESS_REQUIRED);
    }

    if (isEmptyString(fromName)) {
      throw new Error(EMAIL_ERROR_MESSAGES.FROM_NAME_REQUIRED);
    }

    // Валидация email через существующую схему
    const emailValidation = validateWithZodSchema(emailSchema, gmailEmail);
    if (!emailValidation.isValid) {
      throw new Error(EMAIL_ERROR_MESSAGES.GMAIL_ADDRESS_REQUIRED);
    }

    // Проверка Gmail домена
    if (!gmailEmail.toLowerCase().endsWith(GMAIL_DOMAIN)) {
      throw new Error(EMAIL_ERROR_MESSAGES.GMAIL_DOMAIN_REQUIRED);
    }
  }

  /**
   * Категоризация ошибок SMTP
   */
  private categorizeSmtpError(error: Error): { category: string; isRetryable: boolean } {
    const errorMessage = error.message.toLowerCase();
    const errorCode = 'code' in error ? String(error.code) : '';

    const category = this.determineErrorCategory(errorMessage, errorCode);
    const isRetryable = EMAIL_ERROR_RETRY_CONFIG[category as keyof typeof EMAIL_ERROR_RETRY_CONFIG];

    return { category, isRetryable };
  }

  /**
   * Определяет категорию ошибки на основе сообщения и кода
   */
  private determineErrorCategory(errorMessage: string, errorCode: string): string {
    if (this.isAuthenticationError(errorMessage, errorCode)) {
      return EMAIL_ERROR_CATEGORIES.AUTHENTICATION_ERROR;
    }

    if (this.isConnectionError(errorMessage, errorCode)) {
      return EMAIL_ERROR_CATEGORIES.CONNECTION_ERROR;
    }

    if (this.isRateLimitError(errorMessage, errorCode)) {
      return EMAIL_ERROR_CATEGORIES.RATE_LIMIT_ERROR;
    }

    if (this.isEmailValidationError(errorMessage)) {
      return EMAIL_ERROR_CATEGORIES.EMAIL_VALIDATION_ERROR;
    }

    return EMAIL_ERROR_CATEGORIES.UNKNOWN_ERROR;
  }

  /**
   * Проверяет является ли ошибка аутентификационной
   */
  private isAuthenticationError(errorMessage: string, errorCode: string): boolean {
    return (
      errorMessage.includes('authentication') ||
      errorMessage.includes('invalid credentials') ||
      errorCode === 'EAUTH'
    );
  }

  /**
   * Проверяет является ли ошибка подключения
   */
  private isConnectionError(errorMessage: string, errorCode: string): boolean {
    return (
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorCode === 'ETIMEDOUT' ||
      errorCode === 'ECONNRESET'
    );
  }

  /**
   * Проверяет является ли ошибка превышения лимитов
   */
  private isRateLimitError(errorMessage: string, errorCode: string): boolean {
    return (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('quota exceeded') ||
      errorCode === '550'
    );
  }

  /**
   * Проверяет является ли ошибка валидации email
   */
  private isEmailValidationError(errorMessage: string): boolean {
    return errorMessage.includes('invalid') && errorMessage.includes('email');
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      // Проверяем подключение к SMTP серверу перед отправкой
      await this.transporter.verify();

      const mailOptions = {
        from: `${this.fromName} <${this.gmailEmail}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.info('Email sent via Gmail SMTP', {
        to: message.to,
        subject: message.subject,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorInstance =
        error instanceof Error ? error : new Error(UI_NUMERIC_CONSTANTS.DEFAULT_ERROR_MESSAGE);
      const { category, isRetryable } = this.categorizeSmtpError(errorInstance);

      this.logger.error('Gmail SMTP email send failed', {
        to: message.to,
        subject: message.subject,
        error: errorInstance.message,
        errorCode: 'code' in errorInstance ? String(errorInstance.code) : undefined,
        errorCategory: category,
        isRetryable,
      });

      return {
        success: false,
        error: `${category}: ${errorInstance.message}`,
      };
    }
  }

  /**
   * Проверка подключения к Gmail SMTP
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.info(EMAIL_ERROR_MESSAGES.CONNECTION_TEST_SUCCESS);
      return true;
    } catch (error) {
      this.logger.error(EMAIL_ERROR_MESSAGES.CONNECTION_TEST_FAILED, {
        error: error instanceof Error ? error.message : UI_NUMERIC_CONSTANTS.DEFAULT_ERROR_MESSAGE,
      });
      return false;
    }
  }

  /**
   * Закрытие транспортера
   */
  async close(): Promise<void> {
    this.transporter.close();
    this.logger.info(EMAIL_ERROR_MESSAGES.TRANSPORTER_CLOSED);
  }
}
