### Путь: apps/web/src/server/trpc/middleware/rateLimit.ts

**Краткое назначение (1 предложение)**

In-memory система ограничения частоты запросов для защиты API от злоупотреблений и DoS атак.

**Подробное описание (3–6 предложений)**

Файл реализует временное решение для rate limiting с использованием in-memory хранилища на основе Map структуры. Система отслеживает количество запросов по IP адресам для различных типов операций (создание заказов, регистрация, вход, сброс пароля) с настраиваемыми лимитами из constants пакета. Включает автоматическую очистку устаревших записей для предотвращения утечек памяти и обработку различных сценариев proxy для корректного определения клиентского IP. Middleware предоставляет специализированные функции для каждого типа операций с локализованными сообщениями об ошибках. ВАЖНО: система не подходит для production использования из-за ограничений масштабируемости и потери данных при перезапуске сервера.

**Экспортируемые сущности / API**

- `export function createRateLimiter(action, getErrorMessage)` — фабрика для создания rate limiter функций
- `export const rateLimitMiddleware` — объект с middleware для разных операций:
  - `rateLimitMiddleware.createOrder` — ограничения для создания заказов
  - `rateLimitMiddleware.register` — ограничения для регистрации
  - `rateLimitMiddleware.login` — ограничения для входа в систему
  - `rateLimitMiddleware.resetPassword` — ограничения для сброса пароля

**Входы (expected inputs) / Параметры**

- `action: keyof typeof RATE_LIMITS` — тип операции для ограничения
- `getErrorMessage: (key: string, values?: Record<string, string | number>) => Promise<string>` — функция локализации ошибок
- `ip: string | undefined` — IP адрес клиента из контекста
- `ctx.ip: string` — IP адрес из tRPC контекста

**Выходы / Побочные эффекты**

- `RateLimitError` при превышении лимитов запросов
- Обновление in-memory счетчиков запросов по IP
- Автоматическая очистка устаревших записей каждые 5 минут
- Логирование и мониторинг частоты запросов
- Локализованные сообщения об ошибках

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `../index.ts` — реэкспорт для использования в роутерах
- Роутеры, требующие rate limiting (auth, exchange routers)
- Композиция с другими middleware в API эндпоинтах

Файлы, которые импортируются здесь:

- `@repo/constants` — конфигурация лимитов (RATE_LIMITS, TIME_CONSTANTS)
- `@repo/utils` — фабрика ошибок `createRateLimitError`
- `../init` — базовая `publicProcedure` для расширения

**Домен данных / типы**

```typescript
// Конфигурация лимитов (из @repo/constants)
interface RATE_LIMITS {
  CREATE_ORDER: { points: number; duration: number };
  REGISTER: { points: number; duration: number };
  LOGIN: { points: number; duration: number };
  RESET_PASSWORD: { points: number; duration: number };
}

// Запись в rate limit store
interface RateLimitRecord {
  count: number;
  resetTime: number; // timestamp
}

// In-memory хранилище
type RateLimitStore = Map<string, RateLimitRecord>;

// Ключ для хранилища
type StoreKey = `${string}:${string}`; // action:ip format
```

**Риски и безопасность**

- **КРИТИЧЕСКИЙ**: Not production ready - данные теряются при перезапуске
- **Scalability**: Не работает с несколькими инстансами сервера
- **Memory leaks**: Возможны утечки памяти без правильной очистки
- **IP spoofing**: Возможность обхода через подделку IP адресов
- **Distributed systems**: Не подходит для распределенных систем
- **Performance**: In-memory операции могут замедлить обработку запросов

**Тесты / рекомендации по покрытию**

- Unit тесты каждого middleware с различными сценариями лимитов
- Тесты cleanup механизма и предотвращения утечек памяти
- Тесты обработки различных форматов IP адресов (IPv4, IPv6, proxy)
- Integration тесты с реальными tRPC процедурами
- Load тесты для проверки производительности
- Тесты edge cases: неопределенный IP, некорректные конфигурации

**Оценка сложности (low/medium/high)**

**medium** — сложная логика управления состоянием с временными ограничениями

**TODO / Рефакторинг**

- **ПРИОРИТЕТ 1**: Заменить на Redis-based решение для production
- Добавить более sophisticated алгоритмы (sliding window, token bucket)
- Реализовать whitelist для доверенных IP адресов
- Добавить мониторинг и алерты для подозрительной активности
- Рассмотреть использование внешних сервисов (Cloudflare, AWS API Gateway)
- Добавить конфигурацию через environment переменные
