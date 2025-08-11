### Путь: packages/hooks/src/useNotifications.ts

**Краткое назначение (1 предложение)**

Центральный notification hook, объединяющий всю логику уведомлений в единую точку входа согласно принципу устранения дублирования кода.

**Подробное описание (3–6 предложений)**

Модуль представляет собой консолидированное решение для всех типов уведомлений в приложении, объединяя ранее разбросанную функциональность из нескольких файлов в соответствии с Rule 20 о запрете избыточности. Включает helper функции для извлечения сообщений об ошибках, API handlers для success/error состояний, специализированные Exchange handlers для обменных операций и utility методы для интерактивных уведомлений. Система поддерживает различные типы уведомлений: success, error, warning, info с возможностью настройки persistence и действий пользователя. Модуль удаляет дублированные Auth handlers в пользу локализованных переводов в useAuthMutations.ts для лучшей интернационализации. Архитектура построена на базовом notification store с дополнительными convenience методами для типичных use cases. Функциональность включает форм валидацию, подтверждение действий, retry механизмы и progress tracking.

**Экспортируемые сущности / API**

- `export const useNotifications = () => { ... }` — Главный notification hook
- `export type UseNotificationsReturn = ReturnType<typeof useNotifications>` — Тип возвращаемого значения

**Входы (expected inputs) / Параметры**

- Hook не принимает параметры — использует базовый notification store
- Возвращаемые методы принимают различные параметры для создания уведомлений

**Выходы / Побочные эффекты**

- Возвращает объект с полным API notification store плюс специализированные методы:
  - **API handlers**: `apiSuccess`, `apiError`, `apiLoading`, `handleApiSuccess`, `handleApiError`, `handleFormValidation`
  - **Exchange handlers**: `orderCreated`, `orderCompleted`, `exchangeError`, `handleExchangeSuccess`, `handleExchangeError`
  - **Utility methods**: `confirmAction`, `askRetry`, `showProgress`
- Побочные эффекты: отображение уведомлений в UI, управление их жизненным циклом
- Интеграция с notification store для централизованного state management
- Автоматическое извлечение и форматирование error сообщений

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `packages/hooks/src/useUIStore.ts` — интеграция с UI состоянием
- `packages/hooks/src/useTheme.ts` — уведомления при смене темы
- `packages/hooks/src/useExchangeStore.ts` — валидация и обменные операции
- `packages/hooks/src/business/useForm.ts` — форм валидация
- `packages/hooks/src/business/useOrderTracking.ts` — статусы заявок
- `packages/hooks/src/client-hooks.ts` — реэкспорт для клиентских компонентов

Файлы, которые импортируются здесь:

- `./state/notification-store` — базовый notification store и типы

**Домен данных / типы**

```typescript
// Notification types
interface NotificationStore {
  success: (title: string, message?: string, options?) => void;
  error: (title: string, message?: string, options?) => void;
  warning: (title: string, message?: string, options?) => void;
  info: (title: string, message?: string, options?) => void;
}

// API Handlers
interface ApiHandlers {
  apiSuccess: (message: string) => void;
  apiError: (error: unknown) => void;
  apiLoading: (message: string) => void;
  handleApiSuccess: (message: string, description?: string) => void;
  handleApiError: (error: unknown, context?: string) => void;
  handleFormValidation: (errors: Record<string, string[]>) => void;
}

// Exchange Handlers
interface ExchangeHandlers {
  orderCreated: (orderId: string) => void;
  orderCompleted: (orderId: string) => void;
  exchangeError: (error: string) => void;
  handleExchangeSuccess: (fromCurrency: string, toCurrency: string, amount: number) => void;
  handleExchangeError: (error: unknown) => void;
}

// Utility Methods
interface UtilityMethods {
  confirmAction: (title: string, description: string, onConfirm: () => void) => void;
  askRetry: (title: string, description: string, onRetry: () => void) => void;
  showProgress: (title: string, progress: number) => void;
}

// Combined return type
type UseNotificationsReturn = NotificationStore & ApiHandlers & ExchangeHandlers & UtilityMethods;
```

**Риски и безопасность**

- **Error message exposure**: автоматическое извлечение ошибок может раскрыть sensitive информацию
- **Notification spam**: неправильное использование может привести к избыточным уведомлениям
- **Memory leaks**: persistent уведомления должны правильно очищаться
- **Performance impact**: большое количество уведомлений может влиять на производительность
- **User experience**: неправильное использование confirmAction/askRetry может нарушить UX
- **State consistency**: уведомления должны синхронизироваться с актуальным состоянием приложения
- **XSS vulnerabilities**: необходима санитизация пользовательского ввода в сообщениях

**Тесты / рекомендации по покрытию**

- Unit тесты для extractErrorMessage: различные типы ошибок (Error, string, object, unknown)
- Unit тесты для API handlers: success/error/loading сценарии
- Unit тесты для Exchange handlers: создание/завершение заявок, обработка ошибок
- Unit тесты для Utility methods: confirmAction с callbacks, retry механизм, progress updates
- Integration тесты: совместная работа с notification store
- Form validation тесты: обработка различных структур ошибок
- Error handling тесты: graceful обработка неожиданных типов ошибок
- Performance тесты: поведение при большом количестве уведомлений

**Оценка сложности (low/medium/high)**

**medium** — умеренная сложность из-за объединения множественной функциональности и обработки различных типов данных.

**TODO / Рефакторинг**

- Добавить rate limiting для предотвращения notification spam
- Реализовать более продвинутую обработку ошибок с stack trace анализом
- Добавить поддержку локализации для всех сообщений уведомлений
- Рассмотреть добавление notification queuing для лучшего UX
- Добавить аналитику для трекинга частоты различных типов уведомлений
- Реализовать автоматическую группировку похожих уведомлений
- Добавить настройки пользователя для контроля типов отображаемых уведомлений
