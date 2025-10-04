# Phase 2: Business Logic Layer - Testing & Verification

> **Файл**: Continuation of PASSWORD_RECOVERY_PHASE_2_BUSINESS_LOGIC.md  
> **Секция**: Testing, Security, Monitoring

---

## 2.6. Testing Business Logic

### 2.6.1. PasswordResetTokenService Unit Tests

**Файл**: `packages/session-management/src/services/__tests__/password-reset-token-service.test.ts` (НОВЫЙ)

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PasswordResetTokenService } from '../password-reset-token-service';
import { getPrismaClient } from '../../database/prisma-client';

describe('PasswordResetTokenService', () => {
  const testEmail = 'test@example.com';
  let testUserId: string;

  beforeEach(async () => {
    // Создать тестового пользователя
    const prisma = getPrismaClient();
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        hashedPassword: 'hashed_password',
        isVerified: true,
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Cleanup
    const prisma = getPrismaClient();
    await prisma.passwordResetToken.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('createToken', () => {
    it('should create token for existing user', async () => {
      const token = await PasswordResetTokenService.createToken(testEmail);

      expect(token).not.toBeNull();
      expect(token).toHaveLength(6);
      expect(token).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should return null for non-existent user', async () => {
      const token = await PasswordResetTokenService.createToken('nonexistent@example.com');

      expect(token).toBeNull();
    });

    it('should delete old unused tokens before creating new one', async () => {
      const token1 = await PasswordResetTokenService.createToken(testEmail);
      const token2 = await PasswordResetTokenService.createToken(testEmail);

      expect(token1).not.toEqual(token2);

      // Проверить что старый токен удален
      const isValid1 = await PasswordResetTokenService.verifyToken(token1!);
      expect(isValid1).toBeNull();

      // Проверить что новый токен валиден
      const isValid2 = await PasswordResetTokenService.verifyToken(token2!);
      expect(isValid2).toEqual(testUserId);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const token = await PasswordResetTokenService.createToken(testEmail);
      const userId = await PasswordResetTokenService.verifyToken(token!);

      expect(userId).toEqual(testUserId);
    });

    it('should return null for invalid token', async () => {
      const userId = await PasswordResetTokenService.verifyToken('INVALID');

      expect(userId).toBeNull();
    });

    it('should return null for expired token', async () => {
      const prisma = getPrismaClient();
      const token = 'EXP123';

      await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          token,
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      const userId = await PasswordResetTokenService.verifyToken(token);

      expect(userId).toBeNull();
    });

    it('should return null for used token', async () => {
      const token = await PasswordResetTokenService.createToken(testEmail);
      await PasswordResetTokenService.markTokenAsUsed(token!);

      const userId = await PasswordResetTokenService.verifyToken(token!);

      expect(userId).toBeNull();
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      const prisma = getPrismaClient();

      // Создать expired token
      await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          token: 'EXP123',
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      // Создать active token
      const activeToken = await PasswordResetTokenService.createToken(testEmail);

      const deletedCount = await PasswordResetTokenService.cleanupExpiredTokens();

      expect(deletedCount).toBeGreaterThan(0);

      // Verify expired token deleted
      const expiredUserId = await PasswordResetTokenService.verifyToken('EXP123');
      expect(expiredUserId).toBeNull();

      // Verify active token still valid
      const activeUserId = await PasswordResetTokenService.verifyToken(activeToken!);
      expect(activeUserId).toEqual(testUserId);
    });
  });
});
```

---

## 2.7. Security Considerations

### ✅ Token Generation

- **Length**: 6 characters (36^6 = 2.2 billion combinations)
- **Charset**: Uppercase letters + digits (no ambiguous chars like O/0, I/1)
- **Collision prevention**: Retry logic with max 3 attempts
- **Uniqueness**: Database UNIQUE constraint on token column

### ✅ Token Storage

- **Database**: PostgreSQL with proper indexing
- **Encryption**: Not needed (token is single-use, short-lived)
- **TTL**: 15 minutes (configurable in AUTH_CONSTANTS)

### ✅ Token Validation

- **Checks**: Exists + Not expired + Not used
- **Rate limiting**: Enforced by RATE_LIMITS.RESET_PASSWORD (3 attempts per hour)
- **Brute force protection**: Unique constraint prevents guessing

### ✅ Email Security

- **XSS Protection**: HTML content sanitized via `sanitizeHtmlContent`
- **Template injection**: Variables replaced safely (no eval)
- **TLS**: Resend uses TLS for email transmission

### ✅ Privacy

- **User enumeration**: `createToken` returns null for non-existent users (no info leak)
- **Logging**: User email logged but reset code NOT logged in plain text
- **Cleanup**: Old tokens automatically deleted (no data retention issues)

---

## 2.8. Performance Optimization

### Database Indexes

```sql
-- ✅ Уже созданы в Phase 1 migration:
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");
CREATE INDEX "password_reset_tokens_used_expires_at_idx" ON "password_reset_tokens"("used", "expires_at");

-- 🚀 Performance:
-- - verifyToken(token): O(1) lookup via unique index
-- - createToken(email): O(1) user lookup + O(1) token insert
-- - cleanupExpiredTokens(): O(n) where n = expired tokens (efficiently filtered by index)
```

### Token Cleanup Cron Job

**Рекомендация**: Запускать каждый час через cron или background worker

**Файл**: `scripts/cleanup-password-reset-tokens.mjs` (НОВЫЙ)

```javascript
#!/usr/bin/env node

import { PasswordResetTokenService } from '@repo/session-management';

async function cleanup() {
  console.log('🧹 Starting password reset token cleanup...');

  const deletedCount = await PasswordResetTokenService.cleanupExpiredTokens();

  console.log(`✅ Deleted ${deletedCount} expired tokens`);

  const stats = await PasswordResetTokenService.getTokenStats();
  console.log('📊 Token stats:', stats);
}

cleanup()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
```

**Cron configuration** (Linux/Mac):

```bash
# Запускать каждый час
0 * * * * cd /path/to/project && node scripts/cleanup-password-reset-tokens.mjs
```

**Windows Task Scheduler**:

```powershell
# Создать scheduled task
schtasks /create /tn "CleanupPasswordResetTokens" /tr "node E:\project\kiro\exchanger-front\scripts\cleanup-password-reset-tokens.mjs" /sc hourly
```

---

## 2.9. Monitoring & Alerts

### Metrics to Track

```typescript
// Получить статистику через getTokenStats()
const stats = await PasswordResetTokenService.getTokenStats();

// Metrics:
console.log({
  total: stats.total, // Total tokens in DB
  active: stats.active, // Valid tokens (not expired, not used)
  expired: stats.expired, // Expired but not cleaned up yet
  used: stats.used, // Successfully used tokens
  successRate: stats.used / stats.total, // Success rate
});
```

### Alerts

**High Priority**:

- ⚠️ Token creation failures > 5% (database connectivity issues)
- ⚠️ Email send failures > 10% (Resend API issues)
- ⚠️ Expired tokens > 1000 (cleanup job not running)

**Medium Priority**:

- ⚡ Token collision detected (rare, but should be monitored)
- ⚡ High token request rate from single IP (potential attack)

---

## 2.10. Phase 2 Checklist

### ✅ PasswordResetTokenService

- [ ] Создать файл `packages/session-management/src/services/password-reset-token-service.ts`
- [ ] Реализовать метод `createToken(email)` с retry logic
- [ ] Реализовать метод `verifyToken(token)` с проверками (expired, used)
- [ ] Реализовать метод `markTokenAsUsed(token)`
- [ ] Реализовать метод `deleteToken(token)`
- [ ] Реализовать метод `cleanupExpiredTokens()` для cron job
- [ ] Реализовать метод `getTokenStats()` для мониторинга
- [ ] Добавить export в `packages/session-management/src/index.ts`

### ✅ Email Templates

- [ ] Создать `packages/email-service/src/templates/password-reset.html`
- [ ] Создать `packages/email-service/src/templates/password-reset.txt`
- [ ] Проверить что используется `@import url('./email-base.css')`
- [ ] Проверить placeholders: `{{companyName}}`, `{{userEmail}}`, `{{resetCode}}`, `{{createdAt}}`

### ✅ EmailTemplateService

- [ ] Добавить import для `PasswordResetEmailData` type
- [ ] Добавить метод `generatePasswordResetEmail(data)`
- [ ] Протестировать генерацию HTML и TXT content

### ✅ EmailService

- [ ] Добавить метод `sendPasswordReset(data, config?)`
- [ ] Проверить что используется `EmailTemplateService.generatePasswordResetEmail`
- [ ] Проверить что используется `EmailServiceFactory.createFromEnvironment()`
- [ ] Проверить логирование результатов

### ✅ TypeScript Types

- [ ] Добавить `PasswordResetEmailData` interface в `packages/email-service/src/types/index.ts`
- [ ] Проверить экспорт типа

### ✅ Testing

- [ ] Написать unit tests для `PasswordResetTokenService`
- [ ] Написать integration test для `EmailService.sendPasswordReset`
- [ ] Протестировать вручную через Prisma Studio
- [ ] Протестировать отправку реального email через Resend (dev env)

### ✅ Verification

- [ ] Запустить tests: `pnpm test packages/session-management`
- [ ] Запустить tests: `pnpm test packages/email-service`
- [ ] Проверить TypeScript compilation: `pnpm build`
- [ ] Проверить что нет lint errors: `pnpm lint`

---

## 2.11. Troubleshooting

### Проблема: "Cannot find module '@repo/session-management'"

**Решение**:

```powershell
# Пересобрать workspace
pnpm install
pnpm build
```

### Проблема: "Email template not found"

**Причина**: Файлы `password-reset.html` или `password-reset.txt` не созданы  
**Решение**: Создать файлы в `packages/email-service/src/templates/`

### Проблема: "Token collision after max retries"

**Причина**: Очень редкая коллизия токенов (probability ~1 in 2.2 billion)  
**Решение**:

```typescript
// Увеличить TOKEN_LENGTH с 6 до 8 в PasswordResetTokenService
private static readonly TOKEN_LENGTH = 8; // Was: 6
```

### Проблема: "Email not sent" в production

**Причина**: Resend API key не настроен  
**Решение**:

```bash
# Проверить .env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@exchangego.com
RESEND_FROM_NAME=ExchangeGO
```

---

## 2.12. Next Steps → Phase 3

После успешного завершения Phase 2:

1. ✅ `PasswordResetTokenService` создан и протестирован
2. ✅ Email templates созданы (`password-reset.html`, `password-reset.txt`)
3. ✅ `EmailService.sendPasswordReset` реализован
4. ✅ `EmailTemplateService.generatePasswordResetEmail` реализован
5. ✅ Unit tests написаны и проходят

**Следующий шаг**: Phase 3 - Backend API Layer

- Обновить `auth.ts` endpoint `requestPasswordReset` с реальной логикой
- Обновить `auth.ts` endpoint `resetPassword` с token validation
- Добавить rate limiting middleware для IP-based limits
- Интегрировать `PasswordResetTokenService` и `EmailService`
