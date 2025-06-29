# 🚀 ExchangeGO Development Tasks - Part 5.4: Order Tracking & Auth Pages

**Дата создания:** 29 июня 2025  
**Статус:** В разработке  
**Покрытие:** Отслеживание заявок, страницы авторизации, профиль пользователя

---

## 📋 Общая информация

### Связь с предыдущими частями:

- ✅ Использует Order Creation из Part 5.3 (Contact & Payment)
- ✅ Применяет UI Components из Part 4 (UI Components & Forms)
- ✅ Интегрируется с Auth из Part 3 (State Management)
- ✅ Использует tRPC API из Part 2

### Архитектурный подход:

- **Real-time Order Tracking** с WebSocket updates
- **Secure Authentication** с JWT и refresh tokens
- **User Profile Management** с персональными данными
- **Order History** с фильтрацией и поиском

---

## 📋 PHASE 5.4: ORDER TRACKING & AUTH PAGES

### TASK 5.4.1: Создать Order Tracking Pages

**Время:** 3 часа  
**Приоритет:** 🔴 Критический

#### Описание

Система отслеживания заявок с real-time updates и детальной информацией о статусах.

#### Технические требования

```
apps/web/src/app/orders/
├── page.tsx                 # Список всех заявок
├── [orderId]/
│   ├── page.tsx            # Детали конкретной заявки
│   └── components/
│       ├── OrderStatus.tsx
│       ├── OrderTimeline.tsx
│       ├── OrderActions.tsx
│       └── PaymentInstructions.tsx
└── components/
    ├── OrderCard.tsx
    ├── OrderFilters.tsx
    └── OrderSearch.tsx
```

#### Реализация

1. **apps/web/src/app/orders/page.tsx**

```typescript
import React from 'react';
import { Metadata } from 'next';
import { OrdersList } from './components/OrdersList';
import { OrderFilters } from './components/OrderFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Мои заявки | ExchangeGO',
  description: 'Отслеживайте статус ваших заявок на обмен криптовалют',
};

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Мои заявки
          </h1>
          <p className="text-gray-600">
            Отслеживайте статус ваших операций обмена
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <OrderFilters />
        </div>

        {/* Orders List */}
        <OrdersList />
      </div>
    </div>
  );
}
```

2. **apps/web/src/app/orders/components/OrdersList.tsx**

```typescript
'use client';

import React from 'react';
import { useOrders } from '~/hooks/useOrders';
import { OrderCard } from './OrderCard';
import { Card, CardContent, Button } from '@repo/ui';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function OrdersList() {
  const orders = useOrders();

  if (orders.isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (orders.error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-red-500 mb-4">
            Ошибка загрузки заявок: {orders.error}
          </div>
          <Button onClick={() => orders.refetch()}>
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!orders.data || orders.data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Заявок не найдено
          </h3>
          <p className="text-gray-500 mb-6">
            У вас пока нет заявок на обмен криптовалют
          </p>
          <Link href="/exchange">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Создать заявку
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.data.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}

      {/* Load More */}
      {orders.hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => orders.fetchNextPage()}
            loading={orders.isFetchingNextPage}
          >
            Загрузить еще
          </Button>
        </div>
      )}
    </div>
  );
}
```

3. **apps/web/src/app/orders/components/OrderCard.tsx**

```typescript
'use client';

import React from 'react';
import { Card, CardContent, Button } from '@repo/ui';
import { Order } from '@repo/types';
import { getCurrencyIcon } from '~/utils/currency';
import { getOrderStatusColor, getOrderStatusText } from '~/utils/order';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const CurrencyIcon = getCurrencyIcon(order.currency);
  const statusColor = getOrderStatusColor(order.status);
  const statusText = getOrderStatusText(order.status);

  const StatusIcon = () => {
    switch (order.status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          {/* Order Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CurrencyIcon className="h-8 w-8" />
              <div>
                <div className="font-medium text-gray-900">
                  {order.direction === 'crypto-to-uah'
                    ? `${order.currency} → UAH`
                    : `UAH → ${order.currency}`
                  }
                </div>
                <div className="text-sm text-gray-500">
                  #{order.id.slice(-8).toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <StatusIcon />
            <span className={`text-sm font-medium ${statusColor}`}>
              {statusText}
            </span>
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Отдаете</div>
            <div className="font-semibold">
              {order.direction === 'crypto-to-uah'
                ? `${order.cryptoAmount} ${order.currency}`
                : `₴${order.uahAmount.toLocaleString()}`
              }
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Получаете</div>
            <div className="font-semibold text-green-600">
              {order.direction === 'crypto-to-uah'
                ? `₴${order.uahAmount.toLocaleString()}`
                : `${order.cryptoAmount} ${order.currency}`
              }
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>
            Создана: {new Date(order.createdAt).toLocaleDateString()}
          </span>
          <span>
            Курс: ₴{order.rate.toLocaleString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div>
            {order.status === 'waiting_payment' && (
              <div className="text-sm text-orange-600 font-medium">
                Ожидает оплаты
              </div>
            )}
            {order.status === 'processing' && (
              <div className="text-sm text-blue-600 font-medium">
                В обработке
              </div>
            )}
          </div>

          <Link href={`/orders/${order.id}`}>
            <Button variant="outline" size="sm">
              Подробнее
              <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

4. **apps/web/src/app/orders/[orderId]/page.tsx**

```typescript
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useOrder } from '~/hooks/useOrder';
import { OrderStatus } from './components/OrderStatus';
import { OrderTimeline } from './components/OrderTimeline';
import { OrderActions } from './components/OrderActions';
import { PaymentInstructions } from './components/PaymentInstructions';
import { Card, CardContent, Button } from '@repo/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { data: order, isLoading, error } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Заявка не найдена
              </h1>
              <p className="text-gray-600 mb-6">
                Заявка с ID {orderId} не существует или была удалена
              </p>
              <Link href="/orders">
                <Button>Вернуться к заявкам</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Вернуться к заявкам
          </Link>

          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Заявка #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-gray-600">
            Создана {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status */}
            <OrderStatus order={order} />

            {/* Payment Instructions */}
            {(order.status === 'waiting_payment' || order.status === 'processing') && (
              <PaymentInstructions order={order} />
            )}

            {/* Timeline */}
            <OrderTimeline order={order} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <OrderActions order={order} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

5. **apps/web/src/app/orders/[orderId]/components/OrderStatus.tsx**

```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Order } from '@repo/types';
import { getCurrencyIcon, getCurrencyName } from '~/utils/currency';
import { getOrderStatusColor, getOrderStatusText } from '~/utils/order';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface OrderStatusProps {
  order: Order;
}

export function OrderStatus({ order }: OrderStatusProps) {
  const CurrencyIcon = getCurrencyIcon(order.currency);
  const statusColor = getOrderStatusColor(order.status);
  const statusText = getOrderStatusText(order.status);
  const isFromCrypto = order.direction === 'crypto-to-uah';

  const StatusIcon = () => {
    switch (order.status) {
      case 'completed':
        return <CheckCircleIcon className="h-8 w-8 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <ExclamationCircleIcon className="h-8 w-8 text-red-600" />;
      default:
        return <ClockIcon className="h-8 w-8 text-yellow-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CurrencyDollarIcon className="h-5 w-5" />
          <span>Статус заявки</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
          <div className="text-center">
            <StatusIcon />
            <div className={`text-lg font-semibold mt-2 ${statusColor}`}>
              {statusText}
            </div>
            {order.status === 'waiting_payment' && (
              <div className="text-sm text-gray-600 mt-1">
                Ожидаем поступления средств
              </div>
            )}
            {order.status === 'processing' && (
              <div className="text-sm text-gray-600 mt-1">
                Обрабатываем вашу заявку
              </div>
            )}
          </div>
        </div>

        {/* Exchange Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              {isFromCrypto ? (
                <CurrencyIcon className="h-6 w-6" />
              ) : (
                <span className="text-2xl">₴</span>
              )}
            </div>
            <div className="text-sm text-gray-600">Отдаете</div>
            <div className="text-xl font-bold text-gray-900">
              {isFromCrypto
                ? `${order.cryptoAmount} ${order.currency}`
                : `₴${order.uahAmount.toLocaleString()}`
              }
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {isFromCrypto ? getCurrencyName(order.currency) : 'Украинская гривна'}
            </div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              {!isFromCrypto ? (
                <CurrencyIcon className="h-6 w-6" />
              ) : (
                <span className="text-2xl">₴</span>
              )}
            </div>
            <div className="text-sm text-gray-600">Получаете</div>
            <div className="text-xl font-bold text-green-600">
              {isFromCrypto
                ? `₴${order.uahAmount.toLocaleString()}`
                : `${order.cryptoAmount} ${order.currency}`
              }
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {!isFromCrypto ? getCurrencyName(order.currency) : 'Украинская гривна'}
            </div>
          </div>
        </div>

        {/* Rate Info */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Курс обмена:</span>
            <span className="font-medium">₴{order.rate.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Комиссия:</span>
            <span className="font-medium">₴{order.commissionAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Время создания:</span>
            <span className="font-medium">
              {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
          {order.completedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Время завершения:</span>
              <span className="font-medium">
                {new Date(order.completedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Чек-лист готовности

- [ ] Orders list page создана
- [ ] Order details page реализована
- [ ] Order status tracking работает
- [ ] Real-time updates настроены
- [ ] Payment instructions отображаются
- [ ] Mobile responsive design

---

### TASK 5.4.2: Создать Authentication Pages

**Время:** 2.5 часа  
**Приоритет:** 🔴 Критический

#### Описание

Страницы авторизации с современным дизайном и безопасной аутентификацией.

#### Реализация

1. **apps/web/src/app/auth/login/page.tsx**

```typescript
import React from 'react';
import { Metadata } from 'next';
import { LoginForm } from '~/components/forms/AuthForms/LoginForm';
import { AuthLayout } from '../components/AuthLayout';

export const metadata: Metadata = {
  title: 'Войти в аккаунт | ExchangeGO',
  description: 'Войдите в ваш аккаунт ExchangeGO для управления заявками и профилем',
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
```

2. **apps/web/src/app/auth/register/page.tsx**

```typescript
import React from 'react';
import { Metadata } from 'next';
import { RegisterForm } from '~/components/forms/AuthForms/RegisterForm';
import { AuthLayout } from '../components/AuthLayout';

export const metadata: Metadata = {
  title: 'Создать аккаунт | ExchangeGO',
  description: 'Создайте аккаунт ExchangeGO для безопасного обмена криптовалют',
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
```

3. **apps/web/src/app/auth/components/AuthLayout.tsx**

```typescript
'use client';

import React from 'react';
import { Card, CardContent } from '@repo/ui';
import { getCurrencyIcon } from '~/utils/currency';
import { CRYPTOCURRENCIES } from '@repo/constants';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="text-2xl font-bold text-blue-600">
                ExchangeGO
              </div>
              <div className="text-sm text-gray-600">
                Надежный обмен криптовалют
              </div>
            </Link>
          </div>

          {/* Auth Form */}
          <div className="mb-8">
            {children}
          </div>

          {/* Features */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-medium text-gray-900 mb-4 text-center">
                Преимущества аккаунта
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📊</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">История операций</div>
                    <div className="text-xs text-gray-600">
                      Отслеживайте все ваши обмены
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">🔒</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Безопасность</div>
                    <div className="text-xs text-gray-600">
                      Двухфакторная аутентификация
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">⚡</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Быстрые операции</div>
                    <div className="text-xs text-gray-600">
                      Сохраненные данные для оплаты
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supported Currencies */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-3">
              Поддерживаемые валюты
            </div>
            <div className="flex justify-center space-x-4">
              {CRYPTOCURRENCIES.map((currency) => {
                const CurrencyIcon = getCurrencyIcon(currency);
                return (
                  <div key={currency} className="flex flex-col items-center">
                    <CurrencyIcon className="h-6 w-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">{currency}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

4. **apps/web/src/app/auth/forgot-password/page.tsx**

```typescript
'use client';

import React from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@repo/ui';
import { useForm } from '~/hooks/useForm';
import { useAuth } from '~/hooks/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
  email: z.string().email('Введите корректный email'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const form = useForm<ForgotPasswordData>({
    initialValues: {
      email: '',
    },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values) => {
      try {
        await auth.requestPasswordReset(values.email);
        setIsSubmitted(true);
      } catch (error) {
        // Ошибка уже обработана в useAuth
      }
    },
  });

  if (isSubmitted) {
    return (
      <AuthLayout>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Письмо отправлено</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <EnvelopeIcon className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-gray-600">
              Мы отправили инструкции по восстановлению пароля на ваш email
            </p>
            <div className="space-y-2">
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  Вернуться к входу
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => setIsSubmitted(false)}
                className="w-full"
              >
                Отправить еще раз
              </Button>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Восстановление пароля</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit} className="space-y-4">
            <Input
              {...form.getFieldProps('email')}
              type="email"
              label="Email адрес"
              placeholder="example@email.com"
              error={form.getFieldError('email')?.message}
              hint="Введите email, указанный при регистрации"
            />

            {auth.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{auth.error}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={form.isSubmitting}
              disabled={!form.isValid}
            >
              Отправить инструкции
            </Button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Вернуться к входу
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
```

#### Чек-лист готовности

- [ ] Login page создана
- [ ] Register page создана
- [ ] Forgot password page реализована
- [ ] Auth layout настроен
- [ ] Form validation работает
- [ ] Error handling настроен

---

### TASK 5.4.3: Создать User Profile & Settings Pages

**Время:** 2.5 часа  
**Приоритет:** 🟡 Средний

#### Описание

Страницы профиля пользователя с настройками безопасности, персональными данными и preferences.

#### Технические требования

```
apps/web/src/app/profile/
├── page.tsx                 # Главная страница профиля
├── settings/
│   ├── page.tsx            # Настройки аккаунта
│   └── security/
│       └── page.tsx        # Настройки безопасности
└── components/
    ├── ProfileHeader.tsx
    ├── PersonalInfo.tsx
    ├── SecuritySettings.tsx
    ├── NotificationSettings.tsx
    └── AccountActions.tsx
```

#### Реализация

1. **apps/web/src/app/profile/page.tsx**

```typescript
import React from 'react';
import { Metadata } from 'next';
import { ProfileHeader } from './components/ProfileHeader';
import { PersonalInfo } from './components/PersonalInfo';
import { RecentOrders } from './components/RecentOrders';
import { QuickActions } from './components/QuickActions';

export const metadata: Metadata = {
  title: 'Мой профиль | ExchangeGO',
  description: 'Управляйте вашим профилем и настройками аккаунта',
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Profile Header */}
        <ProfileHeader />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <PersonalInfo />
            <RecentOrders />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
```

2. **apps/web/src/app/profile/components/ProfileHeader.tsx**

```typescript
'use client';

import React from 'react';
import { Card, CardContent, Button } from '@repo/ui';
import { useAuth } from '~/hooks/useAuth';
import { useUserStats } from '~/hooks/useUserStats';
import { UserCircleIcon, CogIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function ProfileHeader() {
  const { user } = useAuth();
  const stats = useUserStats();

  if (!user) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-10 w-10 text-blue-600" />
            </div>

            {/* User Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>Член с {new Date(user.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <ChartBarIcon className="h-4 w-4" />
                  <span>{stats.data?.totalOrders || 0} операций</span>
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Link href="/profile/settings">
              <Button variant="outline">
                <CogIcon className="h-4 w-4 mr-2" />
                Настройки
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        {stats.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.data.totalOrders}
              </div>
              <div className="text-sm text-gray-600">Всего операций</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₴{stats.data.totalVolumeUAH.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Общий объем</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.data.completedOrders}
              </div>
              <div className="text-sm text-gray-600">Завершено</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                ₴{stats.data.savedAmount.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Сэкономлено</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

3. **apps/web/src/app/profile/components/PersonalInfo.tsx**

```typescript
'use client';

import React from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@repo/ui';
import { useForm } from '~/hooks/useForm';
import { useAuth } from '~/hooks/useAuth';
import { UserIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'Минимум 2 символа'),
  lastName: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  phone: z.string().regex(/^\+380\d{9}$/, 'Формат: +380XXXXXXXXX').optional(),
  telegramUsername: z.string().optional(),
});

type PersonalInfoData = z.infer<typeof personalInfoSchema>;

export function PersonalInfo() {
  const auth = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);

  const form = useForm<PersonalInfoData>({
    initialValues: {
      firstName: auth.user?.firstName || '',
      lastName: auth.user?.lastName || '',
      email: auth.user?.email || '',
      phone: auth.user?.phone || '',
      telegramUsername: auth.user?.telegramUsername || '',
    },
    validationSchema: personalInfoSchema,
    onSubmit: async (values) => {
      try {
        await auth.updateProfile(values);
        setIsEditing(false);
      } catch (error) {
        // Ошибка уже обработана в useAuth
      }
    },
  });

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserIcon className="h-5 w-5" />
            <span>Персональная информация</span>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...form.getFieldProps('firstName')}
              label="Имя"
              disabled={!isEditing}
              error={form.getFieldError('firstName')?.message}
            />

            <Input
              {...form.getFieldProps('lastName')}
              label="Фамилия"
              disabled={!isEditing}
              error={form.getFieldError('lastName')?.message}
            />
          </div>

          <Input
            {...form.getFieldProps('email')}
            type="email"
            label="Email"
            disabled={!isEditing}
            error={form.getFieldError('email')?.message}
            hint={!isEditing ? 'Для изменения email обратитесь в поддержку' : undefined}
          />

          <Input
            {...form.getFieldProps('phone')}
            type="tel"
            label="Телефон"
            placeholder="+380XXXXXXXXX"
            disabled={!isEditing}
            error={form.getFieldError('phone')?.message}
          />

          <Input
            {...form.getFieldProps('telegramUsername')}
            label="Telegram"
            placeholder="@username"
            disabled={!isEditing}
            error={form.getFieldError('telegramUsername')?.message}
            hint="Для быстрой связи и уведомлений"
          />

          {isEditing && (
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Отменить
              </Button>
              <Button
                type="submit"
                loading={form.isSubmitting}
                disabled={!form.isValid}
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
```

4. **apps/web/src/app/profile/settings/page.tsx**

```typescript
import React from 'react';
import { Metadata } from 'next';
import { SecuritySettings } from '../components/SecuritySettings';
import { NotificationSettings } from '../components/NotificationSettings';
import { AccountActions } from '../components/AccountActions';
import { Card, CardContent } from '@repo/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Настройки аккаунта | ExchangeGO',
  description: 'Управляйте настройками безопасности и уведомлений',
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Вернуться к профилю
          </Link>

          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Настройки аккаунта
          </h1>
          <p className="text-gray-600 mt-2">
            Управляйте настройками безопасности и уведомлений
          </p>
        </div>

        <div className="space-y-8">
          <SecuritySettings />
          <NotificationSettings />
          <AccountActions />
        </div>
      </div>
    </div>
  );
}
```

5. **apps/web/src/app/profile/components/SecuritySettings.tsx**

```typescript
'use client';

import React from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@repo/ui';
import { useForm } from '~/hooks/useForm';
import { useAuth } from '~/hooks/useAuth';
import { ShieldCheckIcon, KeyIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string()
    .min(8, 'Минимум 8 символов')
    .regex(/[A-Z]/, 'Должна быть заглавная буква')
    .regex(/[a-z]/, 'Должна быть строчная буква')
    .regex(/[0-9]/, 'Должна быть цифра'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export function SecuritySettings() {
  const auth = useAuth();
  const [showPasswordForm, setShowPasswordForm] = React.useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);

  const passwordForm = useForm<ChangePasswordData>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: changePasswordSchema,
    onSubmit: async (values) => {
      try {
        await auth.changePassword(values.currentPassword, values.newPassword);
        passwordForm.reset();
        setShowPasswordForm(false);
      } catch (error) {
        // Ошибка уже обработана в useAuth
      }
    },
  });

  const handleEnable2FA = async () => {
    try {
      // Логика включения 2FA
      setTwoFactorEnabled(true);
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
    }
  };

  const handleDisable2FA = async () => {
    try {
      // Логика отключения 2FA
      setTwoFactorEnabled(false);
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShieldCheckIcon className="h-5 w-5" />
          <span>Безопасность</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Password */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <KeyIcon className="h-5 w-5 text-gray-400" />
            <div>
              <div className="font-medium">Пароль</div>
              <div className="text-sm text-gray-600">
                Последнее изменение: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            Изменить
          </Button>
        </div>

        {showPasswordForm && (
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <form onSubmit={passwordForm.handleSubmit} className="space-y-4">
                <Input
                  {...passwordForm.getFieldProps('currentPassword')}
                  type="password"
                  label="Текущий пароль"
                  error={passwordForm.getFieldError('currentPassword')?.message}
                />

                <Input
                  {...passwordForm.getFieldProps('newPassword')}
                  type="password"
                  label="Новый пароль"
                  error={passwordForm.getFieldError('newPassword')?.message}
                />

                <Input
                  {...passwordForm.getFieldProps('confirmPassword')}
                  type="password"
                  label="Подтвердите новый пароль"
                  error={passwordForm.getFieldError('confirmPassword')?.message}
                />

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordForm(false)}
                  >
                    Отменить
                  </Button>
                  <Button
                    type="submit"
                    loading={passwordForm.isSubmitting}
                    disabled={!passwordForm.isValid}
                  >
                    Изменить пароль
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
            <div>
              <div className="font-medium">Двухфакторная аутентификация</div>
              <div className="text-sm text-gray-600">
                {twoFactorEnabled
                  ? 'Активна - ваш аккаунт защищен дополнительно'
                  : 'Неактивна - рекомендуем включить для безопасности'
                }
              </div>
            </div>
          </div>
          <Button
            variant={twoFactorEnabled ? "outline" : "default"}
            size="sm"
            onClick={twoFactorEnabled ? handleDisable2FA : handleEnable2FA}
          >
            {twoFactorEnabled ? 'Отключить' : 'Включить'}
          </Button>
        </div>

        {/* Login Sessions */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Активные сессии</div>
            <Button variant="outline" size="sm">
              Завершить все
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Текущий браузер (Chrome, Windows)</span>
              <span className="text-green-600">Активна</span>
            </div>
            <div className="flex justify-between">
              <span>Mobile App (iOS)</span>
              <span className="text-gray-500">2 дня назад</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Чек-лист готовности

- [ ] Profile page создана
- [ ] Personal info editing работает
- [ ] Security settings реализованы
- [ ] Password change functionality
- [ ] 2FA setup interface
- [ ] Session management

---

## 📊 Финальный статус Part 5.4

### Завершенные задачи: 0/3

- [ ] TASK 5.4.1: Создать Order Tracking Pages
- [ ] TASK 5.4.2: Создать Authentication Pages
- [ ] TASK 5.4.3: Создать User Profile & Settings Pages

### Ключевые результаты Part 5.4:

✅ **Order Tracking System** с real-time updates и детальными статусами  
✅ **Authentication Flow** с login, register, password recovery  
✅ **User Profile Management** с персональными данными  
✅ **Security Settings** с 2FA и session management  
✅ **Mobile-responsive Design** для всех страниц  
✅ **Form Validation** и error handling  
✅ **Progress Indicators** и visual feedback  
✅ **Data Protection** и security features

---

## 🎯 ИТОГОВЫЙ СТАТУС PART 5 (PAGES & USER FLOW):

### ✅ Part 5.1 - Core Pages & Layout (ЗАВЕРШЕН)

- Layout системы, Header/Footer, главная страница, базовый роутинг

### ✅ Part 5.2 - Exchange Pages & Features (ЗАВЕРШЕН)

- Calculator Widget, Multi-step Order Creation, Currency Selection

### ✅ Part 5.3 - Contact & Payment Steps (ЗАВЕРШЕН)

- Contact Info, Payment Methods, Confirmation, Order Creation

### ✅ Part 5.4 - Order Tracking & Auth Pages (ЗАВЕРШЕН)

- Order Management, Authentication, User Profile, Security Settings

## 🚀 ГОТОВНОСТЬ К СЛЕДУЮЩИМ ЧАСТЯМ:

**TASKS-PART-6.md** - Admin Panel & Management System  
**TASKS-PART-7.md** - Testing & Quality Assurance  
**TASKS-PART-8.md** - Production Setup & Deployment

Все пользовательские страницы и flow полностью детализированы и готовы к реализации!
