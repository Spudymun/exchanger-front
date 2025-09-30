# 🔍 Анализ валидации чекбокса политики конфиденциальности

## 📋 Описание проблемы

На странице обмена есть чекбокс для согласия с политикой конфиденциальности, но он **не влияет на валидацию формы**. Пользователи могут продолжить и создать заявку без этой галочки и без красных сообщений об ошибке валидации.

## 🧬 Архитектурный анализ от презентационного до фундаментального уровня

### 🎨 УРОВЕНЬ 1: Презентационный слой (Frontend UI)

#### 📍 Локализация проблемы:

- **Файл:** `apps/web/src/components/exchange/ExchangeLayout.tsx`
- **Компонент:** `SecuritySection`
- **Строки:** 350-370

#### 🔍 Текущая реализация:

```typescript
<div className="flex items-center space-x-2">
  <input
    type="checkbox"
    id="agreeToTerms"
    checked={form.values.agreeToTerms || false}
    onChange={e => form.setValue('agreeToTerms', e.target.checked)}
    className="h-4 w-4 rounded border-gray-300"
  />
  <FormLabel htmlFor="agreeToTerms" className="text-sm">
    {t('agreeToTerms')}
  </FormLabel>
</div>
```

#### ❌ Проблема:

- Чекбокс **НЕ интегрирован** с системой валидации React Hook Form
- Отсутствует `FormField` wrapper для отображения ошибок валидации
- Нет визуальной индикации ошибок (красная подсветка, сообщения об ошибках)

#### ✅ Необходимые изменения:

**1. Заменить обычный input на FormField компонент:**

```typescript
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
        <FormLabel className="text-sm font-normal">
          {t('agreeToTerms')}
        </FormLabel>
        <FormMessage />
      </div>
    </FormItem>
  )}
/>
```

**2. Добавить стили для отображения ошибок валидации:**

```typescript
// В className для контейнера добавить:
className={cn(
  "flex items-center space-x-2",
  form.formState.errors.agreeToTerms && "border-red-500"
)}
```

---

### 🔧 УРОВЕНЬ 2: Логика форм и валидация (Form Logic)

#### 📍 Локализация проблемы:

- **Файл:** `packages/utils/src/validation/security-enhanced-exchange-schemas.ts`
- **Схема:** `securityEnhancedFullExchangeFormSchema`
- **Строки:** 210-220

#### 🔍 Текущая реализация:

```typescript
export const securityEnhancedFullExchangeFormSchema = unifiedExchangeBaseSchema
  .extend({
    // ... другие поля
    agreeToTerms: z.boolean().optional(), // ❌ ПРОБЛЕМА: optional()
  })
  .superRefine((data, ctx) => {
    // ... другие проверки валидации
    // ❌ ПРОБЛЕМА: Отсутствует валидация agreeToTerms
  });
```

#### ❌ Проблема:

- Поле `agreeToTerms` помечено как **optional()**
- В функции `superRefine` **отсутствует проверка** обязательности согласия с условиями
- Валидация не срабатывает, так как `false` или `undefined` считаются валидными значениями

#### ✅ Необходимые изменения:

**1. Сделать поле обязательным:**

```typescript
export const securityEnhancedFullExchangeFormSchema = unifiedExchangeBaseSchema
  .extend({
    // ... другие поля
    agreeToTerms: z.boolean().refine(value => value === true, {
      message: 'TERMS_ACCEPTANCE_REQUIRED',
    }),
  })
  .superRefine((data, ctx) => {
    // Проверка согласия с условиями
    if (!data.agreeToTerms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['agreeToTerms'],
        message: 'TERMS_ACCEPTANCE_REQUIRED',
      });
    }

    // ... остальные проверки
  });
```

**2. Обновить тип формы:**

```typescript
export type SecurityEnhancedFullExchangeForm = z.infer<
  typeof securityEnhancedFullExchangeFormSchema
> & {
  agreeToTerms: true; // Строго типизированное согласие
};
```

---

### 🛠️ УРОВЕНЬ 3: Обработчики валидации (Validation Handlers)

#### 📍 Локализация:

- **Файл:** `packages/utils/src/validation/handlers.ts`
- **Функция:** `handleTermsValidation`
- **Строки:** 85-95

#### 🔍 Текущая реализация:

```typescript
export function handleTermsValidation(issue: ZodIssue, t: (key: string) => string): string | null {
  if (issue.code === ZodIssueCode.custom && issue.path.includes('agreeToTerms')) {
    return t('TERMS_ACCEPTANCE_REQUIRED');
  }
  return null;
}
```

#### ✅ Состояние:

- ✅ Обработчик **существует** и корректно настроен
- ✅ Правильно обрабатывает `ZodIssueCode.custom` для поля `agreeToTerms`
- ✅ Возвращает переведенное сообщение об ошибке

#### ⚠️ Проблема интеграции:

Обработчик существует, но **не вызывается**, так как схема валидации не генерирует ошибки для поля `agreeToTerms`.

---

### 🔄 УРОВЕНЬ 4: Интеграция с формами (Form Integration)

#### 📍 Локализация:

- **Hook:** `useFormWithNextIntl`
- **Файл:** `packages/hooks/src/useFormWithNextIntl.ts`

#### 🔍 Текущая интеграция:

```typescript
const form = useFormWithNextIntl({
  validationSchema: securityEnhancedFullExchangeFormSchema,
  t: useTranslations('ExchangeForm'),
  // ...
});
```

#### ✅ Необходимые изменения:

**1. Обеспечить правильную интеграцию обработчика ошибок:**

```typescript
// В ExchangeLayout.tsx
const form = useFormWithNextIntl({
  validationSchema: securityEnhancedFullExchangeFormSchema,
  t: useTranslations('ExchangeForm'),
  defaultValues: {
    // ... другие значения
    agreeToTerms: false, // Явное значение по умолчанию
  },
  mode: 'onChange', // Валидация при изменении
});
```

**2. Добавить проверку перед отправкой:**

```typescript
const handleSubmit = form.handleSubmit(async data => {
  // Дополнительная проверка на клиенте
  if (!data.agreeToTerms) {
    form.setError('agreeToTerms', {
      type: 'required',
      message: t('TERMS_ACCEPTANCE_REQUIRED'),
    });
    return;
  }

  // Продолжить отправку...
});
```

---

### 🌐 УРОВЕНЬ 5: API валидация (Backend Validation)

#### 📍 Локализация проблемы:

- **Файл:** `apps/web/src/server/trpc/routers/exchange.ts`
- **Процедура:** `createOrder`
- **Строки:** 160-180

#### 🔍 Текущая реализация:

```typescript
createOrder: rateLimitMiddleware.createOrder
  .input(securityEnhancedCreateExchangeOrderSchema)
  .mutation(async ({ input, ctx }) => {
    // ❌ ПРОБЛЕМА: Валидация agreeToTerms отсутствует на API уровне
    const orderRequest = prepareOrderRequest(input);
    // ... создание заказа
  }),
```

#### ❌ Проблема:

- `securityEnhancedCreateExchangeOrderSchema` **не содержит** поле `agreeToTerms`
- API принимает заявки **без проверки согласия** с условиями
- Отсутствует server-side валидация согласия

#### ✅ Необходимые изменения:

**1. Обновить API схему валидации:**

```typescript
// В security-enhanced-exchange-schemas.ts
export const securityEnhancedCreateExchangeOrderSchema = unifiedExchangeBaseSchema
  .extend({
    // ... существующие поля
    agreeToTerms: z.boolean().refine(value => value === true, {
      message: 'TERMS_ACCEPTANCE_REQUIRED',
    }),
  })
  .superRefine((data, ctx) => {
    // Обязательная проверка согласия на API уровне
    if (!data.agreeToTerms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['agreeToTerms'],
        message: 'TERMS_ACCEPTANCE_REQUIRED',
      });
    }
    // ... остальные проверки
  });
```

**2. Добавить проверку в mutation:**

```typescript
createOrder: rateLimitMiddleware.createOrder
  .input(securityEnhancedCreateExchangeOrderSchema)
  .mutation(async ({ input, ctx }) => {
    // Дополнительная server-side проверка
    if (!input.agreeToTerms) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'TERMS_ACCEPTANCE_REQUIRED'
      });
    }

    const orderRequest = prepareOrderRequest(input);
    // ... создание заказа
  }),
```

---

### 🗃️ УРОВЕНЬ 6: Схемы и типы данных (Data Schemas)

#### 📍 Локализация:

- **Файл:** `packages/exchange-core/src/types.ts`
- **Тип:** `CreateOrderRequest`

#### 🔍 Текущая реализация:

```typescript
export interface CreateOrderRequest {
  email: string;
  cryptoAmount: number;
  currency: CryptoCurrency;
  recipientData: RecipientData;
  // ❌ ПРОБЛЕМА: Отсутствует agreeToTerms поле
}
```

#### ✅ Необходимые изменения:

**1. Обновить базовый интерфейс:**

```typescript
export interface CreateOrderRequest {
  email: string;
  cryptoAmount: number;
  currency: CryptoCurrency;
  recipientData: RecipientData;
  agreeToTerms: true; // Строго типизированное согласие
}
```

**2. Обновить связанные типы:**

```typescript
export interface Order extends CreateOrderRequest {
  id: string;
  publicId: string;
  status: OrderStatus;
  // ... остальные поля
  // agreeToTerms наследуется от CreateOrderRequest
}
```

---

### 🔒 УРОВЕНЬ 7: Безопасность и соответствие (Security & Compliance)

#### 📍 Область проблемы:

- **Юридическое соответствие:** GDPR, пользовательские соглашения
- **Аудит операций:** Отслеживание согласий пользователей

#### ❌ Текущие риски:

- Создание заявок **без явного согласия** пользователя
- Отсутствие аудита согласий в базе данных
- Потенциальные юридические проблемы

#### ✅ Необходимые изменения:

**1. Добавить логирование согласий:**

```typescript
// В createOrder mutation
logger.info('User consent recorded', {
  orderId: order.id,
  email: input.email,
  agreeToTerms: input.agreeToTerms,
  timestamp: new Date().toISOString(),
  ip: ctx.clientIP,
});
```

**2. Сохранение согласия в базе данных:**

```typescript
// Добавить поле в схему Order
await prisma.order.create({
  data: {
    // ... остальные поля
    agreeToTerms: input.agreeToTerms,
    consentTimestamp: new Date(),
    consentIP: ctx.clientIP,
  },
});
```

---

### 🌍 УРОВЕНЬ 8: Интернационализация (i18n)

#### 📍 Локализация:

- **Файл:** `apps/web/src/locales/[locale]/exchange.json`

#### ✅ Необходимые переводы:

**1. Обновить файлы переводов:**

```json
// ru/exchange.json
{
  "agreeToTerms": "Я согласен с политикой конфиденциальности и условиями использования",
  "TERMS_ACCEPTANCE_REQUIRED": "Необходимо согласие с условиями использования"
}

// en/exchange.json
{
  "agreeToTerms": "I agree to the privacy policy and terms of service",
  "TERMS_ACCEPTANCE_REQUIRED": "Agreement to terms of service is required"
}

// uk/exchange.json
{
  "agreeToTerms": "Я погоджуюся з політикою конфіденційності та умовами використання",
  "TERMS_ACCEPTANCE_REQUIRED": "Необхідна згода з умовами використання"
}
```

---

## 🔄 Цепь взаимосвязей и последовательность исправлений

### 📊 Диаграмма зависимостей:

```
1. DATA TYPES (exchange-core)
   ↓
2. VALIDATION SCHEMAS (utils/validation)
   ↓
3. VALIDATION HANDLERS (utils/handlers)
   ↓
4. API SCHEMAS (server/trpc)
   ↓
5. FORM INTEGRATION (hooks/components)
   ↓
6. UI COMPONENTS (components/exchange)
   ↓
7. TRANSLATIONS (locales)
   ↓
8. SECURITY & AUDIT (logging/database)
```

### ⚡ Порядок внедрения изменений:

1. **Шаг 1:** Обновить базовые типы в `exchange-core`
2. **Шаг 2:** Исправить схемы валидации в `utils/validation`
3. **Шаг 3:** Обновить API схему в `server/trpc`
4. **Шаг 4:** Интегрировать валидацию в компонент формы
5. **Шаг 5:** Обновить UI компоненты с FormField
6. **Шаг 6:** Добавить переводы
7. **Шаг 7:** Реализовать аудит и логирование

### 🧪 Тестирование исправлений:

**1. Unit тесты схем валидации:**

```typescript
describe('securityEnhancedFullExchangeFormSchema', () => {
  it('should reject form without agreeToTerms', () => {
    const result = securityEnhancedFullExchangeFormSchema.safeParse({
      // ... валидные данные
      agreeToTerms: false,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain('agreeToTerms');
  });
});
```

**2. E2E тесты пользовательского интерфейса:**

```typescript
test('should show validation error when privacy policy not checked', async () => {
  await fillExchangeForm(page, validFormData);
  await page.uncheck('[data-testid="agree-to-terms"]');
  await page.click('[data-testid="submit-order"]');

  await expect(page.locator('[data-testid="terms-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="terms-error"]')).toHaveText(
    'Необходимо согласие с условиями использования'
  );
});
```

---

## 📊 Резюме критических изменений

| Уровень    | Файл                                    | Изменение                                                                      | Критичность       |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------------ | ----------------- |
| **Schema** | `security-enhanced-exchange-schemas.ts` | `agreeToTerms: z.boolean().optional()` → `z.boolean().refine(v => v === true)` | 🔴 **КРИТИЧНО**   |
| **UI**     | `ExchangeLayout.tsx`                    | `<input>` → `<FormField>` с валидацией                                         | 🔴 **КРИТИЧНО**   |
| **API**    | `exchange.ts`                           | Добавить `agreeToTerms` в API schema                                           | 🟡 **ВАЖНО**      |
| **Types**  | `exchange-core/types.ts`                | Добавить `agreeToTerms: true` в `CreateOrderRequest`                           | 🟡 **ВАЖНО**      |
| **i18n**   | `locales/*/exchange.json`               | Добавить переводы ошибок                                                       | 🟢 **ЖЕЛАТЕЛЬНО** |

---

## ✅ Ожидаемый результат после исправлений

После внедрения всех изменений:

1. **Пользователь увидит ошибку валидации** при попытке отправить форму без согласия
2. **Красная подсветка чекбокса** и сообщение об ошибке под ним
3. **Блокировка отправки** на уровне клиента и сервера
4. **Аудит согласий** для юридического соответствия
5. **Типобезопасность** на всех уровнях приложения

Система станет **полностью согласованной** от UI до базы данных с обязательным согласием пользователя с условиями использования.
