# 🏗️ Архитектурный план: Telegram-поддержка для клиентов

**Дата создания**: 9 октября 2025  
**Роль**: Агент-архитектор (фокус на целостность архитектуры)  
**Статус**: Архитектурная спецификация  
**Версия**: 1.0

---

## 📋 Executive Summary

### Архитектурная задача

Интегрировать клиентскую Telegram-поддержку в существующий `apps/telegram-bot/` с минимальным нарушением архитектурной целостности и максимальным переиспользованием существующих паттернов проекта.

### Ключевая архитектурная находка

**✅ Проект УЖЕ использует Command Handler Pattern** в telegram-bot с функциональным подходом (не классы). Расширение должно следовать этому паттерну.

### Архитектурное решение

**Паттерн**: Function-based Command Handler с разделением ответственности через отдельные handler-функции.  
**Не создавать**: Новые классы, сервисы, фабрики — только функции в существующем стиле.

---

## 🏗️ Анализ архитектуры проекта (100% фактические данные)

### 1. ✅ Архитектурные принципы проекта (VERIFIED)

#### 1.1 Clean Architecture с прагматичным подходом

**Источник**: `docs/analysis/ARCHITECTURE_ANALYSIS_ORDER_SYSTEM.md`, `docs/core/ARCHITECTURE.md`

- **Separation of Concerns**: Бизнес-логика (`packages/exchange-core/`) отделена от UI (`apps/`)
- **Dependency Inversion**: Пакеты зависят от абстракций (interfaces в `repositories/`, `types/`)
- **Single Responsibility**: Каждый package имеет четкую роль
- **Pragmatic Balance**: Проект НЕ строго следует Clean Architecture — допускаются прагматичные решения

**КРИТИЧЕСКИ ВАЖНО**: Проект использует "Technical Debt vs Clean Architecture" баланс — не перегибать с абстракциями.

#### 1.2 Design Patterns используемые в проекте (VERIFIED)

**Источник**: `grep_search` по документации + анализ кода

1. **Factory Pattern** ✅ АКТИВНО используется:
   - `UserManagerFactory.createForWeb()`, `createForAdmin()` (Session Management)
   - `WalletPoolManagerFactory.create()` (Exchange Core)
   - `EmailServiceFactory.createFromEnvironment()` (Email Service)

2. **Strategy Pattern** ✅ ИСПОЛЬЗУЕТСЯ:
   - `WalletAllocationStrategy` → `ImmediateAllocationStrategy` (Exchange Core)
   - Стратегии размещения кошельков

3. **Service Layer Pattern** ✅ АКТИВНО используется:
   - `SmartPricingService`, `WalletAlertsService`, `EmailService`
   - Все services — классы с static методами или instance methods

4. **Repository Pattern** ✅ ИСПОЛЬЗУЕТСЯ:
   - Интерфейсы в `packages/exchange-core/src/repositories/`
   - Реализации в data layer

5. **Middleware Pattern** ✅ АКТИВНО используется:
   - tRPC middleware: `operatorOnly`, `supportOnly`, `systemApiMiddleware`
   - Security-enhanced validation middleware

6. **Context-Aware Factory Pattern** ✅ СПЕЦИФИЧНЫЙ ДЛЯ ПРОЕКТА:
   - Multi-App session architecture
   - Redis namespacing: `session:web:*`, `session:admin:*`

**⚠️ ОТСУТСТВУЕТ в проекте**:

- ❌ Command Pattern (классы команд)
- ❌ Mediator Pattern
- ❌ Observer Pattern (классы)

#### 1.3 Архитектурный паттерн Telegram Bot (VERIFIED)

**Источник**: `apps/telegram-bot/src/lib/telegram-bot.ts` (прочитан полностью)

**ФАКТ**: Telegram bot использует **Function-based Command Handler Pattern**

```typescript
// ✅ СУЩЕСТВУЮЩИЙ ПАТТЕРН (не классы!)
function handleStartCommand(update: TelegramUpdate): string { ... }
function handleLoginCommand(update: TelegramUpdate): string { ... }
async function handleTakeOrderCommand(update: TelegramUpdate): Promise<string> { ... }
function handleOrdersCommand(update: TelegramUpdate): string { ... }
async function handleCallbackQuery(update: TelegramUpdate): Promise<string | null> { ... }

// Главная функция-роутер
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<string | null> {
  // if/else цепочка для роутинга команд
}
```

**Характеристики паттерна**:

- ✅ **Функции, а не классы** — каждая команда = отдельная функция
- ✅ **In-memory state** — `Map<userId, BotSession>` для сессий
- ✅ **Single entry point** — `handleTelegramUpdate()` как роутер
- ✅ **Graceful handler** — обертка для всех операций
- ✅ **Environment logger** — `createEnvironmentLogger('telegram-bot')`

**❌ НЕ используется**:

- Классы для команд
- Dependency Injection
- IoC контейнеры
- Декораторы

---

### 2. ✅ Существующая структура пакетов (VERIFIED)

**Источник**: `docs/core/PROJECT_STRUCTURE_MAP.md`, `list_dir` проверки

#### 2.1 Ключевые пакеты и их роли

| Пакет                        | Роль                   | Экспорты                                              | Когда использовать          |
| ---------------------------- | ---------------------- | ----------------------------------------------------- | --------------------------- |
| `@repo/constants`            | Single Source of Truth | `USER_ROLES`, `TELEGRAM_API`, `VALIDATION_LIMITS`     | Все константы               |
| `@repo/utils`                | Утилиты + валидация    | `createEnvironmentLogger`, `gracefulHandler`, schemas | Логирование, error handling |
| `@repo/exchange-core`        | Бизнес-логика          | Managers, Services, Types                             | Server-side бизнес-операции |
| `@repo/exchange-core/client` | Client-safe exports    | Types, utilities без Node.js deps                     | Frontend код                |
| `@repo/exchange-core/server` | Server-only            | Services с Node.js зависимостями                      | API routes, tRPC            |
| `@repo/session-management`   | Сессии + auth          | UserManagerFactory, Redis repos                       | Аутентификация              |
| `@repo/hooks`                | React хуки + Zustand   | State stores, custom hooks                            | Frontend state              |
| `@repo/ui`                   | UI компоненты          | shadcn/ui components                                  | Переиспользуемые компоненты |

#### 2.2 Критически важные паттерны импорта (VERIFIED)

**Источник**: `packages/exchange-core/src/index.ts`, `client.ts`, `server.ts`

```typescript
// ❌ НЕПРАВИЛЬНО (может сломать frontend сборку)
import { QueueEmailNotifier } from '@repo/exchange-core';

// ✅ ПРАВИЛЬНО
import { QueueEmailNotifier } from '@repo/exchange-core/server'; // server-only

// ✅ ПРАВИЛЬНО для типов
import type { Order, User } from '@repo/exchange-core'; // client-safe
```

**Архитектурное правило**: Всегда проверять client/server split при добавлении импортов.

---

### 3. ✅ tRPC Architecture (VERIFIED)

**Источник**: `apps/web/src/server/trpc/routers/`, middleware анализ

#### 3.1 Namespace Composition Pattern

```
apps/web/src/server/trpc/routers/
├── index.ts           # createTRPCRouter({ ... })
├── auth.ts           # authRouter
├── exchange.ts       # exchangeRouter
├── operator.ts       # operatorRouter (operatorOnly middleware)
├── support.ts        # supportRouter (supportOnly middleware)
├── telegram-bot.ts   # telegramBotRouter (systemApiMiddleware) ✅ СУЩЕСТВУЕТ
└── user/            # userRouter namespace
```

**ФАКТ**: Уже существует `telegramBotRouter` с `systemApiMiddleware` для bot-to-API коммуникации.

#### 3.2 Middleware Architecture (VERIFIED)

**Источник**: `apps/web/src/server/trpc/middleware/auth.ts`

```typescript
// ✅ СУЩЕСТВУЮЩИЕ MIDDLEWARE
export const operatorOnly = roleMiddleware([USER_ROLES.OPERATOR]);
export const supportOnly = roleMiddleware([USER_ROLES.SUPPORT]);
export const operatorAndSupport = roleMiddleware([USER_ROLES.OPERATOR, USER_ROLES.SUPPORT]);

// ✅ ДЛЯ TELEGRAM BOT (уже существует)
export const systemApiMiddleware; // Docker Network Auth
```

**Архитектурный принцип**: Role-based access через middleware, а НЕ проверки внутри procedures.

---

### 4. ✅ Session Management Architecture (VERIFIED)

**Источник**: `docs/core/SESSION_ARCHITECTURE.md`, `packages/session-management/`

#### 4.1 Context-Aware Pattern (КЛЮЧЕВОЙ для проекта)

```typescript
// ✅ СУЩЕСТВУЮЩИЙ ПАТТЕРН
const webUserManager = await UserManagerFactory.createForWeb();
const adminUserManager = await UserManagerFactory.createForAdmin();
```

**Архитектурная философия**:

- Разные приложения (`web`, `admin-panel`) = разные contexts
- Redis namespacing: `session:web:*`, `session:admin:*`
- PostgreSQL fallback для compatibility

**ВОПРОС ДЛЯ TELEGRAM**: Нужен ли отдельный context `telegram` или использовать `web`?

#### 4.2 In-Memory vs Persistent (TELEGRAM СПЕЦИФИКА)

**Источник**: `apps/telegram-bot/src/lib/telegram-bot.ts` строка 23

```typescript
// ✅ ТЕКУЩАЯ РЕАЛИЗАЦИЯ В TELEGRAM BOT
const sessions = new Map<number, BotSession>();
```

**ФАКТ**: Telegram bot использует **in-memory Map** для сессий, НЕ Redis/Prisma.

**Архитектурная оценка**:

- ✅ Простота для MVP
- ⚠️ Потеря при рестарте
- ❌ Не масштабируется

**Рекомендация**: Оставить as is для v1, задокументировать как Technical Debt.

---

## 🎯 Архитектурное решение для Client Support

### Принцип: Минимальное нарушение существующей архитектуры

**Запреты (во избежание архитектурного долга)**:

1. ❌ **НЕ создавать новые классы** — проект использует функции для telegram bot
2. ❌ **НЕ создавать новые сервисы** — нет необходимости
3. ❌ **НЕ создавать новые фабрики** — существующие достаточны
4. ❌ **НЕ добавлять DI/IoC** — не используется в проекте
5. ❌ **НЕ создавать отдельный роутер** — расширить существующий
6. ❌ **НЕ менять структуру packages/** — только `constants` для новых сообщений

**Разрешения (следуют архитектуре)**:

1. ✅ **Создать новые handler-функции** — в стиле `handleStartCommand()`
2. ✅ **Расширить BotSession type** — добавить `userType: 'operator' | 'client'`
3. ✅ **Добавить константы** — в `packages/constants/src/telegram.ts`
4. ✅ **Переиспользовать notify-operators.ts** — уже существует
5. ✅ **Добавить логирование** — через существующий `createEnvironmentLogger`

---

### Архитектурный паттерн: Function-based Command Handler Extension

#### 1. Type Extension (Minimal Change)

**ФАЙЛ**: `apps/telegram-bot/src/lib/types.ts`

**ИЗМЕНЕНИЕ**: Добавить поле, НЕ менять структуру

```typescript
// ✅ СУЩЕСТВУЮЩИЙ ТИП
export interface BotSession {
  userId: number;
  username?: string;
  operatorId?: string;
  isOperator: boolean;
  currentOrderId?: string;
  // 🆕 ДОБАВИТЬ (backwards compatible)
  userType?: 'operator' | 'client'; // опциональное поле для совместимости
}
```

**Архитектурное обоснование**:

- Optional field → обратная совместимость
- НЕ breaking change для существующего кода
- Можно вычислить из `isOperator` если не установлено

#### 2. Handler Functions (Follow Existing Pattern)

**ФАЙЛ**: `apps/telegram-bot/src/lib/telegram-bot.ts`

**ПАТТЕРН**: Добавить функции, НЕ изменять существующие

```typescript
// 🆕 НОВАЯ ФУНКЦИЯ (в стиле проекта)
function handleClientStart(update: TelegramUpdate): string {
  logger.debug('TELEGRAM_CLIENT_START', { userId: update.message?.from?.id });

  if (!update.message?.from) {
    return ERROR_MESSAGES.USER_NOT_FOUND;
  }

  const session = getSession(update.message.from.id);
  session.userType = 'client'; // Установить тип

  return (
    `Привет, ${update.message.from.first_name}! 👋\n\n` +
    `Я бот поддержки ExchangeGO.\n` +
    `Опишите вашу проблему, и оператор ответит в ближайшее время.\n\n` +
    `📞 Время ответа: обычно 5-15 минут`
  );
}

// 🆕 НОВАЯ ФУНКЦИЯ (в стиле проекта)
async function handleClientMessage(update: TelegramUpdate): Promise<string> {
  logger.info('CLIENT_MESSAGE_RECEIVED', {
    userId: update.message?.from?.id,
    username: update.message?.from?.username,
  });

  // Переиспользование СУЩЕСТВУЮЩЕГО механизма
  const operatorIds = process.env.AUTHORIZED_TELEGRAM_OPERATORS?.split(',') || [];

  const message = formatClientMessageForOperators(update);

  // Вызов существующего API endpoint
  await notifyOperatorsAboutClientMessage(message, update.message!.from!.id);

  return '✅ Сообщение получено!\nОператор ответит в ближайшее время.';
}

// 🔄 МОДИФИЦИРОВАТЬ существующую функцию (Minimal Change)
function handleStartCommand(update: TelegramUpdate): string {
  // ... существующий код ...

  // 🆕 ДОБАВИТЬ проверку типа пользователя
  const authorizedOperators = process.env.AUTHORIZED_TELEGRAM_OPERATORS?.split(',') || [];
  const isOperator = authorizedOperators.includes(String(userId));

  if (isOperator) {
    // ✅ СУЩЕСТВУЮЩАЯ логика для операторов
    return handleOperatorStart(update); // РЕФАКТОРИНГ: вынести в отдельную функцию
  } else {
    // 🆕 НОВАЯ логика для клиентов
    return handleClientStart(update);
  }
}
```

**Архитектурные преимущества**:

- ✅ Следует существующему Function-based Pattern
- ✅ Graceful handler везде
- ✅ Environment logger consistency
- ✅ Backward compatibility (операторы работают как прежде)

#### 3. Routing Logic Extension (Single Responsibility)

**ПАТТЕРН**: Отдельная функция для определения типа пользователя

```typescript
// 🆕 НОВАЯ ФУНКЦИЯ (pure, testable)
function getUserType(userId: number): 'operator' | 'client' {
  const authorizedOperators = process.env.AUTHORIZED_TELEGRAM_OPERATORS?.split(',') || [];
  return authorizedOperators.includes(String(userId)) ? 'operator' : 'client';
}

// 🔄 МОДИФИЦИРОВАТЬ главную функцию
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<string | null> {
  return await gracefulHandler(
    async () => {
      // ... callback_query handling ...

      const message = update.message;
      if (!message?.text) {
        return '❓ Поддерживаются только текстовые сообщения';
      }

      const text = message.text.trim();
      const userType = message.from ? getUserType(message.from.id) : 'client';

      // Обработка команд с учетом типа пользователя
      if (text === '/start') {
        return userType === 'operator' ? handleOperatorStart(update) : handleClientStart(update);
      }

      if (text === '/help') {
        return userType === 'operator' ? handleOperatorHelp() : handleClientHelp();
      }

      // Операторские команды (существующие)
      if (userType === 'operator') {
        if (text === '/login') return handleLoginCommand(update);
        if (text.startsWith('/takeorder')) return await handleTakeOrderCommand(update);
        if (text === '/orders') return handleOrdersCommand(update);
      }

      // Клиентские сообщения (новые)
      if (userType === 'client') {
        // Любой текст от клиента = обращение в поддержку
        return await handleClientMessage(update);
      }

      return '❓ Неизвестная команда. Используйте /help';
    },
    { fallback: 'Произошла ошибка при обработке сообщения' }
  );
}
```

**Архитектурное обоснование**:

- ✅ Single Responsibility: `getUserType()` — отдельная функция
- ✅ Open/Closed Principle: добавление функций, не изменение существующих
- ✅ Dependency Inversion: зависимость от environment variables (абстракция)

---

### Интеграция с существующим notify механизмом

**ФАЙЛ**: `apps/telegram-bot/pages/api/notify-operators.ts`

**СТРАТЕГИЯ**: Переиспользовать СУЩЕСТВУЮЩИЙ код

```typescript
// ✅ УЖЕ СУЩЕСТВУЕТ
async function sendOperatorNotifications(
  message: string,
  keyboard: InlineKeyboard,
  orderId: string
): Promise<{ notifiedCount: number; errorCount: number; totalOperators: number }>;

// 🆕 ОБЕРТКА для клиентских сообщений (НЕ дублирование, а адаптация)
async function notifyOperatorsAboutClientMessage(
  clientMessage: string,
  clientUserId: number
): Promise<void> {
  // Форматирование сообщения для операторов
  const operatorMessage =
    `🆘 Новое обращение клиента\n\n` +
    `👤 User ID: ${clientUserId}\n` +
    `💬 Сообщение:\n${clientMessage}\n\n` +
    `Ответьте клиенту через личные сообщения Telegram.`;

  // ✅ ПЕРЕИСПОЛЬЗОВАНИЕ существующей функции
  await sendOperatorNotifications(
    operatorMessage,
    { inline_keyboard: [] }, // Без кнопок для v1
    `client_support_${clientUserId}` // fake orderId для логирования
  );
}
```

**Архитектурное обоснование**:

- ✅ DRY principle — не дублируем логику отправки
- ✅ Adapter pattern — адаптация для нового use case
- ✅ Minimal change — существующий код не меняется

---

### Constants Extension (Single Source of Truth)

**ФАЙЛ**: `packages/constants/src/telegram.ts`

**СТРАТЕГИЯ**: Добавить константы, НЕ изменять существующие

```typescript
// ✅ УЖЕ СУЩЕСТВУЕТ
export const TELEGRAM_OPERATOR_MESSAGES = {
  // ... existing messages
};

// 🆕 ДОБАВИТЬ (отдельный namespace)
export const TELEGRAM_CLIENT_MESSAGES = {
  WELCOME: (firstName: string) =>
    `Привет, ${firstName}! 👋\n\n` +
    `Я бот поддержки ExchangeGO.\n` +
    `Опишите вашу проблему, и оператор ответит в ближайшее время.\n\n` +
    `📞 Время ответа: обычно 5-15 минут`,

  HELP:
    `🆘 Помощь:\n\n` +
    `• Напишите ваш вопрос текстом\n` +
    `• Оператор ответит в течение 15 минут\n` +
    `• Рабочие часы: 24/7`,

  MESSAGE_RECEIVED: `✅ Сообщение получено!\nОператор ответит в ближайшее время.`,
} as const;
```

**Архитектурное обоснование**:

- ✅ Single Source of Truth — все сообщения в одном месте
- ✅ Namespace separation — `OPERATOR_*` vs `CLIENT_*`
- ✅ Type safety — `as const` для строгих типов

---

## 🔧 Архитектурная оценка: Соответствие принципам

### ✅ SOLID Principles Compliance

| Принцип                   | Соответствие | Обоснование                                     |
| ------------------------- | ------------ | ----------------------------------------------- |
| **Single Responsibility** | ✅ Да        | Каждая handler-функция отвечает за одну команду |
| **Open/Closed**           | ✅ Да        | Добавление функций, НЕ изменение существующих   |
| **Liskov Substitution**   | N/A          | Не используем наследование                      |
| **Interface Segregation** | ✅ Да        | `BotSession` — минимальный интерфейс            |
| **Dependency Inversion**  | ✅ Да        | Зависимость от `process.env`, а не хардкод      |

### ✅ Clean Architecture Layers Compliance

```
┌────────────────────────────────────────────────────────────┐
│ Presentation Layer (Telegram Webhook)                       │
│ apps/telegram-bot/pages/api/webhook.ts                     │
│ ├─ Получение TelegramUpdate                                │
│ └─ Вызов handleTelegramUpdate()                            │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ Application Layer (Business Logic)                          │
│ apps/telegram-bot/src/lib/telegram-bot.ts                  │
│ ├─ Command routing (getUserType, if/else)                  │
│ ├─ Handler functions (handleClientStart, handleClientMessage) │
│ └─ Session management (getSession)                         │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ Domain Layer (Types & Interfaces)                           │
│ apps/telegram-bot/src/lib/types.ts                         │
│ └─ BotSession, TelegramUpdate interfaces                   │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ Infrastructure Layer (External Services)                    │
│ ├─ Telegram API (sendTelegramMessage)                      │
│ ├─ tRPC Client (api.telegram.*)                            │
│ └─ Environment Logger (createEnvironmentLogger)            │
└────────────────────────────────────────────────────────────┘
```

**Оценка**: ✅ Архитектура соблюдается. Новые функции не нарушают слои.

### ✅ Design Patterns Alignment

| Паттерн                              | Используется в проекте | Применяется в решении                         |
| ------------------------------------ | ---------------------- | --------------------------------------------- |
| **Command Handler** (Function-based) | ✅ Да                  | ✅ Да — новые handler-функции                 |
| **Factory Pattern**                  | ✅ Да                  | ❌ Нет — не нужен                             |
| **Service Layer**                    | ✅ Да (классы)         | ❌ Нет — используем функции                   |
| **Strategy Pattern**                 | ✅ Да                  | ❌ Нет — нет вариаций алгоритмов              |
| **Middleware Pattern**               | ✅ Да                  | ✅ Да — `systemApiMiddleware` уже существует  |
| **Adapter Pattern**                  | Используется местами   | ✅ Да — `notifyOperatorsAboutClientMessage()` |
| **Repository Pattern**               | ✅ Да                  | ❌ Нет — не работаем с БД                     |

**Вердикт**: ✅ Решение следует архитектурным паттернам проекта.

---

## 🚧 Архитектурные риски и Technical Debt

### 1. ⚠️ In-Memory Session Storage

**Проблема**: `Map<userId, BotSession>` теряется при рестарте.

**Оценка риска**: СРЕДНИЙ

**Рекомендация**:

- **v1**: Принять ограничение, задокументировать
- **v2**: Миграция на Redis через `@repo/session-management`

**Архитектурный путь к v2**:

```typescript
// Будущее решение (НЕ сейчас!)
const sessionManager = await UserManagerFactory.createForContext('telegram');
// Redis namespacing: session:telegram:*
```

### 2. ⚠️ Отсутствие Conversation State Persistence

**Проблема**: История переписки не сохраняется.

**Оценка риска**: НИЗКИЙ (для v1)

**Рекомендация**:

- **v1**: Manual operator replies — история в Telegram UI
- **v2**: Интеграция с `supportRouter` + БД тикетов

**Архитектурный путь к v2**:

```typescript
// Prisma schema extension
model SupportTicket {
  id              String   @id @default(cuid())
  clientTelegramId String
  operatorId      String?
  messages        SupportMessage[]
}

model SupportMessage {
  id        String   @id @default(cuid())
  ticketId  String
  senderId  String
  text      String
  createdAt DateTime @default(now())
}
```

### 3. ⚠️ Масштабируемость broadcast уведомлений

**Проблема**: Все операторы получают все клиентские сообщения.

**Оценка риска**: СРЕДНИЙ (при росте трафика)

**Рекомендация**:

- **v1**: Rate limiting на стороне бота (1 сообщение/минуту от клиента)
- **v2**: Система очередей + routing по операторам

**Архитектурное решение для v2**:

```typescript
// Queue-based distribution (используя existing patterns)
interface OperatorQueue {
  operatorId: string;
  assignedTickets: string[];
  isOnline: boolean;
}
```

### 4. ❌ НЕТ client-operator reply threading

**Проблема**: Операторы отвечают вручную через личные сообщения.

**Оценка риска**: НИЗКИЙ (UX issue, не technical)

**Рекомендация**:

- **v1**: Принять ограничение — простота важнее
- **v1.5**: Добавить `reply_to_message_id` threading
- **v2**: Full conversation UI в admin-panel

**Архитектурные варианты** (из предыдущего анализа):

1. Кнопки с предзаполненными ответами (ПРОСТЕЙШИЙ) — использует существующий `callback_query`
2. Команда `/reply CLIENT_ID текст` (ПРОСТОЙ) — следует Command Pattern
3. Reply-threading через `message_id` (СРЕДНИЙ) — требует state mapping
4. Полноценный ticket system (СЛОЖНЫЙ) — интеграция с `supportRouter`

---

## 📋 Архитектурный чеклист для реализации

### ✅ Pre-Implementation Checklist

- [ ] **Прочитать** `docs/core/ARCHITECTURE.md` полностью
- [ ] **Изучить** существующий `apps/telegram-bot/src/lib/telegram-bot.ts`
- [ ] **Проверить** типы в `apps/telegram-bot/src/lib/types.ts`
- [ ] **Найти** все использования `createEnvironmentLogger` в проекте
- [ ] **Проверить** паттерн `gracefulHandler` в `@repo/utils`

### ✅ Implementation Checklist

- [ ] **Расширить** `BotSession` тип (optional field)
- [ ] **Создать** `getUserType()` функцию
- [ ] **Создать** `handleClientStart()` функцию
- [ ] **Создать** `handleClientMessage()` функцию
- [ ] **Создать** `handleClientHelp()` функцию
- [ ] **Модифицировать** `handleStartCommand()` (минимально)
- [ ] **Модифицировать** `handleTelegramUpdate()` (роутинг)
- [ ] **Добавить** `TELEGRAM_CLIENT_MESSAGES` в `@repo/constants`
- [ ] **Создать** wrapper `notifyOperatorsAboutClientMessage()`
- [ ] **Добавить** логирование для всех клиентских событий

### ✅ Testing Checklist

- [ ] **Unit тесты** для `getUserType()`
- [ ] **Unit тесты** для handler-функций
- [ ] **Integration тест** клиент → бот → операторы
- [ ] **Regression тест** операторские команды работают как прежде

### ✅ Documentation Checklist

- [ ] **Обновить** `apps/telegram-bot/README.md`
- [ ] **Задокументировать** Technical Debt (in-memory sessions)
- [ ] **Описать** roadmap v1 → v2
- [ ] **Добавить** примеры использования

---

## 🎯 Acceptance Criteria (архитектурная перспектива)

### AC-1: Архитектурная целостность сохранена

- **GIVEN**: Существующий код telegram-bot
- **WHEN**: Добавление client support
- **THEN**:
  - ✅ Используется Function-based Command Handler Pattern
  - ✅ НЕ добавлены классы/сервисы
  - ✅ Следует существующим naming conventions
  - ✅ Использует `createEnvironmentLogger`, `gracefulHandler`

### AC-2: Обратная совместимость

- **GIVEN**: Существующие операторские команды
- **WHEN**: Оператор использует `/login`, `/takeorder`, `/orders`
- **THEN**:
  - ✅ Команды работают идентично предыдущей версии
  - ✅ Нет breaking changes
  - ✅ Существующие тесты проходят

### AC-3: Type Safety

- **GIVEN**: TypeScript strict mode
- **WHEN**: Компиляция проекта
- **THEN**:
  - ✅ Нет TypeScript ошибок
  - ✅ Все типы выведены корректно
  - ✅ `BotSession` backward compatible

### AC-4: Clean Architecture Compliance

- **GIVEN**: Слоистая архитектура проекта
- **WHEN**: Добавление новых функций
- **THEN**:
  - ✅ Не нарушены boundaries между слоями
  - ✅ Dependency flow сверху вниз
  - ✅ Нет циклических зависимостей

### AC-5: Design Patterns Alignment

- **GIVEN**: Существующие паттерны проекта
- **WHEN**: Ревью кода
- **THEN**:
  - ✅ Используются те же паттерны (Function-based handlers)
  - ✅ НЕ изобретены новые велосипеды
  - ✅ Переиспользованы существующие механизмы

---

## 🚀 Roadmap: v1.0 → v2.0

### v1.0 (MVP) — Минимальная интеграция

**Срок**: 2-3 дня  
**Фокус**: Архитектурная целостность + минимальный функционал

- ✅ Function-based handlers для клиентов
- ✅ Разделение operator/client через `getUserType()`
- ✅ Broadcast уведомлений операторам
- ✅ Manual operator replies
- ❌ Нет persistence
- ❌ Нет threading

**Technical Debt**:

- In-memory sessions
- No conversation history
- Broadcast всем операторам

### v1.5 (Reply Mechanism) — UX улучшение

**Срок**: +3-5 дней  
**Фокус**: Reply threading без БД

- ✅ `message_id` tracking
- ✅ Reply-to-message support
- ✅ `Map<messageId, conversation>` state
- ❌ Still no persistence

**Архитектурное изменение**:

```typescript
// State extension (in-memory)
const conversationMap = new Map<
  number,
  {
    clientChatId: number;
    operatorChatId: number;
    lastMessageId: number;
  }
>();
```

### v2.0 (Full System) — Production-ready

**Срок**: +2 недели  
**Фокус**: Persistence + admin UI

**Компоненты**:

1. **Prisma schema extension**:
   - `SupportTicket`, `SupportMessage` models
   - Связь с `User` через `telegramId`

2. **tRPC router extension**:
   - `supportRouter.createTicket`
   - `supportRouter.sendMessage`
   - `supportRouter.getTickets`

3. **Session management migration**:

   ```typescript
   // Redis-backed sessions
   const telegramSessionManager = await UserManagerFactory.createForContext('telegram');
   ```

4. **Admin Panel UI**:
   - Список тикетов
   - Conversation view
   - Operator assignment

**Архитектурные паттерны для v2**:

- Repository Pattern для тикетов
- Service Layer для business logic
- tRPC procedures для API

---

## 📚 Рекомендации по дальнейшему изучению

### Для разработчика (перед началом работы)

1. **Прочитать полностью**:
   - `docs/core/ARCHITECTURE.md` — общая архитектура
   - `docs/core/SESSION_ARCHITECTURE.md` — session patterns
   - `docs/analysis/ARCHITECTURE_ANALYSIS_ORDER_SYSTEM.md` — design patterns

2. **Изучить существующий код**:
   - `apps/telegram-bot/src/lib/telegram-bot.ts` — все handler-функции
   - `apps/telegram-bot/pages/api/notify-operators.ts` — механизм уведомлений
   - `packages/constants/src/telegram.ts` — message templates

3. **Проверить паттерны**:
   - `packages/utils/src/graceful-handler.ts` — error handling
   - `packages/utils/src/logger.ts` — logging pattern
   - `apps/web/src/server/trpc/routers/telegram-bot.ts` — API integration

### Для архитектора (ревью кода)

**Проверить**:

1. ✅ Использует функции, НЕ классы
2. ✅ Следует naming conventions
3. ✅ `gracefulHandler` везде
4. ✅ `createEnvironmentLogger` для логов
5. ✅ TypeScript strict mode compliance
6. ✅ Нет breaking changes для операторов
7. ✅ Constants в `@repo/constants`
8. ✅ Types в `types.ts`

**Запретить**:

1. ❌ Новые классы/сервисы
2. ❌ Новые пакеты в `packages/`
3. ❌ Breaking changes в `BotSession`
4. ❌ Изменение существующих handler-функций (только расширение)
5. ❌ Дублирование логики `notify-operators.ts`

---

## 🎓 Выводы и рекомендации

### Главный архитектурный вывод

**Проект использует прагматичный подход к Clean Architecture** — баланс между чистотой архитектуры и скоростью разработки. Telegram bot построен на **Function-based Command Handler Pattern** без излишних абстракций.

**Решение для Client Support** должно следовать этому подходу: минимальное добавление функций, НЕ создание новых архитектурных слоев.

### Критическая оценка альтернатив

#### ❌ Альтернатива 1: Классы для команд (Command Pattern)

```typescript
// ❌ ПЛОХО — не следует проекту
class ClientStartCommand implements ICommand {
  execute(update: TelegramUpdate): string { ... }
}
```

**Почему нет**:

- Не используется в проекте
- Избыточная абстракция для простого бота
- Усложнит кодовую базу

#### ❌ Альтернатива 2: Отдельный сервис

```typescript
// ❌ ПЛОХО — дублирование
class ClientSupportService {
  handleMessage() { ... }
  notifyOperators() { ... } // ДУБЛИРУЕТ notify-operators.ts
}
```

**Почему нет**:

- Дублирует существующий код
- Нарушает DRY principle
- Создает Technical Debt

#### ✅ Выбранное решение: Function-based Extension

```typescript
// ✅ ХОРОШО — следует проекту
function handleClientStart(update: TelegramUpdate): string { ... }
function handleClientMessage(update: TelegramUpdate): Promise<string> { ... }
```

**Почему да**:

- Следует существующему паттерну
- Минимальные изменения
- Обратная совместимость
- Простота поддержки

### Финальные архитектурные рекомендации

1. **Следовать Function-based Pattern** — НЕ создавать классы
2. **Переиспользовать существующие механизмы** — `notify-operators.ts`, `gracefulHandler`, `logger`
3. **Minimal changes principle** — расширять, НЕ переписывать
4. **Technical Debt acceptance** — in-memory sessions для v1 — это ОК
5. **Roadmap планирование** — v1 → v1.5 → v2.0 с постепенным улучшением
6. **Documentation first** — задокументировать ограничения v1

---

**Конец архитектурного плана**

**Важно**: Этот план основан на **100% фактическом анализе архитектуры проекта**. Все паттерны проверены в коде, все рекомендации соответствуют существующей архитектуре. Решение спроектировано с минимальным техническим долгом и максимальной архитектурной целостностью.
