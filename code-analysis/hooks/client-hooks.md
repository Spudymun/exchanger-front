### Путь: packages/hooks/src/client-hooks.ts

**Краткое назначение (1 предложение)**

Клиентский barrel export файл с 'use client' директивой для безопасного использования Zustand stores и state-зависимых hooks в React компонентах.

**Подробное описание (3–6 предложений)**

Модуль служит безопасной точкой входа для всех клиентских hooks, которые зависят от browser-only APIs или Zustand state management и не могут быть использованы в SSR контексте. Использует Next.js 'use client' директиву для явного маркирования как клиентский код, что позволяет Next.js корректно разделить серверные и клиентские bundle. Экспортирует полный набор state management hooks включая useTheme для темизации, useNotifications для уведомлений, useExchangeStore для обменной логики и бизнес-hooks для форм и аутентификации. Система включает enhanced версию useUIStore с интеграцией уведомлений и базовые store hooks без дублирования функциональности. Модуль тщательно организован для предотвращения SSR ошибок гидратации через четкое разделение client-side и server-side кода. Архитектура позволяет безопасно импортировать state-зависимые hooks только в клиентских компонентах через динамические импорты.

**Экспортируемые сущности / API**

- `export * from './useTheme'` — Хуки темизации
- `export * from './useNotifications'` — Система уведомлений
- `export * from './useExchangeStore'` — Обменная логика
- `export * from './business/useForm'` — Форм менеджмент
- `export * from './business/useAuth'` — Аутентификация
- `export * from './business/useExchange'` — Бизнес-логика обмена
- `export * from './business/useOrderTracking'` — Отслеживание заявок
- `export { useMathCaptcha, CAPTCHA_CONFIGS }` — Математическая капча
- `export type { AuthMessages }` — Типы сообщений аутентификации
- `export { useUIStore }` — Enhanced UI store с уведомлениями
- `export { useTradingStore }` — Торговый store
- `export { useNotificationStore }` — Store уведомлений
- `export { useExchangeStore as useExchangeStoreBase }` — Базовый обменный store

**Входы (expected inputs) / Параметры**

- Файл является barrel export и не принимает параметры напрямую
- Экспортируемые hooks принимают параметры согласно их индивидуальным сигнатурам
- Store hooks: обычно без параметров или с селекторами
- Business hooks: различные параметры для forms, auth, exchange операций
- useMathCaptcha: конфигурационные параметры

**Выходы / Побочные эффекты**

- Предоставляет все клиентские hooks через единую точку входа
- Маркирует код как клиентский через 'use client' для Next.js bundling
- Инициализирует Zustand stores при первом использовании
- Побочные эффекты: browser API calls, state subscriptions, localStorage access
- Создает subscriptions к store изменениям в компонентах
- Может вызывать side effects в browser environment (DOM manipulations, storage)

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `packages/providers/src/theme-provider.tsx` — useUIStore для темизации
- Клиентские компоненты в apps/web через динамические импорты
- Документация рекомендует этот файл для всех клиентских hooks

Файлы, которые импортируются здесь:

- `./useTheme` — хуки темизации
- `./useNotifications` — система уведомлений
- `./useExchangeStore` — обменная логика
- `./business/useForm` — форм менеджмент
- `./business/useAuth` — аутентификация
- `./business/useExchange` — бизнес-логика
- `./business/useOrderTracking` — отслеживание заявок
- `./business/useMathCaptcha` — капча
- `./useUIStore` — UI store
- `./state/trading-store` — торговый state
- `./state/notification-store` — state уведомлений
- `./state/exchange-store` — обменный state

**Домен данных / типы**

```typescript
// Client-side hooks signatures
type UseThemeReturn = {
  theme: 'light' | 'dark';
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
};

type UseNotificationsReturn = {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
};

// Store hooks
type StoreHook<T> = () => T;
type StoreSelectorHook<T, U> = (selector: (state: T) => U) => U;

// Business logic hooks
interface UseMathCaptchaReturn {
  equation: string;
  userAnswer: string;
  isValid: boolean;
  refreshCaptcha: () => void;
  validateAnswer: (answer: string) => boolean;
}

// Auth messages type
interface AuthMessages {
  login: Record<string, string>;
  register: Record<string, string>;
  errors: Record<string, string>;
}
```

**Риски и безопасность**

- **SSR hydration issues**: неправильное использование может вызвать ошибки гидратации
- **Bundle size impact**: включение всех клиентских hooks увеличивает client bundle
- **State initialization**: неправильная инициализация stores может привести к inconsistent state
- **Browser API dependency**: hooks зависят от browser-only APIs
- **Memory leaks**: неправильная очистка subscriptions может вызвать утечки памяти
- **Client-side security**: state может содержать sensitive данные доступные в browser
- **Performance impact**: множественные store subscriptions влияют на производительность

**Тесты / рекомендации по покрытию**

- Client rendering тесты: проверка корректной работы в browser environment
- SSR exclusion тесты: проверка что hooks не выполняются на сервере
- Store integration тесты: корректная работа всех Zustand stores
- Hook composition тесты: совместное использование множественных hooks
- Error boundary тесты: обработка ошибок в client hooks
- Performance тесты: влияние на рендеринг при множественных subscriptions
- Memory leak тесты: корректная очистка при unmount компонентов

**Оценка сложности (low/medium/high)**

**medium** — требует понимания Next.js client/server разделения и правильного state management.

**TODO / Рефакторинг**

- Рассмотреть lazy loading отдельных hooks для оптимизации bundle size
- Добавить error boundaries для изоляции ошибок клиентских hooks
- Реализовать мемоизацию для предотвращения лишних re-renders
- Добавить runtime проверки для browser environment
- Рассмотреть migration на React Server Components patterns
- Оптимизировать re-exports для лучшего tree-shaking
- Добавить development-only warnings для неправильного использования в SSR
