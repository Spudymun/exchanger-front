# Phase 2: Business Logic Layer - Detailed Implementation

> **Файл**: Part of PASSWORD_RECOVERY_IMPLEMENTATION_PLAN.md  
> **Фаза**: Business Logic Layer  
> **Время**: ~2 часа  
> **Статус**: 100% VERIFIED patterns

---

## 📦 Phase 2: Business Logic Layer

### Цель

Создать сервисный слой для управления токенами восстановления пароля и email уведомлениями, используя проверенные паттерны Service Layer.

### Dependencies

- ✅ Phase 1 завершена (таблица `password_reset_tokens` создана)
- ✅ Prisma Client сгенерирован
- ✅ EmailService существует в `packages/email-service/`

---

## 2.1. PasswordResetTokenService

### Файл: `packages/session-management/src/services/password-reset-token-service.ts` (НОВЫЙ)

**ШАГ 2.1.1**: Создать новый файл с полной реализацией

````typescript
import { AUTH_CONSTANTS } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

import { getPrismaClient } from '../database/prisma-client';
import type { PrismaClientConfig } from '../types/prisma-types';

/**
 * ✅ Service для управления токенами восстановления пароля
 *
 * Паттерн: Service Layer (аналогично EmailService)
 * - Static methods для stateless операций
 * - createEnvironmentLogger для логирования
 * - Использует getPrismaClient для database access
 *
 * @example
 * ```typescript
 * const token = await PasswordResetTokenService.createToken('user@example.com');
 * const isValid = await PasswordResetTokenService.verifyToken('ABC123');
 * await PasswordResetTokenService.deleteToken('ABC123');
 * ```
 */
export class PasswordResetTokenService {
  private static logger = createEnvironmentLogger('PasswordResetTokenService');

  // Константы из AUTH_CONSTANTS
  private static readonly TOKEN_LENGTH = 6;
  private static readonly TOKEN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  private static readonly TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * ✅ Генерация уникального 6-значного кода
   * Формат: ABC123 (uppercase letters + digits)
   *
   * Collision probability: ~1 in 2.2 billion
   * Retry logic: 3 attempts to generate unique token
   */
  private static generateToken(): string {
    let token = '';
    for (let i = 0; i < this.TOKEN_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * this.TOKEN_CHARS.length);
      token += this.TOKEN_CHARS[randomIndex];
    }
    return token;
  }

  /**
   * ✅ Создать токен восстановления для пользователя
   *
   * @param email - Email пользователя
   * @param prismaConfig - Конфигурация PrismaClient (optional)
   * @returns Сгенерированный токен или null если пользователь не найден
   *
   * Security:
   * - Не раскрывает информацию о существовании пользователя (возвращает null)
   * - Удаляет старые неиспользованные токены перед созданием нового
   * - TTL: 15 минут
   */
  static async createToken(
    email: string,
    prismaConfig?: PrismaClientConfig
  ): Promise<string | null> {
    try {
      const prisma = getPrismaClient(prismaConfig);

      // Найти пользователя по email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) {
        // Не раскрываем информацию о существовании пользователя
        this.logger.info('Password reset requested for non-existent email', {
          email,
        });
        return null;
      }

      // Удалить все старые неиспользованные токены для этого пользователя
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          used: false,
        },
      });

      // Генерация уникального токена с retry logic
      let token: string;
      let attempt = 0;
      let created = false;

      while (!created && attempt < this.MAX_RETRY_ATTEMPTS) {
        token = this.generateToken();
        attempt++;

        try {
          await prisma.passwordResetToken.create({
            data: {
              userId: user.id,
              token,
              expiresAt: new Date(Date.now() + this.TOKEN_TTL_MS),
            },
          });

          created = true;
          this.logger.info('Password reset token created', {
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + this.TOKEN_TTL_MS).toISOString(),
          });

          return token;
        } catch (error) {
          // Unique constraint violation - retry with new token
          if (attempt >= this.MAX_RETRY_ATTEMPTS) {
            throw new Error('Failed to generate unique token after max retries');
          }
          this.logger.debug('Token collision detected, retrying', {
            attempt,
            token,
          });
        }
      }

      throw new Error('Failed to create token');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error creating password reset token', {
        email,
        error: errorMessage,
      });
      throw new Error(`Failed to create password reset token: ${errorMessage}`);
    }
  }

  /**
   * ✅ Верификация токена восстановления
   *
   * @param token - 6-значный код из email
   * @returns userId если токен валиден, null если невалиден
   *
   * Проверки:
   * - Токен существует
   * - Не истек срок действия (expiresAt > now)
   * - Не был использован (used = false)
   */
  static async verifyToken(
    token: string,
    prismaConfig?: PrismaClientConfig
  ): Promise<string | null> {
    try {
      const prisma = getPrismaClient(prismaConfig);

      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          used: true,
        },
      });

      if (!resetToken) {
        this.logger.debug('Token not found', { token });
        return null;
      }

      if (resetToken.used) {
        this.logger.debug('Token already used', { token });
        return null;
      }

      if (resetToken.expiresAt < new Date()) {
        this.logger.debug('Token expired', {
          token,
          expiresAt: resetToken.expiresAt.toISOString(),
        });
        return null;
      }

      this.logger.info('Token verified successfully', {
        token,
        userId: resetToken.userId,
      });

      return resetToken.userId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error verifying token', {
        token,
        error: errorMessage,
      });
      return null;
    }
  }

  /**
   * ✅ Пометить токен как использованный
   *
   * @param token - 6-значный код
   * @returns true если успешно помечен, false если токен не найден
   *
   * Security: Предотвращает повторное использование токена
   */
  static async markTokenAsUsed(token: string, prismaConfig?: PrismaClientConfig): Promise<boolean> {
    try {
      const prisma = getPrismaClient(prismaConfig);

      const result = await prisma.passwordResetToken.updateMany({
        where: {
          token,
          used: false, // Update only if not already used
        },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });

      if (result.count === 0) {
        this.logger.debug('Token not found or already used', { token });
        return false;
      }

      this.logger.info('Token marked as used', { token });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error marking token as used', {
        token,
        error: errorMessage,
      });
      return false;
    }
  }

  /**
   * ✅ Удалить токен (после успешного использования)
   *
   * @param token - 6-значный код
   * @returns true если удален, false если не найден
   */
  static async deleteToken(token: string, prismaConfig?: PrismaClientConfig): Promise<boolean> {
    try {
      const prisma = getPrismaClient(prismaConfig);

      const result = await prisma.passwordResetToken.deleteMany({
        where: { token },
      });

      if (result.count === 0) {
        this.logger.debug('Token not found for deletion', { token });
        return false;
      }

      this.logger.info('Token deleted', { token });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error deleting token', {
        token,
        error: errorMessage,
      });
      return false;
    }
  }

  /**
   * ✅ Cleanup expired и использованных токенов (cron job)
   *
   * Рекомендация: Запускать каждые 1 час через cron или background job
   *
   * @returns Количество удаленных токенов
   */
  static async cleanupExpiredTokens(prismaConfig?: PrismaClientConfig): Promise<number> {
    try {
      const prisma = getPrismaClient(prismaConfig);

      const result = await prisma.passwordResetToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } }, // Expired
            {
              used: true,
              usedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Used > 24h ago
            },
          ],
        },
      });

      this.logger.info('Expired tokens cleaned up', {
        deletedCount: result.count,
      });

      return result.count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error cleaning up expired tokens', {
        error: errorMessage,
      });
      return 0;
    }
  }

  /**
   * ✅ Получить статистику по токенам (для мониторинга)
   */
  static async getTokenStats(prismaConfig?: PrismaClientConfig): Promise<{
    total: number;
    active: number;
    expired: number;
    used: number;
  }> {
    try {
      const prisma = getPrismaClient(prismaConfig);

      const [total, active, expired, used] = await Promise.all([
        prisma.passwordResetToken.count(),
        prisma.passwordResetToken.count({
          where: {
            used: false,
            expiresAt: { gte: new Date() },
          },
        }),
        prisma.passwordResetToken.count({
          where: {
            used: false,
            expiresAt: { lt: new Date() },
          },
        }),
        prisma.passwordResetToken.count({
          where: { used: true },
        }),
      ]);

      return { total, active, expired, used };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error getting token stats', {
        error: errorMessage,
      });
      return { total: 0, active: 0, expired: 0, used: 0 };
    }
  }
}
````

**ШАГ 2.1.2**: Экспортировать сервис из package

**Файл**: `packages/session-management/src/index.ts`

Добавить export ПОСЛЕ существующих exports:

```typescript
// ... existing exports ...
export { SessionStore } from './database/session-store';
export { UserManagerFactory } from './factories/user-manager-factory';

// ✅ ADD THIS LINE
export { PasswordResetTokenService } from './services/password-reset-token-service';
```

---

## 2.2. Email Templates

### 2.2.1. HTML Template

**Файл**: `packages/email-service/src/templates/password-reset.html` (НОВЫЙ)

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
    <style>
      @import url('./email-base.css');
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Header -->
      <div class="header header-primary">
        <div class="logo logo-primary">{{companyName}}</div>
        <div class="header-subtitle">Password Reset Request</div>
      </div>

      <!-- Main Content -->
      <div class="info-block info-block-primary">
        <p>Hello,</p>
        <p>You requested to reset your password for account <strong>{{userEmail}}</strong>.</p>
        <p>Use the code below to reset your password:</p>
      </div>

      <!-- Reset Code -->
      <div class="crypto-address">
        <div class="crypto-address-label">Reset Code</div>
        <div class="crypto-address-value"><strong>{{resetCode}}</strong></div>
      </div>

      <!-- Instructions -->
      <div class="info-block info-block-warning">
        <p><strong>⏱️ Important:</strong></p>
        <ul>
          <li>This code is valid for <strong>15 minutes</strong></li>
          <li>Enter the code on the password reset page</li>
          <li>Do not share this code with anyone</li>
        </ul>
      </div>

      <!-- Security Warning -->
      <div class="info-block info-block-danger">
        <p><strong>⚠️ Did not request a password reset?</strong></p>
        <p>
          If you did not request this, please ignore this email. Your password will remain
          unchanged.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>Best regards,<br />{{companyName}} Security Team</p>
        <p class="footer-note">This is an automated email. Please do not reply.</p>
        <p class="footer-note">Request Time: {{createdAt}}</p>
      </div>
    </div>
  </body>
</html>
```

### 2.2.2. Plain Text Template

**Файл**: `packages/email-service/src/templates/password-reset.txt` (НОВЫЙ)

```text
==================================================
{{companyName}} - Password Reset Request
==================================================

Hello,

You requested to reset your password for account {{userEmail}}.

Reset Code
--------------------------------------------------
{{resetCode}}
--------------------------------------------------

⏱️ IMPORTANT
--------------------------------------------------
- This code is valid for 15 minutes
- Enter the code on the password reset page
- Do not share this code with anyone

⚠️ SECURITY WARNING
--------------------------------------------------
If you did not request this password reset, please
ignore this email. Your password will remain unchanged.

Best regards,
{{companyName}} Security Team

This is an automated email. Please do not reply.
Request Time: {{createdAt}}

==================================================
```

---

## 2.3. EmailTemplateService Extension

**Файл**: `packages/email-service/src/services/email-template-service.ts`

**ШАГ 2.3.1**: Добавить тип для PasswordResetEmailData

Добавить ПЕРЕД классом EmailTemplateService (около line 15):

```typescript
import type {
  CryptoAddressEmailData,
  WalletReadyEmailData,
  SystemAlertEmailData,
  EmailMessage,
  // ✅ ADD THIS TYPE
  PasswordResetEmailData,
} from '../types/index';
```

**ШАГ 2.3.2**: Добавить метод generatePasswordResetEmail

Добавить ПОСЛЕ метода `generateWalletReadyEmail` (около line 180):

```typescript
  /**
   * ✅ Generate password reset email content
   *
   * Паттерн: Аналогично generateCryptoAddressEmail
   * - Загружает HTML и TXT templates
   * - Заменяет {{variables}} на реальные значения
   * - Форматирует дату
   */
  static async generatePasswordResetEmail(
    data: PasswordResetEmailData
  ): Promise<EmailMessage> {
    try {
      // Load HTML and TXT templates
      const [htmlTemplate, txtTemplate] = await Promise.all([
        this.loadTemplate('password-reset', 'html'),
        this.loadTemplate('password-reset', 'txt'),
      ]);

      // Prepare variables
      const variables = {
        companyName: data.companyName,
        userEmail: data.userEmail,
        resetCode: data.resetCode,
        createdAt: this.formatDate(new Date()),
      };

      // Replace variables in templates
      const htmlContent = this.replaceVariables(htmlTemplate, variables);
      const txtContent = this.replaceVariables(txtTemplate, variables);

      return {
        to: data.userEmail,
        subject: `${data.companyName} - Password Reset Code`,
        html: htmlContent,
        text: txtContent,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error generating password reset email', {
        userEmail: data.userEmail,
        error: errorMessage,
      });
      throw new Error(`Failed to generate password reset email: ${errorMessage}`);
    }
  }
```

---

## 2.4. EmailService Extension

**Файл**: `packages/email-service/src/services/email-service.ts`

**ШАГ 2.4.1**: Добавить метод sendPasswordReset

Добавить ПОСЛЕ метода `sendWalletReady` (около line 170):

```typescript
  /**
   * ✅ Send password reset email to user
   *
   * Паттерн: Аналогично sendCryptoAddress
   * - Генерирует email из template
   * - Отправляет через provider
   * - Логирует результат
   */
  static async sendPasswordReset(
    data: PasswordResetEmailData,
    config?: Partial<EmailProviderConfig>
  ): Promise<EmailSendResult> {
    try {
      this.logger.info('Sending password reset email', {
        to: data.userEmail,
        resetCode: data.resetCode,
      });

      // Generate email content from template
      const emailMessage = await EmailTemplateService.generatePasswordResetEmail(data);

      // Get email provider and send
      const provider = config
        ? EmailServiceFactory.create(config)
        : EmailServiceFactory.createFromEnvironment();
      const result = await provider.send(emailMessage);

      // Record result for monitoring
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

      // Record error for monitoring
      this.recordEmailErrorForMonitoring(config, errorMessage);

      this.logger.error('Email service error', {
        to: data.userEmail,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
```

---

## 2.5. TypeScript Types

**Файл**: `packages/email-service/src/types/index.ts`

**ШАГ 2.5.1**: Добавить тип PasswordResetEmailData

Добавить ПОСЛЕ типа `WalletReadyEmailData`:

```typescript
export interface WalletReadyEmailData {
  orderId: string;
  userEmail: string;
  // ... existing fields
}

// ✅ ADD THIS INTERFACE
export interface PasswordResetEmailData {
  companyName: string;
  userEmail: string;
  resetCode: string;
}
```

---
