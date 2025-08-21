# 📋 TASK 2.4: Form Submission & State Management

> **Цель**: Реализовать form submission logic, state management, error handling и integration с tRPC API для создания exchange orders с полной UX optimization.

## 🎯 **Scope Definition - на 100% основано на архитектурном анализе**

### Создаваемые файлы:

- `apps/web/app/[locale]/exchange/components/SubmitSection.tsx` - submit button и actions
- `apps/web/app/[locale]/exchange/hooks/useExchangeForm.ts` - form business logic
- `apps/web/app/[locale]/exchange/hooks/useExchangeSubmission.ts` - submission handling
- `apps/web/app/[locale]/exchange/components/LoadingStates.tsx` - loading overlays

### Интеграция с существующими системами:

- **API Integration**: `useExchangeMutation` hook (СУЩЕСТВУЕТ)
- **Error Handling**: `useNotifications` toast system (СУЩЕСТВУЕТ)
- **Navigation**: Next.js router для redirect to order page (СУЩЕСТВУЕТ)
- **State Management**: Zustand exchange store (СУЩЕСТВУЕТ в packages/hooks)
- **Validation**: Complete form validation через schemas (ГОТОВО в tasks 1.1-1.3)

### Architectural Requirements from Acceptance Criteria:

- Form submission через `trpc.exchange.createOrder`
- Loading states management во время submission
- Error handling с локализованными сообщениями
- Success redirect к `/[locale]/order/{orderId}`
- Optimistic UI updates и state persistence
- Rate limiting handling и retry mechanisms

## 📐 **Technical Implementation Plan**

### 1. **Submit Section Component** (`SubmitSection.tsx`)

```tsx
// apps/web/app/[locale]/exchange/components/SubmitSection.tsx
'use client';

import { UseFormReturn } from '@repo/hooks';
import { ExchangeFormData } from '@repo/exchange-core/src/types';
import { Button } from '@repo/ui';
import { Loader2, Shield, ArrowRight } from 'lucide-react';

interface SubmitSectionProps {
  form: UseFormReturn<ExchangeFormData>;
  t: (key: string) => string;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function SubmitSection({ form, t, isSubmitting, onSubmit }: SubmitSectionProps) {
  const { isValid, errors } = form;

  // Count validation errors
  const errorCount = Object.keys(errors).length;

  // Determine if form is ready for submission
  const isReadyForSubmit =
    isValid &&
    form.values.agreeToTerms &&
    form.values.captchaAnswer &&
    form.values.cryptoAmount > 0;

  return (
    <section className="submit-section">
      <div className="submit-container bg-background border border-border rounded-lg p-6">
        {/* Pre-submission Summary */}
        <div className="submission-summary mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {t('submit.summary.title')}
          </h3>

          <div className="summary-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Exchange Summary */}
            <div className="summary-item bg-muted/30 border border-border rounded-md p-4">
              <div className="text-sm text-muted-foreground mb-1">
                {t('submit.summary.exchange')}
              </div>
              <div className="font-semibold">
                {form.values.cryptoAmount} {form.values.fromCurrency} →{' '}
                {form.values.uahAmount?.toFixed(2)} UAH
              </div>
            </div>

            {/* Bank Info */}
            <div className="summary-item bg-muted/30 border border-border rounded-md p-4">
              <div className="text-sm text-muted-foreground mb-1">{t('submit.summary.bank')}</div>
              <div className="font-semibold">
                {form.values.selectedBank} • {form.values.cardNumber.replace(/(\d{4})/g, '$1 ')}
              </div>
            </div>

            {/* Contact */}
            <div className="summary-item bg-muted/30 border border-border rounded-md p-4">
              <div className="text-sm text-muted-foreground mb-1">{t('submit.summary.email')}</div>
              <div className="font-semibold">{form.values.email}</div>
            </div>
          </div>
        </div>

        {/* Validation Status */}
        {!isReadyForSubmit && (
          <div className="validation-status mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-center space-x-2 text-amber-800 mb-2">
                <Shield className="w-4 h-4" />
                <span className="font-medium">{t('submit.validation.title')}</span>
              </div>

              {errorCount > 0 && (
                <div className="text-sm text-amber-700">
                  {t('submit.validation.errorsFound', { count: errorCount })}
                </div>
              )}

              {!form.values.agreeToTerms && (
                <div className="text-sm text-amber-700">
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
