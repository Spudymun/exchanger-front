# useOrderTracking.ts - Анализ файла

## Краткое назначение

Real-time order status tracking hook с notification system для мониторинга статуса заказов обмена.

## Подробное описание

### Основная функциональность

Файл предоставляет `useOrderTracking` hook для отслеживания заказов:

- Real-time order status updates
- Автоматические уведомления при изменении статуса
- Mock simulation для development
- Helper methods для проверки состояния заказа
- Integrated notification system

### Ключевые особенности

- **Status tracking**: Отслеживание изменений статуса заказа в real-time
- **Notifications**: Автоматические уведомления при изменении статуса
- **State management**: Полное управление loading, error, и order state
- **Mock simulation**: Development-friendly simulation для тестирования
- **Centralized constants**: Использование ORDER_STATUSES из constants

### Архитектурные решения

- Separation of concerns через helper functions
- Integration с notification system
- useRef для tracking previous status
- Cleanup functions для timers
- Type-safe status handling

## Экспортируемые сущности / API

### Основные exports

```typescript
// Главная функция
export function useOrderTracking(orderId?: string): {
  order: Order | null;
  isLoading: boolean;
  error: string | null;
  isActive: boolean;
  isCompleted: boolean;
  isFailed: boolean;
};

// Order interface
interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  amount: number;
  currency: string;
  direction: string;
  userEmail: string;
}
```

### Return object properties

- `order`: Текущий order object или null
- `isLoading`: Loading state для fetch operations
- `error`: Error message string или null
- `isActive`: Boolean для active orders (PENDING, PAID, PROCESSING)
- `isCompleted`: Boolean для completed orders
- `isFailed`: Boolean для failed/cancelled orders

## Зависимости

### Внутренние зависимости

- `@repo/constants` - OrderStatus, ORDER_STATUSES, BUSINESS_LIMITS
- `../useNotifications` - notification system

### Внешние зависимости

- `react` - useState, useEffect, useRef

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/client-hooks.ts` - barrel export
- Order tracking components
- Exchange flow components

### Использует

- `useNotifications` для status change notifications
- ORDER_STATUSES constants для status validation
- BUSINESS_LIMITS для simulation timing

## Возможные улучшения и риски

### Текущие риски

- **Mock implementation**: Только simulation, нет real API integration
- **Hardcoded values**: Mock data в simulation functions
- **Limited error handling**: Basic error state management

### Рекомендации по улучшению

1. **Real API integration**: Replace simulation с actual API calls
2. **Enhanced error handling**: More specific error types и recovery
3. **Polling strategy**: Implement intelligent polling для real-time updates
4. **Caching**: Add order caching для performance

## TODO и планы развития

### Краткосрочные задачи

- [ ] Replace simulation с real API integration
- [ ] Add comprehensive error handling
- [ ] Implement unit tests для all scenarios

### Долгосрочные задачи

- [ ] WebSocket integration для real-time updates
- [ ] Order history tracking
- [ ] Advanced notification preferences
- [ ] Performance optimization с caching

## Дополнительные заметки

### Architecture breakdown

```typescript
useOrderTracking()
  -> simulateOrderTracking() // Mock API simulation
  -> useOrderStatusNotifications() // Status change notifications
    -> notifyStatusChange() // Helper для notification dispatch
```

### Helper functions

- **simulateOrderTracking**: Mock order data generation с timer-based updates
- **useOrderStatusNotifications**: Watches status changes и triggers notifications
- **notifyStatusChange**: Maps order statuses к appropriate notification types

### Status classification

- **Active orders**: PENDING, PAID, PROCESSING (orders в progress)
- **Completed orders**: COMPLETED status (successfully finished)
- **Failed orders**: CANCELLED status (used instead of hardcoded 'failed')

### Notification strategy

Status-based notification types:

- `success`: COMPLETED orders
- `error`: CANCELLED/FAILED orders
- `info`: All other status changes (PENDING, PAID, PROCESSING)

### Mock simulation details

- Uses `BUSINESS_LIMITS.SIMULATION_UPDATE_INTERVAL_MS` для timing
- Creates mock order с `BUSINESS_LIMITS.TEST_ORDER_AMOUNT`
- Includes proper cleanup functions для timer management

### State management patterns

- Separate useState для order, loading, error
- useRef для previous status tracking (avoids unnecessary notifications)
- useEffect cleanup для timer management
- Derived state для isActive, isCompleted, isFailed

### Error handling approach

- Sets error state on simulation failures
- Clears error on successful operations
- Basic error propagation через return object

### Integration patterns

- Seamless integration с useNotifications
- Uses centralized constants for consistency
- Type-safe status handling через OrderStatus type

### Performance considerations

- Cleanup timers на component unmount
- Conditional effects based на orderId presence
- Minimal re-renders через proper state separation
- Ref usage для status comparison без dependencies
