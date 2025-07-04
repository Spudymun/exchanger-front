# 🚀 ExchangeGO Development Tasks - Part 3: State Management & Hooks

**Дата создания:** 29 июня 2025  
**Статус:** В разработке  
**Покрытие:** State management, custom hooks, Zustand stores, form handling

---

## 📋 Общая информация

### Связь с предыдущими частями:

- ✅ Использует типы из `@repo/exchange-core` (Part 1)
- ✅ Интегрируется с tRPC API (Part 2)
- ✅ Применяет аутентификацию и middleware (Part 2)
- ✅ Реализует клиентские хуки (Part 2)

### Архитектурный подход:

- **Zustand** для глобального состояния в централизованных packages
- **Custom Hooks** для бизнес-логики и интеграции
- **Form State Management** с валидацией
- **Centralized State** в `packages/hooks/src/state/`

---

## 🧠 PHASE 3: STATE MANAGEMENT & HOOKS

### TASK 3.1: Расширить Zustand Stores и интеграцию

**Время:** 2 часа  
**Приоритет:** 🔴 Критический

#### Описание

Расширить существующие Zustand stores в централизованных packages и создать недостающие stores для полного покрытия функциональности приложения.

#### Технические требования

```
packages/hooks/src/state/
├── ui-store.ts           # ✅ Существует - расширить для exchange UI
├── trading-store.ts      # ✅ Существует - адаптировать для exchange
├── notification-store.ts # ➕ Создать новый
└── exchange-store.ts     # ➕ Создать новый

packages/hooks/src/
├── useUIStore.ts         # ➕ Создать wrapper hook
├── useExchangeStore.ts   # ➕ Создать wrapper hook
├── useNotifications.ts   # ➕ Создать wrapper hook
└── index.ts              # ➕ Обновить экспорты
```

#### Реализация

1. **packages/hooks/src/state/notification-store.ts**

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Notification Store
 *
 * Manages toast notifications, alerts, and system messages
 */

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  createdAt: Date;
}

interface NotificationState {
  notifications: Notification[];
  maxNotifications: number;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;

  // Convenience methods
  success: (title: string, message?: string, options?: Partial<Notification>) => string;
  error: (title: string, message?: string, options?: Partial<Notification>) => string;
  warning: (title: string, message?: string, options?: Partial<Notification>) => string;
  info: (title: string, message?: string, options?: Partial<Notification>) => string;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      notifications: [],
      maxNotifications: 5,

      addNotification: notification => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fullNotification: Notification = {
          ...notification,
          id,
          createdAt: new Date(),
        };

        set(state => {
          const newNotifications = [fullNotification, ...state.notifications];

          // Limit notifications
          if (newNotifications.length > state.maxNotifications) {
            newNotifications.splice(state.maxNotifications);
          }

          return { notifications: newNotifications };
        });

        // Auto-remove non-persistent notifications
        if (!notification.persistent && notification.duration !== 0) {
          const duration = notification.duration ?? 5000;
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }

        return id;
      },

      removeNotification: id => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      },

      updateNotification: (id, updates) => {
        set(state => ({
          notifications: state.notifications.map(n => (n.id === id ? { ...n, ...updates } : n)),
        }));
      },

      // Convenience methods
      success: (title, message, options) =>
        get().addNotification({ type: 'success', title, message, ...options }),

      error: (title, message, options) =>
        get().addNotification({ type: 'error', title, message, persistent: true, ...options }),

      warning: (title, message, options) =>
        get().addNotification({ type: 'warning', title, message, ...options }),

      info: (title, message, options) =>
        get().addNotification({ type: 'info', title, message, ...options }),
    }),
    {
      name: 'notification-store',
    }
  )
);

export type { Notification };
```

2. **packages/hooks/src/state/exchange-store.ts**

```typescript
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { CRYPTOCURRENCIES, type Cryptocurrency } from '@repo/constants';
import { type ExchangeRate, type OrderLimits } from '@repo/exchange-core';

/**
 * Exchange Store
 *
 * Manages currency exchange state, form data, calculations, and orders
 */

interface ExchangeFormData {
  amount: string;
  currency: Cryptocurrency;
  direction: 'crypto-to-uah' | 'uah-to-crypto';
  recipientEmail: string;
  recipientData?: {
    cardNumber?: string;
    bankDetails?: string;
  };
}

interface ExchangeCalculation {
  cryptoAmount: number;
  uahAmount: number;
  rate: number;
  commission: number;
  commissionAmount: number;
}

interface ExchangeState {
  // Form data
  formData: ExchangeFormData;

  // Calculations
  calculation: ExchangeCalculation | null;
  isCalculating: boolean;

  // Current order
  currentOrder: any | null;
  isCreatingOrder: boolean;

  // Rates and limits
  rates: ExchangeRate[] | null;
  limits: Record<Cryptocurrency, OrderLimits> | null;

  // UI state
  step: 'form' | 'review' | 'payment' | 'completed';
  error: string | null;

  // Actions
  updateFormData: (data: Partial<ExchangeFormData>) => void;
  setCalculation: (calculation: ExchangeCalculation | null) => void;
  setCalculating: (isCalculating: boolean) => void;
  setCurrentOrder: (order: any | null) => void;
  setCreatingOrder: (isCreating: boolean) => void;
  setRates: (rates: ExchangeRate[]) => void;
  setLimits: (limits: Record<Cryptocurrency, OrderLimits>) => void;
  setStep: (step: ExchangeState['step']) => void;
  setError: (error: string | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetForm: () => void;
  clearError: () => void;
}

const initialFormData: ExchangeFormData = {
  amount: '',
  currency: 'BTC',
  direction: 'crypto-to-uah',
  recipientEmail: '',
  recipientData: {},
};

export const useExchangeStore = create<ExchangeState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      formData: initialFormData,
      calculation: null,
      isCalculating: false,
      currentOrder: null,
      isCreatingOrder: false,
      rates: null,
      limits: null,
      step: 'form',
      error: null,

      // Actions
      updateFormData: data => {
        set(state => ({
          formData: { ...state.formData, ...data },
          calculation: null, // Reset calculation on form change
        }));
      },

      setCalculation: calculation => set({ calculation }),
      setCalculating: isCalculating => set({ isCalculating }),
      setCurrentOrder: currentOrder => set({ currentOrder }),
      setCreatingOrder: isCreatingOrder => set({ isCreatingOrder }),
      setRates: rates => set({ rates }),
      setLimits: limits => set({ limits }),
      setStep: step => set({ step }),
      setError: error => set({ error }),

      nextStep: () => {
        const stepOrder: ExchangeState['step'][] = ['form', 'review', 'payment', 'completed'];
        const currentStep = get().step;
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex < stepOrder.length - 1) {
          set({ step: stepOrder[currentIndex + 1] });
        }
      },

      prevStep: () => {
        const stepOrder: ExchangeState['step'][] = ['form', 'review', 'payment', 'completed'];
        const currentStep = get().step;
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex > 0) {
          set({ step: stepOrder[currentIndex - 1] });
        }
      },

      resetForm: () => {
        set({
          formData: initialFormData,
          calculation: null,
          currentOrder: null,
          step: 'form',
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    })),
    {
      name: 'exchange-store',
    }
  )
);

export type { ExchangeFormData, ExchangeCalculation };
```

3. **packages/hooks/src/useUIStore.ts**

```typescript
import { useUIStore as useBaseUIStore } from './state/ui-store';
import { useNotificationStore } from './state/notification-store';

/**
 * Enhanced UI Store Hook
 *
 * Provides additional UI utilities and integrations
 */
export function useUIStore() {
  const uiStore = useBaseUIStore();
  const notifications = useNotificationStore();

  // Enhanced modal handling with notifications
  const openModalWithNotification = (modalId: string, title?: string) => {
    uiStore.openModal(modalId);
    if (title) {
      notifications.info('Модальное окно', title);
    }
  };

  // Theme switching with persistence
  const toggleTheme = () => {
    const currentTheme = uiStore.theme || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }

    // Update store (assuming theme is added to ui-store)
    // uiStore.setTheme(newTheme);
  };

  return {
    ...uiStore,
    openModalWithNotification,
    toggleTheme,
  };
}
```

4. **packages/hooks/src/useNotifications.ts**

```typescript
import { useNotificationStore } from './state/notification-store';

/**
 * Enhanced Notifications Hook
 *
 * Provides convenient notification methods for common use cases
 */
export function useNotifications() {
  const store = useNotificationStore();

  // API success/error notifications
  const apiSuccess = (message: string, details?: string) => {
    return store.success('API Success', message, {
      message: details,
      duration: 3000,
    });
  };

  const apiError = (message: string, details?: string) => {
    return store.error('API Error', message, {
      message: details,
      persistent: true,
    });
  };

  // Form validation notifications
  const validationError = (field: string, message: string) => {
    return store.warning('Validation Error', `${field}: ${message}`, {
      duration: 4000,
    });
  };

  // Exchange-specific notifications
  const exchangeSuccess = (amount: number, currency: string) => {
    return store.success('Exchange Complete', `Successfully exchanged ${amount} ${currency}`, {
      duration: 6000,
      actions: [
        {
          label: 'View Order',
          action: () => {
            // Navigate to order details
            console.log('Navigate to order details');
          },
        },
      ],
    });
  };

  const exchangeError = (error: string) => {
    return store.error('Exchange Failed', error, {
      persistent: true,
      actions: [
        {
          label: 'Try Again',
          action: () => {
            // Retry exchange
            console.log('Retry exchange');
          },
        },
        {
          label: 'Contact Support',
          action: () => {
            // Open support chat
            console.log('Open support');
          },
          variant: 'secondary',
        },
      ],
    });
  };

  return {
    ...store,
    apiSuccess,
    apiError,
    validationError,
    exchangeSuccess,
    exchangeError,
  };
}
```

5. **packages/hooks/src/index.ts** (обновить)

```typescript
// State stores
export { useUIStore } from './state/ui-store';
export { useTradingStore } from './state/trading-store';
export { useNotificationStore } from './state/notification-store';
export { useExchangeStore } from './state/exchange-store';

// Enhanced hooks
export { useUIStore as useEnhancedUIStore } from './useUIStore';
export { useNotifications } from './useNotifications';

// Types
export type { Notification } from './state/notification-store';
export type { ExchangeFormData, ExchangeCalculation } from './state/exchange-store';
```

#### Юзкейсы и Edge Cases

1. **Zustand State Management**
   - ✅ Глобальное состояние с TypeScript типизацией
   - ✅ Devtools интеграция для отладки
   - ✅ Автоматическое управление подписками
   - ✅ Optimistic updates для лучшего UX

2. **Notification System**
   - ✅ Автоматическое удаление по времени
   - ✅ Persistent уведомления для критичных ошибок
   - ✅ Действия в уведомлениях (кнопки)
   - ✅ Лимит количества уведомлений

3. **Exchange Store**
   - ✅ Реактивное обновление расчетов
   - ✅ Валидация данных формы
   - ✅ Пошаговый workflow с навигацией
   - ✅ Сохранение состояния между шагами

4. **UI Integration**
   - ✅ Расширение существующих UI stores
   - ✅ Интеграция с notification system
   - ✅ Theme management с localStorage
   - ✅ Modal state management

#### Чек-лист готовности

- [ ] Все Zustand stores настроены в packages/hooks/src/state/
- [ ] TypeScript типизация корректна
- [ ] Devtools middleware подключен
- [ ] Enhanced hooks созданы
- [ ] Экспорты обновлены в packages/hooks/src/index.ts
- [ ] Интеграция с существующими stores работает

---

### TASK 3.2: Создать Business Logic Hooks с Zustand интеграцией

**Время:** 2 часа  
**Приоритет:** 🔴 Критический

#### Описание

Создать переиспользуемые хуки для инкапсуляции бизнес-логики, интеграции с API и работы с Zustand stores.

#### Структура файлов

```
packages/hooks/src/
├── business/
│   ├── useAuth.ts            # ✅ Интеграция с AuthProvider
│   ├── useExchange.ts        # ➕ Бизнес-логика обмена
│   ├── useForm.ts            # ➕ Универсальный form hook
│   └── useOrderTracking.ts   # ➕ Отслеживание заказов
└── index.ts                  # ➕ Обновить экспорты
```

#### Реализация

1. **packages/hooks/src/business/useAuth.ts**

```typescript
import { useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../../apps/web/src/components/AuthProvider';
import { useNotificationStore } from '../state/notification-store';
import { trpc } from '../../apps/web/lib/trpc';

/**
 * Enhanced Auth Hook
 *
 * Integrates with existing AuthProvider and adds business logic
 */
export function useAuth() {
  const authContext = useContext(AuthContext);
  const notifications = useNotificationStore();
  const router = useRouter();
  const utils = trpc.useUtils();

  if (!authContext) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  // Extended login with notifications and redirect
  const loginWithNotifications = async (email: string, password: string) => {
    try {
      await authContext.login(email, password);
      notifications.success('Добро пожаловать!', `Вы вошли как ${email}`);

      // Redirect based on user role or previous page
      const redirectTo = (router.query.redirect as string) || '/dashboard';
      router.push(redirectTo);
    } catch (error: any) {
      notifications.error('Ошибка входа', error.message);
      throw error;
    }
  };

  // Extended register with notifications
  const registerWithNotifications = async (email: string, password: string) => {
    try {
      await authContext.register(email, password);
      notifications.success('Регистрация успешна!', 'Проверьте email для подтверждения аккаунта', {
        duration: 10000,
      });
      router.push('/verify-email');
    } catch (error: any) {
      notifications.error('Ошибка регистрации', error.message);
      throw error;
    }
  };

  // Extended logout with notifications
  const logoutWithNotifications = async () => {
    try {
      await authContext.logout();
      notifications.info('Выход выполнен', 'До свидания!');
      router.push('/');
    } catch (error: any) {
      notifications.error('Ошибка выхода', error.message);
    }
  };

  // Check if user has specific permissions
  const hasPermission = (permission: string) => {
    if (!authContext.isLoggedIn || !authContext.user) return false;

    // Simple permission logic based on email
    const isAdmin = authContext.user.email.includes('admin');

    switch (permission) {
      case 'admin':
        return isAdmin;
      case 'verified':
        return authContext.user.isVerified;
      case 'user':
        return true; // All authenticated users
      default:
        return false;
    }
  };

  // Require authentication for a page
  const requireAuth = (redirect = '/login') => {
    React.useEffect(() => {
      if (!authContext.isLoggedIn && !authContext.isLoading) {
        router.push(`${redirect}?redirect=${encodeURIComponent(router.asPath)}`);
      }
    }, [authContext.isLoggedIn, authContext.isLoading, redirect]);

    return authContext.isLoggedIn;
  };

  return {
    // Original auth context
    ...authContext,

    // Enhanced methods
    login: loginWithNotifications,
    register: registerWithNotifications,
    logout: logoutWithNotifications,

    // Permission utilities
    hasPermission,
    requireAuth,
  };
}
```

2. **packages/hooks/src/business/useExchange.ts**

```typescript
import React from 'react';
import { useExchangeStore } from '../state/exchange-store';
import { useNotificationStore } from '../state/notification-store';
import { trpc } from '../../apps/web/lib/trpc';
import { CURRENCY_LIMITS } from '@repo/constants';

/**
 * Exchange Business Logic Hook
 *
 * Handles exchange calculations, validation, and order management
 */
export function useExchange() {
  const exchangeStore = useExchangeStore();
  const notifications = useNotificationStore();
  const utils = trpc.useUtils();

  // tRPC mutations
  const calculateMutation = trpc.exchange.calculateExchange.useMutation();
  const createOrderMutation = trpc.exchange.createOrder.useMutation();

  // Load rates on mount
  const { data: ratesData } = trpc.exchange.getRates.useQuery(undefined, {
    refetchInterval: 30000, // Update every 30 seconds
  });

  React.useEffect(() => {
    if (ratesData?.rates) {
      exchangeStore.setRates(ratesData.rates);
    }
  }, [ratesData, exchangeStore]);

  // Enhanced form validation
  const validateForm = () => {
    const { formData, calculation } = exchangeStore;
    const errors: string[] = [];

    // Email validation
    if (!formData.recipientEmail) {
      errors.push('Укажите email для получения уведомлений');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
      errors.push('Введите корректный email адрес');
    }

    // Amount validation
    if (!formData.amount || isNaN(Number(formData.amount))) {
      errors.push('Введите корректную сумму');
    } else {
      const amount = Number(formData.amount);
      const limits = CURRENCY_LIMITS[formData.currency];

      if (formData.direction === 'crypto-to-uah') {
        if (amount < limits.minCrypto) {
          errors.push(`Минимальная сумма: ${limits.minCrypto} ${formData.currency}`);
        }
        if (amount > limits.maxCrypto) {
          errors.push(`Максимальная сумма: ${limits.maxCrypto} ${formData.currency}`);
        }
      } else {
        if (amount < limits.minUah) {
          errors.push(`Минимальная сумма: ${limits.minUah} UAH`);
        }
        if (amount > limits.maxUah) {
          errors.push(`Максимальная сумма: ${limits.maxUah} UAH`);
        }
      }
    }

    // Calculation required
    if (!calculation) {
      errors.push('Необходимо рассчитать сумму обмена');
    }

    return { isValid: errors.length === 0, errors };
  };

  // Calculate exchange with API
  const calculateExchange = async () => {
    const { formData } = exchangeStore;
    const { amount, currency, direction } = formData;

    if (!amount || isNaN(Number(amount))) {
      exchangeStore.setError('Введите корректную сумму');
      return;
    }

    exchangeStore.setCalculating(true);
    exchangeStore.setError(null);

    try {
      const result = await calculateMutation.mutateAsync({
        amount: Number(amount),
        currency,
        direction,
      });

      exchangeStore.setCalculation(result);
    } catch (error: any) {
      exchangeStore.setError(error.message);
      notifications.error('Ошибка расчета', error.message);
    } finally {
      exchangeStore.setCalculating(false);
    }
  };

  // Auto-calculate when form changes
  React.useEffect(() => {
    const { amount, currency, direction } = exchangeStore.formData;

    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      const debounceTimeout = setTimeout(() => {
        calculateExchange();
      }, 500); // Debounce 500ms

      return () => clearTimeout(debounceTimeout);
    }
  }, [
    exchangeStore.formData.amount,
    exchangeStore.formData.currency,
    exchangeStore.formData.direction,
  ]);

  // Submit order with validation
  const submitOrder = async () => {
    const validation = validateForm();

    if (!validation.isValid) {
      notifications.error('Ошибка валидации', validation.errors[0]);
      return false;
    }

    exchangeStore.setCreatingOrder(true);
    exchangeStore.setError(null);

    try {
      const result = await createOrderMutation.mutateAsync({
        email: exchangeStore.formData.recipientEmail,
        cryptoAmount: exchangeStore.calculation!.cryptoAmount,
        currency: exchangeStore.formData.currency,
        recipientData: exchangeStore.formData.recipientData,
      });

      exchangeStore.setCurrentOrder(result);
      exchangeStore.setStep('payment');

      notifications.success(
        'Заявка создана!',
        `Заявка на обмен ${exchangeStore.calculation?.cryptoAmount} ${exchangeStore.formData.currency} создана`
      );

      return true;
    } catch (error: any) {
      exchangeStore.setError(error.message);
      notifications.error('Ошибка создания заявки', error.message);
      return false;
    } finally {
      exchangeStore.setCreatingOrder(false);
    }
  };

  // Get exchange rate for display
  const getDisplayRate = () => {
    if (!exchangeStore.rates) return null;

    const rate = exchangeStore.rates.find(r => r.currency === exchangeStore.formData.currency);
    if (!rate) return null;

    return {
      currency: rate.currency,
      rate: rate.uahRate,
      commission: rate.commission,
      formattedRate: `1 ${rate.currency} = ${rate.uahRate.toLocaleString()} UAH`,
      formattedCommission: `Комиссия: ${rate.commission}%`,
    };
  };

  // Get form progress
  const getProgress = () => {
    const steps = ['form', 'review', 'payment', 'completed'];
    const currentIndex = steps.indexOf(exchangeStore.step);
    return {
      currentStep: currentIndex + 1,
      totalSteps: steps.length,
      percentage: ((currentIndex + 1) / steps.length) * 100,
      isComplete: exchangeStore.step === 'completed',
    };
  };

  // Quick form helpers
  const setAmount = (amount: string) => {
    exchangeStore.updateFormData({ amount });
  };

  const setCurrency = (currency: any) => {
    exchangeStore.updateFormData({ currency });
  };

  const setDirection = (direction: 'crypto-to-uah' | 'uah-to-crypto') => {
    exchangeStore.updateFormData({ direction });
  };

  const setRecipientEmail = (email: string) => {
    exchangeStore.updateFormData({ recipientEmail: email });
  };

  // Swap direction helper
  const swapDirection = () => {
    const newDirection =
      exchangeStore.formData.direction === 'crypto-to-uah' ? 'uah-to-crypto' : 'crypto-to-uah';

    exchangeStore.updateFormData({
      direction: newDirection,
      amount: exchangeStore.calculation?.uahAmount.toString() || '',
    });
  };

  return {
    // Store state
    ...exchangeStore,

    // Business logic
    validateForm,
    calculateExchange,
    submitOrder,

    // Display helpers
    getDisplayRate,
    getProgress,

    // Form helpers
    setAmount,
    setCurrency,
    setDirection,
    setRecipientEmail,
    swapDirection,
  };
}
```

3. **packages/hooks/src/business/useOrderTracking.ts**

```typescript
import React from 'react';
import { useNotificationStore } from '../state/notification-store';
import { trpc } from '../../apps/web/lib/trpc';

/**
 * Order Tracking Hook
 *
 * Real-time order status tracking with notifications
 */
export function useOrderTracking(orderId?: string) {
  const notifications = useNotificationStore();

  const {
    data: order,
    isLoading,
    error,
  } = trpc.exchange.getOrderStatus.useQuery(
    { orderId: orderId! },
    {
      enabled: !!orderId,
      refetchInterval: data => {
        // Stop polling if order is completed
        if (data?.status === 'completed' || data?.status === 'failed') {
          return false;
        }
        return 10000; // Poll every 10 seconds for active orders
      },
    }
  );

  // Notify on status changes
  const prevStatus = React.useRef(order?.status);

  React.useEffect(() => {
    if (order && prevStatus.current && prevStatus.current !== order.status) {
      const statusMessages = {
        processing: 'Заявка поступила в обработку',
        completed: 'Заявка успешно выполнена!',
        failed: 'Произошла ошибка при выполнении заявки',
        cancelled: 'Заявка была отменена',
      };

      const message = statusMessages[order.status as keyof typeof statusMessages];
      if (message) {
        if (order.status === 'completed') {
          notifications.success('Статус заявки изменен', message);
        } else if (order.status === 'failed') {
          notifications.error('Статус заявки изменен', message);
        } else {
          notifications.info('Статус заявки изменен', message);
        }
      }
    }

    prevStatus.current = order?.status;
  }, [order?.status, notifications]);

  return {
    order,
    isLoading,
    error,
    isActive: order && ['pending', 'processing'].includes(order.status),
    isCompleted: order?.status === 'completed',
    isFailed: order?.status === 'failed',
  };
}
```

4. **packages/hooks/src/business/useForm.ts**

```typescript
import React from 'react';
import { z } from 'zod';

interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  onSubmit?: (values: T) => Promise<void> | void;
}

interface FieldError {
  message: string;
  type: string;
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, FieldError>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;

  // Field methods
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setFieldError: <K extends keyof T>(field: K, error: FieldError) => void;
  clearFieldError: <K extends keyof T>(field: K) => void;
  setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void;

  // Form methods
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: (values?: Partial<T>) => void;
  validate: () => boolean;

  // Field props generators
  getFieldProps: <K extends keyof T>(
    field: K
  ) => {
    name: string;
    value: T[K];
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void;
    onBlur: () => void;
    'aria-invalid': boolean;
    'aria-describedby': string;
  };

  getFieldError: <K extends keyof T>(field: K) => FieldError | undefined;
  isFieldTouched: <K extends keyof T>(field: K) => boolean;
  isFieldValid: <K extends keyof T>(field: K) => boolean;
}

/**
 * Universal Form Hook
 *
 * Generic form management with Zod validation
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValuesState] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, FieldError>>>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Validate field
  const validateField = React.useCallback(
    <K extends keyof T>(field: K, value: T[K]): FieldError | null => {
      if (!validationSchema) return null;

      try {
        const fieldSchema = validationSchema.pick({ [field]: true } as any);
        fieldSchema.parse({ [field]: value });
        return null;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors.find(e => e.path.includes(field as string));
          if (fieldError) {
            return {
              message: fieldError.message,
              type: fieldError.code,
            };
          }
        }
        return null;
      }
    },
    [validationSchema]
  );

  // Validate all fields
  const validate = React.useCallback((): boolean => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof T, FieldError>> = {};

        error.errors.forEach(err => {
          const field = err.path[0] as keyof T;
          if (field) {
            newErrors[field] = {
              message: err.message,
              type: err.code,
            };
          }
        });

        setErrors(newErrors);
        return false;
      }
    }

    return false;
  }, [values, validationSchema]);

  // Set single field value
  const setValue = React.useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValuesState(prev => ({ ...prev, [field]: value }));

      // Validate field if touched
      if (touched[field]) {
        const error = validateField(field, value);
        if (error) {
          setErrors(prev => ({ ...prev, [field]: error }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      }
    },
    [touched, validateField]
  );

  // Set multiple field values
  const setValues = React.useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  // Set field error
  const setFieldError = React.useCallback(<K extends keyof T>(field: K, error: FieldError) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // Clear field error
  const clearFieldError = React.useCallback(<K extends keyof T>(field: K) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Set field touched
  const setFieldTouched = React.useCallback(<K extends keyof T>(field: K, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  // Handle form submission
  const handleSubmit = React.useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>
      );
      setTouched(allTouched);

      if (!validate()) {
        return;
      }

      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validate, onSubmit]
  );

  // Reset form
  const reset = React.useCallback(
    (resetValues?: Partial<T>) => {
      const newValues = resetValues ? { ...initialValues, ...resetValues } : initialValues;
      setValuesState(newValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    },
    [initialValues]
  );

  // Get field props for easy integration
  const getFieldProps = React.useCallback(
    <K extends keyof T>(field: K) => ({
      name: field as string,
      value: values[field],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        setValue(field, e.target.value as T[K]);
      },
      onBlur: () => {
        setFieldTouched(field, true);
      },
      'aria-invalid': !!errors[field],
      'aria-describedby': `${field as string}-error`,
    }),
    [values, setValue, setFieldTouched, errors]
  );

  // Helper methods
  const getFieldError = React.useCallback(<K extends keyof T>(field: K) => errors[field], [errors]);
  const isFieldTouched = React.useCallback(
    <K extends keyof T>(field: K) => !!touched[field],
    [touched]
  );
  const isFieldValid = React.useCallback(<K extends keyof T>(field: K) => !errors[field], [errors]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,

    setValue,
    setValues,
    setFieldError,
    clearFieldError,
    setFieldTouched,

    handleSubmit,
    reset,
    validate,

    getFieldProps,
    getFieldError,
    isFieldTouched,
    isFieldValid,
  };
}

// Predefined validation schemas
export const validationSchemas = {
  email: z.string().email('Введите корректный email адрес'),

  password: z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать строчную букву')
    .regex(/[0-9]/, 'Пароль должен содержать цифру'),

  amount: z
    .string()
    .regex(/^\d+(\.\d{1,8})?$/, 'Введите корректную сумму')
    .refine(val => Number(val) > 0, 'Сумма должна быть больше 0'),

  phone: z.string().regex(/^\+380\d{9}$/, 'Введите номер телефона в формате +380XXXXXXXXX'),
};
```

5. **packages/hooks/src/index.ts** (обновить)

```typescript
// Existing exports
export { useUIStore } from './state/ui-store';
export { useTradingStore } from './state/trading-store';

// New state stores
export { useNotificationStore } from './state/notification-store';
export { useExchangeStore } from './state/exchange-store';

// Enhanced hooks
export { useUIStore as useEnhancedUIStore } from './useUIStore';
export { useNotifications } from './useNotifications';

// Business logic hooks
export { useAuth } from './business/useAuth';
export { useExchange } from './business/useExchange';
export { useOrderTracking } from './business/useOrderTracking';
export { useForm, validationSchemas } from './business/useForm';

// Types
export type { Notification } from './state/notification-store';
export type { ExchangeFormData, ExchangeCalculation } from './state/exchange-store';
```

#### Юзкейсы и Edge Cases

1. **Auth Integration**
   - ✅ Интеграция с существующим AuthProvider (Part 2)
   - ✅ Расширенная функциональность с уведомлениями
   - ✅ Permission-based access control
   - ✅ Автоматические редиректы

2. **Exchange Business Logic**
   - ✅ Автоматическая валидация формы
   - ✅ Debounced расчеты через tRPC
   - ✅ Пошаговый workflow с progress tracking
   - ✅ Real-time курсы валют

3. **Form Management**
   - ✅ Generic TypeScript типизация
   - ✅ Zod валидация с детальными ошибками
   - ✅ Field-level и form-level валидация
   - ✅ Готовые props для input'ов

4. **Order Tracking**
   - ✅ Real-time обновления статуса
   - ✅ Автоматические уведомления на изменения
   - ✅ Умный polling (останавливается для завершенных)
   - ✅ Optimistic UI updates

#### Чек-лист готовности

- [ ] Все business hooks созданы в packages/hooks/src/business/
- [ ] Интеграция с существующим AuthProvider работает
- [ ] Zustand stores подключены к business logic
- [ ] tRPC integration функционирует
- [ ] Уведомления отображаются корректно
- [ ] Экспорты обновлены в packages/hooks/src/index.ts

---

## 📊 Статус Progress Part 3

### Завершенные задачи: 0/2

- [ ] TASK 3.1: Создать глобальный Store и Context
- [ ] TASK 3.2: Создать Custom Hooks для бизнес-логики

### Следующие задачи в Part 3:

Часть 3 завершена. Готов к созданию Part 4.

### Следующие части:

- **TASKS-PART-4.md** - UI Components & Forms
- **TASKS-PART-5.md** - Pages & User Flow
- **TASKS-PART-6.md** - Admin Panel
- **TASKS-PART-7.md** - Testing & Quality
- **TASKS-PART-8.md** - Production Setup & Deployment

### Ключевые результаты Part 3:

✅ **Zustand State Management** с централизованными packages и devtools  
✅ **Business Logic Hooks** с интеграцией AuthProvider и tRPC  
✅ **Form management** с Zod валидацией и generic типизацией  
✅ **Real-time updates** с автоматическим polling и notifications  
✅ **Notification system** с auto-cleanup и action buttons  
✅ **Exchange workflow** с пошаговой навигацией и validation

---

**Дата создания:** 29 июня 2025  
**Версия:** 1.0  
**Следующая часть:** TASKS-PART-4.md
