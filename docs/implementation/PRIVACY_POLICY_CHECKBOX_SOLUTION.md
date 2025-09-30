# 🎯 Решение проблемы валидации чекбокса политики конфиденциальности

## 📋 Описание проблемы

**ФАКТИЧЕСКАЯ ПРОБЛЕМА:** На странице обмена (/exchange) чекбокс для согласия с политикой конфиденциальности не влияет на валидацию формы. Пользователи могут создать заявку без галочки и не видят красных сообщений об ошибке валидации.

## 🔍 Анализ текущего состояния

### Фактическое состояние кодовой базы:

#### 1. **UI компонент** (ОБНАРУЖЕНО)

- **Файл:** `apps/web/src/components/exchange/ExchangeLayout.tsx` (строки 203-215)
- **Состояние:** Чекбокс использует обычный `<input>` вместо `<FormField>`
- **Проблема:** НЕТ интеграции с системой валидации React Hook Form

```tsx
{
  /* Текущая НЕПРАВИЛЬНАЯ реализация */
}
<FormField name="agreeToTerms">
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={form.values.agreeToTerms || false}
      onChange={e => form.setValue('agreeToTerms', e.target.checked)}
      className="h-4 w-4 rounded border-border"
    />
    <FormLabel className="text-sm">{t('security.terms.agreement')}</FormLabel>
  </div>
</FormField>;
```

#### 2. **Схема валидации форм** (ОБНАРУЖЕНО)

- **Файл:** `packages/utils/src/validation/security-enhanced-exchange-schemas.ts` (строка 278)
- **Состояние:** `agreeToTerms: z.boolean().optional()` - поле НЕ обязательное
- **Проблема:** Валидация НЕ требует согласия с условиями

#### 3. **API схема** (ОБНАРУЖЕНО)

- **Файл:** `packages/utils/src/validation/security-enhanced-exchange-schemas.ts` (строки 121-137)
- **Состояние:** `securityEnhancedCreateExchangeOrderSchema` НЕ содержит поле `agreeToTerms`
- **Проблема:** API принимает заявки БЕЗ проверки согласия

#### 4. **Обработчик валидации** (ОБНАРУЖЕНО)

- **Файл:** `packages/utils/src/validation/handlers.ts` (строки 353-361)
- **Состояние:** `handleTermsValidation` функция СУЩЕСТВУЕТ и корректна
- **Статус:** ✅ РАБОТАЕТ - не требует изменений

#### 5. **Константы валидации** (ОБНАРУЖЕНО)

- **Файл:** `packages/utils/src/validation/constants.ts` (строка 36)
- **Состояние:** `TERMS_ACCEPTANCE_REQUIRED: 'validation.terms.required'` СУЩЕСТВУЕТ
- **Статус:** ✅ РАБОТАЕТ - не требует изменений

## 🎯 Конкретные рекомендации решения

### **ВАЖНО:** Следование архитектурным принципам проекта

Основываясь на изученной документации (`VALIDATION_ARCHITECTURE_GUIDE.md`, `SECURITY_ENHANCED_VALIDATION_GUIDE.md`), решение должно использовать существующие архитектурные паттерны проекта.

---

## 📝 Изменения по файлам

### 1. **Исправить схему валидации формы** 🔴 КРИТИЧНО

**Файл:** `packages/utils/src/validation/security-enhanced-exchange-schemas.ts`

**Текущее состояние (строка 278):**

```typescript
agreeToTerms: z.boolean().optional(), // Не требуем сразу, валидируем при submit
```

**НЕОБХОДИМОЕ ИЗМЕНЕНИЕ:**

```typescript
agreeToTerms: z.boolean().refine(value => value === true, {
  message: 'TERMS_ACCEPTANCE_REQUIRED',
}),
```

**Обоснование:** Согласно `VALIDATION_ARCHITECTURE_GUIDE.md`, проект использует `.refine()` паттерн для кастомной валидации boolean полей.

---

### 2. **Добавить поле в API схему** 🔴 КРИТИЧНО

**Файл:** `packages/utils/src/validation/security-enhanced-exchange-schemas.ts`

**Текущее состояние (строки 121-137):**

```typescript
export const securityEnhancedCreateExchangeOrderSchema = z.object({
  email: xssProtectedEmailSchema,
  cryptoAmount: z.number().positive('AMOUNT_POSITIVE_REQUIRED'),
  // ... другие поля
  // ❌ ОТСУТСТВУЕТ: agreeToTerms
});
```

**НЕОБХОДИМОЕ ИЗМЕНЕНИЕ:**

```typescript
export const securityEnhancedCreateExchangeOrderSchema = z.object({
  email: xssProtectedEmailSchema,
  cryptoAmount: z.number().positive('AMOUNT_POSITIVE_REQUIRED'),
  // ... остальные поля
  agreeToTerms: z.boolean().refine(value => value === true, {
    message: 'TERMS_ACCEPTANCE_REQUIRED',
  }),
});
```

**Обоснование:** Согласно `SECURITY_ENHANCED_VALIDATION_GUIDE.md`, все API schemas должны соответствовать UI schemas для безопасности.

---

### 3. **Исправить UI компонент** 🔴 КРИТИЧНО

**Файл:** `apps/web/src/components/exchange/ExchangeLayout.tsx`

**Текущее состояние (строки 203-215):**

```tsx
<FormField name="agreeToTerms">
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={form.values.agreeToTerms || false}
      onChange={e => form.setValue('agreeToTerms', e.target.checked)}
      className="h-4 w-4 rounded border-border"
    />
    <FormLabel className="text-sm">{t('security.terms.agreement')}</FormLabel>
  </div>
</FormField>
```

**НЕОБХОДИМОЕ ИЗМЕНЕНИЕ:**

```tsx
<FormField
  control={form.control}
  name="agreeToTerms"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel className="text-sm font-normal">{t('security.terms.agreement')}</FormLabel>
        <FormMessage />
      </div>
    </FormItem>
  )}
/>
```

**Импорты для добавления:**

```tsx
import { Checkbox, FormControl, FormItem, FormMessage } from '@repo/ui';
```

**Обоснование:** Согласно документации UI компонентов, `FormField` с `render` prop - это правильный паттерн для интеграции с React Hook Form.

---

### 4. **Добавить server-side проверку** 🟡 ВАЖНО

**Файл:** `apps/web/src/server/trpc/routers/exchange.ts`

**Текущее состояние (строки 717-740):**

```typescript
createOrder: rateLimitMiddleware.createOrder
  .input(
    securityEnhancedCreateExchangeOrderSchema.extend({
      recipientData: z.object({
        cardNumber: z.string().optional(),
        bankDetails: z.string().optional(),
      }).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // ❌ НЕТ проверки agreeToTerms
    logger.info('ORDER_CREATION_STARTED', {
      email: input.email,
      // ... остальные поля
    });
```

**НЕОБХОДИМОЕ ИЗМЕНЕНИЕ:**

```typescript
createOrder: rateLimitMiddleware.createOrder
  .input(
    securityEnhancedCreateExchangeOrderSchema.extend({
      recipientData: z.object({
        cardNumber: z.string().optional(),
        bankDetails: z.string().optional(),
      }).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // ✅ ДОБАВИТЬ: Server-side проверка согласия
    if (!input.agreeToTerms) {
      throw createBadRequestError(
        await ctx.getErrorMessage('server.errors.business.termsAcceptanceRequired')
      );
    }

    logger.info('ORDER_CREATION_STARTED', {
      email: input.email,
      agreeToTerms: input.agreeToTerms, // Логирование согласия
      // ... остальные поля
    });
```

---

### 5. **Обновить типы данных** 🟡 ВАЖНО

**Файл:** `packages/exchange-core/src/types.ts`

**Необходимо добавить в интерфейс `CreateOrderRequest`:**

```typescript
export interface CreateOrderRequest {
  email: string;
  cryptoAmount: number;
  currency: CryptoCurrency;
  recipientData: RecipientData;
  agreeToTerms: true; // ✅ Строго типизированное согласие
}
```

---

### 6. **Переводы (опционально)** 🟢 ЖЕЛАТЕЛЬНО

**Файлы переводов:** `apps/web/messages/[locale]/advanced-exchange.json`

Проверить наличие переводов для ошибки валидации:

```json
{
  "validation": {
    "terms": {
      "required": "Необходимо согласие с условиями использования"
    }
  }
}
```

---

## 🔄 Последовательность внедрения

### **Этап 1: Валидация (КРИТИЧНО)**

1. Исправить `securityEnhancedFullExchangeFormSchema` - сделать `agreeToTerms` обязательным
2. Обновить `securityEnhancedCreateExchangeOrderSchema` - добавить поле `agreeToTerms`

### **Этап 2: UI (КРИТИЧНО)**

3. Заменить `<input>` на `<FormField>` с правильной интеграцией в `ExchangeLayout.tsx`

### **Этап 3: API (ВАЖНО)**

4. Добавить server-side проверку в tRPC mutation
5. Обновить типы данных в `exchange-core`

### **Этап 4: Тестирование**

6. Проверить отображение ошибки валидации
7. Убедиться в блокировке отправки формы
8. Протестировать server-side валидацию

---

## ✅ Ожидаемый результат

После внедрения всех изменений:

1. **Пользователь увидит красную ошибку валидации** при попытке отправить форму без галочки
2. **Чекбокс будет интегрирован** с системой валидации React Hook Form
3. **Форма будет заблокирована** на уровне клиента без согласия
4. **API будет отклонять** заявки без согласия на уровне сервера
5. **Типобезопасность** будет обеспечена на всех уровнях

**Проблема будет ПОЛНОСТЬЮ решена** в соответствии с архитектурными принципами проекта.

---

## 📋 Чек-лист проверки

- [ ] `agreeToTerms` является обязательным в `securityEnhancedFullExchangeFormSchema`
- [ ] `agreeToTerms` добавлено в `securityEnhancedCreateExchangeOrderSchema`
- [ ] UI компонент использует `FormField` с правильной интеграцией
- [ ] Server-side проверка добавлена в tRPC mutation
- [ ] Типы данных обновлены в `exchange-core`
- [ ] Переводы ошибок валидации присутствуют
- [ ] Тестирование подтверждает работу валидации

**КРИТИЧНО:** Следовать существующим архитектурным паттернам проекта и не нарушать принципы, описанные в документации.
