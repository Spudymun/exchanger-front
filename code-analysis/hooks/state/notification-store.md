# notification-store.ts - Анализ файла

## Краткое назначение

Zustand store для управления системой уведомлений с поддержкой таймеров, типизированных actions и convenience methods.

## Подробное описание

### Основная функциональность

Файл предоставляет comprehensive notification store:

- Типизированная система уведомлений (success, error, warning, info)
- Автоматическое удаление уведомлений по истечении времени
- Action buttons в уведомлениях
- Persistent notifications
- Timer management integration
- Convenience methods для каждого типа

### Ключевые особенности

- **Timer integration**: Extends TimerState для auto-dismissal
- **Type safety**: Comprehensive TypeScript typing
- **Action support**: Clickable actions в notifications
- **Rate limiting**: Max notifications limit
- **Centralized constants**: Uses BUSINESS_LIMITS для configuration
- **Modular composition**: Separate action factories

### Архитектурные решения

- Factory pattern для action groups
- Integration с centralized timer utilities
- nanoid для unique IDs
- Immutable state updates
- Selector functions для performance optimization

## Экспортируемые сущности / API

### Core types

```typescript
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
  duration?: number;
  action?: NotificationAction;
  persistent?: boolean;
  createdAt: number;
}
```

### Store interface

```typescript
export interface NotificationStore extends TimerState {
  notifications: Notification[];
  maxNotifications: number;
  defaultDuration: number;

  // Core actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Convenience methods
  success: (title: string, description?: string, options?: Partial<Notification>) => string;
  error: (title: string, description?: string, options?: Partial<Notification>) => string;
  warning: (title: string, description?: string, options?: Partial<Notification>) => string;
  info: (title: string, description?: string, options?: Partial<Notification>) => string;
}
```

### Selectors

```typescript
export const selectNotifications = (state: NotificationStore) => state.notifications;
export const selectNotificationCount = (state: NotificationStore) => state.notifications.length;
export const selectNotificationsByType = (type: NotificationType) => (state: NotificationStore) => Notification[];
```

## Зависимости

### Внутренние зависимости

- `@repo/constants` - BUSINESS_LIMITS для configuration
- `@repo/utils` - createStore, createTimerActions, TimerState

### Внешние зависимости

- `nanoid` - для unique ID generation

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/state/index.ts` - barrel export
- `packages/hooks/src/client-hooks.ts` - client-side export
- `packages/hooks/src/useNotifications.ts` - wrapper hook

### Используется совместно с

- Timer utilities для auto-dismissal
- Business constants для configuration

## Возможные улучшения и риски

### Текущие риски

- **Memory leaks**: Timer cleanup критичен для memory management
- **Performance**: Large notification arrays могут вызывать performance issues
- **Rate limiting**: Basic max count не учитывает user behavior

### Рекомендации по улучшению

1. **Enhanced rate limiting**: Intelligent throttling по user actions
2. **Persistence**: Save important notifications через page reloads
3. **Grouping**: Similar notifications grouping для better UX
4. **Analytics**: Track notification effectiveness

## TODO и планы развития

### Краткосрочные задачи

- [ ] Add notification grouping functionality
- [ ] Implement smart rate limiting
- [ ] Add persistence для critical notifications

### Долгосрочные задачи

- [ ] Real-time notifications integration
- [ ] Enhanced action types
- [ ] Notification analytics
- [ ] Advanced filtering и search

## Дополнительные заметки

### Architecture breakdown

```typescript
NotificationStore = {
  // Core state
  notifications + config,

  // Composed actions
  ...coreActions +
  ...cleanupActions +
  ...convenienceMethods
}
```

### Action factories

- **createAddNotificationAction**: Core notification creation с timer setup
- **createCleanupActions**: Removal и clearing с timer cleanup
- **createConvenienceMethods**: Type-specific shortcuts

### Timer integration patterns

- Auto-dismissal через duration settings
- Manual cleanup на removal
- Bulk cleanup на clear operations
- Centralized timer management через utils

### Constants usage

Uses `BUSINESS_LIMITS` для:

- `DEFAULT_NOTIFICATION_DURATION_MS` - standard duration
- `MAX_NOTIFICATIONS` - rate limiting
- `ERROR_NOTIFICATION_DURATION_MS` - extended error display
- `WARNING_NOTIFICATION_DURATION_MS` - extended warning display

### ID generation strategy

- Uses `nanoid()` для unique, short IDs
- IDs used для timer tracking
- Consistent ID format across application

### State management patterns

- **Immutable updates**: All state changes через spread operators
- **Array slicing**: Non-mutating rate limiting
- **Timer coordination**: Proper cleanup prevents memory leaks
- **Typed actions**: Type-safe notification creation

### Convenience method design

Each type method provides:

- Type-specific defaults (longer duration для errors/warnings)
- Optional description parameter
- Options merging с sensible defaults
- Return notification ID для tracking

### Performance considerations

- Selector functions для targeted subscriptions
- Immutable operations prevent unnecessary renders
- Timer cleanup prevents memory accumulation
- Rate limiting prevents UI overload

### Error handling approach

- Timer cleanup handles edge cases
- Array operations safe от bounds errors
- No throwing errors в store actions
- Graceful degradation для missing configurations

### Integration patterns

Store designed для:

- Direct usage через selectors
- Wrapper hooks с additional logic (useNotifications)
- Component integration через subscriptions
- Business logic integration через actions

### Action button support

`NotificationAction` provides:

- Custom click handlers
- Button variant styling
- Label customization
- Integration с UI component system

### Type safety approach

- Comprehensive TypeScript coverage
- Union types для notification types
- Interface segregation для different concerns
- Type guards where appropriate

### Future extensibility

Architecture supports:

- Additional notification types
- Complex action configurations
- Enhanced timing controls
- Integration с external notification systems
