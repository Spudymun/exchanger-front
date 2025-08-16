### Путь: apps/web/lib/trpc-provider.tsx

**Краткое назначение (1 предложение)**
React Provider для tRPC клиента с интеграцией React Query, обеспечивающий type-safe API коммуникацию и dev tools.

**Подробное описание (3–6 предложений)**
Компонент создает и настраивает tRPC клиент с React Query интеграцией для type-safe API вызовов в React приложении. Использует httpBatchLink для оптимизации запросов через батчинг и superjson для сериализации сложных типов данных. Включает динамический импорт React Query DevTools только в development режиме для отладки без влияния на production bundle. Автоматически определяет базовый URL для разных окружений (development, Vercel, production). Предоставляет централизованную настройку QueryClient с оптимальными параметрами для кэширования и повторных запросов.

**Экспортируемые сущности / API (все на 100%)**

- `export function TRPCProvider({ children })` — React Provider компонент
- `export { trpc }` — настроенный tRPC клиент для использования в компонентах

**Входы (expected inputs) / Параметры (все на 100%)**

- `children: React.ReactNode` — дочерние компоненты для оборачивания
- Использует `process.env.NODE_ENV` для определения режима
- Использует `process.env.VERCEL_URL` для Vercel deployment
- Импортирует `AppRouter` тип из серверной части

**Выходы / Побочные эффекты (все на 100%)**

- Предоставляет tRPC и QueryClient контекст всем дочерним компонентам
- Создает singleton instances QueryClient и tRPC клиента
- Рендерит React Query DevTools в development режиме
- Настраивает HTTP батчинг и superjson трансформацию

**Взаимосвязи (кто вызывает / что вызывает) (все на 100%)**

- **Используется в**: apps/web/app/layout.tsx или root компоненте
- **Импортирует**: `AppRouter` из `../src/server/trpc`
- **Предоставляет контекст для**: всех компонентов, использующих tRPC хуки
- **Интегрируется с**: `/api/trpc` endpoint через httpBatchLink

**Домен данных / типы (все на 100%)**

```typescript
interface TRPCProviderProps {
  children: React.ReactNode;
}

type TRPCClient = CreateTRPCReact<AppRouter, unknown>;
type BaseUrlEnvironments = 'development' | 'vercel' | 'production';

// Экспортируемый trpc объект содержит:
// - useQuery, useMutation хуки для всех процедур
// - Provider компонент
// - createClient метод
```

**Риски и безопасность**

- **Низкий риск**: стандартная tRPC интеграция
- **Bundle size**: динамический импорт DevTools предотвращает включение в production
- **Environment detection**: корректная логика определения базового URL
- **Client singleton**: правильное использование useState для предотвращения пересоздания

**Тесты / рекомендации по покрытию**

- **Provider тесты**: корректность предоставления контекста
- **Environment тесты**: правильность определения baseUrl в разных окружениях
- **DevTools тесты**: загрузка только в development режиме
- **Integration тесты**: работа tRPC хуков в компонентах

**Оценка сложности (low/medium/high)**
**MEDIUM** - стандартная но важная интеграция с несколькими зависимостями

**TODO / Рефакторинг**

- ✅ Правильная интеграция tRPC с React Query
- ✅ Оптимизация bundle через динамический импорт DevTools
- ✅ Корректное определение baseUrl для разных окружений
- ✅ Использование superjson для сложных типов данных
- ✅ Реализовано: добавлен BaseErrorBoundary для обработки ошибок Provider
