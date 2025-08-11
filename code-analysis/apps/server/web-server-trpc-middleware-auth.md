### Путь: apps/web/src/server/trpc/middleware/auth.ts

**Краткое назначение (1 предложение)**

Middleware для аутентификации и авторизации пользователей по ролям в tRPC процедурах.

**Подробное описание (3–6 предложений)**

Файл реализует многоуровневую систему безопасности для tRPC API с проверкой аутентификации и авторизации по ролям. Базовый `authMiddleware` проверяет наличие авторизованного пользователя и обогащает контекст типизированными данными пользователя. Общий `roleMiddleware` позволяет создавать middleware для любых ролей, а специализированные middleware (`operatorMiddleware`, `supportMiddleware`) обеспечивают доступ только определенным ролям пользователей. Система использует константы ролей из shared пакета и предоставляет локализованные сообщения об ошибках. Архитектура поддерживает как отдельные роли, так и комбинированный доступ для операторов и поддержки.

**Экспортируемые сущности / API**

- `export const authMiddleware` — базовая проверка аутентификации
- `export const roleMiddleware` — generic функция для создания role-based middleware
- `export const operatorMiddleware` — middleware только для операторов
- `export const supportMiddleware` — middleware только для службы поддержки
- `export const operatorAndSupportMiddleware` — middleware для операторов И поддержки
- `export const operatorOnly` — алиас для operatorMiddleware
- `export const supportOnly` — алиас для supportMiddleware
- `export const operatorAndSupport` — алиас для operatorAndSupportMiddleware
- `export const protectedProcedure` — алиас для authMiddleware (обратная совместимость)

**Входы (expected inputs) / Параметры**

- `ctx.user: User | null` — объект пользователя из контекста (может быть null)
- `ctx.getErrorMessage: (key: string) => Promise<string>` — функция локализации ошибок
- `allowedRoles: string[]` — массив разрешенных ролей для `roleMiddleware`
- `ctx` содержит полный контекст tRPC процедуры

**Выходы / Побочные эффекты**

- `UnauthorizedError` при отсутствии аутентификации
- `ForbiddenError` при недостаточных правах доступа
- Обогащенный контекст с типизированным `user: User` для downstream middleware
- Локализованные сообщения об ошибках на языке пользователя

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `../index.ts` — реэкспорт для использования в роутерах
- Все роутеры в `../routers/*.ts` используют protected процедуры
- Middleware композиция в различных API эндпоинтах

Файлы, которые импортируются здесь:

- `@repo/constants` — константы ролей пользователей (USER_ROLES)
- `@repo/exchange-core` — функция `isAuthenticatedUser` для проверки аутентификации
- `@repo/utils` — фабрики ошибок `createUnauthorizedError`, `createForbiddenError`
- `../init` — базовая `publicProcedure` для расширения

**Домен данных / типы**

```typescript
// Роли пользователей (из @repo/constants)
interface USER_ROLES {
  OPERATOR: string;
  SUPPORT: string;
  USER: string;
  ADMIN: string;
}

// Пользователь (из @repo/exchange-core/types)
interface User {
  id: string;
  email: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
}

// Контекст после аутентификации
interface AuthenticatedContext extends Context {
  user: User; // Гарантированно не null
}

// Параметры middleware
interface MiddlewareParams {
  ctx: Context;
  next: () => Promise<any>;
}
```

**Риски и безопасность**

- **Критическая безопасность**: Ошибки в логике могут предоставить неавторизованный доступ
- **Role escalation**: Неправильная проверка ролей может позволить повышение привилегий
- **Timing attacks**: Разное время ответа может раскрыть информацию о существовании пользователей
- **Error leakage**: Детализированные сообщения об ошибках могут раскрыть структуру системы
- **Session hijacking**: Отсутствие дополнительных проверок сессии

**Тесты / рекомендации по покрытию**

- Unit тесты для каждого middleware с различными ролями пользователей
- Тесты edge cases: null user, неопределенная роль, неизвестная роль
- Интеграционные тесты с реальными tRPC процедурами
- Тесты локализации сообщений об ошибках
- Security тесты попыток обхода авторизации
- Performance тесты middleware цепочек

**Оценка сложности (low/medium/high)**

**medium** — важная бизнес-логика безопасности с несколькими уровнями проверок

**TODO / Рефакторинг**

- Добавить rate limiting для неуспешных попыток аутентификации
- Рассмотреть добавление дополнительных проверок сессии (IP, User-Agent)
- Добавить аудит логирование для всех операций безопасности
- Реализовать более гранулярную систему разрешений вместо простых ролей
- Добавить временные ограничения доступа (time-based access control)
