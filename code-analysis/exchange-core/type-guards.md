### Путь: packages/exchange-core/src/utils/type-guards.ts

**Краткое назначение (1 предложение)**

TypeScript type guards для безопасной проверки типов пользователей с type narrowing в контексте аутентификации и авторизации.

**Подробное описание (3–6 предложений)**

Модуль предоставляет набор type guards, которые обеспечивают безопасную типизацию при работе с объектами пользователей в различных состояниях аутентификации и верификации. Функции используют TypeScript type predicates для сужения типов от nullable User к конкретным состояниям пользователя, что позволяет компилятору статически проверять доступ к свойствам. Система включает проверки базовой аутентификации, наличия хешированного пароля для операций верификации, и статуса email подтверждения для доступа к защищенным функциям. Type guards критически важны для предотвращения runtime ошибок при доступе к свойствам User объектов и обеспечивают type safety в tRPC middleware и роутерах. Модуль следует принципам функционального программирования с чистыми функциями без побочных эффектов. Архитектура позволяет легко расширять систему дополнительными type guards для новых состояний пользователей.

**Экспортируемые сущности / API**

- `export function isAuthenticatedUser(user: User | null): user is User` — Проверка аутентифицированного пользователя
- `export function isUserWithPassword(user: User | null): user is User & { hashedPassword: string }` — Проверка пользователя с паролем
- `export function isVerifiedUser(user: User | null): user is User & { isVerified: true }` — Проверка верифицированного пользователя

**Входы (expected inputs) / Параметры**

- Все функции принимают `user: User | null` — объект пользователя или null из контекста сессии/аутентификации

**Выходы / Побочные эффекты**

- `isAuthenticatedUser`: возвращает `user is User` — true если пользователь не null
- `isUserWithPassword`: возвращает `user is User & { hashedPassword: string }` — true если пользователь существует и имеет хешированный пароль
- `isVerifiedUser`: возвращает `user is User & { isVerified: true }` — true если пользователь существует и верифицирован
- Побочные эффекты отсутствуют — чистые функции только для проверки типов
- После успешной проверки TypeScript автоматически сужает тип в блоке if
- Обеспечивают compile-time безопасность доступа к свойствам User

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `apps/web/src/server/trpc/middleware/auth.ts` — isAuthenticatedUser для middleware защиты
- `apps/web/src/server/trpc/routers/auth.ts` — isAuthenticatedUser для проверки в роутерах
- `packages/exchange-core/src/index.ts` — реэкспорт функций (предположительно)

Файлы, которые импортируются здесь:

- `../types` — User интерфейс для типизации

**Домен данных / типы**

```typescript
// Основные типы
interface User {
  id: string;
  email: string;
  hashedPassword?: string;
  sessionId?: string;
  isVerified: boolean;
  role?: UserRole;
  createdAt: Date;
  lastLoginAt?: Date;
}

// Type guard возвращаемые типы
type AuthenticatedUser = User; // не null User
type UserWithPassword = User & { hashedPassword: string }; // User с обязательным паролем
type VerifiedUser = User & { isVerified: true }; // User с подтвержденным email

// Использование в коде
function protectedOperation(user: User | null) {
  if (isAuthenticatedUser(user)) {
    // Теперь user имеет тип User, а не User | null
    console.log(user.email); // TypeScript знает что это безопасно
  }
}
```

**Риски и безопасность**

- **Type safety boundary**: неправильная реализация type guards может привести к false positives
- **Runtime vs compile-time**: type guards обеспечивают только compile-time безопасность
- **Null pointer protection**: критически важно для предотвращения null reference errors
- **Business logic consistency**: проверки должны соответствовать реальным бизнес-правилам
- **Authentication state**: неправильная проверка аутентификации может открыть уязвимости
- **Verification status**: некорректная проверка верификации влияет на доступ к функциям
- **Password presence**: проверка наличия пароля критична для операций смены пароля

**Тесты / рекомендации по покрытию**

- Unit тесты для isAuthenticatedUser: null user, валидный User объект
- Unit тесты для isUserWithPassword: User без hashedPassword, с hashedPassword, с пустым hashedPassword
- Unit тесты для isVerifiedUser: неверифицированный пользователь, верифицированный пользователь
- Type safety тесты: проверка что TypeScript корректно сужает типы после guards
- Edge case тесты: объекты с неожиданными свойствами, undefined значения
- Integration тесты: использование в реальных middleware и роутерах
- Negative тесты: проверка что guards корректно возвращают false

**Оценка сложности (low/medium/high)**

**low** — простые функции проверки типов, но критически важные для type safety системы.

**TODO / Рефакторинг**

- Добавить type guard для проверки ролей пользователей (isAdminUser, isOperatorUser)
- Рассмотреть добавление type guard для проверки активной сессии (isActiveSession)
- Добавить type guard для проверки временных ограничений (isSessionExpired)
- Реализовать композитные type guards для сложных проверок (isVerifiedUserWithPassword)
- Добавить runtime валидацию для дополнительной безопасности в критических местах
- Рассмотреть использование branded types для еще более строгой типизации
- Добавить документацию с примерами использования для каждого type guard
