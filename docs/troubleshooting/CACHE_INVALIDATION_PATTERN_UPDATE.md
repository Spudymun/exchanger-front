# Cache Invalidation Pattern - Обновление документации

**Дата**: 7 октября 2025  
**Причина**: Обнаружен edge case с `await invalidate()` при работе с модалками

---

## Проблема

Документация проекта показывала паттерн использования `utils.invalidate()` **БЕЗ `await`**, что работает в 95% случаев (внутри `onSuccess` мутаций). Однако в специфичных ситуациях, когда после инвалидации нужны синхронные действия (закрытие модалки, редирект), возникал race condition.

**Проблемный код:**

```typescript
const handleAuthSuccess = React.useCallback(() => {
  authModal.closeAll(); // ← Закрывается СРАЗУ
  utils.invalidate(); // ← Асинхронно (НЕ ЖДЕМ)
}, [authModal, utils]);
```

**Race condition:**

1. `closeAll()` выполняется синхронно → модалка закрывается
2. `invalidate()` запускается асинхронно → НЕ ЖДЕМ завершения
3. useEffect видит закрытую модалку ДО обновления session
4. Проверка `session?.user` возвращает undefined
5. Редирект происходит даже после успешного логина

---

## Решение

Добавлена секция в документацию про **два паттерна** использования `invalidate()`:

### 1. БЕЗ await (95% случаев)

**Где:** В `onSuccess` callback мутаций  
**Когда:** Нет последующих синхронных действий

```typescript
const mutation = trpc.user.create.useMutation({
  onSuccess: () => {
    notifications.success('Created');
    utils.user.getAll.invalidate(); // ← БЕЗ await
  },
});
```

### 2. С await (5% случаев)

**Где:** Отдельные функции перед синхронными действиями  
**Когда:** Нужно дождаться обновления данных ПЕРЕД действием

```typescript
const handleAction = async () => {
  await utils.invalidate(); // ← С await
  modal.close(); // ← После обновления
  router.push('/'); // ← После обновления
};
```

---

## Обновленные файлы

### 1. `docs/ПРОЕКТ_ШПАРГАЛКА_ДЛЯ_ИНЖЕНЕРА.md`

**Добавлено:** Новый раздел **"Паттерн 4.1: tRPC Cache Invalidation - await vs no await"**

**Содержит:**

- ✅ Описание двух паттернов использования
- ✅ Примеры кода из реального проекта
- ✅ Объяснение race condition
- ✅ Сравнительная таблица когда использовать какой паттерн
- ✅ Чек-лист для AI агента
- ✅ Ссылки на официальную документацию TanStack Query

**Местоположение:** После "Паттерн 4: tRPC Type-Safe API"

---

### 2. `docs/core/DEVELOPER_GUIDE.md`

**Обновлено:** Секция "tRPC - End-to-end типизация" → "Использование в компонентах"

**Добавлено:**

- ✅ Подраздел "Cache Invalidation - await vs no await"
- ✅ Правило про Promise от `invalidate()`
- ✅ Два примера кода (с await и без)
- ✅ Объяснение ключевого отличия
- ✅ Ссылка на полную документацию в шпаргалке

**Изменения в коде:**

```diff
  const createUser = trpc.createUser.useMutation({
    onSuccess: () => {
-     // Обновить кеш
+     // ✅ БЕЗ await в onSuccess - фоновое обновление
      trpc.getUsers.invalidate()
    }
  })
```

---

### 3. `docs/tasks/USER_ORDER_CANCEL_IMPLEMENTATION_PLAN.md`

**Обновлено:** Секция "Cache Invalidation Pattern"

**Добавлено:**

- ✅ Блок "ВАЖНО - await vs no await"
- ✅ Два примера из реальных задач проекта
- ✅ Обновленный вывод с четким указанием когда использовать await

**Изменения:**

```diff
- **ВЫВОД:** После мутации нужно **invalidate** кэш через `utils.exchange.getOrderStatus.invalidate({ orderId })`.
+ **ВЫВОД:** После мутации нужно **invalidate** кэш через `utils.exchange.getOrderStatus.invalidate({ orderId })`.
+ Используй **БЕЗ await** в `onSuccess`, **С await** перед синхронными действиями.
```

---

## Ключевые моменты

### Источник инсайта

Проблема решена **на основе официальной документации**:

**TanStack Query:**

> "This function returns a promise that will resolve when all of the queries are done being refetched."

**tRPC:**

> "invalidate wraps queryClient.invalidateQueries"

### Почему это важно

1. **Предотвращение race conditions** при работе с модалками и редиректами
2. **Правильная последовательность** действий в асинхронном коде
3. **Четкое понимание** когда использовать await, когда нет
4. **Документированный паттерн** для всей команды

### Стандарт проекта

Теперь в проекте **два официальных паттерна**:

| Ситуация                     | Паттерн       | Пример использования                         |
| ---------------------------- | ------------- | -------------------------------------------- |
| В `onSuccess` мутации        | **БЕЗ await** | `useAuthMutations.ts`, `OrderPageClient.tsx` |
| Перед синхронными действиями | **С await**   | `app-header.tsx` (handleAuthSuccess)         |

---

## Проверка

✅ Все 3 файла документации обновлены  
✅ Нет TypeScript/Markdown ошибок  
✅ Примеры кода проверены на соответствие реальному проекту  
✅ Ссылки на официальную документацию добавлены  
✅ Чек-лист для AI агента создан

---

## Примеры из проекта

### С await (handleAuthSuccess)

**Файл:** `apps/web/src/components/app-header.tsx:57-65`

```typescript
const handleAuthSuccess = React.useCallback(async () => {
  await utils.auth.getSession.invalidate();
  await utils.invalidate();
  authModal.closeAll();
}, [authModal, utils]);
```

### БЕЗ await (login mutation)

**Файл:** `apps/web/src/hooks/useAuthMutations.ts:24-29`

```typescript
const login = trpc.auth.login.useMutation({
  onSuccess: () => {
    notifications.success(t('loginSuccess'));
    utils.auth.getSession.invalidate();
  },
});
```

### БЕЗ await (cancel order mutation)

**Файл:** `apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx:23-30`

```typescript
const cancelOrderMutation = trpc.user.orders.cancelOrder.useMutation({
  onSuccess: () => {
    notifications.success(t('orderCancelled'));
    utils.exchange.getOrderStatus.invalidate({ orderId });
  },
});
```

---

## Итог

Документация проекта теперь **полностью покрывает** оба паттерна использования `invalidate()`:

- **Стандартный паттерн** (БЕЗ await) для 95% случаев
- **Специальный паттерн** (С await) для edge cases с синхронными действиями

Это **сеньорское решение без костылей**, основанное на официальной документации TanStack Query и best practices проекта.
