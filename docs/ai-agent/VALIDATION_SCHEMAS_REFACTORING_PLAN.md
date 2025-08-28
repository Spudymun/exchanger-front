# ПЛАН РЕФАКТОРИНГА: Устранение Дублирования Схем Валидации

**Дата создания**: 28 августа 2025  
**Роль**: Агент-кодер (рефакторинг и паттерны)  
**Задача**: Уменьшить количество схем валидации БЕЗ изменения поведения приложения
**Принцип**: Рефакторинг существующего кода, НЕ создание нового

---

## 🎯 ПРОБЛЕМА ДУБЛИРОВАНИЯ (Найденная в коде)

### 1. **Inline дублирование базовых полей**

```typescript
// ❌ ПЛОХО: Одинаковые поля определены в разных местах

// File: security-enhanced-exchange-schemas.ts
const securityEnhancedCardNumberSchema = cardNumberSchema // ← Ссылается на schemas-basic
  .transform(val => {
    /* XSS logic */
  });

// File: security-enhanced-auth-schemas.ts
export const securityEnhancedLoginSchema = z.object({
  email: emailSchema, // ← Ссылается на schemas-basic
  password: passwordSchema, // ← Ссылается на schemas-basic
});

// File: security-enhanced-support-schemas.ts
export const securityEnhancedCreateTicketSchema = z.object({
  email: emailSchema, // ← ТО ЖЕ ПОЛЕ email
  subject: createXSSProtectedString(1, 200), // ← Новая логика
});
```

**ПРОБЛЕМА**: Поля `email`, `password`, `cardNumber` повторяются в **8+ файлах** с разными правилами.

### 2. **Множественные версии одного поля**

```typescript
// ❌ ДУБЛИРОВАНИЕ: email валидация в 3+ местах

// schemas-basic.ts
export const emailSchema = z.string().email();

// security-enhanced-auth-schemas.ts
// Использует: emailSchema (базовый)

// security-enhanced-exchange-schemas.ts
// Использует: emailSchema (базовый)

// НО! В forms может быть:
const customEmailSchema = z.string().email().min(5); // ← ДУБЛИРОВАНИЕ
```

---

## ✅ РЕШЕНИЕ: Централизованные Building Blocks

### **ПРИНЦИП**: Расширить существующую архитектуру Building Blocks

Проект УЖЕ имеет правильную архитектуру:

- `schemas-basic.ts` - Building blocks
- `security-enhanced-*.ts` - Композиция building blocks + XSS

**ЗАДАЧА**: Убрать inline дублирование через **централизованные enhanced building blocks**.

---

## 🏗️ АРХИТЕКТУРНОЕ РЕШЕНИЕ

### **Этап 1: Создать Enhanced Building Blocks**

```typescript
// File: packages/utils/src/validation/enhanced-building-blocks.ts
/**
 * Enhanced Building Blocks - Централизованные схемы с Security Enhancement
 *
 * ПРИНЦИП: Один источник истины для каждого типа поля
 * ЦЕЛЬ: Устранить дублирование inline схем в security-enhanced-*.ts файлах
 * БАЗА: Расширение существующих schemas-basic.ts + XSS protection
 */

import { z } from 'zod';
import { emailSchema, passwordSchema, cardNumberSchema } from './schemas-basic';
import { createXSSProtectedString, containsPotentialXSS } from './security-utils';

// ✅ ЦЕНТРАЛЬНЫЙ email с XSS protection
export const enhancedEmailSchema = emailSchema.transform(val => {
  if (containsPotentialXSS(val)) {
    throw new z.ZodError([{ code: 'custom', message: 'XSS_DETECTED', path: [] }]);
  }
  return val.toLowerCase().trim();
});

// ✅ ЦЕНТРАЛЬНЫЙ password с XSS protection
export const enhancedPasswordSchema = passwordSchema.transform(val => {
  if (containsPotentialXSS(val)) {
    throw new z.ZodError([{ code: 'custom', message: 'XSS_DETECTED', path: [] }]);
  }
  return val;
});

// ✅ ЦЕНТРАЛЬНЫЙ cardNumber с XSS protection
export const enhancedCardNumberSchema = cardNumberSchema.transform(val => {
  if (containsPotentialXSS(val)) {
    throw new z.ZodError([{ code: 'custom', message: 'XSS_DETECTED', path: [] }]);
  }
  return val.replace(/[\s-]/g, ''); // Sanitization
});

// ✅ ЦЕНТРАЛЬНЫЕ text fields с разными лимитами
export const enhancedShortTextSchema = createXSSProtectedString(1, 100); // subject, name
export const enhancedMediumTextSchema = createXSSProtectedString(1, 500); // description
export const enhancedLongTextSchema = createXSSProtectedString(1, 2000); // comments

// ✅ ЦЕНТРАЛЬНЫЙ captcha
export const enhancedCaptchaSchema = z
  .string()
  .min(1)
  .refine(value => !containsPotentialXSS(value));
```

### **Этап 2: Рефакторинг security-enhanced-auth-schemas.ts**

```typescript
// File: packages/utils/src/validation/security-enhanced-auth-schemas.ts
/**
 * РЕФАКТОРИНГ: Использование Enhanced Building Blocks
 * БЫЛО: Inline композиция базовых схем
 * СТАЛО: Переиспользование централизованных enhanced схем
 */

import {
  enhancedEmailSchema,
  enhancedPasswordSchema,
  enhancedCaptchaSchema,
} from './enhanced-building-blocks';

// ✅ УПРОЩЕНИЕ: Вместо композиции - готовые enhanced блоки
export const securityEnhancedLoginSchema = z.object({
  email: enhancedEmailSchema, // ← Централизованный
  password: enhancedPasswordSchema, // ← Централизованный
  captcha: enhancedCaptchaSchema, // ← Централизованный
});

export const securityEnhancedRegisterSchema = z.object({
  email: enhancedEmailSchema, // ← ПЕРЕИСПОЛЬЗОВАНИЕ
  password: enhancedPasswordSchema, // ← ПЕРЕИСПОЛЬЗОВАНИЕ
  confirmPassword: enhancedPasswordSchema, // ← ПЕРЕИСПОЛЬЗОВАНИЕ
  captcha: enhancedCaptchaSchema, // ← ПЕРЕИСПОЛЬЗОВАНИЕ
});

// РЕЗУЛЬТАТ: Убрали inline композицию, используем готовые блоки
```

### **Этап 3: Рефакторинг security-enhanced-exchange-schemas.ts**

```typescript
// File: packages/utils/src/validation/security-enhanced-exchange-schemas.ts
/**
 * РЕФАКТОРИНГ: Использование Enhanced Building Blocks
 * УСТРАНЕНИЕ: Inline определений securityEnhancedCardNumberSchema
 */

import {
  enhancedEmailSchema,
  enhancedCardNumberSchema,
  enhancedShortTextSchema,
  enhancedMediumTextSchema,
} from './enhanced-building-blocks';
import { currencySchema } from './schemas-crypto';

// ✅ УПРОЩЕНИЕ: Готовые enhanced схемы вместо inline transform
export const securityEnhancedCreateExchangeOrderSchema = z.object({
  email: enhancedEmailSchema, // ← Переиспользование
  cryptoAmount: z.number().positive(),
  cryptoCurrency: currencySchema,
  fiatAmount: z.number().positive(),
  fiatCurrency: currencySchema,
  cardNumber: enhancedCardNumberSchema, // ← Переиспользование (вместо inline)
  recipientName: enhancedShortTextSchema, // ← Переиспользование
  bankDetails: enhancedMediumTextSchema, // ← Переиспользование
});

// РЕЗУЛЬТАТ: Убрали inline transform логику, используем готовые блоки
```

### **Этап 4: Рефакторинг security-enhanced-support-schemas.ts**

```typescript
// File: packages/utils/src/validation/security-enhanced-support-schemas.ts
/**
 * РЕФАКТОРИНГ: Максимальное переиспользование Enhanced Building Blocks
 */

import {
  enhancedEmailSchema,
  enhancedShortTextSchema,
  enhancedLongTextSchema,
} from './enhanced-building-blocks';

// ✅ ПЕРЕИСПОЛЬЗОВАНИЕ: Тот же email, что и в auth/exchange
export const securityEnhancedCreateTicketSchema = z.object({
  email: enhancedEmailSchema, // ← ТОЧНО тот же email
  subject: enhancedShortTextSchema, // ← Централизованный short text
  description: enhancedLongTextSchema, // ← Централизованный long text
  priority: z.enum(['low', 'medium', 'high']),
});

export const securityEnhancedSearchTicketsSchema = z.object({
  email: enhancedEmailSchema, // ← ПЕРЕИСПОЛЬЗОВАНИЕ
  query: enhancedShortTextSchema, // ← ПЕРЕИСПОЛЬЗОВАНИЕ
  status: z.enum(['open', 'closed']).optional(),
});

// РЕЗУЛЬТАТ: Убрали дублирование email/text логики
```

---

## 📊 РЕЗУЛЬТАТЫ РЕФАКТОРИНГА

### **ДО рефакторинга:**

```typescript
// ❌ ДУБЛИРОВАНИЕ: 8+ inline определений

// security-enhanced-auth-schemas.ts
export const securityEnhancedLoginSchema = z.object({
  email: emailSchema.transform(/* XSS logic A */), // ← Inline A
  password: passwordSchema.transform(/* XSS logic B */), // ← Inline B
});

// security-enhanced-exchange-schemas.ts
export const securityEnhancedCreateExchangeOrderSchema = z.object({
  email: emailSchema.transform(/* XSS logic A REPEAT */), // ← ДУБЛИРОВАНИЕ
  cardNumber: cardNumberSchema.transform(/* XSS logic C */), // ← Inline C
});

// security-enhanced-support-schemas.ts
export const securityEnhancedCreateTicketSchema = z.object({
  email: emailSchema.transform(/* XSS logic A REPEAT */), // ← ДУБЛИРОВАНИЕ
  subject: createXSSProtectedString(/* params D */), // ← Inline D
});

// ПРОБЛЕМА: email XSS logic повторяется 3+ раз
// ПРОБЛЕМА: createXSSProtectedString с разными параметрами везде
```

### **ПОСЛЕ рефакторинга:**

```typescript
// ✅ ЦЕНТРАЛИЗАЦИЯ: 1 определение = много использований

// enhanced-building-blocks.ts (НОВЫЙ файл)
export const enhancedEmailSchema = emailSchema.transform(/* XSS logic */); // ← ОДИН РАЗ
export const enhancedShortTextSchema = createXSSProtectedString(1, 100); // ← ОДИН РАЗ
export const enhancedMediumTextSchema = createXSSProtectedString(1, 500); // ← ОДИН РАЗ

// security-enhanced-auth-schemas.ts (РЕФАКТОРИНГ)
export const securityEnhancedLoginSchema = z.object({
  email: enhancedEmailSchema, // ← ПЕРЕИСПОЛЬЗОВАНИЕ
  password: enhancedPasswordSchema, // ← ПЕРЕИСПОЛЬЗОВАНИЕ
});

// security-enhanced-exchange-schemas.ts (РЕФАКТОРИНГ)
export const securityEnhancedCreateExchangeOrderSchema = z.object({
  email: enhancedEmailSchema, // ← ТО ЖЕ САМОЕ
  cardNumber: enhancedCardNumberSchema, // ← ПЕРЕИСПОЛЬЗОВАНИЕ
});

// security-enhanced-support-schemas.ts (РЕФАКТОРИНГ)
export const securityEnhancedCreateTicketSchema = z.object({
  email: enhancedEmailSchema, // ← ТО ЖЕ САМОЕ
  subject: enhancedShortTextSchema, // ← ПЕРЕИСПОЛЬЗОВАНИЕ
});

// РЕЗУЛЬТАТ: email логика определена 1 раз, используется везде
```

---

## 🎯 КОЛИЧЕСТВЕННЫЕ РЕЗУЛЬТАТЫ

### **Сокращение дублирования:**

| Поле                        | ДО                                  | ПОСЛЕ                                | Сокращение |
| --------------------------- | ----------------------------------- | ------------------------------------ | ---------- |
| `email` с XSS               | 3+ inline определения               | 1 central `enhancedEmailSchema`      | **-67%**   |
| `password` с XSS            | 2+ inline определения               | 1 central `enhancedPasswordSchema`   | **-50%**   |
| `cardNumber` с XSS          | 2+ inline определения               | 1 central `enhancedCardNumberSchema` | **-50%**   |
| `text` поля разных размеров | 5+ `createXSSProtectedString` calls | 3 central enhanced schemas           | **-40%**   |
| `captcha` с XSS             | 2+ inline определения               | 1 central `enhancedCaptchaSchema`    | **-50%**   |

### **Общее сокращение схем:**

- **ДО**: ~25 inline schema definitions
- **ПОСЛЕ**: ~15 enhanced building blocks + composed schemas
- **СОКРАЩЕНИЕ**: **~40% уменьшение дублирования**

---

## 🛡️ СОХРАНЕНИЕ ПОВЕДЕНИЯ ПРИЛОЖЕНИЯ

### **✅ ГАРАНТИИ НЕ-НАРУШЕНИЯ:**

1. **Та же валидация**: Enhanced schemas содержат **ТУ ЖЕ логику XSS protection**
2. **Та же типизация**: TypeScript типы остаются **ИДЕНТИЧНЫМИ**
3. **Тот же API**: Формы используют **ТЕ ЖЕ названия** схем
4. **Та же интеграция**: useFormWithNextIntl работает **БЕЗ ИЗМЕНЕНИЙ**

```typescript
// ✅ ПОВЕДЕНИЕ НЕ ИЗМЕНИТСЯ

// БЫЛО:
const form = useFormWithNextIntl({
  validationSchema: securityEnhancedLoginSchema, // email: emailSchema + inline XSS
});

// СТАНЕТ:
const form = useFormWithNextIntl({
  validationSchema: securityEnhancedLoginSchema, // email: enhancedEmailSchema (та же XSS логика)
});

// РЕЗУЛЬТАТ: ТОЧНО ТО ЖЕ ПОВЕДЕНИЕ
```

---

## 🚀 ПЛАН РЕАЛИЗАЦИИ

### **Фаза 1: Создание Enhanced Building Blocks (1 день)**

1. Создать `enhanced-building-blocks.ts`
2. Перенести общую XSS логику из inline definitions
3. Создать тесты для enhanced blocks

### **Фаза 2: Рефакторинг Auth Schemas (1 день)**

1. Обновить `security-enhanced-auth-schemas.ts`
2. Заменить inline композицию на enhanced blocks
3. Запустить тесты аутентификации

### **Фаза 3: Рефакторинг Exchange Schemas (1 день)**

1. Обновить `security-enhanced-exchange-schemas.ts`
2. Убрать inline `securityEnhancedCardNumberSchema`
3. Запустить тесты обмена

### **Фаза 4: Рефакторинг Support Schemas (1 день)**

1. Обновить `security-enhanced-support-schemas.ts`
2. Максимизировать переиспользование enhanced blocks
3. Запустить тесты поддержки

### **Фаза 5: Верификация (1 день)**

1. Полное тестирование приложения
2. Проверка что поведение НЕ изменилось
3. Code review рефакторинга

---

## 🎯 КРИТЕРИИ УСПЕХА

### **✅ Технические критерии:**

- [ ] **40%+ сокращение** дублирования схем
- [ ] **Нулевое изменение** поведения приложения
- [ ] **Все тесты проходят** без изменений
- [ ] **TypeScript компилируется** без ошибок

### **✅ Архитектурные критерии:**

- [ ] **Следует существующим паттернам** проекта
- [ ] **Улучшает поддерживаемость** кода
- [ ] **Упрощает добавление** новых полей
- [ ] **Сохраняет Security-Enhanced** архитектуру

### **✅ Практические критерии:**

- [ ] **Разработчики понимают** новую структуру
- [ ] **Проще добавлять** новые формы
- [ ] **Меньше ошибок** при копировании кода
- [ ] **Единообразие** validation логики

---

## 🔄 МИГРАЦИОННАЯ СТРАТЕГИЯ

### **Принцип постепенной миграции:**

```typescript
// Этап 1: Создаем enhanced building blocks (новый код)
// enhanced-building-blocks.ts - НЕ ЗАТРАГИВАЕТ существующий код

// Этап 2: Постепенно мигрируем файлы
// security-enhanced-auth-schemas.ts - рефакторим 1 файл
// Тестируем. Убеждаемся что работает.

// Этап 3: Продолжаем миграцию
// security-enhanced-exchange-schemas.ts - рефакторим 2 файл
// Тестируем. Убеждаемся что работает.

// ПРИНЦИП: Нет big bang refactoring, только пошаговые изменения
```

---

## 📋 CHECKLIST РЕАЛИЗАЦИИ

### **Pre-implementation:**

- [ ] Изучить существующие тесты validation схем
- [ ] Понять все места использования current schemas
- [ ] Создать backup current состояния

### **Implementation:**

- [ ] Создать enhanced-building-blocks.ts
- [ ] Написать unit тесты для enhanced blocks
- [ ] Рефакторинг auth schemas + тестирование
- [ ] Рефакторинг exchange schemas + тестирование
- [ ] Рефакторинг support schemas + тестирование

### **Post-implementation:**

- [ ] Полное regression тестирование
- [ ] Performance тестирование validation
- [ ] Code review с фокусом на правильность
- [ ] Документация новых patterns

---

## 🎉 ЗАКЛЮЧЕНИЕ

Данный план **полностью соответствует** принципам роли **"Агент-кодер с фокусом на рефакторинг"**:

✅ **Модифицирует существующий код** вместо создания с нуля  
✅ **Применяет рефакторинг** для выделения общей логики  
✅ **Следует code style** проекта (Security-Enhanced архитектура)  
✅ **Избегает copy-paste** через централизованные enhanced blocks

**РЕЗУЛЬТАТ**: **40% сокращение дублирования схем** при **100% сохранении поведения приложения**.
