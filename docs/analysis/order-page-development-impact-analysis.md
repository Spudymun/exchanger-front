# 🔍 Impact Analysis: Страница заказа с Development Controls

> **Роль**: Агент-аналитик  
> **Дата**: 31 августа 2025  
> **Требование**: Создать страницу заказа с возможностью работы без бекенда и ручного управления статусами для тестирования различных сценариев

## 📊 Анализ существующего функционала

### ✅ **Что УЖЕ существует и работает:**

1. **Базовая страница заказа**: `apps/web/app/[locale]/order/[orderId]/page.tsx`
   - Отображает OrderStatus компонент
   - Валидация orderId через схемы
   - Интернационализация готова

2. **OrderStatus компонент**: `apps/web/src/components/OrderStatus.tsx`
   - Полнофункциональный компонент отображения статуса
   - Поддержка `showDetails` и `collapsibleTechnicalDetails`
   - Автообновление через `refetchInterval`
   - Интеграция с `useOrderStatus` hook

3. **Mock-система данных**: `packages/exchange-core/src/data/manager.ts`
   - In-memory хранилище заказов (`orderManager`)
   - CRUD операции для заказов
   - Генерация mock ID через `generateOrderId`

4. **Система отслеживания**: `packages/hooks/src/business/useOrderTracking.ts`
   - Hook с симуляцией изменений статусов
   - Уведомления о смене статусов
   - Функция `simulateOrderTracking`

5. **Валидация статусов**: `packages/utils/src/order-status.ts`
   - `canTransitionStatus` - проверка возможных переходов
   - `getAvailableTransitions` - получение доступных статусов
   - `validateStatusTransition` - валидация с дополнительными данными

6. **Mock данные**: `packages/exchange-core/src/data/mock-data.ts`
   - Примеры заказов с разными статусами
   - Константы для тестовых данных

## 🔍 **Сравнение с новой функциональностью**

### **Покрытие требований существующим функционалом:**

| Требование         | Существующее решение       | Покрытие |
| ------------------ | -------------------------- | -------- |
| Отображение заказа | OrderStatus компонент      | ✅ 100%  |
| Работа без бекенда | orderManager + mock данные | ✅ 90%   |
| Смена статусов     | orderManager.update()      | ✅ 80%   |
| Ручное управление  | ❌ Отсутствует             | 🔴 0%    |
| Тестовые сценарии  | simulateOrderTracking      | 🟡 50%   |
| Edge cases         | ❌ Ограниченно             | 🟡 30%   |

## ⚠️ **Потенциальные конфликты**

### **1. API Compatibility**

- **Риск**: Добавление development-инструментов может влиять на production API
- **Зона риска**: `useOrderStatus` hook и tRPC endpoints
- **Митигация**: Environment-based feature flags

### **2. State Management**

- **Риск**: Ручное изменение статусов может конфликтовать с автоматическими обновлениями
- **Зона риска**: React Query cache invalidation
- **Митигация**: Proper cache management при ручных изменениях

### **3. Security**

- **Риск**: Development controls попадут в production
- **Зона риска**: Условия показа dev-инструментов
- **Митигация**: Строгие environment checks

## 🎯 **Точки расширения (вместо создания нового кода)**

### **1. Расширение orderManager** ⭐ **ПРИОРИТЕТ 1**

```typescript
// Добавить методы в существующий orderManager
orderManager.updateStatus(id, newStatus, additionalData);
orderManager.simulateTransition(id, scenario);
orderManager.resetOrder(id);
```

### **2. Enhancement для OrderStatus компонента** ⭐ **ПРИОРИТЕТ 2**

```typescript
// Добавить props для development режима
<OrderStatus
  orderId={orderId}
  showDetails={true}
  developmentControls={isDevelopment} // НОВЫЙ PROP
/>
```

### **3. Расширение useOrderTracking** ⭐ **ПРИОРИТЕТ 3**

```typescript
// Добавить методы управления
const { order, updateStatus, runScenario, simulateError } = useOrderTracking(orderId);
```

### **4. Environment-based Configuration** ⭐ **ПРИОРИТЕТ 4**

```typescript
// Использовать существующие константы
BUSINESS_LIMITS.DEVELOPMENT_MODE_ENABLED;
```

## ❓ **Уточняющие вопросы**

### **1. Scope разработки**

- **Q**: Нужны ли development controls только на странице заказа или планируется расширение на другие страницы?
- **Impact**: Определяет архитектуру (компонент vs. глобальная система)

### **2. Persistence mock данных**

- **Q**: Должны ли изменения статусов сохраняться между перезагрузками страницы в development режиме?
- **Impact**: localStorage vs in-memory storage

### **3. Team Development**

- **Q**: Будут ли разные разработчики одновременно тестировать разные сценарии?
- **Impact**: Shared vs isolated mock state

### **4. Integration Timeline**

- **Q**: Когда планируется интеграция с реальным бекендом?
- **Impact**: Глубина mock-системы vs simple stubs

### **5. Error Handling**

- **Q**: Какие типы ошибок наиболее критичны для тестирования? (сеть, валидация, бизнес-логика)
- **Impact**: Приоритизация сценариев

### **6. Performance Testing**

- **Q**: Нужно ли симулировать задержки сети для тестирования UX?
- **Impact**: Timing controls в dev-tools

## 📈 **Рекомендуемый подход**

### **Phase 1: Minimal Viable Enhancement**

1. Расширить `orderManager` методами для ручного управления
2. Добавить development-режим в `OrderStatus` компонент
3. Environment-based показ dev-controls

### **Phase 2: Comprehensive Testing Tools**

1. Автоматические сценарии через расширение `useOrderTracking`
2. Error simulation capabilities
3. Timing controls для UX тестирования

### **Phase 3: Production Transition**

1. API abstraction layer
2. Graceful fallback на real backend
3. Feature flags для постепенного перехода

## 🎯 **Ключевой вывод**

**90% требуемой функциональности УЖЕ существует!** Необходимо РАСШИРИТЬ существующие компоненты, а не создавать новые с нуля.

**Критический принцип**: Все новые изменения должны быть **композиционными дополнениями** к существующим компонентам, а не заменой архитектуры.

## ✅ **Ответы на уточняющие вопросы (Best Practices)**

### **1. Scope разработки**

- **A**: **Только страница заказа** (принцип YAGNI - You Aren't Gonna Need It)
- **Обоснование**: Начинаем с минимального scope, расширим при необходимости

### **2. Persistence mock данных**

- **A**: **localStorage** для development режима
- **Обоснование**: Удобство разработки + не теряем состояние при перезагрузке

### **3. Team Development**

- **A**: **Isolated mock state** (per developer)
- **Обоснование**: Каждый разработчик работает независимо, без конфликтов

### **4. Integration Timeline**

- **A**: **Gradual transition** - сначала полный mock, затем hybrid режим
- **Обоснование**: Минимизация рисков при переходе на реальный API

### **5. Error Handling**

- **A**: **Приоритет**: 1) Сеть, 2) Валидация, 3) Бизнес-логика
- **Обоснование**: Самые частые проблемы в production

### **6. Performance Testing**

- **A**: **Да**, реалистичные задержки (200ms - 3s)
- **Обоснование**: Тестирование UX в реальных условиях

---

# 🏗️ Архитектурное решение (Роль: Агент-архитектор)

> **Переход в роль**: Агент-архитектор  
> **Задача**: Спроектировать интеграцию новой функциональности в существующую архитектуру

## 🎯 **Архитектурные принципы**

### **1. Composition over Inheritance**

```typescript
// НЕ заменяем OrderStatus, а ОБОРАЧИВАЕМ его
<OrderWithDevelopmentTools>
  <OrderStatus orderId={orderId} showDetails={true} />
</OrderWithDevelopmentTools>
```

### **2. Environment-driven Behavior**

```typescript
// Разное поведение в зависимости от окружения
const isDevelopment = process.env.NODE_ENV === 'development';
const useDevControls = isDevelopment && process.env.NEXT_PUBLIC_DEV_CONTROLS === 'true';
```

### **3. Dependency Inversion**

```typescript
// Абстракция над источником данных
interface OrderDataSource {
  getOrder(id: string): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order>;
}
```

## 🔧 **Конкретный план интеграции**

### **Phase 1: Core Enhancement (2-3 часа)**

#### **1.1. Расширение orderManager**

```typescript
// packages/exchange-core/src/data/manager.ts
const orderManager = {
  // ...existing methods

  // НОВЫЕ МЕТОДЫ
  updateStatus: (id: string, newStatus: OrderStatus, additionalData?: Record<string, unknown>) => {
    // Валидация через validateStatusTransition
    // Обновление с сохранением в localStorage (dev режим)
  },

  simulateScenario: async (id: string, scenario: DevScenario) => {
    // Автоматическое прохождение по статусам с задержками
  },

  simulateError: (id: string, errorType: string) => {
    // Имитация различных ошибок
  },
};
```

#### **1.2. Enhancement useOrderStatus hook**

```typescript
// apps/web/src/hooks/useOrderStatus.ts
export function useOrderStatus(
  orderId: string,
  options?: {
    developmentControls?: boolean;
  }
) {
  // Existing logic...

  // НОВЫЕ МЕТОДЫ (только в development)
  const updateStatus = useCallback(
    (newStatus: OrderStatus, additionalData?: Record<string, unknown>) => {
      if (process.env.NODE_ENV === 'development') {
        return orderManager.updateStatus(orderId, newStatus, additionalData);
      }
    },
    [orderId]
  );

  return {
    // ...existing returns
    updateStatus: isDevelopment ? updateStatus : undefined,
    runScenario: isDevelopment
      ? scenario => orderManager.simulateScenario(orderId, scenario)
      : undefined,
  };
}
```

#### **1.3. Development Controls Component**

```typescript
// apps/web/src/components/order/OrderDevelopmentPanel.tsx
export function OrderDevelopmentPanel({
  orderId,
  currentOrder,
  onStatusUpdate,
}: {
  orderId: string;
  currentOrder: Order;
  onStatusUpdate: (status: OrderStatus, data?: Record<string, unknown>) => void;
}) {
  // Только в development
  if (process.env.NODE_ENV !== 'development') return null;

  // UI для ручного управления статусами
  // Кнопки для автоматических сценариев
  // Симуляция ошибок
}
```

### **Phase 2: Page Integration (1 час)**

#### **2.1. Обновление страницы заказа**

```typescript
// apps/web/app/[locale]/order/[orderId]/page.tsx
export default async function OrderPage({ params }: OrderPageProps) {
  // ...existing code

  return (
    <main role="main" className={combineStyles(layoutStyles.fullHeight, 'bg-background')}>
      <div className={layoutStyles.container}>
        <h1 className={pageStyles.title.page}>
          {t('exchange.orderCreated', { orderId })}
        </h1>

        {/* Основной компонент - БЕЗ ИЗМЕНЕНИЙ */}
        <OrderStatus
          orderId={orderId}
          showDetails={true}
          collapsibleTechnicalDetails={true}
        />

        {/* Development Controls - ТОЛЬКО В DEV */}
        <OrderDevelopmentWrapper orderId={orderId} />
      </div>
    </main>
  );
}
```

#### **2.2. Wrapper компонент**

```typescript
// apps/web/src/components/order/OrderDevelopmentWrapper.tsx
export function OrderDevelopmentWrapper({ orderId }: { orderId: string }) {
  const { order, updateStatus, runScenario } = useOrderStatus(orderId, {
    developmentControls: true
  })

  if (process.env.NODE_ENV !== 'development' || !order) return null

  return (
    <OrderDevelopmentPanel
      orderId={orderId}
      currentOrder={order}
      onStatusUpdate={updateStatus}
      onRunScenario={runScenario}
    />
  )
}
```

## 📁 **Структура файлов (только новые/измененные)**

```
apps/web/
├── src/components/order/
│   ├── OrderDevelopmentPanel.tsx      # НОВЫЙ
│   └── OrderDevelopmentWrapper.tsx    # НОВЫЙ
├── src/hooks/
│   └── useOrderStatus.ts              # РАСШИРИТЬ
└── app/[locale]/order/[orderId]/
    └── page.tsx                       # МИНИМАЛЬНЫЕ ИЗМЕНЕНИЯ

packages/exchange-core/
└── src/data/
    └── manager.ts                     # РАСШИРИТЬ
```

## 🔐 **Безопасность и Environment Controls**

### **Environment Variables**

```env
# .env.local (для development)
NODE_ENV=development
NEXT_PUBLIC_DEV_CONTROLS=true

# .env.production
NODE_ENV=production
# NEXT_PUBLIC_DEV_CONTROLS отсутствует
```

### **Runtime Checks**

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const hasDevControls = process.env.NEXT_PUBLIC_DEV_CONTROLS === 'true';
const showDevTools = isDevelopment && hasDevControls;
```

## 🚀 **Migration Path to Production**

### **Step 1: Mock Mode (Current)**

```typescript
const useRealAPI = false;
// Все через orderManager
```

### **Step 2: Hybrid Mode**

```typescript
const useRealAPI = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
// Переключение через флаг
```

### **Step 3: Production Mode**

```typescript
const useRealAPI = true;
// Только реальные API, dev-controls скрыты
```

---

**Следующий шаг**: Перейти к роли Агент-кодера для реализации архитектурного решения.
