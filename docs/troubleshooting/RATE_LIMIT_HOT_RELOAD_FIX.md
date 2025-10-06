# 🔧 Rate Limit Hot-Reload Fix

## 📋 Проблема

### Симптомы

Пользователь мог обходить rate limiting следующим образом:

1. Нажать "Отправить код" 3 раза → **работает** ✅
2. Нажать 4-й раз → **ошибка rate limit** ❌
3. Закрыть модалку
4. **Обновить страницу в браузере (F5)** 🔄
5. Открыть модалку снова
6. Снова может нажать "Отправить код" 3 раза → **работает** ✅ (НЕ ДОЛЖНО!)

**Ожидаемое поведение:** После блокировки должен оставаться заблокированным на 1 час.

### Корневая причина

**Next.js Hot Module Reload (HMR)** в development mode пересоздает модули при:

- Изменениях в коде (hot reload)
- Обновлении страницы в браузере (F5)
- Перезапуске dev server

Проблема в файле `apps/web/src/server/trpc/middleware/rateLimit.ts`:

```typescript
// ❌ ДО ИСПРАВЛЕНИЯ: создавался заново при каждой перезагрузке модуля
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
```

При каждом hot-reload или page refresh модуль переинициализировался и создавал **новый пустой Map**, теряя все счетчики rate limit.

---

## ✅ Решение

### Примененный паттерн

В проекте уже используется **Global Singleton Pattern** для `PrismaClient` (см. `packages/session-management/src/utils/prisma-singleton.ts`):

```typescript
declare global {
  var __prismaInstance: PrismaClient | undefined;
}

const prisma = global.__prismaInstance || new PrismaClient();
if (!global.__prismaInstance) {
  global.__prismaInstance = prisma;
}
```

**Источник паттерна:** [Prisma Docs - Prevent hot reloading from creating new instances](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#prevent-hot-reloading-from-creating-new-instances-of-prismaclient)

### Применение к Rate Limit Store

```typescript
// ✅ ПОСЛЕ ИСПРАВЛЕНИЯ: Global singleton pattern
declare global {
  var __rateLimitStore: Map<string, { count: number; resetTime: number }> | undefined;
}

// В development используем global для сохранения между hot-reloads
const rateLimitStore =
  global.__rateLimitStore || new Map<string, { count: number; resetTime: number }>();

if (!global.__rateLimitStore) {
  console.log(`🚀 [RATE LIMIT MODULE] Creating NEW store at ${new Date().toISOString()}`);
  global.__rateLimitStore = rateLimitStore;
} else {
  console.log(
    `♻️ [RATE LIMIT MODULE] Reusing EXISTING store at ${new Date().toISOString()}, size: ${rateLimitStore.size}`
  );
}
```

### Как это работает

1. **Первая загрузка модуля:**
   - `global.__rateLimitStore` === `undefined`
   - Создается новый `Map`
   - Сохраняется в `global.__rateLimitStore`
   - Лог: `🚀 Creating NEW store`

2. **Hot reload / Page refresh:**
   - `global.__rateLimitStore` !== `undefined` (уже существует!)
   - Переиспользуется существующий `Map` с сохраненными счетчиками
   - Лог: `♻️ Reusing EXISTING store, size: 1`

3. **Результат:**
   - Счетчики rate limit сохраняются между перезагрузками
   - Пользователь не может обойти блокировку через F5

---

## 🧪 Проверка исправления

### Тест-кейс

1. Открыть форму "Забыл пароль"
2. Нажать "Отправить код" **3 раза** → должно работать ✅
3. Нажать **4-й раз** → должна появиться ошибка rate limit ❌
4. Закрыть модалку
5. **Обновить страницу (F5)** 🔄
6. Открыть форму "Забыл пароль" снова
7. Попробовать нажать "Отправить код"

**Ожидаемый результат:**

- ❌ Должна сразу появиться ошибка rate limit
- ⏰ Блокировка должна действовать 1 час с момента первой попытки

### Логи в терминале

**При первом запуске:**

```
🚀 [RATE LIMIT MODULE] Creating NEW store at 2025-01-06T12:00:00.000Z
🗄️ [RATE LIMIT MODULE] Store status: { size: 0, keys: [] }
```

**После hot reload / F5:**

```
♻️ [RATE LIMIT MODULE] Reusing EXISTING store at 2025-01-06T12:00:30.000Z, size: 1
🗄️ [RATE LIMIT MODULE] Store status: {
  size: 1,
  keys: [ 'RESET_PASSWORD:::1' ]
}
```

**При попытке сброса пароля после F5:**

```
🔍 [RATE LIMIT] Action: RESET_PASSWORD, IP: ::1, Key: RESET_PASSWORD:::1
📊 [RATE LIMIT] Store size: 1
🗂️ [RATE LIMIT] All keys in store: [ 'RESET_PASSWORD:::1' ]
📝 [RATE LIMIT] Current state: { count: 3, resetTime: 1704542400000 }
❌ [RATE LIMIT] LIMIT EXCEEDED! count=3, limit=3
```

---

## 📚 Связанные документы

### В проекте:

- `docs/DATABASE_CONNECTION_POOLING_FINAL_REPORT.md` - подробное описание hot-reload проблемы с PrismaClient
- `packages/session-management/src/utils/prisma-singleton.ts` - реализация global singleton pattern

### Внешние источники:

- [Prisma - Prevent hot reloading from creating new instances](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#prevent-hot-reloading-from-creating-new-instances-of-prismaclient)
- [Next.js - Fast Refresh](https://nextjs.org/docs/architecture/fast-refresh)

---

## 🎯 Ключевые выводы

### Для in-memory хранилищ в Next.js dev mode:

1. ✅ **Всегда используйте global singleton pattern** для хранилищ которые должны сохранять состояние
2. ✅ **Добавляйте логирование** создания/переиспользования store
3. ✅ **Следуйте паттернам уже используемым в проекте** (см. Prisma singleton)
4. ❌ **НЕ используйте `const store = new Map()`** напрямую на module level

### Когда применять:

- Rate limiting stores
- Session caches
- Connection pools
- Любые in-memory хранилища требующие persistence между hot-reloads

### Когда НЕ нужно:

- Request-scoped данные
- Temporary caches с TTL < 1 минуты
- Production environments (используйте Redis/Database)

---

## 📝 Changelog

**Дата:** 6 января 2025  
**Файл:** `apps/web/src/server/trpc/middleware/rateLimit.ts`  
**Изменение:** Добавлен global singleton pattern для rateLimitStore  
**Причина:** Исправление обхода rate limiting через browser page refresh  
**Паттерн:** Основан на существующем `global.__prismaInstance` pattern

---

## 🔐 Безопасность

### Production рекомендации:

⚠️ **In-memory rate limiting НЕ подходит для production:**

- Теряется при restart сервера
- Не работает в multi-instance deployment
- Может быть обойден через restart

### Рекомендуемые альтернативы для production:

1. **Redis-based rate limiting** (рекомендуется)
   - Персистентность между restarts
   - Работает в multi-instance
   - Высокая производительность

2. **Database-backed rate limiting**
   - Полная персистентность
   - Audit trail
   - Медленнее чем Redis

3. **External services**
   - Cloudflare Rate Limiting
   - AWS API Gateway
   - Kong Rate Limiting Plugin

---

**Статус:** ✅ ИСПРАВЛЕНО  
**Тестировано:** Development mode, hot-reload scenarios  
**Production готовность:** НЕТ (требуется миграция на Redis)
