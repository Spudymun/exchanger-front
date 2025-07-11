# 🚀 ExchangeGO Development Tasks - Part 5.2: Exchange Pages & Features

**Дата создания:** 29 июня 2025  
**Статус:** В разработке  
**Покрытие:** Страницы обмена, калькулятор, процесс создания заявки, отслеживание + I18N локализация

🌍 **I18N Requirements:** См. [I18N_INTEGRATION_REQUIREMENTS.md](./I18N_INTEGRATION_REQUIREMENTS.md) для полных требований локализации

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

### TASK 5.2.1: Интегрировать обменник в HeroSection главной страницы

**Время:** 1.5 часа  
**Приоритет:** 🔴 Критический  
**♻️ Переиспользование:** ✅ Максимальное использование существующих компонентов

#### 🎯 ЦЕЛЬ ЗАДАЧИ

Интегрировать обменник (калькулятор) в HeroSection главной страницы. Пользователь сможет рассчитать обмен сразу на главной странице и перейти к заполнению данных.

#### 🔍 ТЕКУЩЕЕ СОСТОЯНИЕ (ФАКТ)

- **HeroSection** (`apps/web/src/components/HeroSection.tsx`) - простая секция с заголовком и кнопками
- **ExchangeForm** (`apps/web/src/components/forms/ExchangeForm.tsx`) - полнофункциональная форма обмена
- **Главная страница** (`apps/web/app/[locale]/page.tsx`) - содержит HeroSection, FeaturesSection, RatesSection, CTASection

#### 📋 ТРЕБОВАНИЯ К ИЗМЕНЕНИЯМ

**🔧 МОДИФИКАЦИЯ 1: HeroSection.tsx**

```typescript
// ПУТЬ: apps/web/src/components/HeroSection.tsx
// ДЕЙСТВИЕ: Заменить весь файл на новую версию

import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { ExchangeCalculator } from './ExchangeCalculator';

export function HeroSection() {
  const t = useTranslations('HomePage');

  return (
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">{t('title')}</h1>
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">{t('description')}</p>

      {/* НОВЫЙ БЛОК: Калькулятор обмена */}
      <div className="max-w-2xl mx-auto mb-8">
        <ExchangeCalculator />
      </div>

      {/* СОХРАНИТЬ: Существующие кнопки */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" className="text-lg px-8 py-3">
          {t('getStarted')}
        </Button>
        <Button variant="outline" size="lg" className="text-lg px-8 py-3">
          {t('learnMore')}
        </Button>
      </div>
    </div>
  );
}
```

**🔧 МОДИФИКАЦИЯ 2: Создать ExchangeCalculator.tsx**

```typescript
// ПУТЬ: apps/web/src/components/ExchangeCalculator.tsx
// ДЕЙСТВИЕ: Создать новый файл

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CRYPTOCURRENCIES } from '@repo/constants';
import { useForm } from '@repo/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from '@repo/ui';
import { CalculatorIcon } from '@heroicons/react/24/outline';
import { z } from 'zod';

// Схема валидации для калькулятора
const calculatorSchema = z.object({
  currency: z.enum(['BTC', 'ETH', 'USDT', 'LTC'] as const),
  amount: z.string().min(1, 'Введите сумму').refine(val => Number(val) > 0, 'Сумма должна быть больше 0'),
});

interface CalculatorFormData {
  currency: string;
  amount: string;
}

export function ExchangeCalculator() {
  const router = useRouter();
  const [calculation, setCalculation] = useState<{
    cryptoAmount: number;
    uahAmount: number;
    rate: number;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<CalculatorFormData>({
    initialValues: {
      currency: 'BTC',
      amount: '',
    },
    validationSchema: calculatorSchema,
    onSubmit: async (values) => {
      setIsCalculating(true);

      // Имитация расчета (в реальном приложении - API call)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const amount = Number(values.amount);
      const mockRate = values.currency === 'BTC' ? 1000000 : 50000; // Примерные курсы

      setCalculation({
        cryptoAmount: amount,
        uahAmount: amount * mockRate,
        rate: mockRate,
      });

      setIsCalculating(false);
    },
  });

  const handleContinueExchange = () => {
    if (calculation) {
      // Передаем данные через URL params
      const params = new URLSearchParams({
        currency: form.values.currency,
        amount: form.values.amount,
        calculatedUah: calculation.uahAmount.toString(),
        rate: calculation.rate.toString(),
      });
      router.push(`/exchange?${params.toString()}`);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-center justify-center">
          <CalculatorIcon className="h-5 w-5" />
          Калькулятор обмена
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={form.handleSubmit} className="space-y-4">
          {/* Выбор валюты */}
          <FormField name="currency" error={form.errors.currency}>
            <FormLabel>Валюта</FormLabel>
            <FormControl>
              <Select
                value={form.values.currency}
                onValueChange={(value) => form.setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите валюту" />
                </SelectTrigger>
                <SelectContent>
                  {CRYPTOCURRENCIES.map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormField>

          {/* Ввод суммы */}
          <FormField name="amount" error={form.errors.amount}>
            <FormLabel>Сумма ({form.values.currency})</FormLabel>
            <FormControl>
              <Input
                {...form.getFieldProps('amount')}
                type="number"
                placeholder="0.00"
                step="0.00000001"
                min="0"
              />
            </FormControl>
            <FormMessage />
          </FormField>

          {/* Кнопка расчета */}
          <Button
            type="submit"
            className="w-full"
            disabled={!form.isValid || isCalculating}
          >
            {isCalculating ? 'Рассчитываем...' : 'Рассчитать обмен'}
          </Button>
        </form>

        {/* Результат расчета */}
        {calculation && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Вы получите:</div>
              <div className="text-2xl font-bold text-green-600 mb-2">
                ₴{calculation.uahAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mb-4">
                Курс: {calculation.rate.toLocaleString()} UAH/{form.values.currency}
              </div>
              <Button
                onClick={handleContinueExchange}
                className="w-full"
                variant="default"
              >
                Продолжить обмен
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 🔄 ПЕРЕИСПОЛЬЗУЕМЫЕ КОМПОНЕНТЫ

- ✅ `@repo/ui` → все UI компоненты (Card, Button, Select, Input, Form)
- ✅ `@repo/hooks/useForm` → валидация формы
- ✅ `@repo/constants/CRYPTOCURRENCIES` → список валют
- ✅ `next/navigation` → роутинг
- ✅ `@heroicons/react/24/outline` → иконки

#### ✅ ЧЕКЛИСТ ЗАДАЧИ 5.2.1

- [ ] **Модифицировать HeroSection.tsx** - добавить импорт ExchangeCalculator
- [ ] **Создать ExchangeCalculator.tsx** - полный компонент калькулятора
- [ ] **Схема валидации** - calculatorSchema с currency и amount
- [ ] **Форма калькулятора** - выбор валюты и ввод суммы
- [ ] **Mock расчет** - имитация API call с setTimeout
- [ ] **Результат расчета** - отображение суммы в UAH и курса
- [ ] **Переход на /exchange** - с URL параметрами
- [ ] **Адаптивный дизайн** - корректное отображение на всех устройствах
- [ ] **Валидация** - проверка формы перед отправкой
- [ ] **Loading состояние** - индикатор загрузки при расчете

#### ✅ РЕЗУЛЬТАТ ЗАДАЧИ

- HeroSection содержит интегрированный калькулятор
- Пользователь может рассчитать обмен на главной странице
- После расчета переход на `/exchange` с параметрами
- Сохранена существующая структура HeroSection

---

### TASK 5.2.2: Создать страницу Exchange для заполнения данных

**Время:** 2 часа  
**Приоритет:** 🔴 Критический  
**♻️ Переиспользование:** ✅ Максимальное использование существующих компонентов

#### 🎯 ЦЕЛЬ ЗАДАЧИ

Создать страницу `/exchange` для заполнения необходимых данных после расчета с главной страницы (email, банковские реквизиты, проверка на робота).

#### 🔍 ТЕКУЩЕЕ СОСТОЯНИЕ (ФАКТ)

- **Существующий ExchangeForm** (`apps/web/src/components/forms/ExchangeForm.tsx`) - содержит поля валюты, суммы, email
- **Папка exchange НЕ СУЩЕСТВУЕТ** - нужно создать с нуля
- **URL параметры** - будут переданы с главной страницы

#### 📋 ТРЕБОВАНИЯ К ИЗМЕНЕНИЯМ

**🔧 МОДИФИКАЦИЯ 1: Создать страницу Exchange**

```typescript
// ПУТЬ: apps/web/app/[locale]/exchange/page.tsx
// ДЕЙСТВИЕ: Создать новую папку и файл

import { setRequestLocale } from 'next-intl/server';
import { ExchangeOrderForm } from '../../../src/components/ExchangeOrderForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Оформление обмена | ExchangeGO',
  description: 'Заполните данные для завершения обмена криптовалют',
};

interface ExchangePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ExchangePage({ params, searchParams }: ExchangePageProps) {
  const { locale } = await params;
  const search = await searchParams;

  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Оформление обмена
            </h1>
            <p className="text-xl text-muted-foreground">
              Заполните данные для завершения операции
            </p>
          </div>

          <ExchangeOrderForm searchParams={search} />
        </div>
      </div>
    </div>
  );
}
```

**🔧 МОДИФИКАЦИЯ 2: Создать ExchangeOrderForm.tsx**

```typescript
// ПУТЬ: apps/web/src/components/ExchangeOrderForm.tsx
// ДЕЙСТВИЕ: Создать новый файл

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useNotifications } from '@repo/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  Checkbox,
} from '@repo/ui';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { z } from 'zod';
import { useExchangeMutation } from '../hooks/useExchangeMutation';

// Схема валидации для полной формы
const orderFormSchema = z.object({
  email: z.string().email('Введите корректный email'),
  cardNumber: z.string().min(16, 'Введите номер карты').max(19, 'Неверный формат карты'),
  bankName: z.string().min(2, 'Введите название банка'),
  recipientName: z.string().min(2, 'Введите имя получателя'),
  isNotRobot: z.boolean().refine(val => val === true, 'Подтвердите, что вы не робот'),
});

interface OrderFormData {
  email: string;
  cardNumber: string;
  bankName: string;
  recipientName: string;
  isNotRobot: boolean;
}

interface ExchangeOrderFormProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export function ExchangeOrderForm({ searchParams }: ExchangeOrderFormProps) {
  const router = useRouter();
  const notifications = useNotifications();
  const [calculationData, setCalculationData] = useState<{
    currency: string;
    amount: string;
    calculatedUah: string;
    rate: string;
  } | null>(null);

  const exchangeMutation = useExchangeMutation({
    onSuccess: (order) => {
      const orderId = 'orderId' in order ? order.orderId : order.id;
      notifications.orderCreated(orderId);
      router.push(`/orders/${orderId}`);
    },
    onError: (error) => {
      notifications.handleExchangeError(error);
    },
  });

  // Получаем данные расчета из URL параметров
  useEffect(() => {
    const currency = searchParams.currency as string;
    const amount = searchParams.amount as string;
    const calculatedUah = searchParams.calculatedUah as string;
    const rate = searchParams.rate as string;

    if (currency && amount && calculatedUah && rate) {
      setCalculationData({ currency, amount, calculatedUah, rate });
    }
  }, [searchParams]);

  const form = useForm<OrderFormData>({
    initialValues: {
      email: '',
      cardNumber: '',
      bankName: '',
      recipientName: '',
      isNotRobot: false,
    },
    validationSchema: orderFormSchema,
    onSubmit: async (values) => {
      if (!calculationData) return;

      await exchangeMutation.createOrder.mutateAsync({
        currency: calculationData.currency as 'BTC' | 'ETH' | 'USDT' | 'LTC',
        cryptoAmount: Number(calculationData.amount),
        uahAmount: Number(calculationData.calculatedUah),
        email: values.email,
        // Дополнительные данные для заказа
        paymentDetails: {
          cardNumber: values.cardNumber,
          bankName: values.bankName,
          recipientName: values.recipientName,
        },
      });
    },
  });

  // Если нет данных расчета, показываем ошибку
  if (!calculationData) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Данные расчета не найдены</h2>
            <p className="text-gray-600 mb-6">
              Пожалуйста, вернитесь на главную страницу и рассчитайте обмен снова.
            </p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Вернуться на главную
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Сводка по обмену */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5" />
            Сводка по обмену
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Отдаете</div>
              <div className="text-lg font-semibold">
                {calculationData.amount} {calculationData.currency}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Получаете</div>
              <div className="text-lg font-semibold text-green-600">
                ₴{Number(calculationData.calculatedUah).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span>Курс:</span>
              <span>{Number(calculationData.rate).toLocaleString()} UAH/{calculationData.currency}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Форма заказа */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Данные для обмена
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit} className="space-y-6">
            {/* Email */}
            <FormField name="email" error={form.errors.email}>
              <FormLabel>Email для уведомлений</FormLabel>
              <FormControl>
                <Input
                  {...form.getFieldProps('email')}
                  type="email"
                  placeholder="your@email.com"
                />
              </FormControl>
              <FormMessage />
            </FormField>

            {/* Банковские данные */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCardIcon className="h-5 w-5" />
                <span className="font-medium">Банковские реквизиты</span>
              </div>

              <FormField name="cardNumber" error={form.errors.cardNumber}>
                <FormLabel>Номер карты</FormLabel>
                <FormControl>
                  <Input
                    {...form.getFieldProps('cardNumber')}
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </FormControl>
                <FormMessage />
              </FormField>

              <FormField name="bankName" error={form.errors.bankName}>
                <FormLabel>Название банка</FormLabel>
                <FormControl>
                  <Input
                    {...form.getFieldProps('bankName')}
                    type="text"
                    placeholder="ПриватБанк"
                  />
                </FormControl>
                <FormMessage />
              </FormField>

              <FormField name="recipientName" error={form.errors.recipientName}>
                <FormLabel>Имя получателя</FormLabel>
                <FormControl>
                  <Input
                    {...form.getFieldProps('recipientName')}
                    type="text"
                    placeholder="Иванов Иван Иванович"
                  />
                </FormControl>
                <FormMessage />
              </FormField>
            </div>

            {/* Проверка на робота */}
            <FormField name="isNotRobot" error={form.errors.isNotRobot}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isNotRobot"
                  checked={form.values.isNotRobot}
                  onCheckedChange={(checked) => form.setValue('isNotRobot', checked as boolean)}
                />
                <FormLabel htmlFor="isNotRobot" className="text-sm">
                  Я не робот
                </FormLabel>
              </div>
              <FormMessage />
            </FormField>

            {/* Действия */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
                className="flex-1"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Вернуться
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid || exchangeMutation.isCreatingOrder}
                className="flex-1"
              >
                {exchangeMutation.isCreatingOrder ? 'Создаем заявку...' : 'Создать заявку'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 🔄 ПЕРЕИСПОЛЬЗУЕМЫЕ КОМПОНЕНТЫ

- ✅ `@repo/ui` → все UI компоненты
- ✅ `@repo/hooks/useForm` → валидация формы
- ✅ `@repo/hooks/useNotifications` → уведомления
- ✅ `../hooks/useExchangeMutation` → мутация для создания заказа
- ✅ `next/navigation` → роутинг
- ✅ `next-intl/server` → локализация

#### ✅ ЧЕКЛИСТ ЗАДАЧИ 5.2.2

- [ ] **Создать папку exchange** - apps/web/app/[locale]/exchange/
- [ ] **Создать page.tsx** - серверный компонент с metadata
- [ ] **Создать ExchangeOrderForm.tsx** - клиентский компонент формы
- [ ] **Схема валидации** - orderFormSchema с полной валидацией
- [ ] **Получение URL параметров** - currency, amount, calculatedUah, rate
- [ ] **Сводка по обмену** - карточка с информацией о расчете
- [ ] **Форма данных** - email, банковские реквизиты, капча
- [ ] **Проверка на робота** - базовый checkbox
- [ ] **Обработка ошибок** - если нет данных расчета
- [ ] **Интеграция с API** - useExchangeMutation для создания заказа
- [ ] **Переход на заказ** - редирект после успешного создания
- [ ] **Адаптивный дизайн** - корректное отображение на всех устройствах

#### ✅ РЕЗУЛЬТАТ ЗАДАЧИ

- Страница `/exchange` создана
- Получение данных расчета из URL параметров
- Форма для заполнения email, банковских данных
- Базовая проверка на робота (checkbox)
- Переход на страницу заказа после создания

---

## 📊 Статус Progress Part 5.2

### 📋 ЗАДАЧИ К ВЫПОЛНЕНИЮ: 0/2

- [ ] **TASK 5.2.1**: Интегрировать обменник в HeroSection главной страницы
- [ ] **TASK 5.2.2**: Создать страницу Exchange для заполнения данных

### 🎯 КЛЮЧЕВЫЕ РЕЗУЛЬТАТЫ Part 5.2

После выполнения всех задач:

✅ **Главная страница** - содержит интегрированный калькулятор в HeroSection  
✅ **Страница Exchange** - для заполнения данных после расчета  
✅ **Переиспользование компонентов** - максимальное использование существующих UI  
✅ **Простая архитектура** - базовый уровень без сложностей  
✅ **Mobile-first Design** - адаптивный дизайн для всех устройств  
✅ **Валидация форм** - использование существующих хуков валидации

### 🔧 ТЕХНИЧЕСКИЕ ДЕТАЛИ

**Новые файлы для создания:**

- `apps/web/src/components/ExchangeCalculator.tsx` - компонент калькулятора
- `apps/web/app/[locale]/exchange/page.tsx` - страница обмена
- `apps/web/src/components/ExchangeOrderForm.tsx` - форма заказа

**Файлы для модификации:**

- `apps/web/src/components/HeroSection.tsx` - интеграция калькулятора

**Переиспользованные компоненты:**

- `@repo/ui` - все UI компоненты
- `@repo/hooks/useForm` - валидация форм
- `@repo/hooks/useNotifications` - уведомления
- `@repo/constants/CRYPTOCURRENCIES` - список валют
- `apps/web/src/hooks/useExchangeMutation` - мутация для создания заказа

**Новые зависимости:**

- НЕТ - используются только существующие

### 📝 ДЕТАЛЬНЫЙ ЧЕКЛИСТ ДЛЯ ВЫПОЛНЕНИЯ

**TASK 5.2.1 - Интеграция калькулятора:**

- [ ] Модифицировать HeroSection.tsx - добавить ExchangeCalculator
- [ ] Создать ExchangeCalculator.tsx с полным функционалом
- [ ] Реализовать схему валидации calculatorSchema
- [ ] Добавить форму с выбором валюты и вводом суммы
- [ ] Реализовать mock расчет с setTimeout
- [ ] Добавить отображение результата расчета
- [ ] Реализовать переход на /exchange с URL параметрами
- [ ] Обеспечить адаптивный дизайн
- [ ] Добавить валидацию формы
- [ ] Реализовать loading состояние при расчете

**TASK 5.2.2 - Создание страницы Exchange:**

- [ ] Создать папку apps/web/app/[locale]/exchange/
- [ ] Создать page.tsx с metadata и локализацией
- [ ] Создать ExchangeOrderForm.tsx компонент
- [ ] Реализовать orderFormSchema с полной валидацией
- [ ] Добавить получение URL параметров через useEffect
- [ ] Создать карточку сводки по обмену
- [ ] Реализовать форму с email и банковскими данными
- [ ] Добавить базовую проверку на робота (checkbox)
- [ ] Обработать случай отсутствия данных расчета
- [ ] Интегрировать с useExchangeMutation
- [ ] Реализовать переход на страницу заказа
- [ ] Обеспечить адаптивный дизайн

### 📝 ВАЖНЫЕ ЗАМЕТКИ ДЛЯ ВЫПОЛНЕНИЯ

1. **НЕ ПРЕДПОЛАГАТЬ** - все технические требования указаны точно
2. **Rule 20** - вся логика реализована в компонентах, не в страницах
3. **Переиспользование** - максимальное использование существующих компонентов
4. **Простота** - базовый уровень, без сложной логики
5. **Валидация** - использовать существующие схемы и хуки
6. **Роутинг** - использовать Next.js App Router
7. **Типизация** - использовать существующие типы из @repo

---

**Дата создания:** 11 июля 2025  
**Версия:** 2.0 (переработано под новую архитектуру)  
**Следующая подчасть:** TASKS-PART-5.3.md (дополнительные фичи)
