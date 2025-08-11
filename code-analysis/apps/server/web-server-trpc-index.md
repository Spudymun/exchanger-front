### Путь: apps/web/src/server/trpc/index.ts

**Краткое назначение (1 предложение)**

Центральный точка экспорта всех tRPC сущностей для серверной части web-приложения.

**Подробное описание (3–6 предложений)**

Файл служит единой точкой входа (barrel export) для всей tRPC инфраструктуры приложения. Он реэкспортирует основные компоненты tRPC системы: маршрутизатор приложения с типизацией, контекст для процедур, базовые строительные блоки (router, procedures), middleware для аутентификации и авторизации, и middleware для ограничения частоты запросов. Такая архитектура позволяет централизованно управлять API слоем и обеспечивает типобезопасность между клиентом и сервером. Файл следует паттерну barrel exports для удобства импорта и предоставляет clean API для использования в других частях приложения.

**Экспортируемые сущности / API**

- `export { appRouter, type AppRouter }` — основной роутер приложения и его TypeScript тип
- `export { createContext }` — функция создания контекста для tRPC процедур
- `export { createTRPCRouter, publicProcedure, loggedProcedure }` — базовые строительные блоки tRPC
- `export { protectedProcedure, operatorOnly, supportOnly, operatorAndSupport }` — middleware для авторизации по ролям
- `export { rateLimitMiddleware }` — middleware для ограничения частоты запросов

**Входы (expected inputs) / Параметры**

Файл не принимает входных параметров, это pure barrel export без собственной логики.

**Выходы / Побочные эффекты**

- Предоставляет типизированный API для tRPC клиента через `AppRouter`
- Экспортирует все необходимые сущности для построения tRPC эндпоинтов
- Не имеет побочных эффектов, только реэкспорт

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `apps/web/pages/api/trpc/[trpc].ts` — tRPC API handler для Next.js
- `apps/web/lib/trpc-provider.tsx` — клиентский tRPC провайдер
- Документация в `docs/API_DOCS.md`

Файлы, которые импортируются здесь:

- `./routers/index.ts` — агрегатор всех роутеров
- `./context.ts` — контекст для tRPC процедур
- `./init.ts` — инициализация tRPC с базовыми процедурами
- `./middleware/auth.ts` — middleware аутентификации и авторизации
- `./middleware/rateLimit.ts` — middleware ограничения запросов

**Домен данных / типы**

```typescript
// Основной тип роутера приложения
type AppRouter = typeof appRouter;

// Контекст процедур (из ./context.ts)
interface Context {
  user: User | null;
  ip: string;
  getErrorMessage: (key: string, values?: Record<string, string | number>) => Promise<string>;
}

// Типы процедур
type PublicProcedure = Procedure<Context>;
type LoggedProcedure = Procedure<Context> & WithLogging;
type ProtectedProcedure = Procedure<Context & { user: User }>;
```

**Риски и безопасность**

- **Безопасность**: Критически важен правильный экспорт middleware авторизации
- **Типобезопасность**: Нарушение типизации может привести к runtime ошибкам на клиенте
- **API консистентность**: Изменения в экспортах влияют на всех потребителей API
- **Rate limiting**: Неправильная настройка может привести к DoS или блокировке легитимных пользователей

**Тесты / рекомендации по покрытию**

- Интеграционные тесты импорта всех экспортируемых сущностей
- Проверка типизации TypeScript для `AppRouter`
- Тесты middleware в изоляции (уже покрыты в соответствующих файлах)
- E2E тесты API эндпоинтов через tRPC клиент

**Оценка сложности (low/medium/high)**

**low** — простой barrel export без бизнес-логики

**TODO / Рефакторинг**

- Рассмотреть группировку экспортов по функциональным доменам
- Добавить JSDoc комментарии для лучшей документации API
- Рассмотреть версионирование API при изменениях в `AppRouter`
