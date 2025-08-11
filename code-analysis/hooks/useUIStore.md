### Путь: packages/hooks/src/useUIStore.ts

**Краткое назначение (1 предложение)**

Enhanced wrapper над базовым UI store с интеграцией централизованной notification системы для unified UX API.

**Подробное описание (3–6 предложений)**

Модуль предоставляет enhanced версию базового UI store с интегрированной notification системой для обеспечения consistent пользовательского опыта по всему приложению. Wrapper добавляет автоматические уведомления при ключевых UI действиях, таких как смена темы, и предоставляет convenient методы для обработки success/error состояний с автоматическим управлением loading состояниями. Система объединяет функциональность UI state management и notification в единый интерфейс, следуя DRY принципу и упрощая использование в компонентах. Включает методы handleError и handleSuccess для стандартизированной обработки операций с автоматической очисткой loading состояний. Модуль обеспечивает backward compatibility через alias экспорт и предоставляет типизированный интерфейс для TypeScript безопасности. Архитектура позволяет легко расширять UI функциональность без изменения базового store.

**Экспортируемые сущности / API**

- `export const useUIStoreEnhanced = () => { ... }` — Enhanced UI store с notifications
- `export type UseUIStoreEnhancedReturn = ReturnType<typeof useUIStoreEnhanced>` — Тип enhanced store
- `export const useUIStore = useUIStoreEnhanced` — Backward compatibility alias

**Входы (expected inputs) / Параметры**

- Hook не принимает параметры — использует базовый UI store и notifications
- Возвращаемые методы принимают специфические параметры для UI операций

**Выходы / Побочные эффекты**

- Возвращает объект с полным API базового UI store плюс enhanced методы:
  - `setTheme: (theme: 'light' | 'dark' | 'system') => void` — смена темы с уведомлениями
  - `handleError: (error: string | Error, context?: string) => void` — обработка ошибок с notifications
  - `handleSuccess: (message: string, description?: string) => void` — обработка успешных операций
  - Все методы базового UI store (theme, sidebar, loading states, etc.)
  - Все методы notification system (success, error, warning, info, etc.)
- Побочные эффекты:
  - Автоматические уведомления при UI операциях
  - Управление global loading состоянием
  - DOM манипуляции через CSS классы и переменные
  - localStorage сохранение настроек

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `packages/hooks/src/useTheme.ts` — useUIStoreEnhanced для theme management
- `packages/hooks/src/client-hooks.ts` — useUIStore для реэкспорта
- `packages/providers/src/theme-provider.tsx` — через client-hooks для ThemeProvider

Файлы, которые импортируются здесь:

- `./state/ui-store` — useUIStoreBase (базовый UI store)
- `./useNotifications` — система уведомлений

**Домен данных / типы**

```typescript
// Enhanced UI Store API
interface UseUIStoreEnhancedReturn extends UIStoreBase, NotificationsAPI {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  handleError: (error: string | Error, context?: string) => void;
  handleSuccess: (message: string, description?: string) => void;
}

// Base UI Store types
interface UIStoreBase {
  theme: ThemeMode;
  sidebarOpen: boolean;
  globalLoading: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleSidebar: () => void;
  setGlobalLoading: (loading: boolean) => void;
  // другие UI state методы
}

// Theme types
type ThemeMode = 'light' | 'dark' | 'system';

// Error handling types
type ErrorInput = string | Error;
type ErrorContext = string | undefined;

// Success handling types
type SuccessMessage = string;
type SuccessDescription = string | undefined;
```

**Риски и безопасность**

- **Notification flooding**: enhanced методы могут создать слишком много уведомлений
- **State consistency**: wrapper должен корректно проксировать все методы базового store
- **Memory leaks**: двойная подписка на store и notifications может привести к утечкам
- **Performance impact**: дополнительные вызовы notifications при каждом UI действии
- **Error handling consistency**: handleError должен корректно обрабатывать все типы ошибок
- **Theme transition flashing**: неправильная координация theme changes может вызвать visual glitches
- **Loading state race conditions**: concurrent операции могут некорректно управлять global loading

**Тесты / рекомендации по покрытию**

- Unit тесты для setTheme: проверка вызова базового setTheme и success notification
- Unit тесты для handleError: различные типы ошибок (string, Error), с context и без
- Unit тесты для handleSuccess: различные комбинации message и description
- Integration тесты: совместная работа с базовым UI store и notification системой
- State management тесты: проверка что loading состояния корректно очищаются
- Proxy тесты: проверка что все методы базового store доступны через wrapper
- Performance тесты: влияние enhanced методов на производительность

**Оценка сложности (low/medium/high)**

**low** — простой wrapper с дополнительными convenience методами, но требует координации multiple систем.

**TODO / Рефакторинг**

- Добавить debouncing для setTheme для предотвращения notification spam
- Рассмотреть добавление batch операций для множественных UI изменений
- Добавить более продвинутую error classification для различных типов уведомлений
- Реализовать context-aware notifications для более релевантных сообщений
- Добавить настройки пользователя для контроля UI notifications
- Рассмотреть separation of concerns между UI state и notification logic
- Добавить методы для programmatic управления notification preferences
