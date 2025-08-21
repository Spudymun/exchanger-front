# 📋 TASK 2.4: 🎯 ЗАПОЛНЕНИЕ ПОЛЕЙ - Form Submission & State Management

> **Фактический статус**: 🎯 **ГОТОВ К РЕАЛИЗАЦИИ** - submit секция создана, нужно заменить placeholder на кнопку.  
> **Цель**: Заменить placeholder в submit секции на реальную кнопку отправки с loading состояниями и error handling.

## 🎯 **Фактическое состояние - основано на скриншоте**

### ✅ Что УЖЕ ЕСТЬ (основа Task 2.1):

- ✅ **Submit секция** - создана с placeholder "Submit Button & Actions (Task 2.4)"
- ✅ **ExchangeContainer onSubmit** - useFormWithNextIntl уже настроен с обработчиком
- ✅ **useExchangeMutation** - createOrder, getOrderStatus API хуки готовы
- ✅ **tRPC integration** - полная интеграция через apps/web/src/hooks/useExchangeMutation.ts
- ✅ **Form validation** - securityEnhancedAdvancedExchangeFormSchema проверяет все поля

### 🎯 Что нужно ЗАМЕНИТЬ в Task 2.4:

**В submit секции заменить:**

```tsx
// ЗАМЕНИТЬ ЭТО:
<div className="placeholder-content h-16 bg-primary/10 border border-dashed border-primary/30 rounded-md flex items-center justify-center">
  <span className="text-sm text-primary">Submit Button & Actions (Task 2.4)</span>
</div>

// НА РЕАЛЬНУЮ КНОПКУ:
<div className="submit-actions space-y-4">
  <Button
    type="submit"
    size="lg"
    className="w-full"
    disabled={!isValid || isSubmitting}
  >
    {isSubmitting ? 'Создание обмена...' : 'Создать обмен'}
  </Button>
</div>
```

## 🎯 **Scope Definition - ОБНОВЛЕНО НА ОСНОВЕ ТЕКУЩЕГО СОСТОЯНИЯ**

### ✅ Что уже реализовано и НЕ нужно создавать:

- **ExchangeContainer.tsx** ✅ УЖЕ ИМЕЕТ onSubmit логику с useFormWithNextIntl
- **useExchangeMutation** ✅ УЖЕ СОДЕРЖИТ createOrder и getOrderStatus
- **ExchangeFormData** ✅ УЖЕ ГОТОВ для submission с правильными полями
- **Validation** ✅ securityEnhancedAdvancedExchangeFormSchema УЖЕ РАБОТАЕТ
- **tRPC integration** ✅ УЖЕ НАСТРОЕН через apps/web/src/hooks/useExchangeMutation.ts
- **useExchange hook** ✅ УЖЕ СОДЕРЖИТ validateForm и бизнес-логику

### 🎯 Что нужно доработать в Task 2.4:

- **Submit Button** - добавить в ExchangeForm.ActionArea
- **Loading States** - интегрировать с useExchangeMutation loading
- **Error Handling** - улучшить обработку ошибок submission
- **Success Navigation** - добавить redirect после успешного создания order
- **Optimistic Updates** - интегрировать с ExchangeStore

### Интеграция с существующими системами - ОБНОВЛЕНО:

- **API** ✅ `useExchangeMutation` из `/hooks/useExchangeMutation.ts` с createOrder
- **State** ✅ `useExchange` из `@repo/hooks/src/business/useExchange.ts` с validateForm
- **Form** ✅ `useFormWithNextIntl` УЖЕ НАСТРОЕН в ExchangeContainer.tsx
- **Types** ✅ Реальный `CreateOrderRequest` из `@repo/exchange-core`
- **Navigation** 🎯 ТРЕБУЕТСЯ добавить redirect логику после успеха

## 📐 **Technical Implementation Plan - ОБНОВЛЕН**

### 🔧 **Обновить ExchangeContainer.tsx с полной submission логикой**:

````tsx
// Заменить onSubmit в ExchangeContainer.tsx:
import { useExchangeMutation } from '@/hooks/useExchangeMutation';
import { useRouter } from 'next/navigation';
import { useToast } from '@repo/ui';

export function ExchangeContainer({ locale, initialParams }: ExchangeContainerProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Existing integrations
  const { validateForm, formData } = useExchange();
  const { createOrder, isCreatingOrder } = useExchangeMutation({
    onSuccess: (order) => {
      toast({
        title: t('submission.success.title'),
        description: t('submission.success.description'),
      });
      router.push(`/${locale}/order/${order.orderId}`);
    },
    onError: (error) => {
      toast({
        title: t('submission.error.title'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const form = useFormWithNextIntl<ExchangeFormData>({
    defaultValues: parseInitialFormData(initialParams),
    validationSchema: securityEnhancedAdvancedExchangeFormSchema,
    t,
    onSubmit: async (values) => {
      // Валидация через useExchange
      const validation = validateForm();
      if (!validation.isValid) {
        toast({
          title: t('validation.error.title'),
          description: t('validation.error.description'),
          variant: 'destructive',
        });
        return;
      }

      // Создание заказа
      try {
        await createOrder.mutateAsync({
          fromCurrency: values.fromCurrency,
          tokenStandard: values.tokenStandard,
          toCurrency: values.toCurrency,
          cryptoAmount: values.cryptoAmount,
          uahAmount: values.uahAmount,
          selectedBankId: values.selectedBankId,
          cardNumber: values.cardNumber,
          email: values.email,
        });
      } catch (error) {
        // Error handled by onError callback
      }
    },
  });

  return (
    <ExchangeForm.Container variant="full">
      <ExchangeLayout
        form={form}
        t={t}
        isSubmitting={isCreatingOrder}
      />
    </ExchangeForm.Container>
  );
### 🔧 **Добавить Submit Button в ExchangeLayout.tsx**:

```tsx
// В ExchangeForm.ActionArea добавить после checkboxes:
<ExchangeForm.FieldWrapper>
  <Button
    type="submit"
    size="lg"
    className="w-full"
    disabled={!form.formState.isValid || isSubmitting}
  >
    {isSubmitting ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('submit.processing')}
      </>
    ) : (
      <>
        <ArrowRight className="mr-2 h-4 w-4" />
        {t('submit.create')}
      </>
    )}
  </Button>
</ExchangeForm.FieldWrapper>
````

### 🎯 **Добавить локализацию для submission**:

```json
// apps/web/messages/ru.json - добавить в AdvancedExchangeForm:
"submit": {
  "create": "Создать обмен",
  "processing": "Создание обмена...",
  "success": {
    "title": "Обмен создан успешно!",
    "description": "Вы будете перенаправлены на страницу заказа"
  },
  "error": {
    "title": "Ошибка создания обмена",
    "description": "Проверьте данные и попробуйте снова"
  }
},
"validation": {
  "error": {
    "title": "Ошибка валидации",
    "description": "Заполните все обязательные поля"
  }
}
```

### 🔧 **Создать страницу order для redirect**:

```tsx
// apps/web/app/[locale]/order/[orderId]/page.tsx - создать новый файл
import { notFound } from 'next/navigation';
import { NextPageProps } from '@/types/next';

interface OrderPageProps extends NextPageProps {
  params: {
    locale: string;
    orderId: string;
  };
}

export default function OrderPage({ params }: OrderPageProps) {
  const { orderId } = params;

  if (!orderId) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1>Order {orderId}</h1>
      {/* Order details будут в следующих задачах */}
    </main>
  );
}
## ✅ **Success Metrics - ОБНОВЛЕНО**

### ✅ Что уже работает:
- ExchangeContainer.tsx onSubmit интегрирован с useFormWithNextIntl
- useExchangeMutation содержит createOrder с onSuccess/onError callbacks
- ExchangeFormData готов для передачи в API (правильные поля)
- securityEnhancedAdvancedExchangeFormSchema валидирует форму
- tRPC integration настроен для создания orders

### 🎯 Что нужно добавить:
- [ ] Submit Button в ExchangeForm.ActionArea
- [ ] Loading состояния через isCreatingOrder
- [ ] Toast notifications для success/error
- [ ] Navigation redirect к `/order/[orderId]`
- [ ] Локализация для submission messages
- [ ] Создать базовую страницу order/[orderId]/page.tsx

### 📋 **Конкретные файлы для обновления**:

1. **ExchangeContainer.tsx** - добавить useExchangeMutation integration
2. **ExchangeLayout.tsx** - добавить Submit Button в ActionArea
3. **apps/web/messages/ru.json** - добавить submit локализацию
4. **apps/web/app/[locale]/order/[orderId]/page.tsx** - создать для redirect

### 🎯 **Критерии успеха**:
- [ ] Form submission работает через tRPC createOrder
- [ ] Loading states отображаются корректно
- [ ] Success/error notifications работают
- [ ] Redirect на order page после успеха
- [ ] Валидация блокирует некорректные submission

---

**Статус**: ✅ АРХИТЕКТУРА ГОТОВА, требует интеграции
**Зависимости**: Tasks 2.1-2.3 (практически готовы) ✅
**Следующий шаг**: Интегрировать submission в существующие компоненты
                  • {t('submit.validation.termsRequired')}
                </div>
              )}

              {!form.values.captchaAnswer && (
                <div className="text-sm text-amber-700">
                  • {t('submit.validation.captchaRequired')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="submit-actions">
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            disabled={!isReadyForSubmit || isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('submit.button.creating')}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>{t('submit.button.create')}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>

          {/* Security Notice */}
          <div className="security-notice mt-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>{t('submit.security.notice')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 2. **Exchange Form Hook** (`useExchangeForm.ts`)

```tsx
// apps/web/app/[locale]/exchange/hooks/useExchangeForm.ts
'use client';

import { useFormWithNextIntl } from '@repo/hooks/src/client-hooks';
import { securityEnhancedAdvancedExchangeFormSchema } from '@repo/utils/src/validation/security-enhanced-exchange-schemas';
import { ExchangeFormData } from '@repo/exchange-core/src/types';
import { EXCHANGE_DEFAULTS } from '@repo/constants/src/exchange';
import { useExchangeSubmission } from './useExchangeSubmission';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@repo/hooks/src/client-hooks';

interface UseExchangeFormProps {
  initialParams?: {
    from?: string;
    to?: string;
    bank?: string;
    amount?: number;
  };
  locale: string;
  t: (key: string) => string;
}

export function useExchangeForm({ initialParams, locale, t }: UseExchangeFormProps) {
  const router = useRouter();
  const { addNotification } = useNotifications();

  // Prepare initial form data
  const initialFormData: Partial<ExchangeFormData> = {
    fromCurrency: (initialParams?.from?.split('-')[0] as any) || EXCHANGE_DEFAULTS.FROM_CURRENCY,
    fromTokenStandard: (initialParams?.from?.split('-')[1] as any) || 'TRC-20',
    toCurrency: EXCHANGE_DEFAULTS.TO_CURRENCY,
    selectedBank: (initialParams?.bank as any) || 'privatbank',
    cryptoAmount: initialParams?.amount || 0,
    uahAmount: 0,
    email: '',
    cardNumber: '',
    captchaAnswer: '',
    agreeToTerms: false,
    rememberData: false,
  };

  // Form submission hook
  const { submitExchange, isSubmitting, submissionError, lastSubmissionResult } =
    useExchangeSubmission({
      onSuccess: result => {
        // Show success notification
        addNotification({
          type: 'success',
          title: t('submit.success.title'),
          message: t('submit.success.message', { orderId: result.orderId }),
          duration: 5000,
        });

        // Redirect to order page
        router.push(`/${locale}/order/${result.orderId}`);
      },
      onError: error => {
        // Show error notification
        addNotification({
          type: 'error',
          title: t('submit.error.title'),
          message: error.message || t('submit.error.generic'),
          duration: 8000,
        });
      },
    });

  // Form configuration
  const form = useFormWithNextIntl<ExchangeFormData>({
    initialValues: initialFormData,
    validationSchema: securityEnhancedAdvancedExchangeFormSchema,
    t,
    onSubmit: async values => {
      await submitExchange(values);
    },
  });

  return {
    form,
    isSubmitting,
    submissionError,
    lastSubmissionResult,
    submitExchange: () => form.handleSubmit(),
  };
}
```

### 3. **Exchange Submission Hook** (`useExchangeSubmission.ts`)

```tsx
// apps/web/app/[locale]/exchange/hooks/useExchangeSubmission.ts
'use client';

import { useState, useCallback } from 'react';
import { ExchangeFormData } from '@repo/exchange-core/src/types';
import { useExchangeMutation } from '@/hooks/useExchangeMutation';
import { TRPCError } from '@trpc/server';
import { useExchangeStore } from '@repo/hooks/src/state/exchange-store';

interface UseExchangeSubmissionProps {
  onSuccess?: (result: ExchangeSubmissionResult) => void;
  onError?: (error: ExchangeSubmissionError) => void;
}

interface ExchangeSubmissionResult {
  orderId: string;
  depositAddress: string;
  cryptoAmount: number;
  uahAmount: number;
  currency: string;
  status: string;
  createdAt: Date;
}

interface ExchangeSubmissionError {
  code: string;
  message: string;
  field?: string;
}

export function useExchangeSubmission({ onSuccess, onError }: UseExchangeSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<ExchangeSubmissionError | null>(null);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<ExchangeSubmissionResult | null>(
    null
  );

  // Exchange store for state management
  const { setCurrentOrder, updateOrderStatus } = useExchangeStore();

  // Exchange mutation hook
  const { createOrder } = useExchangeMutation({
    onSuccess: result => {
      setLastSubmissionResult(result as ExchangeSubmissionResult);
      setCurrentOrder({
        id: result.orderId,
        status: result.status as any,
        cryptoAmount: result.cryptoAmount,
        uahAmount: result.uahAmount,
        currency: result.currency as any,
        createdAt: result.createdAt,
        updatedAt: result.createdAt,
      });
      onSuccess?.(result as ExchangeSubmissionResult);
    },
    onError: error => {
      const formattedError = formatSubmissionError(error);
      setSubmissionError(formattedError);
      onError?.(formattedError);
    },
  });

  const submitExchange = useCallback(
    async (formData: ExchangeFormData) => {
      setIsSubmitting(true);
      setSubmissionError(null);

      try {
        // Prepare submission data
        const submissionData = {
          email: formData.email,
          cryptoAmount: formData.cryptoAmount,
          currency: formData.fromCurrency,
          tokenStandard: formData.fromTokenStandard,
          recipientData: {
            cardNumber: formData.cardNumber,
            bankDetails: formData.selectedBank,
          },
          // Additional metadata
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        };

        // Submit through tRPC
        await createOrder.mutateAsync(submissionData);
      } catch (error) {
        console.error('Exchange submission failed:', error);
        // Error handling через mutation onError callback
      } finally {
        setIsSubmitting(false);
      }
    },
    [createOrder]
  );

  return {
    submitExchange,
    isSubmitting,
    submissionError,
    lastSubmissionResult,
    clearError: () => setSubmissionError(null),
  };
}

// Error formatting utility
function formatSubmissionError(error: TRPCError): ExchangeSubmissionError {
  // Rate limiting errors
  if (error.code === 'TOO_MANY_REQUESTS') {
    return {
      code: 'RATE_LIMIT',
      message: 'Слишком много запросов. Попробуйте через несколько минут.',
    };
  }

  // Validation errors
  if (error.code === 'BAD_REQUEST') {
    return {
      code: 'VALIDATION_ERROR',
      message: error.message || 'Проверьте правильность заполнения формы',
    };
  }

  // Server errors
  if (error.code === 'INTERNAL_SERVER_ERROR') {
    return {
      code: 'SERVER_ERROR',
      message: 'Временная ошибка сервера. Попробуйте позже.',
    };
  }

  // Network errors
  if (error.message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Ошибка соединения. Проверьте интернет подключение.',
    };
  }

  // Generic error
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'Произошла неизвестная ошибка',
  };
}
```

### 4. **Loading States Component** (`LoadingStates.tsx`)

```tsx
// apps/web/app/[locale]/exchange/components/LoadingStates.tsx
'use client';

import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface LoadingStatesProps {
  isSubmitting: boolean;
  hasError?: boolean;
  errorMessage?: string;
  t: (key: string) => string;
}

export function LoadingStates({ isSubmitting, hasError, errorMessage, t }: LoadingStatesProps) {
  if (!isSubmitting && !hasError) return null;

  return (
    <div className="loading-overlay fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="loading-content bg-background border border-border rounded-lg p-8 max-w-md mx-4 shadow-lg">
        {isSubmitting && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t('loading.submitting.title')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{t('loading.submitting.message')}</p>

            {/* Progress Steps */}
            <div className="progress-steps space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                {t('loading.steps.validation')}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
                {t('loading.steps.processing')}
              </div>
              <div className="flex items-center text-sm text-muted-foreground opacity-50">
                <div className="w-4 h-4 rounded-full border-2 border-muted mr-2" />
                {t('loading.steps.redirect')}
              </div>
            </div>
          </div>
        )}

        {hasError && (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t('loading.error.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {errorMessage || t('loading.error.generic')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 🔗 **Integration with Previous Tasks**

### Update ExchangeContainer.tsx:

```tsx
// Replace form initialization in ExchangeContainer.tsx
import { useExchangeForm } from './hooks/useExchangeForm';
import { SubmitSection } from './components/SubmitSection';
import { LoadingStates } from './components/LoadingStates';

export function ExchangeContainer({ locale, initialParams }: ExchangeContainerProps) {
  const t = useTranslations('AdvancedExchangeForm');

  const { form, isSubmitting, submissionError, submitExchange } = useExchangeForm({
    initialParams,
    locale,
    t,
  });

  return (
    <div className="exchange-container">
      {/* Existing header and layout */}
      <ExchangeLayout form={form} t={t} />

      {/* Add Submit Section */}
      <SubmitSection form={form} t={t} isSubmitting={isSubmitting} onSubmit={submitExchange} />

      {/* Loading States Overlay */}
      <LoadingStates
        isSubmitting={isSubmitting}
        hasError={!!submissionError}
        errorMessage={submissionError?.message}
        t={t}
      />
    </div>
  );
}
```

## 📝 **Translation Keys Required**

### Add to messages/ru.json:

```json
{
  "AdvancedExchangeForm": {
    "submit": {
      "summary": {
        "title": "Подтверждение операции",
        "exchange": "Обмен",
        "bank": "Банк и карта",
        "email": "Контакт"
      },
      "validation": {
        "title": "Завершите заполнение формы",
        "errorsFound": "Найдено ошибок: {count}",
        "termsRequired": "Требуется согласие с условиями",
        "captchaRequired": "Требуется решение примера"
      },
      "button": {
        "create": "Создать заявку",
        "creating": "Создание заявки..."
      },
      "security": {
        "notice": "Защищенное соединение SSL"
      },
      "success": {
        "title": "Заявка создана!",
        "message": "Заявка {orderId} успешно создана"
      },
      "error": {
        "title": "Ошибка создания заявки",
        "generic": "Попробуйте еще раз"
      }
    },
    "loading": {
      "submitting": {
        "title": "Создание заявки",
        "message": "Пожалуйста, дождитесь завершения операции"
      },
      "steps": {
        "validation": "Проверка данных",
        "processing": "Обработка заявки",
        "redirect": "Переход к заявке"
      },
      "error": {
        "title": "Ошибка",
        "generic": "Произошла ошибка при создании заявки"
      }
    }
  }
}
```

## ✅ **Validation Criteria**

### Functional Requirements:

- [ ] Form submission через tRPC API работает
- [ ] Success redirect к order page
- [ ] Error handling с user-friendly messages
- [ ] Loading states отображаются корректно
- [ ] State persistence через Zustand store
- [ ] Rate limiting handling

### Technical Requirements:

- [ ] TypeScript типы корректны для всех hooks
- [ ] tRPC integration без memory leaks
- [ ] Error boundaries обрабатывают критические ошибки
- [ ] Form validation полная перед submission
- [ ] Network error recovery mechanisms
- [ ] Optimistic UI updates

### UX Requirements:

- [ ] Loading overlays не блокируют navigation
- [ ] Progress indicators показывают текущий статус
- [ ] Error messages локализованы и понятны
- [ ] Success feedback immediate и clear
- [ ] Form data не теряется при errors
- [ ] Submission можно повторить после errors

### Security Requirements:

- [ ] Sensitive data не логируется
- [ ] CSRF protection через tRPC
- [ ] Rate limiting respects server limits
- [ ] Input sanitization перед submission
- [ ] Proper error message sanitization

---

**Статус**: ✅ Ready for implementation  
**Зависимости**: Tasks 2.1-2.3 (Complete Form Structure)  
**Следующий шаг**: Integration testing & final optimization
