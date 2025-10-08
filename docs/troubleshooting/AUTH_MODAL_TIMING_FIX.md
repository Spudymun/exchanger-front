# Auth Modal Timing Fix - Решение на основе официальной документации

## Проблема

После успешного логина происходил редирект на главную страницу, хотя должны были остаться на `/orders` с обновленными данными.

**Логи:**

```
POST /api/trpc/auth.login → 200 ✅ (успешный логин)
GET /api/trpc/...shared.orders.getAll → 200 ✅ (данные получены)
GET /ru 200 ❌ (редирект на главную - НЕПРАВИЛЬНО!)
```

## Root Cause (из официальной документации)

### Проблемный код (до фикса):

```tsx
// apps/web/src/components/app-header.tsx
const handleAuthSuccess = React.useCallback(() => {
  authModal.closeAll(); // ← Закрывается СИНХРОННО
  utils.auth.getSession.invalidate(); // ← Выполняется АСИНХРОННО (не ждем)
  utils.invalidate(); // ← Выполняется АСИНХРОННО (не ждем)
}, [authModal, utils]);
```

**Что происходило:**

1. ✅ `authModal.closeAll()` - модалка закрывается СРАЗУ (синхронная операция)
2. 🔄 `utils.invalidate()` - запускается рефетч queries (асинхронная операция)
3. ❌ В `OrdersContainer.tsx` useEffect видит `allModalsClosed = true` и `!session?.user` (еще не обновилась)
4. ❌ Происходит `router.push('/')` ДО того, как сессия обновится

## Решение (согласно документации TanStack Query)

### Ключевые моменты из документации:

#### 1. `invalidateQueries` возвращает Promise

Из [TanStack Query - QueryClient](https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientinvalidatequeries):

```tsx
await queryClient.invalidateQueries(
  { queryKey: ['posts'], exact, refetchType: 'active' },
  { throwOnError, cancelRefetch }
);
```

> **Returns**: "This function returns a promise that will resolve when all of the queries are done being refetched."

#### 2. Active queries рефетчатся автоматически

> "By default, all matching queries are immediately marked as invalid and **active queries are refetched in the background**."

#### 3. Нужно дождаться завершения

> "For refetching, queryClient.refetchQueries is called."

### Правильное решение:

```tsx
// apps/web/src/components/app-header.tsx
const handleAuthSuccess = React.useCallback(async () => {
  // 1️⃣ Сначала инвалидируем и ЖДЕМ пока данные обновятся
  await utils.auth.getSession.invalidate();
  await utils.invalidate();

  // 2️⃣ Только ПОСЛЕ обновления данных закрываем модалку
  authModal.closeAll();
}, [authModal, utils]);
```

**Теперь последовательность правильная:**

1. ✅ `await utils.invalidate()` - запускается рефетч всех queries
2. ⏳ Ждем пока `session` и `orders` queries завершатся
3. ✅ `authModal.closeAll()` - закрываем модалку ПОСЛЕ обновления данных
4. ✅ В `OrdersContainer.tsx` useEffect видит `session?.user` существует → НЕ делает редирект

## Упрощение логики в OrdersContainer.tsx

После фикса `handleAuthSuccess`, логика в `OrdersContainer.tsx` стала проще:

```tsx
// apps/web/src/components/orders/OrdersContainer.tsx
const { data: session } = trpc.auth.getSession.useQuery();
const wasModalOpenRef = React.useRef(false);

// Отслеживаем открытие модалки
React.useEffect(() => {
  if (authModal.isLoginOpen || authModal.isRegisterOpen || authModal.isForgotPasswordOpen) {
    wasModalOpenRef.current = true;
  }
}, [authModal.isLoginOpen, authModal.isRegisterOpen, authModal.isForgotPasswordOpen]);

// Редирект на главную если пользователь закрыл модалку крестиком
React.useEffect(() => {
  const allModalsClosed =
    !authModal.isLoginOpen && !authModal.isRegisterOpen && !authModal.isForgotPasswordOpen;

  // Если модалка была открыта и теперь закрыта, но пользователь не авторизован → редирект
  if (wasModalOpenRef.current && allModalsClosed && !session?.user) {
    router.push('/');
  }

  // Сбрасываем флаг при закрытии (в любом случае)
  if (wasModalOpenRef.current && allModalsClosed) {
    wasModalOpenRef.current = false;
  }
}, [
  authModal.isLoginOpen,
  authModal.isRegisterOpen,
  authModal.isForgotPasswordOpen,
  session,
  router,
]);
```

**Логика:**

- ❌ **Крестик**: модалка закрывается → `session?.user` не существует → `router.push('/')`
- ✅ **Успешный логин**: `await utils.invalidate()` обновляет сессию → модалка закрывается → `session?.user` существует → остаемся на странице

## Альтернативные подходы (НЕ использовались)

### ❌ Подход 1: `window.location.reload()`

```tsx
if (authSuccessRef.current) {
  window.location.reload(); // Hard reload - плохо для UX
}
```

**Проблемы:**

- Полная перезагрузка страницы (плохой UX)
- Использование глобального `window` (не React way)

### ❌ Подход 2: `setInterval` проверка

```tsx
const checkModalClosed = setInterval(() => {
  if (!authModal.isLoginOpen) {
    router.push('/');
  }
}, 100);
```

**Проблемы:**

- Интервал начинает проверку сразу (initial state)
- Приводит к немедленному редиректу при загрузке страницы

### ❌ Подход 3: Флаг `authSuccessRef`

```tsx
const authSuccessRef = React.useRef(false);
const handleAuthSuccess = () => {
  authSuccessRef.current = true;
};
```

**Проблемы:**

- Требует передачи `handleAuthSuccess` через пропсы
- Не решает race condition с `authModal.closeAll()`

## Итоговое решение: `await` + проверка `session`

✅ **Преимущества:**

- Следует официальной документации TanStack Query
- Нет race conditions - модалка закрывается после обновления данных
- Чистый React/tRPC код без хаков
- Простая логика проверки `session?.user`

✅ **Результат:**

- Крестик → редирект на `/`
- Успешный логин → остаемся на `/orders` с обновленными данными

## Важные ссылки

1. [TanStack Query - invalidateQueries](https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientinvalidatequeries)
2. [TanStack Query - Query Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
3. [tRPC - useUtils](https://trpc.io/docs/client/react/useUtils)
4. [tRPC - Query Invalidation](https://trpc.io/docs/client/react/useUtils#query-invalidation)

## Тестирование

### Сценарий 1: Закрытие крестиком

1. Разлогиниться
2. Перейти на `/orders`
3. Увидеть модалку логина
4. Закрыть крестиком
5. ✅ Должен произойти редирект на `/`

### Сценарий 2: Успешный логин

1. Разлогиниться
2. Перейти на `/orders`
3. Увидеть модалку логина
4. Ввести корректные данные и залогиниться
5. ✅ Должен остаться на `/orders` с обновленным списком заказов

### Сценарий 3: Успешная регистрация

1. Разлогиниться
2. Перейти на `/orders`
3. Переключиться на "Регистрация"
4. Создать новый аккаунт
5. ✅ Должен остаться на `/orders` с обновленным списком заказов

## Выводы

**Проблема была в неправильном понимании асинхронности `utils.invalidate()`**.

Ключевой инсайт из документации:

> "`invalidateQueries` returns a promise that resolves when all queries are done being refetched"

Решение: всегда использовать `await` перед операциями, которые должны завершиться перед следующими действиями (например, закрытием модалки).

Это **сеньорское решение без костылей** - следует best practices из официальной документации TanStack Query и tRPC.
