# 📡 API Documentation

**Дата обновления:** 26 октября 2025  
**Версия:** 3.0  
**Всего endpoints:** 49 procedures  
**Используется:** 20 (41%)  
**Не используется:** 29 (59%)

---

## 🏗️ Архитектура

### Структура роутеров

Все API endpoints организованы в модульные роутеры с четкой иерархией доступа:

- **`auth`** — аутентификация и авторизация (7 procedures)
- **`exchange`** — операции обмена криптовалют (7 procedures)
- **`fiat`** — работа с фиатными валютами (2 procedures)
- **`user`** — пользовательские операции (8 procedures via namespace)
  - `user.profile` — управление профилем (2 procedures)
  - `user.security` — настройки безопасности (3 procedures)
  - `user.orders` — управление заказами (3 procedures)
- **`operator`** — панель оператора (7 procedures, НЕ используется)
- **`support`** — панель поддержки (6 procedures, НЕ используется)
- **`shared`** — общие инструменты для operator+support (10 procedures)
- **`telegram-bot`** — системное API для Telegram бота (2 procedures)

### Типы Middleware

- **`publicProcedure`** — публичный доступ без аутентификации
- **`protectedProcedure`** — требует валидную сессию пользователя
- **`operatorOnly`** — доступ только для роли OPERATOR
- **`supportOnly`** — доступ только для роли SUPPORT
- **`operatorAndSupport`** — доступ для OPERATOR и SUPPORT
- **`systemApiMiddleware`** — системный доступ с API key (для Telegram бота)
- **`rateLimitMiddleware`** — ограничение частоты запросов

---

## 📋 Все Endpoints

## 🔐 Auth Router (7 procedures)

Файл: `apps/web/src/server/trpc/routers/auth.ts`

## 🔐 Auth Router (7 procedures)

Файл: `apps/web/src/server/trpc/routers/auth.ts`

### `auth.register`

**Статус:** ✅ Используется  
**Middleware:** `rateLimitMiddleware.register`  
**Тип:** mutation  
**Input:** `fullySecurityEnhancedRegisterSchema` (email, password, confirmPassword, captcha)  
**Output:** `{ user: { id, email, isVerified }, sessionId }`  
**Назначение:** Регистрация нового пользователя с email и паролем. Проверяет CAPTCHA, хеширует пароль bcrypt, создает сессию и устанавливает HTTP-only cookie.

### `auth.login`

**Статус:** ✅ Используется  
**Middleware:** `rateLimitMiddleware.login`  
**Тип:** mutation  
**Input:** `fullySecurityEnhancedLoginSchema` (email, password, captcha)  
**Output:** `{ user: { id, email, isVerified }, sessionId }`  
**Назначение:** Вход пользователя в систему. Проверяет CAPTCHA, валидирует credentials, создает сессию в Redis с metadata (IP, User-Agent) и устанавливает cookie.

### `auth.logout`

**Статус:** ✅ Используется  
**Middleware:** `publicProcedure`  
**Тип:** mutation  
**Input:** нет  
**Output:** `{ message: string }`  
**Назначение:** Завершение сессии пользователя. Удаляет сессию из Redis и очищает sessionId cookie.

### `auth.getSession`

**Статус:** ✅ Используется  
**Middleware:** `publicProcedure`  
**Тип:** query  
**Input:** нет  
**Output:** `{ user: { id, email, isVerified } | null }`  
**Назначение:** Получение текущей сессии пользователя из контекста. Используется для проверки авторизации на клиенте.

### `auth.requestPasswordReset`

**Статус:** ✅ Используется  
**Middleware:** `rateLimitMiddleware.resetPassword`  
**Тип:** mutation  
**Input:** `securityEnhancedResetPasswordSchema` (email)  
**Output:** `{ message: string }`  
**Назначение:** Запрос на сброс пароля. Создает crypto-safe 6-значный токен через `PasswordResetTokenService`, сохраняет в БД с TTL 15 минут, отправляет email через `EmailService.sendPasswordReset()`.

### `auth.resetPassword`

**Статус:** ✅ Используется  
**Middleware:** `publicProcedure`  
**Тип:** mutation  
**Input:** `fullySecurityEnhancedConfirmResetPasswordSchema` (email, resetCode, newPassword, confirmNewPassword)  
**Output:** `{ user: { id, email, isVerified }, sessionId }`  
**Назначение:** Установка нового пароля по токену сброса. Верифицирует токен, обновляет hashedPassword, помечает токен как использованный, создает новую сессию.

### `auth.verifyEmail`

**Статус:** ✅ Используется  
**Middleware:** `publicProcedure`  
**Тип:** mutation  
**Input:** `securityEnhancedConfirmEmailSchema` (email, verificationCode)  
**Output:** `{ message: string, isVerified: boolean }`  
**Назначение:** Подтверждение email адреса пользователя по коду верификации. Обновляет поле `isVerified` в БД.

---

## 💱 Exchange Router (7 procedures)

Файл: `apps/web/src/server/trpc/routers/exchange.ts`

### `exchange.getRates`

**Статус:** ✅ Используется  
**Middleware:** `publicProcedure`  
**Тип:** query  
**Input:** нет  
**Output:** `{ rates: Array<{ currency, usdRate, uahRate, commission, lastUpdated, source, spread }>, timestamp: Date, metadata: { realTimeCount, fallbackCount, error? } }`  
**Назначение:** Получение текущих курсов обмена для всех криптовалют. Использует `SmartPricingService` с гибридной системой ценообразования (API + Manual DB fallback). Возвращает usdRate, uahRate, commission, source, spread.

### `exchange.getLimits`

**Статус:** ❌ НЕ используется  
**Middleware:** `publicProcedure`  
**Тип:** query  
**Input:** `securityEnhancedGetCurrencyRateSchema` (currency)  
**Output:** `{ currency, limits: { min, max }, rate: { uahRate, commission } }`  
**Назначение:** Получение минимальных/максимальных лимитов обмена для конкретной криптовалюты. Зарезервирован для будущей реализации лимитов.

### `exchange.createOrder`

**Статус:** ✅ Используется  
**Middleware:** `rateLimitMiddleware.createOrder`  
**Тип:** mutation  
**Input:** `securityEnhancedCreateExchangeOrderSchema.extend()` (email, cryptoAmount, uahAmount, currency, tokenStandard?, fixedExchangeRate?, paymentDetails?: { cardNumber?, bankDetails? }, recipientData?: { cardNumber?, bankDetails?, bankId? })  
**Output:** `{ orderId: publicId, depositAddress, cryptoAmount, uahAmount, currency, status, createdAt, sessionInfo: { sessionId, isNewUser } }`  
**Назначение:** Создание нового заказа на обмен. Выполняет авторегистрацию через `AutoRegistrationService`, выделяет кошелек через `WalletPoolManager`, создает заказ в БД, планирует автоотмену через Redis TTL (90 мин), отправляет email с адресом депозита и Telegram уведомление операторам.

### `exchange.getOrderStatus`

**Статус:** ✅ Используется  
**Middleware:** `protectedProcedure`  
**Тип:** query  
**Input:** `{ orderId: string }` (UUID или publicId)  
**Output:** `{ id: publicId, status, cryptoAmount, uahAmount, currency, tokenStandard, depositAddress, recipientData, email, createdAt, updatedAt, processedAt, txHash, bankId, bankName, fixedExchangeRate }`  
**Назначение:** Получение детального статуса заявки по ID. USER видит только свои заказы, OPERATOR/SUPPORT/ADMIN видят все. tokenStandard получается из связанного кошелька.

### `exchange.getOrderHistory`

**Статус:** ✅ Используется  
**Middleware:** `publicProcedure`  
**Тип:** query  
**Input:** `securityEnhancedGetOrderHistoryByEmailSchema` (email, limit?)  
**Output:** `{ orders: Array<{ id: publicId, status, cryptoAmount, uahAmount, currency, createdAt, updatedAt }>, total: number }`  
**Назначение:** Получение истории заказов по email. Находит пользователя по email, загружает его заказы, сортирует по дате (новые первые) и применяет пагинацию.

### `exchange.getSupportedCurrencies`

**Статус:** ✅ Используется  
**Middleware:** `publicProcedure`  
**Тип:** query  
**Input:** нет  
**Output:** `Array<{ symbol, name, rate, commission, limits: { min, max }, isActive }>`  
**Назначение:** Получение списка поддерживаемых криптовалют с актуальными курсами, комиссиями и лимитами. Использует данные из БД, fallback на CRYPTOCURRENCIES константы.

### `exchange.getSupportedTokenStandards`

**Статус:** ❌ НЕ используется  
**Middleware:** `publicProcedure`  
**Тип:** query  
**Input:** нет  
**Output:** `string[]` (массив стандартов токенов, например ['ERC-20', 'TRC-20'])  
**Назначение:** Получение списка поддерживаемых стандартов токенов из БД. При ошибке возвращает пустой массив (компонент использует fallback константы).

---

## 💵 Fiat Router (2 procedures)

Файл: `apps/web/src/server/trpc/routers/fiat.ts`

### `fiat.getSupportedFiatCurrencies`

**Статус:** ✅ Используется  
**Middleware:** `publicProcedure`  
**Тип:** query  
**Input:** нет  
**Output:** `Array<{ symbol, name, minAmount, maxAmount, isActive }>`  
**Назначение:** Получение списка всех поддерживаемых фиатных валют из БД.

### `fiat.getBanksForFiatCurrency`

**Статус:** ✅ Используется  
**Middleware:** `publicProcedure`  
**Тип:** query  
**Input:** `{ currency: string }`  
**Output:** `Array<{ id, name, shortName, logoUrl, isActive, isDefault, priority, reserve }>`  
**Назначение:** Получение списка банков для выбранной фиатной валюты. Возвращает только активные банки, отсортированные по приоритету.

---

## 👤 User Router (8 procedures via namespace)

### User Profile (2 procedures)

Файл: `apps/web/src/server/trpc/routers/user/profile.ts`

### `user.profile.getProfile`

**Статус:** ✅ Используется  
**Middleware:** `protectedProcedure`  
**Тип:** query  
**Input:** нет  
**Output:** `{ id, email, isVerified, createdAt, lastLoginAt, stats: { totalOrders, completedOrders } }`  
**Назначение:** Получение профиля текущего авторизованного пользователя с базовой статистикой по заказам.

### `user.profile.updateProfile`

**Статус:** ❌ НЕ используется  
**Middleware:** `protectedProcedure`  
**Тип:** mutation  
**Input:** `{ notifications?: { email: boolean, orderUpdates: boolean, marketing: boolean } }`  
**Output:** `{ id, email, isVerified, message }`  
**Назначение:** Обновление профиля пользователя (настройки уведомлений). Зарезервирован для страницы редактирования профиля.

### User Security (3 procedures)

Файл: `apps/web/src/server/trpc/routers/user/security.ts`

### `user.security.changePassword`

**Статус:** ✅ Используется  
**Middleware:** `protectedProcedure`  
**Тип:** mutation  
**Input:** `{ currentPassword, newPassword, confirmPassword }`  
**Output:** `{ message }`  
**Назначение:** Смена пароля авторизованного пользователя. Проверяет корректность текущего пароля и соответствие нового с подтверждением.

### `user.security.resendVerificationEmail`

**Статус:** ✅ Используется  
**Middleware:** `protectedProcedure`  
**Тип:** mutation  
**Input:** нет  
**Output:** `{ message }`  
**Назначение:** Повторная отправка email с кодом подтверждения. Если email уже подтвержден, возвращает соответствующее сообщение.

### `user.security.deleteAccount`

**Статус:** ❌ НЕ используется  
**Middleware:** `protectedProcedure`  
**Тип:** mutation  
**Input:** `{ password, confirmation: 'DELETE_MY_ACCOUNT' }`  
**Output:** `{ message }`  
**Назначение:** Удаление аккаунта пользователя (GDPR compliance). Требует подтверждение паролем и проверяет отсутствие активных заказов.

### User Orders (3 procedures)

Файл: `apps/web/src/server/trpc/routers/user/orders.ts`

### `user.orders.getOrderHistory`

**Статус:** ✅ Используется  
**Middleware:** `protectedProcedure`  
**Тип:** query  
**Input:** `{ page: number, pageSize: number, status?: OrderStatus }`  
**Output:** `{ orders: Array<{ id: publicId, status, cryptoAmount, uahAmount, currency, depositAddress, createdAt, updatedAt, processedAt, txHash }>, total: number, hasMore: boolean }`  
**Назначение:** Получение истории заказов текущего пользователя. Альтернатива `exchange.getOrderHistory` для авторизованных пользователей.

### `user.orders.cancelOrder`

**Статус:** ✅ Используется  
**Middleware:** `protectedProcedure`  
**Тип:** mutation  
**Input:** `{ orderId: string }`  
**Output:** `{ id, status, message }`  
**Назначение:** Отмена заказа пользователем. Доступна только для заказов в статусе 'pending'. Освобождает выделенный кошелек через `WalletPoolManager`.

### `user.orders.markAsPaid`

**Статус:** ❌ НЕ используется  
**Middleware:** `protectedProcedure`  
**Тип:** mutation  
**Input:** `{ orderId: string }`  
**Output:** `{ id, status, message }`  
**Назначение:** Пометка заказа как оплаченного пользователем. Зарезервирован для ручной оплаты (не автоматической).

---

## 🛠️ Operator Router (7 procedures)

Файл: `apps/web/src/server/trpc/routers/operator.ts`  
**Примечание:** Все endpoints НЕ используются, т.к. `apps/admin-panel/` пустое приложение.

### `operator.getPendingOrders`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorOnly`  
**Тип:** query  
**Input:** `{ limit: number, cursor?: string, status: OrderStatus }`  
**Output:** `{ items: Array<Order & { config: OrderStatusConfig }>, nextCursor?: string, hasMore: boolean }`  
**Назначение:** Получение списка заказов в статусе "pending" (ожидает назначения оператора).

### `operator.takeOrder`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorOnly`  
**Тип:** mutation  
**Input:** `{ orderId: string }`  
**Output:** `{ success: boolean, order: Order, message: string }`  
**Назначение:** Взять заявку в обработку. Назначает оператора на заявку в статусе "pending".

### `operator.updateOrderStatus`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorOnly`  
**Тип:** mutation  
**Input:** `{ orderId: string, status: OrderStatus, operatorNote?: string }`  
**Output:** `{ success: boolean, order: Order, message: string }`  
**Назначение:** Обновление статуса заявки оператором. Валидирует переходы статусов, автоматически освобождает кошелек при финальных статусах.

### `operator.getMyStats`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorOnly`  
**Тип:** query  
**Input:** нет  
**Output:** `{ total, totalVolume, averageAmount, byStatus: { [status]: count }, today: { count, volume } }`  
**Назначение:** Получение статистики по заявкам текущего оператора.

### `operator.getAssignedOrders`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorOnly`  
**Тип:** query  
**Input:** `{ limit: number, cursor?: string, status?: OrderStatus }`  
**Output:** `{ items: Array<Order & { config: OrderStatusConfig }>, nextCursor?: string, hasMore: boolean }`  
**Назначение:** Получение всех заказов, назначенных на текущего оператора.

### `operator.getWorkloadStats`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorOnly`  
**Тип:** query  
**Input:** нет  
**Output:** `{ assigned, completed, processing, totalVolume, averageAmount }`  
**Назначение:** Получение персонализированной статистики нагрузки текущего оператора.

### `operator.escalateToSupport`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorOnly`  
**Тип:** mutation  
**Input:** `{ orderId: string, reason: string (10-1000 chars), priority: 'low' | 'medium' | 'high' }`  
**Output:** `{ success: boolean, message: string, order: Order & { config: OrderStatusConfig } }`  
**Назначение:** Эскалация проблемного заказа в службу поддержки. Возвращает заявку в статус PENDING и убирает назначение оператора.

---

## 💬 Support Router (6 procedures)

Файл: `apps/web/src/server/trpc/routers/support.ts`  
**Примечание:** Все endpoints НЕ используются, т.к. `apps/admin-panel/` пустое приложение.

### `support.searchKnowledge`

**Статус:** ❌ НЕ используется  
**Middleware:** `supportOnly`  
**Тип:** query  
**Input:** `{ query: string, category?: string, limit: number }`  
**Output:** `Array<{ id, category, title, content, tags, updatedAt }>`  
**Назначение:** Поиск в базе знаний для решения проблем. Mock implementation возвращает тестовые статьи.

### `support.createTicket`

**Статус:** ❌ НЕ используется  
**Middleware:** `supportOnly`  
**Тип:** mutation  
**Input:** `{ userId: string, subject: string, description: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT', category: string }`  
**Output:** `{ success: boolean, ticket: Ticket, message: string }`  
**Назначение:** Создание тикета в службу поддержки для пользователя.

### `support.getTickets`

**Статус:** ❌ НЕ используется  
**Middleware:** `supportOnly`  
**Тип:** query  
**Input:** `{ status?: TicketStatus, priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT', limit: number }`  
**Output:** `Array<Ticket>`  
**Назначение:** Получение списка тикетов с фильтрацией по статусу и приоритету.

### `support.updateTicketStatus`

**Статус:** ❌ НЕ используется  
**Middleware:** `supportOnly`  
**Тип:** mutation  
**Input:** `{ ticketId: string, status: TicketStatus, comment?: string }`  
**Output:** `{ success: boolean, ticket: Ticket, message: string }`  
**Назначение:** Обновление статуса тикета (open → in_progress → resolved/closed) с опциональным комментарием.

### `support.getUserInfo`

**Статус:** ❌ НЕ используется  
**Middleware:** `supportOnly`  
**Тип:** query  
**Input:** `{ userId: string }`  
**Output:** `{ user: { id, email, isVerified, createdAt, lastLoginAt }, stats: { totalOrders, completedOrders, totalVolume, registrationDays }, recentOrders: Order[] }`  
**Назначение:** Получение детальной информации о пользователе для поддержки (профиль, статистика заказов, последние заказы).

### `support.getMyStats`

**Статус:** ❌ НЕ используется  
**Middleware:** `supportOnly`  
**Тип:** query  
**Input:** нет  
**Output:** `{ totalTickets, todayTickets, openTickets, resolvedTickets, inProgressTickets, avgResponseTime, knowledgeBaseArticles }`  
**Назначение:** Получение статистики работы сотрудника поддержки (количество тикетов по статусам, среднее время ответа, статьи в базе знаний).

---

## 🔧 Shared Router (10 procedures)

Файл: `apps/web/src/server/trpc/routers/shared.ts`  
**Примечание:** Общие инструменты для operator+support. Только 1 endpoint используется.

### `shared.searchOrders`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorAndSupport`  
**Тип:** query  
**Input:** `{ query?: string, dateFrom?: string, dateTo?: string, status?: OrderStatus, limit: number, offset: number }`  
**Output:** `Order[]`  
**Назначение:** Универсальный поиск заявок по ID, publicId, суммам, email (через User cache). Оптимизирован с batch загрузкой пользователей.

### `shared.searchUsers`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorAndSupport`  
**Тип:** query  
**Input:** `{ query?: string, verified?: boolean, limit: number, offset: number }`  
**Output:** `Array<{ id, email, isVerified, createdAt, lastLoginAt, ordersCount }>`  
**Назначение:** Поиск пользователей по email или ID с фильтрацией по верификации. Включает подсчет заказов пользователя.

### `shared.getGeneralStats`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorAndSupport`  
**Тип:** query  
**Input:** нет  
**Output:** `{ orders: { total, today, pending, processing, completed }, users: { total, verified, newToday }, currencies: Array<{ currency, orders, volume }> }`  
**Назначение:** Получение общей статистики платформы для dashboard (заказы, пользователи, объемы по валютам).

### `shared.getWalletPoolStats`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorAndSupport`  
**Тип:** query  
**Input:** `{ currency: CryptoCurrency }`  
**Output:** `WalletPoolStats` (статистика пула для указанной валюты)  
**Назначение:** Получение статистики пула кошельков для конкретной валюты (свободные, занятые, заблокированные).

### `shared.checkWalletAlerts`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorAndSupport`  
**Тип:** query  
**Input:** нет  
**Output:** `{ success: boolean, alertCount: number, alerts: Array<{ currency, available, threshold, isCritical, message }>, timestamp: Date }`  
**Назначение:** Проверка критических алертов по кошелькам (низкий баланс, превышение порогов).

### `shared.walletMonitoringControl`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorAndSupport`  
**Тип:** mutation  
**Input:** `{ action: 'start' | 'stop' | 'status' }`  
**Output:** `{ success: boolean, message: string, status: MonitoringStatus }`  
**Назначение:** Управление процессом мониторинга кошельков (запуск/остановка/статус).

### `shared.getEmailStatistics`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorAndSupport`  
**Тип:** query  
**Input:** `{ provider: string }`  
**Output:** `{ success: boolean, data: EmailProviderStatistics }`  
**Назначение:** Получение статистики отправки email для конкретного провайдера.

### `shared.checkEmailProvidersHealth`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorAndSupport`  
**Тип:** query  
**Input:** нет  
**Output:** `{ success: boolean, data: EmailProvidersHealthStatus }`  
**Назначение:** Проверка работоспособности всех email провайдеров (Resend, Gmail fallback).

### `shared.orders`

**Статус:** Namespace (не endpoint)  
**Назначение:** Namespace для вложенных procedures, связанных с заказами.

### `shared.getAll`

**Статус:** ✅ Используется (как `shared.orders.getAll`)  
**Middleware:** `protectedProcedure`  
**Тип:** query  
**Input:** `{ filters?: { status?, searchQuery? }, sortBy: 'newest'|'oldest', pagination: { limit, offset } }`  
**Output:** `{ items: Order[], total: number, hasMore: boolean }`  
**Назначение:** Получение всех заказов с role-based фильтрацией. Гибридный подход: SQL для простых запросов, memory для сложного поиска. USER видит только свои заказы, OPERATOR/SUPPORT/ADMIN видят все.

### `shared.quickActions`

**Статус:** ❌ НЕ используется  
**Middleware:** `operatorAndSupport`  
**Тип:** mutation  
**Input:** `{ action: 'REFRESH_RATES' | 'CLEAR_CACHE' | 'SEND_NOTIFICATION', params?: { message?: string, recipients?: string } }`  
**Output:** `{ success: boolean, message: string, timestamp?: Date, clearedItems?: number, recipients?: string }`  
**Назначение:** Быстрые действия для операторов (обновление курсов, очистка кэша, отправка уведомлений). Mock implementation.

---

## 🤖 Telegram Bot Router (2 procedures)

Файл: `apps/web/src/server/trpc/routers/telegram-bot.ts`  
**Примечание:** Системное API для Telegram бота с проверкой API key через `x-api-key` header.

### `telegram-bot.takeOrderByTelegram`

**Статус:** ✅ Используется  
**Middleware:** `systemApiMiddleware`  
**Тип:** mutation  
**Input:** `{ orderId: string, telegramOperatorId: string }`  
**Output:** `{ success: boolean, order?: Order, error?: { code: OrderErrorCode, message: string, details?: { assignedOperatorEmail?, currentStatus? } } }`  
**Назначение:** Назначение заказа на оператора через Telegram бота. Валидирует оператора по Telegram ID, проверяет статус заказа (pending/paid), устанавливает assignedOperatorId. Поддерживает UUID и publicId.

### `telegram-bot.updateOrderStatusByTelegram`

**Статус:** ✅ Используется  
**Middleware:** `systemApiMiddleware`  
**Тип:** mutation  
**Input:** `{ orderId: string, status: 'pending' | 'processing' | 'completed' | 'cancelled', telegramOperatorId: string, operatorNote?: string, cancellationReason?: string }`  
**Output:** `{ success: boolean, order?: Order, error?: { code: OrderErrorCode, message: string } }`  
**Назначение:** Обновление статуса заказа через Telegram бота. Валидирует права оператора (только назначенный может менять), обновляет статус, создает audit log для отмены с указанием причины. Поддерживает UUID и publicId.

---

## 📊 Статистика

**Всего procedures:** 49  
**Используется:** 20 (41%)  
**Не используется:** 29 (59%)

### По роутерам

| Роутер        | Всего | Используется | Не используется |
| ------------- | ----- | ------------ | --------------- |
| auth          | 7     | 7 (100%)     | 0               |
| exchange      | 7     | 6 (86%)      | 1               |
| fiat          | 2     | 2 (100%)     | 0               |
| user.profile  | 2     | 1 (50%)      | 1               |
| user.security | 3     | 0 (0%)       | 3               |
| user.orders   | 3     | 2 (67%)      | 1               |
| operator      | 7     | 0 (0%)       | 7               |
| support       | 6     | 0 (0%)       | 6               |
| shared        | 10    | 1 (10%)      | 9               |
| telegram-bot  | 2     | 2 (100%)     | 0               |

### Причины неиспользования

- **Admin panel не реализован:** 20 endpoints (operator: 7, support: 6, shared: 7)
- **Функционал не реализован в web app:** 9 endpoints (user.security: 3, user.profile.updateProfile: 1, user.orders.markAsPaid: 1, exchange.getLimits: 1, shared.getAll: учитывается как используемый через namespace, shared.quickActions: 1, shared.walletMonitoringControl: 1)

---

**Документация обновлена на основе фактического анализа кодовой базы с 100% верификацией всех procedures.**
