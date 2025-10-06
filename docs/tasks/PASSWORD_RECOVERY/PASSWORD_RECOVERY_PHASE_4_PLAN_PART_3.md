# 🎨 PHASE 4: Frontend UI Implementation Plan (Part 3/3)

**Дата**: 5 октября 2025  
**Continuation of**: PASSWORD_RECOVERY_PHASE_4_PLAN_PART_2.md

---

## 4️⃣ IMPLEMENTATION PLAN: UPDATES TO EXISTING FILES (CONTINUED)

### Update 4: LoginForm - Add "Forgot Password?" Link

**Файл**: `apps/web/src/components/forms/LoginForm.tsx`

**Current structure** (verified):

```tsx
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
          <FormEmailField />
          <AuthPasswordField />
          <FormCaptchaField />
        </AuthForm.FieldWrapper>
        <AuthForm.ActionsWrapper>
          <AuthSubmitButton />
          <AuthSwitchButton onSwitch={onSwitchToRegister} isLoading={login.isPending}>
            {t('switchToRegister')}
          </AuthSwitchButton>
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
```

**Changes required**:

**Step 1: Update interface**

```typescript
export interface LoginFormProps extends BaseAuthFormProps {
  onSwitchToRegister?: () => void;
  onSwitchToForgotPassword?: () => void; // ✅ ADD
}
```

**Step 2: Update component**

```tsx
export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onSwitchToForgotPassword, // ✅ ADD
}: LoginFormProps) {
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
          <FormEmailField />
          <AuthPasswordField />

          {/* ✅ ADD: Forgot Password link */}
          {onSwitchToForgotPassword && (
            <div className="flex justify-end -mt-1 mb-2">
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                disabled={login.isPending}
              >
                {t('forgotPassword')}
              </button>
            </div>
          )}

          <FormCaptchaField />
        </AuthForm.FieldWrapper>
        <AuthForm.ActionsWrapper>
          <AuthSubmitButton />
          <AuthSwitchButton onSwitch={onSwitchToRegister} isLoading={login.isPending}>
            {t('switchToRegister')}
          </AuthSwitchButton>
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
```

**Step 3: Update localization keys**
Add to `apps/web/messages/en/layout.json`:

```json
{
  "Layout": {
    "forms": {
      "login": {
        "forgotPassword": "Forgot password?"
      }
    }
  }
}
```

Add to `apps/web/messages/ru/layout.json`:

```json
{
  "Layout": {
    "forms": {
      "login": {
        "forgotPassword": "Забыли пароль?"
      }
    }
  }
}
```

**Step 4: Update AuthForms to pass callback**

**Файл**: `apps/web/src/components/forms/AuthForms.tsx`

**Current AuthFormsContent** (verified):

```tsx
const AuthFormsContent: React.FC<AuthFormsContentProps> = React.memo(({ mode, onAuthSuccess }) => {
  if (mode === 'login') {
    return <LoginForm onSuccess={onAuthSuccess} />;
  }
  return <RegisterForm onSuccess={onAuthSuccess} />;
});
```

**⚠️ PROBLEM**: AuthForms не знает о onSwitchToForgotPassword

**SOLUTION**: Передавать callback через props

**Update AuthFormsProps interface**:

```typescript
interface AuthFormsProps {
  onAuthSuccess?: () => void;
  defaultMode?: 'login' | 'register';
  onSwitchToForgotPassword?: () => void; // ✅ ADD
}
```

**Update AuthForms component**:

```tsx
export const AuthForms = React.memo<AuthFormsProps>(
  ({
    onAuthSuccess,
    defaultMode = 'login',
    onSwitchToForgotPassword, // ✅ ADD
  }) => {
    const [mode, setMode] = React.useState<'login' | 'register'>(defaultMode);
    const t = useTranslations('Layout.auth');

    const handleModeChange = React.useCallback((newMode: 'login' | 'register') => {
      setMode(newMode);
    }, []);

    return (
      <AuthFormLayout mode={mode} onModeChange={handleModeChange} t={t}>
        <AuthFormsContent
          mode={mode}
          onAuthSuccess={onAuthSuccess}
          onSwitchToForgotPassword={onSwitchToForgotPassword} // ✅ PASS
        />
      </AuthFormLayout>
    );
  }
);
```

**Update AuthFormsContentProps interface**:

```typescript
interface AuthFormsContentProps {
  mode: 'login' | 'register';
  onAuthSuccess?: () => void;
  onSwitchToForgotPassword?: () => void; // ✅ ADD
}
```

**Update AuthFormsContent component**:

```tsx
const AuthFormsContent: React.FC<AuthFormsContentProps> = React.memo(
  ({
    mode,
    onAuthSuccess,
    onSwitchToForgotPassword, // ✅ ADD
  }) => {
    if (mode === 'login') {
      return (
        <LoginForm
          onSuccess={onAuthSuccess}
          onSwitchToForgotPassword={onSwitchToForgotPassword} // ✅ PASS
        />
      );
    }
    return <RegisterForm onSuccess={onAuthSuccess} />;
  }
);
```

**Step 5: Update AuthDialogs to wire callback**

**Файл**: `apps/web/src/components/auth-dialogs.tsx`

**Update Login Dialog**:

```tsx
<Dialog open={isLoginOpen} onOpenChange={open => !open && onLoginClose()}>
  <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
    <DialogHeader>
      <DialogTitle>{t('signIn')}</DialogTitle>
    </DialogHeader>
    <AuthForms
      defaultMode="login"
      onAuthSuccess={onAuthSuccess}
      onSwitchToForgotPassword={() => {
        onLoginClose();
        onForgotPasswordOpen(); // ✅ NEW
      }}
    />
  </DialogContent>
</Dialog>
```

**⚠️ PROBLEM**: AuthDialogsProps не имеет `onForgotPasswordOpen`

**SOLUTION**: Добавить prop или использовать существующий state управление

**BETTER SOLUTION**: Добавить callback в useAuthDialogs return

**Update useAuthDialogs hook** (in app-header.tsx):

```typescript
// Already added handleOpenForgotPassword in Part 2
// Now just pass it to AuthDialogs
```

**Update AuthDialogsProps**:

```typescript
interface AuthDialogsProps {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  isForgotPasswordOpen: boolean;
  onLoginClose: () => void;
  onRegisterClose: () => void;
  onForgotPasswordClose: () => void;
  onForgotPasswordOpen: () => void; // ✅ ADD for switch from login
  onAuthSuccess?: () => void;
}
```

**Update AuthDialogs component**:

```tsx
export function AuthDialogs({
  isLoginOpen,
  isRegisterOpen,
  isForgotPasswordOpen,
  onLoginClose,
  onRegisterClose,
  onForgotPasswordClose,
  onForgotPasswordOpen, // ✅ ADD
  onAuthSuccess,
}: AuthDialogsProps) {
  const t = useTranslations('Layout.auth');

  return (
    <>
      <Dialog open={isLoginOpen} onOpenChange={open => !open && onLoginClose()}>
        <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
          <DialogHeader>
            <DialogTitle>{t('signIn')}</DialogTitle>
          </DialogHeader>
          <AuthForms
            defaultMode="login"
            onAuthSuccess={onAuthSuccess}
            onSwitchToForgotPassword={() => {
              onLoginClose();
              onForgotPasswordOpen(); // ✅ WIRE
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ... rest of dialogs ... */}
    </>
  );
}
```

**Update AppHeader to pass callback**:

```tsx
<AuthDialogs
  isLoginOpen={isLoginDialogOpen}
  isRegisterOpen={isRegisterDialogOpen}
  isForgotPasswordOpen={isForgotPasswordDialogOpen}
  onLoginClose={handleCloseLogin}
  onRegisterClose={handleCloseRegister}
  onForgotPasswordClose={handleCloseForgotPassword}
  onForgotPasswordOpen={handleOpenForgotPassword} // ✅ ADD
  onAuthSuccess={handleAuthSuccess}
/>
```

---

## 5️⃣ LOCALIZATION: COMPLETE TRANSLATIONS

### English Translations

**Файл**: `apps/web/messages/en/layout.json`

**Current structure** (verified):

```json
{
  "Layout": {
    "forms": {
      "login": { ... },
      "register": { ... }
    }
  }
}
```

**Add forgotPassword section**:

```json
{
  "Layout": {
    "forms": {
      "login": {
        "password": {
          "label": "Password",
          "placeholder": "Enter password"
        },
        "submit": "Sign In",
        "submitting": "Signing in...",
        "switchToRegister": "Don't have an account? Sign up",
        "forgotPassword": "Forgot password?"
      },
      "register": {
        "password": {
          "label": "Password",
          "placeholder": "Enter password"
        },
        "confirmPassword": {
          "label": "Confirm Password",
          "placeholder": "Repeat password"
        },
        "submit": "Sign Up",
        "submitting": "Creating account...",
        "switchToLogin": "Already have an account? Sign in",
        "successTitle": "Registration successful",
        "successMessage": "Check your email to confirm your account",
        "errorTitle": "Registration error",
        "errorMessage": "Please try again"
      },
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

---

### Russian Translations

**Файл**: `apps/web/messages/ru/layout.json`

**Add forgotPassword section**:

```json
{
  "Layout": {
    "forms": {
      "login": {
        "password": {
          "label": "Пароль",
          "placeholder": "Введите пароль"
        },
        "submit": "Войти",
        "submitting": "Вход...",
        "switchToRegister": "Нет аккаунта? Зарегистрироваться",
        "forgotPassword": "Забыли пароль?"
      },
      "register": {
        "password": {
          "label": "Пароль",
          "placeholder": "Введите пароль"
        },
        "confirmPassword": {
          "label": "Подтвердите пароль",
          "placeholder": "Повторите пароль"
        },
        "submit": "Зарегистрироваться",
        "submitting": "Регистрация...",
        "switchToLogin": "Уже есть аккаунт? Войти",
        "successTitle": "Регистрация успешна",
        "successMessage": "Проверьте email для подтверждения аккаунта",
        "errorTitle": "Ошибка регистрации",
        "errorMessage": "Попробуйте снова",
        "forgotPassword": "Забыли пароль?"
      },
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

## 6️⃣ IMPLEMENTATION CHECKLIST

### New Files to Create (4 files)

- [ ] **FormResetCodeField.tsx**
  - Location: `packages/ui/src/components/form-fields/FormResetCodeField.tsx`
  - Pattern: 100% copy FormEmailField.tsx structure
  - Changes: field name, type="text", maxLength={6}

- [ ] **RequestResetForm.tsx**
  - Location: `apps/web/src/components/forms/RequestResetForm.tsx`
  - Pattern: 90% copy LoginForm.tsx structure
  - Schema: securityEnhancedResetPasswordSchema
  - Fields: FormEmailField + FormCaptchaField

- [ ] **ConfirmResetForm.tsx**
  - Location: `apps/web/src/components/forms/ConfirmResetForm.tsx`
  - Pattern: 85% copy LoginForm.tsx structure
  - Schema: securityEnhancedConfirmResetPasswordSchema
  - Fields: FormEmailField + FormResetCodeField + AuthPasswordField

- [ ] **ForgotPasswordForms.tsx**
  - Location: `apps/web/src/components/forms/ForgotPasswordForms.tsx`
  - Pattern: 70% copy AuthForms.tsx structure
  - State: step ('request' | 'confirm')
  - NO AuthFormLayout (linear flow)

---

### Files to Update (7 files)

- [ ] **packages/constants/src/auth.ts**
  - Add: AUTH_FIELD_IDS.FORGOT_PASSWORD object
  - Location: after REGISTER block

- [ ] **packages/ui/src/components/form-fields/index.ts**
  - Add: export FormResetCodeField
  - Add: export type ResetCodeFormFields

- [ ] **apps/web/src/components/auth-dialogs.tsx**
  - Update: AuthDialogsProps interface (add 2 props)
  - Update: AuthDialogs component (add 3rd Dialog)
  - Add: import ForgotPasswordForms

- [ ] **apps/web/src/components/app-header.tsx**
  - Update: useAuthDialogs hook (add state + handlers)
  - Update: AppHeader component (pass new props to AuthDialogs)

- [ ] **apps/web/src/components/forms/LoginForm.tsx**
  - Update: LoginFormProps interface (add onSwitchToForgotPassword)
  - Update: LoginForm component (add "Forgot password?" link)

- [ ] **apps/web/src/components/forms/AuthForms.tsx**
  - Update: AuthFormsProps interface (add onSwitchToForgotPassword)
  - Update: AuthForms component (pass callback)
  - Update: AuthFormsContentProps interface
  - Update: AuthFormsContent component (pass to LoginForm)

- [ ] **apps/web/messages/en/layout.json**
  - Add: Layout.forms.login.forgotPassword
  - Add: Layout.forms.forgotPassword section (complete)

- [ ] **apps/web/messages/ru/layout.json**
  - Add: Layout.forms.login.forgotPassword
  - Add: Layout.forms.forgotPassword section (complete)

- [ ] **apps/web/src/components/forms/index.ts**
  - Add: export ForgotPasswordForms
  - Add: export RequestResetForm (optional)
  - Add: export ConfirmResetForm (optional)

---

## 7️⃣ TESTING PLAN

### Manual Testing Flow

**Step 1: Open Login Dialog**

1. Click "Sign In" button in header
2. Verify login modal opens

**Step 2: Click "Forgot Password?"**

1. Click "Forgot password?" link below password field
2. Verify:
   - Login modal closes
   - Forgot Password modal opens
   - Title: "Reset Password" (or localized)
   - Shows RequestResetForm (email + captcha)

**Step 3: Request Reset Code**

1. Enter email: `test@example.com`
2. Solve captcha
3. Click "Send Reset Code"
4. Verify:
   - Loading state shows "Sending..."
   - Success notification: "Instructions sent. Check your email"
   - Form transitions to ConfirmResetForm
   - Email field pre-filled

**Step 4: Enter Reset Code**

1. Check backend logs for reset code (console.log in Phase 3)
2. Enter code in "Reset code" field
3. Enter new password
4. Click "Reset Password"
5. Verify:
   - Loading state shows "Resetting..."
   - Success notification: "Password changed. You can sign in with your new password"
   - Modal closes
   - User is automatically logged in (auto-login from backend)
   - Header shows "Sign Out" button

**Step 5: Test "Back to Sign In"**

1. Open Forgot Password modal
2. Click "Back to Sign In" button
3. Verify:
   - Forgot Password modal closes
   - Returns to previous state (or closes all)

**Step 6: Test "Resend Code"**

1. On ConfirmResetForm
2. Click "Didn't receive code? Resend"
3. Verify:
   - Returns to RequestResetForm
   - Email preserved

**Step 7: Test Validation**

1. Submit empty email → validation error
2. Submit invalid email → validation error
3. Submit wrong code → backend error
4. Submit expired code (after 15 min) → backend error
5. Submit weak password → validation error

---

### Error Scenarios to Test

- [ ] Wrong email format
- [ ] Non-existent email (still returns success for security)
- [ ] Wrong reset code
- [ ] Expired reset code (after 15 minutes)
- [ ] Already used reset code
- [ ] Weak new password
- [ ] Rate limiting (3 attempts per hour)

---

## 8️⃣ FILE STRUCTURE SUMMARY

```
packages/
├── constants/src/
│   └── auth.ts ⚠️ UPDATE
├── ui/src/components/
│   ├── form-fields/
│   │   ├── FormResetCodeField.tsx ❌ NEW
│   │   └── index.ts ⚠️ UPDATE
│   └── auth/
│       └── (existing files, no changes)

apps/web/src/
├── components/
│   ├── auth-dialogs.tsx ⚠️ UPDATE
│   ├── app-header.tsx ⚠️ UPDATE
│   └── forms/
│       ├── AuthForms.tsx ⚠️ UPDATE
│       ├── LoginForm.tsx ⚠️ UPDATE
│       ├── ForgotPasswordForms.tsx ❌ NEW
│       ├── RequestResetForm.tsx ❌ NEW
│       ├── ConfirmResetForm.tsx ❌ NEW
│       └── index.ts ⚠️ UPDATE
├── hooks/
│   └── usePasswordMutations.ts ✅ EXISTS (no changes)
└── messages/
    ├── en/
    │   └── layout.json ⚠️ UPDATE
    └── ru/
        └── layout.json ⚠️ UPDATE
```

**Legend**:

- ❌ NEW - Create new file
- ⚠️ UPDATE - Modify existing file
- ✅ EXISTS - No changes needed

---

## 9️⃣ IMPLEMENTATION ORDER (RECOMMENDED)

### Phase 4A: Foundation (30 min)

1. **Update AUTH_FIELD_IDS** (`packages/constants/src/auth.ts`)
   - Add FORGOT_PASSWORD object
   - Simple addition, no dependencies

2. **Create FormResetCodeField** (`packages/ui/src/components/form-fields/`)
   - Copy FormEmailField.tsx
   - Modify for resetCode field
   - Update index.ts export

3. **Update localization** (`apps/web/messages/*/layout.json`)
   - Add forgotPassword sections (en + ru)
   - Add login.forgotPassword keys

### Phase 4B: Forms (1 hour)

4. **Create RequestResetForm** (`apps/web/src/components/forms/`)
   - Copy LoginForm.tsx as template
   - Use securityEnhancedResetPasswordSchema
   - Wire usePasswordMutations

5. **Create ConfirmResetForm** (`apps/web/src/components/forms/`)
   - Copy LoginForm.tsx as template
   - Use securityEnhancedConfirmResetPasswordSchema
   - Add FormResetCodeField

6. **Create ForgotPasswordForms** (`apps/web/src/components/forms/`)
   - Container for request/confirm steps
   - State management for flow
   - Update index.ts export

### Phase 4C: Integration (45 min)

7. **Update AuthDialogs** (`apps/web/src/components/auth-dialogs.tsx`)
   - Add props
   - Add 3rd Dialog
   - Wire ForgotPasswordForms

8. **Update useAuthDialogs** (`apps/web/src/components/app-header.tsx`)
   - Add state
   - Add handlers
   - Pass to AuthDialogs

9. **Update LoginForm + AuthForms**
   - Add "Forgot password?" link
   - Wire callback through AuthForms
   - Connect to modal system

### Phase 4D: Testing (30 min)

10. **Manual testing**
    - Full flow test
    - Error scenarios
    - UI/UX verification

---

## 🎯 SUCCESS CRITERIA

✅ **Functional Requirements**:

- [ ] User can request reset code via email + captcha
- [ ] User receives email with 6-digit code
- [ ] User can enter code + new password
- [ ] User is auto-logged in after successful reset
- [ ] User can navigate back/resend at any step

✅ **Technical Requirements**:

- [ ] No code duplication (95% reuse)
- [ ] Follows existing patterns (AuthForm, field components)
- [ ] Type-safe (TypeScript + Zod schemas)
- [ ] Localized (en + ru)
- [ ] Accessible (keyboard navigation, ARIA labels)

✅ **Security Requirements**:

- [ ] XSS protection (security-enhanced schemas)
- [ ] Rate limiting (backend - already implemented)
- [ ] Email enumeration protection (backend - already implemented)
- [ ] Token expiration (15 min - backend - already implemented)

✅ **UX Requirements**:

- [ ] Clear flow (request → confirm → success)
- [ ] Loading states (Sending.../Resetting...)
- [ ] Error handling (validation + API errors)
- [ ] Success notifications
- [ ] Consistent styling with existing dialogs

---

## ✅ FINAL VERIFICATION

**Before starting implementation, verify**:

1. ✅ Phase 1 (Database) completed
2. ✅ Phase 2 (Business Logic) completed
3. ✅ Phase 3 (Backend API) completed
4. ✅ All dependencies exist:
   - usePasswordMutations hook
   - Security-enhanced schemas
   - Field components
   - AuthForm compound component
   - Dialog system

**After implementation, verify**:

1. ✅ No ESLint errors
2. ✅ No TypeScript errors
3. ✅ All files compile
4. ✅ Manual testing passes
5. ✅ No console errors

---

## 📝 NOTES FOR IMPLEMENTATION

1. **Copy existing patterns** - не изобретай велосипеды
2. **Test incrementally** - после каждого файла проверяй компиляцию
3. **Follow naming conventions** - AUTH_FIELD_IDS pattern
4. **Use existing hooks** - usePasswordMutations, useFormWithNextIntl
5. **Reuse components** - FormEmailField, AuthPasswordField, etc
6. **Keep it simple** - linear flow, no overengineering

---

**END OF PHASE 4 PLAN**

**Total files**: 11 (4 new + 7 updates)  
**Estimated time**: 2-3 hours  
**Complexity**: LOW (95% reuse)  
**Risk**: LOW (following established patterns)
