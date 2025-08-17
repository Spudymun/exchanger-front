# 🛡️ Security-Enhanced Validation Schemas Guide

## 🚨 КРИТИЧЕСКИ ВАЖНО: Читать ВСЕМ разработчикам!

Этот документ содержит **обязательные к изучению** паттерны для работы с **security-enhanced validation schemas** в проекте ExchangeGO. Все новые формы и API endpoints ДОЛЖНЫ использовать только security-enhanced schemas.

---

## 🎯 Что такое Security-Enhanced Validation

**Security-Enhanced Validation Schemas** - это новое поколение validation schemas с встроенной XSS protection и усиленной безопасностью, которые заменили legacy validation patterns.

### ✅ Ключевые особенности:

- **🛡️ XSS Protection** - автоматическая защита от XSS атак во всех text input полях
- **🔒 Input Sanitization** - очистка пользовательского ввода на уровне схем
- **📏 Enhanced Limits** - расширенные ограничения для предотвращения abuse
- **🎯 Consistent API** - единообразный интерфейс для всех форм
- **🌐 Full i18n Support** - полная поддержка интернационализации

---

## 🚀 Быстрый старт

### ✅ Правильная схема для формы

```typescript
// ✅ ПРАВИЛЬНО: Используй security-enhanced schemas
import {
  securityEnhancedLoginSchema,
  securityEnhancedCreateExchangeOrderSchema,
  securityEnhancedCreateTicketSchema,
} from '@repo/utils';

// Для формы входа
const loginForm = useFormWithNextIntl({
  validationSchema: securityEnhancedLoginSchema,
  t: useTranslations('LoginForm'),
  // ...
});

// Для создания заказа
const exchangeForm = useFormWithNextIntl({
  validationSchema: securityEnhancedCreateExchangeOrderSchema,
  t: useTranslations('ExchangeForm'),
  // ...
});
```

### ❌ Устаревшие patterns (НЕ используй!)

```typescript
// ❌ НЕПРАВИЛЬНО: Legacy schemas без security enhancement
import {
  loginSchema, // DEPRECATED
  createOrderSchema, // DEPRECATED
  userProfileSchema, // DEPRECATED
} from '@repo/utils';

// ❌ НЕ делай так!
const form = useFormWithNextIntl({
  validationSchema: loginSchema, // Уязвимо к XSS!
  // ...
});
```

---

## 📚 Доступные Security-Enhanced Schemas

### 🔐 Authentication & Security

```typescript
import {
  securityEnhancedLoginSchema,
  securityEnhancedRegisterSchema,
  securityEnhancedResetPasswordSchema,
  securityEnhancedConfirmResetPasswordSchema,
  securityEnhancedConfirmEmailSchema,
  securityEnhancedChangePasswordSchema,
} from '@repo/utils';
```

### 💱 Exchange & Trading

```typescript
import {
  securityEnhancedSimpleExchangeSchema,
  securityEnhancedCreateExchangeOrderSchema,
  securityEnhancedExchangeSchema,
} from '@repo/utils';
```

### 🎫 Support & Communication

```typescript
import {
  securityEnhancedCreateTicketSchema,
  securityEnhancedCreateTicketAdminSchema,
  securityEnhancedContactSchema,
} from '@repo/utils';
```

### 🔍 Search & Admin

```typescript
import {
  securityEnhancedSearchOrdersSchema,
  securityEnhancedSearchUsersSchema,
  securityEnhancedSearchKnowledgeSchema,
} from '@repo/utils';
```

### ⚙️ Utility & System

```typescript
import {
  securityEnhancedGetByIdSchema,
  securityEnhancedOrderByIdSchema,
  securityEnhancedQuickActionsSchema,
  securityEnhancedUpdateNotificationsSchema,
} from '@repo/utils';
```

---

## 🏗️ Архитектурные принципы

### 1. **Композитная архитектура**

Security-enhanced schemas **композируют** базовые схемы с добавлением XSS protection:

```typescript
// Базовые building blocks (остаются без security-enhanced префикса)
import { emailSchema, passwordSchema } from '@repo/utils/validation/schemas-basic';
import { currencySchema } from '@repo/utils/validation/schemas-crypto';

// Security-enhanced схемы КОМПОЗИРУЮТ базовые
export const securityEnhancedLoginSchema = z.object({
  email: emailSchema, // ← Базовая схема
  password: passwordSchema, // ← Базовая схема
  captcha: securityEnhancedCaptchaSchema, // ← Enhanced схема
});
```

### 2. **XSS Protection на уровне схем**

```typescript
// createXSSProtectedString автоматически применяется к text input полям
const securityEnhancedCreateTicketSchema = z.object({
  subject: createXSSProtectedString(
    VALIDATION_LIMITS.USERNAME_MIN_LENGTH,
    SECURITY_VALIDATION_LIMITS.SUBJECT_MAX_LENGTH
  ),
  description: createXSSProtectedString(
    SECURITY_VALIDATION_LIMITS.MESSAGE_MIN_LENGTH,
    SECURITY_VALIDATION_LIMITS.MESSAGE_MAX_LENGTH
  ),
});
```

### 3. **Единые типы и exports**

```typescript
// Каждая security-enhanced схема имеет соответствующий тип
export type SecurityEnhancedLoginForm = z.infer<typeof securityEnhancedLoginSchema>;
export type SecurityEnhancedCreateTicket = z.infer<typeof securityEnhancedCreateTicketSchema>;
```

---

## 🔧 Интеграция с tRPC

### ✅ Правильная интеграция в API routes

```typescript
// apps/web/src/server/trpc/routers/auth.ts
import { securityEnhancedLoginSchema } from '@repo/utils';

export const authRouter = router({
  login: publicProcedure
    .input(securityEnhancedLoginSchema) // ✅ Security-enhanced!
    .mutation(async ({ input }) => {
      // input уже защищён от XSS
      const { email, password, captcha } = input;
      // ...
    }),
});
```

### ❌ Устаревшая интеграция (НЕ используй!)

```typescript
// ❌ НЕПРАВИЛЬНО
import { loginSchema } from '@repo/utils'; // Legacy schema

export const authRouter = router({
  login: publicProcedure
    .input(loginSchema) // Уязвимо к XSS!
    .mutation(async ({ input }) => {
      // ...
    }),
});
```

---

## 🎨 Интеграция с UI формами

### ✅ Правильная форма с security-enhanced validation

```tsx
'use client';

import { useFormWithNextIntl } from '@repo/hooks';
import { securityEnhancedCreateTicketSchema } from '@repo/utils';
import { useTranslations } from 'next-intl';

export function CreateTicketForm() {
  const t = useTranslations('CreateTicketForm');

  const form = useFormWithNextIntl({
    validationSchema: securityEnhancedCreateTicketSchema,
    t,
    initialValues: {
      subject: '',
      description: '',
      priority: 'MEDIUM',
    },
    onSubmit: async values => {
      // values автоматически защищены от XSS
      await createTicket(values);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <Input {...form.getFieldProps('subject')} placeholder={t('subject.placeholder')} />

      <Textarea {...form.getFieldProps('description')} placeholder={t('description.placeholder')} />

      <Select {...form.getFieldProps('priority')}>
        <option value="LOW">{t('priority.low')}</option>
        <option value="MEDIUM">{t('priority.medium')}</option>
        <option value="HIGH">{t('priority.high')}</option>
      </Select>

      <Button type="submit" disabled={form.isSubmitting}>
        {t('submit')}
      </Button>
    </form>
  );
}
```

---

## 🛡️ Безопасность и лучшие практики

### ✅ ВСЕГДА делай

1. **Используй только security-enhanced schemas** для новых форм
2. **Импортируй из централизованного места** `@repo/utils`
3. **Проверяй TypeScript** - должны быть `SecurityEnhanced*` типы
4. **Тестируй XSS protection** - проверяй что вредоносный input блокируется

### ❌ НИКОГДА не делай

1. **НЕ создавай новые legacy schemas** без security enhancement
2. **НЕ импортируй устаревшие schemas** (без `securityEnhanced` префикса)
3. **НЕ переопределяй валидацию** на уровне компонентов
4. **НЕ обходи XSS protection** "для удобства"

---

## 🔄 Миграция legacy кода

### Если встретил legacy schema в коде:

```typescript
// ❌ Найдён legacy код
import { createOrderSchema } from '@repo/utils';

// ✅ Заменить на security-enhanced версию
import { securityEnhancedCreateExchangeOrderSchema } from '@repo/utils';

// ✅ Обновить типы
type OrderData = z.infer<typeof securityEnhancedCreateExchangeOrderSchema>;
```

### Checklist миграции:

- [ ] Заменил import на security-enhanced schema
- [ ] Обновил типы на `SecurityEnhanced*`
- [ ] Проверил что validation работает
- [ ] Протестировал XSS protection
- [ ] Обновил переводы если нужно

---

## 📋 Справочник schemas

### Authentication Schemas

| Legacy Schema          | Security-Enhanced Schema               | Описание                 |
| ---------------------- | -------------------------------------- | ------------------------ |
| `loginSchema`          | `securityEnhancedLoginSchema`          | Форма входа              |
| `registerSchema`       | `securityEnhancedRegisterSchema`       | Регистрация пользователя |
| `resetPasswordSchema`  | `securityEnhancedResetPasswordSchema`  | Сброс пароля             |
| `changePasswordSchema` | `securityEnhancedChangePasswordSchema` | Смена пароля             |

### Exchange Schemas

| Legacy Schema               | Security-Enhanced Schema                    | Описание              |
| --------------------------- | ------------------------------------------- | --------------------- |
| `createExchangeOrderSchema` | `securityEnhancedCreateExchangeOrderSchema` | Создание заказа       |
| `exchangeFormSchema`        | `securityEnhancedExchangeSchema`            | Основная форма обмена |
| `simpleExchangeSchema`      | `securityEnhancedSimpleExchangeSchema`      | Простая форма обмена  |

### Support Schemas

| Legacy Schema             | Security-Enhanced Schema                  | Описание               |
| ------------------------- | ----------------------------------------- | ---------------------- |
| `createTicketSchema`      | `securityEnhancedCreateTicketSchema`      | Создание тикета        |
| `createTicketAdminSchema` | `securityEnhancedCreateTicketAdminSchema` | Админская форма тикета |

### Search Schemas

| Legacy Schema        | Security-Enhanced Schema             | Описание            |
| -------------------- | ------------------------------------ | ------------------- |
| `searchOrdersSchema` | `securityEnhancedSearchOrdersSchema` | Поиск заказов       |
| `searchUsersSchema`  | `securityEnhancedSearchUsersSchema`  | Поиск пользователей |

---

## 🚨 Критические требования

### 1. **Все новые формы ДОЛЖНЫ использовать security-enhanced schemas**

### 2. **Все API endpoints ДОЛЖНЫ использовать security-enhanced schemas в `.input()`**

### 3. **Legacy schemas считаются DEPRECATED и должны заменяться при изменении кода**

### 4. **Code review ДОЛЖЕН проверять использование security-enhanced schemas**

---

## 📚 Дополнительная документация

- **[Validation & Localization Guide](VALIDATION_LOCALIZATION_GUIDE.md)** - интеграция с next-intl
- **[Validation Architecture Guide](VALIDATION_ARCHITECTURE_GUIDE.md)** - архитектурные принципы
- **[Phase 1 Completion Plan](PHASE_1_COMPLETION_PLAN.md)** - план внедрения security-enhanced schemas

---

**💡 Помни: Security-enhanced validation schemas - это не просто "лучшая практика", это обязательный стандарт для всех новых разработок в проекте ExchangeGO.**
