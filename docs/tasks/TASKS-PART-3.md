# 🚀 ExchangeGO Development Tasks - Part 3: State Management & Hooks

**Дата создания:** 29 июня 2025  
**Статус:** В разработке  
**Покрытие:** State management, custom hooks, React context, form handling

---

## 📋 Общая информация

### Связь с предыдущими частями:

- ✅ Использует типы из `@repo/exchange-core` (Part 1)
- ✅ Интегрируется с tRPC API (Part 2)
- ✅ Применяет аутентификацию и middleware (Part 2)
- ✅ Реализует клиентские хуки (Part 2)

### Архитектурный подход:

- **React Context** для глобального состояния
- **Custom Hooks** для бизнес-логики
- **Form State Management** с валидацией
- **Cache Management** с React Query

---

## 🧠 PHASE 3: STATE MANAGEMENT & HOOKS

### TASK 3.1: Создать глобальный Store и Context

**Время:** 2 часа  
**Приоритет:** 🔴 Критический

#### Описание

Создать централизованное управление состоянием приложения через React Context с TypeScript типизацией.

#### Технические требования

```
apps/web/
├── src/
│   ├── store/
│   │   ├── index.ts              # Главный экспорт всех stores
│   │   ├── AppProvider.tsx       # Главный Provider
│   │   ├── AuthStore.tsx         # Аутентификация
│   │   ├── ExchangeStore.tsx     # Состояние обмена
│   │   ├── UIStore.tsx           # UI состояние
│   │   └── NotificationStore.tsx # Уведомления
│   ├── hooks/
│   │   ├── index.ts              # Экспорт всех хуков
│   │   ├── useAuth.ts            # Аутентификация
│   │   ├── useExchange.ts        # Обмен валют
│   │   ├── useUI.ts              # UI состояние
│   │   └── useNotifications.ts   # Уведомления
```

#### Реализация

1. **apps/web/src/store/AuthStore.tsx**

```typescript
import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import { trpc } from '~/utils/trpc';

// Типы для Auth Store
interface User {
  id: string;
  email: string;
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        user: action.payload,
        isAuthenticated: true,
        error: null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        user: null,
        isAuthenticated: false,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null,
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
};

// Context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // tRPC hooks
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const { data: session } = trpc.auth.getSession.useQuery();

  // Синхронизация с сессией из tRPC
  React.useEffect(() => {
    if (session?.user) {
      dispatch({ type: 'AUTH_SUCCESS', payload: session.user });
    } else if (session?.user === null) {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, [session]);

  // Actions
  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      dispatch({ type: 'AUTH_SUCCESS', payload: result.user });
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const result = await registerMutation.mutateAsync({ email, password });
      dispatch({ type: 'AUTH_SUCCESS', payload: result.user });
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error: any) {
      // Всегда логаутим локально, даже если API запрос failed
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuthStore() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthStore must be used within AuthProvider');
  }
  return context;
}
```

2. **apps/web/src/store/ExchangeStore.tsx**

```typescript
import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import { trpc } from '~/utils/trpc';
import { CRYPTOCURRENCIES, type Cryptocurrency } from '@repo/constants';
import { type ExchangeRate, type OrderLimits } from '@repo/exchange-core';

// Типы для Exchange Store
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
}

type ExchangeAction =
  | { type: 'SET_FORM_DATA'; payload: Partial<ExchangeFormData> }
  | { type: 'SET_CALCULATION'; payload: ExchangeCalculation | null }
  | { type: 'SET_CALCULATING'; payload: boolean }
  | { type: 'SET_CURRENT_ORDER'; payload: any | null }
  | { type: 'SET_CREATING_ORDER'; payload: boolean }
  | { type: 'SET_RATES'; payload: ExchangeRate[] }
  | { type: 'SET_LIMITS'; payload: Record<Cryptocurrency, OrderLimits> }
  | { type: 'SET_STEP'; payload: ExchangeState['step'] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_FORM' };

interface ExchangeContextType extends ExchangeState {
  updateFormData: (data: Partial<ExchangeFormData>) => void;
  calculateExchange: () => Promise<void>;
  createOrder: () => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  resetForm: () => void;
  clearError: () => void;
}

// Initial state
const initialFormData: ExchangeFormData = {
  amount: '',
  currency: 'BTC',
  direction: 'crypto-to-uah',
  recipientEmail: '',
  recipientData: {},
};

const initialState: ExchangeState = {
  formData: initialFormData,
  calculation: null,
  isCalculating: false,
  currentOrder: null,
  isCreatingOrder: false,
  rates: null,
  limits: null,
  step: 'form',
  error: null,
};

// Reducer
const exchangeReducer = (state: ExchangeState, action: ExchangeAction): ExchangeState => {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
        // Сбрасываем расчет при изменении формы
        calculation: null,
      };

    case 'SET_CALCULATION':
      return { ...state, calculation: action.payload };

    case 'SET_CALCULATING':
      return { ...state, isCalculating: action.payload };

    case 'SET_CURRENT_ORDER':
      return { ...state, currentOrder: action.payload };

    case 'SET_CREATING_ORDER':
      return { ...state, isCreatingOrder: action.payload };

    case 'SET_RATES':
      return { ...state, rates: action.payload };

    case 'SET_LIMITS':
      return { ...state, limits: action.payload };

    case 'SET_STEP':
      return { ...state, step: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'RESET_FORM':
      return {
        ...state,
        formData: initialFormData,
        calculation: null,
        currentOrder: null,
        step: 'form',
        error: null,
      };

    default:
      return state;
  }
};

// Context
const ExchangeContext = createContext<ExchangeContextType | null>(null);

// Provider
export function ExchangeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(exchangeReducer, initialState);

  // tRPC hooks
  const { data: ratesData } = trpc.exchange.getRates.useQuery(undefined, {
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  const calculateMutation = trpc.exchange.calculateExchange.useMutation();
  const createOrderMutation = trpc.exchange.createOrder.useMutation();

  // Загрузка курсов при монтировании
  React.useEffect(() => {
    if (ratesData?.rates) {
      dispatch({ type: 'SET_RATES', payload: ratesData.rates });
    }
  }, [ratesData]);

  // Actions
  const updateFormData = (data: Partial<ExchangeFormData>) => {
    dispatch({ type: 'SET_FORM_DATA', payload: data });
  };

  const calculateExchange = async () => {
    const { amount, currency, direction } = state.formData;

    if (!amount || isNaN(Number(amount))) {
      dispatch({ type: 'SET_ERROR', payload: 'Введите корректную сумму' });
      return;
    }

    dispatch({ type: 'SET_CALCULATING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await calculateMutation.mutateAsync({
        amount: Number(amount),
        currency,
        direction,
      });

      dispatch({ type: 'SET_CALCULATION', payload: result });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_CALCULATING', payload: false });
    }
  };

  const createOrder = async () => {
    if (!state.calculation) {
      dispatch({ type: 'SET_ERROR', payload: 'Сначала рассчитайте сумму обмена' });
      return;
    }

    dispatch({ type: 'SET_CREATING_ORDER', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await createOrderMutation.mutateAsync({
        email: state.formData.recipientEmail,
        cryptoAmount: state.calculation.cryptoAmount,
        currency: state.formData.currency,
        recipientData: state.formData.recipientData,
      });

      dispatch({ type: 'SET_CURRENT_ORDER', payload: result });
      dispatch({ type: 'SET_STEP', payload: 'payment' });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_CREATING_ORDER', payload: false });
    }
  };

  const nextStep = () => {
    const stepOrder: ExchangeState['step'][] = ['form', 'review', 'payment', 'completed'];
    const currentIndex = stepOrder.indexOf(state.step);
    if (currentIndex < stepOrder.length - 1) {
      dispatch({ type: 'SET_STEP', payload: stepOrder[currentIndex + 1] });
    }
  };

  const prevStep = () => {
    const stepOrder: ExchangeState['step'][] = ['form', 'review', 'payment', 'completed'];
    const currentIndex = stepOrder.indexOf(state.step);
    if (currentIndex > 0) {
      dispatch({ type: 'SET_STEP', payload: stepOrder[currentIndex - 1] });
    }
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value: ExchangeContextType = {
    ...state,
    updateFormData,
    calculateExchange,
    createOrder,
    nextStep,
    prevStep,
    resetForm,
    clearError,
  };

  return (
    <ExchangeContext.Provider value={value}>
      {children}
    </ExchangeContext.Provider>
  );
}

// Hook
export function useExchangeStore() {
  const context = useContext(ExchangeContext);
  if (!context) {
    throw new Error('useExchangeStore must be used within ExchangeProvider');
  }
  return context;
}
```

3. **apps/web/src/store/UIStore.tsx**

```typescript
import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

// Типы для UI Store
interface UIState {
  // Layout
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;

  // Modals
  modals: {
    login: boolean;
    register: boolean;
    orderDetails: boolean;
    confirmAction: boolean;
  };

  // Loading states
  globalLoading: boolean;

  // Theme
  theme: 'light' | 'dark';

  // Current modal data
  modalData: any;
}

type UIAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'TOGGLE_MOBILE_MENU' }
  | { type: 'SET_MOBILE_MENU'; payload: boolean }
  | { type: 'OPEN_MODAL'; payload: { modal: keyof UIState['modals']; data?: any } }
  | { type: 'CLOSE_MODAL'; payload: keyof UIState['modals'] }
  | { type: 'CLOSE_ALL_MODALS' }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_MODAL_DATA'; payload: any };

interface UIContextType extends UIState {
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenu: (open: boolean) => void;
  openModal: (modal: keyof UIState['modals'], data?: any) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  setGlobalLoading: (loading: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setModalData: (data: any) => void;
}

// Initial state
const initialState: UIState = {
  sidebarOpen: false,
  mobileMenuOpen: false,
  modals: {
    login: false,
    register: false,
    orderDetails: false,
    confirmAction: false,
  },
  globalLoading: false,
  theme: 'light',
  modalData: null,
};

// Reducer
const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload };

    case 'TOGGLE_MOBILE_MENU':
      return { ...state, mobileMenuOpen: !state.mobileMenuOpen };

    case 'SET_MOBILE_MENU':
      return { ...state, mobileMenuOpen: action.payload };

    case 'OPEN_MODAL':
      return {
        ...state,
        modals: { ...state.modals, [action.payload.modal]: true },
        modalData: action.payload.data || null,
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: false },
        // Очищаем данные модалки только если это была последняя открытая
        modalData: Object.values({
          ...state.modals,
          [action.payload]: false,
        }).some(open => open) ? state.modalData : null,
      };

    case 'CLOSE_ALL_MODALS':
      return {
        ...state,
        modals: {
          login: false,
          register: false,
          orderDetails: false,
          confirmAction: false,
        },
        modalData: null,
      };

    case 'SET_GLOBAL_LOADING':
      return { ...state, globalLoading: action.payload };

    case 'SET_THEME':
      // Сохраняем тему в localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
      }
      return { ...state, theme: action.payload };

    case 'SET_MODAL_DATA':
      return { ...state, modalData: action.payload };

    default:
      return state;
  }
};

// Context
const UIContext = createContext<UIContextType | null>(null);

// Provider
export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  // Загружаем тему из localStorage при инициализации
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        dispatch({ type: 'SET_THEME', payload: savedTheme });
      }
    }
  }, []);

  // Применяем тему к документу
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.className = state.theme;
    }
  }, [state.theme]);

  // Actions
  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  const setSidebar = (open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR', payload: open });
  };

  const toggleMobileMenu = () => {
    dispatch({ type: 'TOGGLE_MOBILE_MENU' });
  };

  const setMobileMenu = (open: boolean) => {
    dispatch({ type: 'SET_MOBILE_MENU', payload: open });
  };

  const openModal = (modal: keyof UIState['modals'], data?: any) => {
    dispatch({ type: 'OPEN_MODAL', payload: { modal, data } });
  };

  const closeModal = (modal: keyof UIState['modals']) => {
    dispatch({ type: 'CLOSE_MODAL', payload: modal });
  };

  const closeAllModals = () => {
    dispatch({ type: 'CLOSE_ALL_MODALS' });
  };

  const setGlobalLoading = (loading: boolean) => {
    dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading });
  };

  const setTheme = (theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const setModalData = (data: any) => {
    dispatch({ type: 'SET_MODAL_DATA', payload: data });
  };

  const value: UIContextType = {
    ...state,
    toggleSidebar,
    setSidebar,
    toggleMobileMenu,
    setMobileMenu,
    openModal,
    closeModal,
    closeAllModals,
    setGlobalLoading,
    setTheme,
    setModalData,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

// Hook
export function useUIStore() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIStore must be used within UIProvider');
  }
  return context;
}
```

4. **apps/web/src/store/NotificationStore.tsx**

```typescript
import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

// Типы уведомлений
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
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<Notification> } };

interface NotificationContextType extends NotificationState {
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

// Initial state
const initialState: NotificationState = {
  notifications: [],
  maxNotifications: 5,
};

// Reducer
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotifications = [action.payload, ...state.notifications];

      // Ограничиваем количество уведомлений
      if (newNotifications.length > state.maxNotifications) {
        newNotifications.splice(state.maxNotifications);
      }

      return { ...state, notifications: newNotifications };
    }

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case 'CLEAR_ALL_NOTIFICATIONS':
      return { ...state, notifications: [] };

    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.id ? { ...n, ...action.payload.updates } : n
        ),
      };

    default:
      return state;
  }
};

// Context
const NotificationContext = createContext<NotificationContextType | null>(null);

// Provider
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Auto-remove notifications after their duration
  React.useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {};

    state.notifications.forEach(notification => {
      if (!notification.persistent && notification.duration !== 0) {
        const duration = notification.duration ?? 5000; // 5 секунд по умолчанию

        timers[notification.id] = setTimeout(() => {
          dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
        }, duration);
      }
    });

    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [state.notifications]);

  // Actions
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification });
    return id;
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const clearAllNotifications = () => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  };

  const updateNotification = (id: string, updates: Partial<Notification>) => {
    dispatch({ type: 'UPDATE_NOTIFICATION', payload: { id, updates } });
  };

  // Convenience methods
  const success = (title: string, message?: string, options?: Partial<Notification>) =>
    addNotification({ type: 'success', title, message, ...options });

  const error = (title: string, message?: string, options?: Partial<Notification>) =>
    addNotification({ type: 'error', title, message, persistent: true, ...options });

  const warning = (title: string, message?: string, options?: Partial<Notification>) =>
    addNotification({ type: 'warning', title, message, ...options });

  const info = (title: string, message?: string, options?: Partial<Notification>) =>
    addNotification({ type: 'info', title, message, ...options });

  const value: NotificationContextType = {
    ...state,
    addNotification,
    removeNotification,
    clearAllNotifications,
    updateNotification,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook
export function useNotificationStore() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationStore must be used within NotificationProvider');
  }
  return context;
}
```

5. **apps/web/src/store/AppProvider.tsx**

```typescript
import { type ReactNode } from 'react';
import { AuthProvider } from './AuthStore';
import { ExchangeProvider } from './ExchangeStore';
import { UIProvider } from './UIStore';
import { NotificationProvider } from './NotificationStore';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <NotificationProvider>
      <UIProvider>
        <AuthProvider>
          <ExchangeProvider>
            {children}
          </ExchangeProvider>
        </AuthProvider>
      </UIProvider>
    </NotificationProvider>
  );
}
```

6. **apps/web/src/store/index.ts**

```typescript
// Экспорт всех store компонентов
export { AppProvider } from './AppProvider';
export { AuthProvider, useAuthStore } from './AuthStore';
export { ExchangeProvider, useExchangeStore } from './ExchangeStore';
export { UIProvider, useUIStore } from './UIStore';
export { NotificationProvider, useNotificationStore } from './NotificationStore';

// Типы
export type { User } from './AuthStore';
export type { ExchangeFormData, ExchangeCalculation } from './ExchangeStore';
export type { Notification } from './NotificationStore';
```

#### Юзкейсы и Edge Cases

1. **Состояние аутентификации**
   - ✅ Синхронизация с tRPC сессией
   - ✅ Автоматическое обновление при входе/выходе
   - ✅ Обработка ошибок аутентификации
   - ✅ Очистка состояния при logout

2. **Состояние обмена**
   - ✅ Валидация формы в реальном времени
   - ✅ Автоматические расчеты при изменении данных
   - ✅ Пошаговый workflow
   - ✅ Сохранение состояния между шагами

3. **UI состояние**
   - ✅ Управление модальными окнами
   - ✅ Responsive menu состояния
   - ✅ Темизация с localStorage
   - ✅ Глобальные loading состояния

4. **Уведомления**
   - ✅ Автоматическое удаление по времени
   - ✅ Persistent уведомления для ошибок
   - ✅ Действия в уведомлениях
   - ✅ Лимит количества уведомлений

#### Чек-лист готовности

- [ ] Все Context providers настроены
- [ ] TypeScript типизация корректна
- [ ] Reducers обрабатывают все case'ы
- [ ] Hooks экспортируются правильно
- [ ] localStorage интеграция работает
- [ ] Auto-cleanup уведомлений функционирует

---

### TASK 3.2: Создать Custom Hooks для бизнес-логики

**Время:** 2 часа  
**Приоритет:** 🔴 Критический

#### Описание

Создать переиспользуемые хуки для инкапсуляции бизнес-логики и интеграции с API.

#### Реализация

1. **apps/web/src/hooks/useAuth.ts**

```typescript
import { useRouter } from 'next/router';
import { useAuthStore } from '~/store/AuthStore';
import { useNotificationStore } from '~/store/NotificationStore';
import { trpc } from '~/utils/trpc';

export function useAuth() {
  const auth = useAuthStore();
  const notifications = useNotificationStore();
  const router = useRouter();
  const utils = trpc.useUtils();

  // Extended login with notifications and redirect
  const login = async (email: string, password: string) => {
    try {
      await auth.login(email, password);
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
  const register = async (email: string, password: string) => {
    try {
      await auth.register(email, password);
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
  const logout = async () => {
    try {
      await auth.logout();
      notifications.info('Выход выполнен', 'До свидания!');
      router.push('/');
    } catch (error: any) {
      notifications.error('Ошибка выхода', error.message);
    }
  };

  // Check if user has specific permissions
  const hasPermission = (permission: string) => {
    if (!auth.isAuthenticated || !auth.user) return false;

    // In a real app, you'd check user roles/permissions
    // For now, simple checks based on email
    const isAdmin = auth.user.email.includes('admin');

    switch (permission) {
      case 'admin':
        return isAdmin;
      case 'verified':
        return auth.user.isVerified;
      case 'user':
        return true; // All authenticated users
      default:
        return false;
    }
  };

  // Require authentication for a page
  const requireAuth = (redirect = '/login') => {
    React.useEffect(() => {
      if (!auth.isAuthenticated && !auth.isLoading) {
        router.push(`${redirect}?redirect=${encodeURIComponent(router.asPath)}`);
      }
    }, [auth.isAuthenticated, auth.isLoading, redirect]);

    return auth.isAuthenticated;
  };

  // Require specific permission
  const requirePermission = (permission: string, redirect = '/unauthorized') => {
    const hasAuth = requireAuth();

    React.useEffect(() => {
      if (hasAuth && !hasPermission(permission)) {
        router.push(redirect);
      }
    }, [hasAuth, permission, redirect]);

    return hasAuth && hasPermission(permission);
  };

  return {
    // State
    ...auth,

    // Enhanced actions
    login,
    register,
    logout,

    // Utilities
    hasPermission,
    requireAuth,
    requirePermission,
  };
}

// Hook for protecting routes
export function useAuthGuard(
  options: {
    required?: boolean;
    permission?: string;
    redirectTo?: string;
  } = {}
) {
  const { required = true, permission, redirectTo = '/login' } = options;
  const auth = useAuth();

  React.useEffect(() => {
    if (required && !auth.isAuthenticated && !auth.isLoading) {
      auth.router.push(`${redirectTo}?redirect=${encodeURIComponent(auth.router.asPath)}`);
      return;
    }

    if (permission && auth.isAuthenticated && !auth.hasPermission(permission)) {
      auth.router.push('/unauthorized');
    }
  }, [auth.isAuthenticated, auth.isLoading, required, permission, redirectTo]);

  return {
    isAuthorized: required ? auth.isAuthenticated : true,
    hasPermission: permission ? auth.hasPermission(permission) : true,
    isLoading: auth.isLoading,
  };
}
```

2. **apps/web/src/hooks/useExchange.ts**

```typescript
import { useExchangeStore } from '~/store/ExchangeStore';
import { useNotificationStore } from '~/store/NotificationStore';
import { useAuth } from './useAuth';
import { trpc } from '~/utils/trpc';
import { CURRENCY_LIMITS } from '@repo/constants';

export function useExchange() {
  const exchange = useExchangeStore();
  const notifications = useNotificationStore();
  const auth = useAuth();
  const utils = trpc.useUtils();

  // Enhanced form validation
  const validateForm = () => {
    const { formData, calculation } = exchange;
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

  // Auto-calculate when form changes
  React.useEffect(() => {
    const { amount, currency, direction } = exchange.formData;

    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      const debounceTimeout = setTimeout(() => {
        exchange.calculateExchange();
      }, 500); // Debounce 500ms

      return () => clearTimeout(debounceTimeout);
    }
  }, [exchange.formData.amount, exchange.formData.currency, exchange.formData.direction]);

  // Submit order with validation
  const submitOrder = async () => {
    const validation = validateForm();

    if (!validation.isValid) {
      notifications.error('Ошибка валидации', validation.errors[0]);
      return false;
    }

    try {
      await exchange.createOrder();
      notifications.success(
        'Заявка создана!',
        `Заявка на обмен ${exchange.calculation?.cryptoAmount} ${exchange.formData.currency} создана`
      );
      return true;
    } catch (error: any) {
      notifications.error('Ошибка создания заявки', error.message);
      return false;
    }
  };

  // Get exchange rate for display
  const getDisplayRate = () => {
    if (!exchange.rates) return null;

    const rate = exchange.rates.find(r => r.currency === exchange.formData.currency);
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
    const currentIndex = steps.indexOf(exchange.step);
    return {
      currentStep: currentIndex + 1,
      totalSteps: steps.length,
      percentage: ((currentIndex + 1) / steps.length) * 100,
      isComplete: exchange.step === 'completed',
    };
  };

  // Quick form helpers
  const setAmount = (amount: string) => {
    exchange.updateFormData({ amount });
  };

  const setCurrency = (currency: any) => {
    exchange.updateFormData({ currency });
  };

  const setDirection = (direction: 'crypto-to-uah' | 'uah-to-crypto') => {
    exchange.updateFormData({ direction });
  };

  const setRecipientEmail = (email: string) => {
    exchange.updateFormData({ recipientEmail: email });
  };

  // Swap direction helper
  const swapDirection = () => {
    const newDirection =
      exchange.formData.direction === 'crypto-to-uah' ? 'uah-to-crypto' : 'crypto-to-uah';

    exchange.updateFormData({
      direction: newDirection,
      amount: exchange.calculation?.uahAmount.toString() || '',
    });
  };

  return {
    // State
    ...exchange,

    // Validation
    validateForm,

    // Actions
    submitOrder,

    // Helpers
    getDisplayRate,
    getProgress,
    setAmount,
    setCurrency,
    setDirection,
    setRecipientEmail,
    swapDirection,
  };
}

// Hook for tracking order status
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

3. **apps/web/src/hooks/useForm.ts**

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
        // Create a partial schema for just this field
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
          // Errors should be handled by the onSubmit function
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

#### Юзкейсы и Edge Cases

1. **useAuth**
   - ✅ Интеграция с роутингом и уведомлениями
   - ✅ Проверка прав доступа и ролей
   - ✅ Защита маршрутов
   - ✅ Автоматические редиректы

2. **useExchange**
   - ✅ Автоматическая валидация формы
   - ✅ Debounced расчеты
   - ✅ Отслеживание прогресса
   - ✅ Быстрые хелперы для UI

3. **useForm**
   - ✅ Generic TypeScript типизация
   - ✅ Zod валидация с детальными ошибками
   - ✅ Field-level и form-level валидация
   - ✅ Готовые props для input'ов

4. **useOrderTracking**
   - ✅ Real-time обновления статуса
   - ✅ Автоматические уведомления
   - ✅ Умный polling (останавливается для завершенных)
   - ✅ Optimistic UI updates

#### Чек-лист готовности

- [ ] Все хуки типизированы и экспортированы
- [ ] Интеграция с store и tRPC работает
- [ ] Валидация форм функционирует
- [ ] Уведомления отображаются корректно
- [ ] Роутинг и редиректы настроены
- [ ] Real-time обновления работают

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

✅ **Централизованное состояние** с React Context и TypeScript  
✅ **Бизнес-логика в хуках** с валидацией и уведомлениями  
✅ **Form management** с Zod валидацией  
✅ **Real-time updates** с автоматическим polling  
✅ **Auth guards** для защиты маршрутов  
✅ **UI state management** с темизацией и модалками

---

**Дата создания:** 29 июня 2025  
**Версия:** 1.0  
**Следующая часть:** TASKS-PART-4.md
