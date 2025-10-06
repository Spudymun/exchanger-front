# 🎨 PHASE 4: Frontend UI Implementation Plan (Part 1/3)

**Дата**: 5 октября 2025  
**Роль**: Агент-кодер (Refactoring & Patterns Focus)  
**Статус**: ✅ **100% VERIFIED** - Все решения основаны на существующих patterns проекта  
**Входные данные**:

- PASSWORD_RECOVERY_ARCHITECTURE_PLAN.md
- PASSWORD_RECOVERY_IMPACT_ANALYSIS.md
- Existing codebase patterns (verified)

---

## 📋 EXECUTIVE SUMMARY

### Что будет создано

✅ **4 новых файла** - формы для password recovery  
✅ **7 обновлений** - интеграция в существующую систему  
✅ **0 велосипедов** - 95% переиспользование существующих компонентов  
✅ **Complexity**: НИЗКАЯ - следуем established patterns

### Ключевые принципы

1. ❌ **НЕ копировать код** - переиспользовать существующие компоненты
2. ✅ **СЛЕДОВАТЬ patterns** - AuthForm compound, field components, hooks
3. ✅ **ИСПОЛЬЗОВАТЬ готовое** - schemas, mutations, field IDs
4. ✅ **МИНИМУМ изменений** - расширяем, не переписываем

---

## 1️⃣ АНАЛИЗ СУЩЕСТВУЮЩИХ PATTERNS (100% VERIFIED)

### Pattern 1: AuthDialogs System ✅ СУЩЕСТВУЕТ

**Файл**: `apps/web/src/components/auth-dialogs.tsx`

**Текущая структура**:

```tsx
export function AuthDialogs({
  isLoginOpen,
  isRegisterOpen,
  onLoginClose,
  onRegisterClose,
  onAuthSuccess,
}: AuthDialogsProps) {
  const t = useTranslations('Layout.auth');

  return (
    <>
      {/* Модальное окно входа */}
      <Dialog open={isLoginOpen} onOpenChange={open => !open && onLoginClose()}>
        <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
          <DialogHeader>
            <DialogTitle>{t('signIn')}</DialogTitle>
          </DialogHeader>
          <AuthForms defaultMode="login" onAuthSuccess={onAuthSuccess} />
        </DialogContent>
      </Dialog>

      {/* Модальное окно регистрации */}
      <Dialog open={isRegisterOpen} onOpenChange={open => !open && onRegisterClose()}>
        <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
          <DialogHeader>
            <DialogTitle>{t('signUp')}</DialogTitle>
          </DialogHeader>
          <AuthForms defaultMode="register" onAuthSuccess={onAuthSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Verified facts**:

- ✅ Использует `Dialog` component из `@repo/ui`
- ✅ Размер модалок: `sm:max-w-md` (консистентность)
- ✅ Управление через `isXxxOpen` boolean props
- ✅ Callback `onAuthSuccess` для закрытия после успеха
- ✅ Локализация через `useTranslations('Layout.auth')`

**Что нужно добавить**:

- Третья модалка для ForgotPassword
- Props: `isForgotPasswordOpen`, `onForgotPasswordClose`
- Содержимое: `<ForgotPasswordForms onSuccess={...} />`

---

### Pattern 2: AuthForms Container ✅ СУЩЕСТВУЕТ

**Файл**: `apps/web/src/components/forms/AuthForms.tsx`

**Текущая структура**:

```tsx
export const AuthForms = React.memo<AuthFormsProps>(({ onAuthSuccess, defaultMode = 'login' }) => {
  const [mode, setMode] = React.useState<'login' | 'register'>(defaultMode);
  const t = useTranslations('Layout.auth');

  const handleModeChange = React.useCallback((newMode: 'login' | 'register') => {
    setMode(newMode);
  }, []);

  return (
    <AuthFormLayout mode={mode} onModeChange={handleModeChange} t={t}>
      <AuthFormsContent mode={mode} onAuthSuccess={onAuthSuccess} />
    </AuthFormLayout>
  );
});

const AuthFormsContent: React.FC<AuthFormsContentProps> = React.memo(({ mode, onAuthSuccess }) => {
  if (mode === 'login') {
    return <LoginForm onSuccess={onAuthSuccess} />;
  }
  return <RegisterForm onSuccess={onAuthSuccess} />;
});
```

**Verified facts**:

- ✅ Управляет переключением между login/register
- ✅ Использует `AuthFormLayout` для UI переключателя
- ✅ Рендерит `LoginForm` или `RegisterForm` в зависимости от mode
- ✅ React.memo для оптимизации

**Что нужно создать (аналог)**:

- `ForgotPasswordForms.tsx` - container для password recovery
- mode: `'request' | 'confirm'` (2 шага)
- ❌ **НЕ использовать AuthFormLayout** (он только для login/register toggle)
- ✅ Простой условный рендеринг: request → success → confirm

---

### Pattern 3: LoginForm Structure ✅ СУЩЕСТВУЕТ

**Файл**: `apps/web/src/components/forms/LoginForm.tsx`

**Ключевые части**:

```tsx
// 1. Custom hook для логики
function useLoginForm(onSuccess?: () => void) {
  const { login } = useAuthMutationAdapter();
  const tValidation = useTranslations('AdvancedExchangeForm');

  const form = useFormWithNextIntl<LoginFormData>({
    initialValues: { email: '', password: '', captcha: '' },
    validationSchema: fullySecurityEnhancedLoginSchema,
    t: tValidation,
    onSubmit: async (values: LoginFormData) => {
      try {
        await login.mutateAsync({
          email: values.email,
          password: values.password,
          captcha: values.captcha,
        });
        if (onSuccess) {
          createAuthFormSubmitHandler(onSuccess)();
        }
      } catch (error) {
        createAuthFormErrorHandler()(error);
      }
    },
  });

  return { form, tValidation };
}

// 2. Component
export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { form, tValidation } = useLoginForm(onSuccess);
  const { login } = useAuthMutationAdapter();
  const t = useTranslations('Layout.forms.login');

  return (
    <AuthForm
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      isLoading={form.isSubmitting || login.isPending}
      t={tValidation}
      fieldId={AUTH_FIELD_IDS.LOGIN.EMAIL}
      formType="login"
      defaultErrorStyling="disabled"
    >
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <FormEmailField /> {/* ✅ REUSE */}
          <AuthPasswordField /> {/* ✅ REUSE */}
          <FormCaptchaField /> {/* ✅ REUSE */}
        </AuthForm.FieldWrapper>
        <AuthForm.ActionsWrapper>
          <AuthSubmitButton /> {/* ✅ REUSE */}
          <AuthSwitchButton onSwitch={onSwitchToRegister} isLoading={login.isPending}>
            {t('switchToRegister')}
          </AuthSwitchButton>
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
```

**Verified facts**:

- ✅ Custom hook pattern: `useLoginForm()` для логики формы
- ✅ `useFormWithNextIntl` для validation + form state
- ✅ `useAuthMutationAdapter()` для tRPC mutations
- ✅ `AuthForm` compound component как wrapper
- ✅ Готовые field components: `FormEmailField`, `AuthPasswordField`, `FormCaptchaField`
- ✅ `AUTH_FIELD_IDS.LOGIN.EMAIL` для unique IDs
- ✅ `fullySecurityEnhancedLoginSchema` для validation
- ✅ `onSuccess` callback для закрытия модалки

**Что нужно создать (аналоги)**:

1. `RequestResetForm.tsx`:
   - Hook: `useRequestResetForm()`
   - Schema: `securityEnhancedResetPasswordSchema` ✅ EXISTS
   - Fields: `FormEmailField` + `FormCaptchaField` ✅ REUSE
   - Mutation: `requestPasswordReset` from `usePasswordMutations()` ✅ EXISTS

2. `ConfirmResetForm.tsx`:
   - Hook: `useConfirmResetForm()`
   - Schema: `securityEnhancedConfirmResetPasswordSchema` ✅ EXISTS
   - Fields: `FormEmailField` + `FormResetCodeField` (NEW) + `AuthPasswordField` ✅ REUSE
   - Mutation: `resetPassword` from `usePasswordMutations()` ✅ EXISTS

---

### Pattern 4: Field Components ✅ СУЩЕСТВУЮТ

**Verified components**:

#### FormEmailField ✅

**Файл**: `packages/ui/src/components/form-fields/FormEmailField.tsx`

```tsx
export const FormEmailField = <T extends EmailFormFields = EmailFormFields>({
  form,
  isLoading = false,
  t,
  fieldId = 'email',
}: FormEmailFieldProps<T>) => {
  if (!form || !t) {
    console.warn('FormEmailField: form and t props are required when used without context');
    return <div className="text-sm text-muted-foreground">Email field requires form context</div>;
  }

  return (
    <FormField name="email" error={form.errors.email}>
      <FormLabel htmlFor={fieldId} className="required">
        {t('email.label')}
      </FormLabel>
      <FormControl>
        <Input
          {...form.getFieldProps('email')}
          id={fieldId}
          type="email"
          placeholder={t('email.placeholder')}
          disabled={isLoading}
          required
        />
      </FormControl>
      <FormMessage />
    </FormField>
  );
};
```

**Facts**:

- ✅ Generic type parameter: `T extends EmailFormFields`
- ✅ Props: `form`, `isLoading`, `t`, `fieldId`
- ✅ Auto-gets props from AuthForm context (compound pattern)
- ✅ Validation через `form.errors.email`

#### AuthPasswordField ✅

**Файл**: `packages/ui/src/components/auth/AuthPasswordField.tsx`

```tsx
export const AuthPasswordField = <T extends PasswordFormFields = PasswordFormFields>({
  form,
  isLoading = false,
  t,
  fieldId = 'password',
}: AuthPasswordFieldProps<T>) => {
  if (!form || !t) {
    console.warn(
      'AuthPasswordField: form and t props are required when used without AuthForm context'
    );
    return (
      <div className="text-sm text-muted-foreground">Password field requires form context</div>
    );
  }

  return (
    <FormField name="password" error={form.errors.password}>
      <FormLabel htmlFor={fieldId} className="required">
        {t('password.label')}
      </FormLabel>
      <FormControl>
        <Input
          {...form.getFieldProps('password')}
          id={fieldId}
          type="password"
          placeholder={t('password.placeholder')}
          disabled={isLoading}
          required
        />
      </FormControl>
      <FormMessage />
    </FormField>
  );
};
```

**Facts**:

- ✅ Аналогичный pattern как FormEmailField
- ✅ type="password" для скрытия ввода
- ✅ Централизованные translation keys

#### FormCaptchaField ✅

**Файл**: `packages/ui/src/components/form-fields/FormCaptchaField.tsx`

**Facts**:

- ✅ Существует и работает
- ✅ Используется в LoginForm и RegisterForm
- ✅ Автоматическая генерация математических примеров

**Что нужно создать**:

#### FormResetCodeField ❌ NEW

**Файл**: `packages/ui/src/components/form-fields/FormResetCodeField.tsx` (CREATE)

**Требования**:

- Аналогичный pattern как `FormEmailField`
- Generic type: `ResetCodeFormFields` interface
- Input type="text"
- maxLength={6} (6-digit code)
- placeholder: "Enter code from email"
- Validation через schema

---

### Pattern 5: Validation Schemas ✅ СУЩЕСТВУЮТ

**Файл**: `packages/utils/src/validation/security-enhanced-auth-schemas.ts`

#### securityEnhancedResetPasswordSchema ✅

```typescript
export const securityEnhancedResetPasswordSchema = z.object({
  email: emailSchema,
});
```

**Verified facts**:

- ✅ XSS protection через `emailSchema`
- ✅ Email validation (RFC 5322)
- ✅ Используется в `auth.requestPasswordReset` endpoint

#### securityEnhancedConfirmResetPasswordSchema ✅

```typescript
export const securityEnhancedConfirmResetPasswordSchema = z.object({
  email: emailSchema,
  resetCode: createXSSProtectedStringWithLength(
    1,
    SECURITY_VALIDATION_LIMITS.AUTH_CODE_MAX_LENGTH
  ).refine((val: string) => val.length > 0, 'RESET_CODE_REQUIRED'),
  newPassword: passwordSchema,
});
```

**Verified facts**:

- ✅ XSS protection для всех полей
- ✅ resetCode: max length = AUTH_CODE_MAX_LENGTH (6 символов)
- ✅ newPassword: complexity requirements via passwordSchema
- ✅ Используется в `auth.resetPassword` endpoint

**Type exports** ✅:

```typescript
export type SecurityEnhancedResetPassword = z.infer<typeof securityEnhancedResetPasswordSchema>;
export type SecurityEnhancedConfirmResetPassword = z.infer<
  typeof securityEnhancedConfirmResetPasswordSchema
>;
```

---

### Pattern 6: tRPC Mutations Hook ✅ СУЩЕСТВУЕТ

**Файл**: `apps/web/src/hooks/usePasswordMutations.ts`

```typescript
export function usePasswordMutations(): {
  requestPasswordReset: ReturnType<typeof trpc.auth.requestPasswordReset.useMutation>;
  resetPassword: ReturnType<typeof trpc.auth.resetPassword.useMutation>;
  verifyEmail: ReturnType<typeof trpc.auth.verifyEmail.useMutation>;
} {
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

**Verified facts**:

- ✅ Type-safe tRPC mutations
- ✅ Интеграция с notification system
- ✅ Error handling через `notifications.handleApiError`
- ✅ Success notifications с локализацией
- ✅ ❌ **НЕ используется** ни в одном компоненте (пока)

**Интеграция**:

- ✅ Используется в `useAuthMutationAdapter()` hook
- ✅ Экспортируется вместе с login/register/logout mutations

---

### Pattern 7: AUTH_FIELD_IDS Constants ✅ СУЩЕСТВУЮТ

**Файл**: `packages/constants/src/auth.ts`

**Текущая структура**:

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

**Verified facts**:

- ✅ Уникальные ID для каждого поля формы
- ✅ Предотвращают конфликты в модальных окнах
- ✅ Pattern: `auth-{formType}-{fieldName}`

**Что нужно добавить**:

```typescript
FORGOT_PASSWORD: {
  EMAIL: 'auth-forgot-password-email',
  CAPTCHA: 'auth-forgot-password-captcha',
  RESET_CODE: 'auth-forgot-password-reset-code',
  NEW_PASSWORD: 'auth-forgot-password-new-password',
},
```

---

## 2️⃣ LOCALIZATION ANALYSIS (100% VERIFIED)

### Existing Translations ✅

**Файлы**:

- `apps/web/messages/en/layout.json`
- `apps/web/messages/ru/layout.json`

**Что УЖЕ СУЩЕСТВУЕТ**:

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

**Verified facts**:

- ✅ Notification messages готовы
- ✅ Используются в `usePasswordMutations` hook
- ❌ **НЕТ** UI labels для форм восстановления

---

### What Needs to be Added ❌

**Location**: `Layout.forms.forgotPassword`

**English** (`apps/web/messages/en/layout.json`):

```json
{
  "Layout": {
    "forms": {
      "forgotPassword": {
        "title": "Reset Password",
        "requestTitle": "Request Reset Code",
        "confirmTitle": "Enter Reset Code",
        "email": {
          "label": "Email address",
          "placeholder": "Enter your email"
        },
        "resetCode": {
          "label": "Reset code",
          "placeholder": "Enter 6-digit code"
        },
        "newPassword": {
          "label": "New password",
          "placeholder": "Enter new password"
        },
        "requestButton": "Send Reset Code",
        "resetButton": "Reset Password",
        "requesting": "Sending...",
        "resetting": "Resetting...",
        "backToLogin": "Back to Sign In",
        "codeExpires": "Code expires in 15 minutes",
        "didntReceive": "Didn't receive code?",
        "resendCode": "Resend",
        "checkEmail": "Check your email for the reset code"
      }
    }
  }
}
```

**Russian** (`apps/web/messages/ru/layout.json`):

```json
{
  "Layout": {
    "forms": {
      "forgotPassword": {
        "title": "Восстановление пароля",
        "requestTitle": "Запрос кода восстановления",
        "confirmTitle": "Введите код восстановления",
        "email": {
          "label": "Email адрес",
          "placeholder": "Введите ваш email"
        },
        "resetCode": {
          "label": "Код восстановления",
          "placeholder": "Введите 6-значный код"
        },
        "newPassword": {
          "label": "Новый пароль",
          "placeholder": "Введите новый пароль"
        },
        "requestButton": "Отправить код",
        "resetButton": "Сменить пароль",
        "requesting": "Отправка...",
        "resetting": "Смена пароля...",
        "backToLogin": "Вернуться к входу",
        "codeExpires": "Код действителен 15 минут",
        "didntReceive": "Не получили код?",
        "resendCode": "Отправить снова",
        "checkEmail": "Проверьте email для получения кода"
      }
    }
  }
}
```

---

## ✅ VERIFICATION SUMMARY PART 1

**100% Verified Existing Patterns**:

1. ✅ AuthDialogs system (Dialog + DialogContent)
2. ✅ AuthForms container pattern
3. ✅ LoginForm structure (custom hook + compound component)
4. ✅ Field components (FormEmailField, AuthPasswordField, FormCaptchaField)
5. ✅ Validation schemas (securityEnhancedResetPasswordSchema, securityEnhancedConfirmResetPasswordSchema)
6. ✅ usePasswordMutations hook (requestPasswordReset, resetPassword)
7. ✅ AUTH_FIELD_IDS constants pattern

**What Needs to be Created**:

1. ❌ FormResetCodeField component (NEW)
2. ❌ ForgotPasswordForms container (NEW)
3. ❌ RequestResetForm component (NEW)
4. ❌ ConfirmResetForm component (NEW)

**What Needs to be Updated**:

1. ⚠️ AUTH_FIELD_IDS - add FORGOT_PASSWORD
2. ⚠️ AuthDialogs - add third dialog
3. ⚠️ app-header.tsx useAuthDialogs - add forgot password state
4. ⚠️ LoginForm - add "Forgot Password?" link
5. ⚠️ layout.json (en/ru) - add forgotPassword translations
6. ⚠️ form-fields/index.ts - export FormResetCodeField

---

**Продолжение в Part 2: Implementation Details**
