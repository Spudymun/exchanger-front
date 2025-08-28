# АРХИТЕКТУРНОЕ РЕШЕНИЕ: Унификация Схем Валидации

**Дата создания**: 28 августа 2025  
**Архитектор**: AI Agent (Architecture Role)  
**Источник анализа**: `docs/ai-agent/VALIDATION_PROLIFERATION_IMPACT_ANALYSIS.md`  
**Статус**: Архитектурный план готов к реализации

---

## 🎯 EXECUTIVE SUMMARY

На основе детального изучения архитектуры проекта и существующих паттернов, предлагается **эволюционный подход** к унификации схем валидации, который **полностью соответствует принципам проекта** и **не нарушает существующую архитектуру**.

### Ключевые принципы решения:

- ✅ **Соответствие существующей Security-Enhanced архитектуре**
- ✅ **Расширение базовых схем (schemas-basic.ts) по установленному паттерну**
- ✅ **Сохранение обратной совместимости с текущими формами**
- ✅ **Следование модульной структуре validation/ директории**
- ✅ **Интеграция с useFormWithNextIntl + compound pattern**

---

## 🏛️ АРХИТЕКТУРНОЕ ОБОСНОВАНИЕ

### 1. СООТВЕТСТВИЕ ПРИНЦИПАМ ПРОЕКТА

#### **Принцип 1: Security-First Architecture**

```typescript
// ✅ СООТВЕТСТВУЕТ: Проект использует security-enhanced подход
// Текущие формы УЖЕ используют:
import { fullySecurityEnhancedLoginSchema } from '@repo/utils';

// Наше решение РАСШИРЯЕТ эту архитектуру:
export const fullySecurityEnhancedLoginSchema = z.object({
  email: emailSchema, // ← Базовая схема из schemas-basic.ts
  password: passwordSchema, // ← Базовая схема из schemas-basic.ts
  captcha: securityEnhancedCaptchaSchema,
});
```

#### **Принцип 2: Композитная архитектура (Building Blocks)**

```typescript
// ✅ СООТВЕТСТВУЕТ: Проект использует композицию базовых схем
// Документация VALIDATION_ARCHITECTURE_GUIDE.md утверждает:
// "Security-enhanced schemas КОМПОЗИРУЮТ базовые building blocks"

// Наше решение СЛЕДУЕТ этому принципу:
packages/utils/src/validation/
├── schemas-basic.ts           # 📦 Building blocks (emailSchema, passwordSchema)
├── security-enhanced-*.ts     # 🛡️ Композиция с XSS protection
```

#### **Принцип 3: Модульная структура валидации**

```typescript
// ✅ СООТВЕТСТВУЕТ: Проект УЖЕ имеет модульную структуру
security-enhanced-schemas.ts    # Главный экспорт
├── security-enhanced-auth-schemas.ts     # Аутентификация
├── security-enhanced-exchange-schemas.ts # Обмен
├── security-enhanced-support-schemas.ts  # Поддержка

// Наше решение НЕ НАРУШАЕТ структуру
```

### 2. ЗАПРЕТ НА ИЗОБРЕТЕНИЕ ВЕЛОСИПЕДОВ

#### **✅ Что УЖЕ РАБОТАЕТ в проекте:**

**Система useFormWithNextIntl + Security-Enhanced**:

```typescript
// СУЩЕСТВУЮЩИЙ паттерн в LoginForm.tsx:
const form = useFormWithNextIntl<LoginFormData>({
  initialValues: { email: '', password: '', captcha: '' },
  validationSchema: fullySecurityEnhancedLoginSchema, // 🛡️ XSS protected
  t: tValidation,
  onSubmit: async (values: LoginFormData) => {
    /* ... */
  },
});
```

**Система Compound Pattern для форм**:

```typescript
// СУЩЕСТВУЮЩИЙ паттерн в RegisterForm.tsx:
<AuthForm form={form} isLoading={register.isPending} t={tValidation}>
  <AuthForm.FormWrapper>
    <AuthForm.FieldWrapper>
      <FormEmailField />      // Автоматически подключается к form
      <AuthPasswordField />   // Через AuthFormContext
    </AuthForm.FieldWrapper>
  </AuthForm.FormWrapper>
</AuthForm>
```

**Система централизованных констант**:

```typescript
// СУЩЕСТВУЮЩИЙ паттерн в schemas-basic.ts:
import { VALIDATION_LIMITS, VALIDATION_PATTERNS } from '@repo/constants';
export const PASSWORD_MIN_LENGTH = VALIDATION_LIMITS.PASSWORD_MIN_LENGTH;
```

**❌ Что НЕ нужно изобретать:**

- Новую систему валидации (useFormWithNextIntl работает)
- Новую архитектуру безопасности (security-enhanced есть)
- Новые паттерны форм (compound pattern настроен)
- Новую систему локализации (createNextIntlZodErrorMap есть)

### 3. ШАБЛОНЫ ПРОЕКТИРОВАНИЯ

#### **Применяемые паттерны из проекта:**

**Builder Pattern (для схем валидации)**:

```typescript
// ✅ СУЩЕСТВУЮЩИЙ паттерн в проекте
// Базовые building blocks:
const emailSchema = z.string().min(1).refine(/* validation logic */);
const passwordSchema = z.string().min(8).refine(/* security rules */);

// Композиция в security-enhanced схемы:
const securityEnhancedLoginSchema = z.object({
  email: emailSchema, // ← Building block
  password: passwordSchema, // ← Building block
});
```

**Factory Pattern (для XSS protection)**:

```typescript
// ✅ СУЩЕСТВУЮЩИЙ паттерн в security-utils.ts
export const createXSSProtectedString = (minLength: number, maxLength: number) => {
  return z
    .string()
    .min(minLength)
    .max(maxLength)
    .refine(val => !containsPotentialXSS(val), {
      message: XSS_CONTENT_DETECTED_MESSAGE,
    });
};
```

**Module Pattern (для валидации)**:

```typescript
// ✅ СУЩЕСТВУЮЩАЯ структура модулей
security-enhanced-schemas.ts        // Main export
└── Re-exports from:
    ├── security-enhanced-auth-schemas.ts
    ├── security-enhanced-exchange-schemas.ts
    └── security-enhanced-support-schemas.ts
```

### 4. КОНТРАКТЫ И ИНТЕРФЕЙСЫ

#### **Существующие контракты в проекте:**

**useFormWithNextIntl Contract**:

```typescript
// ✅ УСТАНОВЛЕННЫЙ контракт в проекте
interface UseFormWithNextIntlParams<T> {
  initialValues: T;
  validationSchema: ZodSchema<T>; // ← Zod schema contract
  t: (key: string) => string; // ← next-intl contract
  onSubmit: (values: T) => Promise<void>;
}
```

**Security-Enhanced Schema Contract**:

```typescript
// ✅ УСТАНОВЛЕННЫЙ контракт для security schemas
// Все security-enhanced схемы должны:
// 1. Композировать базовые building blocks
// 2. Применять XSS protection через createXSSProtectedString
// 3. Использовать систему handlers.ts для локализации
// 4. Экспортировать TypeScript типы
```

**Compound Component Contract**:

```typescript
// ✅ УСТАНОВЛЕННЫЙ контракт для AuthForm
interface AuthFormProps {
  form: UseFormReturn<Record<string, unknown>>;
  isLoading: boolean;
  t: (key: string) => string;
  fieldId: string;
  // Автоматическое внедрение props через AuthFormContext
}
```

---

## 🏗️ АРХИТЕКТУРНОЕ РЕШЕНИЕ

### СТРАТЕГИЯ: "Эволюционная централизация с расширением базовых схем"

#### **Фаза 1: Расширение базовых building blocks**

**1.1 Дополнение schemas-basic.ts (по образцу существующих)**

```typescript
// packages/utils/src/validation/schemas-basic.ts

// ✅ ДОБАВИТЬ: Недостающие базовые схемы по образцу emailSchema
export const cardNumberSchema = z
  .string()
  .min(1) // Приоритет: пустое поле → required message
  .refine(val => {
    if (val.length > 0) {
      const sanitized = sanitizeCardNumber(val);
      return validateCardLength(sanitized) && luhnCheck(sanitized);
    }
    return true;
  });

export const phoneSchema = z
  .string()
  .min(1)
  .refine(val => {
    if (val.length > 0) {
      return VALIDATION_PATTERNS.PHONE.test(val);
    }
    return true;
  });

export const nameSchema = z
  .string()
  .min(1)
  .max(VALIDATION_LIMITS.NAME_MAX_LENGTH)
  .refine(val => {
    if (val.length > 0) {
      return VALIDATION_PATTERNS.NAME.test(val);
    }
    return true;
  });
```

**1.2 Интеграция в существующие security-enhanced схемы**

```typescript
// packages/utils/src/validation/security-enhanced-exchange-schemas.ts

// ✅ ЗАМЕНА inline cardNumberSchema на базовую схему
import { cardNumberSchema } from './schemas-basic';

export const securityEnhancedCreateExchangeOrderSchema = z.object({
  email: emailSchema, // ← Уже используется базовая
  cardNumber: cardNumberSchema, // ← НОВОЕ: базовая схема вместо inline
  cryptoAmount: z.string() /* ... */,
});
```

#### **Фаза 2: Унификация через централизованные handlers**

**2.1 Устранение хардкодных messages**

```typescript
// ✅ ИСПРАВЛЕНИЕ: Убрать хардкодные сообщения
// БЫЛО в security-enhanced-auth-schemas.ts:
.refine(data => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match', // ❌ Хардкод
});

// СТАНЕТ:
.refine(data => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  // message удален - обрабатывается handleConfirmPasswordValidation
});
```

**2.2 Расширение handlers.ts**

```typescript
// packages/utils/src/validation/handlers.ts

// ✅ ДОБАВИТЬ: Недостающие handlers
export function handleCardNumberValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
) {
  if (issue.path?.includes('cardNumber')) {
    if (issue.code === 'too_small') {
      return { message: t(VALIDATION_KEYS.CARD_NUMBER_REQUIRED) };
    }
    if (issue.code === 'custom') {
      return { message: t(VALIDATION_KEYS.CARD_NUMBER_INVALID) };
    }
  }
  return null;
}

export function handlePhoneValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
) {
  // Аналогично для phone validation
}
```

#### **Фаза 3: Миграция форм (без breaking changes)**

**3.1 Сохранение существующей архитектуры форм**

```typescript
// ✅ ФОРМЫ НЕ МЕНЯЮТСЯ - только schema references
// apps/web/src/components/forms/LoginForm.tsx

// ОСТАЕТСЯ как есть:
const form = useFormWithNextIntl<LoginFormData>({
  initialValues: { email: '', password: '', captcha: '' },
  validationSchema: fullySecurityEnhancedLoginSchema, // ← Та же схема
  t: tValidation,
  // Никаких изменений в форме!
});

// ОСТАЕТСЯ как есть:
<AuthForm form={form} isLoading={login.isPending} t={tValidation}>
  <AuthForm.FormWrapper>
    <AuthForm.FieldWrapper>
      <FormEmailField />   // ← Те же компоненты
      <AuthPasswordField />
    </AuthForm.FieldWrapper>
  </AuthForm.FormWrapper>
</AuthForm>
```

**3.2 Постепенная миграция validation references**

```typescript
// ✅ ЭТАПНАЯ замена дублированных inline схем на базовые
// Пример для exchange форм:

// БЫЛО:
const cardSchema = z.string().regex(/^\d{16}$/); // inline в форме

// СТАНЕТ:
import { cardNumberSchema } from '@repo/utils/validation/schemas-basic';
// Использование cardNumberSchema
```

---

## 📋 IMPLEMENTATION ROADMAP

### **✅ ВЫПОЛНЕНО: Foundation & Unification (12 часов)**

#### **✅ Задача 1.1: Расширение базовых схем**

- [x] Добавить `cardNumberSchema` в `schemas-basic.ts`
- [x] ~~Добавить `phoneSchema`~~ (phoneInternationalSchema уже был)
- [x] Добавить `nameSchema` в `schemas-basic.ts`
- [x] Обновить экспорты в `index.ts`

#### **✅ Задача 1.2: Расширение handlers**

- [x] ~~Добавить `handleCardNumberValidation`~~ (уже был)
- [x] ~~Добавить `handlePhoneValidation`~~ (не требовался)
- [x] Добавить `handleNameValidation` в `handlers.ts`
- [x] Обновить `handleFormFieldValidation` function в `core.ts`

#### **✅ Задача 1.3: Устранение дублирования**

- [x] Заменить инлайн `cardNumberSchema` в security-enhanced-exchange-schemas.ts
- [x] Унифицировать XSS refine паттерны в auth schemas
- [x] Добавить `VALIDATION_PATTERNS.NAME` в constants
- [x] Использовать централизованные константы вместо magic numbers

#### **✅ Задача 1.4: Integration Testing**

- [x] Протестировать HeroExchangeForm на главной странице
- [x] Протестировать LoginForm функциональность
- [x] Убедиться что формы работают с новыми схемами
- [x] Проверить сохранность XSS protection

#### **Задача 1.3: Обновление констант**

- [ ] Добавить недостающие `VALIDATION_KEYS` в `constants.ts`
- [ ] Обновить локализационные файлы `en.json`, `ru.json`

### **Sprint 2: Schema Unification (16-20 часов)**

#### **Задача 2.1: Унификация auth schemas**

- [ ] Заменить inline схемы в `security-enhanced-auth-schemas.ts` на базовые
- [ ] Удалить хардкодные messages из auth schemas
- [ ] Обновить тесты для auth validation

#### **Задача 2.2: Унификация exchange schemas**

- [ ] Заменить inline `cardNumberSchema` в `security-enhanced-exchange-schemas.ts`
- [ ] Унифицировать email validation между доменами
- [ ] Обновить тесты для exchange validation

#### **Задача 2.3: Унификация support schemas**

- [ ] Проверить email schemas в support domain
- [ ] Привести к единому стандарту с auth
- [ ] Обновить тесты для support validation

### **Sprint 3: Testing & Documentation (8-12 часов)**

#### **Задача 3.1: Комплексное тестирование**

- [ ] Unit тесты для всех новых базовых схем
- [ ] Integration тесты для форм с unified schemas
- [ ] E2E тесты пользовательских сценариев
- [ ] Consistency тесты между формами

#### **Задача 3.2: Обновление документации**

- [ ] Обновить `VALIDATION_ARCHITECTURE_GUIDE.md`
- [ ] Обновить `SECURITY_ENHANCED_VALIDATION_GUIDE.md`
- [ ] Создать migration guide для разработчиков
- [ ] Обновить code review guidelines

### **Sprint 4: Legacy Cleanup (4-8 часов)**

#### **Задача 4.1: Cleanup deprecated schemas**

- [ ] Пометить legacy schemas как DEPRECATED
- [ ] Создать deprecation warnings
- [ ] Планирование полного удаления legacy кода

---

## 🔒 КОНТРОЛЬ КАЧЕСТВА

### **Non-Functional Requirements**

#### **Производительность**

- ✅ **Нет деградации**: Базовые схемы НЕ медленнее inline
- ✅ **Лучше caching**: Переиспользование схем улучшает memory usage
- ✅ **Bundle size**: Устранение дублирования → меньший размер

#### **Безопасность**

- ✅ **Сохранение XSS protection**: Все security-enhanced схемы остаются защищенными
- ✅ **Усиление безопасности**: Унификация предотвращает пропуск защиты
- ✅ **Consistency**: Одинаковый уровень безопасности во всех формах

#### **Maintainability**

- ✅ **DRY principle**: Устранение дублирования логики валидации
- ✅ **Single source of truth**: Изменения в одном месте влияют везде
- ✅ **Easier testing**: Тестирование базовых схем → покрытие всех форм

### **Breaking Changes Analysis**

#### **🟢 НЕТ breaking changes для:**

- Существующих форм (используют те же validation schemas)
- API endpoints (tRPC schemas остаются совместимы)
- UI компонентов (AuthForm, compound pattern остается)
- Локализации (ключи и система handlers сохраняется)

#### **🟡 Минимальные changes для:**

- Internal implementation schemas (улучшение архитектуры)
- Тестов (обновление для лучшего покрытия)
- Документации (отражение новой архитектуры)

---

## 🎯 SUCCESS CRITERIA

### **Технические критерии:**

1. **✅ Единообразие валидации**: Все формы с одинаковыми полями показывают идентичные ошибки
2. **✅ Отсутствие дублирования**: 0 inline схем для базовых полей (email, password, cardNumber)
3. **✅ Centralised error handling**: 100% сообщений обрабатывается через handlers.ts
4. **✅ Type safety**: Полная типизация всех унифицированных схем
5. **✅ Test coverage**: 100% покрытие базовых схем и их использования

### **Бизнес критерии:**

1. **✅ UX consistency**: Пользователи видят одинаковые ошибки для одинаковых полей
2. **✅ Development velocity**: Новые формы создаются быстрее через базовые схемы
3. **✅ Maintenance cost**: Изменения валидации требуют правок в одном месте
4. **✅ Security posture**: Усиленная безопасность через централизованные правила

---

## 🛠️ ПЛАН РЕАЛИЗАЦИИ ДЛЯ АГЕНТА-КОДЕРА

### СТРАТЕГИЯ РЕФАКТОРИНГА: "Минимальные изменения, максимальная интеграция"

Как агент-кодер со специализацией на рефакторинг, я применю **паттерн постепенной модернизации** без нарушения существующей архитектуры.

#### **ЭТАП 1: АУДИТ И ПОДГОТОВКА (4-6 часов)**

**Задача 1.1: Deep Analysis существующих схем**

```typescript
// ДЕЙСТВИЕ: Изучить все inline схемы для выявления паттернов дублирования
1. Проанализировать security-enhanced-exchange-schemas.ts
   - Найти все inline cardNumberSchema определения
   - Выявить дублирование email schemas между доменами
   - Составить список всех inline validation логик

2. Проанализировать security-enhanced-auth-schemas.ts
   - Найти дублирование XSS refine паттернов
   - Выявить hardcoded message strings
   - Определить возможности абстрагирования

3. Создать Refactoring Map
   - Схемы для вынесения в schemas-basic.ts
   - Handlers для унификации в handlers.ts
   - XSS patterns для абстрагирования в security-utils.ts
```

**Задача 1.2: Compatibility Testing Framework**

```typescript
// ДЕЙСТВИЕ: Создать инфраструктуру для safe refactoring
1. Создать unit tests для всех текущих validation schemas
2. Создать integration tests для форм с существующими схемами
3. Установить baseline для regression testing
4. Подготовить mock data для comprehensive testing
```

#### **ЭТАП 2: БАЗОВЫЕ СХЕМЫ РЕФАКТОРИНГ (8-10 часов)**

**Задача 2.1: Расширение schemas-basic.ts (модернизация building blocks)**

```typescript
// МОДИФИКАЦИЯ: packages/utils/src/validation/schemas-basic.ts

// ✅ ДОБАВИТЬ: cardNumberSchema (вынос из inline)
export const cardNumberSchema = z
  .string()
  .min(1) // Стандартная zod валидация - обрабатывается handlers.ts
  .refine(val => {
    if (val.length > 0) {
      const sanitized = sanitizeCardNumber(val);
      return validateCardLength(sanitized) && luhnCheck(sanitized);
    }
    return true; // Пустая строка обрабатывается в min(1)
  });

// ✅ ДОБАВИТЬ: phoneSchema (новая базовая схема)
export const phoneSchema = z
  .string()
  .min(1)
  .refine(val => {
    if (val.length > 0) {
      return VALIDATION_PATTERNS.PHONE.test(val);
    }
    return true;
  });

// ✅ ДОБАВИТЬ: nameSchema (унификация имен)
export const nameSchema = z
  .string()
  .min(1)
  .max(VALIDATION_LIMITS.NAME_MAX_LENGTH)
  .refine(val => {
    if (val.length > 0) {
      return VALIDATION_PATTERNS.NAME.test(val);
    }
    return true;
  });
```

**Задача 2.2: Модернизация handlers.ts (устранение hardcoded messages)**

```typescript
// МОДИФИКАЦИЯ: packages/utils/src/validation/handlers.ts

// ✅ ДОБАВИТЬ: handleCardNumberValidation
export function handleCardNumberValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  if (issue.path?.length !== 1 || issue.path[0] !== 'cardNumber') {
    return null;
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    return createValidationMessage(VALIDATION_KEYS.CARD_NUMBER_REQUIRED, t);
  }

  if (issue.code === z.ZodIssueCode.custom) {
    return createValidationMessage(VALIDATION_KEYS.CARD_NUMBER_INVALID, t);
  }

  return null;
}

// ✅ МОДИФИЦИРОВАТЬ: handleFormFieldValidation (добавить новые handlers)
export function handleFormFieldValidation(/* ... */) {
  // Существующая логика...

  // ДОБАВИТЬ:
  const cardResult = handleCardNumberValidation(issue, t);
  if (cardResult) return cardResult;

  const phoneResult = handlePhoneValidation(issue, t);
  if (phoneResult) return phoneResult;

  const nameResult = handleNameValidation(issue, t);
  if (nameResult) return nameResult;

  // Остальная логика...
}
```

#### **ЭТАП 3: SECURITY-ENHANCED РЕФАКТОРИНГ (10-12 часов)**

**Задача 3.1: Модернизация security-enhanced-auth-schemas.ts**

```typescript
// МОДИФИКАЦИЯ: packages/utils/src/validation/security-enhanced-auth-schemas.ts

// ❌ УДАЛИТЬ: Hardcoded XSS refine паттерны
// БЫЛО:
email: emailSchema.refine(val => !containsPotentialXSS(val), {
  message: XSS_CONTENT_DETECTED_MESSAGE, // Хардкод!
});

// ✅ ЗАМЕНИТЬ: На композицию базовой схемы + security utils
email: (createSecurityEnhancedEmailSchema(), // Абстрагированная функция
  // ✅ ДОБАВИТЬ: Фабрика для безопасных email схем
  function createSecurityEnhancedEmailSchema() {
    return emailSchema.refine(val => !containsPotentialXSS(val)); // message удален - обрабатывается handlers
  });
```

**Задача 3.2: Модернизация security-enhanced-exchange-schemas.ts**

```typescript
// МОДИФИКАЦИЯ: packages/utils/src/validation/security-enhanced-exchange-schemas.ts

// ❌ УДАЛИТЬ: Inline cardNumberSchema definition
// БЫЛО: 30+ строк inline валидации

// ✅ ЗАМЕНИТЬ: На импорт базовой схемы
import { cardNumberSchema } from './schemas-basic';

// ✅ МОДИФИЦИРОВАТЬ: securityEnhancedCreateExchangeOrderSchema
export const securityEnhancedCreateExchangeOrderSchema = z.object({
  email: emailSchema, // Уже используется базовая
  cardNumber: cardNumberSchema, // НОВОЕ: базовая схема вместо inline
  cryptoAmount: z.string() /* существующая логика */,
  // Остальные поля без изменений
});
```

#### **ЭТАП 4: FORMS INTEGRATION TESTING (6-8 часов)**

**Задача 4.1: Regression Testing существующих форм**

```typescript
// ДЕЙСТВИЕ: Убедиться что formы работают с новыми схемами
1. Тестировать LoginForm.tsx с обновленными schemas
   - useFormWithNextIntl совместимость
   - AuthForm compound component работа
   - Локализация ошибок через handlers.ts

2. Тестировать ExchangeForm компоненты
   - cardNumberSchema integration в формы обмена
   - Совместимость с existing UI компонентами
   - XSS protection preservation

3. E2E тестирование user scenarios
   - Полный flow авторизации
   - Полный flow создания обмена
   - Проверка consistency сообщений валидации
```

**Задача 4.2: Integration с существующими Compound Components**

```typescript
// ДЕЙСТВИЕ: Обеспечить seamless integration с UI
1. Проверить AuthForm compound component совместимость
   - FormEmailField + обновленные schemas
   - AuthPasswordField + базовые схемы
   - Автоматическое подключение через AuthFormContext

2. Проверить ExchangeForm components
   - CryptoAmountInput + cardNumberSchema
   - ExchangeBankSelector + обновленная валидация
   - Сохранение всех существующих props и behaviors
```

#### **ЭТАП 5: DOCUMENTATION И CLEANUP (4-6 часов)**

**Задача 5.1: Code Documentation Update**

```typescript
// ДЕЙСТВИЕ: Обновить архитектурную документацию
1. Обновить VALIDATION_ARCHITECTURE_GUIDE.md
   - Отразить новые базовые схемы
   - Документировать рефакторинг patterns
   - Примеры использования обновленных schemas

2. Обновить inline comments в коде
   - Объяснить архитектурные решения
   - Указать ссылки на базовые схемы
   - Документировать паттерны рефакторинга
```

**Задача 5.2: Legacy Code Cleanup**

```typescript
// ДЕЙСТВИЕ: Удаление устаревшего кода
1. Удалить закомментированные inline schemas
2. Убрать unused imports после рефакторинга
3. Обновить TypeScript exports
4. Провести final linting и formatting
```

#### **КАЧЕСТВЕННЫЕ КРИТЕРИИ РЕФАКТОРИНГА:**

**✅ Architectural Integrity**

- Сохранение всех существующих паттернов (useFormWithNextIntl, AuthForm, etc.)
- Усиление Security-Enhanced архитектуры через лучшую композицию
- Соблюдение DRY principle через устранение inline дублирования

**✅ Backward Compatibility**

- 100% совместимость с существующими формами
- Сохранение всех API signatures
- Никаких breaking changes для UI компонентов

**✅ Code Quality Improvement**

- Устранение 15+ instances inline дублирования
- Централизация validation логики в building blocks
- Улучшение maintainability через single source of truth

**✅ Testing Coverage**

- 100% regression tests проходят
- Новые unit tests для базовых схем
- Integration tests для модернизированных forms

---

## 🏁 ЗАКЛЮЧЕНИЕ

Как агент-кодер, я применю **минимально инвазивный рефакторинг** для максимальной интеграции с существующей архитектурой:

### **✅ Рефакторинг принципы:**

- **Модификация, а не переписывание**: Расширение schemas-basic.ts вместо создания новой системы
- **Постепенная модернизация**: Поэтапная замена inline схем на базовые building blocks
- **Паттерн preservation**: Сохранение всех установленных паттернов (compound, hooks, security)
- **Safe integration**: Comprehensive testing на каждом этапе для предотвращения регрессий

### **✅ Архитектурная ценность:**

- **Усиление DRY principle**: Устранение 15+ дублирований через centralized schemas
- **Improved maintainability**: Single source of truth для validation logic
- **Better security consistency**: Единообразное применение XSS protection
- **Future scalability**: Легкое добавление новых схем через established patterns

### **✅ Implementation готовность:**

- **Детальный roadmap**: 32-42 часа structured refactoring
- **Risk mitigation**: Comprehensive testing на каждом этапе
- **Incremental delivery**: Каждый этап приносит measurable value
- **Full compatibility**: Нет impact на existing user experience

**РЕКОМЕНДАЦИЯ**: Немедленно приступить к implementation. Рефакторинг план готов, архитектурные риски минимизированы, integration strategy проработана.
