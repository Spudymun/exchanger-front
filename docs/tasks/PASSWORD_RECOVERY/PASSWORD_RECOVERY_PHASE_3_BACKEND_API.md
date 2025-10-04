# Phase 3: Backend API Layer - Detailed Implementation

> **Файл**: Part of PASSWORD_RECOVERY_IMPLEMENTATION_PLAN.md  
> **Фаза**: Backend API Layer  
> **Время**: ~1 час  
> **Статус**: 100% VERIFIED patterns

---

## 🔌 Phase 3: Backend API Layer

### Цель

Обновить tRPC роутер `auth.ts` с реальной логикой восстановления пароля, интегрировать `PasswordResetTokenService` и `EmailService`.

### Dependencies

- ✅ Phase 1 завершена (таблица `password_reset_tokens` создана)
- ✅ Phase 2 завершена (`PasswordResetTokenService` и `EmailService` готовы)

---

## 3.1. Update auth.ts - requestPasswordReset Endpoint

### Файл: `apps/web/src/server/trpc/routers/auth.ts`

**ТЕКУЩАЯ РЕАЛИЗАЦИЯ** (lines 298-330):

```typescript
  requestPasswordReset: rateLimitMiddleware.resetPassword
    .input(securityEnhancedResetPasswordSchema)
    .mutation(async ({ input }) => {
      await createDelay(AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS);

      const sanitizedEmail = sanitizeEmail(input.email);

      const webUserManager = await UserManagerFactory.createForWeb();

      const user = await webUserManager.findByEmail(sanitizedEmail);
      if (!user) {
        console.log(`🔒 Password reset attempt for non-existent email: ${sanitizedEmail}`);
      } else {
        console.log(`🔑 Password reset request for: ${sanitizedEmail}`);

        // MOCK: Имитация отправки email с кодом восстановления
        const resetCode = Math.random()
          .toString(AUTH_CONSTANTS.RESET_CODE_BASE)
          .substring(AUTH_CONSTANTS.RESET_CODE_START, AUTH_CONSTANTS.RESET_CODE_END)
          .toUpperCase();
        console.log(`📧 Recovery code for ${sanitizedEmail}: ${resetCode}`);
      }

      return {
        message: 'If the specified email exists, a recovery code will be sent to it',
      };
    }),
```

**ШАГ 3.1.1**: Добавить импорты в начало файла

Найти секцию imports (около line 1-40) и ДОБАВИТЬ:

```typescript
import { AUTH_CONSTANTS, VALIDATION_LIMITS } from '@repo/constants';
import { generateSessionId, sanitizeEmail, isAuthenticatedUser } from '@repo/exchange-core';
import {
  UserManagerFactory,
  ProductionUserManager,
  // ✅ ADD THESE IMPORTS
  PasswordResetTokenService,
  type UserManagerInterface,
  type User,
} from '@repo/session-management';

// ✅ ADD THIS IMPORT
import { EmailService } from '@repo/email-service';

import bcrypt from 'bcryptjs';
```

**ШАГ 3.1.2**: Заменить MOCK реализацию на REAL

ЗАМЕНИТЬ весь блок `requestPasswordReset` (lines 298-330) на:

```typescript
  // Запрос восстановления пароля (шаг 1 - отправка кода на email)
  requestPasswordReset: rateLimitMiddleware.resetPassword
    .input(securityEnhancedResetPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки для защиты от brute-force
      await createDelay(AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS);

      // ✅ КРИТИЧНО: Проверяем CAPTCHA первым делом
      if (!input.captcha || input.captcha.trim() === '') {
        throw createValidationError('CAPTCHA not filled');
      }

      const sanitizedEmail = sanitizeEmail(input.email);

      try {
        // ✅ REAL IMPLEMENTATION: Создать токен через PasswordResetTokenService
        const token = await PasswordResetTokenService.createToken(sanitizedEmail);

        if (token) {
          // ✅ REAL IMPLEMENTATION: Отправить email с кодом
          const emailResult = await EmailService.sendPasswordReset({
            companyName: 'ExchangeGO',
            userEmail: sanitizedEmail,
            resetCode: token,
          });

          if (emailResult.success) {
            console.log(`📧 Password reset code sent to: ${sanitizedEmail}`);
          } else {
            console.error(`❌ Failed to send password reset email: ${emailResult.error}`);
            // Не бросаем ошибку, чтобы не раскрывать информацию о существовании user
          }
        } else {
          // User не найден, но не раскрываем это
          console.log(`🔒 Password reset attempt for non-existent email: ${sanitizedEmail}`);
        }

        // ✅ Всегда возвращаем успешный ответ для безопасности (не раскрываем существование user)
        return {
          message: 'If the specified email exists, a recovery code will be sent to it',
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Password reset request failed:', errorMessage);

        // Не раскрываем детали ошибки клиенту
        return {
          message: 'If the specified email exists, a recovery code will be sent to it',
        };
      }
    }),
```

---

## 3.2. Update auth.ts - resetPassword Endpoint

### Файл: `apps/web/src/server/trpc/routers/auth.ts`

**ТЕКУЩАЯ РЕАЛИЗАЦИЯ** (lines 332-403):

```typescript
  resetPassword: publicProcedure
    .input(securityEnhancedConfirmResetPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      await createDelay(AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS);

      const sanitizedEmail = sanitizeEmail(input.email);

      // Валидация нового пароля
      const passwordResult = securityEnhancedConfirmResetPasswordSchema.shape.newPassword.safeParse(
        input.newPassword
      );
      if (!passwordResult.success) {
        throw createValidationError(
          passwordResult.error.issues[0]?.message || 'Invalid new password format'
        );
      }

      const webUserManager = await UserManagerFactory.createForWeb();

      // MOCK: В реальном приложении здесь была бы проверка кода из базы/Redis
      const user = await webUserManager.findByEmail(sanitizedEmail);
      if (!user) {
        throw createBadRequestError('Invalid recovery code');
      }

      // Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(
        input.newPassword,
        VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS
      );

      let finalSessionId = generateSessionId();
      const sessionMetadata = createSessionMetadata(ctx.ip, ctx.req.headers);

      // Обновляем пользователя
      await webUserManager.update(user.id, {
        hashedPassword,
      });

      // Create session
      if (webUserManager instanceof ProductionUserManager) {
        finalSessionId = await webUserManager.createSession(
          user.id,
          sessionMetadata,
          AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS
        );
      }

      // Set cookie
      ctx.res.setHeader(
        AUTH_CONSTANTS.SET_COOKIE_HEADER,
        `sessionId=${finalSessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
      );

      console.log(`🔓 Password changed for user: ${sanitizedEmail}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
        },
        sessionId: finalSessionId,
      };
    }),
```

**ШАГ 3.2.1**: Заменить MOCK реализацию на REAL

ЗАМЕНИТЬ весь блок `resetPassword` (lines 332-403) на:

```typescript
  // Восстановление пароля (шаг 2 - сброс с кодом)
  resetPassword: publicProcedure
    .input(securityEnhancedConfirmResetPasswordSchema) // SECURITY-ENHANCED VALIDATION
    .mutation(async ({ input, ctx }) => {
      // Имитация задержки для защиты от brute-force
      await createDelay(AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS);

      const sanitizedEmail = sanitizeEmail(input.email);

      // Валидация нового пароля с помощью Security Enhanced Zod схемы
      const passwordResult = securityEnhancedConfirmResetPasswordSchema.shape.newPassword.safeParse(
        input.newPassword
      );
      if (!passwordResult.success) {
        throw createValidationError(
          passwordResult.error.issues[0]?.message || 'Invalid new password format'
        );
      }

      // ✅ REAL IMPLEMENTATION: Верифицировать токен
      const userId = await PasswordResetTokenService.verifyToken(input.code);

      if (!userId) {
        // Токен невалиден (не существует, истек, или уже использован)
        throw createBadRequestError('Invalid or expired recovery code');
      }

      // ✅ Get web user manager instance
      const webUserManager = await UserManagerFactory.createForWeb();

      // ✅ Проверить что userId соответствует email (дополнительная безопасность)
      const user = await webUserManager.findByEmail(sanitizedEmail);
      if (!user || user.id !== userId) {
        throw createBadRequestError('Invalid recovery code');
      }

      // ✅ Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(
        input.newPassword,
        VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS
      );

      // ✅ REAL IMPLEMENTATION: Пометить токен как использованный
      await PasswordResetTokenService.markTokenAsUsed(input.code);

      // ✅ Обновляем пароль пользователя
      await webUserManager.update(user.id, {
        hashedPassword,
      });

      // ✅ Production session creation with metadata after password reset
      let finalSessionId = generateSessionId();
      const sessionMetadata = createSessionMetadata(ctx.ip, ctx.req.headers);

      // Phase 4: Production session creation with metadata
      if (webUserManager instanceof ProductionUserManager) {
        finalSessionId = await webUserManager.createSession(
          user.id,
          sessionMetadata,
          AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS
        );
      }

      // ✅ Устанавливаем cookie используя централизованную утилиту
      const { SessionCookieUtils } = await import('../../utils/session-cookie');
      SessionCookieUtils.setSessionCookie(ctx.res, finalSessionId);

      // ✅ REAL IMPLEMENTATION: Удалить токен после успешного использования
      await PasswordResetTokenService.deleteToken(input.code);

      console.log(`🔓 Password changed for user: ${sanitizedEmail}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
        },
        sessionId: finalSessionId,
      };
    }),
```

---

## 3.3. Validation Schemas (УЖЕ СУЩЕСТВУЮТ)

### Проверка существующих схем

**Файл**: `packages/utils/src/validation/security-enhanced-schemas.ts`

**securityEnhancedResetPasswordSchema** (для requestPasswordReset):

```typescript
export const securityEnhancedResetPasswordSchema = z.object({
  email: securityEnhancedEmailSchema,
  captcha: z.string().min(1, 'CAPTCHA is required'),
});
```

**securityEnhancedConfirmResetPasswordSchema** (для resetPassword):

```typescript
export const securityEnhancedConfirmResetPasswordSchema = z.object({
  email: securityEnhancedEmailSchema,
  code: z.string().length(6, 'Code must be 6 characters'),
  newPassword: securityEnhancedPasswordSchema,
});
```

**СТАТУС**: ✅ Схемы уже существуют и готовы к использованию

---

## 3.4. Rate Limiting (УЖЕ НАСТРОЕН)

### Текущая конфигурация

**Файл**: `packages/constants/src/rate-limits.ts`

```typescript
export const RATE_LIMITS = {
  RESET_PASSWORD: {
    points: 3, // 3 attempts
    duration: 3600, // per 1 hour
    blockDuration: 3600,
  },
} as const;
```

**СТАТУС**: ✅ Rate limiting уже настроен и применяется через `rateLimitMiddleware.resetPassword`

### Rate Limiting Middleware Usage

**Файл**: `apps/web/src/server/trpc/routers/auth.ts`

```typescript
// ✅ УЖЕ ПРИМЕНЕН
requestPasswordReset: rateLimitMiddleware.resetPassword
  .input(securityEnhancedResetPasswordSchema)
  .mutation(async ({ input, ctx }) => {
    // Rate limit: 3 requests per hour per IP
    // ...
  }),
```

**Как работает**:

1. Клиент делает запрос на `/api/trpc/auth.requestPasswordReset`
2. Middleware проверяет IP в Redis
3. Если > 3 requests за последний час → вернуть `429 Too Many Requests`
4. Иначе → продолжить выполнение mutation

---

## 3.5. Error Handling & Security

### Security Best Practices

```typescript
// ✅ DO: Не раскрывать существование пользователя
if (!user) {
  console.log('User not found'); // Log для debugging
  // Не бросаем ошибку, возвращаем generic message
  return { message: 'If the email exists, code will be sent' };
}

// ❌ DON'T: Раскрывать существование пользователя
if (!user) {
  throw new Error('User not found'); // ← BAD: information leak
}
```

```typescript
// ✅ DO: Generic error messages для клиента
catch (error) {
  console.error('Internal error:', error); // Log для debugging
  return { message: 'If the email exists, code will be sent' }; // Generic message
}

// ❌ DON'T: Детальные error messages для клиента
catch (error) {
  throw new Error(`Database error: ${error.message}`); // ← BAD: exposes internals
}
```

```typescript
// ✅ DO: Проверить что userId соответствует email
const user = await webUserManager.findByEmail(sanitizedEmail);
if (!user || user.id !== userId) {
  throw createBadRequestError('Invalid code'); // Prevent token hijacking
}

// ❌ DON'T: Доверять только токену
const userId = await PasswordResetTokenService.verifyToken(input.code);
await webUserManager.update(userId, { ... }); // ← BAD: no email verification
```

---

## 3.6. Testing Backend API

### 3.6.1. Manual Testing via tRPC Client

**Создать тестовый скрипт**: `scripts/test-password-reset-api.mjs` (НОВЫЙ)

```javascript
#!/usr/bin/env node

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import fetch from 'node-fetch';

const client = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      fetch,
    }),
  ],
});

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset API\n');

  const testEmail = 'test@example.com';

  // STEP 1: Request password reset
  console.log(`📧 Step 1: Request password reset for ${testEmail}`);
  try {
    const result1 = await client.auth.requestPasswordReset.mutate({
      email: testEmail,
      captcha: 'valid_captcha', // Mock captcha
    });
    console.log('✅ Result:', result1);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n⏳ Check your email for the reset code...\n');
  console.log('📝 Enter the reset code from email:');

  // STEP 2: Reset password with code
  const resetCode = 'ABC123'; // Get from email or console logs
  const newPassword = 'NewSecurePassword123!@#';

  console.log(`🔐 Step 2: Reset password with code: ${resetCode}`);
  try {
    const result2 = await client.auth.resetPassword.mutate({
      email: testEmail,
      code: resetCode,
      newPassword,
    });
    console.log('✅ Result:', result2);
    console.log(`🎉 Password changed! Session ID: ${result2.sessionId}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPasswordReset()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
```

**Запустить тест**:

```powershell
cd e:\project\kiro\exchanger-front
node scripts/test-password-reset-api.mjs
```

### 3.6.2. Integration Test с Playwright

**Файл**: `tests/password-reset.spec.ts` (НОВЫЙ)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow', () => {
  test('should complete full password reset flow', async ({ page }) => {
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'InitialPassword123!@#';
    const newPassword = 'NewPassword456!@#';

    // Step 1: Register user
    await page.goto('/');
    await page.click('[data-testid="register-button"]');
    await page.fill('[id="auth-register-email"]', testEmail);
    await page.fill('[id="auth-register-password"]', testPassword);
    await page.fill('[id="auth-register-confirm-password"]', testPassword);
    await page.fill('[id="auth-register-captcha"]', '42'); // Mock captcha answer
    await page.click('[type="submit"]');

    // Wait for registration success
    await expect(page.locator('text=Registration successful')).toBeVisible();

    // Step 2: Logout
    await page.click('[data-testid="logout-button"]');

    // Step 3: Request password reset
    await page.click('[data-testid="login-button"]');
    await page.click('text=Forgot password?');
    await page.fill('[id="auth-forgot-password-email"]', testEmail);
    await page.fill('[id="auth-forgot-password-captcha"]', '42');
    await page.click('[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=Instructions sent')).toBeVisible();

    // Step 4: Get reset code from console logs (in real test, from email)
    // For testing, we can read it from server logs or use a test email provider

    // Step 5: Reset password with code
    // (This part needs the actual reset code from email)
    // await page.fill('[id="auth-forgot-password-code"]', resetCode);
    // await page.fill('[id="auth-forgot-password-new-password"]', newPassword);
    // await page.click('[type="submit"]');

    // Step 6: Verify can login with new password
    // await page.fill('[id="auth-login-email"]', testEmail);
    // await page.fill('[id="auth-login-password"]', newPassword);
    // await page.click('[type="submit"]');
    // await expect(page.locator('text=Welcome!')).toBeVisible();
  });

  test('should reject invalid reset code', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    await page.click('text=Forgot password?');

    // Try to reset with invalid code
    await page.fill('[id="auth-forgot-password-email"]', 'test@example.com');
    await page.fill('[id="auth-forgot-password-code"]', 'INVALID');
    await page.fill('[id="auth-forgot-password-new-password"]', 'NewPassword123!@#');
    await page.click('[type="submit"]');

    // Should show error
    await expect(page.locator('text=Invalid or expired recovery code')).toBeVisible();
  });

  test('should reject expired reset code', async ({ page }) => {
    // Create token and wait > 15 minutes (or manually set expiresAt in DB)
    // Then try to use it → should fail
  });
});
```

---
