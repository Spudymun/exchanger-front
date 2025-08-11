### Путь: packages/exchange-core/src/utils/access-validators.ts

**Краткое назначение (1 предложение)**

Централизованная система валидации доступа для аутентификации и авторизации пользователей в tRPC endpoints с проверкой существования объектов и прав доступа.

**Подробное описание (3–6 предложений)**

Модуль предоставляет ключевые функции безопасности для всех tRPC роутеров, обеспечивая валидацию существования пользователей и заявок перед предоставлением доступа к данным. Система реализует двухуровневую проверку: проверку существования объекта в базе данных и проверку прав доступа конкретного пользователя к запрашиваемому ресурсу. Функции бросают специализированные TRPC ошибки (NOT_FOUND, FORBIDDEN) для корректной обработки на клиенте и логирования на сервере. Модуль также включает генератор кодов верификации для email подтверждения с настраиваемой длиной и основанием системы счисления. Все функции следуют принципу "fail-fast" и предоставляют детальные сообщения об ошибках для упрощения отладки. Система является критически важной частью архитектуры безопасности всего приложения.

**Экспортируемые сущности / API**

- `export function validateUserAccess(userId: string): User` — Валидация пользователя и возврат объекта
- `export function validateOrderAccess(orderId: string, userEmail: string): Order` — Валидация заявки с проверкой владения
- `export function generateVerificationCode(base: number, length: number): string` — Генерация кода верификации

**Входы (expected inputs) / Параметры**

- `validateUserAccess`: `userId: string` — уникальный идентификатор пользователя
- `validateOrderAccess`: `orderId: string` (ID заявки), `userEmail: string` (email для проверки владения)
- `generateVerificationCode`: `base: number` (система счисления 2-36), `length: number` (длина результирующего кода)

**Выходы / Побочные эффекты**

- `validateUserAccess`: возвращает объект `User` или бросает `TRPCError` с кодом `NOT_FOUND`
- `validateOrderAccess`: возвращает объект `Order` или бросает `TRPCError` с кодами `NOT_FOUND`/`FORBIDDEN`
- `generateVerificationCode`: возвращает `string` — сгенерированный код в верхнем регистре
- Побочные эффекты: логирование ошибок через tRPC error handling system

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `apps/web/src/server/trpc/routers/user/profile.ts` — валидация пользователя в профиле
- `apps/web/src/server/trpc/routers/user/security.ts` — верификация и генерация кодов
- `apps/web/src/server/trpc/routers/user/orders.ts` — валидация доступа к заявкам
- `packages/exchange-core/src/index.ts` — реэкспорт всех функций

Файлы, которые импортируются здесь:

- `@repo/utils` — createNotFoundError, createForbiddenError
- `../data` — userManager, orderManager для доступа к данным
- `../types` — User, Order интерфейсы

**Домен данных / типы**

```typescript
// Входные типы
type UserId = string;
type OrderId = string;
type UserEmail = string;

// Возвращаемые типы из других модулей
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

interface Order {
  id: string;
  email: string;
  cryptoAmount: number;
  currency: CryptoCurrency;
  uahAmount: number;
  status: OrderStatus;
  depositAddress: string;
  recipientData?: RecipientData;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  txHash?: string;
}
```

**Риски и безопасность**

- **Критический компонент безопасности**: неправильная реализация может привести к несанкционированному доступу к данным
- **Email comparison**: используется строгое сравнение email для проверки владения заявкой
- **Error information leakage**: детальные сообщения об ошибках могут раскрыть информацию о существовании пользователей
- **Dependency on data managers**: безопасность зависит от корректной реализации userManager и orderManager
- **Verification code security**: генерируемые коды должны быть достаточно длинными для предотвращения brute force атак

**Тесты / рекомендации по покрытию**

- Unit тесты для validateUserAccess: существующий пользователь, несуществующий пользователь
- Unit тесты для validateOrderAccess: корректный доступ, неверный email, несуществующая заявка
- Unit тесты для generateVerificationCode: различные основания (10, 16, 36), различные длины
- Integration тесты с реальными tRPC роутерами для проверки error handling
- Security тесты: попытки доступа к чужим заявкам, SQL injection в параметрах
- Performance тесты: валидация при высокой нагрузке

**Оценка сложности (low/medium/high)**

**low** — простые функции валидации с понятной логикой, но критически важные для безопасности системы.

**TODO / Рефакторинг**

- Рассмотреть добавление rate limiting для предотвращения brute force атак на validateUserAccess
- Добавить логирование попыток несанкционированного доступа для мониторинга безопасности
- Возможна оптимизация через кеширование результатов валидации для повышения производительности
- Рассмотреть использование более криптографически стойкого генератора для verification кодов
- Добавить типизацию ошибок для улучшения type safety
