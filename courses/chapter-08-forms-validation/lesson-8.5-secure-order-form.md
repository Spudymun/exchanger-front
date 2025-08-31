# Урок 8.5: Практика - Безопасная форма создания заявки

> **Цель урока**: Создать полноценную форму обменника валют, применив все изученные принципы безопасности, валидации и UX для реального финансового приложения

## 📖 Теория

### Архитектура формы обмена валют

Форма создания заявки на обмен - это сердце любого обменника. Она должна сочетать:

1. **Максимальную безопасность** - защита финансовых данных
2. **Удобство использования** - интуитивно понятный интерфейс
3. **Надежность** - валидация на всех уровнях
4. **Производительность** - быстрая обратная связь
5. **Доступность** - работа для всех пользователей

**Бизнес-требования к форме:**

- Проверка лимитов обмена в реальном времени
- Валидация платежных данных
- Расчет курса и комиссий
- Защита от мошенничества
- Соответствие финансовым регулированиям

### Компоненты безопасной формы

```typescript
// Структура данных формы обмена
interface ExchangeOrderForm {
  // Основные параметры обмена
  fromCurrency: CryptoCurrency;
  toCurrency: 'UAH';
  fromAmount: string;
  toAmount: string;

  // Контактные данные
  email: string;
  phone?: string;

  // Платежные реквизиты
  paymentMethod: 'card' | 'bank_transfer';
  cardNumber?: string;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    recipientName: string;
  };

  // Согласия и подтверждения
  termsAccepted: boolean;
  privacyAccepted: boolean;
  riskDisclosureAccepted: boolean;
}
```

## 🔍 Анализ существующего кода

### Security-Enhanced схема формы обмена

Изучим реальную схему из проекта `packages/utils/src/validation/security-enhanced-exchange-schemas.ts`:

```typescript
/**
 * CREATE EXCHANGE ORDER SCHEMA
 * Полная схема для создания заявки с многоуровневой защитой
 */
export const securityEnhancedCreateExchangeOrderSchema = z.object({
  // Email с XSS защитой
  email: xssProtectedEmailSchema,

  // Криптовалютная сумма с бизнес-лимитами
  cryptoAmount: z
    .number()
    .positive('AMOUNT_POSITIVE_REQUIRED')
    .min(VALIDATION_LIMITS.MIN_ORDER_AMOUNT, VALIDATION_KEYS.AMOUNT_MIN_VALUE)
    .max(VALIDATION_LIMITS.MAX_ORDER_AMOUNT, VALIDATION_KEYS.AMOUNT_MAX_VALUE)
    .finite('AMOUNT_MUST_BE_FINITE'), // Защита от Infinity/NaN

  // Гривневая сумма
  uahAmount: z.number().positive('AMOUNT_POSITIVE_REQUIRED').finite('UAH_AMOUNT_MUST_BE_FINITE'),

  // Валюта обмена
  currency: currencySchema,

  // Платежные данные (опционально)
  paymentDetails: z
    .object({
      cardNumber: securityEnhancedCardNumberSchema.optional(),
      bankDetails: createXSSProtectedStringWithLength(
        0,
        SECURITY_VALIDATION_LIMITS.MESSAGE_MAX_LENGTH
      ).optional(),
    })
    .optional(),
});
```

**Уровни защиты:**

1. **XSS Protection** - все строковые поля защищены
2. **Business Rules** - проверка лимитов обмена
3. **Format Validation** - корректность форматов данных
4. **Type Safety** - строгая типизация TypeScript
5. **Security Limits** - ограничения на длину и содержимое

### Динамическая валидация лимитов

Рассмотрим как работает проверка бизнес-лимитов:

```typescript
// packages/exchange-core/src/utils/validation.ts
export function isAmountWithinLimits(amount: number, currency: CryptoCurrency): ValidationResult {
  const limits = getCurrencyLimits(currency);

  // Минимальная сумма
  if (amount < limits.min) {
    return {
      isValid: false,
      reason: 'AMOUNT_TOO_SMALL',
      localizationKey: 'validation.amount.belowMinimum',
      params: {
        amount: amount.toString(),
        min: limits.min.toString(),
        currency,
      },
    };
  }

  // Максимальная сумма
  if (amount > limits.max) {
    return {
      isValid: false,
      reason: 'AMOUNT_TOO_LARGE',
      localizationKey: 'validation.amount.aboveMaximum',
      params: {
        amount: amount.toString(),
        max: limits.max.toString(),
        currency,
      },
    };
  }

  // Дневной лимит (если применимо)
  if (amount > limits.dailyLimit) {
    return {
      isValid: false,
      reason: 'DAILY_LIMIT_EXCEEDED',
      localizationKey: 'validation.amount.dailyLimitExceeded',
      params: {
        dailyLimit: limits.dailyLimit.toString(),
        currency,
      },
    };
  }

  return { isValid: true };
}
```

## 💻 Практическое задание

### Создание полной формы обмена

Создайте файл `secure-exchange-form.tsx` и реализуйте полную форму:

```typescript
'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

import {
  securityEnhancedCreateExchangeOrderSchema,
  xssProtectedEmailSchema,
  securityEnhancedCardNumberSchema
} from '@repo/utils';
import { CryptoCurrency } from '@repo/exchange-core';
import {
  InputField,
  SelectField,
  CheckboxField,
  Button,
  Card
} from '@repo/ui';

// Расширенная схема с дополнительными полями
const fullExchangeOrderSchema = securityEnhancedCreateExchangeOrderSchema.extend({
  phone: z.string()
    .regex(/^\+380\d{9}$/, 'Введите номер в формате +380XXXXXXXXX')
    .optional(),
  paymentMethod: z.enum(['card', 'bank_transfer']),
  termsAccepted: z.boolean().refine(val => val, 'Необходимо принять условия'),
  privacyAccepted: z.boolean().refine(val => val, 'Необходимо принять политику конфиденциальности'),
});

type ExchangeOrderFormData = z.infer<typeof fullExchangeOrderSchema>;

// Константы для формы
const SUPPORTED_CURRENCIES: CryptoCurrency[] = ['BTC', 'ETH', 'USDT'];
const PAYMENT_METHODS = [
  { value: 'card', label: 'Банковская карта' },
  { value: 'bank_transfer', label: 'Банковский перевод' }
];

export function SecureExchangeForm() {
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const t = useTranslations('ExchangeForm');
  const tValidation = useTranslations('Validation');

  // Инициализация формы
  const form = useForm<ExchangeOrderFormData>({
    resolver: zodResolver(fullExchangeOrderSchema),
    defaultValues: {
      fromCurrency: 'USDT',
      fromAmount: '',
      toAmount: '',
      email: '',
      phone: '',
      paymentMethod: 'card',
      termsAccepted: false,
      privacyAccepted: false,
    },
    mode: 'onChange'
  });

  // Наблюдение за изменениями суммы для пересчета
  const watchedFromAmount = form.watch('fromAmount');
  const watchedFromCurrency = form.watch('fromCurrency');

  // TODO: Реализуйте автоматический пересчет курса
  useEffect(() => {
    const calculateExchange = async () => {
      if (!watchedFromAmount || isNaN(Number(watchedFromAmount))) {
        form.setValue('toAmount', '');
        return;
      }

      setIsCalculating(true);
      try {
        // Здесь должен быть запрос к API курсов
        const rate = await fetchExchangeRate(watchedFromCurrency, 'UAH');
        const toAmount = Number(watchedFromAmount) * rate;

        setExchangeRate(rate);
        form.setValue('toAmount', toAmount.toFixed(2));
      } catch (error) {
        console.error('Error calculating exchange:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    const debounceTimer = setTimeout(calculateExchange, 500);
    return () => clearTimeout(debounceTimer);
  }, [watchedFromAmount, watchedFromCurrency, form]);

  // Обработчик отправки
  const onSubmit = async (data: ExchangeOrderFormData) => {
    try {
      // TODO: Интеграция с API создания заявки
      console.log('Creating exchange order:', data);

      // Здесь должен быть запрос к tRPC endpoint
      // const result = await trpc.exchange.createOrder.mutate(data);

      // Показ сообщения об успехе
      alert('Заявка успешно создана!');
    } catch (error) {
      console.error('Error creating order:', error);
      // Обработка ошибок
    }
  };

  return (
    <Card className="max-w-2xl mx-auto p-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Секция обмена */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('exchange.title')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Валюта источник */}
            <SelectField
              {...form.register('fromCurrency')}
              label={t('exchange.fromCurrency')}
              options={SUPPORTED_CURRENCIES.map(currency => ({
                value: currency,
                label: currency
              }))}
              error={form.formState.errors.fromCurrency?.message}
            />

            {/* Сумма источник */}
            <InputField
              {...form.register('fromAmount')}
              type="number"
              step="0.00000001"
              label={t('exchange.fromAmount')}
              placeholder="0.00"
              error={form.formState.errors.fromAmount?.message}
              hint={`Мин: ${getMinAmount(watchedFromCurrency)} ${watchedFromCurrency}`}
            />
          </div>

          {/* Курс обмена */}
          {exchangeRate > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                Курс: 1 {watchedFromCurrency} = {exchangeRate.toFixed(2)} UAH
              </p>
            </div>
          )}

          {/* Сумма получения */}
          <InputField
            {...form.register('toAmount')}
            type="number"
            label={t('exchange.toAmount')}
            placeholder="0.00"
            disabled
            value={form.watch('toAmount')}
            suffix="UAH"
            className="bg-gray-50"
          />

          {isCalculating && (
            <p className="text-sm text-gray-500">Пересчитываем курс...</p>
          )}
        </div>

        {/* Секция контактов */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('contacts.title')}</h2>

          <InputField
            {...form.register('email')}
            type="email"
            label={t('contacts.email')}
            placeholder="your@email.com"
            error={form.formState.errors.email?.message}
            required
          />

          <InputField
            {...form.register('phone')}
            type="tel"
            label={t('contacts.phone')}
            placeholder="+380XXXXXXXXX"
            error={form.formState.errors.phone?.message}
            hint="Опционально, для связи по заявке"
          />
        </div>

        {/* Секция платежных данных */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('payment.title')}</h2>

          <SelectField
            {...form.register('paymentMethod')}
            label={t('payment.method')}
            options={PAYMENT_METHODS}
          />

          {form.watch('paymentMethod') === 'card' && (
            <InputField
              {...form.register('paymentDetails.cardNumber')}
              type="text"
              label={t('payment.cardNumber')}
              placeholder="1234 5678 9012 3456"
              error={form.formState.errors.paymentDetails?.cardNumber?.message}
              maxLength={19}
            />
          )}

          {form.watch('paymentMethod') === 'bank_transfer' && (
            <div className="space-y-3">
              <InputField
                {...form.register('paymentDetails.bankDetails.accountNumber')}
                label={t('payment.accountNumber')}
                placeholder="26XXXXXXXXXXXXXXXXXXXXXXXXX"
              />

              <InputField
                {...form.register('paymentDetails.bankDetails.bankName')}
                label={t('payment.bankName')}
                placeholder="Название банка"
              />

              <InputField
                {...form.register('paymentDetails.bankDetails.recipientName')}
                label={t('payment.recipientName')}
                placeholder="ФИО получателя"
              />
            </div>
          )}
        </div>

        {/* Секция согласий */}
        <div className="space-y-3">
          <CheckboxField
            {...form.register('termsAccepted')}
            label={
              <span>
                Я принимаю <a href="/terms" className="text-blue-600 hover:underline">условия использования</a>
              </span>
            }
            error={form.formState.errors.termsAccepted?.message}
          />

          <CheckboxField
            {...form.register('privacyAccepted')}
            label={
              <span>
                Я принимаю <a href="/privacy" className="text-blue-600 hover:underline">политику конфиденциальности</a>
              </span>
            }
            error={form.formState.errors.privacyAccepted?.message}
          />
        </div>

        {/* Кнопка отправки */}
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting || !form.formState.isValid}
          loading={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? t('submit.creating')
            : t('submit.create')
          }
        </Button>

        {/* Информация о безопасности */}
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-700">
            🔒 Ваши данные защищены SSL шифрованием и не передаются третьим лицам
          </p>
        </div>
      </form>
    </Card>
  );
}

// Вспомогательные функции
async function fetchExchangeRate(from: CryptoCurrency, to: string): Promise<number> {
  // TODO: Реализовать запрос к API курсов
  // Заглушка для демонстрации
  const rates = {
    'BTC': 1200000,
    'ETH': 120000,
    'USDT': 41
  };

  return rates[from] || 0;
}

function getMinAmount(currency: CryptoCurrency): string {
  const minimums = {
    'BTC': '0.001',
    'ETH': '0.01',
    'USDT': '10'
  };

  return minimums[currency] || '0';
}
```

### Создание тестов для формы

Создайте файл `secure-exchange-form.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecureExchangeForm } from './secure-exchange-form';

// Мокаем переводы
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}));

describe('SecureExchangeForm', () => {
  test('should validate email field', async () => {
    render(<SecureExchangeForm />);

    const emailInput = screen.getByLabelText(/email/i);

    // Тест невалидного email
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText(/введите корректный email/i)).toBeInTheDocument();
    });

    // Тест валидного email
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'test@example.com');

    await waitFor(() => {
      expect(screen.queryByText(/введите корректный email/i)).not.toBeInTheDocument();
    });
  });

  test('should validate amount limits', async () => {
    render(<SecureExchangeForm />);

    const amountInput = screen.getByLabelText(/fromAmount/i);

    // Тест суммы ниже минимума
    await userEvent.type(amountInput, '0.0001');

    await waitFor(() => {
      expect(screen.getByText(/минимальная сумма/i)).toBeInTheDocument();
    });
  });

  test('should require terms acceptance', async () => {
    render(<SecureExchangeForm />);

    // Заполняем форму но не принимаем условия
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/fromAmount/i), '10');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/необходимо принять условия/i)).toBeInTheDocument();
    });
  });

  test('should prevent XSS in input fields', async () => {
    render(<SecureExchangeForm />);

    const emailInput = screen.getByLabelText(/email/i);

    // Попытка XSS атаки
    await userEvent.type(emailInput, '<script>alert("xss")</script>');

    await waitFor(() => {
      expect(screen.getByText(/недопустимые символы/i)).toBeInTheDocument();
    });
  });
});
```

## ✅ Проверка знаний

### Теоретические вопросы

1. **Какие уровни валидации должны быть в финансовой форме?**
   - a) Только клиентская валидация
   - b) Только серверная валидация
   - c) Клиентская + серверная + бизнес-правила + безопасность

2. **Что важнее в форме обмена валют?**
   - a) Скорость работы
   - b) Безопасность данных
   - c) Красивый дизайн

3. **Как обрабатывать пересчет курса в реальном времени?**
   - a) При каждом нажатии клавиши
   - b) С задержкой (debounce) для оптимизации
   - c) Только при отправке формы

### Практические задания

1. **Добавьте валидацию** для поля "Сумма получения" с проверкой минимума в 100 UAH

2. **Создайте компонент** для отображения комиссии за обмен

3. **Реализуйте** сохранение прогресса формы в localStorage

## 🔧 Оптимизация и улучшения

### Performance оптимизации

```typescript
// 1. Мемоизация сложных вычислений
const exchangeCalculation = useMemo(() => {
  if (!fromAmount || !exchangeRate) return null;

  const result = Number(fromAmount) * exchangeRate;
  const commission = result * 0.02; // 2% комиссия
  const total = result - commission;

  return { result, commission, total };
}, [fromAmount, exchangeRate]);

// 2. Debounced валидация
const debouncedValidation = useCallback(
  debounce(async (fieldName: string, value: string) => {
    await form.trigger(fieldName);
  }, 300),
  [form]
);

// 3. Ленивая загрузка тяжелых компонентов
const PaymentMethodSelector = lazy(() => import('./PaymentMethodSelector'));
```

### Accessibility улучшения

```typescript
// 1. Управление фокусом
useEffect(() => {
  if (form.formState.errors.email) {
    document.getElementById('email-input')?.focus();
  }
}, [form.formState.errors.email]);

// 2. Объявления для screen readers
const announceError = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = message;
  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// 3. Клавиатурная навигация
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    form.handleSubmit(onSubmit)();
  }
};
```

### Безопасность

```typescript
// 1. Rate limiting для API запросов
const rateLimiter = useRateLimit(5, 60000); // 5 запросов в минуту

// 2. Validation on server side
const serverValidation = async (data: ExchangeOrderFormData) => {
  // Повторная валидация на сервере
  const result = fullExchangeOrderSchema.safeParse(data);

  if (!result.success) {
    throw new Error('Server validation failed');
  }

  return result.data;
};

// 3. CSRF protection
const csrfToken = await getCsrfToken();
const headers = {
  'X-CSRF-Token': csrfToken,
  'Content-Type': 'application/json',
};
```

## 📚 Дополнительные материалы

### Финансовые регулирования

- [PCI DSS Compliance](https://www.pcisecuritystandards.org/) - стандарты безопасности платежных карт
- [AML/KYC Requirements](https://www.fatf-gafi.org/) - требования по противодействию отмыванию денег
- [GDPR for Financial Data](https://gdpr.eu/) - защита персональных данных

### Тестирование финансовых форм

- [Testing Financial Applications](https://www.thoughtworks.com/insights/articles/testing-financial-applications)
- [Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

### UX для финансовых продуктов

- [Designing for Trust in Finance](https://www.nngroup.com/articles/financial-trust-ux/)
- [Form Design for Conversions](https://cxl.com/blog/form-design-best-practices/)

## 🎯 Резюме урока

В этом уроке вы создали:

1. **Полноценную форму обменника валют** с реальными бизнес-требованиями
2. **Многоуровневую систему безопасности** от XSS до валидации лимитов
3. **Интеграцию всех изученных технологий** - Zod, React Hook Form, next-intl
4. **Продвинутые UX паттерны** - real-time расчеты, прогрессивная валидация
5. **Comprehensive testing strategy** для финансового приложения

**Ключевые достижения:**

- ✅ **Security-Enhanced валидация** - защита от всех типов атак
- ✅ **Business Rules Integration** - реальные финансовые ограничения
- ✅ **Excellent UX** - интуитивно понятный интерфейс
- ✅ **Type Safety** - полная типизация от схемы до UI
- ✅ **Performance** - оптимизированная работа
- ✅ **Accessibility** - доступность для всех пользователей

## 🎉 Поздравляем!

Вы успешно завершили **Главу 8: Формы и валидация**!

Теперь вы владеете:

- ✅ **Zod runtime валидацией** для безопасности данных
- ✅ **Security-Enhanced схемами** для финансовых приложений
- ✅ **React Hook Form интеграцией** с современными паттернами
- ✅ **Продвинутым UX ошибок** для лучшего пользовательского опыта
- ✅ **Созданием production-ready форм** для реальных проектов

**Следующая глава**: [Глава 9: Production deployment и оптимизация](../chapter-09-production-deployment/README.md) - подготовим приложение к production развертыванию с оптимизацией производительности и безопасности.

---

[← Урок 8.4](./lesson-8.4-error-handling-ux.md) | [Глава 9 →](../chapter-09-production-deployment/README.md)
