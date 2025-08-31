# Урок 5.1: Zustand для глобального состояния

> **🎯 Цель урока**: Освоить Zustand для эффективного управления клиентским состоянием в React приложениях

## 📖 Введение

### Проблема управления состоянием

**Представьте ситуацию:** У вас есть React приложение с 20+ компонентами, и многие из них должны знать:

- Авторизован ли пользователь?
- Какая тема выбрана (светлая/темная)?
- Открыт ли сайдбар?
- Есть ли активные уведомления?

**Без глобального состояния:**

```typescript
// ❌ Prop drilling - передача через все компоненты
<App>
  <Header user={user} theme={theme} notifications={notifications} />
  <Sidebar isOpen={sidebarOpen} theme={theme} />
  <Main user={user} theme={theme}>
    <Dashboard user={user} notifications={notifications} />
  </Main>
</App>
```

**С глобальным состоянием:**

```typescript
// ✅ Компоненты берут данные напрямую из store
function Header() {
  const { user, theme, notifications } = useGlobalStore();
  // ...
}
```

### Почему Zustand?

| Решение         | Размер | Сложность | Boilerplate | TypeScript |
| --------------- | ------ | --------- | ----------- | ---------- |
| **Redux**       | 47kb   | Высокая   | Много       | Сложно     |
| **Context API** | 0kb    | Средняя   | Средне      | Хорошо     |
| **Zustand**     | 2.9kb  | Низкая    | Минимум     | Отлично    |

**Zustand = "состояние" на немецком языке**

### Ключевые преимущества Zustand

1. **🪶 Легковесность** - всего 2.9kb
2. **🎯 Простота** - минимум boilerplate кода
3. **⚡ Производительность** - умные re-renders
4. **🔧 TypeScript** - отличная типизация из коробки
5. **🧪 Тестируемость** - легко мокать и тестировать

---

## 🚀 Этап 1: Основы Zustand _(15 мин)_

### Создание первого store

**Начнем с простого примера:**

```typescript
// Простейший Zustand store
import { create } from 'zustand';

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounterStore = create<CounterStore>((set) => ({
  // Состояние
  count: 0,

  // Действия (actions)
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// Использование в компоненте
function Counter() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div>
      <p>Счетчик: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Сброс</button>
    </div>
  );
}
```

### Анатомия Zustand store

```typescript
const useStore = create<StoreInterface>((set, get) => ({
  // 1. СОСТОЯНИЕ (state)
  data: initialValue,

  // 2. ДЕЙСТВИЯ (actions)
  updateData: newData => set({ data: newData }),

  // 3. ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ (computed)
  getProcessedData: () => {
    const { data } = get(); // Получаем текущее состояние
    return processData(data);
  },

  // 4. АСИНХРОННЫЕ ДЕЙСТВИЯ
  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await api.getData();
      set({ data, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
}));
```

**Ключевые функции:**

- `set()` - обновляет состояние
- `get()` - получает текущее состояние
- `create()` - создает store

### ✅ Контрольная точка 1

**Проверьте понимание:**

1. **Что делает функция `set()` в Zustand?**
   <details>
   <summary>Показать ответ</summary>

   Обновляет состояние store и уведомляет подписанные компоненты о необходимости re-render.
   </details>

2. **В чем разница между `set({ count: 5 })` и `set(state => ({ count: state.count + 1 }))`?**
   <details>
   <summary>Показать ответ</summary>

   Первый вариант устанавливает абсолютное значение, второй - обновляет на основе текущего состояния.
   </details>

**Задание:** Создайте store для управления списком задач с методами добавления, удаления и переключения статуса.

---

## 🏗️ Этап 2: Архитектура stores в проекте _(20 мин)_

### Структура stores в ExchangeGO

```
packages/hooks/src/state/
├── ui-store.ts              # Глобальное UI состояние
├── exchange-store.ts        # Состояние формы обмена
├── notification-store.ts    # Система уведомлений
├── user-store.ts           # Данные пользователя
├── selectors/              # Селекторы для оптимизации
│   ├── ui-selectors.ts
│   └── exchange-selectors.ts
├── helpers/                # Вспомогательные функции
│   └── store-helpers.ts
└── index.ts                # Экспорт всех stores
```

### Принципы организации

**1. Разделение по доменам**

```typescript
// ✅ Хорошо - каждый store отвечает за свою область
useUIStore(); // UI состояние (sidebar, modals, theme)
useExchangeStore(); // Бизнес-логика обмена валют
useUserStore(); // Данные пользователя
useNotificationStore(); // Уведомления

// ❌ Плохо - один большой store для всего
useAppStore(); // Все в одном месте
```

**2. Четкое разделение состояния и действий**

```typescript
interface Store {
  // Состояние (данные)
  data: DataType;
  loading: boolean;
  error: string | null;

  // Действия (функции)
  fetchData: () => Promise<void>;
  updateData: (data: DataType) => void;
  clearError: () => void;
}
```

### Централизованная фабрика stores

**Зачем нужна фабрика?**

Вместо дублирования конфигурации в каждом store, создаем единую фабрику:

```typescript
// packages/utils/src/store-factory.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { StateCreator } from 'zustand';

/**
 * 🏭 Фабрика для создания Zustand stores
 *
 * Автоматически добавляет:
 * - DevTools для отладки (только в development)
 * - Подписки на изменения состояния
 * - SSR безопасность
 * - Единообразную типизацию
 */

export interface StoreConfig {
  name: string; // Имя для DevTools
  version?: number; // Версия store (для миграций)
  enableSubscriptions?: boolean; // Подписки на изменения
  enableDevtools?: boolean; // Redux DevTools
}

export function createStore<T>(
  config: StoreConfig | string, // Можно передать просто имя
  stateCreator: StateCreator<T, [], [], T>
) {
  // Нормализуем конфигурацию
  const normalizedConfig: StoreConfig = typeof config === 'string' ? { name: config } : config;

  const {
    name,
    version = 1,
    enableSubscriptions = true,
    enableDevtools = process.env.NODE_ENV === 'development',
  } = normalizedConfig;

  // SSR безопасность - проверяем что мы в браузере
  const isClient = typeof window !== 'undefined';

  // Собираем middleware
  let store = stateCreator;

  // Добавляем подписки (если нужны и мы в браузере)
  if (enableSubscriptions && isClient) {
    store = subscribeWithSelector(store);
  }

  // Добавляем DevTools (если нужны и мы в браузере)
  if (enableDevtools && isClient) {
    store = devtools(store, { name, version });
  }

  return create<T>()(store);
}

// Пример использования
const useCounterStore = createStore('counter-store', set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}));
```

**Преимущества фабрики:**

- ✅ **Единообразие** - все stores настроены одинаково
- ✅ **SSR безопасность** - не ломается на сервере
- ✅ **DevTools** - автоматическая интеграция для отладки
- ✅ **Подписки** - возможность слушать изменения состояния
- ✅ **Простота** - меньше boilerplate кода

### ✅ Контрольная точка 2

**Проверьте понимание:**

1. **Зачем нужна фабрика stores?**
   <details>
   <summary>Показать ответ</summary>

   Для единообразной конфигурации всех stores, автоматического добавления DevTools и SSR безопасности.
   </details>

2. **Что такое SSR безопасность в контексте Zustand?**
   <details>
   <summary>Показать ответ</summary>

   Проверка `typeof window !== 'undefined'` перед использованием browser-only функций как DevTools.
   </details>

---

## 🎨 Этап 3: UI Store - управление интерфейсом _(20 мин)_

### Проектирование UI Store

**Что должен содержать UI Store?**

Подумайте о типичном веб-приложении. Какие элементы интерфейса нужно контролировать глобально?

- 🎨 **Тема** (светлая/темная)
- 📱 **Сайдбар** (открыт/закрыт)
- 🪟 **Модальные окна** (какое открыто)
- ⏳ **Загрузка** (глобальные индикаторы)
- 📱 **Мобильная версия** (адаптивность)

### Пошаговое создание UI Store

**Шаг 1: Определяем интерфейс**

```typescript
// packages/hooks/src/state/ui-store.ts
interface UIState {
  // === СОСТОЯНИЕ ===
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeModal: string | null;
  isLoading: boolean;
  isMobile: boolean;

  // === ДЕЙСТВИЯ ===
  // Тема
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Сайдбар
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Модальные окна
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Загрузка
  setLoading: (loading: boolean) => void;

  // Мобильная версия
  setIsMobile: (mobile: boolean) => void;
}
```

**Шаг 2: Реализуем store**

```typescript
import { createStore } from '@repo/utils';

export const useUIStore = createStore<UIState>('ui-store', (set, get) => ({
  // === НАЧАЛЬНОЕ СОСТОЯНИЕ ===
  theme: 'light',
  sidebarOpen: false,
  activeModal: null,
  isLoading: false,
  isMobile: false,

  // === ДЕЙСТВИЯ ДЛЯ ТЕМЫ ===
  setTheme: theme => {
    set({ theme });

    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      document.documentElement.className = theme;
    }
  },

  toggleTheme: () => {
    const { theme } = get();
    const newTheme = theme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },

  // === ДЕЙСТВИЯ ДЛЯ САЙДБАРА ===
  toggleSidebar: () => {
    set(state => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: open => {
    set({ sidebarOpen: open });
  },

  // === ДЕЙСТВИЯ ДЛЯ МОДАЛЬНЫХ ОКОН ===
  openModal: modalId => {
    set({ activeModal: modalId });
  },

  closeModal: () => {
    set({ activeModal: null });
  },

  // === ОСТАЛЬНЫЕ ДЕЙСТВИЯ ===
  setLoading: loading => set({ isLoading: loading }),
  setIsMobile: mobile => set({ isMobile: mobile }),
}));
```

**Шаг 3: Используем в компонентах**

```typescript
// src/components/layout/Header.tsx
import { useUIStore } from '@repo/hooks';

export function Header() {
  const {
    theme,
    toggleTheme,
    sidebarOpen,
    toggleSidebar
  } = useUIStore();

  return (
    <header className={`header ${theme}`}>
      <button onClick={toggleSidebar}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <h1>ExchangeGO</h1>

      <button onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  );
}

// src/components/layout/Sidebar.tsx
export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="sidebar">
      <nav>
        <a href="/exchange">Обмен</a>
        <a href="/orders">Заказы</a>
        <a href="/profile">Профиль</a>
      </nav>

      <button onClick={() => setSidebarOpen(false)}>
        Закрыть
      </button>
    </aside>
  );
}
```

### Расширенные возможности

**Модальные окна с типизацией:**

```typescript
// Типизированные модальные окна
type ModalType = 'settings' | 'profile' | 'deposit' | 'withdraw';

interface UIState {
  activeModal: ModalType | null;

  // Типизированные методы
  openModal: (modal: ModalType) => void;
  isModalOpen: (modal: ModalType) => boolean;
}

export const useUIStore = createStore<UIState>('ui-store', (set, get) => ({
  activeModal: null,

  openModal: (modal) => set({ activeModal: modal }),

  isModalOpen: (modal) => get().activeModal === modal,

  closeModal: () => set({ activeModal: null }),
}));

// Использование
function App() {
  const { openModal, isModalOpen, closeModal } = useUIStore();

  return (
    <div>
      <button onClick={() => openModal('settings')}>
        Настройки
      </button>

      {isModalOpen('settings') && (
        <SettingsModal onClose={closeModal} />
      )}
    </div>
  );
}
```

- - Notification preferences
    \*/

interface UIState {
// Sidebar управление
sidebarOpen: boolean;
toggleSidebar: () => void;
setSidebarOpen: (open: boolean) => void;

// Modals система
activeModal: string | null;
modals: {
settings: boolean;
trade: boolean;
deposit: boolean;
withdraw: boolean;
support: boolean;
profile: boolean;
};
openModal: (modalId: string) => void;
closeModal: () => void;
openSpecificModal: (modal: keyof UIState['modals']) => void;
closeSpecificModal: (modal: keyof UIState['modals']) => void;

// Loading states
globalLoading: boolean;
pageLoading: boolean;
setGlobalLoading: (loading: boolean) => void;
setPageLoading: (loading: boolean) => void;

// Theme management
theme: ThemeMode;
setTheme: (theme: ThemeMode) => void;
toggleTheme: () => void;

// Navigation state
activeRoute: string;
setActiveRoute: (route: string) => void;

// Mobile responsiveness
isMobile: boolean;
setIsMobile: (mobile: boolean) => void;

// Notifications preferences
notificationsEnabled: boolean;
soundEnabled: boolean;
setNotificationsEnabled: (enabled: boolean) => void;
setSoundEnabled: (enabled: boolean) => void;

// Utility methods
isAnyModalOpen: () => boolean;
closeAllModals: () => void;
resetUIState: () => void;
}

// Default состояние
const defaultState = {
sidebarOpen: false,
activeModal: null,
modals: {
settings: false,
trade: false,
deposit: false,
withdraw: false,
support: false,
profile: false,
},
globalLoading: false,
pageLoading: false,
theme: THEME_MODES.LIGHT as ThemeMode,
activeRoute: '/',
isMobile: false,
notificationsEnabled: true,
soundEnabled: true,
};

export const useUIStore = createStore<UIState>('ui-store', (set, get) => {
// Helper для обновления modals
const updateModal = (modalKey: keyof UIState['modals'], isOpen: boolean) => {
set(state => ({
modals: {
...state.modals,
[modalKey]: isOpen,
},
activeModal: isOpen ? modalKey : state.activeModal === modalKey ? null : state.activeModal,
}));
};

return {
// Начальное состояние
...defaultState,

    // Sidebar actions
    toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

    // Modal actions
    openModal: (modalId: string) => {
      // Закрываем все другие modals
      const newModals = Object.keys(get().modals).reduce(
        (acc, key) => {
          acc[key as keyof UIState['modals']] = key === modalId;
          return acc;
        },
        {} as UIState['modals']
      );

      set({
        modals: newModals,
        activeModal: modalId,
      });
    },

    closeModal: () => {
      const { activeModal } = get();
      if (activeModal) {
        updateModal(activeModal as keyof UIState['modals'], false);
      }
    },

    openSpecificModal: (modal: keyof UIState['modals']) => {
      updateModal(modal, true);
    },

    closeSpecificModal: (modal: keyof UIState['modals']) => {
      updateModal(modal, false);
    },

    // Loading actions
    setGlobalLoading: (loading: boolean) => set({ globalLoading: loading }),
    setPageLoading: (loading: boolean) => set({ pageLoading: loading }),

    // Theme actions
    setTheme: (theme: ThemeMode) => {
      set({ theme });

      // Обновляем HTML класс для CSS
      if (typeof window !== 'undefined') {
        document.documentElement.className = theme;
        localStorage.setItem('theme', theme);
      }
    },

    toggleTheme: () => {
      const { theme } = get();
      const newTheme = theme === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT;
      get().setTheme(newTheme);
    },

    // Navigation actions
    setActiveRoute: (route: string) => set({ activeRoute: route }),

    // Mobile actions
    setIsMobile: (mobile: boolean) => set({ isMobile: mobile }),

    // Notification actions
    setNotificationsEnabled: (enabled: boolean) => set({ notificationsEnabled: enabled }),
    setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),

    // Utility methods
    isAnyModalOpen: () => {
      const { modals } = get();
      return Object.values(modals).some(isOpen => isOpen);
    },

    closeAllModals: () => {
      const newModals = Object.keys(get().modals).reduce(
        (acc, key) => {
          acc[key as keyof UIState['modals']] = false;
          return acc;
        },
        {} as UIState['modals']
      );

      set({
        modals: newModals,
        activeModal: null,
      });
    },

    resetUIState: () => set(defaultState),

};
});

// Типизированный экспорт для использования в компонентах
export type UIStore = ReturnType<typeof useUIStore>;

````

## 🔄 Exchange Store - состояние формы обмена

### Комплексный store для обмена валют

```typescript
// packages/hooks/src/state/exchange-store.ts
import type { OrderStatus } from '@repo/constants';
import { UI_DEBOUNCE_CONSTANTS } from '@repo/constants';
import type { CryptoCurrency, ExchangeRate, FiatCurrency, Bank } from '@repo/exchange-core';
import {
  createStore,
  createDebounceAction,
  createTimerActions,
  type TimerState,
} from '@repo/utils';

import { DEFAULT_FORM_DATA, DEFAULT_STEPS } from './exchange-constants';
import { createFiatActions } from './exchange-fiat-actions';
import {
  calculateExchangeRate,
  getNextStepIndex,
  getPrevStepIndex,
  clampStepIndex,
} from './exchange-helpers';

// Типы для формы обмена
export interface ExchangeFormData {
  fromCurrency: CryptoCurrency;
  tokenStandard: string;
  toCurrency: 'UAH';
  fromAmount: number; // Унифицированное имя (было cryptoAmount)
  uahAmount: number;
  selectedBankId: string;
  cardNumber: string;
  email: string;
  captcha: string; // Унифицированное имя (было captchaAnswer)
  agreeToTerms: boolean;
  rememberData?: boolean;
}

export interface ExchangeCalculation {
  fromAmount: number;
  toAmount: number;
  rate: number;
  commission: number;
  commissionAmount: number;
  finalAmount: number;
  isValid: boolean;
  errors: string[];
}

export interface ExchangeStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  component?: string; // Имя компонента для рендера
}

export interface ExchangeOrderData {
  orderId?: string;
  status?: OrderStatus;
  createdAt?: Date;
  estimatedCompletion?: Date;
  transactionHash?: string;
  paymentInstructions?: string;
}

// Основной interface Store
export interface ExchangeStore extends TimerState {
  // Form data
  formData: ExchangeFormData;

  // Calculations
  calculation: ExchangeCalculation | null;

  // Multi-step wizard
  currentStep: number;
  steps: ExchangeStep[];

  // Order tracking
  currentOrder: ExchangeOrderData | null;

  // Available options
  availableRates: ExchangeRate[];
  availableBanks: Bank[];

  // UI state
  isSubmitting: boolean;
  showAdvancedOptions: boolean;
  validationErrors: Record<string, string>;

  // Actions - Form updates
  updateFormField: <K extends keyof ExchangeFormData>(field: K, value: ExchangeFormData[K]) => void;
  updateFormData: (data: Partial<ExchangeFormData>) => void;
  resetFormData: () => void;

  // Actions - Calculations
  updateCalculation: (calculation: ExchangeCalculation) => void;
  recalculateAmounts: () => void;

  // Actions - Steps
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  markStepCompleted: (stepIndex: number) => void;
  resetSteps: () => void;

  // Actions - Order
  setCurrentOrder: (order: ExchangeOrderData) => void;
  updateOrderStatus: (status: OrderStatus) => void;
  clearCurrentOrder: () => void;

  // Actions - Available data
  setAvailableRates: (rates: ExchangeRate[]) => void;
  setAvailableBanks: (banks: Bank[]) => void;

  // Actions - UI
  setSubmitting: (submitting: boolean) => void;
  toggleAdvancedOptions: () => void;
  setValidationError: (field: string, error: string) => void;
  clearValidationErrors: () => void;

  // Actions - Utility
  validateForm: () => boolean;
  canProceedToNextStep: () => boolean;
  getFormProgress: () => number;

  // Debounced actions (для UX)
  debouncedRecalculate: () => void;
}

export const useExchangeStore = createStore<ExchangeStore>('exchange-store', (set, get) => {
  // Создаем debounced action для пересчета
  const debouncedRecalculate = createDebounceAction(
    () => get().recalculateAmounts(),
    UI_DEBOUNCE_CONSTANTS.CALCULATION_DELAY
  );

  // Создаем timer actions для timeout операций
  const timerActions = createTimerActions(set);

  return {
    // Наследуем timer functionality
    ...timerActions.getInitialState(),

    // Начальное состояние
    formData: DEFAULT_FORM_DATA,
    calculation: null,
    currentStep: 0,
    steps: DEFAULT_STEPS,
    currentOrder: null,
    availableRates: [],
    availableBanks: [],
    isSubmitting: false,
    showAdvancedOptions: false,
    validationErrors: {},

    // Timer actions из mixin
    ...timerActions.getActions(),

    // Form actions
    updateFormField: (field, value) => {
      set(state => ({
        formData: {
          ...state.formData,
          [field]: value,
        },
      }));

      // Автоматический пересчет для числовых полей
      if (field === 'fromAmount' || field === 'fromCurrency') {
        get().debouncedRecalculate();
      }
    },

    updateFormData: data => {
      set(state => ({
        formData: {
          ...state.formData,
          ...data,
        },
      }));

      // Пересчитываем если изменились ключевые поля
      const hasAmountChanges = 'fromAmount' in data || 'fromCurrency' in data;
      if (hasAmountChanges) {
        get().debouncedRecalculate();
      }
    },

    resetFormData: () => {
      set({
        formData: DEFAULT_FORM_DATA,
        calculation: null,
        validationErrors: {},
      });
    },

    // Calculation actions
    updateCalculation: calculation => set({ calculation }),

    recalculateAmounts: () => {
      const { formData, availableRates } = get();

      try {
        const calculation = calculateExchangeRate(
          formData.fromAmount,
          formData.fromCurrency,
          availableRates
        );

        set({ calculation });
      } catch (error) {
        console.error('Calculation error:', error);

        set({
          calculation: {
            fromAmount: formData.fromAmount,
            toAmount: 0,
            rate: 0,
            commission: 0,
            commissionAmount: 0,
            finalAmount: 0,
            isValid: false,
            errors: ['Ошибка расчета курса'],
          },
        });
      }
    },

    // Step actions
    nextStep: () => {
      const { currentStep, steps } = get();
      const nextIndex = getNextStepIndex(currentStep, steps);

      if (nextIndex !== currentStep) {
        set({
          currentStep: nextIndex,
          steps: steps.map((step, index) => ({
            ...step,
            isActive: index === nextIndex,
            isCompleted: index < nextIndex ? true : step.isCompleted,
          })),
        });
      }
    },

    previousStep: () => {
      const { currentStep, steps } = get();
      const prevIndex = getPrevStepIndex(currentStep, steps);

      if (prevIndex !== currentStep) {
        set({
          currentStep: prevIndex,
          steps: steps.map((step, index) => ({
            ...step,
            isActive: index === prevIndex,
          })),
        });
      }
    },

    goToStep: stepIndex => {
      const { steps } = get();
      const clampedIndex = clampStepIndex(stepIndex, steps);

      set({
        currentStep: clampedIndex,
        steps: steps.map((step, index) => ({
          ...step,
          isActive: index === clampedIndex,
        })),
      });
    },

    markStepCompleted: stepIndex => {
      set(state => ({
        steps: state.steps.map((step, index) =>
          index === stepIndex ? { ...step, isCompleted: true } : step
        ),
      }));
    },

    resetSteps: () => {
      set({
        currentStep: 0,
        steps: DEFAULT_STEPS.map((step, index) => ({
          ...step,
          isActive: index === 0,
          isCompleted: false,
        })),
      });
    },

    // Order actions
    setCurrentOrder: order => set({ currentOrder: order }),

    updateOrderStatus: status => {
      set(state => ({
        currentOrder: state.currentOrder ? { ...state.currentOrder, status } : null,
      }));
    },

    clearCurrentOrder: () => set({ currentOrder: null }),

    // Available data actions
    setAvailableRates: rates => {
      set({ availableRates: rates });
      get().recalculateAmounts(); // Пересчитываем с новыми курсами
    },

    setAvailableBanks: banks => set({ availableBanks: banks }),

    // UI actions
    setSubmitting: submitting => set({ isSubmitting: submitting }),
    toggleAdvancedOptions: () =>
      set(state => ({
        showAdvancedOptions: !state.showAdvancedOptions,
      })),

    setValidationError: (field, error) => {
      set(state => ({
        validationErrors: {
          ...state.validationErrors,
          [field]: error,
        },
      }));
    },

    clearValidationErrors: () => set({ validationErrors: {} }),

    // Utility actions
    validateForm: () => {
      const { formData } = get();
      const errors: Record<string, string> = {};

      // Валидация обязательных полей
      if (!formData.fromCurrency) {
        errors.fromCurrency = 'Выберите валюту для обмена';
      }

      if (!formData.fromAmount || formData.fromAmount <= 0) {
        errors.fromAmount = 'Введите корректную сумму';
      }

      if (!formData.email) {
        errors.email = 'Email обязателен';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Некорректный email';
      }

      if (!formData.cardNumber) {
        errors.cardNumber = 'Номер карты обязателен';
      }

      if (!formData.agreeToTerms) {
        errors.agreeToTerms = 'Необходимо согласие с условиями';
      }

      // Обновляем ошибки в store
      set({ validationErrors: errors });

      return Object.keys(errors).length === 0;
    },

    canProceedToNextStep: () => {
      const { currentStep, steps, calculation } = get();

      // Основные проверки
      if (currentStep >= steps.length - 1) return false;
      if (!get().validateForm()) return false;
      if (!calculation?.isValid) return false;

      // Специфичные проверки для шагов
      switch (currentStep) {
        case 0: // Amount step
          return calculation.fromAmount > 0 && calculation.toAmount > 0;
        case 1: // Details step
          return get().formData.email && get().formData.cardNumber;
        case 2: // Confirmation step
          return get().formData.agreeToTerms;
        default:
          return true;
      }
    },

    getFormProgress: () => {
      const { currentStep, steps } = get();
      return Math.round(((currentStep + 1) / steps.length) * 100);
    },

    // Debounced actions
    debouncedRecalculate,
  };
});
````

## 🔔 Notification Store - система уведомлений

### Smart notification система

```typescript
// packages/hooks/src/state/notification-store.ts
import { BUSINESS_LIMITS } from '@repo/constants';
import { createStore, createTimerActions, type TimerState } from '@repo/utils';
import { nanoid } from 'nanoid';

// Типы уведомлений
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number; // в миллисекундах, null = постоянное
  action?: NotificationAction;
  persistent?: boolean; // не удаляется автоматически
  createdAt: number;
}

export interface NotificationStore extends TimerState {
  notifications: Notification[];

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Convenience methods
  success: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) => string;
  error: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) => string;
  warning: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) => string;
  info: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) => string;

  // Business-specific methods
  orderCreated: (orderId: string) => string;
  orderStatusUpdate: (orderId: string, status: string) => string;
  paymentReceived: (amount: number, currency: string) => string;
  exchangeCompleted: (fromAmount: number, fromCurrency: string, toAmount: number) => string;

  // Utility methods
  getNotificationsByType: (type: NotificationType) => Notification[];
  hasUnreadNotifications: () => boolean;
  getUnreadCount: () => number;
  markAllAsRead: () => void;
}

// Default продолжительность для разных типов
const DEFAULT_DURATIONS = {
  success: 4000,
  error: 8000, // Ошибки показываем дольше
  warning: 6000,
  info: 5000,
} as const;

// Создаем convenience методы для нотификаций
const createConvenienceMethods = (get: () => NotificationStore) => ({
  success: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) =>
    get().addNotification({
      type: 'success',
      title,
      description,
      duration: DEFAULT_DURATIONS.success,
      ...options,
    }),

  error: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) =>
    get().addNotification({
      type: 'error',
      title,
      description,
      duration: DEFAULT_DURATIONS.error,
      ...options,
    }),

  warning: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) =>
    get().addNotification({
      type: 'warning',
      title,
      description,
      duration: DEFAULT_DURATIONS.warning,
      ...options,
    }),

  info: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) =>
    get().addNotification({
      type: 'info',
      title,
      description,
      duration: DEFAULT_DURATIONS.info,
      ...options,
    }),
});

// Business-specific notification methods
const createBusinessMethods = (get: () => NotificationStore) => ({
  orderCreated: (orderId: string) =>
    get().success('Заказ создан!', `Заказ ${orderId} успешно создан. Ожидайте обработку.`, {
      persistent: true,
    }),

  orderStatusUpdate: (orderId: string, status: string) =>
    get().info('Статус заказа обновлен', `Заказ ${orderId}: ${status}`, { duration: 6000 }),

  paymentReceived: (amount: number, currency: string) =>
    get().success('Платеж получен!', `Поступил платеж: ${amount} ${currency}`, {
      persistent: true,
    }),

  exchangeCompleted: (fromAmount: number, fromCurrency: string, toAmount: number) =>
    get().success('Обмен завершен!', `${fromAmount} ${fromCurrency} → ${toAmount} UAH`, {
      persistent: true,
    }),
});

export const useNotificationStore = createStore<NotificationStore>(
  'notification-store',
  (set, get) => {
    // Timer actions для auto-dismiss
    const timerActions = createTimerActions(set);

    return {
      // Наследуем timer functionality
      ...timerActions.getInitialState(),

      // Начальное состояние
      notifications: [],

      // Timer actions
      ...timerActions.getActions(),

      // Core actions
      addNotification: notification => {
        const id = nanoid();
        const newNotification: Notification = {
          ...notification,
          id,
          createdAt: Date.now(),
        };

        set(state => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-dismiss если указана продолжительность и не persistent
        if (newNotification.duration && !newNotification.persistent) {
          get().setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }

        // Ограничиваем количество уведомлений
        const { notifications } = get();
        if (notifications.length > BUSINESS_LIMITS.MAX_NOTIFICATIONS) {
          const oldestId = notifications[0].id;
          get().removeNotification(oldestId);
        }

        return id;
      },

      removeNotification: id => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
        get().clearAllTimeouts(); // Очищаем все таймеры
      },

      // Convenience methods
      ...createConvenienceMethods(get),

      // Business methods
      ...createBusinessMethods(get),

      // Utility methods
      getNotificationsByType: type => {
        return get().notifications.filter(n => n.type === type);
      },

      hasUnreadNotifications: () => {
        // В будущем можно добавить поле `read`
        return get().notifications.length > 0;
      },

      getUnreadCount: () => {
        // В будущем можно добавить поле `read`
        return get().notifications.length;
      },

      markAllAsRead: () => {
        // В будущем можно добавить поле `read`
        // Пока просто очищаем все
        get().clearNotifications();
      },
    };
  }
);
```

## 🔧 Использование в компонентах

### Базовое использование UI Store

```typescript
// src/components/layout/Sidebar.tsx
import { useUIStore } from '@repo/hooks';

export function Sidebar() {
  const {
    sidebarOpen,
    toggleSidebar,
    theme,
    toggleTheme,
    isMobile
  } = useUIStore();

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <button
        onClick={toggleSidebar}
        className="sidebar-toggle"
      >
        {sidebarOpen ? 'Закрыть' : 'Открыть'}
      </button>

      <button
        onClick={toggleTheme}
        className="theme-toggle"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {isMobile && (
        <div className="mobile-specific-content">
          Мобильная версия
        </div>
      )}
    </aside>
  );
}
```

### Оптимизированное использование с селекторами

```typescript
// packages/hooks/src/state/exchange-selectors.ts
import type { ExchangeStore } from './exchange-store';

// Селекторы для оптимизации re-renders
export const selectFormData = (state: ExchangeStore) => state.formData;
export const selectCalculation = (state: ExchangeStore) => state.calculation;
export const selectCurrentStep = (state: ExchangeStore) => state.currentStep;
export const selectValidationErrors = (state: ExchangeStore) => state.validationErrors;

// Производные селекторы
export const selectIsFormValid = (state: ExchangeStore) => {
  const { formData, calculation } = state;
  return !!(
    formData.fromCurrency &&
    formData.fromAmount &&
    formData.cardNumber &&
    formData.email &&
    formData.agreeToTerms &&
    calculation?.isValid
  );
};

export const selectFormProgress = (state: ExchangeStore) => {
  const { currentStep, steps } = state;
  return Math.round(((currentStep + 1) / steps.length) * 100);
};

// Использование селекторов
// src/components/exchange/ExchangeForm.tsx
import { useExchangeStore } from '@repo/hooks';
import { selectFormData, selectIsFormValid, selectValidationErrors } from '@repo/hooks/state/exchange-selectors';

export function ExchangeForm() {
  // ✅ Оптимизированно: компонент перерендерится только при изменении этих полей
  const formData = useExchangeStore(selectFormData);
  const isFormValid = useExchangeStore(selectIsFormValid);
  const validationErrors = useExchangeStore(selectValidationErrors);

  // ✅ Actions не вызывают re-render
  const updateFormField = useExchangeStore(state => state.updateFormField);
  const validateForm = useExchangeStore(state => state.validateForm);

  return (
    <form onSubmit={(e) => { e.preventDefault(); validateForm(); }}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => updateFormField('email', e.target.value)}
        className={validationErrors.email ? 'error' : ''}
      />

      {validationErrors.email && (
        <span className="error-message">{validationErrors.email}</span>
      )}

      <button
        type="submit"
        disabled={!isFormValid}
        className="submit-button"
      >
        Создать заказ
      </button>
    </form>
  );
}
```

### Интеграция с notifications

```typescript
// src/components/notifications/NotificationProvider.tsx
import { useEffect } from 'react';
import { useNotificationStore } from '@repo/hooks';
import { toast } from '@repo/ui/components/ui/toast';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const notifications = useNotificationStore(state => state.notifications);
  const removeNotification = useNotificationStore(state => state.removeNotification);

  useEffect(() => {
    // Показываем новые уведомления через toast
    notifications.forEach(notification => {
      if (!notification.persistent) {
        toast({
          title: notification.title,
          description: notification.description,
          variant: notification.type === 'error' ? 'destructive' : 'default',
          action: notification.action ? {
            altText: notification.action.label,
            onClick: notification.action.onClick,
          } : undefined,
        });

        // Удаляем из store после показа toast
        removeNotification(notification.id);
      }
    });
  }, [notifications, removeNotification]);

  return <>{children}</>;
}

// Использование в бизнес-логике
// src/hooks/useExchangeMutations.ts
import { useNotificationStore } from '@repo/hooks';
import { trpc } from '../lib/trpc';

export function useExchangeMutations() {
  const notifications = useNotificationStore();

  const createOrder = trpc.exchange.createOrder.useMutation({
    onSuccess: (data) => {
      notifications.orderCreated(data.orderId);
    },

    onError: (error) => {
      notifications.error(
        'Ошибка создания заказа',
        error.message,
        {
          action: {
            label: 'Попробовать снова',
            onClick: () => {
              // Retry logic
            },
          },
        }
      );
    },
  });

  return { createOrder };
}
```

## ✅ Проверка знаний

### Вопросы для самоконтроля:

1. **Что такое Zustand и для чего он используется?**
   - Минималистичный state manager для React приложений

2. **Какие преимущества централизованной фабрики stores?**
   - Единообразие, DevTools, SSR безопасность, типизация

3. **Когда использовать селекторы?**
   - Для оптимизации производительности и предотвращения лишних re-render

4. **Как работают debounced actions?**
   - Задерживают выполнение action на указанное время

5. **Зачем разделять UI и Server состояние?**
   - Разные паттерны управления, разные жизненные циклы

### Практические задания:

1. **Создайте store** для управления настройками пользователя
2. **Добавьте селекторы** для оптимизации конкретного компонента
3. **Реализуйте debounced search** с использованием Zustand
4. **Создайте систему** undo/redo для формы

## 📚 Дополнительные материалы

### Официальная документация:

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Zustand DevTools](https://github.com/pmndrs/zustand#devtools)
- [Immer with Zustand](https://github.com/pmndrs/zustand#immer-middleware)

### Лучшие практики:

- Один store на логический домен
- Используйте селекторы для оптимизации
- Не мутируйте состояние напрямую
- Группируйте связанные actions
- Включайте DevTools в development

---

[← README](./README.md) | [Урок 5.2 →](./lesson-5.2-react-query-trpc-integration.md)

---

## ⚡ Этап 4: Оптимизация производительности _(15 мин)_

### Проблема лишних re-renders

**Проблема:**

```typescript
// ❌ Плохо - компонент перерендерится при любом изменении store
function UserProfile() {
  const store = useUIStore(); // Весь store!

  return <div>Theme: {store.theme}</div>;
}
```

**Решение - селекторы:**

```typescript
// ✅ Хорошо - компонент перерендерится только при изменении theme
function UserProfile() {
  const theme = useUIStore(state => state.theme); // Только theme!

  return <div>Theme: {theme}</div>;
}
```

### Создание селекторов

```typescript
// packages/hooks/src/state/ui-selectors.ts

// Простые селекторы
export const selectTheme = (state: UIState) => state.theme;
export const selectSidebarOpen = (state: UIState) => state.sidebarOpen;
export const selectActiveModal = (state: UIState) => state.activeModal;

// Вычисляемые селекторы
export const selectIsDarkTheme = (state: UIState) => state.theme === 'dark';
export const selectIsAnyModalOpen = (state: UIState) => state.activeModal !== null;

// Комбинированные селекторы
export const selectUIConfig = (state: UIState) => ({
  theme: state.theme,
  isMobile: state.isMobile,
  sidebarOpen: state.sidebarOpen,
});

// Использование селекторов
function ThemeToggle() {
  const isDark = useUIStore(selectIsDarkTheme);
  const toggleTheme = useUIStore(state => state.toggleTheme);

  return (
    <button onClick={toggleTheme}>
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
```

### Подписки на изменения

```typescript
// Слушаем изменения темы для сохранения в localStorage
useEffect(() => {
  const unsubscribe = useUIStore.subscribe(
    state => state.theme,
    theme => {
      localStorage.setItem('theme', theme);
      document.documentElement.className = theme;
    }
  );

  return unsubscribe;
}, []);

// Слушаем изменения модальных окон для управления скроллом
useEffect(() => {
  const unsubscribe = useUIStore.subscribe(
    state => state.activeModal,
    activeModal => {
      if (activeModal) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    }
  );

  return unsubscribe;
}, []);
```

### Middleware для логирования

```typescript
// packages/utils/src/store-middleware.ts
import { StateCreator } from 'zustand';

// Middleware для логирования изменений
export const logger =
  <T>(f: StateCreator<T, [], [], T>): StateCreator<T, [], [], T> =>
  (set, get, api) =>
    f(
      (...args) => {
        console.log('Previous state:', get());
        set(...args);
        console.log('New state:', get());
      },
      get,
      api
    );

// Использование
const useUIStore = createStore(
  'ui-store',
  logger((set, get) => ({
    // ... store implementation
  }))
);
```

### ✅ Контрольная точка 4

**Проверьте понимание:**

1. **В чем разница между `useStore()` и `useStore(selector)`?**
   <details>
   <summary>Показать ответ</summary>

   Первый вариант подписывается на весь store и вызывает re-render при любом изменении. Второй - только при изменении выбранной части состояния.
   </details>

2. **Когда использовать подписки (`subscribe`)?**
   <details>
   <summary>Показать ответ</summary>

   Для side effects, которые не связаны с рендерингом компонентов (сохранение в localStorage, изменение DOM).
   </details>

---

## 🧪 Этап 5: Тестирование Zustand stores _(10 мин)_

### Тестирование stores

```typescript
// packages/hooks/src/state/__tests__/ui-store.test.ts
import { renderHook, act } from '@testing-library/react';
import { useUIStore } from '../ui-store';

describe('useUIStore', () => {
  beforeEach(() => {
    // Сбрасываем store перед каждым тестом
    useUIStore.setState({
      theme: 'light',
      sidebarOpen: false,
      activeModal: null,
      isLoading: false,
      isMobile: false,
    });
  });

  it('должен переключать тему', () => {
    const { result } = renderHook(() => useUIStore());

    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
  });

  it('должен управлять сайдбаром', () => {
    const { result } = renderHook(() => useUIStore());

    expect(result.current.sidebarOpen).toBe(false);

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.sidebarOpen).toBe(true);
  });

  it('должен управлять модальными окнами', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.openModal('settings');
    });

    expect(result.current.activeModal).toBe('settings');

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.activeModal).toBe(null);
  });
});
```

### Мокирование stores в тестах компонентов

```typescript
// src/components/__tests__/Header.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

// Мокируем store
jest.mock('@repo/hooks', () => ({
  useUIStore: jest.fn(),
}));

const mockUseUIStore = useUIStore as jest.MockedFunction<typeof useUIStore>;

describe('Header', () => {
  const mockToggleTheme = jest.fn();
  const mockToggleSidebar = jest.fn();

  beforeEach(() => {
    mockUseUIStore.mockReturnValue({
      theme: 'light',
      sidebarOpen: false,
      toggleTheme: mockToggleTheme,
      toggleSidebar: mockToggleSidebar,
    });
  });

  it('должен отображать кнопку переключения темы', () => {
    render(<Header />);

    const themeButton = screen.getByRole('button', { name: /🌙/ });
    expect(themeButton).toBeInTheDocument();
  });

  it('должен вызывать toggleTheme при клике', () => {
    render(<Header />);

    const themeButton = screen.getByRole('button', { name: /🌙/ });
    fireEvent.click(themeButton);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});
```

---

## ✅ Финальная проверка знаний

### Комплексные вопросы:

1. **Объясните жизненный цикл изменения состояния в Zustand**
   <details>
   <summary>Показать ответ</summary>
   1. Компонент вызывает action (например, `toggleTheme()`)
   2. Action вызывает `set()` с новым состоянием
   3. Zustand обновляет внутреннее состояние
   4. Все подписанные компоненты получают уведомление
   5. Компоненты с изменившимися данными перерендериваются
   </details>

2. **Когда использовать несколько stores вместо одного большого?**
   <details>
   <summary>Показать ответ</summary>
   - Разные домены данных (UI vs бизнес-логика)
   - Разные жизненные циклы (сессионные vs постоянные данные)
   - Разные команды разработчиков
   - Оптимизация производительности
   </details>

3. **Как обеспечить типобезопасность в Zustand stores?**
   <details>
   <summary>Показать ответ</summary>
   - Определить интерфейс store с типами состояния и actions
   - Использовать `create<StoreInterface>()`
   - Создать типизированные селекторы
   - Экспортировать типы для использования в компонентах
   </details>

### Практическое задание

**Создайте notification store:**

1. **Состояние:** массив уведомлений с типами (success, error, warning, info)
2. **Actions:** добавление, удаление, очистка всех уведомлений
3. **Автоудаление:** уведомления исчезают через 5 секунд
4. **Компонент:** NotificationList для отображения
5. **Тесты:** покрытие основной функциональности

---

## 📚 Заключение

**Что вы изучили:**

- 🏗️ **Основы Zustand** - создание простых stores с состоянием и actions
- 🏭 **Архитектуру проекта** - фабрика stores и организация кода
- 🎨 **UI Store** - управление глобальным состоянием интерфейса
- ⚡ **Оптимизацию** - селекторы, подписки и предотвращение лишних re-renders
- 🧪 **Тестирование** - unit тесты для stores и мокирование в компонентах

**Ключевые принципы:**

1. **Простота** - Zustand минималистичен и понятен
2. **Типобезопасность** - используйте TypeScript интерфейсы
3. **Разделение ответственности** - отдельные stores для разных доменов
4. **Производительность** - селекторы для оптимизации re-renders
5. **Тестируемость** - stores легко тестировать изолированно

**Следующие шаги:**

- 🔄 **React Query интеграция** - серверное состояние с tRPC
- 📝 **Формы и валидация** - React Hook Form + Zod
- 🎯 **Продвинутые паттерны** - middleware, persistence, devtools
- 🚀 **Производительность** - мемоизация, lazy loading, code splitting

**Полезные ресурсы:**

- [Zustand документация](https://zustand-demo.pmnd.rs/)
- [TypeScript best practices](https://react-typescript-cheatsheet.netlify.app/)
- [Testing Library guides](https://testing-library.com/docs/react-testing-library/intro/)

---

[← Глава 4: tRPC API](../chapter-04-trpc-api/README.md) | [Урок 5.2: React Query интеграция →](./lesson-5.2-react-query-integration.md)
