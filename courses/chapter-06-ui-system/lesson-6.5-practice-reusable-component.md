# Урок 6.5: Практика - создание переиспользуемого компонента

> **🎯 Цель урока**: Применить все изученные принципы для создания полноценного переиспользуемого компонента от планирования до документации

## 📖 Введение

Представьте что вы шеф-повар, создающий фирменное блюдо. Можно просто смешать ингредиенты и подать - это будет работать. Но **настоящий мастер** продумывает каждую деталь: как нарезать, в какой последовательности готовить, как подать, чтобы блюдо получилось идеальным каждый раз.

Создание переиспользуемого компонента - это такой же процесс мастерства. Нужно продумать API, состояния, адаптивность, доступность, производительность и документацию.

В этом уроке мы создадим компонент `CryptoExchangeWidget` - виджет обмена криптовалют, который будет использоваться в разных частях нашего приложения.

## 🎯 Техническое задание

### Компонент: CryptoExchangeWidget

**Назначение**: Компактный виджет для быстрого обмена криптовалют

**Функциональность**:

- Выбор криптовалюты из доступных
- Ввод количества с валидацией
- Отображение курса и результата в реальном времени
- Создание заявки на обмен
- Поддержка loading и error состояний
- Адаптивный дизайн
- Интеграция с формой email

**Где используется**:

- Главная страница (hero секция)
- Страница /exchange (основная форма)
- Мобильное приложение (упрощенная версия)

## 📋 Этап 1: Планирование и API дизайн

### 1. Определение типов:

```typescript
// 📁 packages/ui/src/components/exchange/types.ts
export interface CryptoCurrency {
  code: string; // 'BTC', 'ETH', 'USDT'
  name: string; // 'Bitcoin', 'Ethereum', 'Tether'
  icon: string; // URL иконки
  rate: number; // Текущий курс в UAH
  minAmount: number; // Минимальная сумма для обмена
  maxAmount: number; // Максимальная сумма для обмена
  available: boolean; // Доступность для обмена
  network?: string; // 'Bitcoin', 'Ethereum', 'Tron' для USDT
}

export interface ExchangeData {
  cryptoCurrency: string;
  cryptoAmount: number;
  uahAmount: number;
  rate: number;
}

export interface CryptoExchangeWidgetProps {
  // === Обязательные пропы ===
  /** Список доступных криптовалют */
  currencies: CryptoCurrency[];

  /** Обработчик создания заявки */
  onCreateOrder: (data: ExchangeData & { email: string }) => Promise<void>;

  // === Опциональные пропы ===
  /** Предвыбранная валюта */
  defaultCurrency?: string;

  /** Начальное количество */
  defaultAmount?: number;

  /** Размер виджета */
  size?: 'compact' | 'default' | 'expanded';

  /** Вариант отображения */
  variant?: 'minimal' | 'default' | 'detailed';

  /** Показывать ли поле email */
  showEmailField?: boolean;

  /** Состояние загрузки */
  isLoading?: boolean;

  /** Ошибка */
  error?: string;

  /** Дополнительные CSS классы */
  className?: string;

  /** Обработчик изменения данных */
  onChange?: (data: Partial<ExchangeData>) => void;

  /** Обработчик ошибок */
  onError?: (error: string) => void;
}
```

### 2. Планирование состояний:

```typescript
// 📁 packages/ui/src/components/exchange/CryptoExchangeWidget.tsx
interface WidgetState {
  // Пользовательский ввод
  selectedCurrency: string;
  cryptoAmount: string; // Строка для контроля ввода
  email: string;

  // Вычисляемые значения
  uahAmount: number;
  currentRate: number;

  // UI состояния
  isSubmitting: boolean;
  validationErrors: Record<string, string>;

  // UX улучшения
  isDirty: boolean; // Были ли изменения
  lastValidAmount: number; // Последнее валидное значение
}
```

## 🏗️ Этап 2: Базовая структура компонента

```typescript
// 📁 packages/ui/src/components/exchange/CryptoExchangeWidget.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CryptoExchangeWidgetProps, CryptoCurrency, ExchangeData } from './types';

export function CryptoExchangeWidget({
  currencies,
  onCreateOrder,
  defaultCurrency,
  defaultAmount = 0,
  size = 'default',
  variant = 'default',
  showEmailField = true,
  isLoading: externalLoading = false,
  error: externalError,
  className,
  onChange,
  onError,
}: CryptoExchangeWidgetProps) {

  // ✅ Локальное состояние
  const [state, setState] = useState<WidgetState>({
    selectedCurrency: defaultCurrency || currencies[0]?.code || '',
    cryptoAmount: defaultAmount.toString(),
    email: '',
    uahAmount: 0,
    currentRate: 0,
    isSubmitting: false,
    validationErrors: {},
    isDirty: false,
    lastValidAmount: defaultAmount,
  });

  // ✅ Мемоизированные значения
  const selectedCurrencyData = useMemo(
    () => currencies.find(c => c.code === state.selectedCurrency),
    [currencies, state.selectedCurrency]
  );

  const isValidAmount = useMemo(() => {
    const amount = parseFloat(state.cryptoAmount);
    if (!selectedCurrencyData || isNaN(amount)) return false;

    return amount >= selectedCurrencyData.minAmount &&
           amount <= selectedCurrencyData.maxAmount;
  }, [state.cryptoAmount, selectedCurrencyData]);

  // ✅ Вычисление курса и суммы
  useEffect(() => {
    if (!selectedCurrencyData || !isValidAmount) {
      setState(prev => ({ ...prev, uahAmount: 0, currentRate: 0 }));
      return;
    }

    const amount = parseFloat(state.cryptoAmount);
    const rate = selectedCurrencyData.rate;
    const uahAmount = amount * rate;

    setState(prev => ({
      ...prev,
      uahAmount,
      currentRate: rate,
      lastValidAmount: amount,
    }));

    // Уведомляем родительский компонент
    onChange?.({
      cryptoCurrency: state.selectedCurrency,
      cryptoAmount: amount,
      uahAmount,
      rate,
    });
  }, [state.selectedCurrency, state.cryptoAmount, selectedCurrencyData, isValidAmount, onChange]);

  // ✅ Обработчики событий
  const handleCurrencySelect = useCallback((currencyCode: string) => {
    setState(prev => ({
      ...prev,
      selectedCurrency: currencyCode,
      isDirty: true,
      validationErrors: {},
    }));
  }, []);

  const handleAmountChange = useCallback((value: string) => {
    // Валидация ввода только цифр и точки
    if (!/^\d*\.?\d*$/.test(value) && value !== '') return;

    setState(prev => ({
      ...prev,
      cryptoAmount: value,
      isDirty: true,
      validationErrors: { ...prev.validationErrors, amount: '' },
    }));
  }, []);

  const handleEmailChange = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      email: value,
      isDirty: true,
      validationErrors: { ...prev.validationErrors, email: '' },
    }));
  }, []);

  // ✅ Валидация
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedCurrencyData) {
      errors.currency = 'Выберите валюту';
    }

    if (!state.cryptoAmount || parseFloat(state.cryptoAmount) <= 0) {
      errors.amount = 'Введите количество';
    } else if (!isValidAmount && selectedCurrencyData) {
      if (parseFloat(state.cryptoAmount) < selectedCurrencyData.minAmount) {
        errors.amount = `Минимум ${selectedCurrencyData.minAmount} ${selectedCurrencyData.code}`;
      } else if (parseFloat(state.cryptoAmount) > selectedCurrencyData.maxAmount) {
        errors.amount = `Максимум ${selectedCurrencyData.maxAmount} ${selectedCurrencyData.code}`;
      }
    }

    if (showEmailField && (!state.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email))) {
      errors.email = 'Введите корректный email';
    }

    setState(prev => ({ ...prev, validationErrors: errors }));

    if (Object.keys(errors).length > 0) {
      onError?.(Object.values(errors)[0]);
    }

    return Object.keys(errors).length === 0;
  }, [state, selectedCurrencyData, isValidAmount, showEmailField, onError]);

  // ✅ Отправка формы
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      await onCreateOrder({
        cryptoCurrency: state.selectedCurrency,
        cryptoAmount: parseFloat(state.cryptoAmount),
        uahAmount: state.uahAmount,
        rate: state.currentRate,
        email: state.email,
      });

      // Сброс формы после успешной отправки
      setState(prev => ({
        ...prev,
        cryptoAmount: '',
        email: '',
        isDirty: false,
        validationErrors: {},
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка';
      onError?.(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [validateForm, onCreateOrder, state, onError]);

  // ✅ Размеры компонента
  const sizeClasses = {
    compact: 'max-w-sm',
    default: 'max-w-md',
    expanded: 'max-w-lg',
  };

  const isLoading = externalLoading || state.isSubmitting;
  const displayError = externalError || Object.values(state.validationErrors)[0];

  return (
    <Card className={cn(sizeClasses[size], 'w-full', className)}>
      {variant !== 'minimal' && (
        <CardHeader className={cn(
          size === 'compact' ? 'pb-3' : 'pb-4'
        )}>
          <CardTitle className={cn(
            size === 'compact' ? 'text-lg' : 'text-xl',
            'flex items-center gap-2'
          )}>
            <TrendingUp className="h-5 w-5 text-primary" />
            Обмен криптовалют
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className={cn(
        variant === 'minimal' ? 'p-4' : size === 'compact' ? 'p-4' : 'p-6',
        'space-y-4'
      )}>

        {/* Выбор валюты */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Валюта для обмена
          </Label>
          <div className={cn(
            "grid gap-2",
            size === 'compact' ? 'grid-cols-2' : 'grid-cols-3'
          )}>
            {currencies.map((currency) => (
              <CurrencyButton
                key={currency.code}
                currency={currency}
                isSelected={state.selectedCurrency === currency.code}
                onSelect={handleCurrencySelect}
                size={size}
                disabled={!currency.available}
              />
            ))}
          </div>
          {state.validationErrors.currency && (
            <p className="text-xs text-destructive">{state.validationErrors.currency}</p>
          )}
        </div>

        {/* Количество */}
        <div className="space-y-2">
          <Label htmlFor="crypto-amount" className="text-sm font-medium">
            Количество {selectedCurrencyData?.code}
          </Label>
          <div className="relative">
            <Input
              id="crypto-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.001"
              value={state.cryptoAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={cn(
                "pr-16",
                state.validationErrors.amount && "border-destructive"
              )}
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-sm font-medium text-muted-foreground">
                {selectedCurrencyData?.code}
              </span>
            </div>
          </div>
          {state.validationErrors.amount ? (
            <p className="text-xs text-destructive">{state.validationErrors.amount}</p>
          ) : selectedCurrencyData && (
            <p className="text-xs text-muted-foreground">
              Лимиты: {selectedCurrencyData.minAmount} - {selectedCurrencyData.maxAmount} {selectedCurrencyData.code}
            </p>
          )}
        </div>

        {/* Результат */}
        {isValidAmount && (
          <div className="rounded-lg bg-muted p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {state.uahAmount.toLocaleString('ru-RU', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
                <span className="text-base ml-2 text-muted-foreground">UAH</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Курс: 1 {selectedCurrencyData?.code} = {state.currentRate.toLocaleString()} UAH
              </p>
            </div>
          </div>
        )}

        {/* Email поле */}
        {showEmailField && (
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email для уведомлений
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={state.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={cn(
                state.validationErrors.email && "border-destructive"
              )}
              disabled={isLoading}
            />
            {state.validationErrors.email && (
              <p className="text-xs text-destructive">{state.validationErrors.email}</p>
            )}
          </div>
        )}

        {/* Ошибка */}
        {displayError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        {/* Кнопка отправки */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !isValidAmount || (!showEmailField || state.email)}
          className="w-full"
          size={size === 'compact' ? 'default' : 'lg'}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Создание заявки...
            </>
          ) : (
            <>
              Создать заявку
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Дополнительная информация */}
        {variant === 'detailed' && (
          <div className="pt-3 border-t space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Комиссия:</span>
              <span className="text-green-600 font-medium">0%</span>
            </div>
            <div className="flex justify-between">
              <span>Время обработки:</span>
              <span>5-30 минут</span>
            </div>
            <div className="flex justify-between">
              <span>Курс действует:</span>
              <span>10 минут</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## 🎨 Этап 3: Вспомогательные компоненты

### 1. Кнопка выбора валюты:

```typescript
// 📁 packages/ui/src/components/exchange/CurrencyButton.tsx
interface CurrencyButtonProps {
  currency: CryptoCurrency;
  isSelected: boolean;
  onSelect: (code: string) => void;
  size?: 'compact' | 'default' | 'expanded';
  disabled?: boolean;
}

function CurrencyButton({
  currency,
  isSelected,
  onSelect,
  size = 'default',
  disabled = false,
}: CurrencyButtonProps) {
  return (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      size="sm"
      className={cn(
        "flex flex-col items-center h-auto transition-all duration-200",
        size === 'compact' ? 'p-2' : 'p-3',
        isSelected && "ring-2 ring-primary ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "hover:scale-105"
      )}
      onClick={() => !disabled && onSelect(currency.code)}
      disabled={disabled}
    >
      <div className="flex items-center space-x-2">
        <img
          src={currency.icon}
          alt={currency.code}
          className={cn(
            "rounded-full",
            size === 'compact' ? 'w-4 h-4' : 'w-6 h-6'
          )}
        />
        <span className={cn(
          "font-medium",
          size === 'compact' ? 'text-xs' : 'text-sm'
        )}>
          {currency.code}
        </span>
      </div>

      {!currency.available && (
        <Badge variant="secondary" className="text-xs mt-1">
          Недоступно
        </Badge>
      )}

      {size !== 'compact' && (
        <span className="text-xs text-muted-foreground mt-1 text-center">
          {currency.name}
        </span>
      )}
    </Button>
  );
}
```

## 📚 Этап 4: Документация и Storybook

### 1. Storybook истории:

```typescript
// 📁 packages/ui/src/stories/CryptoExchangeWidget.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { CryptoExchangeWidget } from '../components/exchange/CryptoExchangeWidget';
import { action } from '@storybook/addon-actions';

const mockCurrencies = [
  {
    code: 'BTC',
    name: 'Bitcoin',
    icon: '/icons/btc.svg',
    rate: 1240000,
    minAmount: 0.0001,
    maxAmount: 10,
    available: true,
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    icon: '/icons/eth.svg',
    rate: 85000,
    minAmount: 0.001,
    maxAmount: 100,
    available: true,
  },
  {
    code: 'USDT',
    name: 'Tether',
    icon: '/icons/usdt.svg',
    rate: 37,
    minAmount: 10,
    maxAmount: 50000,
    available: false,
    network: 'Tron',
  },
];

const meta: Meta<typeof CryptoExchangeWidget> = {
  title: 'Exchange/CryptoExchangeWidget',
  component: CryptoExchangeWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Виджет для обмена криптовалют. Поддерживает различные размеры и варианты отображения.',
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['compact', 'default', 'expanded'],
    },
    variant: {
      control: { type: 'select' },
      options: ['minimal', 'default', 'detailed'],
    },
  },
  args: {
    currencies: mockCurrencies,
    onCreateOrder: action('onCreateOrder'),
    onChange: action('onChange'),
    onError: action('onError'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ✅ Основные варианты
export const Default: Story = {};

export const Compact: Story = {
  args: {
    size: 'compact',
  },
};

export const Minimal: Story = {
  args: {
    variant: 'minimal',
    showEmailField: false,
  },
};

export const Detailed: Story = {
  args: {
    size: 'expanded',
    variant: 'detailed',
  },
};

// ✅ Состояния
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    error: 'Не удалось загрузить курсы валют',
  },
};

export const WithDefaults: Story = {
  args: {
    defaultCurrency: 'ETH',
    defaultAmount: 0.1,
  },
};

// ✅ Мобильная версия
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    size: 'compact',
    variant: 'minimal',
  },
};
```

### 2. README документация:

````markdown
# CryptoExchangeWidget

Переиспользуемый виджет для обмена криптовалют.

## Использование

```tsx
import { CryptoExchangeWidget } from '@repo/ui';

function ExchangePage() {
  const handleCreateOrder = async data => {
    console.log('Создание заявки:', data);
    // API вызов
  };

  return (
    <CryptoExchangeWidget
      currencies={availableCurrencies}
      onCreateOrder={handleCreateOrder}
      size="default"
      variant="detailed"
    />
  );
}
```
````

## API

### Props

| Prop              | Type                                   | Default     | Описание                                     |
| ----------------- | -------------------------------------- | ----------- | -------------------------------------------- |
| `currencies`      | `CryptoCurrency[]`                     | -           | **Обязательный.** Список доступных валют     |
| `onCreateOrder`   | `(data) => Promise<void>`              | -           | **Обязательный.** Обработчик создания заявки |
| `size`            | `'compact' \| 'default' \| 'expanded'` | `'default'` | Размер виджета                               |
| `variant`         | `'minimal' \| 'default' \| 'detailed'` | `'default'` | Вариант отображения                          |
| `showEmailField`  | `boolean`                              | `true`      | Показывать ли поле email                     |
| `defaultCurrency` | `string`                               | -           | Предвыбранная валюта                         |
| `defaultAmount`   | `number`                               | `0`         | Начальное количество                         |
| `isLoading`       | `boolean`                              | `false`     | Состояние загрузки                           |
| `error`           | `string`                               | -           | Текст ошибки                                 |
| `onChange`        | `(data) => void`                       | -           | Обработчик изменения данных                  |
| `onError`         | `(error) => void`                      | -           | Обработчик ошибок                            |

### Types

```typescript
interface CryptoCurrency {
  code: string;
  name: string;
  icon: string;
  rate: number;
  minAmount: number;
  maxAmount: number;
  available: boolean;
  network?: string;
}

interface ExchangeData {
  cryptoCurrency: string;
  cryptoAmount: number;
  uahAmount: number;
  rate: number;
}
```

## Варианты использования

### Главная страница (hero)

```tsx
<CryptoExchangeWidget
  currencies={currencies}
  onCreateOrder={handleCreateOrder}
  size="expanded"
  variant="detailed"
/>
```

### Боковая панель

```tsx
<CryptoExchangeWidget
  currencies={currencies}
  onCreateOrder={handleCreateOrder}
  size="compact"
  variant="minimal"
  showEmailField={false}
/>
```

### Мобильная версия

```tsx
<CryptoExchangeWidget
  currencies={currencies}
  onCreateOrder={handleCreateOrder}
  size="compact"
  variant="default"
/>
```

## Accessibility

- Поддержка клавиатурной навигации
- Семантические HTML элементы
- ARIA атрибуты для screen readers
- Достаточный цветовой контраст

## Performance

- Мемоизация вычислений курса
- Оптимизированные ре-рендеры
- Lazy loading изображений валют

````

## ♿ Этап 5: Accessibility и инклюзивность

### 1. WCAG 2.1 соответствие:

```typescript
// 📁 packages/ui/src/components/exchange/CryptoExchangeWidget.accessible.tsx

export function CryptoExchangeWidget(props: CryptoExchangeWidgetProps) {
  // ✅ Управление фокусом
  const firstInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // ✅ Объявления для screen readers
  const [announcements, setAnnouncements] = useState<string>('');

  // ✅ Клавиатурная навигация
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Быстрое переключение валют стрелками
    if (event.target === firstInputRef.current) {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        const currentIndex = currencies.findIndex(c => c.code === state.selectedCurrency);
        const nextIndex = event.key === 'ArrowUp'
          ? Math.max(0, currentIndex - 1)
          : Math.min(currencies.length - 1, currentIndex + 1);

        handleCurrencySelect(currencies[nextIndex].code);
        setAnnouncements(`Выбрана валюта ${currencies[nextIndex].name}`);
      }
    }

    // Enter для отправки формы
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      handleSubmit();
    }
  }, [currencies, state.selectedCurrency, handleCurrencySelect, handleSubmit]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ✅ Объявления изменений для screen readers
  useEffect(() => {
    if (isValidAmount && state.uahAmount > 0) {
      setAnnouncements(
        `Результат обмена: ${state.uahAmount.toLocaleString()} гривен по курсу ${state.currentRate.toLocaleString()}`
      );
    }
  }, [isValidAmount, state.uahAmount, state.currentRate]);

  return (
    <Card
      className={cn(sizeClasses[size], 'w-full', className)}
      role="form"
      aria-labelledby="exchange-widget-title"
      aria-describedby="exchange-widget-description"
    >
      {/* ✅ Скрытые объявления для screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements}
      </div>

      <CardHeader>
        <CardTitle
          id="exchange-widget-title"
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
          Обмен криптовалют
        </CardTitle>
        <p
          id="exchange-widget-description"
          className="text-sm text-muted-foreground sr-only"
        >
          Форма для обмена криптовалют на украинские гривны.
          Используйте стрелки вверх и вниз для выбора валюты,
          Ctrl+Enter для отправки формы.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ✅ Группа выбора валюты с правильными ARIA атрибутами */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Валюта для обмена
          </legend>
          <div
            className="grid gap-2 grid-cols-3"
            role="radiogroup"
            aria-labelledby="currency-selection-label"
          >
            {currencies.map((currency, index) => (
              <button
                key={currency.code}
                type="button"
                role="radio"
                aria-checked={state.selectedCurrency === currency.code}
                aria-describedby={`currency-${currency.code}-description`}
                className={cn(
                  "flex flex-col items-center p-3 rounded-lg border transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  state.selectedCurrency === currency.code
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                  !currency.available && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => currency.available && handleCurrencySelect(currency.code)}
                disabled={!currency.available}
                tabIndex={state.selectedCurrency === currency.code ? 0 : -1}
              >
                <img
                  src={currency.icon}
                  alt=""
                  className="w-6 h-6 rounded-full"
                  aria-hidden="true"
                />
                <span className="font-medium text-sm">{currency.code}</span>
                <span className="text-xs text-muted-foreground">{currency.name}</span>

                {/* Скрытое описание для screen readers */}
                <span
                  id={`currency-${currency.code}-description`}
                  className="sr-only"
                >
                  {currency.name}, курс {currency.rate.toLocaleString()} гривен,
                  {currency.available ? 'доступна' : 'недоступна'}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* ✅ Поле количества с улучшенной accessibility */}
        <div className="space-y-2">
          <Label
            htmlFor="crypto-amount"
            className="text-sm font-medium"
          >
            Количество {selectedCurrencyData?.code}
            <span className="text-destructive ml-1" aria-label="обязательное поле">*</span>
          </Label>
          <div className="relative">
            <Input
              ref={firstInputRef}
              id="crypto-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.001"
              value={state.cryptoAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={cn(
                "pr-16",
                state.validationErrors.amount && "border-destructive"
              )}
              disabled={isLoading}
              aria-describedby="crypto-amount-description crypto-amount-error"
              aria-invalid={!!state.validationErrors.amount}
              autoComplete="off"
            />
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            >
              <span className="text-sm font-medium text-muted-foreground">
                {selectedCurrencyData?.code}
              </span>
            </div>
          </div>

          {/* Описание поля */}
          <div id="crypto-amount-description" className="text-xs text-muted-foreground">
            {selectedCurrencyData && (
              <>Лимиты: {selectedCurrencyData.minAmount} - {selectedCurrencyData.maxAmount} {selectedCurrencyData.code}</>
            )}
          </div>

          {/* Ошибка валидации */}
          {state.validationErrors.amount && (
            <div
              id="crypto-amount-error"
              className="text-xs text-destructive"
              role="alert"
              aria-live="polite"
            >
              {state.validationErrors.amount}
            </div>
          )}
        </div>

        {/* ✅ Результат с объявлением для screen readers */}
        {isValidAmount && (
          <div
            className="rounded-lg bg-muted p-4"
            role="status"
            aria-live="polite"
            aria-label={`Результат обмена: ${state.uahAmount.toLocaleString()} гривен`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold">
                {state.uahAmount.toLocaleString('ru-RU', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
                <span className="text-base ml-2 text-muted-foreground">UAH</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Курс: 1 {selectedCurrencyData?.code} = {state.currentRate.toLocaleString()} UAH
              </p>
            </div>
          </div>
        )}

        {/* ✅ Кнопка отправки с правильными состояниями */}
        <Button
          ref={submitButtonRef}
          onClick={handleSubmit}
          disabled={isLoading || !isValidAmount || (showEmailField && !state.email)}
          className="w-full"
          size={size === 'compact' ? 'default' : 'lg'}
          aria-describedby="submit-button-description"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Создание заявки...
            </>
          ) : (
            <>
              Создать заявку
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>

        <div id="submit-button-description" className="sr-only">
          {isLoading
            ? "Заявка создается, пожалуйста подождите"
            : !isValidAmount
              ? "Введите корректное количество для создания заявки"
              : showEmailField && !state.email
                ? "Введите email для создания заявки"
                : "Нажмите для создания заявки на обмен"
          }
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2. Тестирование accessibility:

```typescript
// 📁 packages/ui/src/components/exchange/__tests__/accessibility.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { CryptoExchangeWidget } from '../CryptoExchangeWidget';

expect.extend(toHaveNoViolations);

describe('CryptoExchangeWidget Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <CryptoExchangeWidget
        currencies={mockCurrencies}
        onCreateOrder={jest.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <CryptoExchangeWidget
        currencies={mockCurrencies}
        onCreateOrder={jest.fn()}
      />
    );

    // Tab навигация
    await user.tab();
    expect(screen.getByRole('radio', { name: /bitcoin/i })).toHaveFocus();

    // Стрелки для переключения валют
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: /ethereum/i })).toHaveFocus();

    // Tab к полю ввода
    await user.tab();
    expect(screen.getByLabelText(/количество/i)).toHaveFocus();
  });

  it('announces changes to screen readers', async () => {
    const user = userEvent.setup();

    render(
      <CryptoExchangeWidget
        currencies={mockCurrencies}
        onCreateOrder={jest.fn()}
      />
    );

    const amountInput = screen.getByLabelText(/количество/i);
    await user.type(amountInput, '0.1');

    // Проверяем что результат объявляется
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('provides proper error messages', async () => {
    const user = userEvent.setup();

    render(
      <CryptoExchangeWidget
        currencies={mockCurrencies}
        onCreateOrder={jest.fn()}
      />
    );

    const amountInput = screen.getByLabelText(/количество/i);
    await user.type(amountInput, '0.00001'); // Меньше минимума

    const submitButton = screen.getByRole('button', { name: /создать заявку/i });
    await user.click(submitButton);

    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute('aria-live', 'polite');
  });
});
```

## ✅ Этап 6: Тестирование компонента

### 1. Unit тесты:

```typescript
// 📁 packages/ui/src/components/exchange/__tests__/CryptoExchangeWidget.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CryptoExchangeWidget } from '../CryptoExchangeWidget';

const mockCurrencies = [
  {
    code: 'BTC',
    name: 'Bitcoin',
    icon: '/btc.svg',
    rate: 1000000,
    minAmount: 0.0001,
    maxAmount: 10,
    available: true,
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    icon: '/eth.svg',
    rate: 80000,
    minAmount: 0.001,
    maxAmount: 100,
    available: true,
  },
];

describe('CryptoExchangeWidget', () => {
  const mockOnCreateOrder = jest.fn();
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default currency', () => {
    render(
      <CryptoExchangeWidget
        currencies={mockCurrencies}
        onCreateOrder={mockOnCreateOrder}
        defaultCurrency="ETH"
      />
    );

    expect(screen.getByText('ETH')).toBeInTheDocument();
  });

  it('calculates UAH amount correctly', async () => {
    const user = userEvent.setup();

    render(
      <CryptoExchangeWidget
        currencies={mockCurrencies}
        onCreateOrder={mockOnCreateOrder}
        onChange={mockOnChange}
      />
    );

    const amountInput = screen.getByPlaceholderText('0.001');
    await user.type(amountInput, '0.001');

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        cryptoCurrency: 'BTC',
        cryptoAmount: 0.001,
        uahAmount: 1000,
        rate: 1000000,
      });
    });
  });

  it('validates minimum amount', async () => {
    const user = userEvent.setup();

    render(
      <CryptoExchangeWidget
        currencies={mockCurrencies}
        onCreateOrder={mockOnCreateOrder}
      />
    );

    const amountInput = screen.getByPlaceholderText('0.001');
    await user.type(amountInput, '0.00001');

    const submitButton = screen.getByText('Создать заявку');
    await user.click(submitButton);

    expect(screen.getByText('Минимум 0.0001 BTC')).toBeInTheDocument();
    expect(mockOnCreateOrder).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();

    render(
      <CryptoExchangeWidget
        currencies={mockCurrencies}
        onCreateOrder={mockOnCreateOrder}
      />
    );

    // Выбираем валюту
    await user.click(screen.getByText('ETH'));

    // Вводим количество
    const amountInput = screen.getByPlaceholderText('0.001');
    await user.type(amountInput, '0.1');

    // Вводим email
    const emailInput = screen.getByPlaceholderText('your@email.com');
    await user.type(emailInput, 'test@example.com');

    // Отправляем
    const submitButton = screen.getByText('Создать заявку');
    await user.click(submitButton);

    expect(mockOnCreateOrder).toHaveBeenCalledWith({
      cryptoCurrency: 'ETH',
      cryptoAmount: 0.1,
      uahAmount: 8000,
      rate: 80000,
      email: 'test@example.com',
    });
  });
});
````

## ⚡ Этап 6: Оптимизация производительности

### 1. Анализ производительности:

```typescript
// 📁 packages/ui/src/components/exchange/performance-analysis.ts

// ❌ Проблемы производительности без оптимизации:
const performanceIssues = {
  rerenders: 'Каждое изменение курса вызывает полный ререндер',
  calculations: 'Пересчет UAH суммы при каждом рендере',
  validations: 'Валидация формы при каждом изменении',
  apiCalls: 'Множественные запросы курсов валют',
};

// ✅ Решения:
const optimizations = {
  memoization: 'useMemo для вычислений, useCallback для функций',
  debouncing: 'Отложенная валидация и API вызовы',
  virtualization: 'Виртуализация списка валют (если много)',
  caching: 'Кеширование курсов валют',
};
```

### 2. Оптимизированная версия компонента:

```typescript
// 📁 packages/ui/src/components/exchange/CryptoExchangeWidget.optimized.tsx
import { useMemo, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash-es';

export function CryptoExchangeWidget(props: CryptoExchangeWidgetProps) {
  // ✅ Мемоизация тяжелых вычислений
  const calculations = useMemo(() => {
    if (!selectedCurrencyData || !isValidAmount) {
      return { uahAmount: 0, currentRate: 0 };
    }

    const amount = parseFloat(state.cryptoAmount);
    const rate = selectedCurrencyData.rate;
    const uahAmount = amount * rate;

    return { uahAmount, currentRate: rate };
  }, [selectedCurrencyData, state.cryptoAmount, isValidAmount]);

  // ✅ Debounced валидация для лучшего UX
  const debouncedValidation = useMemo(
    () => debounce((amount: string) => {
      if (!amount) return;

      const numAmount = parseFloat(amount);
      if (selectedCurrencyData) {
        const isValid = numAmount >= selectedCurrencyData.minAmount &&
                       numAmount <= selectedCurrencyData.maxAmount;

        if (!isValid) {
          setState(prev => ({
            ...prev,
            validationErrors: {
              ...prev.validationErrors,
              amount: numAmount < selectedCurrencyData.minAmount
                ? `Минимум ${selectedCurrencyData.minAmount} ${selectedCurrencyData.code}`
                : `Максимум ${selectedCurrencyData.maxAmount} ${selectedCurrencyData.code}`
            }
          }));
        }
      }
    }, 500),
    [selectedCurrencyData]
  );

  // ✅ Оптимизированный обработчик изменения суммы
  const handleAmountChange = useCallback((value: string) => {
    if (!/^\d*\.?\d*$/.test(value) && value !== '') return;

    setState(prev => ({
      ...prev,
      cryptoAmount: value,
      isDirty: true,
      validationErrors: { ...prev.validationErrors, amount: '' },
    }));

    // Отложенная валидация
    debouncedValidation(value);
  }, [debouncedValidation]);

  // ✅ Cleanup для debounced функций
  useEffect(() => {
    return () => {
      debouncedValidation.cancel();
    };
  }, [debouncedValidation]);

  // ✅ Мемоизация списка валют для предотвращения ререндеров
  const currencyButtons = useMemo(() =>
    currencies.map((currency) => (
      <CurrencyButton
        key={currency.code}
        currency={currency}
        isSelected={state.selectedCurrency === currency.code}
        onSelect={handleCurrencySelect}
        size={size}
        disabled={!currency.available}
      />
    )),
    [currencies, state.selectedCurrency, handleCurrencySelect, size]
  );

  // Остальная логика компонента...
}
```

### 3. Мониторинг производительности:

```typescript
// 📁 packages/ui/src/components/exchange/performance-monitor.tsx
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 ${id} (${phase}): ${actualDuration.toFixed(2)}ms`);

    // Предупреждение о медленных рендерах
    if (actualDuration > 16) { // 60fps = 16.67ms на кадр
      console.warn(`⚠️ Медленный рендер ${id}: ${actualDuration.toFixed(2)}ms`);
    }
  }
};

// Обертка для мониторинга
export function CryptoExchangeWidgetWithProfiler(props: CryptoExchangeWidgetProps) {
  return (
    <Profiler id="CryptoExchangeWidget" onRender={onRenderCallback}>
      <CryptoExchangeWidget {...props} />
    </Profiler>
  );
}
```

### 4. Bundle анализ:

```bash
# Анализ размера компонента
npm run build:analyze

# Результат анализа:
# CryptoExchangeWidget: 15.2kb (gzipped: 4.8kb)
# Dependencies:
# - React: уже в проекте
# - Lucide icons: +2.1kb
# - Lodash debounce: +0.8kb
# - Date-fns: +1.2kb
```

## 🚀 Этап 7: Интеграция в проект

### 1. Экспорт из UI пакета:

```typescript
// 📁 packages/ui/src/index.ts
// ... другие экспорты

// Exchange компоненты
export * from './components/exchange/CryptoExchangeWidget';
export * from './components/exchange/types';
```

### 2. Использование в главном приложении:

```typescript
// 📁 apps/web/src/components/sections/HeroSection.tsx
import { CryptoExchangeWidget } from '@repo/ui';
import { useCryptoCurrencies, useCreateExchangeOrder } from '@repo/hooks';

export function HeroSection() {
  const { data: currencies, isLoading } = useCryptoCurrencies();
  const createOrderMutation = useCreateExchangeOrder();

  const handleCreateOrder = async (data) => {
    try {
      await createOrderMutation.mutateAsync(data);
      toast.success('Заявка создана! Проверьте email.');
    } catch (error) {
      toast.error('Ошибка создания заявки');
    }
  };

  if (isLoading) {
    return <ExchangeWidgetSkeleton />;
  }

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Текстовый блок */}
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Обменяйте криптовалюты
              <span className="text-primary"> быстро и безопасно</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Лучшие курсы Bitcoin, Ethereum и Tether в Украине.
              Без скрытых комиссий, с гарантией безопасности.
            </p>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Комиссия 0%</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Обмен за 5-30 минут</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <span>Полная безопасность</span>
              </div>
            </div>
          </div>

          {/* Виджет обмена */}
          <div className="flex justify-center lg:justify-end">
            <CryptoExchangeWidget
              currencies={currencies || []}
              onCreateOrder={handleCreateOrder}
              size="expanded"
              variant="detailed"
              isLoading={createOrderMutation.isPending}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
```

## ✅ Проверка знаний

### Вопросы для самоконтроля:

1. **Планирование**:
   - Как правильно спроектировать API компонента?
   - Какие состояния нужно учесть при создании формы?
   - Как обеспечить переиспользуемость компонента?

2. **Реализация**:
   - Как оптимизировать перерендеры компонента?
   - Когда использовать useMemo и useCallback?
   - Как правильно обрабатывать ошибки и валидацию?

3. **Качество**:
   - Как документировать компонент для команды?
   - Какие тесты написать для компонента?
   - Как обеспечить accessibility?

## 📊 Этап 8: Метрики качества и code review

### 1. Чек-лист качества компонента:

```typescript
// 📁 packages/ui/src/components/exchange/quality-checklist.md

## ✅ Качество кода (Code Quality)

### Архитектура
- [ ] Единственная ответственность (Single Responsibility)
- [ ] Открыт для расширения, закрыт для изменения (Open/Closed)
- [ ] Инверсия зависимостей (Dependency Inversion)
- [ ] Композиция предпочтительнее наследования

### TypeScript
- [ ] Строгая типизация всех пропсов
- [ ] Экспорт всех необходимых типов
- [ ] Использование дискриминированных union types
- [ ] Правильные generic constraints

### Performance
- [ ] Мемоизация тяжелых вычислений (useMemo)
- [ ] Стабильные ссылки на функции (useCallback)
- [ ] Оптимизация ререндеров (React.memo при необходимости)
- [ ] Debouncing пользовательского ввода

### Accessibility
- [ ] WCAG 2.1 AA соответствие
- [ ] Клавиатурная навигация
- [ ] Screen reader поддержка
- [ ] Достаточный цветовой контраст (4.5:1)

### UX/UI
- [ ] Responsive design (mobile-first)
- [ ] Touch-friendly элементы (44px+)
- [ ] Loading и error состояния
- [ ] Плавные анимации и переходы

### Тестирование
- [ ] Unit тесты (>90% покрытие)
- [ ] Integration тесты
- [ ] Accessibility тесты
- [ ] Visual regression тесты

### Документация
- [ ] Storybook истории
- [ ] README с примерами
- [ ] API документация
- [ ] Changelog
```

### 2. Автоматизированные проверки:

```typescript
// 📁 packages/ui/scripts/quality-check.ts
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

interface QualityMetrics {
  codeQuality: number;
  testCoverage: number;
  accessibility: number;
  performance: number;
  documentation: number;
  overall: number;
}

export async function checkComponentQuality(componentPath: string): Promise<QualityMetrics> {
  const metrics: QualityMetrics = {
    codeQuality: 0,
    testCoverage: 0,
    accessibility: 0,
    performance: 0,
    documentation: 0,
    overall: 0,
  };

  // ✅ Проверка качества кода (ESLint)
  try {
    execSync(`npx eslint ${componentPath} --format json`, { stdio: 'pipe' });
    metrics.codeQuality = 100; // Нет ошибок
  } catch (error) {
    const output = JSON.parse(error.stdout.toString());
    const errorCount = output.reduce((sum: number, file: any) => sum + file.errorCount, 0);
    metrics.codeQuality = Math.max(0, 100 - errorCount * 10);
  }

  // ✅ Покрытие тестами
  try {
    const coverage = execSync('npx jest --coverage --silent', { encoding: 'utf8' });
    const coverageMatch = coverage.match(/All files\s+\|\s+(\d+\.?\d*)/);
    metrics.testCoverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
  } catch {
    metrics.testCoverage = 0;
  }

  // ✅ Accessibility (axe-core)
  try {
    execSync(`npx jest --testNamePattern="accessibility" --silent`);
    metrics.accessibility = 100; // Тесты прошли
  } catch {
    metrics.accessibility = 0;
  }

  // ✅ Производительность (bundle size)
  try {
    const bundleSize = execSync(`npx bundlesize`, { encoding: 'utf8' });
    metrics.performance = bundleSize.includes('PASS') ? 100 : 50;
  } catch {
    metrics.performance = 50;
  }

  // ✅ Документация (наличие файлов)
  const hasStorybook = existsSync(`${componentPath}.stories.tsx`);
  const hasReadme = existsSync(`${componentPath}/README.md`);
  const hasTypes = existsSync(`${componentPath}/types.ts`);

  metrics.documentation = (hasStorybook ? 40 : 0) + (hasReadme ? 40 : 0) + (hasTypes ? 20 : 0);

  // ✅ Общая оценка
  metrics.overall =
    metrics.codeQuality * 0.25 +
    metrics.testCoverage * 0.25 +
    metrics.accessibility * 0.2 +
    metrics.performance * 0.15 +
    metrics.documentation * 0.15;

  return metrics;
}

// Использование:
// npm run quality-check packages/ui/src/components/exchange/CryptoExchangeWidget.tsx
```

### 3. Отчет о качестве:

```typescript
// 📁 packages/ui/src/components/exchange/quality-report.md

# CryptoExchangeWidget - Отчет о качестве

## 📊 Метрики качества

| Категория | Оценка | Статус |
|-----------|--------|--------|
| **Качество кода** | 95/100 | ✅ Отлично |
| **Покрытие тестами** | 92/100 | ✅ Отлично |
| **Accessibility** | 100/100 | ✅ Отлично |
| **Производительность** | 88/100 | ✅ Хорошо |
| **Документация** | 100/100 | ✅ Отлично |
| **Общая оценка** | **94/100** | ✅ **Отлично** |

## 🎯 Детальный анализ

### Качество кода (95/100)
- ✅ TypeScript строгая типизация
- ✅ ESLint без ошибок
- ✅ Prettier форматирование
- ⚠️ 1 сложная функция (handleSubmit) - можно разбить

### Покрытие тестами (92/100)
- ✅ Unit тесты: 95% покрытие
- ✅ Integration тесты: 90% покрытие
- ✅ Accessibility тесты: 100% покрытие
- ⚠️ Edge cases: 85% покрытие

### Accessibility (100/100)
- ✅ WCAG 2.1 AA соответствие
- ✅ Клавиатурная навигация
- ✅ Screen reader поддержка
- ✅ Цветовой контраст 4.5:1+

### Производительность (88/100)
- ✅ Bundle size: 4.8kb gzipped
- ✅ Мемоизация вычислений
- ✅ Debounced валидация
- ⚠️ Можно добавить lazy loading для иконок

### Документация (100/100)
- ✅ Storybook истории с примерами
- ✅ README с API документацией
- ✅ TypeScript типы экспортированы
- ✅ Changelog ведется

## 🚀 Рекомендации по улучшению

1. **Рефакторинг handleSubmit**: разбить на более мелкие функции
2. **Lazy loading**: добавить для иконок валют
3. **Edge cases**: добавить тесты для редких сценариев
4. **Performance monitoring**: добавить метрики в production

## 📈 Сравнение с индустрией

| Метрика | Наш компонент | Индустрия | Статус |
|---------|---------------|-----------|--------|
| Bundle size | 4.8kb | 6-12kb | ✅ Лучше |
| Test coverage | 92% | 70-80% | ✅ Лучше |
| Accessibility | 100% | 60-70% | ✅ Значительно лучше |
| Documentation | 100% | 40-60% | ✅ Значительно лучше |

**Вывод**: Компонент превосходит индустриальные стандарты по всем метрикам.
```

### 💻 Финальное задание

**Создайте production-ready компонент с полным циклом разработки:**

#### Этап 1: Планирование _(10 мин)_

- [ ] Создайте техническое задание для нового компонента
- [ ] Спроектируйте API интерфейс с TypeScript типами
- [ ] Определите все возможные состояния и edge cases
- [ ] Создайте wireframes для разных размеров экранов

#### Этап 2: Разработка _(30 мин)_

- [ ] Реализуйте базовую функциональность
- [ ] Добавьте адаптивность и touch-friendly элементы
- [ ] Оптимизируйте производительность (мемоизация, debouncing)
- [ ] Обеспечьте accessibility (WCAG 2.1 AA)

#### Этап 3: Тестирование _(20 мин)_

- [ ] Напишите unit тесты (цель: >90% покрытие)
- [ ] Добавьте accessibility тесты с axe-core
- [ ] Создайте integration тесты с user interactions
- [ ] Проведите visual regression тестирование

#### Этап 4: Документация _(15 мин)_

- [ ] Создайте Storybook истории с примерами
- [ ] Напишите README с API документацией
- [ ] Добавьте примеры использования в разных сценариях
- [ ] Создайте migration guide (если нужно)

#### Этап 5: Качество _(10 мин)_

- [ ] Проведите code review по чек-листу
- [ ] Запустите автоматизированные проверки качества
- [ ] Измерьте производительность и bundle size
- [ ] Создайте отчет о качестве компонента

#### 🎯 Варианты компонентов для создания:

**Выберите один из компонентов:**

1. **NotificationSystem** - система уведомлений
   - Toast уведомления с разными типами
   - Позиционирование и анимации
   - Автоматическое закрытие и действия
   - Интеграция с React Context

2. **DataVisualization** - компонент графиков
   - Адаптивные графики курсов валют
   - Интерактивность и tooltips
   - Экспорт в изображения
   - Accessibility для данных

3. **AdvancedForm** - сложная форма
   - Многошаговая форма регистрации
   - Валидация в реальном времени
   - Автосохранение в localStorage
   - Интеграция с API

4. **VirtualizedList** - виртуализированный список
   - Список транзакций с виртуализацией
   - Фильтрация и сортировка
   - Infinite scrolling
   - Оптимизация для больших данных

#### ✅ Критерии оценки (100 баллов):

**Функциональность (25 баллов):**

- [ ] Все требования реализованы (10 баллов)
- [ ] Edge cases обработаны (8 баллов)
- [ ] Error handling (7 баллов)

**Качество кода (25 баллов):**

- [ ] TypeScript типизация (8 баллов)
- [ ] Архитектура и паттерны (8 баллов)
- [ ] Производительность (9 баллов)

**UX/UI (20 баллов):**

- [ ] Responsive design (7 баллов)
- [ ] Accessibility (8 баллов)
- [ ] Анимации и переходы (5 баллов)

**Тестирование (15 баллов):**

- [ ] Unit тесты >90% (8 баллов)
- [ ] Integration тесты (4 баллов)
- [ ] Accessibility тесты (3 балла)

**Документация (15 баллов):**

- [ ] Storybook истории (6 баллов)
- [ ] README документация (5 баллов)
- [ ] API документация (4 балла)

#### 🏆 Бонусные задачи (+20 баллов):

- [ ] **Интернационализация** - поддержка i18n (+5 баллов)
- [ ] **Темизация** - поддержка кастомных тем (+5 баллов)
- [ ] **Performance monitoring** - метрики в production (+5 баллов)
- [ ] **A/B тестирование** - поддержка экспериментов (+5 баллов)

#### 📊 Ожидаемый результат:

**Production-ready компонент который:**

- Используется в реальном проекте ExchangeGO
- Соответствует всем стандартам качества
- Имеет полную документацию и тесты
- Готов к публикации в NPM registry

## 📚 Дополнительные материалы

### Best Practices:

- [React Component Design Patterns](https://kentcdodds.com/blog/advanced-react-component-patterns)
- [API Design Guidelines](https://github.com/microsoft/api-guidelines)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Инструменты:

- [Storybook](https://storybook.js.org/) - документация компонентов
- [React Hook Form](https://react-hook-form.com/) - работа с формами
- [Zod](https://zod.dev/) - валидация данных

### В проекте:

- `packages/ui/src/components/` - готовые компоненты для изучения
- `packages/ui/src/stories/` - примеры документации
- `packages/ui/src/__tests__/` - примеры тестов

---

**🎉 Поздравляем! Вы освоили создание профессиональных переиспользуемых компонентов.**

Теперь вы умеете:

- Проектировать API компонентов
- Создавать адаптивные и доступные интерфейсы
- Документировать и тестировать код
- Интегрировать компоненты в большую систему

---

[← Урок 6.4: Responsive Design](./lesson-6.4-responsive-mobile.md) | [Глава 7: Интернационализация →](../chapter-07-internationalization/README.md)
