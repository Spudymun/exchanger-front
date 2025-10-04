# Password Recovery Implementation Plan - Summary

> **Статус**: План создан по частям (декомпозирован)  
> **Дата**: 2025-10-04  
> **Роль**: Агент-кодер  
> **100% VERIFIED**: Все паттерны проверены на реальной кодовой базе

---

## 📚 Структура документации

### Основные файлы плана

1. **PASSWORD_RECOVERY_IMPLEMENTATION_PLAN.md**  
   Главный файл с Executive Summary, Verification Results, Roadmap

2. **PASSWORD_RECOVERY_PHASE_1_DATABASE.md**  
   Детальная инструкция по Phase 1 (Database Layer)
   - Prisma schema обновление
   - Migration создание
   - Verification steps

3. **PASSWORD_RECOVERY_PHASE_2_BUSINESS_LOGIC.md**  
   Детальная инструкция по Phase 2 (Business Logic Layer)
   - PasswordResetTokenService
   - Email templates (HTML/TXT)
   - EmailService extension

4. **PASSWORD_RECOVERY_PHASE_2_TESTING.md**  
   Testing, Security, Monitoring для Phase 2
   - Unit tests
   - Security considerations
   - Performance optimization
   - Monitoring alerts

5. **PASSWORD_RECOVERY_PHASE_3_BACKEND_API.md**  
   Детальная инструкция по Phase 3 (Backend API Layer)
   - auth.ts requestPasswordReset update
   - auth.ts resetPassword update
   - Rate limiting verification

6. **PASSWORD_RECOVERY_PHASE_4_FRONTEND_UI.md** ⏳ TO BE CREATED
   Frontend UI Layer implementation
   - ForgotPasswordRequestForm
   - ForgotPasswordResetForm
   - AUTH_FIELD_IDS extension
   - useAuthDialogs extension

7. **PASSWORD_RECOVERY_PHASE_5_TESTING.md** ⏳ TO BE CREATED
   Integration & E2E Testing
   - Full flow testing
   - Playwright tests
   - Manual testing checklist

---

## 🎯 Quick Start Guide

### Для быстрого старта реализации:

1. **Начните с Phase 1**:

   ```powershell
   # Открыть файл
   code docs/tasks/PASSWORD_RECOVERY_PHASE_1_DATABASE.md

   # Следовать инструкциям шаг за шагом
   cd packages/session-management
   pnpm prisma migrate dev --name add_password_reset_tokens
   ```

2. **Затем Phase 2**:

   ```powershell
   # Открыть файлы
   code docs/tasks/PASSWORD_RECOVERY_PHASE_2_BUSINESS_LOGIC.md
   code docs/tasks/PASSWORD_RECOVERY_PHASE_2_TESTING.md

   # Создать PasswordResetTokenService
   # Создать email templates
   # Запустить tests
   ```

3. **Затем Phase 3**:

   ```powershell
   # Открыть файл
   code docs/tasks/PASSWORD_RECOVERY_PHASE_3_BACKEND_API.md

   # Обновить apps/web/src/server/trpc/routers/auth.ts
   # Протестировать endpoints
   ```

4. **Затем Phase 4** (будет создан):
   Frontend UI components

5. **Наконец Phase 5** (будет создан):
   Integration testing

---

## ✅ Что УЖЕ ГОТОВО (0% implementation required)

### Backend Infrastructure (85% готово)

- ✅ tRPC endpoints существуют (`requestPasswordReset`, `resetPassword`)
- ✅ Validation schemas готовы (`securityEnhancedResetPasswordSchema`, `securityEnhancedConfirmResetPasswordSchema`)
- ✅ Rate limiting настроен (`RATE_LIMITS.RESET_PASSWORD`)
- ✅ EmailService infrastructure существует
- ✅ Prisma schema готова к расширению

### Frontend Hooks (100% готово)

- ✅ `usePasswordMutations` hook существует
- ✅ Локализация готова (`Layout.auth.messages.passwordResetSent`, etc.)
- ✅ `useNotifications` hook для toast messages

### Testing Infrastructure

- ✅ Jest configured
- ✅ Playwright configured
- ✅ Prisma Studio для manual testing

---

## ⚠️ Что НУЖНО СОЗДАТЬ

### Phase 1 (30 min)

- [ ] Добавить `PasswordResetToken` model в Prisma schema
- [ ] Создать migration
- [ ] Применить migration к БД

### Phase 2 (2 hours)

- [ ] Создать `PasswordResetTokenService` (новый файл)
- [ ] Создать `password-reset.html` template (новый файл)
- [ ] Создать `password-reset.txt` template (новый файл)
- [ ] Добавить метод `EmailService.sendPasswordReset`
- [ ] Добавить метод `EmailTemplateService.generatePasswordResetEmail`
- [ ] Добавить тип `PasswordResetEmailData`

### Phase 3 (1 hour)

- [ ] Обновить `auth.ts` endpoint `requestPasswordReset` (заменить mock на real)
- [ ] Обновить `auth.ts` endpoint `resetPassword` (заменить mock на real)
- [ ] Добавить imports для `PasswordResetTokenService` и `EmailService`

### Phase 4 (2 hours) - TO BE DOCUMENTED

- [ ] Создать `ForgotPasswordRequestForm.tsx`
- [ ] Создать `ForgotPasswordResetForm.tsx`
- [ ] Обновить `AUTH_FIELD_IDS` с `FORGOT_PASSWORD` секцией
- [ ] Расширить `useAuthDialogs` с `isForgotPasswordOpen` state
- [ ] Обновить `LoginForm.tsx` с "Forgot password?" link
- [ ] Обновить `AuthDialogs.tsx` с forgot password modal

### Phase 5 (1 hour) - TO BE DOCUMENTED

- [ ] Написать Playwright E2E tests
- [ ] Написать integration tests
- [ ] Manual testing checklist
- [ ] Production deployment checklist

---

## 📊 Progress Tracking

### Timeline

- **Phase 1**: 30 минут ⏳
- **Phase 2**: 2 часа ⏳
- **Phase 3**: 1 час ⏳
- **Phase 4**: 2 часа ⏳
- **Phase 5**: 1 час ⏳
- **TOTAL**: ~6.5 часов

### Current Status

```
Phase 1 (Database)          [░░░░░░░░░░] 0%  ⏳ Not started
Phase 2 (Business Logic)    [░░░░░░░░░░] 0%  ⏳ Not started
Phase 3 (Backend API)        [░░░░░░░░░░] 0%  ⏳ Not started
Phase 4 (Frontend UI)        [░░░░░░░░░░] 0%  📝 To be documented
Phase 5 (Testing)            [░░░░░░░░░░] 0%  📝 To be documented
```

---

## 🔗 Related Documentation

### Предыдущие этапы

- `PASSWORD_RECOVERY_IMPACT_ANALYSIS.md` - Анализ влияния (Агент-аналитик)
- `PASSWORD_RECOVERY_ARCHITECTURE_PLAN.md` - Архитектурный план (Агент-архитектор)

### Архитектурные документы

- `ARCHITECTURE.md` - Общая архитектура проекта
- `VALIDATION_ARCHITECTURE_GUIDE.md` - 3-layer validation architecture
- `PROJECT_STRUCTURE_MAP.md` - Карта структуры проекта

### AI Agent Rules

- `docs/ai-agent/ai-agent-rules.yml` - Правила работы AI агентов (Rule 25 MAXIMUM priority)

---

## 💡 Key Principles

### 1. 100% VERIFIED

Все кодовые примеры основаны на РЕАЛЬНОЙ кодовой базе, не на предположениях.

### 2. NO "ВЕЛОСИПЕДЫ"

Используем существующие паттерны:

- Service Layer Pattern (EmailService, WalletPoolManager)
- Compound Component Pattern (AuthForm)
- Factory Pattern (UserManagerFactory)

### 3. PRODUCTION-READY

- Rate limiting (3 requests/hour)
- XSS protection (security-enhanced schemas)
- Secure token storage (PostgreSQL с indexes)
- Email verification (Resend provider)
- Proper error handling (no information leaks)

### 4. BACKWARD COMPATIBLE

Не ломаем существующий код:

- Новые файлы для новых сервисов
- Расширение существующих компонентов через composition
- Mock implementations заменяются на real без breaking changes

---

## 🚀 Next Steps

### Для Агента-кодера

1. ✅ План реализации создан и декомпозирован
2. ⏳ Создать оставшиеся файлы:
   - `PASSWORD_RECOVERY_PHASE_4_FRONTEND_UI.md`
   - `PASSWORD_RECOVERY_PHASE_5_TESTING.md`
3. ⏳ Начать реализацию с Phase 1

### Для Агента-ревизора (после реализации)

1. Code review всех изменений
2. Проверка соответствия архитектурному плану
3. Проверка test coverage
4. Security audit
5. Performance verification

---

## 📞 Support

Если возникнут вопросы во время реализации:

1. Проверить соответствующий Phase документ
2. Проверить ARCHITECTURE.md для паттернов
3. Проверить существующий код в packages/ для примеров
4. Проверить ai-agent-rules.yml для best practices

---

**Статус документации**: ✅ Phase 1-3 completed, Phase 4-5 pending
