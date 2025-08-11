### Путь: packages/hooks/src/index.ts

**Краткое назначение (1 предложение)**

Главный экспортный файл пакета hooks с SSR-safe экспортами типов, селекторов и интегрированных форм для безопасного использования в Next.js приложениях.

**Подробное описание (3–6 предложений)**

Модуль является центральной точкой входа в пакет hooks и тщательно организован для обеспечения SSR-совместимости через разделение экспортов на безопасные и клиентские. Экспортирует только типы, чистые функции-селекторы и специальные SSR-safe hooks, оставляя store-зависимые hooks в отдельном файле client-hooks.ts для динамического импорта на клиенте. Включает новую интегрированную систему форм useFormWithNextIntl для работы с локализацией и современные TypeScript типы для всех store состояний. Система архитектурно разделена на категории: бизнес-логика (forms), состояние (stores), UI-компоненты и селекторы для лучшей организации и переиспользования. Модуль обеспечивает type-only экспорты для store интерфейсов, что позволяет использовать типизацию без гидратации состояния на сервере. Дизайн следует best practices для monorepo архитектуры с четким разделением клиентской и серверной функциональности.

**Экспортируемые сущности / API**

- `export type { UseFormOptions, UseFormReturn, FormField }` — Типы для форм
- `export { useFormWithNextIntl }` — Next-intl интегрированная система форм
- `export type { UseFormWithNextIntlParams, UseFormWithNextIntlReturn }` — Типы для локализованных форм
- `export * from './state/exchange-selectors'` — Селекторы обменных данных
- `export type { NotificationStore, Notification, NotificationType, NotificationAction }` — Типы уведомлений
- `export type { ExchangeStore, ExchangeFormData, ExchangeCalculation, ExchangeStep, ExchangeOrderData }` — Типы обменной логики
- `export type { Trade, Portfolio }` — Типы торговых данных
- `export * from './ui'` — UI hooks

**Входы (expected inputs) / Параметры**

- Файл является barrel export и не принимает параметры напрямую
- Экспортируемые функции принимают соответствующие параметры согласно их сигнатурам
- `useFormWithNextIntl`: принимает параметры формы и next-intl конфигурацию
- Селекторы: принимают состояние store для извлечения данных

**Выходы / Побочные эффекты**

- Предоставляет типизированный интерфейс к hooks пакету
- Экспортирует только SSR-safe функциональность для предотвращения гидратации ошибок
- Обеспечивает type-only экспорты для использования типов без runtime зависимостей
- Побочные эффекты отсутствуют на уровне модуля — только реэкспорт
- Направляет на использование client-hooks.ts для клиентских компонентов
- Обеспечивает tree-shaking через селективные экспорты

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `apps/web/src/components/forms/LoginForm.tsx` — useFormWithNextIntl для форм
- `apps/web/src/components/forms/RegisterForm.tsx` — формы с локализацией
- `apps/web/src/components/FloatingExchangeButton.tsx` — useScrollVisibility
- `packages/ui/src/components/auth/*.tsx` — UseFormReturn типы
- `packages/ui/src/types/auth-fields.ts` — типы форм

Файлы, которые импортируются здесь:

- `./business/useForm` — типы форм и UseFormReturn
- `./business/useFormWithNextIntl` — локализованные формы
- `./state/exchange-selectors` — селекторы состояния
- `./state/notification-store` — типы уведомлений
- `./state/exchange-store` — типы обменных данных
- `./state/trading-store` — типы торговых данных
- `./ui` — UI hooks

**Домен данных / типы**

```typescript
// Основные типы форм
interface UseFormReturn<T> {
  register: Function;
  handleSubmit: Function;
  formState: FormState<T>;
  // другие поля react-hook-form
}

// Локализованные формы
interface UseFormWithNextIntlParams {
  schema: ZodSchema;
  messages: Record<string, string>;
  onSubmit: Function;
}

// Store типы (type-only экспорты)
interface ExchangeStore {
  formData: ExchangeFormData;
  calculation: ExchangeCalculation;
  currentStep: ExchangeStep;
  orderData: ExchangeOrderData;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: NotificationAction;
  removeNotification: NotificationAction;
}

// Селекторы (чистые функции)
type ExchangeSelector<T> = (state: ExchangeStore) => T;
```

**Риски и безопасность**

- **SSR hydration mismatch**: неправильное разделение экспортов может вызвать ошибки гидратации
- **Import confusion**: разработчики могут импортировать store hooks вместо client-hooks
- **Type safety boundary**: type-only экспорты должны быть действительно type-only
- **Bundle size**: неправильные экспорты могут включить клиентский код в SSR bundle
- **Circular dependencies**: barrel exports могут создать циклические зависимости
- **Tree-shaking effectiveness**: неоптимальные экспорты влияют на размер bundle
- **Version consistency**: типы должны соответствовать реальным реализациям

**Тесты / рекомендации по покрытию**

- SSR compatibility тесты: проверка что экспорты безопасны для серверного рендеринга
- Import analysis тесты: проверка что только нужные модули включаются в bundle
- Type consistency тесты: соответствие экспортируемых типов реальным реализациям
- Integration тесты: корректная работа useFormWithNextIntl с Next.js
- Tree-shaking тесты: проверка оптимизации bundle при селективном импорте
- Circular dependency тесты: отсутствие циклических зависимостей
- Documentation тесты: актуальность комментариев об использовании

**Оценка сложности (low/medium/high)**

**medium** — требует понимания SSR архитектуры и правильного разделения экспортов для Next.js.

**TODO / Рефакторинг**

- Добавить explicit re-exports вместо wildcard exports для лучшего tree-shaking
- Рассмотреть создание отдельных entry points для различных use cases
- Добавить runtime проверки для предотвращения использования client-side hooks на сервере
- Улучшить документацию по правильному использованию hooks в SSR контексте
- Рассмотреть migration на новые React Server Components паттерны
- Добавить ESLint правила для предотвращения неправильных импортов
- Создать type-branded exports для улучшения type safety
