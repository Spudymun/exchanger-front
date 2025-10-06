# 📋 PHASE 3: Backend API Layer - Детальное объяснение изменений

## 🎯 Цель Phase 3

Заменить MOCK implementation на Production implementation с использованием:

- `PasswordResetTokenService` (создан в Phase 2)
- `EmailService.sendPasswordReset()` (создан в Phase 2)
- Real database storage для токенов
- Real email отправка

---

## 📍 ГДЕ МЕНЯЕМ КОД

**Файл:** `apps/web/src/server/trpc/routers/auth.ts`

**2 метода требуют изменений:**

1. `requestPasswordReset` (строки 298-329) - **Шаг 1: Запрос на сброс**
2. `resetPassword` (строки 332-398) - **Шаг 2: Применение нового пароля**

---

## 🔄 ИЗМЕНЕНИЕ #1: `requestPasswordReset`

### 📌 ТЕКУЩИЙ КОД (MOCK - строки 298-329)

```typescript
requestPasswordReset: rateLimitMiddleware.resetPassword
  .input(securityEnhancedResetPasswordSchema)
  .mutation(async ({ input }) => {
    await createDelay(AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS);

    const sanitizedEmail = sanitizeEmail(input.email);
    const webUserManager = await UserManagerFactory.createForWeb();

    // Проверяем, существует ли пользователь
    const user = await webUserManager.findByEmail(sanitizedEmail);
    if (!user) {
      console.log(`🔒 Password reset attempt for non-existent email: ${sanitizedEmail}`);
    } else {
      console.log(`🔑 Password reset request for: ${sanitizedEmail}`);

      // ❌ MOCK: Генерация FAKE токена через Math.random()
      const resetCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

      // ❌ MOCK: Токен выводится в console.log, НЕ сохраняется в БД
      console.log(`📧 Recovery code for ${sanitizedEmail}: ${resetCode}`);

      // ❌ MOCK: Email НЕ отправляется
    }

    return {
      message: 'If the specified email exists, a recovery code will be sent to it',
    };
  }),
```

**ПРОБЛЕМЫ:**

- ❌ `Math.random()` - не crypto-safe
- ❌ Токен НЕ сохраняется в `password_reset_tokens` таблице
- ❌ Email НЕ отправляется пользователю
- ❌ Нет TTL (токен живет вечно в console.log)
- ❌ Нет cleanup старых токенов

---

### ✅ НОВЫЙ КОД (PRODUCTION)

```typescript
// 1️⃣ ДОБАВИМ ИМПОРТЫ В НАЧАЛО ФАЙЛА (после строки 7)
import {
  UserManagerFactory,
  ProductionUserManager,
  PasswordResetTokenService, // 🆕 НОВЫЙ
  type UserManagerInterface,
  type User,
} from '@repo/session-management';

import {
  EmailService, // 🆕 НОВЫЙ
  type PasswordResetEmailData, // 🆕 НОВЫЙ
} from '@repo/email-service';

// 2️⃣ ЗАМЕНИМ МЕТОД requestPasswordReset (строки 298-329)
requestPasswordReset: rateLimitMiddleware.resetPassword
  .input(securityEnhancedResetPasswordSchema)
  .mutation(async ({ input }) => {
    await createDelay(AUTH_CONSTANTS.LOGIN_REQUEST_DELAY_MS);

    const sanitizedEmail = sanitizeEmail(input.email);

    try {
      // ✅ PRODUCTION: Создать токен через PasswordResetTokenService
      // - Автоматически проверит существование пользователя
      // - Сгенерирует crypto-safe 6-значный токен
      // - Сохранит в БД с TTL 15 минут
      // - Удалит старые неиспользованные токены этого пользователя
      const token = await PasswordResetTokenService.createToken(sanitizedEmail);

      if (token) {
        // ✅ PRODUCTION: Отправить email через EmailService
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

        const emailData: PasswordResetEmailData = {
          token,
          expiresAt,
          userEmail: sanitizedEmail,
        };

        const emailResult = await EmailService.sendPasswordReset(emailData);

        if (emailResult.success) {
          console.log(`✅ Password reset email sent to: ${sanitizedEmail}`);
        } else {
          console.error(`❌ Failed to send email to: ${sanitizedEmail}`, emailResult.error);
        }
      } else {
        // Пользователь не существует - не раскрываем это
        console.log(`🔒 Password reset attempt for non-existent email: ${sanitizedEmail}`);
      }
    } catch (error) {
      console.error('Error in requestPasswordReset:', error);
      // Не пробрасываем ошибку наружу для security
    }

    // ✅ Всегда возвращаем успешный ответ (security best practice)
    return {
      message: 'If the specified email exists, a recovery code will be sent to it',
    };
  }),
```

---

### 🔍 ЧТО ПРОИСХОДИТ ВНУТРИ (Flow Diagram)

```
USER REQUEST
    ↓
[1] rateLimitMiddleware.resetPassword
    │   - Проверка rate limit (макс 5 попыток/15мин)
    ↓
[2] securityEnhancedResetPasswordSchema
    │   - Валидация email (XSS protection)
    │   - Проверка captcha
    ↓
[3] sanitizeEmail(input.email)
    │   - Нормализация email (lowercase, trim)
    ↓
[4] PasswordResetTokenService.createToken(email)
    │   ├─ getPrismaClient() - singleton connection
    │   ├─ prisma.user.findUnique({ where: { email }})
    │   │   ├─ if (!user) → return null (не раскрываем)
    │   │   └─ if (user) → продолжаем
    │   ├─ prisma.passwordResetToken.deleteMany()
    │   │   - Удаляем старые неиспользованные токены этого user
    │   ├─ generateToken() с retry logic (max 3 попытки)
    │   │   ├─ crypto.getRandomValues() - crypto-safe random
    │   │   ├─ Генерация 6-char код: ABC123
    │   │   └─ prisma.passwordResetToken.create({
    │   │       userId, token, expiresAt: now + 15min
    │   │     })
    │   └─ return token (или null если user не найден)
    ↓
[5] if (token) → EmailService.sendPasswordReset()
    │   ├─ EmailTemplateService.generatePasswordResetEmail()
    │   │   ├─ Загрузить templates/password-reset.html
    │   │   ├─ Загрузить templates/password-reset.txt
    │   │   └─ Заменить {{token}}, {{expiresAt}}, {{companyName}}
    │   ├─ EmailServiceFactory.createFromEnvironment()
    │   │   - Выбор provider (MOCK/SendGrid/Resend/Gmail)
    │   └─ provider.send({ to, subject, html, text })
    ↓
[6] Return success message (всегда, для security)
    ↓
RESPONSE TO USER
```

---

### 📊 ТАБЛИЦА В БД ПОСЛЕ ВЫЗОВА

**Таблица:** `password_reset_tokens`

| id (UUID) | user_id (UUID) | token  | expires_at          | created_at          | used  | used_at |
| --------- | -------------- | ------ | ------------------- | ------------------- | ----- | ------- |
| uuid-123  | user-uuid-456  | A3X7K9 | 2025-10-04 15:45:00 | 2025-10-04 15:30:00 | false | null    |

**Индексы работают:**

- `token` (unique) - быстрый поиск при верификации
- `(token, userId, expiresAt, used)` (composite) - быстрая проверка валидности

---

### 📧 EMAIL КОТОРЫЙ ПОЛУЧИТ ПОЛЬЗОВАТЕЛЬ

**Subject:** `🔐 Восстановление пароля - [Company Name]`

**HTML версия:**

```html
<!DOCTYPE html>
<html>
  <body>
    <div class="token-code">
      <div>🔐 Ваш код восстановления</div>
      <div class="token-value">A3X7K9</div>
      <div>Действителен 15 минут</div>
    </div>

    <div>📝 Инструкция:</div>
    <ol>
      <li>Скопируйте код выше</li>
      <li>Вернитесь на страницу восстановления пароля</li>
      <li>Введите код в форму</li>
      <li>Создайте новый пароль</li>
    </ol>

    <div class="security-notice">
      🛡️ Безопасность: • Никому не сообщайте этот код • Код можно использовать только один раз
    </div>
  </body>
</html>
```

**Text версия (для email клиентов без HTML):**

```
==================================================
🔐 [Company Name] - Восстановление пароля
==================================================

ВАШ КОД ВОССТАНОВЛЕНИЯ:

>>> A3X7K9 <<<

Действителен до: 04 октября 2025 г., 15:45

📝 ИНСТРУКЦИЯ:
1. Скопируйте код выше
2. Вернитесь на страницу восстановления пароля
3. Введите код в форму
4. Создайте новый пароль
```

---

## 🔄 ИЗМЕНЕНИЕ #2: `resetPassword`

### 📌 ТЕКУЩИЙ КОД (MOCK - строки 332-398)

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
      throw createValidationError('Invalid new password format');
    }

    const webUserManager = await UserManagerFactory.createForWeb();

    // ❌ MOCK: "В реальном приложении здесь была бы проверка кода"
    // ❌ MOCK: Просто проверяем существование пользователя
    const user = await webUserManager.findByEmail(sanitizedEmail);
    if (!user) {
      throw createBadRequestError('Invalid recovery code');
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(input.newPassword, 10);

    // Обновляем пользователя
    await webUserManager.update(user.id, { hashedPassword });

    // Создаём сессию
    let finalSessionId = generateSessionId();
    const sessionMetadata = createSessionMetadata(ctx.ip, ctx.req.headers);

    if (webUserManager instanceof ProductionUserManager) {
      finalSessionId = await webUserManager.createSession(
        user.id,
        sessionMetadata,
        AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS
      );
    }

    // Устанавливаем cookie
    ctx.res.setHeader(
      'Set-Cookie',
      `sessionId=${finalSessionId}; HttpOnly; Path=/; Max-Age=...`
    );

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

**ПРОБЛЕМЫ:**

- ❌ НЕТ проверки токена `input.code`
- ❌ НЕТ проверки TTL (токен expired?)
- ❌ НЕТ проверки `used` (токен уже использован?)
- ❌ НЕТ пометки токена как использованного
- ❌ Любой может сбросить пароль, зная только email

---

### ✅ НОВЫЙ КОД (PRODUCTION)

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
      throw createValidationError('Invalid new password format');
    }

    // ✅ PRODUCTION: Проверить токен через PasswordResetTokenService
    // - Проверит существование токена в БД
    // - Проверит TTL (не expired?)
    // - Проверит used=false (не использован ранее?)
    // - Вернёт userId если всё OK
    const userId = await PasswordResetTokenService.verifyToken(input.code);

    if (!userId) {
      // Токен invalid/expired/used
      throw createBadRequestError('Invalid or expired recovery code');
    }

    const webUserManager = await UserManagerFactory.createForWeb();

    // Получаем пользователя по userId (не по email!)
    const user = await webUserManager.findById(userId);
    if (!user) {
      throw createBadRequestError('User not found');
    }

    // ✅ Дополнительная проверка: email из токена совпадает с email из запроса?
    if (user.email !== sanitizedEmail) {
      console.error(`❌ Email mismatch: token userId=${userId}, request email=${sanitizedEmail}`);
      throw createBadRequestError('Invalid recovery code');
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(
      input.newPassword,
      VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS
    );

    // Обновляем пользователя
    await webUserManager.update(user.id, { hashedPassword });

    // ✅ PRODUCTION: Пометить токен как использованный
    // - Установит used=true, usedAt=now
    // - Предотвращает повторное использование
    const marked = await PasswordResetTokenService.markTokenAsUsed(input.code);
    if (!marked) {
      console.warn(`⚠️ Failed to mark token as used: ${input.code}`);
    }

    // Создаём сессию
    let finalSessionId = generateSessionId();
    const sessionMetadata = createSessionMetadata(ctx.ip, ctx.req.headers);

    if (webUserManager instanceof ProductionUserManager) {
      finalSessionId = await webUserManager.createSession(
        user.id,
        sessionMetadata,
        AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS
      );
    }

    // Устанавливаем cookie
    ctx.res.setHeader(
      AUTH_CONSTANTS.SET_COOKIE_HEADER,
      `sessionId=${finalSessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
    );

    console.log(`✅ Password reset completed for user: ${sanitizedEmail}`);

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

### 🔍 ЧТО ПРОИСХОДИТ ВНУТРИ (Flow Diagram)

```
USER REQUEST (with token from email)
    ↓
[1] securityEnhancedConfirmResetPasswordSchema
    │   - Валидация email, code, newPassword (XSS protection)
    ↓
[2] sanitizeEmail(input.email)
    ↓
[3] PasswordResetTokenService.verifyToken(input.code)
    │   ├─ getPrismaClient()
    │   ├─ prisma.passwordResetToken.findUnique({
    │   │     where: { token: input.code },
    │   │     select: { userId, expiresAt, used }
    │   │   })
    │   ├─ if (!resetToken) → return null ❌
    │   ├─ if (resetToken.used === true) → return null ❌
    │   ├─ if (resetToken.expiresAt < now) → return null ❌
    │   └─ if (all checks pass) → return resetToken.userId ✅
    ↓
[4] if (!userId) → throw 'Invalid or expired recovery code'
    ↓
[5] webUserManager.findById(userId)
    │   - Получаем user из БД по userId из токена
    ↓
[6] if (user.email !== sanitizedEmail) → throw error
    │   - Защита от token stealing attacks
    ↓
[7] bcrypt.hash(input.newPassword, 10)
    │   - Хеширование нового пароля
    ↓
[8] webUserManager.update(user.id, { hashedPassword })
    │   - Обновление пароля в БД
    ↓
[9] PasswordResetTokenService.markTokenAsUsed(input.code)
    │   ├─ prisma.passwordResetToken.updateMany({
    │   │     where: { token, used: false },
    │   │     data: { used: true, usedAt: now }
    │   │   })
    │   └─ Токен больше нельзя использовать!
    ↓
[10] webUserManager.createSession()
     │   - Создание новой сессии в Redis
     ↓
[11] Set-Cookie: sessionId=...
     │   - Автоматический login после reset
     ↓
RESPONSE TO USER (with session)
```

---

### 📊 ТАБЛИЦА В БД ПОСЛЕ ВЫЗОВА

**Таблица:** `password_reset_tokens`

| id       | user_id  | token  | expires_at       | created_at       | used        | used_at                 |
| -------- | -------- | ------ | ---------------- | ---------------- | ----------- | ----------------------- |
| uuid-123 | user-456 | A3X7K9 | 2025-10-04 15:45 | 2025-10-04 15:30 | **true** ✅ | **2025-10-04 15:42** ✅ |

**Таблица:** `users`

| id       | email            | hashed_password                  |
| -------- | ---------------- | -------------------------------- |
| user-456 | user@example.com | **$2a$10$NEW_HASH** ✅ (изменён) |

**Redis:** `session:new-session-id`

```json
{
  "userId": "user-456",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2025-10-04T15:42:00.000Z"
}
```

---

## 🛡️ БЕЗОПАСНОСТЬ

### Защиты в новой реализации:

1. **Crypto-safe token generation**
   - `crypto.getRandomValues()` вместо `Math.random()`
   - 36^6 = 2.2 billion combinations

2. **TTL (Time To Live)**
   - Токен живёт 15 минут
   - Автоматически становится invalid после expiration

3. **One-time use**
   - `used=true` после первого использования
   - Невозможно использовать токен дважды

4. **Email mismatch protection**
   - Проверка `user.email === input.email`
   - Защита от token stealing

5. **Rate limiting**
   - `rateLimitMiddleware.resetPassword` (5 попыток/15мин)
   - Защита от brute force

6. **Security through obscurity**
   - Всегда возвращаем "success" даже если user не существует
   - Не раскрываем информацию о существовании аккаунтов

7. **Automatic cleanup**
   - `PasswordResetTokenService.cleanupExpiredTokens()`
   - Можно запускать через cron job

---

## 📈 МОНИТОРИНГ

### Логи которые будут писаться:

```typescript
// requestPasswordReset
✅ Password reset email sent to: user@example.com
❌ Failed to send email to: user@example.com (error details)
🔒 Password reset attempt for non-existent email: fake@example.com

// resetPassword
✅ Password reset completed for user: user@example.com
❌ Email mismatch: token userId=123, request email=wrong@example.com
⚠️ Failed to mark token as used: A3X7K9
```

### Метрики через getTokenStats():

```typescript
const stats = await PasswordResetTokenService.getTokenStats();
// {
//   total: 150,      // всего токенов в БД
//   active: 12,      // валидные неиспользованные токены
//   expired: 85,     // просроченные (нужен cleanup)
//   used: 53         // использованные токены
// }
```

---

## 🧪 ПРИМЕРЫ ЗАПРОСОВ/ОТВЕТОВ

### **Scenario 1: Успешный flow**

#### **Request 1: requestPasswordReset**

```typescript
POST /api/trpc/auth.requestPasswordReset
{
  "email": "user@example.com",
  "captcha": "solved"
}
```

#### **Response 1:**

```json
{
  "message": "If the specified email exists, a recovery code will be sent to it"
}
```

#### **БД после Request 1:**

```sql
SELECT * FROM password_reset_tokens WHERE user_id = 'user-456';
-- token='A3X7K9', expires_at='2025-10-04 15:45', used=false
```

#### **Email отправлен:**

```
To: user@example.com
Subject: 🔐 Восстановление пароля
Body: Ваш код: A3X7K9
```

---

#### **Request 2: resetPassword (через 2 минуты)**

```typescript
POST /api/trpc/auth.resetPassword
{
  "email": "user@example.com",
  "code": "A3X7K9",
  "newPassword": "NewSecurePass123!"
}
```

#### **Response 2:**

```json
{
  "user": {
    "id": "user-456",
    "email": "user@example.com",
    "isVerified": true
  },
  "sessionId": "new-session-uuid"
}
```

#### **Set-Cookie header:**

```
sessionId=new-session-uuid; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax
```

#### **БД после Request 2:**

```sql
SELECT * FROM password_reset_tokens WHERE token = 'A3X7K9';
-- used=true, used_at='2025-10-04 15:32'

SELECT hashed_password FROM users WHERE id = 'user-456';
-- hashed_password='$2a$10$NEW_HASH' (изменён!)
```

---

### **Scenario 2: Token expired**

#### **Request: resetPassword (через 20 минут после создания токена)**

```typescript
POST /api/trpc/auth.resetPassword
{
  "email": "user@example.com",
  "code": "A3X7K9",
  "newPassword": "NewPass123!"
}
```

#### **Response: ❌ Error**

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid or expired recovery code"
  }
}
```

**Причина:** `resetToken.expiresAt < now` → `verifyToken()` вернул `null`

---

### **Scenario 3: Token already used**

#### **Request: resetPassword (повторный запрос с тем же токеном)**

```typescript
POST /api/trpc/auth.resetPassword
{
  "email": "user@example.com",
  "code": "A3X7K9",
  "newPassword": "AnotherPass123!"
}
```

#### **Response: ❌ Error**

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid or expired recovery code"
  }
}
```

**Причина:** `resetToken.used === true` → `verifyToken()` вернул `null`

---

### **Scenario 4: Email mismatch (token stealing attempt)**

#### **Request: resetPassword с чужим email**

```typescript
POST /api/trpc/auth.resetPassword
{
  "email": "attacker@example.com",  // ❌ Не совпадает с owner токена
  "code": "A3X7K9",                 // токен принадлежит user@example.com
  "newPassword": "HackedPass123!"
}
```

#### **Response: ❌ Error**

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid recovery code"
  }
}
```

**Причина:** `user.email !== sanitizedEmail` → защита от token stealing

---

## 📝 ИТОГОВЫЙ CHECKLIST

После Phase 3 у нас будет:

✅ **requestPasswordReset:**

- [x] Создание токена в БД через `PasswordResetTokenService.createToken()`
- [x] Crypto-safe генерация (36^6 combinations)
- [x] TTL 15 минут
- [x] Удаление старых токенов пользователя
- [x] Отправка email через `EmailService.sendPasswordReset()`
- [x] HTML + Text версии email
- [x] Security: всегда возвращаем success

✅ **resetPassword:**

- [x] Проверка токена через `PasswordResetTokenService.verifyToken()`
- [x] Проверка TTL (не expired?)
- [x] Проверка used=false (не использован?)
- [x] Проверка email mismatch (защита от stealing)
- [x] Обновление пароля
- [x] Пометка токена как использованного `markTokenAsUsed()`
- [x] Автоматический login (создание сессии)

✅ **Безопасность:**

- [x] Rate limiting (5 попыток/15мин)
- [x] XSS protection (security-enhanced schemas)
- [x] SQL injection protection (Prisma ORM)
- [x] Crypto-safe random
- [x] One-time use tokens
- [x] Email mismatch protection

✅ **Мониторинг:**

- [x] Детальные логи (success/error/warning)
- [x] Email delivery tracking
- [x] Token statistics через `getTokenStats()`

---

## 🚀 ГОТОВЫ К ВНЕДРЕНИЮ?

Если всё понятно, я могу приступить к изменению кода в `auth.ts`.

**Что будет сделано:**

1. Добавить импорты `PasswordResetTokenService`, `EmailService`
2. Заменить метод `requestPasswordReset` (строки 298-329)
3. Заменить метод `resetPassword` (строки 332-398)
4. Проверить отсутствие ошибок компиляции

**Подтверждаешь?** 🎯
