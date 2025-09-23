# Task 9.2 ИСПРАВЛЕННЫЙ ПЛАН: System API Authentication для Telegram Bot

**🚨 ИСПРАВЛЕНИЕ АРХИТЕКТУРНЫХ ОШИБОК**

> **Обновлено:** 23 сентября 2025  
> **Принцип:** НЕ изменять operatorOnly middleware, создать systemApiMiddleware  
> **Источник:** Задача 9.2 из `docs/tasks/ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md`  
> **Правила:** ai-agent-rules.yml (Rule 25: Фокус на цели, Rule 20: Запрет избыточности)

---

## 🎯 ПРАВИЛЬНОЕ ПОНИМАНИЕ ЗАДАЧИ

### ❌ ОШИБКА В ИСХОДНОМ ПЛАНЕ:

- План предлагал изменить `operatorOnly` middleware
- Это нарушило бы существующую session-based архитектуру
- Telegram bot НЕ является web пользователем - это СЕРВИС

### ✅ ПРАВИЛЬНОЕ РЕШЕНИЕ:

- Telegram bot = системное приложение с API_SECRET_KEY
- Создать НОВЫЙ `systemApiMiddleware` для сервисных вызовов
- Создать bot-specific procedures вместо модификации operatorOnly

## 🔍 ФАКТИЧЕСКИЙ АНАЛИЗ КОДА

### ✅ УЖЕ СУЩЕСТВУЕТ (VERIFIED):

1. **tRPC Client с заглушкой** - `apps/telegram-bot/src/lib/trpc-client.ts`:

   ```typescript
   headers: () => ({
     'x-telegram-bot': 'true',  // ← ЗАГЛУШКА, требует замены на API_SECRET_KEY
   }),
   export const api = { operator: { takeOrder, updateOrderStatus }, ... };
   ```

2. **Infrastructure** - Apps структура готова:

   ```
   apps/telegram-bot/
   ├── package.json ✅ (dependencies: @trpc/client, superjson, telegraf)
   ├── src/lib/trpc-client.ts ✅ (PARTIAL implementation)
   ├── pages/api/webhook.ts ✅ (webhook endpoint ready)
   └── pages/api/trpc/[trpc].ts ✅ (tRPC handler)
   ```

3. **Authentication Infrastructure** в apps/web:

   ```typescript
   // apps/web/src/server/trpc/context.ts - FACT
   const sessionId = req.cookies.sessionId || req.headers.authorization?.replace('Bearer ', '');
   // ✅ ПОДДЕРЖИВАЕТ Authorization header для tRPC requests
   ```

4. **Operator Middleware** - `apps/web/src/server/trpc/middleware/auth.ts`:
   ```typescript
   export const operatorOnly = roleMiddleware([USER_ROLES.OPERATOR]); // ✅ READY
   ```

### ❌ ОТСУТСТВУЕТ (ТРЕБУЕТ РЕАЛИЗАЦИИ):

1. **API Keys Authentication** в tRPC client headers
2. **Security enhancement** для bot requests
3. **Environment variables** для API authentication
4. **Error handling** для authentication failures

---

## 🏗️ АРХИТЕКТУРНОЕ РЕШЕНИЕ

### 🎯 ПРИНЦИП: Minimal Intrusive Changes

**ЦЕЛЬ:** Дополнить СУЩЕСТВУЮЩИЙ `trpc-client.ts` API Keys authentication БЕЗ переписывания архитектуры

**ПОДХОД:** Расширение существующих headers в `httpBatchLink` для поддержки Bearer token authentication

**INTEGRATION POINT:** `apps/web/src/server/trpc/context.ts` УЖЕ поддерживает `req.headers.authorization`

---

## 📋 ПРАВИЛЬНЫЙ ПЛАН РЕАЛИЗАЦИИ

### Phase 1: Создать systemApiMiddleware

#### 🔧 1.1 Добавить системный middleware

**ФАЙЛ:** `apps/web/src/server/trpc/middleware/auth.ts` (ДОПОЛНЕНИЕ)

```typescript
// ✅ НОВЫЙ MIDDLEWARE для системных API вызовов (telegram bot)
export const systemApiMiddleware = publicProcedure.use(async ({ ctx, next }) => {
  const apiKey = ctx.req.headers.authorization?.replace('Bearer ', '');

  if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
    throw createUnauthorizedError('Invalid system API key');
  }

  return next({
    ctx: {
      ...ctx,
      isSystemCall: true,
    },
  });
});
```

### Phase 2: Создать bot-specific procedures

#### 🔧 2.1 Добавить роутер для telegram bot

**ФАЙЛ:** `apps/web/src/server/trpc/routers/telegram-bot.ts` (НОВЫЙ)

```typescript
import { z } from 'zod';
import { createTRPCRouter } from '../init';
import { systemApiMiddleware } from '../middleware/auth';
import { orderManager } from '@repo/exchange-core';

/**
 * Специальные procedures для telegram bot
 * Используют systemApiMiddleware вместо operatorOnly
 */
export const telegramBotRouter = createTRPCRouter({
  // Взять заявку через telegram bot от имени оператора
  takeOrderByTelegram: systemApiMiddleware
    .input(
      z.object({
        orderId: z.string(),
        telegramOperatorId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // ✅ ПРАВИЛЬНО: Динамическая валидация через user_app_roles
      const operator = await prisma.users.findFirst({
        where: {
          telegramId: input.telegramOperatorId,
          appRoles: {
            some: {
              applicationContext: 'TELEGRAM', // ← НОВЫЙ контекст
              role: 'OPERATOR',
            },
          },
        },
        include: { appRoles: true },
      });

      if (!operator) {
        throw new Error('Unauthorized telegram operator');
      }

      // Найти заявку и назначить на системного оператора
      const order = await orderManager.findById(input.orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Использовать существующую логику но от имени системы
      const updatedOrder = await orderManager.assignToOperator(
        input.orderId,
        `telegram-${input.telegramOperatorId}` // Системный ID оператора
      );

      return { success: true, order: updatedOrder };
    }),

  // Обновить статус через telegram bot
  updateOrderStatusByTelegram: systemApiMiddleware
    .input(
      z.object({
        orderId: z.string(),
        status: z.string(),
        telegramOperatorId: z.string(),
        operatorNote: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // ✅ ПРАВИЛЬНО: Аналогичная динамическая проверка через user_app_roles
      const operator = await prisma.users.findFirst({
        where: {
          telegramId: input.telegramOperatorId,
          appRoles: {
            some: {
              applicationContext: 'TELEGRAM', // ← НОВЫЙ контекст
              role: 'OPERATOR',
            },
          },
        },
      });

      if (!operator) {
        throw new Error('Unauthorized telegram operator');
      }

      const updatedOrder = await orderManager.updateStatus(
        input.orderId,
        input.status,
        input.operatorNote
      );

      return { success: true, order: updatedOrder };
    }),
});
```

### Phase 3: Обновить telegram bot client

#### 🔧 3.1 Исправить аутентификацию

**ФАЙЛ:** `apps/telegram-bot/src/lib/trpc-client.ts` (ИЗМЕНЕНИЕ)

```typescript
// ЗАМЕНИТЬ заглушку на правильную аутентификацию
headers: () => ({
  authorization: `Bearer ${process.env.API_SECRET_KEY}`, // ✅ ПРАВИЛЬНО
}),
```

#### 🔧 3.2 Обновить API методы

```typescript
export const api = {
  telegram: {
    takeOrder: trpcClient.telegramBot.takeOrderByTelegram.mutate,
    updateOrderStatus: trpcClient.telegramBot.updateOrderStatusByTelegram.mutate,
  },
} as const;
```

### Phase 4: Интеграция

#### 🔧 4.1 Добавить в основной роутер

**ФАЙЛ:** `apps/web/src/server/trpc/routers/index.ts` (ДОПОЛНЕНИЕ)

```typescript
import { telegramBotRouter } from './telegram-bot';

export const appRouter = createTRPCRouter({
  // ... существующие роутеры
  telegramBot: telegramBotRouter, // ✅ НОВЫЙ роутер
});
```

## 🎯 РЕЗУЛЬТАТ

### ✅ Что ДОСТИГНУТО:

1. **Telegram bot получает системные права** через API_SECRET_KEY
2. **operatorOnly middleware остается нетронутым** - не нарушаем web архитектуру
3. **Новые bot-specific procedures** с валидацией telegram операторов
4. **Минимальные изменения** - только добавления, без модификации существующего кода

### ✅ Архитектурная целостность:

- **Web procedures** - используют session-based аутентификацию (operatorOnly)
- **Bot procedures** - используют system API аутентификацию (systemApiMiddleware)
- **Разделение ответственности** - каждый тип приложения имеет свой middleware

## 🚨 ВАЖНО

**НЕ изменять operatorOnly middleware** - это нарушит существующую web аутентификацию!

**Использовать ТОЛЬКО новые procedures** для telegram bot интеграции!

**ТРЕБУЕТСЯ РАСШИРЕНИЕ АРХИТЕКТУРЫ:** Добавить 'telegram' в ApplicationType enum для поддержки отдельных telegram операторов

---

## 💡 ПОЧЕМУ ЭТОТ ПОДХОД ПРАВИЛЬНЫЙ

### ✅ Архитектурные изменения для поддержки telegram context:

**1. Расширить Prisma enum ApplicationType:**

```sql
-- packages/session-management/prisma/schema.prisma
enum ApplicationType {
  WEB      @map("web")
  ADMIN    @map("admin")
  TELEGRAM @map("telegram") // ← НОВОЕ значение
}
```

**2. Обновить mapping константы:**

```typescript
// packages/constants/src/prisma-mapping.ts
export const PRISMA_TO_PROJECT_APP_CONTEXT_MAP = {
  WEB: 'web' as const,
  ADMIN: 'admin' as const,
  TELEGRAM: 'telegram' as const, // ← НОВОЕ маппинг
} as const;
```

**3. Расширить ApplicationContext тип:**

```typescript
// packages/constants/src/session.ts
export type ApplicationContext = 'web' | 'admin' | 'telegram';
```

**4. Добавить поле telegramId в User модель:**

```sql
-- packages/session-management/prisma/schema.prisma
model User {
  id             String          @id
  email          String          @unique
  telegramId     String?         @map("telegram_id") @db.VarChar(50) // ← НОВОЕ поле
  // ... остальные поля

  @@index([telegramId]) // ← НОВЫЙ индекс
}
```

### ✅ Преимущества отдельного telegram application context:

- **Независимое управление ролями**: Telegram операторы управляются отдельно от web операторов
- **Гранулярный контроль доступа**: Можно назначать разные права для разных интерфейсов
- **Безопасность**: Компрометация telegram не влияет на web систему
- **Масштабируемость**: Легко добавлять новые типы приложений/интерфейсов
- **Аудит**: Четкое разделение действий по источникам (web/admin/telegram)

### ✅ Database + Admin Panel управление:

**Создание telegram оператора:**

```typescript
// Через Admin Panel или tRPC API
await prisma.users.create({
  data: {
    email: 'operator@company.com',
    telegramId: '777888999',
    isVerified: true,
    appRoles: {
      create: {
        applicationContext: 'TELEGRAM',
        role: 'OPERATOR',
      },
    },
  },
});
```

**Отзыв доступа telegram оператора:**

```typescript
// Удаление роли (пользователь остается)
await prisma.userAppRole.deleteMany({
  where: {
    userId: operatorId,
    applicationContext: 'TELEGRAM',
  },
});
```

### ✅ Соблюдение ai-agent-rules.yml:

- **Rule 25** - Фокус на цели: создаем только необходимые telegram bot procedures и архитектурные изменения
- **Rule 20** - Запрет избыточности: НЕ дублируем operatorOnly логику, создаем отдельную систему
- **Rule 8** - Запрет предположений: основано на ФАКТИЧЕСКОЙ проверке существующей архитектуры
- **Rule 24** - Знание структуры: учитывает существующую систему user_app_roles и ApplicationType enum

### ✅ Архитектурная корректность:

- **Расширение без нарушения**: Добавляем 'telegram' context без изменения web/admin логики
- **Принцип единственной ответственности**: Каждый application context имеет свои роли
- **Open/Closed принцип**: Расширяем функциональность добавлением нового контекста

### ✅ Безопасность через Database + Admin Panel:

- **Динамическая проверка**: user_app_roles.applicationContext = 'TELEGRAM' AND role = 'OPERATOR'
- **Мгновенное управление**: Создание/удаление ролей без рестарта приложения
- **Полный аудит**: Все изменения ролей логируются в базе данных
- **Изоляция контекстов**: Telegram операторы изолированы от web/admin систем

---

## 🚀 NEXT STEPS

1. **Implement Phase 1-2** (Environment + Headers)
2. **Test authentication** с apps/web API
3. **Add error handling** (Phase 3)
4. **Document configuration** (Phase 4)
5. **Integration testing** с operator procedures

**SUCCESS CRITERIA:** `api.operator.takeOrder()` успешно вызывается через tRPC с proper authentication

---

## 📝 NOTES

**ARCHITECTURAL DECISION:** Задача 9.2 ЧАСТИЧНО реализована - основная инфраструктура есть, требуется только authentication enhancement

**REUSABILITY:** Этот pattern можно использовать для других service-to-service integrations

**MAINTAINABILITY:** Changes изолированы в одном файле, легко понять и поддерживать
