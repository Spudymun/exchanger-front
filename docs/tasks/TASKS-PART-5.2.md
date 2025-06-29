# 🚀 ExchangeGO Development Tasks - Part 5.2: Exchange Pages & Features

**Дата создания:** 29 июня 2025  
**Статус:** В разработке  
**Покрытие:** Страницы обмена, калькулятор, процесс создания заявки, отслеживание

---

## 📋 Общая информация

### Связь с предыдущими частями:

- ✅ Использует Layout из Part 5.1 (Core Pages & Layout)
- ✅ Применяет UI Components из Part 4 (UI Components & Forms)
- ✅ Интегрируется с State Management из Part 3
- ✅ Использует tRPC API из Part 2

### Архитектурный подход:

- **Multi-step Process** для создания заявки
- **Real-time Calculation** с rate updates
- **Order Tracking** с статусами
- **Mobile-first Design** для всех страниц

---

## 💱 PHASE 5.2: EXCHANGE PAGES & FEATURES

### TASK 5.2.1: Создать страницу Exchange Calculator

**Время:** 2.5 часа  
**Приоритет:** 🔴 Критический

#### Описание

Главная страница калькулятора обмена с расширенными возможностями и реальным временем.

#### Технические требования

```
apps/web/src/app/exchange/
├── page.tsx                 # Главная страница калькулятора
├── components/
│   ├── CalculatorWidget/
│   │   ├── CalculatorWidget.tsx
│   │   ├── RateDisplay.tsx
│   │   ├── CurrencySelector.tsx
│   │   └── AmountInput.tsx
│   ├── OrderPreview/
│   │   ├── OrderPreview.tsx
│   │   └── OrderDetails.tsx
│   └── ProcessSteps/
│       ├── ProcessSteps.tsx
│       └── StepIndicator.tsx
```

#### Реализация

1. **apps/web/src/app/exchange/page.tsx**

```typescript
import React from 'react';
import { Metadata } from 'next';
import { CalculatorWidget } from './components/CalculatorWidget/CalculatorWidget';
import { ProcessSteps } from './components/ProcessSteps/ProcessSteps';
import { FeaturesSection } from '~/components/sections/FeaturesSection';
import { RecentRatesSection } from '~/components/sections/RecentRatesSection';

export const metadata: Metadata = {
  title: 'Калькулятор обмена криптовалют | ExchangeGO',
  description: 'Рассчитайте стоимость обмена криптовалют на гривны в реальном времени. Выгодные курсы BTC, ETH, USDT, LTC.',
  keywords: 'обмен криптовалют, калькулятор, bitcoin, ethereum, курс',
  openGraph: {
    title: 'Калькулятор обмена криптовалют | ExchangeGO',
    description: 'Рассчитайте стоимость обмена криптовалют на гривны в реальном времени',
    url: '/exchange',
    type: 'website',
  },
};

export default function ExchangePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Калькулятор обмена
              <span className="text-blue-600"> криптовалют</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 mb-8">
              Рассчитайте стоимость обмена в реальном времени с выгодными курсами
            </p>
          </div>

          {/* Main Calculator */}
          <div className="max-w-2xl mx-auto">
            <CalculatorWidget />
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Как происходит обмен
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Простой и безопасный процесс обмена в 4 шага
            </p>
          </div>
          <ProcessSteps />
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <FeaturesSection />
        </div>
      </section>

      {/* Recent Rates */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <RecentRatesSection />
        </div>
      </section>
    </div>
  );
}
```

2. **apps/web/src/app/exchange/components/CalculatorWidget/CalculatorWidget.tsx**

```typescript
'use client';

import React from 'react';
import { Card, CardContent, Button } from '@repo/ui';
import { useExchange } from '~/hooks/useExchange';
import { useRouter } from 'next/navigation';
import { RateDisplay } from './RateDisplay';
import { CurrencySelector } from './CurrencySelector';
import { AmountInput } from './AmountInput';
import { OrderPreview } from '../OrderPreview/OrderPreview';
import { ArrowsUpDownIcon, SparklesIcon } from '@heroicons/react/24/outline';

export function CalculatorWidget() {
  const router = useRouter();
  const exchange = useExchange();

  // State для UI
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Обработчики
  const handleSwapDirection = () => {
    exchange.swapDirection();
  };

  const handleCalculate = async () => {
    if (exchange.isFormValid()) {
      await exchange.calculateExchange();
      setIsExpanded(true);
    }
  };

  const handleCreateOrder = () => {
    if (exchange.calculation) {
      router.push('/exchange/create');
    }
  };

  const isFromCrypto = exchange.formData.direction === 'crypto-to-uah';

  return (
    <Card className="shadow-xl border-0">
      <CardContent className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Калькулятор
            </h3>
          </div>

          {/* Live indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">LIVE</span>
          </div>
        </div>

        {/* Exchange Direction */}
        <div className="mb-6">
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {isFromCrypto ? 'Крипта → UAH' : 'UAH → Крипта'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSwapDirection}
                className="text-blue-600 hover:text-blue-700"
              >
                <ArrowsUpDownIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Currency Selection */}
        <div className="mb-6">
          <CurrencySelector />
        </div>

        {/* Current Rate */}
        <div className="mb-6">
          <RateDisplay />
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <AmountInput onCalculate={handleCalculate} />
        </div>

        {/* Calculation Result */}
        {exchange.calculation && isExpanded && (
          <div className="mb-6">
            <OrderPreview
              calculation={exchange.calculation}
              formData={exchange.formData}
              onCreateOrder={handleCreateOrder}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!exchange.calculation && (
            <Button
              onClick={handleCalculate}
              size="lg"
              className="w-full"
              disabled={!exchange.isFormValid()}
              loading={exchange.isCalculating}
            >
              Рассчитать обмен
            </Button>
          )}

          {exchange.calculation && (
            <Button
              onClick={handleCreateOrder}
              size="lg"
              className="w-full"
              variant="success"
            >
              Создать заявку
            </Button>
          )}
        </div>

        {/* Error Display */}
        {exchange.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{exchange.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

3. **apps/web/src/app/exchange/components/CalculatorWidget/RateDisplay.tsx**

```typescript
'use client';

import React from 'react';
import { useExchangeRates } from '~/hooks/useExchangeRates';
import { useExchange } from '~/hooks/useExchange';
import { TrendingUpIcon, TrendingDownIcon } from '@heroicons/react/24/outline';

export function RateDisplay() {
  const rates = useExchangeRates();
  const exchange = useExchange();

  const currentRate = rates.getRateForCurrency(exchange.formData.currency);
  const displayRate = exchange.getDisplayRate();

  if (!currentRate || !displayRate) {
    return (
      <div className="animate-pulse">
        <div className="h-16 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  const trend = currentRate.trend;
  const TrendIcon = trend === 'up' ? TrendingUpIcon : TrendingDownIcon;
  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-800">
              Текущий курс
            </span>
            <div className={`flex items-center space-x-1 ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              <span className="text-xs font-medium">
                {currentRate.change24h > 0 ? '+' : ''}{currentRate.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="text-lg font-bold text-blue-900">
            {displayRate.formattedRate}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-blue-700">
            Комиссия: {displayRate.formattedCommission}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Обновлено: {new Date(currentRate.updatedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
```

4. **apps/web/src/app/exchange/components/CalculatorWidget/CurrencySelector.tsx**

```typescript
'use client';

import React from 'react';
import { CRYPTOCURRENCIES } from '@repo/constants';
import { useExchange } from '~/hooks/useExchange';
import { getCurrencyIcon, getCurrencyName } from '~/utils/currency';

export function CurrencySelector() {
  const exchange = useExchange();

  const handleCurrencyChange = (currency: string) => {
    exchange.updateFormData({
      currency: currency as typeof CRYPTOCURRENCIES[number]
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Выберите криптовалюту
      </label>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CRYPTOCURRENCIES.map((currency) => {
          const isSelected = exchange.formData.currency === currency;
          const CurrencyIcon = getCurrencyIcon(currency);

          return (
            <button
              key={currency}
              onClick={() => handleCurrencyChange(currency)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                flex flex-col items-center space-y-2
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <CurrencyIcon className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold text-sm">{currency}</div>
                <div className="text-xs text-gray-500">
                  {getCurrencyName(currency)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

5. **apps/web/src/app/exchange/components/CalculatorWidget/AmountInput.tsx**

```typescript
'use client';

import React from 'react';
import { Input, Button } from '@repo/ui';
import { useExchange } from '~/hooks/useExchange';
import { CURRENCY_LIMITS } from '@repo/constants';
import { CalculatorIcon } from '@heroicons/react/24/outline';

interface AmountInputProps {
  onCalculate: () => void;
}

export function AmountInput({ onCalculate }: AmountInputProps) {
  const exchange = useExchange();

  const isFromCrypto = exchange.formData.direction === 'crypto-to-uah';
  const limits = CURRENCY_LIMITS[exchange.formData.currency];

  const label = isFromCrypto
    ? `Сумма (${exchange.formData.currency})`
    : 'Сумма (UAH)';

  const placeholder = isFromCrypto
    ? `0.00 ${exchange.formData.currency}`
    : '0.00 UAH';

  const hint = isFromCrypto
    ? `Мин: ${limits.minCrypto}, Макс: ${limits.maxCrypto} ${exchange.formData.currency}`
    : `Мин: ${limits.minUah.toLocaleString()}, Макс: ${limits.maxUah.toLocaleString()} UAH`;

  const [localAmount, setLocalAmount] = React.useState(exchange.formData.amount);
  const [isValid, setIsValid] = React.useState(true);

  // Debounced update
  React.useEffect(() => {
    const timer = setTimeout(() => {
      exchange.updateFormData({ amount: localAmount });
    }, 300);

    return () => clearTimeout(timer);
  }, [localAmount]);

  // Validation
  React.useEffect(() => {
    if (!localAmount) {
      setIsValid(true);
      return;
    }

    const amount = parseFloat(localAmount);
    if (isNaN(amount) || amount <= 0) {
      setIsValid(false);
      return;
    }

    if (isFromCrypto) {
      setIsValid(amount >= limits.minCrypto && amount <= limits.maxCrypto);
    } else {
      setIsValid(amount >= limits.minUah && amount <= limits.maxUah);
    }
  }, [localAmount, isFromCrypto, limits]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && localAmount) {
      onCalculate();
    }
  };

  const handleQuickAmount = (multiplier: number) => {
    const baseAmount = isFromCrypto
      ? limits.minCrypto * multiplier
      : limits.minUah * multiplier;
    setLocalAmount(baseAmount.toString());
  };

  return (
    <div className="space-y-4">
      <Input
        label={label}
        type="text"
        value={localAmount}
        onChange={(e) => setLocalAmount(e.target.value)}
        placeholder={placeholder}
        hint={hint}
        error={!isValid ? 'Сумма вне допустимых лимитов' : undefined}
        onKeyPress={handleKeyPress}
        rightElement={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCalculate}
            disabled={!isValid || !localAmount || exchange.isCalculating}
            loading={exchange.isCalculating}
          >
            <CalculatorIcon className="h-4 w-4" />
          </Button>
        }
      />

      {/* Quick Amount Buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 mr-2">Быстрый выбор:</span>
        {[1, 2, 5, 10].map((multiplier) => {
          const amount = isFromCrypto
            ? limits.minCrypto * multiplier
            : limits.minUah * multiplier;

          const maxAmount = isFromCrypto ? limits.maxCrypto : limits.maxUah;

          if (amount > maxAmount) return null;

          return (
            <Button
              key={multiplier}
              variant="outline"
              size="xs"
              onClick={() => handleQuickAmount(multiplier)}
            >
              {isFromCrypto
                ? `${amount} ${exchange.formData.currency}`
                : `₴${amount.toLocaleString()}`
              }
            </Button>
          );
        })}
      </div>
    </div>
  );
}
```

#### Чек-лист готовности

- [ ] Calculator Widget создан и функционален
- [ ] Real-time rate display работает
- [ ] Currency selection интуитивен
- [ ] Amount input с валидацией
- [ ] Quick amount buttons реализованы
- [ ] Mobile responsive design

---

### TASK 5.2.2: Создать процесс создания заявки (Multi-step)

**Время:** 3 часа  
**Приоритет:** 🔴 Критический

#### Описание

Multi-step процесс создания заявки с валидацией, preview и подтверждением.

#### Реализация

1. **apps/web/src/app/exchange/create/page.tsx**

```typescript
'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import { useExchange } from '~/hooks/useExchange';
import { CreateOrderFlow } from './components/CreateOrderFlow';
import { Card, CardContent } from '@repo/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CreateOrderPage() {
  const exchange = useExchange();

  // Redirect если нет расчета
  if (!exchange.calculation) {
    redirect('/exchange');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <Link
            href="/exchange"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Вернуться к калькулятору
          </Link>

          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Создание заявки на обмен
          </h1>
          <p className="text-gray-600 mt-2">
            Заполните данные для завершения операции обмена
          </p>
        </div>

        {/* Order Flow */}
        <div className="max-w-4xl mx-auto">
          <CreateOrderFlow />
        </div>
      </div>
    </div>
  );
}
```

2. **apps/web/src/app/exchange/create/components/CreateOrderFlow.tsx**

```typescript
'use client';

import React from 'react';
import { Card, CardContent } from '@repo/ui';
import { useExchange } from '~/hooks/useExchange';
import { StepIndicator } from '../../components/ProcessSteps/StepIndicator';
import { OrderSummaryStep } from './steps/OrderSummaryStep';
import { ContactInfoStep } from './steps/ContactInfoStep';
import { PaymentMethodStep } from './steps/PaymentMethodStep';
import { ConfirmationStep } from './steps/ConfirmationStep';

type Step = 'summary' | 'contact' | 'payment' | 'confirmation';

const STEPS: { key: Step; title: string; description: string }[] = [
  {
    key: 'summary',
    title: 'Детали обмена',
    description: 'Проверьте параметры операции',
  },
  {
    key: 'contact',
    title: 'Контактная информация',
    description: 'Укажите данные для связи',
  },
  {
    key: 'payment',
    title: 'Способ оплаты',
    description: 'Выберите метод получения средств',
  },
  {
    key: 'confirmation',
    title: 'Подтверждение',
    description: 'Финальная проверка и создание заявки',
  },
];

export function CreateOrderFlow() {
  const exchange = useExchange();
  const [currentStep, setCurrentStep] = React.useState<Step>('summary');
  const [completedSteps, setCompletedSteps] = React.useState<Step[]>([]);

  const currentStepIndex = STEPS.findIndex((step) => step.key === currentStep);

  const handleStepComplete = (step: Step) => {
    setCompletedSteps((prev) => [...prev.filter((s) => s !== step), step]);

    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < STEPS.length) {
      setCurrentStep(STEPS[nextStepIndex].key);
    }
  };

  const handleStepBack = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(STEPS[prevStepIndex].key);
    }
  };

  const canGoToStep = (step: Step) => {
    const stepIndex = STEPS.findIndex((s) => s.key === step);
    const currentIndex = currentStepIndex;

    // Можно идти на текущий шаг или предыдущие завершенные
    return stepIndex <= currentIndex || completedSteps.includes(step);
  };

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <Card>
        <CardContent className="p-6">
          <StepIndicator
            steps={STEPS.map((step, index) => ({
              title: step.title,
              description: step.description,
              status: completedSteps.includes(step.key)
                ? 'completed'
                : step.key === currentStep
                ? 'current'
                : 'pending',
              onClick: canGoToStep(step.key)
                ? () => setCurrentStep(step.key)
                : undefined,
            }))}
          />
        </CardContent>
      </Card>

      {/* Step Content */}
      <div>
        {currentStep === 'summary' && (
          <OrderSummaryStep
            calculation={exchange.calculation!}
            formData={exchange.formData}
            onNext={() => handleStepComplete('summary')}
            onBack={() => window.history.back()}
          />
        )}

        {currentStep === 'contact' && (
          <ContactInfoStep
            onNext={() => handleStepComplete('contact')}
            onBack={handleStepBack}
          />
        )}

        {currentStep === 'payment' && (
          <PaymentMethodStep
            calculation={exchange.calculation!}
            onNext={() => handleStepComplete('payment')}
            onBack={handleStepBack}
          />
        )}

        {currentStep === 'confirmation' && (
          <ConfirmationStep
            onBack={handleStepBack}
          />
        )}
      </div>
    </div>
  );
}
```

3. **apps/web/src/app/exchange/create/components/steps/OrderSummaryStep.tsx**

```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui';
import { ExchangeCalculation, ExchangeFormData } from '@repo/types';
import { getCurrencyIcon, getCurrencyName } from '~/utils/currency';
import { ClockIcon, ShieldCheckIcon, BanknotesIcon } from '@heroicons/react/24/outline';

interface OrderSummaryStepProps {
  calculation: ExchangeCalculation;
  formData: ExchangeFormData;
  onNext: () => void;
  onBack: () => void;
}

export function OrderSummaryStep({
  calculation,
  formData,
  onNext,
  onBack
}: OrderSummaryStepProps) {
  const isFromCrypto = formData.direction === 'crypto-to-uah';
  const CurrencyIcon = getCurrencyIcon(formData.currency);

  return (
    <div className="space-y-6">
      {/* Main Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BanknotesIcon className="h-5 w-5" />
            <span>Детали обмена</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exchange Direction */}
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CurrencyIcon className="h-6 w-6" />
                <span className="font-medium">
                  {isFromCrypto ? formData.currency : 'UAH'}
                </span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {isFromCrypto ? 'UAH' : formData.currency}
                </span>
                {!isFromCrypto && <CurrencyIcon className="h-6 w-6" />}
              </div>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Отдаете
              </label>
              <div className="text-2xl font-bold text-gray-900">
                {isFromCrypto
                  ? `${calculation.cryptoAmount} ${formData.currency}`
                  : `₴${calculation.uahAmount.toLocaleString()}`
                }
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Получаете
              </label>
              <div className="text-2xl font-bold text-green-600">
                {isFromCrypto
                  ? `₴${calculation.uahAmount.toLocaleString()}`
                  : `${calculation.cryptoAmount} ${formData.currency}`
                }
              </div>
            </div>
          </div>

          {/* Rate and Commission */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Курс обмена:</span>
              <span className="font-medium">{calculation.rate.toLocaleString()} UAH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Комиссия:</span>
              <span className="font-medium">₴{calculation.commissionAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Время обработки:</span>
              <span className="font-medium">15-30 минут</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guarantees */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <div className="font-medium text-sm">Безопасность</div>
                <div className="text-xs text-gray-600">
                  Средства защищены системой эскроу
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <ClockIcon className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <div className="font-medium text-sm">Быстро</div>
                <div className="text-xs text-gray-600">
                  Обработка в течение 30 минут
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <BanknotesIcon className="h-5 w-5 text-indigo-600 mt-1" />
              <div>
                <div className="font-medium text-sm">Выгодно</div>
                <div className="text-xs text-gray-600">
                  Лучшие курсы на рынке
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
        >
          Назад
        </Button>
        <Button onClick={onNext}>
          Продолжить
        </Button>
      </div>
    </div>
  );
}
```

#### Чек-лист готовности

- [ ] Multi-step flow создан
- [ ] Step indicator функционален
- [ ] Order summary отображается корректно
- [ ] Navigation между шагами работает
- [ ] Validation на каждом шаге
- [ ] Mobile responsive

---

## 📊 Статус Progress Part 5.2

### Завершенные задачи: 0/4

- [ ] TASK 5.2.1: Создать страницу Exchange Calculator
- [ ] TASK 5.2.2: Создать процесс создания заявки (Multi-step)

### Следующие задачи в Part 5.2:

- **TASK 5.2.3** - Contact Info & Payment Steps
- **TASK 5.2.4** - Order Tracking & Status Pages

### Ключевые результаты Part 5.2:

✅ **Calculator Widget** с real-time расчетами  
✅ **Multi-step Order Flow** с валидацией  
✅ **Currency Selection** с визуальными индикаторами  
✅ **Rate Display** с трендами и обновлениями  
✅ **Amount Input** с quick selection  
✅ **Order Summary** с детальной информацией  
✅ **Step Navigation** с progress indicator  
✅ **Mobile-first Design** для всех компонентов

---

**Дата создания:** 29 июня 2025  
**Версия:** 1.0  
**Следующая подчасть:** TASKS-PART-5.3.md (Contact & Payment Steps)
