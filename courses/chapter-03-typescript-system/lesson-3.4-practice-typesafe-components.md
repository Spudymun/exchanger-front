# Урок 3.4: Практика - создание типобезопасных компонентов

> **🎯 Цель урока**: Создать полностью типизированный React компонент для создания заявки на обмен, используя типы из exchange-core и tRPC интеграцию

## 📖 Введение

В этом уроке мы применим все знания о TypeScript на практике, создав компонент `ExchangeForm` который:

1. **Использует типы из `@repo/exchange-core`** для валидации данных
2. **Интегрируется с tRPC API** для отправки заявок
3. **Обеспечивает type safety** на всех уровнях
4. **Обрабатывает ошибки типизированно**

## 🔍 Анализ требований

### Что должен делать компонент:

```typescript
// Интерфейс компонента ExchangeForm
interface ExchangeFormProps {
  initialCurrency?: CryptoCurrency;
  onSuccess?: (order: Order) => void;
  onError?: (error: TRPCClientError) => void;
}

// Поток данных:
// User Input → Form State → Validation → API Call → Success/Error
```

### Типы которые мы будем использовать:

```typescript
// packages/exchange-core/src/types/currency.ts
type CryptoCurrency = 'BTC' | 'ETH' | 'USDT-TRC20' | 'USDT-ERC20' | 'TRX';

// packages/exchange-core/src/types/order.ts
interface CreateOrderRequest {
  email: string;
  cryptoAmount: number;
  currency: CryptoCurrency;
  uahAmount: number;
  recipientData: RecipientData;
}

interface Order {
  id: string;
  email: string;
  currency: CryptoCurrency;
  cryptoAmount: number;
  uahAmount: number;
  status: OrderStatus;
  recipientData: RecipientData;
  createdAt: Date;
}
```

## 🏗️ Создание базовой структуры

### Шаг 1: Типы состояния формы

```typescript
// apps/web/src/components/ExchangeForm/types.ts
import type {
  CryptoCurrency,
  CreateOrderRequest,
  Order,
  RecipientCardData,
} from '@repo/exchange-core';

// Состояние формы (отдельный тип для UI)
interface ExchangeFormData {
  email: string;
  currency: CryptoCurrency;
  cryptoAmount: string; // string для input
  uahAmount: string; // string для input
  cardNumber: string;
  cardHolderName: string;
  acceptTerms: boolean;
}

// Ошибки валидации
interface ExchangeFormErrors {
  email?: string;
  cryptoAmount?: string;
  uahAmount?: string;
  cardNumber?: string;
  cardHolderName?: string;
  acceptTerms?: string;
  general?: string;
}

// Пропсы компонента
interface ExchangeFormProps {
  initialCurrency?: CryptoCurrency;
  onSuccess?: (order: Order) => void;
  onError?: (error: TRPCClientError) => void;
  className?: string;
}

// Функция конвертации из UI типов в API типы
function convertFormDataToOrderRequest(formData: ExchangeFormData): CreateOrderRequest {
  return {
    email: formData.email,
    currency: formData.currency,
    cryptoAmount: parseFloat(formData.cryptoAmount),
    uahAmount: parseFloat(formData.uahAmount),
    recipientData: {
      type: 'card',
      cardNumber: formData.cardNumber,
      cardHolderName: formData.cardHolderName,
    } as RecipientCardData,
  };
}

export type { ExchangeFormData, ExchangeFormErrors, ExchangeFormProps };

export { convertFormDataToOrderRequest };
```

### Шаг 2: Хук валидации

```typescript
// apps/web/src/components/ExchangeForm/useFormValidation.ts
import { useMemo } from 'react';
import type { ExchangeFormData, ExchangeFormErrors } from './types';
import {
  CRYPTOCURRENCIES,
  isValidEmail,
  isValidCardNumber,
  MIN_AMOUNTS,
  MAX_AMOUNTS,
} from '@repo/exchange-core';

interface UseFormValidationReturn {
  errors: ExchangeFormErrors;
  isValid: boolean;
  validateField: (field: keyof ExchangeFormData, value: string | boolean) => string | undefined;
}

export function useFormValidation(formData: ExchangeFormData): UseFormValidationReturn {
  const validateField = (
    field: keyof ExchangeFormData,
    value: string | boolean
  ): string | undefined => {
    switch (field) {
      case 'email':
        if (!value) return 'Email обязателен';
        if (!isValidEmail(value as string)) return 'Некорректный email';
        return undefined;

      case 'currency':
        if (!CRYPTOCURRENCIES.includes(value as any)) {
          return 'Выберите валюту';
        }
        return undefined;

      case 'cryptoAmount':
        const cryptoAmount = parseFloat(value as string);
        if (!cryptoAmount || isNaN(cryptoAmount)) return 'Введите сумму';

        const min = MIN_AMOUNTS[formData.currency];
        const max = MAX_AMOUNTS[formData.currency];

        if (cryptoAmount < min) return `Минимум ${min} ${formData.currency}`;
        if (cryptoAmount > max) return `Максимум ${max} ${formData.currency}`;
        return undefined;

      case 'cardNumber':
        if (!value) return 'Номер карты обязателен';
        if (!isValidCardNumber(value as string)) return 'Некорректный номер карты';
        return undefined;

      case 'cardHolderName':
        if (!value) return 'Имя владельца карты обязательно';
        if ((value as string).length < 2) return 'Имя слишком короткое';
        return undefined;

      case 'acceptTerms':
        if (!value) return 'Необходимо принять условия';
        return undefined;

      default:
        return undefined;
    }
  };

  const errors = useMemo((): ExchangeFormErrors => {
    return {
      email: validateField('email', formData.email),
      currency: validateField('currency', formData.currency),
      cryptoAmount: validateField('cryptoAmount', formData.cryptoAmount),
      cardNumber: validateField('cardNumber', formData.cardNumber),
      cardHolderName: validateField('cardHolderName', formData.cardHolderName),
      acceptTerms: validateField('acceptTerms', formData.acceptTerms),
    };
  }, [formData]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error);
  }, [errors]);

  return { errors, isValid, validateField };
}
```

### Шаг 3: Хук для работы с курсами

```typescript
// apps/web/src/components/ExchangeForm/useExchangeRates.ts
import { useEffect, useState, useMemo } from 'react';
import type { CryptoCurrency, ExchangeRate } from '@repo/exchange-core';
import { trpc } from '@/lib/trpc-provider';
import { calculateUahAmount } from '@repo/utils';

interface UseExchangeRatesReturn {
  rates: ExchangeRate[];
  currentRate: ExchangeRate | null;
  isLoading: boolean;
  error: string | null;
  calculateUahAmount: (cryptoAmount: number) => number;
  calculateCryptoAmount: (uahAmount: number) => number;
}

export function useExchangeRates(currency: CryptoCurrency): UseExchangeRatesReturn {
  // Получаем курсы через tRPC
  const {
    data: rates,
    isLoading,
    error: trpcError,
  } = trpc.exchange.getRates.useQuery(
    { currency },
    {
      refetchInterval: 30000, // Обновляем каждые 30 секунд
      retry: 3,
    }
  );

  // Находим текущий курс для выбранной валюты
  const currentRate = useMemo(() => {
    return rates?.find(rate => rate.currency === currency) || null;
  }, [rates, currency]);

  // Функции расчета
  const calculateUah = (cryptoAmount: number): number => {
    if (!currentRate) return 0;
    return calculateUahAmount(cryptoAmount, currentRate.uahRate, currentRate.commission);
  };

  const calculateCrypto = (uahAmount: number): number => {
    if (!currentRate) return 0;
    return uahAmount / (currentRate.uahRate * (1 + currentRate.commission / 100));
  };

  return {
    rates: rates || [],
    currentRate,
    isLoading,
    error: trpcError?.message || null,
    calculateUahAmount: calculateUah,
    calculateCryptoAmount: calculateCrypto,
  };
}
```

## 🎨 Создание UI компонентов

### Шаг 4: Типизированные поля формы

```typescript
// apps/web/src/components/ExchangeForm/FormField.tsx
import { forwardRef } from 'react';
import { cn } from '@repo/utils';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, required, helpText, children }, ref) => {
    return (
      <div ref={ref} className="space-y-2">
        <label className={cn(
          "block text-sm font-medium text-gray-700",
          error && "text-red-700"
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {children}

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {helpText && !error && (
          <p className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { FormField };
```

### Шаг 5: Селект валют

```typescript
// apps/web/src/components/ExchangeForm/CurrencySelect.tsx
import { type CryptoCurrency, CRYPTOCURRENCIES } from '@repo/exchange-core';
import { FormField } from './FormField';

interface CurrencySelectProps {
  value: CryptoCurrency;
  onChange: (currency: CryptoCurrency) => void;
  error?: string;
  disabled?: boolean;
}

const CURRENCY_LABELS: Record<CryptoCurrency, string> = {
  'BTC': 'Bitcoin (BTC)',
  'ETH': 'Ethereum (ETH)',
  'USDT-TRC20': 'Tether TRC20 (USDT)',
  'USDT-ERC20': 'Tether ERC20 (USDT)',
  'TRX': 'Tron (TRX)',
};

export function CurrencySelect({ value, onChange, error, disabled }: CurrencySelectProps) {
  return (
    <FormField
      label="Валюта для обмена"
      error={error}
      required
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as CryptoCurrency)}
        disabled={disabled}
        className={cn(
          "block w-full rounded-md border border-gray-300 px-3 py-2",
          "focus:border-blue-500 focus:outline-none focus:ring-blue-500",
          "disabled:bg-gray-100 disabled:text-gray-500",
          error && "border-red-500"
        )}
      >
        {CRYPTOCURRENCIES.map(currency => (
          <option key={currency} value={currency}>
            {CURRENCY_LABELS[currency]}
          </option>
        ))}
      </select>
    </FormField>
  );
}
```

### Шаг 6: Поля для сумм с автоматическим расчетом

```typescript
// apps/web/src/components/ExchangeForm/AmountFields.tsx
import { useEffect } from 'react';
import type { CryptoCurrency } from '@repo/exchange-core';
import { FormField } from './FormField';
import { useExchangeRates } from './useExchangeRates';

interface AmountFieldsProps {
  currency: CryptoCurrency;
  cryptoAmount: string;
  uahAmount: string;
  onCryptoAmountChange: (amount: string) => void;
  onUahAmountChange: (amount: string) => void;
  cryptoError?: string;
  uahError?: string;
}

export function AmountFields({
  currency,
  cryptoAmount,
  uahAmount,
  onCryptoAmountChange,
  onUahAmountChange,
  cryptoError,
  uahError
}: AmountFieldsProps) {

  const { currentRate, calculateUahAmount, calculateCryptoAmount, isLoading } = useExchangeRates(currency);

  // Автоматический расчет UAH при изменении крипто суммы
  const handleCryptoChange = (value: string) => {
    onCryptoAmountChange(value);

    const cryptoNum = parseFloat(value);
    if (!isNaN(cryptoNum) && cryptoNum > 0) {
      const calculatedUah = calculateUahAmount(cryptoNum);
      onUahAmountChange(calculatedUah.toFixed(2));
    }
  };

  // Автоматический расчет крипто при изменении UAH суммы
  const handleUahChange = (value: string) => {
    onUahAmountChange(value);

    const uahNum = parseFloat(value);
    if (!isNaN(uahNum) && uahNum > 0) {
      const calculatedCrypto = calculateCryptoAmount(uahNum);
      onCryptoAmountChange(calculatedCrypto.toFixed(8));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label={`Сумма ${currency}`}
        error={cryptoError}
        required
        helpText={currentRate ? `Курс: ${currentRate.uahRate} UAH` : undefined}
      >
        <input
          type="number"
          step="any"
          value={cryptoAmount}
          onChange={(e) => handleCryptoChange(e.target.value)}
          placeholder={`0.00000000 ${currency}`}
          disabled={isLoading}
          className={cn(
            "block w-full rounded-md border border-gray-300 px-3 py-2",
            "focus:border-blue-500 focus:outline-none focus:ring-blue-500",
            "disabled:bg-gray-100",
            cryptoError && "border-red-500"
          )}
        />
      </FormField>

      <FormField
        label="Сумма в UAH"
        error={uahError}
        required
        helpText={currentRate ? `Комиссия: ${currentRate.commission}%` : undefined}
      >
        <input
          type="number"
          step="0.01"
          value={uahAmount}
          onChange={(e) => handleUahChange(e.target.value)}
          placeholder="0.00 UAH"
          disabled={isLoading}
          className={cn(
            "block w-full rounded-md border border-gray-300 px-3 py-2",
            "focus:border-blue-500 focus:outline-none focus:ring-blue-500",
            "disabled:bg-gray-100",
            uahError && "border-red-500"
          )}
        />
      </FormField>
    </div>
  );
}
```

## 🔄 Главный компонент формы

### Шаг 7: ExchangeForm с полной типизацией

```typescript
// apps/web/src/components/ExchangeForm/ExchangeForm.tsx
import { useState, useCallback } from 'react';
import type { ExchangeFormProps, ExchangeFormData } from './types';
import { convertFormDataToOrderRequest } from './types';
import { useFormValidation } from './useFormValidation';
import { trpc } from '@/lib/trpc-provider';
import { CurrencySelect } from './CurrencySelect';
import { AmountFields } from './AmountFields';
import { FormField } from './FormField';
import { Button } from '@repo/ui';

export function ExchangeForm({
  initialCurrency = 'USDT-TRC20',
  onSuccess,
  onError,
  className
}: ExchangeFormProps) {

  // Состояние формы
  const [formData, setFormData] = useState<ExchangeFormData>({
    email: '',
    currency: initialCurrency,
    cryptoAmount: '',
    uahAmount: '',
    cardNumber: '',
    cardHolderName: '',
    acceptTerms: false,
  });

  // Валидация
  const { errors, isValid } = useFormValidation(formData);

  // tRPC мутация для создания заявки
  const createOrderMutation = trpc.exchange.createOrder.useMutation({
    onSuccess: (order) => {
      // order автоматически имеет тип Order
      console.log('Заявка создана:', order.id);
      onSuccess?.(order);
    },
    onError: (error) => {
      // error автоматически имеет тип TRPCClientError
      console.error('Ошибка создания заявки:', error.message);
      onError?.(error);
    },
  });

  // Обновление полей формы
  const updateField = useCallback(<K extends keyof ExchangeFormData>(
    field: K,
    value: ExchangeFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      console.log('Форма содержит ошибки:', errors);
      return;
    }

    try {
      // Конвертируем UI типы в API типы
      const orderRequest = convertFormDataToOrderRequest(formData);

      // Отправляем типизированный запрос
      await createOrderMutation.mutateAsync(orderRequest);
    } catch (error) {
      // Ошибка уже обработана в onError
      console.error('Ошибка отправки формы:', error);
    }
  };

  return (
    <div className={cn("max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg", className)}>
      <h2 className="text-2xl font-bold text-center mb-6">
        Создание заявки на обмен
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Валюта */}
        <CurrencySelect
          value={formData.currency}
          onChange={(currency) => updateField('currency', currency)}
          error={errors.currency}
          disabled={createOrderMutation.isPending}
        />

        {/* Суммы */}
        <AmountFields
          currency={formData.currency}
          cryptoAmount={formData.cryptoAmount}
          uahAmount={formData.uahAmount}
          onCryptoAmountChange={(amount) => updateField('cryptoAmount', amount)}
          onUahAmountChange={(amount) => updateField('uahAmount', amount)}
          cryptoError={errors.cryptoAmount}
          uahError={errors.uahAmount}
        />

        {/* Email */}
        <FormField label="Email" error={errors.email} required>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="your@email.com"
            disabled={createOrderMutation.isPending}
            className={cn(
              "block w-full rounded-md border border-gray-300 px-3 py-2",
              "focus:border-blue-500 focus:outline-none focus:ring-blue-500",
              "disabled:bg-gray-100",
              errors.email && "border-red-500"
            )}
          />
        </FormField>

        {/* Данные карты */}
        <FormField label="Номер карты" error={errors.cardNumber} required>
          <input
            type="text"
            value={formData.cardNumber}
            onChange={(e) => updateField('cardNumber', e.target.value)}
            placeholder="1234 5678 9012 3456"
            disabled={createOrderMutation.isPending}
            className={cn(
              "block w-full rounded-md border border-gray-300 px-3 py-2",
              "focus:border-blue-500 focus:outline-none focus:ring-blue-500",
              "disabled:bg-gray-100",
              errors.cardNumber && "border-red-500"
            )}
          />
        </FormField>

        <FormField label="Имя владельца карты" error={errors.cardHolderName} required>
          <input
            type="text"
            value={formData.cardHolderName}
            onChange={(e) => updateField('cardHolderName', e.target.value)}
            placeholder="IVAN PETROV"
            disabled={createOrderMutation.isPending}
            className={cn(
              "block w-full rounded-md border border-gray-300 px-3 py-2",
              "focus:border-blue-500 focus:outline-none focus:ring-blue-500",
              "disabled:bg-gray-100",
              errors.cardHolderName && "border-red-500"
            )}
          />
        </FormField>

        {/* Согласие с условиями */}
        <FormField label="" error={errors.acceptTerms}>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => updateField('acceptTerms', e.target.checked)}
              disabled={createOrderMutation.isPending}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Я согласен с{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                условиями использования
              </a>
            </span>
          </label>
        </FormField>

        {/* Кнопка отправки */}
        <Button
          type="submit"
          disabled={!isValid || createOrderMutation.isPending}
          loading={createOrderMutation.isPending}
          className="w-full"
        >
          {createOrderMutation.isPending ? 'Создание заявки...' : 'Создать заявку'}
        </Button>

        {/* Ошибки мутации */}
        {createOrderMutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              {createOrderMutation.error.message}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
```

## 🔗 Интеграция в приложение

### Шаг 8: Использование компонента

```typescript
// apps/web/src/app/exchange/page.tsx
import { ExchangeForm } from '@/components/ExchangeForm/ExchangeForm';
import { useRouter } from 'next/navigation';
import type { Order } from '@repo/exchange-core';
import type { TRPCClientError } from '@trpc/client';

export default function ExchangePage() {
  const router = useRouter();

  const handleSuccess = (order: Order) => {
    // order автоматически типизирован как Order
    console.log('Заявка успешно создана:', order.id);

    // Перенаправляем на страницу заявки
    router.push(`/order/${order.id}`);
  };

  const handleError = (error: TRPCClientError) => {
    // error автоматически типизирован как TRPCClientError
    console.error('Ошибка создания заявки:', error.message);

    // Можно показать toast уведомление
    // toast.error(error.message);
  };

  return (
    <main className="container mx-auto py-8">
      <ExchangeForm
        initialCurrency="USDT-TRC20"
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </main>
  );
}
```

## 🧪 Тестирование типизированного компонента

### Шаг 9: Unit тесты с типизацией

```typescript
// apps/web/src/components/ExchangeForm/__tests__/ExchangeForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExchangeForm } from '../ExchangeForm';
import { TRPCProvider } from '@/lib/trpc-provider';
import type { Order } from '@repo/exchange-core';

// Мок tRPC
jest.mock('@/lib/trpc-provider', () => ({
  trpc: {
    exchange: {
      getRates: {
        useQuery: () => ({
          data: [
            { currency: 'USDT-TRC20', uahRate: 36.5, commission: 2 }
          ],
          isLoading: false,
          error: null
        })
      },
      createOrder: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
          error: null
        })
      }
    }
  }
}));

describe('ExchangeForm', () => {
  const mockOnSuccess = jest.fn<void, [Order]>();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен отображать все поля формы', () => {
    render(
      <TRPCProvider>
        <ExchangeForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </TRPCProvider>
    );

    expect(screen.getByLabelText(/валюта для обмена/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/сумма USDT-TRC20/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/сумма в UAH/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/номер карты/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/имя владельца карты/i)).toBeInTheDocument();
  });

  it('должен валидировать обязательные поля', async () => {
    render(
      <TRPCProvider>
        <ExchangeForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </TRPCProvider>
    );

    const submitButton = screen.getByRole('button', { name: /создать заявку/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email обязателен/i)).toBeInTheDocument();
    });
  });

  it('должен автоматически рассчитывать UAH сумму', async () => {
    render(
      <TRPCProvider>
        <ExchangeForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </TRPCProvider>
    );

    const cryptoInput = screen.getByLabelText(/сумма USDT-TRC20/i);
    fireEvent.change(cryptoInput, { target: { value: '100' } });

    await waitFor(() => {
      const uahInput = screen.getByLabelText(/сумма в UAH/i) as HTMLInputElement;
      // 100 USDT * 36.5 UAH * 1.02 (комиссия) = 3723.00 UAH
      expect(uahInput.value).toBe('3723.00');
    });
  });
});
```

## 💻 Практические задания

### Задание 1: Добавить поддержку банковского перевода

Расширьте форму для поддержки банковского перевода вместо карты:

```typescript
// Добавьте новый тип данных получателя
interface RecipientBankData {
  type: 'bank';
  bankAccount: string;
  bankCode: string;
  recipientName: string;
}

// Обновите типы формы
interface ExchangeFormData {
  // ... существующие поля
  recipientType: 'card' | 'bank';
  bankAccount?: string;
  bankCode?: string;
  recipientName?: string;
}
```

<details>
<summary>Показать решение</summary>

```typescript
// Обновленные типы
interface ExchangeFormData {
  email: string;
  currency: CryptoCurrency;
  cryptoAmount: string;
  uahAmount: string;
  recipientType: 'card' | 'bank';
  // Карта
  cardNumber: string;
  cardHolderName: string;
  // Банк
  bankAccount: string;
  bankCode: string;
  recipientName: string;
  acceptTerms: boolean;
}

// Компонент выбора типа получателя
function RecipientTypeSelect({ value, onChange, error }: {
  value: 'card' | 'bank';
  onChange: (type: 'card' | 'bank') => void;
  error?: string;
}) {
  return (
    <FormField label="Способ получения" error={error} required>
      <div className="flex space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            value="card"
            checked={value === 'card'}
            onChange={(e) => onChange(e.target.value as 'card')}
            className="mr-2"
          />
          Банковская карта
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="bank"
            checked={value === 'bank'}
            onChange={(e) => onChange(e.target.value as 'bank')}
            className="mr-2"
          />
          Банковский счет
        </label>
      </div>
    </FormField>
  );
}

// Условный рендеринг полей получателя в ExchangeForm
{formData.recipientType === 'card' ? (
  <>
    <FormField label="Номер карты" error={errors.cardNumber} required>
      {/* Поле номера карты */}
    </FormField>
    <FormField label="Имя владельца карты" error={errors.cardHolderName} required>
      {/* Поле имени владельца */}
    </FormField>
  </>
) : (
  <>
    <FormField label="Номер банковского счета" error={errors.bankAccount} required>
      <input
        type="text"
        value={formData.bankAccount}
        onChange={(e) => updateField('bankAccount', e.target.value)}
        placeholder="UA123456789012345678901234567"
      />
    </FormField>
    <FormField label="Код банка" error={errors.bankCode} required>
      <input
        type="text"
        value={formData.bankCode}
        onChange={(e) => updateField('bankCode', e.target.value)}
        placeholder="305299"
      />
    </FormField>
  </>
)}
```

</details>

### Задание 2: Добавить debounce для автоматического расчета

Оптимизируйте автоматический расчет сумм с помощью debounce:

<details>
<summary>Показать решение</summary>

```typescript
// apps/web/src/components/ExchangeForm/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Использование в AmountFields
export function AmountFields({} /* ... */ : AmountFieldsProps) {
  const [cryptoInput, setCryptoInput] = useState(cryptoAmount);
  const [uahInput, setUahInput] = useState(uahAmount);

  const debouncedCrypto = useDebounce(cryptoInput, 500);
  const debouncedUah = useDebounce(uahInput, 500);

  // Эффект для автоматического расчета
  useEffect(() => {
    const cryptoNum = parseFloat(debouncedCrypto);
    if (!isNaN(cryptoNum) && cryptoNum > 0) {
      const calculatedUah = calculateUahAmount(cryptoNum);
      setUahInput(calculatedUah.toFixed(2));
      onUahAmountChange(calculatedUah.toFixed(2));
    }
  }, [debouncedCrypto, calculateUahAmount]);

  // ... остальная логика
}
```

</details>

## ✅ Проверка знаний

### Вопрос 1

Почему мы создаем отдельные типы `ExchangeFormData` и `CreateOrderRequest`?

**A)** Для уменьшения размера bundle  
**B)** UI и API требуют разные форматы данных  
**C)** Для лучшей производительности  
**D)** Это обязательное требование tRPC

<details>
<summary>Показать ответ</summary>

**Правильный ответ: B**

UI работает со строками (input values), а API - с числами и типизированными объектами. Функция `convertFormDataToOrderRequest` преобразует UI типы в API типы.

</details>

### Вопрос 2

Что обеспечивает type safety в `createOrderMutation.mutateAsync(orderRequest)`?

**A)** Runtime валидация  
**B)** TypeScript проверяет соответствие типов на этапе компиляции  
**C)** tRPC server validation  
**D)** React Query cache

<details>
<summary>Показать ответ</summary>

**Правильный ответ: B**

TypeScript на этапе компиляции проверяет, что `orderRequest` соответствует типу, который ожидает серверная процедура `createOrder`.

</details>

## 📚 Дополнительные материалы

### React Hook Form интеграция

```typescript
// Для более сложных форм можно интегрировать react-hook-form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  email: z.string().email(),
  cryptoAmount: z.number().min(0.01),
  // ... другие поля
});

export function ExchangeForm() {
  const form = useForm<CreateOrderRequest>({
    resolver: zodResolver(formSchema),
  });

  // Типизированная отправка
  const onSubmit = (data: CreateOrderRequest) => {
    createOrderMutation.mutate(data);
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>/* ... */</form>;
}
```

## 📋 Резюме урока

1. **Создали полностью типизированный компонент формы** с использованием типов из `@repo/exchange-core`
2. **Разделили UI и API типы** для гибкости и правильной архитектуры
3. **Использовали tRPC для type-safe API взаимодействия** с автоматической типизацией
4. **Реализовали валидацию с TypeScript поддержкой** и типизированными ошибками
5. **Добавили автоматический расчет сумм** с использованием актуальных курсов
6. **Написали тесты с поддержкой типизации** для проверки функциональности

Теперь у нас есть компонент, который гарантирует type safety от UI до API и обратно!

---

[← Урок 3.3](./lesson-3.3-type-safety-frontend-backend.md) | [Глава 4: tRPC API →](../chapter-04-trpc-api/README.md)
