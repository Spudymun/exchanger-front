# 🎨 PHASE 4: Frontend UI Implementation Plan (Part 2/3)

**Дата**: 5 октября 2025  
**Continuation of**: PASSWORD_RECOVERY_PHASE_4_PLAN_PART_1.md

---

## 3️⃣ IMPLEMENTATION PLAN: NEW COMPONENTS

### Component 1: FormResetCodeField ❌ NEW

**Файл**: `packages/ui/src/components/form-fields/FormResetCodeField.tsx`

**Verified pattern source**: `FormEmailField.tsx` (100% same structure)

**Implementation**:

```tsx
import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { FormField, FormControl, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

/**
 * Reset Code Field для password recovery
 * Следует pattern FormEmailField
 */
export interface ResetCodeFormFields extends Record<string, unknown> {
  resetCode: string;
}

interface FormResetCodeFieldProps<T extends ResetCodeFormFields = ResetCodeFormFields> {
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;
  fieldId?: string;
}

export const FormResetCodeField = <T extends ResetCodeFormFields = ResetCodeFormFields>({
  form,
  isLoading = false,
  t,
  fieldId = 'resetCode',
}: FormResetCodeFieldProps<T>) => {
  // Guard clause (следуем pattern других field компонентов)
  if (!form || !t) {
    console.warn('FormResetCodeField: form and t props are required when used without context');
    return (
      <div className="text-sm text-muted-foreground">Reset code field requires form context</div>
    );
  }

  return (
    <FormField name="resetCode" error={form.errors.resetCode}>
      <FormLabel htmlFor={fieldId} className="required">
        {t('resetCode.label')}
      </FormLabel>
      <FormControl>
        <Input
          {...form.getFieldProps('resetCode')}
          id={fieldId}
          type="text"
          placeholder={t('resetCode.placeholder')}
          disabled={isLoading}
          maxLength={6}
          autoComplete="off"
          required
        />
      </FormControl>
      <FormMessage />
    </FormField>
  );
};
```

**Ключевые решения**:

- ✅ Generic type parameter: `T extends ResetCodeFormFields`
- ✅ 100% аналогично `FormEmailField` structure
- ✅ type="text" (не password) - код виден
- ✅ maxLength={6} - ограничение по schema
- ✅ autoComplete="off" - не сохранять код

**Экспорт** (update):
**Файл**: `packages/ui/src/components/form-fields/index.ts`

```typescript
export { FormEmailField } from './FormEmailField';
export { FormCaptchaField } from './FormCaptchaField';
export { FormResetCodeField } from './FormResetCodeField'; // ✅ ADD

// Re-export типов
export type { EmailFormFields, CaptchaFormFields } from '../../types/auth-fields';
export type { ResetCodeFormFields } from './FormResetCodeField'; // ✅ ADD
```

---

### Component 2: RequestResetForm ❌ NEW

**Файл**: `apps/web/src/components/forms/RequestResetForm.tsx`

**Verified pattern source**: `LoginForm.tsx` (90% same structure)

**Implementation**:

```tsx
'use client';

import { AUTH_FIELD_IDS } from '@repo/constants';
import { useFormWithNextIntl, UseFormReturn } from '@repo/hooks';
import { AuthForm, FormEmailField, FormCaptchaField, AuthSubmitButton } from '@repo/ui';
import { securityEnhancedResetPasswordSchema, SecurityEnhancedResetPassword } from '@repo/utils';
import { useTranslations } from 'next-intl';
import React from 'react';

import { usePasswordMutations } from '../../hooks/usePasswordMutations';

/**
 * Request Password Reset Form
 * Step 1: Request reset code via email
 *
 * Следует pattern LoginForm.tsx
 */

interface RequestResetFormProps {
  onSuccess?: (email: string) => void;
  onBackToLogin?: () => void;
}

// Custom hook для логики формы (следуем LoginForm pattern)
function useRequestResetForm(onSuccess?: (email: string) => void) {
  const { requestPasswordReset } = usePasswordMutations();
  const tValidation = useTranslations('AdvancedExchangeForm');

  const form = useFormWithNextIntl<SecurityEnhancedResetPassword>({
    initialValues: {
      email: '',
      captcha: '',
    },
    validationSchema: securityEnhancedResetPasswordSchema,
    t: tValidation,
    onSubmit: async (values: SecurityEnhancedResetPassword) => {
      await requestPasswordReset.mutateAsync({
        email: values.email,
        captcha: values.captcha,
      });

      // После успеха вызываем callback с email для следующего шага
      if (onSuccess) {
        onSuccess(values.email);
      }
    },
  });

  return { form, tValidation };
}

export function RequestResetForm({ onSuccess, onBackToLogin }: RequestResetFormProps) {
  const { form, tValidation } = useRequestResetForm(onSuccess);
  const { requestPasswordReset } = usePasswordMutations();
  const t = useTranslations('Layout.forms.forgotPassword');

  return (
    <AuthForm
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      isLoading={form.isSubmitting || requestPasswordReset.isPending}
      t={tValidation}
      fieldId={AUTH_FIELD_IDS.FORGOT_PASSWORD.EMAIL}
      formType="login" // Используем login для консистентности стилей
      defaultErrorStyling="disabled"
    >
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <FormEmailField />
          <FormCaptchaField />
        </AuthForm.FieldWrapper>

        <AuthForm.ActionsWrapper>
          <AuthSubmitButton>
            {requestPasswordReset.isPending ? t('requesting') : t('requestButton')}
          </AuthSubmitButton>

          {onBackToLogin && (
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={requestPasswordReset.isPending}
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

**Ключевые решения**:

- ✅ Custom hook pattern: `useRequestResetForm()`
- ✅ `securityEnhancedResetPasswordSchema` ✅ EXISTS
- ✅ `usePasswordMutations()` ✅ EXISTS
- ✅ Fields: `FormEmailField` + `FormCaptchaField` ✅ REUSE
- ✅ `onSuccess(email)` - передаём email для следующего шага
- ✅ `onBackToLogin` - возврат к login form
- ✅ AUTH_FIELD_IDS.FORGOT_PASSWORD.EMAIL (нужно добавить)

---

### Component 3: ConfirmResetForm ❌ NEW

**Файл**: `apps/web/src/components/forms/ConfirmResetForm.tsx`

**Verified pattern source**: `LoginForm.tsx` (85% same structure)

**Implementation**:

```tsx
'use client';

import { AUTH_FIELD_IDS } from '@repo/constants';
import { useFormWithNextIntl, UseFormReturn } from '@repo/hooks';
import {
  AuthForm,
  FormEmailField,
  AuthPasswordField,
  FormResetCodeField,
  AuthSubmitButton,
} from '@repo/ui';
import {
  securityEnhancedConfirmResetPasswordSchema,
  SecurityEnhancedConfirmResetPassword,
} from '@repo/utils';
import { useTranslations } from 'next-intl';
import React from 'react';

import { usePasswordMutations } from '../../hooks/usePasswordMutations';

/**
 * Confirm Password Reset Form
 * Step 2: Enter code + new password
 *
 * Следует pattern LoginForm.tsx
 */

interface ConfirmResetFormProps {
  email: string; // Передаётся из RequestResetForm
  onSuccess?: () => void;
  onBackToRequest?: () => void;
}

// Custom hook для логики формы
function useConfirmResetForm(email: string, onSuccess?: () => void) {
  const { resetPassword } = usePasswordMutations();
  const tValidation = useTranslations('AdvancedExchangeForm');

  const form = useFormWithNextIntl<SecurityEnhancedConfirmResetPassword>({
    initialValues: {
      email: email, // Pre-fill из предыдущего шага
      resetCode: '',
      newPassword: '',
    },
    validationSchema: securityEnhancedConfirmResetPasswordSchema,
    t: tValidation,
    onSubmit: async (values: SecurityEnhancedConfirmResetPassword) => {
      await resetPassword.mutateAsync({
        email: values.email,
        resetCode: values.resetCode,
        newPassword: values.newPassword,
      });

      // После успеха пользователь автоматически залогинен (см. backend)
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  return { form, tValidation };
}

export function ConfirmResetForm({ email, onSuccess, onBackToRequest }: ConfirmResetFormProps) {
  const { form, tValidation } = useConfirmResetForm(email, onSuccess);
  const { resetPassword } = usePasswordMutations();
  const t = useTranslations('Layout.forms.forgotPassword');

  return (
    <AuthForm
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      isLoading={form.isSubmitting || resetPassword.isPending}
      t={tValidation}
      fieldId={AUTH_FIELD_IDS.FORGOT_PASSWORD.RESET_CODE}
      formType="login"
      defaultErrorStyling="disabled"
    >
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <FormEmailField /> {/* Pre-filled, но можно изменить */}
          <FormResetCodeField /> {/* ✅ NEW COMPONENT */}
          <AuthPasswordField fieldId={AUTH_FIELD_IDS.FORGOT_PASSWORD.NEW_PASSWORD} />
          {/* Hint: Code expires in 15 minutes */}
          <p className="text-xs text-muted-foreground">{t('codeExpires')}</p>
        </AuthForm.FieldWrapper>

        <AuthForm.ActionsWrapper>
          <AuthSubmitButton>
            {resetPassword.isPending ? t('resetting') : t('resetButton')}
          </AuthSubmitButton>

          {onBackToRequest && (
            <button
              type="button"
              onClick={onBackToRequest}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={resetPassword.isPending}
            >
              {t('didntReceive')} {t('resendCode')}
            </button>
          )}
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
```

**Ключевые решения**:

- ✅ Custom hook pattern: `useConfirmResetForm()`
- ✅ `securityEnhancedConfirmResetPasswordSchema` ✅ EXISTS
- ✅ `usePasswordMutations()` ✅ EXISTS
- ✅ Fields: `FormEmailField` + `FormResetCodeField` (NEW) + `AuthPasswordField` ✅ REUSE
- ✅ Pre-fill email из предыдущего шага
- ✅ `onBackToRequest` - возврат к request form (resend code)
- ✅ Hint text: "Code expires in 15 minutes"

---

### Component 4: ForgotPasswordForms ❌ NEW

**Файл**: `apps/web/src/components/forms/ForgotPasswordForms.tsx`

**Verified pattern source**: `AuthForms.tsx` (70% same structure)

**Implementation**:

```tsx
'use client';

import React from 'react';

import { RequestResetForm } from './RequestResetForm';
import { ConfirmResetForm } from './ConfirmResetForm';

interface ForgotPasswordFormsProps {
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

type ForgotPasswordStep = 'request' | 'confirm';

/**
 * Forgot Password Forms Container
 *
 * Управляет переключением между шагами:
 * 1. Request reset code (email + captcha)
 * 2. Confirm reset (email + code + new password)
 *
 * НЕ использует AuthFormLayout (он только для login/register toggle)
 * Простой линейный flow: request → confirm → success (auto-login)
 */
export const ForgotPasswordForms = React.memo<ForgotPasswordFormsProps>(
  ({ onSuccess, onBackToLogin }) => {
    const [step, setStep] = React.useState<ForgotPasswordStep>('request');
    const [email, setEmail] = React.useState<string>('');

    // Success handler для request step
    const handleRequestSuccess = React.useCallback((submittedEmail: string) => {
      setEmail(submittedEmail);
      setStep('confirm');
    }, []);

    // Back to request handler (resend code)
    const handleBackToRequest = React.useCallback(() => {
      setStep('request');
    }, []);

    return (
      <div className="forgot-password-forms-container">
        {step === 'request' && (
          <RequestResetForm onSuccess={handleRequestSuccess} onBackToLogin={onBackToLogin} />
        )}

        {step === 'confirm' && (
          <ConfirmResetForm
            email={email}
            onSuccess={onSuccess}
            onBackToRequest={handleBackToRequest}
          />
        )}
      </div>
    );
  }
);

ForgotPasswordForms.displayName = 'ForgotPasswordForms';
```

**Ключевые решения**:

- ✅ State management: `step: 'request' | 'confirm'`
- ✅ Email передаётся между шагами через state
- ✅ `handleRequestSuccess` - переход к confirm step
- ✅ `handleBackToRequest` - возврат к request (resend)
- ✅ ❌ **НЕ использует AuthFormLayout** (линейный flow, не toggle)
- ✅ React.memo для оптимизации

**Export** (update):
**Файл**: `apps/web/src/components/forms/index.ts`

```typescript
export { AuthForms } from './AuthForms';
export { LoginForm } from './LoginForm';
export { RegisterForm } from './RegisterForm';
export { ForgotPasswordForms } from './ForgotPasswordForms'; // ✅ ADD
export { RequestResetForm } from './RequestResetForm'; // ✅ ADD (optional)
export { ConfirmResetForm } from './ConfirmResetForm'; // ✅ ADD (optional)
```

---

## 4️⃣ IMPLEMENTATION PLAN: UPDATES TO EXISTING FILES

### Update 1: AUTH_FIELD_IDS Constants

**Файл**: `packages/constants/src/auth.ts`

**Current state** (verified):

```typescript
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

**Change required**:

```typescript
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
  // ✅ ADD FORGOT_PASSWORD
  FORGOT_PASSWORD: {
    EMAIL: 'auth-forgot-password-email',
    CAPTCHA: 'auth-forgot-password-captcha',
    RESET_CODE: 'auth-forgot-password-reset-code',
    NEW_PASSWORD: 'auth-forgot-password-new-password',
  },
} as const;
```

**Exact location to edit**:

- Line ~25-40 (after REGISTER block)
- BEFORE `export type AuthFieldId = ...`

---

### Update 2: AuthDialogs Component

**Файл**: `apps/web/src/components/auth-dialogs.tsx`

**Current interface** (verified):

```typescript
interface AuthDialogsProps {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  onLoginClose: () => void;
  onRegisterClose: () => void;
  onAuthSuccess?: () => void;
}
```

**Changes required**:

**Step 1: Update interface**

```typescript
interface AuthDialogsProps {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  isForgotPasswordOpen: boolean; // ✅ ADD
  onLoginClose: () => void;
  onRegisterClose: () => void;
  onForgotPasswordClose: () => void; // ✅ ADD
  onAuthSuccess?: () => void;
}
```

**Step 2: Update component**

```typescript
export function AuthDialogs({
  isLoginOpen,
  isRegisterOpen,
  isForgotPasswordOpen, // ✅ ADD
  onLoginClose,
  onRegisterClose,
  onForgotPasswordClose, // ✅ ADD
  onAuthSuccess,
}: AuthDialogsProps) {
  const t = useTranslations('Layout.auth');

  return (
    <>
      {/* Existing Login Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={open => !open && onLoginClose()}>
        <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
          <DialogHeader>
            <DialogTitle>{t('signIn')}</DialogTitle>
          </DialogHeader>
          <AuthForms defaultMode="login" onAuthSuccess={onAuthSuccess} />
        </DialogContent>
      </Dialog>

      {/* Existing Register Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={open => !open && onRegisterClose()}>
        <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
          <DialogHeader>
            <DialogTitle>{t('signUp')}</DialogTitle>
          </DialogHeader>
          <AuthForms defaultMode="register" onAuthSuccess={onAuthSuccess} />
        </DialogContent>
      </Dialog>

      {/* ✅ NEW: Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={open => !open && onForgotPasswordClose()}>
        <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
          <DialogHeader>
            <DialogTitle>{t('forms.forgotPassword.title')}</DialogTitle>
          </DialogHeader>
          <ForgotPasswordForms
            onSuccess={onAuthSuccess}
            onBackToLogin={onForgotPasswordClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Step 3: Add import**

```typescript
import { ForgotPasswordForms } from './forms/ForgotPasswordForms'; // ✅ ADD
```

**Exact locations**:

- Import: top of file (line ~8)
- Interface: line ~10-17
- Component props: line ~19
- New dialog: after Register Dialog (line ~42+)

---

### Update 3: useAuthDialogs Hook in app-header.tsx

**Файл**: `apps/web/src/components/app-header.tsx`

**Current hook** (verified):

```typescript
function useAuthDialogs() {
  const { data: session } = trpc.auth.getSession.useQuery(undefined, {
    refetchInterval: UI_REFRESH_INTERVALS.SESSION_STATUS_REFRESH,
  });
  const utils = trpc.useUtils();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = React.useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = React.useState(false);

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.getSession.invalidate();
    },
  });

  const handleOpenLogin = React.useCallback(() => {
    setIsRegisterDialogOpen(false);
    setIsLoginDialogOpen(true);
  }, []);

  const handleOpenRegister = React.useCallback(() => {
    setIsLoginDialogOpen(false);
    setIsRegisterDialogOpen(true);
  }, []);

  const handleCloseLogin = React.useCallback(() => setIsLoginDialogOpen(false), []);
  const handleCloseRegister = React.useCallback(() => setIsRegisterDialogOpen(false), []);

  const handleAuthSuccess = React.useCallback(() => {
    setIsLoginDialogOpen(false);
    setIsRegisterDialogOpen(false);
  }, []);

  const handleSignOut = React.useCallback(() => {
    logout.mutate();
  }, [logout]);

  return {
    session,
    isLoginDialogOpen,
    isRegisterDialogOpen,
    handleOpenLogin,
    handleOpenRegister,
    handleCloseLogin,
    handleCloseRegister,
    handleAuthSuccess,
    handleSignOut,
  };
}
```

**Changes required**:

```typescript
function useAuthDialogs() {
  const { data: session } = trpc.auth.getSession.useQuery(undefined, {
    refetchInterval: UI_REFRESH_INTERVALS.SESSION_STATUS_REFRESH,
  });
  const utils = trpc.useUtils();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = React.useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = React.useState(false);
  const [isForgotPasswordDialogOpen, setIsForgotPasswordDialogOpen] = React.useState(false); // ✅ ADD

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.getSession.invalidate();
    },
  });

  const handleOpenLogin = React.useCallback(() => {
    setIsRegisterDialogOpen(false);
    setIsForgotPasswordDialogOpen(false); // ✅ ADD
    setIsLoginDialogOpen(true);
  }, []);

  const handleOpenRegister = React.useCallback(() => {
    setIsLoginDialogOpen(false);
    setIsForgotPasswordDialogOpen(false); // ✅ ADD
    setIsRegisterDialogOpen(true);
  }, []);

  // ✅ ADD NEW HANDLER
  const handleOpenForgotPassword = React.useCallback(() => {
    setIsLoginDialogOpen(false);
    setIsRegisterDialogOpen(false);
    setIsForgotPasswordDialogOpen(true);
  }, []);

  const handleCloseLogin = React.useCallback(() => setIsLoginDialogOpen(false), []);
  const handleCloseRegister = React.useCallback(() => setIsRegisterDialogOpen(false), []);
  const handleCloseForgotPassword = React.useCallback(
    () => setIsForgotPasswordDialogOpen(false),
    []
  ); // ✅ ADD

  const handleAuthSuccess = React.useCallback(() => {
    setIsLoginDialogOpen(false);
    setIsRegisterDialogOpen(false);
    setIsForgotPasswordDialogOpen(false); // ✅ ADD
  }, []);

  const handleSignOut = React.useCallback(() => {
    logout.mutate();
  }, [logout]);

  return {
    session,
    isLoginDialogOpen,
    isRegisterDialogOpen,
    isForgotPasswordDialogOpen, // ✅ ADD
    handleOpenLogin,
    handleOpenRegister,
    handleOpenForgotPassword, // ✅ ADD
    handleCloseLogin,
    handleCloseRegister,
    handleCloseForgotPassword, // ✅ ADD
    handleAuthSuccess,
    handleSignOut,
  };
}
```

**Exact locations**:

- State declaration: after isRegisterDialogOpen (line ~41)
- handleOpenLogin update: add setIsForgotPasswordDialogOpen(false)
- handleOpenRegister update: add setIsForgotPasswordDialogOpen(false)
- New handler: after handleOpenRegister (line ~60+)
- Close handler: after handleCloseRegister (line ~65+)
- handleAuthSuccess update: add setIsForgotPasswordDialogOpen(false)
- Return object: add new properties

**Also update AppHeader component**:

```typescript
export function AppHeader({ className }: AppHeaderProps) {
  const t = useTranslations('Layout');
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();

  const {
    session,
    isLoginDialogOpen,
    isRegisterDialogOpen,
    isForgotPasswordDialogOpen, // ✅ ADD
    handleOpenLogin,
    handleCloseLogin,
    handleCloseRegister,
    handleCloseForgotPassword, // ✅ ADD
    handleAuthSuccess,
    handleSignOut,
  } = useAuthDialogs();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Header currentLocale={locale} onLocaleChange={handleLocaleChange} className={className}>
      <Header.Container>
        {/* ... existing mobile/desktop headers ... */}
      </Header.Container>

      <AuthDialogs
        isLoginOpen={isLoginDialogOpen}
        isRegisterOpen={isRegisterDialogOpen}
        isForgotPasswordOpen={isForgotPasswordDialogOpen} // ✅ ADD
        onLoginClose={handleCloseLogin}
        onRegisterClose={handleCloseRegister}
        onForgotPasswordClose={handleCloseForgotPassword} // ✅ ADD
        onAuthSuccess={handleAuthSuccess}
      />
    </Header>
  );
}
```

---

**Продолжение в Part 3: LoginForm update + Localization + Summary**
