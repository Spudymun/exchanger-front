### Путь: apps/web/src/server/trpc/init.ts

**Краткое назначение (1 предложение)**

Инициализация и конфигурация tRPC с трансформерами, обработкой ошибок и базовыми процедурами.

**Подробное описание (3–6 предложений)**

Файл выполняет первичную настройку tRPC сервера с необходимой конфигурацией для типобезопасного взаимодействия клиент-сервер. Использует superjson для сериализации сложных типов данных (Date, BigInt, Map, Set) и настраивает обработчик ошибок с поддержкой Zod валидации. Создает базовые строительные блоки: публичную процедуру без ограничений, процедуру с логированием и фабрику роутеров. Middleware логирования отслеживает производительность всех вызовов API с выводом времени выполнения и статуса. Архитектура позволяет легко расширять функциональность через композицию middleware.

**Экспортируемые сущности / API**

- `export const createTRPCRouter` — фабрика для создания tRPC роутеров (t.router)
- `export const publicProcedure` — базовая процедура без ограничений доступа (t.procedure)
- `export const createCallerFactory` — фабрика для создания server-side вызовов
- `export const loggedProcedure` — процедура с middleware логирования производительности

**Входы (expected inputs) / Параметры**

- `Context` — типизированный контекст из `./context`, содержащий user, ip, getErrorMessage
- tRPC процедуры принимают стандартные параметры: `{ path, type, next }` для middleware
- Logging middleware логирует `path: string`, `type: string`, время выполнения

**Выходы / Побочные эффекты**

- Настроенный tRPC instance с superjson трансформером
- Логирование в консоль для всех процедур с `loggedProcedure` (формат: "✅/❌ tRPC {type} {path} - {time}ms")
- Структурированная обработка Zod ошибок в ответах API
- Возврат типизированных результатов для всех процедур

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `./index.ts` — реэкспорт основных сущностей
- `./routers/*.ts` — все роутеры используют `createTRPCRouter`
- `./middleware/auth.ts` — использует `publicProcedure` как базу для middleware
- `./middleware/rateLimit.ts` — использует `publicProcedure` для rate limiting

Файлы, которые импортируются здесь:

- `@trpc/server` — основной пакет tRPC
- `superjson` — сериализация сложных типов
- `zod` — валидация схем и обработка ошибок
- `./context` — типизация контекста процедур

**Домен данных / типы**

```typescript
// Контекст из context.ts
interface Context {
  user: User | null;
  ip: string;
  getErrorMessage: (key: string, values?: Record<string, string | number>) => Promise<string>;
}

// Конфигурация tRPC
interface TRPCConfig {
  transformer: SuperJSON;
  errorFormatter: (options: { shape: any; error: TRPCError }) => any;
}

// Middleware логирования
interface LoggingMiddleware {
  path: string;
  type: 'query' | 'mutation' | 'subscription';
  next: () => Promise<any>;
}
```

**Риски и безопасность**

- **Performance**: Логирование всех запросов может создать overhead в production
- **Information leakage**: Console.log в production может раскрыть чувствительную информацию
- **Error handling**: Неправильная обработка ошибок может раскрыть internal details
- **Memory leaks**: Отсутствие cleanup в middleware может привести к утечкам памяти

**Тесты / рекомендации по покрытию**

- Unit тесты инициализации tRPC с правильными настройками
- Тесты middleware логирования с различными типами процедур
- Тесты сериализации/десериализации superjson для сложных типов
- Тесты обработки ошибок с Zod и без
- Performance тесты middleware логирования

**Оценка сложности (low/medium/high)**

**low** — стандартная настройка tRPC без сложной логики

**TODO / Рефакторинг**

- Вынести настройки логирования в конфигурацию (включить/отключить в production)
- Добавить более структурированное логирование (structured logging)
- Рассмотреть использование logger библиотеки вместо console.log
- Добавить метрики производительности и мониторинг
