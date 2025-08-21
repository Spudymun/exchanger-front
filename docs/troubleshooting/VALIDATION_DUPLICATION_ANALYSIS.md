# 📊 АНАЛИЗ ДУБЛИРОВАНИЯ VALIDATION SCHEMAS

**📅 Дата анализа:** 21 августа 2025  
**🔍 Тип технического долга:** Критическое дублирование кода  
**⚖️ Уровень приоритета:** HIGH (Rule 15 из tech_debt_rules.yaml)  
**🎯 Статус:** ЗАДОКУМЕНТИРОВАНО - ожидает исправления

---

## 🚨 EXECUTIVE SUMMARY

**НАЙДЕНО:** 5 validation schemas с критическим дублированием  
**ЗАТРОНУТО:** 2 файла, 5 схем, 15+ дублированных полей  
**SECURITY РИСКИ:** 3 схемы БЕЗ XSS защиты  
**MAINTENANCE COST:** Изменения требуют правки в 5 местах

---

## 📋 ДЕТАЛЬНАЯ ИНВЕНТАРИЗАЦИЯ СХЕМ

### **Schema #1: `securityEnhancedSimpleExchangeSchema`**

**📍 Location:** `packages/utils/src/validation/security-enhanced-exchange-schemas.ts:24`  
**🎯 Purpose:** Простая форма обмена  
**🔒 Security:** ✅ XSS Protection

```typescript
FIELDS:
├── currency: z.enum(['BTC', 'ETH', 'USDT', 'LTC'])     [ДУБЛЬ ×5]
├── cryptoAmount: z.string() + XSS protection          [ДУБЛЬ ×5]
└── email: emailSchema                                  [ДУБЛЬ ×4]
```

### **Schema #2: `securityEnhancedCreateExchangeOrderSchema`**

**📍 Location:** `packages/utils/src/validation/security-enhanced-exchange-schemas.ts:44`  
**🎯 Purpose:** Создание заказа обмена  
**🔒 Security:** ⚠️ Частичная XSS защита

```typescript
FIELDS:
├── email: emailSchema                                  [ДУБЛЬ ×4]
├── cryptoAmount: z.number() + VALIDATION_LIMITS       [ДУБЛЬ ×5]
├── uahAmount: z.number()                              [УНИКАЛЬНО]
├── currency: currencySchema                           [ДУБЛЬ ×5]
└── paymentDetails: { cardNumber, bankDetails }        [УНИКАЛЬНО]
```

### **Schema #3: `securityEnhancedExchangeSchema`**

**📍 Location:** `packages/utils/src/validation/security-enhanced-exchange-schemas.ts:82`  
**🎯 Purpose:** Расширенная форма обмена  
**🔒 Security:** ⚠️ Частичная XSS защита

```typescript
FIELDS:
├── fromCurrency: currencySchema                       [ДУБЛЬ ×5]
├── toCurrency: currencySchema                         [ДУБЛЬ ×5]
├── amount: z.number() + VALIDATION_LIMITS             [ДУБЛЬ ×5 - IDENTICAL to #2]
├── email: emailSchema                                 [ДУБЛЬ ×4]
├── comment: createXSSProtectedString()                [УНИКАЛЬНО]
└── agreeToTerms: z.boolean()                         [ДУБЛЬ ×2]
```

### **Schema #4: `securityEnhancedAdvancedExchangeFormSchema`**

**📍 Location:** `packages/utils/src/validation/security-enhanced-exchange-schemas.ts:99`  
**🎯 Purpose:** Продвинутая форма с полной валидацией  
**🔒 Security:** ✅ Полная XSS защита + Luhn validation

```typescript
FIELDS:
├── fromCurrency: currencySchema                       [ДУБЛЬ ×5]
├── tokenStandard: z.string().optional()              [ДУБЛЬ ×2]
├── cryptoAmount: z.string().transform(Number)         [ДУБЛЬ ×5]
├── toCurrency: z.literal('UAH')                       [ДУБЛЬ ×3]
├── selectedBank: z.string().min(1)                   [ДУБЛЬ ×2]
├── cardNumber: z.string() + XSS + Luhn               [УНИКАЛЬНО]
├── email: emailSchema                                 [ДУБЛЬ ×4]
├── captchaAnswer: createXSSProtectedString()          [УНИКАЛЬНО]
└── agreeToTerms: z.boolean()                         [ДУБЛЬ ×2]
```

### **Schema #5: `heroExchangeSchema`**

**📍 Location:** `apps/web/src/components/exchange-form/useHeroExchangeForm.ts:47`  
**🎯 Purpose:** Hero секция главной страницы  
**🔒 Security:** ❌ НЕТ XSS защиты

```typescript
FIELDS:
├── fromAmount: heroExchangeCryptoAmountSchema         [ДУБЛЬ ×5 - custom implementation]
├── fromCurrency: z.enum(CRYPTOCURRENCIES)            [ДУБЛЬ ×5]
├── tokenStandard: z.string().optional()              [ДУБЛЬ ×2 - IDENTICAL to #4]
├── toCurrency: z.enum(FIAT_CURRENCIES)               [ДУБЛЬ ×3]
└── selectedBankId: z.string().min(1)                [ДУБЛЬ ×2 - different field name!]
```

---

## 🔥 КРИТИЧЕСКИЕ ДУБЛИРОВАНИЯ

### **1️⃣ CURRENCY VALIDATION (100% duplication rate)**

**Затронуты:** Все 5 схем  
**Проблема:** Одно поле, 5 разных реализаций

```typescript
// CURRENT STATE - 5 РАЗНЫХ ПОДХОДОВ:
schema1: z.enum(['BTC', 'ETH', 'USDT', 'LTC'])        // Hardcoded subset
schema2: currencySchema                                 // Import
schema3: currencySchema (×2 fields)                    // Import ×2
schema4: currencySchema + z.literal('UAH')             // Mixed approach
schema5: z.enum(CRYPTOCURRENCIES) + z.enum(FIAT_CURRENCIES) // Constants

// SHOULD BE - 1 БАЗОВЫЙ ПОДХОД:
baseCurrencyField: currencySchema  // Everywhere
```

### **2️⃣ AMOUNT VALIDATION (100% duplication rate)**

**Затронуты:** Все 5 схем  
**Проблема:** Одна бизнес-логика, разные типы и границы

```typescript
// CURRENT STATE - TYPE CHAOS:
schema1: z.string() + XSS + transform           // String input
schema2: z.number() + VALIDATION_LIMITS         // Number input
schema3: z.number() + VALIDATION_LIMITS         // IDENTICAL to #2!
schema4: z.string() + XSS + transform(Number)   // String→Number
schema5: z.string() + custom refine + VALIDATION_BOUNDS // Different constants!

// BOUNDARIES DUPLICATION:
MIN_ORDER_AMOUNT: используется в #2, #3         // Same rule
MAX_ORDER_AMOUNT: используется в #2, #3         // Same rule
VALIDATION_BOUNDS.MAX_ORDER_AMOUNT: в #5        // Different constant!
MIN_AMOUNTS.from: только в #5                   // Custom logic

// SHOULD BE - UNIFIED APPROACH:
baseAmountValidation: z.string()
  .pipe(z.coerce.number())
  .pipe(businessAmountRules)
```

### **3️⃣ EMAIL VALIDATION (80% duplication rate)**

**Затронуты:** 4 из 5 схем  
**Проблема:** Буквально идентичный код

```typescript
// CURRENT STATE - IDENTICAL IMPORTS:
schema1: email: emailSchema     // ✅
schema2: email: emailSchema     // ✅ IDENTICAL
schema3: email: emailSchema     // ✅ IDENTICAL
schema4: email: emailSchema     // ✅ IDENTICAL
schema5: [MISSING EMAIL FIELD]  // ❌ INCONSISTENCY!

// SHOULD BE - COMPOSITION:
baseContactFields = { email: emailSchema }
allSchemas.extend(baseContactFields)
```

### **4️⃣ TERMS AGREEMENT (40% duplication rate)**

**Затронуты:** 2 схемы  
**Проблема:** Идентичная логика

```typescript
// CURRENT STATE:
schema3: agreeToTerms: z.boolean().refine(val => val === true, 'TERMS_AGREEMENT_REQUIRED');
schema4: agreeToTerms: z.boolean().refine(val => val === true, 'TERMS_ACCEPTANCE_REQUIRED');
//                                                               ↑ Different message key!

// SHOULD BE:
baseTermsField: z.boolean().refine(val => val === true, 'TERMS_REQUIRED');
```

---

## 🔒 SECURITY INCONSISTENCIES

### **XSS Protection Coverage:**

- ✅ **Schema #1:** containsPotentialXSS() for cryptoAmount
- ⚠️ **Schema #2:** XSS protection только в cardNumber transform
- ❌ **Schema #3:** НЕТ XSS защиты для amount
- ✅ **Schema #4:** Полная XSS защита + createXSSProtectedString()
- ❌ **Schema #5:** НЕТ XSS защиты вообще

### **Business Logic Protection:**

- ✅ **Schemas #2, #3:** VALIDATION_LIMITS boundaries
- ⚠️ **Schema #5:** VALIDATION_BOUNDS (разные константы!)
- ❌ **Schema #1:** Только XSS, НЕТ business boundaries

---

## 📊 MAINTENANCE COST ANALYSIS

### **Current Change Cost:**

- **Изменение валидации amount:** Требует правки в **5 файлах**
- **Изменение currency logic:** Требует правки в **5 файлах**
- **Добавление нового поля:** Нужно решить **в какую схему добавлять**
- **Security update:** Нужно обновить **каждую схему отдельно**

### **Bug Propagation Risk:**

- Исправление бага в одной схеме **НЕ распространяется** на остальные
- Разные validation сообщения создают **UX inconsistency**
- Type mismatches между схемами создают **runtime errors**

---

## 🎯 RECOMMENDED SOLUTION ARCHITECTURE

### **Phase 1: Extract Base Fields**

```typescript
// packages/utils/src/validation/base-exchange-fields.ts
export const baseFields = {
  currency: currencySchema,
  amount: z.string().pipe(z.coerce.number()).pipe(amountBusinessRules),
  email: emailSchema,
  agreeToTerms: z.boolean().refine(val => val === true, 'TERMS_REQUIRED'),
};
```

### **Phase 2: Schema Composition**

```typescript
// Simple exchange
export const simpleExchangeSchema = z.object({
  currency: baseFields.currency,
  cryptoAmount: baseFields.amount,
  email: baseFields.email,
});

// Advanced exchange
export const advancedExchangeSchema = simpleExchangeSchema.extend({
  tokenStandard: z.string().optional(),
  selectedBank: z.string().min(1),
  agreeToTerms: baseFields.agreeToTerms,
});
```

### **Phase 3: Security Layer**

```typescript
// Universal security wrapper
const withSecurity = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.transform(data => applyXSSProtection(data));

export const secureSimpleExchangeSchema = withSecurity(simpleExchangeSchema);
```

---

## 📈 EXPECTED BENEFITS

### **Maintainability:**

- ✅ **1 место изменений** вместо 5
- ✅ **Автоматическое распространение** багфиксов
- ✅ **Type consistency** между всеми схемами

### **Security:**

- ✅ **Единообразная XSS защита** во всех схемах
- ✅ **Централизованные security updates**
- ✅ **Consistent validation boundaries**

### **Developer Experience:**

- ✅ **Понятная иерархия** схем
- ✅ **Переиспользование** базовых блоков
- ✅ **Предсказуемое поведение** validation

---

## 🚦 IMPLEMENTATION PRIORITY

### **🔴 CRITICAL (немедленно)**

1. **Schema #5 security gap** - добавить XSS защиту
2. **Email field missing** в heroExchangeSchema
3. **Constants unification** - VALIDATION_LIMITS vs VALIDATION_BOUNDS

### **🟡 HIGH (следующий спринт)**

1. **Extract base fields** в отдельный модуль
2. **Унифицировать amount validation** approach
3. **Create security wrapper** для всех схем

### **🟢 MEDIUM (будущие спринты)**

1. **Full schema composition** refactoring
2. **Automated migration** старых схем
3. **Validation testing** infrastructure

---

## 📝 MIGRATION CHECKLIST

- [ ] Создать `base-exchange-fields.ts`
- [ ] Извлечь общие validation rules
- [ ] Создать security wrapper
- [ ] Мигрировать схему #1 (Simple)
- [ ] Мигрировать схему #2 (CreateOrder)
- [ ] Мигрировать схему #3 (Exchange)
- [ ] Мигрировать схему #4 (Advanced)
- [ ] Мигрировать схему #5 (Hero)
- [ ] Обновить все импорты
- [ ] Запустить полное тестирование
- [ ] Удалить дублированный код

---

## 🔗 RELATED DOCUMENTATION

- **Tech Debt Rules:** `docs/ai-agent/tech_debt_rules.yaml` (Rule 15)
- **Validation Architecture:** `docs/VALIDATION_ARCHITECTURE_GUIDE.md`
- **Security Guidelines:** `docs/SECURITY_ENHANCED_VALIDATION_GUIDE.md`
- **Project Structure:** `docs/PROJECT_STRUCTURE_MAP.md`

---

**🏷️ Tags:** `#tech-debt` `#validation` `#security` `#duplication` `#maintenance`  
**👥 Stakeholders:** Frontend Team, Security Team, Architecture Team  
**⏱️ Estimated Effort:** 2-3 спринта (full migration)
