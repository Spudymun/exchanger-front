# 🔧 Унифицированная система валидаций - Техническое руководство

## 📋 Обзор

После миграции от дублированных схем валидации к единой системе, все формы обмена теперь используют унифицированную архитектуру валидации.

## 🏗️ Архитектура схем

### Базовая схема

```typescript
// packages/utils/src/validation/security-enhanced-exchange-schemas.ts

const unifiedExchangeBaseSchema = z.object({
  // Базовые поля обмена
  fromAmount: z.string().min(1).refine(...),
  fromCurrency: currencySchema,
  tokenStandard: z.string().optional(),
  toCurrency: z.string(),
  selectedBankId: z.string().optional(),

  // Расширенные поля
  email: emailSchema,
  cardNumber: z.string()...transform/refine,
  captchaAnswer: createXSSProtectedString(...),
  agreeToTerms: z.boolean().refine(...),
});
```

### Производные схемы

#### Полная схема (для exchange страницы)

```typescript
export const securityEnhancedUnifiedExchangeFormSchema = unifiedExchangeBaseSchema.superRefine(
  (data, ctx) => {
    validateCryptoAmountLimits(data.fromAmount, data.fromCurrency, ctx);
  }
);
```

#### Схема hero формы (подмножество)

```typescript
export const securityEnhancedHeroExchangeFormSchema = unifiedExchangeBaseSchema
  .pick({
    fromAmount: true,
    fromCurrency: true,
    tokenStandard: true,
    toCurrency: true,
    selectedBankId: true,
  })
  .superRefine((data, ctx) => {
    validateCryptoAmountLimits(data.fromAmount, data.fromCurrency, ctx);
  });
```

## 🎯 Использование в компонентах

### Hero форма (главная страница)

```typescript
// apps/web/src/components/hero-exchange/useHeroExchangeForm.ts

import { securityEnhancedHeroExchangeFormSchema } from '@repo/utils';

const form = useFormWithNextIntl<HeroExchangeFormData>({
  validationSchema: securityEnhancedHeroExchangeFormSchema,
  // ...
});
```

### Exchange форма (страница обмена)

```typescript
// apps/web/src/components/exchange/ExchangeContainer.tsx

import { securityEnhancedUnifiedExchangeFormSchema } from '@repo/utils';

const form = useFormWithNextIntl<Record<string, unknown>>({
  validationSchema: securityEnhancedUnifiedExchangeFormSchema,
  // ...
});
```

## 🧩 Общие компоненты

### TokenStandardSelector

```typescript
// packages/ui/src/components/exchange/TokenStandardSelector.tsx

import { TokenStandardSelector } from '@repo/ui';

// В компонентах:
<TokenStandardSelector
  form={form as unknown as UseFormReturn<Record<string, unknown>>}
  t={t}
/>
```

## 📝 Стандартные имена полей

### Базовые поля обмена

- `fromAmount` - сумма отправки (строка)
- `fromCurrency` - валюта отправки
- `tokenStandard` - стандарт токена (опционально)
- `toCurrency` - валюта получения
- `selectedBankId` - ID выбранного банка (опционально)

### Расширенные поля

- `email` - email пользователя
- `cardNumber` - номер карты
- `captchaAnswer` - ответ на капчу
- `agreeToTerms` - согласие с условиями

## 💡 Лучшие практики

### При создании новых форм

1. **Используйте подмножества** вместо новых схем:

```typescript
const myCustomSchema = securityEnhancedUnifiedExchangeFormSchema.pick({
  fromAmount: true,
  fromCurrency: true,
  email: true,
});
```

2. **Сохраняйте business validation**:

```typescript
const mySchema = baseSchema.superRefine((data, ctx) => {
  validateCryptoAmountLimits(data.fromAmount, data.fromCurrency, ctx);
});
```

### При добавлении новых полей

1. **Добавляйте в базовую схему**:

```typescript
// В unifiedExchangeBaseSchema
newField: z.string().min(1),
```

2. **Обновляйте типы**:

```typescript
export type SecurityEnhancedUnifiedExchangeForm = z.infer<
  typeof securityEnhancedUnifiedExchangeFormSchema
>;
```

3. **Используйте в производных схемах**:

```typescript
const specificSchema = unifiedExchangeBaseSchema.pick({
  // существующие поля...
  newField: true,
});
```

## 🔄 Унифицированные константы

### Курс обмена

```typescript
const EXCHANGE_RATE = 40.5; // Единый курс для всех форм
```

### Расчет суммы

```typescript
const calculatedAmount = useMemo(() => {
  const amount = Number(form.values.fromAmount);
  return amount > 0 ? amount * EXCHANGE_RATE : 0;
}, [form.values.fromAmount]);
```

## ⚠️ Что НЕ делать

### ❌ Не создавайте новые схемы валидации

```typescript
// НЕПРАВИЛЬНО:
const myNewExchangeSchema = z.object({
  fromAmount: z.string(),
  // дублирование логики...
});
```

### ❌ Не используйте разные имена полей

```typescript
// НЕПРАВИЛЬНО:
(cryptoAmount, selectedBank, amount);

// ПРАВИЛЬНО:
(fromAmount, selectedBankId);
```

### ❌ Не хардкодите курсы валют

```typescript
// НЕПРАВИЛЬНО:
const RATE = 35.5;

// ПРАВИЛЬНО:
const EXCHANGE_RATE = 40.5; // или используйте централизованную функцию
```

## 🧪 Тестирование схем

### Валидация данных

```typescript
describe('Unified Exchange Schema', () => {
  it('should validate correct form data', () => {
    const validData = {
      fromAmount: '100',
      fromCurrency: 'USDT',
      tokenStandard: 'TRC-20',
      toCurrency: 'UAH',
      selectedBankId: 'privatbank',
      email: 'user@example.com',
      cardNumber: '4111111111111111',
      captchaAnswer: 'answer',
      agreeToTerms: true,
    };

    const result = securityEnhancedUnifiedExchangeFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
```

## 📁 Структура файлов

```
packages/utils/src/validation/
├── security-enhanced-exchange-schemas.ts  # Основные схемы
└── ...

packages/ui/src/components/exchange/
├── TokenStandardSelector.tsx              # Общие компоненты
└── ...

apps/web/src/components/
├── hero-exchange/
│   ├── useHeroExchangeForm.ts             # Hero форма
│   └── SendingCard.tsx
└── exchange/
    ├── ExchangeContainer.tsx              # Exchange форма
    └── ExchangeLayout.tsx
```

## 🔗 Связанные документы

- [VALIDATION_ARCHITECTURE_GUIDE.md](./VALIDATION_ARCHITECTURE_GUIDE.md)
- [CODE_STYLE_GUIDE.md](./CODE_STYLE_GUIDE.md)
- [VALIDATION_REDUNDANCY_ELIMINATION_REPORT.md](./VALIDATION_REDUNDANCY_ELIMINATION_REPORT.md)

---

**Следуя этому руководству, вы сможете легко поддерживать и расширять систему валидаций без создания дублирования.**
