# Архитектура Development Tools - Лучшие практики

Документирование архитектурных паттернов для разработки Development Tools в monorepo exchanger-front.

## 🎯 Ключевые принципы (реализованы в OrderDevTools.tsx)

### 1. **Client-side State Override Pattern**

```typescript
// ✅ ПРАВИЛЬНО - используем setData() для принудительного обновления cache
const handleStatusChange = (newStatus: OrderStatus) => {
  // 1. Обновляем на сервере
  orderManager.update(orderId, { status: newStatus });

  // 2. Принудительно обновляем клиентский cache
  utils.exchange.getOrderStatus.setData(orderId, newStatus);
};
```

**Обоснование**: Development Tools требуют **мгновенного отклика** для тестирования. setData() напрямую изменяет React Query cache, минуя обычный lifecycle invalidate → refetch.

### 2. **Environment-driven Visibility**

```typescript
// ✅ ПРАВИЛЬНО - показываем только в development среде
const isDevelopment = process.env.NODE_ENV === 'development';

if (!isDevelopment) {
  return null; // Полностью скрываем в production
}
```

### 3. **Composition over Inheritance**

```typescript
// ✅ ПРАВИЛЬНО - обертка, а не замена
<OrderStatus orderId={orderId} />
{isDevelopment && (
  <OrderDevTools orderId={orderId} />
)}
```

## 🏗️ Архитектурные паттерны

### **Pattern 1: Optimistic Updates для Dev Tools**

Согласно **[CODE_REVIEW_PROTOCOLS.md](core/CODE_REVIEW_PROTOCOLS.md)** и **[order-page-development-impact-analysis.md](analysis/order-page-development-impact-analysis.md)**:

```typescript
// Архитектурный принцип: Dev Tools используют optimistic updates
const handleDevAction = async (action: DevAction) => {
  // 1. Мгновенное обновление UI (optimistic)
  utils.exchange.getOrderData.setData(orderId, optimisticData);

  // 2. Background API call для консистентности
  try {
    await orderManager.update(orderId, action.payload);
  } catch (error) {
    // 3. Rollback при ошибке
    utils.exchange.getOrderData.invalidate(orderId);
  }
};
```

### **Pattern 2: Zustand DevTools Integration**

На основе **[CODE_REVIEW_PROTOCOLS.md](core/CODE_REVIEW_PROTOCOLS.md)** линии 527-570:

```typescript
// ✅ ПРАВИЛЬНО - DevTools с именованными actions
export const useDevToolsStore = create<DevToolsState>()(
  devtools(
    (set, get) => ({
      isEnabled: process.env.NODE_ENV === 'development',

      enableDevMode: () =>
        set(
          state => ({ ...state, isEnabled: true }),
          false,
          'enableDevMode' // Именованный action для DevTools
        ),

      updateMockData: data =>
        set(
          state => ({
            ...state,
            mockData: { ...state.mockData, ...data },
          }),
          false,
          'updateMockData'
        ),
    }),
    { name: 'dev-tools-store' } // Имя store в DevTools
  )
);
```

### **Pattern 3: React Query Cache Manipulation**

На основе семантического поиска в tRPC utilities:

```typescript
// ✅ ПРАВИЛЬНО - прямое управление cache для dev tools
interface DevToolsUtils {
  // Мгновенное изменение без API вызова
  setOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Сброс к серверному состоянию
  resetToServer: (orderId: string) => void;

  // Симуляция различных состояний
  simulateError: (orderId: string, errorType: ErrorType) => void;
}

const useDevToolsUtils = (): DevToolsUtils => {
  const utils = trpc.useUtils();

  return {
    setOrderStatus: (orderId, status) => {
      utils.exchange.getOrderStatus.setData(orderId, status);
    },

    resetToServer: orderId => {
      utils.exchange.getOrderStatus.invalidate(orderId);
    },

    simulateError: (orderId, errorType) => {
      utils.exchange.getOrderStatus.setData(orderId, undefined);
      // Устанавливаем error state в cache
    },
  };
};
```

## 🔧 Технические требования

### **1. Dependencies and Imports**

Согласно структуре проекта из **[ARCHITECTURE.md](core/ARCHITECTURE.md)**:

```typescript
// ✅ ПРАВИЛЬНО - используем централизованные пакеты
import { OrderStatus } from '@repo/constants';
import { Button } from '@repo/ui';
import { trpc } from '@/utils/trpc';
```

### **2. Environment Configuration**

На основе **[DEVELOPER_GUIDE.md](core/DEVELOPER_GUIDE.md)** линия 253:

```typescript
// ✅ ПРАВИЛЬНО - точные environment checks
const isDevTools =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_TOOLS === 'true';
```

### **3. Error Boundaries**

```typescript
// ✅ ПРАВИЛЬНО - изоляция dev tools от production кода
const DevToolsWrapper = ({ children }: { children: React.ReactNode }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <ErrorBoundary fallback={<div>Dev Tools Error</div>}>
      {children}
    </ErrorBoundary>
  );
};
```

## 📋 Code Review Checklist

### **Development Tools - Специфичные проверки:**

Дополнение к **[CODE_REVIEW_PROTOCOLS.md](core/CODE_REVIEW_PROTOCOLS.md)**:

- [ ] **Environment safety** - dev tools скрыты в production
- [ ] **Cache isolation** - setData() не влияет на production queries
- [ ] **Memory management** - нет утечек памяти от dev subscriptions
- [ ] **Error isolation** - ошибки dev tools не ломают основной UI
- [ ] **Named actions** - все dev actions имеют читаемые имена в DevTools
- [ ] **Optimistic updates** - мгновенный отклик UI на dev actions
- [ ] **Server sync** - возможность сброса к серверному состоянию

### **React Query Dev Integration:**

- [ ] **setData() usage** - правильное использование для mock состояний
- [ ] **invalidate() fallback** - откат к серверным данным
- [ ] **Query key matching** - соответствие ключей основным queries
- [ ] **Type safety** - dev mock данные соответствуют production типам

## 🎨 UI/UX Patterns

### **Visual Separation**

```typescript
// ✅ ПРАВИЛЬНО - четкое визуальное разделение
const DevToolsPanel = () => (
  <div className="border-2 border-dashed border-orange-400 bg-orange-50 p-4 rounded">
    <div className="text-orange-800 font-mono text-xs mb-2">
      🛠️ DEVELOPMENT TOOLS
    </div>
    {/* Dev controls */}
  </div>
);
```

### **Accessibility**

```typescript
// ✅ ПРАВИЛЬНО - доступность dev tools
<Button
  aria-label={`Change order status to ${status}`}
  className="dev-tool-button"
  data-testid={`dev-status-${status}`}
>
  {status}
</Button>
```

## 🚀 Реализованный паттерн в OrderDevTools.tsx

### **Текущая архитектура (УСПЕШНО работает):**

```typescript
// Архитектурно правильная реализация:
const handleStatusChange = (newStatus: OrderStatus) => {
  // 1. Server update для консистентности данных
  orderManager.update(orderId, { status: newStatus });

  // 2. Client cache override для мгновенного UI обновления
  utils.exchange.getOrderStatus.setData(orderId, newStatus);
};
```

### **Ключевые достижения:**

1. ✅ **Мгновенный отклик** - UI обновляется без задержек
2. ✅ **Архитектурная чистота** - не нарушает production код
3. ✅ **Modern React Query** - использует setData() optimistic pattern
4. ✅ **Type Safety** - полная типизация через @repo/constants
5. ✅ **Композиционность** - работает как дополнение к основному UI

## 📚 Связанная документация

### **Обязательно изучить:**

- **[CODE_REVIEW_PROTOCOLS.md](core/CODE_REVIEW_PROTOCOLS.md)** - DevTools integration patterns
- **[order-page-development-impact-analysis.md](analysis/order-page-development-impact-analysis.md)** - Architectural decisions
- **[DEVELOPER_GUIDE.md](core/DEVELOPER_GUIDE.md)** - Environment configuration
- **[ARCHITECTURE.md](core/ARCHITECTURE.md)** - Project structure и package dependencies

### **Принципы из документации:**

1. **Composition over Inheritance** - ARCHITECTURE.md принцип #1
2. **Environment-driven Behavior** - DEVELOPER_GUIDE.md стандарт
3. **Optimistic Updates** - CODE_REVIEW_PROTOCOLS.md best practice
4. **Client State Management** - React Query setData() pattern

---

## 🎯 Заключение

Development Tools в нашем проекте следуют **modern senior-level архитектуре**:

- **React Query setData()** для optimistic updates
- **Environment-driven** показ только в development
- **Composition pattern** для интеграции с production кодом
- **Type-safe** взаимодействие через @repo/constants

Этот подход обеспечивает **мгновенный отклик UI** для разработчиков при сохранении **архитектурной чистоты** и **безопасности production кода**.
