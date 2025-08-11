# index.ts (state) - Анализ файла

## Краткое назначение

Barrel export файл для всех state stores и их типов - центральная точка экспорта Zustand stores пакета.

## Подробное описание

### Основная функциональность

Файл предоставляет unified exports для всех state management решений:

- Базовые stores (UI, Trading)
- Новые stores (Notification, Exchange)
- Type exports для всех store interfaces
- Consistent naming с base suffix для переиспользования

### Ключевые особенности

- **Barrel pattern**: Централизованные exports для удобства импорта
- **Type safety**: Полный экспорт types для все stores
- **Naming conventions**: Base suffix для stores которые обертываются в других местах
- **Modular organization**: Четкое разделение базовых и новых stores

### Архитектурные решения

- Re-export pattern для все state-related entities
- Separate sections для stores и types
- Consistent naming conventions
- Type-first approach с explicit type exports

## Экспортируемые сущности / API

### Store exports

```typescript
// Базовые stores
export { useUIStore as useUIStoreBase } from './ui-store';
export { useTradingStore, type Trade, type Portfolio } from './trading-store';

// Новые stores
export { useNotificationStore } from './notification-store';
export { useExchangeStore as useExchangeStoreBase } from './exchange-store';
```

### Type exports

```typescript
// Notification store types
export type {
  NotificationStore,
  Notification,
  NotificationType,
  NotificationAction,
} from './notification-store';

// Exchange store types
export type {
  ExchangeStore,
  ExchangeFormData,
  ExchangeCalculation,
  ExchangeStep,
  ExchangeOrderData,
} from './exchange-store';
```

## Зависимости

### Внутренние зависимости

- `./ui-store` - UI state management
- `./trading-store` - Trading logic и portfolio data
- `./notification-store` - Notification system
- `./exchange-store` - Exchange business logic

### Внешние зависимости

- Нет прямых внешних зависимостей

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/index.ts` - main package exports
- `packages/hooks/src/useUIStore.ts` - UI store wrapper
- `packages/hooks/src/useNotifications.ts` - notifications wrapper
- Components которые используют state directly

### Экспортирует из

- Все файлы в `packages/hooks/src/state/` directory
- Store implementations и type definitions

## Возможные улучшения и риски

### Текущие риски

- **Single point of failure**: Все state exports идут через один файл
- **Bundle size**: Может импортировать ненужные stores
- **Dependency cycles**: Потенциальные circular dependencies

### Рекомендации по улучшению

1. **Tree shaking optimization**: Ensure proper tree shaking для unused stores
2. **Type organization**: Group types more systematically
3. **Documentation**: Add JSDoc comments для exported entities

## TODO и планы развития

### Краткосрочные задачи

- [ ] Add JSDoc documentation для всех exports
- [ ] Verify tree shaking effectiveness
- [ ] Review naming consistency

### Долгосрочные задачи

- [ ] Consider splitting по domain для better modularity
- [ ] Optimize bundle size impact
- [ ] Add deprecation warnings для legacy stores

## Дополнительные заметки

### Export organization

Файл организован в две секции:

1. **Store exports**: Actual hook functions и inline types
2. **Type exports**: Explicit type re-exports для better discoverability

### Naming patterns

- **Base suffix**: `useUIStoreBase`, `useExchangeStoreBase` - stores которые wrappеd в other files
- **Direct exports**: `useTradingStore`, `useNotificationStore` - stores используемые directly

### Store categories

- **Базовые stores**: Established stores (UI, Trading)
- **Новые stores**: Recently added stores (Notification, Exchange)

### Type export strategy

Explicit type exports для:

- Store interfaces (`NotificationStore`, `ExchangeStore`)
- Data types (`Notification`, `Trade`, `Portfolio`)
- Configuration types (`NotificationType`, `NotificationAction`)
- Business entities (`ExchangeFormData`, `ExchangeCalculation`)

### Integration patterns

Store exports используются в двух паттернах:

1. **Direct usage**: Import store directly от index
2. **Wrapper pattern**: Import base store и wrap с additional logic

### Bundle considerations

Barrel exports могут влиять на bundle size если:

- Tree shaking не работает properly
- Stores имеют heavy dependencies
- Circular dependencies между stores

### Consistency check

Все stores следуют consistent patterns:

- Zustand-based state management
- TypeScript type safety
- Functional approach
- Hook-based API
