# 🚀 PASSWORD RECOVERY PHASE 4 - QUICK START

**Дата**: 5 октября 2025  
**Для кого**: Разработчик, начинающий Phase 4 Implementation  
**Время чтения**: 5 минут

---

## ✅ PRE-REQUISITES (100% ГОТОВО)

- [x] Phase 1: Database ✅
- [x] Phase 2: Business Logic ✅
- [x] Phase 3: Backend API ✅
- [x] Schemas exist: `securityEnhancedResetPasswordSchema`, `securityEnhancedConfirmResetPasswordSchema`
- [x] Hook exists: `usePasswordMutations()` with `requestPasswordReset`, `resetPassword`
- [x] Components exist: `FormEmailField`, `AuthPasswordField`, `FormCaptchaField`

---

## 📝 ЧТО ДЕЛАЕМ (11 ФАЙЛОВ)

### Создаём (4 файла)

1. `packages/ui/src/components/form-fields/FormResetCodeField.tsx` - новый field component
2. `apps/web/src/components/forms/RequestResetForm.tsx` - шаг 1: запрос кода
3. `apps/web/src/components/forms/ConfirmResetForm.tsx` - шаг 2: ввод кода + новый пароль
4. `apps/web/src/components/forms/ForgotPasswordForms.tsx` - container для шагов

### Обновляем (7 файлов)

5. `packages/constants/src/auth.ts` - добавить `AUTH_FIELD_IDS.FORGOT_PASSWORD`
6. `packages/ui/src/components/form-fields/index.ts` - export FormResetCodeField
7. `apps/web/src/components/auth-dialogs.tsx` - добавить 3-ю модалку
8. `apps/web/src/components/app-header.tsx` - добавить state в `useAuthDialogs`
9. `apps/web/src/components/forms/LoginForm.tsx` - добавить "Forgot password?" link
10. `apps/web/src/components/forms/AuthForms.tsx` - пробросить callback
11. `apps/web/messages/en/layout.json` + `ru/layout.json` - добавить переводы

---

## 🎯 IMPLEMENTATION ORDER

### 1️⃣ Foundation (30 min)

```bash
# 1. AUTH_FIELD_IDS
# Открыть: packages/constants/src/auth.ts
# Добавить после REGISTER:
FORGOT_PASSWORD: {
  EMAIL: 'auth-forgot-password-email',
  CAPTCHA: 'auth-forgot-password-captcha',
  RESET_CODE: 'auth-forgot-password-reset-code',
  NEW_PASSWORD: 'auth-forgot-password-new-password',
}

# 2. FormResetCodeField
# Создать: packages/ui/src/components/form-fields/FormResetCodeField.tsx
# КОПИРОВАТЬ FormEmailField.tsx → изменить на resetCode

# 3. Localization
# Открыть: apps/web/messages/en/layout.json и ru/layout.json
# Добавить: Layout.forms.forgotPassword секцию
# (см. Part 3 документа)
```

### 2️⃣ Forms (1 hour)

```bash
# 4. RequestResetForm
# Создать: apps/web/src/components/forms/RequestResetForm.tsx
# КОПИРОВАТЬ LoginForm.tsx как template
# Schema: securityEnhancedResetPasswordSchema
# Fields: FormEmailField + FormCaptchaField

# 5. ConfirmResetForm
# Создать: apps/web/src/components/forms/ConfirmResetForm.tsx
# КОПИРОВАТЬ LoginForm.tsx как template
# Schema: securityEnhancedConfirmResetPasswordSchema
# Fields: FormEmailField + FormResetCodeField + AuthPasswordField

# 6. ForgotPasswordForms
# Создать: apps/web/src/components/forms/ForgotPasswordForms.tsx
# Container с state: 'request' | 'confirm'
```

### 3️⃣ Integration (45 min)

```bash
# 7. AuthDialogs
# Открыть: apps/web/src/components/auth-dialogs.tsx
# Добавить props + 3-ю Dialog

# 8. useAuthDialogs
# Открыть: apps/web/src/components/app-header.tsx
# Добавить state + handlers

# 9. LoginForm + AuthForms
# Открыть: apps/web/src/components/forms/LoginForm.tsx
# Добавить "Forgot password?" link
# Открыть: apps/web/src/components/forms/AuthForms.tsx
# Пробросить callback
```

### 4️⃣ Testing (30 min)

```bash
# Запустить dev server
npm run dev

# Тестировать flow:
# 1. Click "Sign In" → Click "Forgot password?"
# 2. Enter email + captcha → Click "Send"
# 3. Enter code (из console.log в backend) + new password
# 4. Verify auto-login
```

---

## 📖 DETAILED DOCS (ГДЕ ИСКАТЬ ЧТО)

### Part 1: Pattern Analysis

- **Файл**: `PASSWORD_RECOVERY_PHASE_4_PLAN_PART_1.md`
- **Для чего**: Понять существующие patterns
- **Когда читать**: Перед началом, если не уверен в структуре

**Содержит**:

- Verified facts о AuthDialogs, AuthForms, LoginForm
- Существующие field components
- Validation schemas
- usePasswordMutations hook
- AUTH_FIELD_IDS pattern

### Part 2: Implementation Details

- **Файл**: `PASSWORD_RECOVERY_PHASE_4_PLAN_PART_2.md`
- **Для чего**: Точный код для реализации
- **Когда читать**: Во время кодинга

**Содержит**:

- FormResetCodeField - full code
- RequestResetForm - full code
- ConfirmResetForm - full code
- ForgotPasswordForms - full code
- Exact locations для updates

### Part 3: Localization + Testing

- **Файл**: `PASSWORD_RECOVERY_PHASE_4_PLAN_PART_3.md`
- **Для чего**: Переводы + тестирование
- **Когда читать**: После кодинга

**Содержит**:

- Complete English translations
- Complete Russian translations
- Testing scenarios
- Success criteria

---

## ⚡ QUICK REFERENCE

### Какой компонент копировать?

- **FormResetCodeField** → копируй `FormEmailField.tsx` (100%)
- **RequestResetForm** → копируй `LoginForm.tsx` (90%)
- **ConfirmResetForm** → копируй `LoginForm.tsx` (85%)
- **ForgotPasswordForms** → копируй `AuthForms.tsx` (70%)

### Какие schemas использовать?

- **RequestResetForm** → `securityEnhancedResetPasswordSchema`
- **ConfirmResetForm** → `securityEnhancedConfirmResetPasswordSchema`

### Какой hook использовать?

- **Оба forms** → `usePasswordMutations()` (already exists!)

### Какие field components использовать?

- **RequestResetForm**: `FormEmailField` + `FormCaptchaField` ✅ REUSE
- **ConfirmResetForm**: `FormEmailField` + `FormResetCodeField` (NEW) + `AuthPasswordField` ✅ REUSE

---

## 🚨 COMMON MISTAKES (НЕ ДЕЛАЙ)

❌ **Не копируй AuthFormLayout** в ForgotPasswordForms  
✅ AuthFormLayout только для login/register toggle

❌ **Не создавай новый PasswordResetService**  
✅ Используй существующий `usePasswordMutations()`

❌ **Не дублируй validation schemas**  
✅ Используй `securityEnhancedResetPasswordSchema` и `securityEnhancedConfirmResetPasswordSchema`

❌ **Не забудь AUTH_FIELD_IDS**  
✅ Добавь `FORGOT_PASSWORD` в constants

❌ **Не забудь exports**  
✅ Обнови `form-fields/index.ts` и `forms/index.ts`

---

## ✅ SUCCESS CHECKLIST

После реализации проверь:

**Compile time**:

- [ ] `npm run build` - no errors
- [ ] No ESLint warnings
- [ ] No TypeScript errors

**Runtime**:

- [ ] Click "Sign In" → Login modal opens
- [ ] Click "Forgot password?" → Forgot Password modal opens
- [ ] Request step: email + captcha → success notification
- [ ] Confirm step appears with pre-filled email
- [ ] Enter code + new password → success notification
- [ ] User auto-logged in (shows "Sign Out")
- [ ] Back/Resend buttons work

**Code quality**:

- [ ] No code duplication
- [ ] Follows existing patterns
- [ ] All translations added (en + ru)
- [ ] Components exported from index files

---

## 📞 HELP

**Stuck?**

1. Check Part 1 для pattern verification
2. Check Part 2 для exact code
3. Check Part 3 для translations

**Errors?**

1. Verify imports are correct
2. Check AUTH_FIELD_IDS added
3. Check exports in index.ts files
4. Test incrementally (one file at a time)

---

**Status**: ✅ Ready to implement!  
**Estimated time**: 2-3 hours  
**Difficulty**: EASY (95% copy-paste existing patterns)

**Good luck! 🚀**
