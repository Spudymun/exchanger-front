# Password Recovery Implementation Plan

> **Роль**: Агент-кодер  
> **Дата создания**: 2025-10-04  
> **Основано на**: PASSWORD_RECOVERY_IMPACT_ANALYSIS.md, PASSWORD_RECOVERY_ARCHITECTURE_PLAN.md  
> **Статус**: 100% VERIFIED - Все паттерны проверены на реальной кодовой базе

---

## 📋 Оглавление

1. [Executive Summary](#executive-summary)
2. [Verification Results](#verification-results)
3. [Implementation Roadmap](#implementation-roadmap)
4. [Phase 1: Database Layer](#phase-1-database-layer)
5. [Phase 2: Business Logic Layer](#phase-2-business-logic-layer)
6. [Phase 3: Backend API Layer](#phase-3-backend-api-layer)
7. [Phase 4: Frontend UI Layer](#phase-4-frontend-ui-layer)
8. [Phase 5: Integration & Testing](#phase-5-integration--testing)
9. [Deployment Checklist](#deployment-checklist)

---

## 🎯 Executive Summary

### Цель

Реализовать production-ready функционал восстановления пароля для Next.js 15 приложения ExchangeGO с использованием **существующих архитектурных паттернов** проекта.

### Ключевые принципы

- ✅ **100% VERIFIED**: Все кодовые примеры основаны на реальной кодовой базе
- ✅ **NO "ВЕЛОСИПЕДЫ"**: Используем существующие Service Layer, Compound Component, Factory паттерны
- ✅ **PRODUCTION-READY**: Rate limiting, XSS protection, secure token storage
- ✅ **BACKWARD COMPATIBLE**: Не ломаем существующий код

### Что УЖЕ СУЩЕСТВУЕТ

```typescript
// ✅ Локализация готова на 100%
Layout.auth.messages = {
  passwordResetSent: 'Instructions sent',
  passwordResetSentDescription: 'Check your email',
  passwordChanged: 'Password changed',
  passwordChangedDescription: 'You can sign in with your new password',
};

// ✅ Hooks готовы на 100%
const { requestPasswordReset, resetPassword } = usePasswordMutations();

// ✅ tRPC endpoints существуют (но не реализованы)
auth.requestPasswordReset; // mock implementation
auth.resetPassword; // mock implementation

// ✅ Rate limiting настроен
RATE_LIMITS.RESET_PASSWORD = { points: 3, duration: 3600 };
```

### Что НУЖНО СОЗДАТЬ

```typescript
// ⚠️ Database
- password_reset_tokens table (Prisma migration)

// ⚠️ Business Logic
- PasswordResetTokenService (новый сервис)
- EmailService.sendPasswordReset (новый метод)
- password-reset.html/txt templates (новые файлы)

// ⚠️ Frontend UI
- ForgotPasswordRequestForm (новый компонент)
- ForgotPasswordResetForm (новый компонент)
- AUTH_FIELD_IDS.FORGOT_PASSWORD (новая секция)
- useAuthDialogs extension (новый state)
```

### Timeline Estimate

- **Phase 1 (Database)**: 30 минут
- **Phase 2 (Business Logic)**: 2 часа
- **Phase 3 (Backend API)**: 1 час
- **Phase 4 (Frontend UI)**: 2 часа
- **Phase 5 (Testing)**: 1 час
- **TOTAL**: ~6.5 часов

---

## ✅ Verification Results

### Проверенные паттерны (100% VERIFIED)

#### 1. Migration Pattern

**Источник**: `packages/session-management/prisma/migrations/20250929225352_banks/migration.sql`

```sql
-- ✅ VERIFIED: Real migration pattern
CREATE TABLE "public"."banks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "external_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "banks_external_id_key" ON "public"."banks"("external_id");
CREATE INDEX "banks_external_id_idx" ON "public"."banks"("external_id");
```

**Применение**: Создадим аналогичную структуру для `password_reset_tokens`

#### 2. Email Template Pattern (HTML)

**Источник**: `packages/email-service/src/templates/crypto-address.html`

```html
<!-- ✅ VERIFIED: Real email template pattern -->
<!DOCTYPE html>
<html lang="ru">
  <head>
    <style>
      @import url('./email-base.css');
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header header-primary">
        <div class="logo logo-primary">{{companyName}}</div>
      </div>
      <div class="info-block info-block-primary">
        <p><strong>Заказ №:</strong> {{orderId}}</p>
        <p><strong>Сумма:</strong> {{amount}} {{currency}}</p>
      </div>
    </div>
  </body>
</html>
```

**Применение**: Создадим `password-reset.html` с той же структурой

#### 3. Email Template Pattern (TXT)

**Источник**: `packages/email-service/src/templates/crypto-address.txt`

```text
==================================================
{{companyName}} - Cryptocurrency Address for Order
==================================================

Order Details
--------------------------------------------------
Order ID: {{orderId}}
Amount: {{amount}} {{currency}}
Created: {{createdAt}}

Cryptocurrency Address
--------------------------------------------------
{{cryptoAddress}}
```

**Применение**: Создадим `password-reset.txt` с той же структурой

#### 4. EmailService Pattern

**Источник**: `packages/email-service/src/services/email-service.ts`

```typescript
// ✅ VERIFIED: Real EmailService pattern
export class EmailService {
  private static logger = createEnvironmentLogger('EmailService');

  static async sendCryptoAddress(
    data: CryptoAddressEmailData,
    config?: Partial<EmailProviderConfig>
  ): Promise<EmailSendResult> {
    try {
      this.logger.info('Sending crypto address email', {
        orderId: data.orderId,
        to: data.userEmail,
      });

      // Generate email content from template
      const emailMessage = await EmailTemplateService.generateCryptoAddressEmail(data);

      // Get email provider and send
      const provider = config
        ? EmailServiceFactory.create(config)
        : EmailServiceFactory.createFromEnvironment();
      const result = await provider.send(emailMessage);

      if (result.success) {
        this.logger.info('Email sent successfully', {
          messageId: result.messageId,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Email service error', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }
}
```

**Применение**: Создадим `sendPasswordReset` по этому паттерну

#### 5. UI Component Pattern (RegisterForm)

**Источник**: `apps/web/src/components/forms/RegisterForm.tsx`

```typescript
// ✅ VERIFIED: Real AuthForm compound component usage
export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const tValidation = useTranslations('Validation');

  const form = useFormWithNextIntl<RegisterFormData>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      captcha: '',
    },
    validationSchema: fullySecurityEnhancedRegisterSchema,
    t: tValidation,
    onSubmit: async (values) => {
      await register.mutateAsync(values);
      onSuccess?.();
    },
  });

  return (
    <AuthForm form={form} isLoading={isLoading} t={tValidation}>
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <FormEmailField />
          <AuthPasswordField />
          <AuthConfirmPasswordField />
          <FormCaptchaField />
        </AuthForm.FieldWrapper>
        <AuthForm.ActionsWrapper>
          <AuthSubmitButton />
          <AuthSwitchButton onSwitch={onSwitchToLogin}>
            {t('switchToLogin')}
          </AuthSwitchButton>
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
```

**Применение**: Создадим `ForgotPasswordRequestForm` и `ForgotPasswordResetForm` по этому паттерну

#### 6. Dialog Management Pattern

**Источник**: `apps/web/src/components/app-header.tsx`

```typescript
// ✅ VERIFIED: Real useAuthDialogs hook pattern
const [isLoginDialogOpen, setIsLoginDialogOpen] = React.useState(false);
const [isRegisterDialogOpen, setIsRegisterDialogOpen] = React.useState(false);

const handleOpenLogin = React.useCallback(() => {
  setIsRegisterDialogOpen(false); // Close other dialogs
  setIsLoginDialogOpen(true);
}, []);

const handleCloseLogin = React.useCallback(() => {
  setIsLoginDialogOpen(false);
}, []);

const handleAuthSuccess = React.useCallback(() => {
  setIsLoginDialogOpen(false);
  setIsRegisterDialogOpen(false);
  // ... success logic
}, []);

const useAuthDialogs = () => ({
  isLoginDialogOpen,
  isRegisterDialogOpen,
  handleOpenLogin,
  handleOpenRegister,
  handleCloseLogin,
  handleCloseRegister,
  handleAuthSuccess,
});
```

**Применение**: Расширим `useAuthDialogs` с `isForgotPasswordOpen` state

#### 7. AUTH_FIELD_IDS Pattern

**Источник**: `packages/constants/src/auth.ts`

```typescript
// ✅ VERIFIED: Real AUTH_FIELD_IDS structure
export const AUTH_FIELD_IDS = {
  LOGIN: {
    EMAIL: 'auth-login-email',
    PASSWORD: 'auth-login-password',
    CAPTCHA: 'auth-login-captcha',
  },
  REGISTER: {
    EMAIL: 'auth-register-email',
    PASSWORD: 'auth-register-password',
    CONFIRM_PASSWORD: 'auth-register-confirm-password',
    CAPTCHA: 'auth-register-captcha',
  },
} as const;
```

**Применение**: Добавим `FORGOT_PASSWORD` секцию

#### 8. PrismaClient Import Pattern

**Источник**: `apps/web/src/server/trpc/routers/fiat.ts`, `telegram-bot.ts`

```typescript
// ✅ VERIFIED: Real PrismaClient import pattern
import { getConfiguredPrismaClient } from '../../utils/get-prisma';

const prisma = getConfiguredPrismaClient();
const banks = await prisma.bank.findMany({ where: { isActive: true } });
```

**Применение**: Используем этот паттерн в `PasswordResetTokenService`

#### 9. usePasswordMutations Hook (УЖЕ СУЩЕСТВУЕТ)

**Источник**: `apps/web/src/hooks/usePasswordMutations.ts`

```typescript
// ✅ VERIFIED: Hook already exists and ready to use
export function usePasswordMutations() {
  const notifications = useNotifications();
  const t = useTranslations('Layout.auth.messages');

  const requestPasswordReset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () =>
      notifications.success(t('passwordResetSent'), t('passwordResetSentDescription')),
    onError: (error: unknown) => notifications.handleApiError(error, 'password reset'),
  });

  const resetPassword = trpc.auth.resetPassword.useMutation({
    onSuccess: () => notifications.success(t('passwordChanged'), t('passwordChangedDescription')),
    onError: (error: unknown) => notifications.handleApiError(error, 'password change'),
  });

  return { requestPasswordReset, resetPassword, verifyEmail };
}
```

**Статус**: ✅ Готов к использованию, ничего менять не нужно

#### 10. Localization (УЖЕ СУЩЕСТВУЕТ)

**Источник**: `apps/web/messages/en/layout.json`

```json
{
  "Layout": {
    "auth": {
      "messages": {
        "passwordResetSent": "Instructions sent",
        "passwordResetSentDescription": "Check your email",
        "passwordChanged": "Password changed",
        "passwordChangedDescription": "You can sign in with your new password"
      }
    }
  }
}
```

**Статус**: ✅ Локализация готова на 100%, дополнительные ключи не нужны

---

## 🗺️ Implementation Roadmap

### Dependency Graph

```
Phase 1 (Database)
    ↓
Phase 2 (Business Logic)
    ↓
Phase 3 (Backend API)
    ↓
Phase 4 (Frontend UI)
    ↓
Phase 5 (Testing)
```

### Critical Path

1. **MUST DO FIRST**: Создать Prisma migration для `password_reset_tokens`
2. **THEN**: Реализовать `PasswordResetTokenService` с CRUD операциями
3. **THEN**: Добавить email templates и `EmailService.sendPasswordReset`
4. **THEN**: Обновить `auth.ts` endpoints с реальной логикой
5. **THEN**: Создать UI компоненты и интегрировать в auth flow
6. **FINALLY**: Тестирование полного flow

### Rollback Strategy

- **Database**: Prisma migration можно откатить через `pnpm prisma migrate resolve --rolled-back`
- **Backend**: Изменения в `auth.ts` изолированы, можно вернуть mock implementation
- **Frontend**: Новые компоненты не влияют на существующие формы

---

## 📂 Декомпозированная документация

> **Примечание**: План реализации разбит на части для удобства навигации

### Детальные файлы по фазам

1. **[PASSWORD_RECOVERY_SUMMARY.md](./PASSWORD_RECOVERY_SUMMARY.md)**  
   📋 Краткое содержание всех файлов, quick start guide, progress tracking

2. **[PASSWORD_RECOVERY_PHASE_1_DATABASE.md](./PASSWORD_RECOVERY_PHASE_1_DATABASE.md)**  
   🗄️ Phase 1: Database Layer (~30 минут)
   - Prisma schema обновление
   - Migration создание и применение
   - Verification steps
   - Rollback strategy

3. **[PASSWORD_RECOVERY_PHASE_2_BUSINESS_LOGIC.md](./PASSWORD_RECOVERY_PHASE_2_BUSINESS_LOGIC.md)**  
   📦 Phase 2: Business Logic Layer (~2 часа)
   - PasswordResetTokenService implementation
   - Email templates (HTML/TXT)
   - EmailService extension
   - EmailTemplateService extension

4. **[PASSWORD_RECOVERY_PHASE_2_TESTING.md](./PASSWORD_RECOVERY_PHASE_2_TESTING.md)**  
   🧪 Phase 2: Testing & Security
   - Unit tests для PasswordResetTokenService
   - Security considerations
   - Performance optimization
   - Monitoring & alerts

5. **[PASSWORD_RECOVERY_PHASE_3_BACKEND_API.md](./PASSWORD_RECOVERY_PHASE_3_BACKEND_API.md)**  
   🔌 Phase 3: Backend API Layer (~1 час)
   - auth.ts requestPasswordReset update
   - auth.ts resetPassword update
   - Rate limiting verification
   - Error handling & security

6. **PASSWORD_RECOVERY_PHASE_4_FRONTEND_UI.md** ⏳ TO BE CREATED  
   🎨 Phase 4: Frontend UI Layer (~2 часа)
   - ForgotPasswordRequestForm
   - ForgotPasswordResetForm
   - AUTH_FIELD_IDS extension
   - useAuthDialogs extension

7. **PASSWORD_RECOVERY_PHASE_5_TESTING.md** ⏳ TO BE CREATED  
   ✅ Phase 5: Integration & E2E Testing (~1 час)
   - Full flow testing
   - Playwright E2E tests
   - Manual testing checklist
   - Deployment checklist

### Как использовать эту документацию

```powershell
# Шаг 1: Прочитать Summary для понимания общей картины
code docs/tasks/PASSWORD_RECOVERY_SUMMARY.md

# Шаг 2: Начать с Phase 1 (Database)
code docs/tasks/PASSWORD_RECOVERY_PHASE_1_DATABASE.md
# Следовать инструкциям пошагово

# Шаг 3: Перейти к Phase 2 (Business Logic)
code docs/tasks/PASSWORD_RECOVERY_PHASE_2_BUSINESS_LOGIC.md
code docs/tasks/PASSWORD_RECOVERY_PHASE_2_TESTING.md

# Шаг 4: Перейти к Phase 3 (Backend API)
code docs/tasks/PASSWORD_RECOVERY_PHASE_3_BACKEND_API.md

# Шаг 5: Phase 4 и 5 будут созданы при необходимости
```

---
