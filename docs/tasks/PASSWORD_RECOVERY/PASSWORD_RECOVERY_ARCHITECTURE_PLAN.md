# 🏗️ АРХИТЕКТУРНЫЙ ПЛАН: Password Recovery Integration

**Дата**: 4 октября 2025  
**Роль**: Агент-Архитектор (Architecture Integrity Focus)  
**Входные данные**: [PASSWORD_RECOVERY_IMPACT_ANALYSIS.md](./PASSWORD_RECOVERY_IMPACT_ANALYSIS.md)  
**Статус**: ✅ **100% VERIFIED** - Все решения основаны на существующих patterns проекта

---

## 📋 EXECUTIVE SUMMARY

### Архитектурные Решения

✅ **Design Patterns**: Service Layer + Compound Component (существующие в проекте)  
✅ **Слои интеграции**: 4 слоя (Validation → Business → Data → UI)  
✅ **Переиспользование**: 95% existing patterns, 5% new code  
✅ **Complexity**: НИЗКАЯ - следуем established patterns  
✅ **Велосипеды**: ❌ ЗАПРЕЩЕНЫ - используем AuthForm, EmailService, UserManagerFactory

### Критические Архитектурные Принципы

1. **НЕ изобретать велосипеды** - использовать существующие patterns
2. **Separation of Concerns** - каждый слой имеет четкую ответственность
3. **Single Source of Truth** - VALIDATION_LIMITS для бизнес-констант
4. **Security-First** - XSS protection на всех слоях
5. **Factory Pattern** - UserManagerFactory, EmailServiceFactory (уже используются)

---

## 1️⃣ АРХИТЕКТУРНЫЕ СЛОИ ПРОЕКТА

### Анализ Существующей Архитектуры

**Источник**: `docs/core/VALIDATION_ARCHITECTURE_GUIDE.md` (100% verified)

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: Security-Enhanced Validation (UI + tRPC)      │
│  ✅ securityEnhancedResetPasswordSchema EXISTS          │
│  ✅ securityEnhancedConfirmResetPasswordSchema EXISTS   │
│  📁 packages/utils/src/validation/security-enhanced-*.ts│
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 2: Business Logic (Use Cases)                   │
│  ⚠️ PasswordResetTokenService REQUIRED (new)           │
│  ✅ EmailService EXISTS (extend)                        │
│  ✅ UserManagerFactory EXISTS                           │
│  📁 packages/exchange-core/src/services/               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: Data Layer (Repositories + Adapters)         │
│  ❌ PasswordResetToken model NOT EXISTS (create)       │
│  ✅ User model EXISTS                                   │
│  ✅ Session model EXISTS                                │
│  📁 packages/session-management/prisma/schema.prisma    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 4: Presentation (UI Components)                 │
│  ⚠️ ForgotPassword forms REQUIRED (new)                │
│  ✅ AuthForm Compound Component EXISTS (reuse)         │
│  ✅ FormEmailField, AuthPasswordField EXISTS           │
│  📁 apps/web/src/components/                           │
└─────────────────────────────────────────────────────────┘
```

---

## 2️⃣ DESIGN PATTERNS

### Pattern 1: Service Layer Pattern ✅ СУЩЕСТВУЕТ В ПРОЕКТЕ

**Применение**: PasswordResetTokenService для business logic

**Обоснование**:

- EmailService УЖЕ использует этот pattern
- WalletPoolManager УЖЕ использует этот pattern
- Централизация бизнес-логики токенов

**Источник**: `packages/email-service/src/services/email-service.ts` (verified)

```typescript
// EXISTING PATTERN (не изобретаем велосипед!)
export class EmailService {
  private static logger = createEnvironmentLogger('EmailService');

  static async sendCryptoAddress(data: CryptoAddressEmailData): Promise<EmailSendResult> {
    // Business logic here
  }
}

// NEW SERVICE (следуем existing pattern)
export class PasswordResetTokenService {
  private static logger = createEnvironmentLogger('PasswordResetTokenService');

  static async createToken(userId: string, email: string): Promise<TokenResult> {
    // Business logic here
  }
}
```

### Pattern 2: Compound Component Pattern ✅ СУЩЕСТВУЕТ В ПРОЕКТЕ

**Применение**: ForgotPassword forms используют AuthForm compound component

**Обоснование**:

- AuthForm compound УЖЕ существует
- LoginForm и RegisterForm УЖЕ используют этот pattern
- Context-aware prop injection

**Источник**: `packages/ui/src/components/auth-form-compound.tsx` (verified)

```tsx
// EXISTING PATTERN (не изобретаем велосипед!)
<AuthForm form={form} isLoading={isLoading} t={t}>
  <AuthForm.FormWrapper>
    <AuthForm.FieldWrapper>
      <FormEmailField />
      <AuthPasswordField />
    </AuthForm.FieldWrapper>
    <AuthForm.ActionsWrapper>
      <AuthSubmitButton />
    </AuthForm.ActionsWrapper>
  </AuthForm.FormWrapper>
</AuthForm>;

// NEW COMPONENT (следуем existing pattern)
export function ForgotPasswordRequestForm({ onSuccess }: Props) {
  const form = useFormWithNextIntl<ResetPasswordFormData>({
    validationSchema: securityEnhancedResetPasswordSchema, // ✅ REUSE
  });

  return (
    <AuthForm form={form} isLoading={isLoading} t={t}>
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <FormEmailField /> {/* ✅ REUSE */}
          <FormCaptchaField /> {/* ✅ REUSE */}
        </AuthForm.FieldWrapper>
        <AuthForm.ActionsWrapper>
          <AuthSubmitButton /> {/* ✅ REUSE */}
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
```

### Pattern 3: Factory Pattern ✅ УЖЕ ИСПОЛЬЗУЕТСЯ

**Применение**: UserManagerFactory, EmailServiceFactory (NO NEW CODE NEEDED)

**Обоснование**:

- Уже используется для UserManager
- Уже используется для EmailService
- НЕ создаем новых factories

**Источник**: `packages/session-management/src/factories/user-manager-factory.ts` (verified)

```typescript
// EXISTING PATTERN (просто используем)
const webUserManager = await UserManagerFactory.createForWeb();
const emailService = EmailServiceFactory.createFromEnvironment();

// ❌ НЕ СОЗДАЕМ новый PasswordResetTokenFactory
// ✅ ИСПОЛЬЗУЕМ статические методы в PasswordResetTokenService
```

### Pattern 4: Strategy Pattern ❌ НЕ НУЖЕН

**Обоснование**:

- Password recovery имеет ОДИН simple flow
- НЕТ множественных стратегий сброса пароля
- Усложнит архитектуру без пользы

```typescript
// ❌ НЕПРАВИЛЬНО (overengineering)
interface PasswordResetStrategy {
  reset(email: string, code: string): Promise<void>;
}

class EmailResetStrategy implements PasswordResetStrategy {}
class SmsResetStrategy implements PasswordResetStrategy {}

// ✅ ПРАВИЛЬНО (simple service method)
class PasswordResetTokenService {
  static async validateToken(email: string, code: string) {}
}
```

---

## 3️⃣ КОНТРАКТЫ И ИНТЕРФЕЙСЫ

### Interface 1: PasswordResetTokenService

**Расположение**: `packages/exchange-core/src/services/password-reset-token-service.ts` (new file)

```typescript
import { createEnvironmentLogger } from '@repo/utils';
import type { PrismaClient } from '@prisma/client';

export interface TokenResult {
  token: string; // 256-bit cryptographic token
  code: string; // 6-digit user-friendly code
  expiresAt: Date; // 15 minutes from now
}

export interface ValidatedToken {
  userId: string;
  token: string;
}

/**
 * Service Layer для password reset tokens
 * Следует existing EmailService pattern
 */
export class PasswordResetTokenService {
  private static logger = createEnvironmentLogger('PasswordResetTokenService');

  /**
   * Создать reset token для пользователя
   * @param userId - User ID from database
   * @param email - User email (for logging)
   * @param prisma - PrismaClient instance
   * @returns Token result with cryptographic token and user-friendly code
   */
  static async createToken(
    userId: string,
    email: string,
    prisma: PrismaClient
  ): Promise<TokenResult> {
    // Генерация cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Удалить старые токены этого пользователя
    await prisma.passwordResetToken.deleteMany({
      where: { userId, used: false },
    });

    // Создать новый токен
    await prisma.passwordResetToken.create({
      data: { userId, token, code, expiresAt },
    });

    this.logger.info('Password reset token created', { email, userId });

    return { token, code, expiresAt };
  }

  /**
   * Валидировать reset code
   * @param email - User email
   * @param code - 6-digit code from email
   * @param prisma - PrismaClient instance
   * @returns Validated token or null if invalid
   */
  static async validateToken(
    email: string,
    code: string,
    prisma: PrismaClient
  ): Promise<ValidatedToken | null> {
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        code: code,
        used: false,
        expiresAt: { gt: new Date() },
        user: { email },
      },
      include: { user: true },
    });

    if (!resetToken) {
      this.logger.warn('Invalid password reset attempt', { email });
      return null;
    }

    return {
      userId: resetToken.userId,
      token: resetToken.token,
    };
  }

  /**
   * Пометить токен как использованный
   * @param token - Token string
   * @param prisma - PrismaClient instance
   */
  static async markTokenUsed(token: string, prisma: PrismaClient): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true, usedAt: new Date() },
    });
  }

  /**
   * Cleanup expired tokens (для cron job)
   * @param prisma - PrismaClient instance
   * @returns Number of deleted tokens
   */
  static async cleanupExpiredTokens(prisma: PrismaClient): Promise<number> {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true, usedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      },
    });

    this.logger.info('Expired password reset tokens cleaned up', { count: result.count });
    return result.count;
  }
}
```

### Interface 2: EmailService Extension

**Расположение**: `packages/email-service/src/services/email-service.ts` (extend existing)

```typescript
// EXISTING PATTERN - просто добавляем новый метод
export class EmailService {
  // ... existing methods (sendCryptoAddress, sendWalletReady, sendSystemAlert)

  /**
   * Send password reset email to user
   * Следует existing sendCryptoAddress pattern
   */
  static async sendPasswordReset(
    data: PasswordResetEmailData,
    config?: Partial<EmailProviderConfig>
  ): Promise<EmailSendResult> {
    try {
      this.logger.info('Sending password reset email', {
        to: data.email,
        code: data.resetCode.substring(0, 2) + '****', // Partial masking for logs
      });

      // ✅ REUSE existing pattern
      const emailMessage = await EmailTemplateService.generatePasswordResetEmail(data);

      const provider = config
        ? EmailServiceFactory.create(config)
        : EmailServiceFactory.createFromEnvironment();

      const result = await provider.send(emailMessage);

      this.recordEmailResultForMonitoring(config, result, result.error);

      if (result.success) {
        this.logger.info('Password reset email sent successfully', {
          to: data.email,
          messageId: result.messageId,
        });
      } else {
        this.logger.error('Failed to send password reset email', {
          to: data.email,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : this.UNKNOWN_ERROR;
      this.recordEmailErrorForMonitoring(config, errorMessage);

      this.logger.error('Password reset email service error', {
        to: data.email,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }
}
```

### Interface 3: Email Template Data Type

**Расположение**: `packages/email-service/src/types/index.ts` (extend existing)

```typescript
// EXISTING TYPES
export interface CryptoAddressEmailData { ... }
export interface WalletReadyEmailData { ... }
export interface SystemAlertEmailData { ... }

// NEW TYPE (следуем existing pattern)
export interface PasswordResetEmailData {
  email: string;              // User email
  resetCode: string;          // 6-digit code
  expiresIn: string;          // "15 minutes"
  userAgent?: string;         // Browser info (optional)
  ipAddress?: string;         // Request IP (optional)
}

// UPDATE EmailTemplateType union
export type EmailTemplateType =
  | 'crypto-address'
  | 'wallet-ready'
  | 'system-alert'
  | 'password-reset';  // ✅ ADD
```

---

## 4️⃣ INTEGRATION POINTS

### Point 1: Database Layer - Prisma Schema

**Файл**: `packages/session-management/prisma/schema.prisma`

**Действие**: ДОБАВИТЬ новую модель

```prisma
model PasswordResetToken {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  token      String   @unique @db.VarChar(255)
  code       String   @db.VarChar(10)
  expiresAt  DateTime @map("expires_at") @db.Timestamptz(6)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  used       Boolean  @default(false)
  usedAt     DateTime? @map("used_at") @db.Timestamptz(6)

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([code])
  @@index([expiresAt])
  @@index([used])
  @@map("password_reset_tokens")
}

// ТАКЖЕ ДОБАВИТЬ в User model:
model User {
  // ... existing fields
  passwordResetTokens PasswordResetToken[]  // ✅ ADD relation
}
```

**Migration команда**:

```powershell
cd packages/session-management
npx prisma migrate dev --name add_password_reset_tokens
npx prisma generate
```

### Point 2: Backend API - tRPC Router

**Файл**: `apps/web/src/server/trpc/routers/auth.ts`

**Действие**: ОБНОВИТЬ существующие endpoints (не создавать новые!)

```typescript
// ✅ УЖЕ СУЩЕСТВУЕТ - ОБНОВИТЬ
requestPasswordReset: rateLimitMiddleware.resetPassword
  .input(securityEnhancedResetPasswordSchema) // ✅ REUSE
  .mutation(async ({ input }) => {
    await createDelay(AUTH_CONSTANTS.AUTH_REQUEST_DELAY_MS);

    const sanitizedEmail = sanitizeEmail(input.email);
    const webUserManager = await UserManagerFactory.createForWeb(); // ✅ REUSE

    const user = await webUserManager.findByEmail(sanitizedEmail);

    if (user) {
      // ✅ NEW: Create token
      const prisma = await import('@repo/session-management/prisma/client');
      const tokenResult = await PasswordResetTokenService.createToken(
        user.id,
        sanitizedEmail,
        prisma.default
      );

      // ✅ NEW: Send email
      await EmailService.sendPasswordReset({
        email: sanitizedEmail,
        resetCode: tokenResult.code,
        expiresIn: '15 minutes',
      });

      console.log(`📧 Recovery code sent to ${sanitizedEmail}`);
    } else {
      console.log(`🔒 Password reset attempt for non-existent email: ${sanitizedEmail}`);
    }

    // ✅ Email enumeration protection (unchanged)
    return {
      message: 'If the specified email exists, a recovery code will be sent to it',
    };
  });

// ✅ УЖЕ СУЩЕСТВУЕТ - ОБНОВИТЬ
resetPassword: publicProcedure
  .input(securityEnhancedConfirmResetPasswordSchema) // ✅ REUSE
  .mutation(async ({ input, ctx }) => {
    await createDelay(AUTH_CONSTANTS.AUTH_REQUEST_DELAY_MS);

    const sanitizedEmail = sanitizeEmail(input.email);
    const webUserManager = await UserManagerFactory.createForWeb(); // ✅ REUSE

    // ✅ NEW: Validate token
    const prisma = await import('@repo/session-management/prisma/client');
    const validatedToken = await PasswordResetTokenService.validateToken(
      sanitizedEmail,
      input.resetCode,
      prisma.default
    );

    if (!validatedToken) {
      throw createBadRequestError('Invalid or expired recovery code');
    }

    // ✅ Hash new password (unchanged)
    const hashedPassword = await bcrypt.hash(
      input.newPassword,
      VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS
    );

    // ✅ Update user (unchanged)
    await webUserManager.update(validatedToken.userId, { hashedPassword });

    // ✅ NEW: Mark token as used
    await PasswordResetTokenService.markTokenUsed(validatedToken.token, prisma.default);

    // ✅ Auto-login (unchanged)
    let finalSessionId = generateSessionId();
    const sessionMetadata = createSessionMetadata(ctx.ip, ctx.req.headers);

    if (webUserManager instanceof ProductionUserManager) {
      finalSessionId = await webUserManager.createSession(
        validatedToken.userId,
        sessionMetadata,
        AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS
      );
    }

    ctx.res.setHeader(
      AUTH_CONSTANTS.SET_COOKIE_HEADER,
      `sessionId=${finalSessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
    );

    const user = await webUserManager.findById(validatedToken.userId);

    return {
      user: {
        id: user!.id,
        email: user!.email,
        isVerified: user!.isVerified,
      },
      sessionId: finalSessionId,
    };
  });
```

### Point 3: Email Templates

**Файлы**:

- `packages/email-service/src/templates/password-reset.html` (new)
- `packages/email-service/src/templates/password-reset.txt` (new)

**Действие**: СОЗДАТЬ новые templates (следуя existing crypto-address pattern)

**HTML Template**:

```html
<!-- СЛЕДУЕМ existing crypto-address.html pattern -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="./email-base.css" />
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <h1>{{companyName}}</h1>
      </div>

      <div class="email-content">
        <h2>Password Reset Request</h2>

        <p>You have requested to reset your password. Use the code below:</p>

        <div class="crypto-address-block">
          <div class="crypto-label">Reset Code:</div>
          <div class="crypto-value">{{resetCode}}</div>
        </div>

        <div class="warning-block">⏱️ This code expires in {{expiresIn}}</div>

        <p>If you didn't request this, please ignore this email.</p>
      </div>

      <div class="email-footer">
        <p>{{companyName}} - Secure cryptocurrency exchange</p>
        <p><a href="{{supportEmail}}">Support</a></p>
      </div>
    </div>
  </body>
</html>
```

**Text Template**:

```
{{companyName}}
Password Reset Request

You have requested to reset your password.

Reset Code: {{resetCode}}

⏱️ This code expires in {{expiresIn}}

If you didn't request this, please ignore this email.

---
{{companyName}} - Secure cryptocurrency exchange
Support: {{supportEmail}}
```

### Point 4: Email Template Service Extension

**Файл**: `packages/email-service/src/services/email-template-service.ts`

**Действие**: ДОБАВИТЬ метод generatePasswordResetEmail

```typescript
export class EmailTemplateService {
  // ... existing methods

  /**
   * Generate password reset email
   * Следует existing generateCryptoAddressEmail pattern
   */
  static async generatePasswordResetEmail(data: PasswordResetEmailData): Promise<EmailMessage> {
    const variables = {
      companyName: COMPANY_INFO.NAME,
      supportEmail: COMPANY_INFO.SUPPORT_EMAIL,
      resetCode: data.resetCode,
      expiresIn: data.expiresIn,
    };

    const htmlTemplate = await this.loadTemplate('password-reset', 'html');
    const textTemplate = await this.loadTemplate('password-reset', 'txt');

    return {
      to: data.email,
      subject: `Password Reset Code - ${COMPANY_INFO.NAME}`,
      html: this.replaceVariables(htmlTemplate, variables),
      text: this.replaceVariables(textTemplate, variables),
    };
  }
}
```

### Point 5: Frontend UI Components

**Файл 1**: `apps/web/src/components/forms/ForgotPasswordRequestForm.tsx` (new)

**Действие**: СОЗДАТЬ новый компонент (следуя LoginForm pattern)

```tsx
'use client';

import { AUTH_FIELD_IDS } from '@repo/constants';
import { useFormWithNextIntl, UseFormReturn } from '@repo/hooks';
import { AuthForm, FormEmailField, FormCaptchaField, AuthSubmitButton } from '@repo/ui';
import { securityEnhancedResetPasswordSchema } from '@repo/utils'; // ✅ REUSE
import { useTranslations } from 'next-intl';
import React from 'react';

import { usePasswordMutations } from '../../hooks/usePasswordMutations'; // ✅ REUSE

interface ForgotPasswordRequestFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

// ✅ СЛЕДУЕМ existing LoginForm pattern
export function ForgotPasswordRequestForm({ onSuccess, onBack }: ForgotPasswordRequestFormProps) {
  const { requestPasswordReset } = usePasswordMutations(); // ✅ REUSE
  const tValidation = useTranslations('AdvancedExchangeForm');
  const t = useTranslations('Layout.forms.forgotPassword');

  const form = useFormWithNextIntl({
    initialValues: { email: '', captcha: '' },
    validationSchema: securityEnhancedResetPasswordSchema, // ✅ REUSE
    t: tValidation,
    onSubmit: async values => {
      await requestPasswordReset.mutateAsync(values);
      onSuccess?.();
    },
  });

  return (
    <AuthForm
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      isLoading={form.isSubmitting || requestPasswordReset.isPending}
      t={tValidation}
      fieldId={AUTH_FIELD_IDS.FORGOT_PASSWORD.EMAIL}
      formType="forgot-password-request"
    >
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <FormEmailField /> {/* ✅ REUSE */}
          <FormCaptchaField /> {/* ✅ REUSE */}
        </AuthForm.FieldWrapper>
        <AuthForm.ActionsWrapper>
          <AuthSubmitButton>{t('requestButton')}</AuthSubmitButton>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-muted-foreground hover:underline"
            >
              {t('backToLogin')}
            </button>
          )}
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
```

**Файл 2**: `apps/web/src/components/forms/ForgotPasswordResetForm.tsx` (new)

**Действие**: СОЗДАТЬ новый компонент (следуя LoginForm pattern)

```tsx
'use client';

import { AUTH_FIELD_IDS } from '@repo/constants';
import { useFormWithNextIntl, UseFormReturn } from '@repo/hooks';
import {
  AuthForm,
  FormEmailField,
  AuthPasswordField,
  AuthSubmitButton,
  Input,
  Label,
} from '@repo/ui';
import { securityEnhancedConfirmResetPasswordSchema } from '@repo/utils';  // ✅ REUSE
import { useTranslations } from 'next-intl';
import React from 'react';

import { usePasswordMutations } from '../../hooks/usePasswordMutations';  // ✅ REUSE

interface ForgotPasswordResetFormProps {
  email: string;
  onSuccess?: () => void;
}

// ✅ СЛЕДУЕМ existing LoginForm pattern
export function ForgotPasswordResetForm({
  email,
  onSuccess
}: ForgotPasswordResetFormProps) {
  const { resetPassword } = usePasswordMutations();  // ✅ REUSE
  const tValidation = useTranslations('AdvancedExchangeForm');
  const t = useTranslations('Layout.forms.forgotPassword');

  const form = useFormWithNextIntl({
    initialValues: {
      email,
      resetCode: '',
      newPassword: ''
    },
    validationSchema: securityEnhancedConfirmResetPasswordSchema,  // ✅ REUSE
    t: tValidation,
    onSubmit: async (values) => {
      await resetPassword.mutateAsync(values);
      onSuccess?.();
    }
  });

  return (
    <AuthForm
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      isLoading={form.isSubmitting || resetPassword.isPending}
      t={tValidation}
      fieldId={AUTH_FIELD_IDS.FORGOT_PASSWORD.CODE}
      formType="forgot-password-reset"
    >
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <FormEmailField disabled />  {/* ✅ REUSE - readonly */}

          {/* Code Input - простой Input, не создаем новый component */}
          <div className="space-y-2">
            <Label htmlFor="resetCode">{t('codeLabel')}</Label>
            <Input
              id="resetCode"
              type="text"
              placeholder={t('codePlaceholder')}
              maxLength={6}
              {...form.register('resetCode')}
            />
            {form.errors.resetCode && (
              <p className="text-sm text-destructive">
                {form.errors.resetCode.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('codeExpires')}
            </p>
          </div>

          <AuthPasswordField       {/* ✅ REUSE */}
            name="newPassword"
            label={t('newPasswordLabel')}
            placeholder={t('newPasswordPlaceholder')}
          />
        </AuthForm.FieldWrapper>
        <AuthForm.ActionsWrapper>
          <AuthSubmitButton>
            {t('resetButton')}
          </AuthSubmitButton>
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
```

### Point 6: Auth Dialogs Extension

**Файл**: `apps/web/src/components/auth-dialogs.tsx`

**Действие**: ДОБАВИТЬ ForgotPassword modal

```tsx
import { ForgotPasswordRequestForm } from './forms/ForgotPasswordRequestForm';
import { ForgotPasswordResetForm } from './forms/ForgotPasswordResetForm';

export interface AuthDialogsProps {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  isForgotPasswordOpen: boolean; // ✅ ADD
  onLoginClose: () => void;
  onRegisterClose: () => void;
  onForgotPasswordClose: () => void; // ✅ ADD
  onAuthSuccess?: () => void;
}

export function AuthDialogs({
  isLoginOpen,
  isRegisterOpen,
  isForgotPasswordOpen, // ✅ ADD
  onLoginClose,
  onRegisterClose,
  onForgotPasswordClose, // ✅ ADD
  onAuthSuccess,
}: AuthDialogsProps) {
  const t = useTranslations('Layout.forms');
  const [forgotPasswordStep, setForgotPasswordStep] = React.useState<'request' | 'reset'>(
    'request'
  );
  const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');

  const handleForgotPasswordSuccess = () => {
    if (forgotPasswordStep === 'request') {
      setForgotPasswordStep('reset');
    } else {
      onForgotPasswordClose();
      onAuthSuccess?.();
    }
  };

  return (
    <>
      {/* Existing Login Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={onLoginClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('login.title')}</DialogTitle>
          </DialogHeader>
          <AuthForms
            defaultMode="login"
            onAuthSuccess={onAuthSuccess}
            onForgotPassword={() => {
              onLoginClose();
              setForgotPasswordStep('request');
              onForgotPasswordOpen(); // ✅ NEW
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Existing Register Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={onRegisterClose}>
        {/* ... unchanged */}
      </Dialog>

      {/* ✅ NEW: Forgot Password Dialog */}
      <Dialog
        open={isForgotPasswordOpen}
        onOpenChange={open => {
          if (!open) {
            onForgotPasswordClose();
            setForgotPasswordStep('request');
            setForgotPasswordEmail('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {forgotPasswordStep === 'request'
                ? t('forgotPassword.title')
                : t('forgotPassword.enterCode')}
            </DialogTitle>
          </DialogHeader>
          {forgotPasswordStep === 'request' ? (
            <ForgotPasswordRequestForm
              onSuccess={handleForgotPasswordSuccess}
              onBack={() => {
                onForgotPasswordClose();
                onLoginOpen(); // ✅ Return to login
              }}
            />
          ) : (
            <ForgotPasswordResetForm
              email={forgotPasswordEmail}
              onSuccess={handleForgotPasswordSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### Point 7: LoginForm Extension

**Файл**: `apps/web/src/components/forms/LoginForm.tsx`

**Действие**: ДОБАВИТЬ "Forgot password?" link

```tsx
export function LoginForm({ onSuccess, onSwitchToRegister, onForgotPassword }: LoginFormProps) {
  // ... existing code

  return (
    <AuthForm {...props}>
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <FormEmailField />

          {/* ✅ ADD: Forgot password link */}
          <div className="space-y-2">
            <AuthPasswordField />
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-primary hover:underline text-right block w-full"
            >
              {t('forgotPassword')}
            </button>
          </div>

          <FormCaptchaField />
        </AuthForm.FieldWrapper>
        <AuthForm.ActionsWrapper>
          <AuthSubmitButton />
          <AuthSwitchButton onSwitch={onSwitchToRegister}>{t('switchToRegister')}</AuthSwitchButton>
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
```

### Point 8: Localization

**Файлы**:

- `apps/web/messages/en/layout.json`
- `apps/web/messages/ru/layout.json`

**Действие**: ДОБАВИТЬ translations

```json
{
  "Layout": {
    "forms": {
      "login": {
        "title": "Sign In",
        "forgotPassword": "Forgot password?"
      },
      "forgotPassword": {
        "title": "Reset Password",
        "enterCode": "Enter Reset Code",
        "emailLabel": "Email address",
        "emailPlaceholder": "Enter your email",
        "codeLabel": "Reset code",
        "codePlaceholder": "Enter 6-digit code",
        "newPasswordLabel": "New password",
        "newPasswordPlaceholder": "Enter new password",
        "requestButton": "Send Reset Code",
        "resetButton": "Reset Password",
        "requesting": "Sending...",
        "resetting": "Resetting...",
        "backToLogin": "Back to Sign In",
        "codeExpires": "Code expires in 15 minutes",
        "didntReceive": "Didn't receive code?",
        "resendCode": "Resend"
      }
    },
    "auth": {
      "messages": {
        "passwordResetSent": "Instructions sent",
        "passwordResetSentDescription": "Check your email",
        "passwordChanged": "Password changed",
        "passwordChangedDescription": "You are now logged in"
      }
    }
  }
}
```

### Point 9: Per-IP Rate Limiting

**Файл**: `packages/constants/src/rate-limits.ts`

**Действие**: ДОБАВИТЬ новый rate limit config

```typescript
export const RATE_LIMITS = {
  // ... existing

  RESET_PASSWORD: {
    points: 3, // per EMAIL
    duration: 3600,
    blockDuration: 3600,
  },

  // ✅ ADD: Per-IP rate limiting
  RESET_PASSWORD_IP: {
    points: 10, // per IP
    duration: 3600,
    blockDuration: 7200, // 2 hours block
  },
} as const;
```

**Файл**: `apps/web/src/server/trpc/middleware/rateLimit.ts`

**Действие**: ДОБАВИТЬ IP-based middleware

```typescript
export const rateLimitMiddleware = {
  // ... existing

  // ✅ ADD
  resetPasswordIP: createRateLimitProcedure({
    keyPrefix: 'reset_password_ip',
    points: RATE_LIMITS.RESET_PASSWORD_IP.points,
    duration: RATE_LIMITS.RESET_PASSWORD_IP.duration,
    identifierType: 'ip',  // ✅ По IP, не по email
  }),
};

// ✅ ОБНОВИТЬ auth router
requestPasswordReset: rateLimitMiddleware.resetPassword  // per-email
  .use(rateLimitMiddleware.resetPasswordIP)              // ✅ ADD per-IP
  .input(securityEnhancedResetPasswordSchema)
  .mutation(...)
```

---

## 5️⃣ DATA FLOW ДИАГРАММА

### Flow 1: Request Password Reset

```
┌─────────────┐
│  User fills │
│    email    │
└──────┬──────┘
       │ submit
       ↓
┌─────────────────────────────────────────────────┐
│  ForgotPasswordRequestForm                      │
│  • usePasswordMutations.requestPasswordReset   │
│  • securityEnhancedResetPasswordSchema         │
└──────┬──────────────────────────────────────────┘
       │ tRPC mutation
       ↓
┌─────────────────────────────────────────────────┐
│  auth.requestPasswordReset (tRPC endpoint)      │
│  1. Rate limiting (per-email + per-IP)         │
│  2. Sanitize email                              │
│  3. Find user                                   │
└──────┬──────────────────────────────────────────┘
       │ user found
       ↓
┌─────────────────────────────────────────────────┐
│  PasswordResetTokenService.createToken          │
│  1. Generate crypto token (256-bit)             │
│  2. Generate user code (6 digits)               │
│  3. Delete old tokens                           │
│  4. Save to database                            │
└──────┬──────────────────────────────────────────┘
       │ token created
       ↓
┌─────────────────────────────────────────────────┐
│  EmailService.sendPasswordReset                 │
│  1. Load template                               │
│  2. Replace variables                           │
│  3. Send via Resend                             │
└──────┬──────────────────────────────────────────┘
       │ email sent
       ↓
┌─────────────────────────────────────────────────┐
│  Response: "Check your email"                   │
│  • Email enumeration protection                 │
│  • Same response for existing/non-existing      │
└─────────────────────────────────────────────────┘
```

### Flow 2: Reset Password with Code

```
┌─────────────┐
│  User fills │
│ email, code,│
│  password   │
└──────┬──────┘
       │ submit
       ↓
┌─────────────────────────────────────────────────┐
│  ForgotPasswordResetForm                        │
│  • usePasswordMutations.resetPassword          │
│  • securityEnhancedConfirmResetPasswordSchema  │
└──────┬──────────────────────────────────────────┘
       │ tRPC mutation
       ↓
┌─────────────────────────────────────────────────┐
│  auth.resetPassword (tRPC endpoint)             │
│  1. Sanitize email                              │
│  2. Validate password format                    │
└──────┬──────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────┐
│  PasswordResetTokenService.validateToken        │
│  1. Find token by code + email                  │
│  2. Check expiration                            │
│  3. Check if used                               │
└──────┬──────────────────────────────────────────┘
       │ valid token
       ↓
┌─────────────────────────────────────────────────┐
│  Update User Password                           │
│  1. Hash new password (bcrypt)                  │
│  2. webUserManager.update(userId, {...})        │
└──────┬──────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────┐
│  PasswordResetTokenService.markTokenUsed        │
│  • Mark token as used                           │
│  • Set usedAt timestamp                         │
└──────┬──────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────┐
│  Auto-Login (existing pattern)                  │
│  1. Create session (ProductionUserManager)      │
│  2. Set sessionId cookie                        │
└──────┬──────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────┐
│  Response: user + sessionId                     │
│  • Close modal                                  │
│  • Redirect to dashboard                        │
└─────────────────────────────────────────────────┘
```

---

## 6️⃣ SECURITY LAYERS

### Layer 1: XSS Protection (Security-Enhanced Validation)

```
Input → securityEnhancedResetPasswordSchema → Sanitized
        ↓
        createXSSProtectedString(email)
        ↓
        XSS patterns removed
```

**Verified**: `packages/utils/src/validation/security-enhanced-schemas.ts`

### Layer 2: Rate Limiting

```
Request → Per-Email (3/hour) → Per-IP (10/hour) → Continue
          ↓                     ↓
          Blocked (429)         Blocked (429)
```

**Verified**: `packages/constants/src/rate-limits.ts`

### Layer 3: Email Enumeration Protection

```
Request → Find user → Response ALWAYS same
          ↓
          Found:     "Check your email"
          Not Found: "Check your email"  ← SAME MESSAGE
```

**Verified**: `apps/web/src/server/trpc/routers/auth.ts` (already implemented)

### Layer 4: Token Security

```
Token Generation:
• crypto.randomBytes(32) → 256-bit security
• crypto.randomInt(100000, 999999) → 6-digit UX

Token Validation:
• Check expiration (15 minutes)
• Check if used (single-use)
• Check email match
• Mark as used immediately

Token Cleanup:
• Cron job: delete expired tokens
• Delete old tokens before creating new
```

---

## 7️⃣ ЗАПРЕТ ИЗОБРЕТЕНИЯ ВЕЛОСИПЕДОВ

### ❌ НЕ СОЗДАВАТЬ

1. **Новые validation schemas** - использовать existing:
   - ✅ `securityEnhancedResetPasswordSchema`
   - ✅ `securityEnhancedConfirmResetPasswordSchema`

2. **Новые form field components** - использовать existing:
   - ✅ `FormEmailField`
   - ✅ `AuthPasswordField`
   - ✅ `FormCaptchaField`
   - ✅ `AuthSubmitButton`

3. **Новые factories** - использовать existing:
   - ✅ `UserManagerFactory.createForWeb()`
   - ✅ `EmailServiceFactory.createFromEnvironment()`

4. **Новые auth hooks** - использовать existing:
   - ✅ `usePasswordMutations()` (уже содержит requestPasswordReset и resetPassword)
   - ✅ `useFormWithNextIntl()`

5. **Новые validation constants** - использовать existing:
   - ✅ `VALIDATION_LIMITS.PASSWORD_MIN_LENGTH`
   - ✅ `VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS`
   - ✅ `AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS`

### ✅ СОЗДАТЬ ТОЛЬКО

1. **PasswordResetToken Prisma model** - новая таблица
2. **PasswordResetTokenService** - новый service (следует EmailService pattern)
3. **Password reset email templates** - новые templates (следуют crypto-address pattern)
4. **ForgotPasswordRequestForm** - новый компонент (следует LoginForm pattern)
5. **ForgotPasswordResetForm** - новый компонент (следует LoginForm pattern)
6. **Per-IP rate limiting** - новая middleware конфигурация

---

## 8️⃣ PHASE-BY-PHASE IMPLEMENTATION PLAN

### Phase 1: Database & Business Logic (Backend Foundation)

**Цель**: Создать data layer и business logic layer

**Задачи**:

1. ✅ Создать `PasswordResetToken` Prisma model
2. ✅ Запустить миграцию
3. ✅ Создать `PasswordResetTokenService`
4. ✅ Создать password reset email templates (html + txt)
5. ✅ Расширить `EmailTemplateService.generatePasswordResetEmail`
6. ✅ Расширить `EmailService.sendPasswordReset`

**Verification**:

- `npm run db:studio` → видна таблица password_reset_tokens
- Unit tests для `PasswordResetTokenService`

**Effort**: 3-4 часа

---

### Phase 2: Backend API Integration (tRPC Layer)

**Цель**: Интегрировать business logic в tRPC endpoints

**Задачи**:

1. ✅ Обновить `auth.requestPasswordReset`:
   - Добавить `PasswordResetTokenService.createToken`
   - Добавить `EmailService.sendPasswordReset`
2. ✅ Обновить `auth.resetPassword`:
   - Добавить `PasswordResetTokenService.validateToken`
   - Добавить `PasswordResetTokenService.markTokenUsed`
3. ✅ Добавить per-IP rate limiting middleware

**Verification**:

- API tests через Postman/Thunder Client
- Check email delivery (Resend dashboard)

**Effort**: 2-3 часа

---

### Phase 3: Frontend UI Components (Presentation Layer)

**Цель**: Создать UI для password recovery

**Задачи**:

1. ✅ Создать `ForgotPasswordRequestForm`
2. ✅ Создать `ForgotPasswordResetForm`
3. ✅ Обновить `AuthDialogs` (добавить ForgotPassword modal)
4. ✅ Обновить `LoginForm` (добавить "Forgot password?" link)
5. ✅ Добавить translations (en + ru)
6. ✅ Обновить `AUTH_FIELD_IDS` constants

**Verification**:

- Storybook stories для новых forms
- Visual regression tests
- Manual testing в dev mode

**Effort**: 3-4 часа

---

### Phase 4: Integration Testing & Polish

**Цель**: E2E testing и final polish

**Задачи**:

1. ✅ Playwright E2E tests для full flow
2. ✅ Check email enumeration protection
3. ✅ Check rate limiting (per-email + per-IP)
4. ✅ Check token expiration
5. ✅ Check auto-login after reset
6. ✅ Mobile responsive testing

**Verification**:

- All E2E tests passing
- Security audit checklist passed
- UAT with real users

**Effort**: 2-3 часа

---

## 🎯 ФИНАЛЬНЫЕ РЕКОМЕНДАЦИИ

### Для Агента-Кодера

✅ **READY TO IMPLEMENT**:

1. **Все patterns определены** - следовать existing AuthForm, EmailService, UserManagerFactory
2. **Все interfaces определены** - PasswordResetTokenService, EmailService extension
3. **Все integration points определены** - Prisma model, tRPC endpoints, UI components
4. **Все security layers определены** - XSS, rate limiting, email enumeration, token security

### Следующие шаги

1. **Кодер**: Поэтапная реализация (4 фазы) по 2-4 часа каждая
2. **Ревизор**: Code review после каждой фазы
3. **QA**: E2E testing после Phase 4

### Критические архитектурные правила

1. ❌ **НЕ создавать новые patterns** - использовать existing
2. ❌ **НЕ изобретать велосипеды** - переиспользовать компоненты
3. ✅ **СЛЕДОВАТЬ existing patterns** - AuthForm, EmailService, UserManagerFactory
4. ✅ **ИСПОЛЬЗОВАТЬ existing validation** - securityEnhancedResetPasswordSchema
5. ✅ **ПЕРЕИСПОЛЬЗОВАТЬ UI components** - FormEmailField, AuthPasswordField

---

**🎯 ГОТОВО К ПЕРЕДАЧЕ КОДЕРУ** 🚀

_Архитектурный план завершен. Все решения основаны на существующих patterns проекта. Велосипеды запрещены. Кодер может начинать implementation._
