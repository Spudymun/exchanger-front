# Auth Protected Pages Guide

> **Унифицированное решение для защиты страниц с автоматическим показом модального окна авторизации**  
> Полное руководство по использованию `useAuthProtectedPage` и `AuthErrorState` для защищенных страниц

## 📋 Содержание

1. [Обзор](#обзор)
2. [⚠️ КРИТИЧЕСКАЯ ИНФОРМАЦИЯ: Состояния сессии](#критическая-информация-состояния-сессии)
3. [Архитектура решения](#архитектура-решения)
4. [Компоненты системы](#компоненты-системы)
5. [Правильное использование](#правильное-использование)
6. [React Hooks: Критические правила](#react-hooks-критические-правила)
7. [Типичные ошибки и как их избежать](#типичные-ошибки-и-как-их-избежать)
8. [Примеры из проекта](#примеры-из-проекта)
9. [Интеграция с tRPC](#интеграция-с-trpc)
10. [Тестирование](#тестирование)
11. [Troubleshooting](#troubleshooting)

---

## ⚠️ КРИТИЧЕСКАЯ ИНФОРМАЦИЯ: Состояния сессии

> **ВАЖНО**: Неправильная проверка сессии приводит к появлению модалки входа для залогиненных пользователей!

### Три состояния сессии

```typescript
const { data: session } = trpc.auth.getSession.useQuery();

// Состояние 1: Загрузка (данные еще не получены)
session === undefined;

// Состояние 2: Загружено, пользователь НЕ залогинен
session !== undefined && !session?.user;

// Состояние 3: Загружено, пользователь залогинен
session !== undefined && session?.user;
```

### ❌ НЕПРАВИЛЬНО (модалка открывается во время загрузки)

```typescript
if (!session?.user) {
  return <AuthErrorState onLoginRequired={onAuthRequired} />;
}
// ❌ ПРОБЛЕМА: !session?.user === true когда session === undefined (загрузка)
// AuthErrorState рендерится → его useEffect вызывает onLoginRequired() → модалка открывается
```

### ✅ ПРАВИЛЬНО (модалка только для не залогиненных)

```typescript
// Вариант 1: Явная проверка
if (session !== undefined && !session?.user) {
  return <AuthErrorState onLoginRequired={onAuthRequired} />;
}

// Вариант 2: Раздельные проверки (более читаемо)
if (session === undefined) {
  return null; // или <LoadingSpinner />
}

if (!session.user) {
  return <AuthErrorState onLoginRequired={onAuthRequired} />;
}

return <ProtectedContent />;
```

### Почему это важно?

1. **`AuthErrorState` автоматически открывает модалку** через `useEffect`
2. **Когда `session === undefined`**, компонент `AuthErrorState` рендерится
3. **Его `useEffect` вызывает `onLoginRequired()`** → модалка открывается
4. **Даже если пользователь залогинен**, во время загрузки он увидит модалку

### Где применять эту проверку?

**Везде**, где используется паттерн:

```typescript
if (!session?.user) {
  return <AuthErrorState ... />;
}
```

**Файлы с правильной реализацией**:

- ✅ `apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx` (строка 143)
- ✅ `apps/web/src/components/orders/OrdersContainer.tsx` (строка 273)

---

## Обзор

### Проблема

При работе с защищенными страницами (orders, order details, admin panel) необходимо:

1. **Проверять авторизацию** перед загрузкой данных
2. **Показывать модальное окно входа** при UNAUTHORIZED ошибке
3. **Перенаправлять пользователя** если он закрыл модалку без авторизации
4. **Обрабатывать ошибки** в queries и mutations единообразно

### Решение

Унифицированная система из двух компонентов:

- **`useAuthProtectedPage`** - хук для auth logic (модалка + редирект)
- **`AuthErrorState`** - компонент для отображения ошибок

**Пакет**: `@repo/providers`  
**Местоположение**: `packages/providers/src/use-auth-protected-page.tsx`

---

## Архитектура решения

### Принципы дизайна

1. **Separation of Concerns**
   - Хук управляет логикой (модалка, редирект)
   - Компонент управляет отображением (UI ошибок)

2. **Callback Pattern**
   - Хук НЕ делает редирект сам
   - Родительский компонент передает `onRedirect` callback
   - Это избегает зависимости от `next/navigation` в `packages/*`

3. **Предотвращение замыканий**
   - `AuthErrorState` - **отдельный компонент**, НЕ внутри хука
   - Получает `onLoginRequired` как **prop**, НЕ через closure
   - Это предотвращает проблемы с устаревшими значениями

### Схема работы

```
┌─────────────────────────────────────────────────────────────────┐
│                    Protected Page Component                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. useAuthProtectedPage({ onRedirect, session })               │
│     ↓                                                            │
│     • Отслеживает состояние auth модалки                         │
│     • Возвращает onAuthRequired callback                         │
│                                                                 │
│  2. tRPC Query/Mutation с enabled: !!session?.user              │
│     ↓                                                            │
│     • Запрос НЕ отправляется если нет сессии                     │
│     • Возвращает error при UNAUTHORIZED                          │
│                                                                 │
│  3. if (!session?.user) return <AuthErrorState />               │
│     ↓                                                            │
│     • Компонент автоматически открывает модалку                  │
│     • При закрытии модалки без auth → редирект                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Компоненты системы

### 1. `useAuthProtectedPage` Hook

**Файл**: `packages/providers/src/use-auth-protected-page.tsx`

#### Интерфейс

```typescript
interface UseAuthProtectedPageParams {
  /** Callback для редиректа при закрытии модалки без авторизации */
  onRedirect: () => void;
  /** Текущая сессия пользователя */
  session?: { user?: unknown } | null;
}

interface UseAuthProtectedPageReturn {
  /** Callback для вызова при UNAUTHORIZED в mutations */
  onAuthRequired: () => void;
}
```

#### Что делает

1. **Отслеживает модалку** - следит за открытием/закрытием auth модалки
2. **Выполняет редирект** - если пользователь закрыл модалку без авторизации
3. **Предоставляет callback** - `onAuthRequired` для вызова при UNAUTHORIZED

#### Внутренняя логика

```typescript
function useAuthModalTracking(authModal, session, onRedirect) {
  const wasModalOpenRef = React.useRef(false);

  // Отслеживаем открытие модалки
  React.useEffect(() => {
    if (authModal.isLoginOpen || authModal.isRegisterOpen || authModal.isForgotPasswordOpen) {
      wasModalOpenRef.current = true;
    }
  }, [authModal.isLoginOpen, authModal.isRegisterOpen, authModal.isForgotPasswordOpen]);

  // Редирект если закрыли модалку без авторизации
  React.useEffect(() => {
    const allModalsClosed =
      !authModal.isLoginOpen && !authModal.isRegisterOpen && !authModal.isForgotPasswordOpen;

    if (wasModalOpenRef.current && allModalsClosed && !session?.user) {
      authModal.closeAll();
      onRedirect();
    }

    if (wasModalOpenRef.current && allModalsClosed) {
      wasModalOpenRef.current = false;
    }
  }, [authModal, session, onRedirect]);
}
```

### 2. `AuthErrorState` Component

**Файл**: `packages/providers/src/use-auth-protected-page.tsx`

#### Интерфейс

```typescript
interface AuthErrorStateProps {
  /** Ошибка запроса */
  error: Error & { data?: { code?: string } };
  /** Переводы для сообщений */
  translations: {
    fetchFailed: string;
    unauthorizedMessage: string;
  };
  /** Callback для открытия модалки */
  onLoginRequired: () => void;
}
```

#### Что делает

1. **Проверяет тип ошибки** - UNAUTHORIZED или общая ошибка
2. **Автоматически открывает модалку** - при UNAUTHORIZED через `useEffect`
3. **Отображает сообщение** - с правильным текстом в зависимости от типа ошибки

#### Код

```typescript
export function AuthErrorState({
  error,
  translations,
  onLoginRequired
}: AuthErrorStateProps & { onLoginRequired: () => void }) {
  // Автоматически открываем модалку при UNAUTHORIZED
  React.useEffect(() => {
    if (isUnauthorizedError(error)) {
      onLoginRequired();
    }
  }, [error, onLoginRequired]);

  const errorMessage = isUnauthorizedError(error)
    ? translations.unauthorizedMessage
    : error.message;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-destructive text-lg">{translations.fetchFailed}</p>
      <p className="text-sm text-muted-foreground">{errorMessage}</p>
    </div>
  );
}
```

---

## Правильное использование

### Базовый пример

```typescript
'use client';

import { useAuthProtectedPage, AuthErrorState } from '@repo/providers';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc-provider';

export function MyProtectedPage() {
  const router = useRouter();
  const t = useTranslations('MyPage');
  const tErrors = useTranslations('server.errors');

  // 1. ✅ Получаем сессию
  const { data: session } = trpc.auth.getSession.useQuery();

  // 2. ✅ Настраиваем auth protection
  const { onAuthRequired } = useAuthProtectedPage({
    onRedirect: () => router.push('/'),
    session,
  });

  // 3. ✅ Query с enabled опцией
  const { data, error } = trpc.myData.useQuery(undefined, {
    enabled: !!session?.user, // Запрос только если авторизован
  });

  // 4. ✅ Проверка авторизации ПОСЛЕ всех хуков
  // ⚠️ КРИТИЧЕСКИ ВАЖНО: проверяем session !== undefined чтобы отличить "загружается" от "не залогинен"
  // session === undefined → ничего не рендерим (загрузка)
  // session !== undefined && !session?.user → показываем AuthErrorState (не залогинен)
  if (session !== undefined && !session?.user) {
    return (
      <AuthErrorState
        error={{
          message: tErrors('auth.required'),
          data: { code: 'UNAUTHORIZED' }
        } as Error & { data?: { code?: string } }}
        translations={{
          fetchFailed: t('errors.fetchFailed'),
          unauthorizedMessage: tErrors('auth.required'),
        }}
        onLoginRequired={onAuthRequired}
      />
    );
  }

  // 5. ✅ Обработка ошибок запроса
  if (error) {
    return (
      <AuthErrorState
        error={error as Error & { data?: { code?: string } }}
        translations={{
          fetchFailed: t('errors.fetchFailed'),
          unauthorizedMessage: tErrors('auth.required'),
        }}
        onLoginRequired={onAuthRequired}
      />
    );
  }

  // 6. ✅ Рендер защищенного контента
  return <div>{data}</div>;
}
```

### С Mutations

```typescript
function useMyMutations(onAuthRequired: () => void) {
  const utils = trpc.useUtils();
  const notifications = useNotifications();
  const t = useTranslations('MyPage');

  const myMutation = trpc.myMutation.useMutation({
    onSuccess: () => {
      notifications.success(t('success'));
      utils.myData.invalidate();
    },
    onError: (err: unknown) => {
      // ✅ Проверяем UNAUTHORIZED
      if (isUnauthorizedError(err)) {
        onAuthRequired();
        return;
      }
      notifications.handleApiError(err, t('error'));
    },
  });

  return { handleAction: () => myMutation.mutate() };
}

export function MyProtectedPage() {
  // ... setup code ...

  // ✅ КРИТИЧНО: Mutations вызываются ДО условного return
  const { handleAction } = useMyMutations(onAuthRequired);

  // ✅ КРИТИЧНО: Проверяем session !== undefined чтобы отличить "загружается" от "не залогинен"
  if (session !== undefined && !session?.user) {
    return <AuthErrorState ... />;
  }

  return <button onClick={handleAction}>Action</button>;
}
```

---

## React Hooks: Критические правила

### Правило #1: Хуки ВСЕГДА вызываются в одном порядке

**React требует**, чтобы хуки вызывались:

- ✅ В **одинаковом порядке** при каждом рендере
- ✅ На **верхнем уровне** компонента
- ❌ **НЕ** внутри условий, циклов, вложенных функций

**Документация**: [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

### ❌ НЕПРАВИЛЬНО: Условный вызов хука

```typescript
export function MyPage() {
  const { data: session } = trpc.auth.getSession.useQuery();

  // ❌ ОШИБКА: Ранний return ДО вызова других хуков
  if (!session?.user) {
    return <AuthErrorState />;
  }

  // ❌ Этот хук вызывается УСЛОВНО (только если есть session)
  const { data } = trpc.myData.useQuery();

  // React Error: "Rendered more hooks than during the previous render"
}
```

**Проблема**: При первом рендере (без session) вызывается 1 хук, при втором (с session) - 2 хука. React видит разное количество хуков и выдает ошибку.

### ✅ ПРАВИЛЬНО: Все хуки ДО условного return

```typescript
export function MyPage() {
  // 1. ✅ Все хуки вызываются ВСЕГДА
  const { data: session } = trpc.auth.getSession.useQuery();
  const { onAuthRequired } = useAuthProtectedPage({ ... });
  const { data } = trpc.myData.useQuery(undefined, {
    enabled: !!session?.user, // Контролируем ЗАПРОС, не вызов хука
  });

  // 2. ✅ Условный return ПОСЛЕ всех хуков
  // ⚠️ КРИТИЧНО: проверяем session !== undefined чтобы отличить "загружается" от "не залогинен"
  if (session !== undefined && !session?.user) {
    return <AuthErrorState />;
  }

  return <div>{data}</div>;
}
```

**Решение**: Используем опцию `enabled` для контроля **запроса**, а не вызова хука.

### Правило #2: useCallback должен быть до условного return

```typescript
// ❌ НЕПРАВИЛЬНО
export function MyPage() {
  const { data: session } = trpc.auth.getSession.useQuery();

  if (!session?.user) {
    return <AuthErrorState />;
  }

  // ❌ useCallback после условного return
  const callback = React.useCallback(() => {}, []);
}

// ✅ ПРАВИЛЬНО
export function MyPage() {
  const { data: session } = trpc.auth.getSession.useQuery();

  // ✅ useCallback ДО условного return
  const callback = React.useCallback(() => {}, []);

  if (!session?.user) {
    return <AuthErrorState />;
  }
}
```

### Правило #3: Custom hooks тоже должны вызываться всегда

```typescript
// ❌ НЕПРАВИЛЬНО
export function MyPage() {
  const { data: session } = trpc.auth.getSession.useQuery();

  if (!session?.user) {
    return <AuthErrorState />;
  }

  // ❌ Custom hook после условного return
  const { handleAction } = useMyMutations(onAuthRequired);
}

// ✅ ПРАВИЛЬНО
export function MyPage() {
  const { data: session } = trpc.auth.getSession.useQuery();
  const { onAuthRequired } = useAuthProtectedPage({ ... });

  // ✅ Custom hook ДО условного return
  const { handleAction } = useMyMutations(onAuthRequired);

  if (!session?.user) {
    return <AuthErrorState />;
  }
}
```

---

## Типичные ошибки и как их избежать

### ⚠️ КРИТИЧЕСКАЯ ОШИБКА #0: Модалка появляется для залогиненных пользователей

**Симптом**: Залогиненный пользователь открывает защищенную страницу (orders, order details) и видит модалку входа, хотя он уже авторизован

**Причина**: Неправильная проверка состояния сессии - `if (!session?.user)` возвращает `true` когда:

1. `session === undefined` (данные загружаются) ← **ПРОБЛЕМА!**
2. `session !== undefined && !session?.user` (пользователь не залогинен) ← ОК

Когда `session === undefined` (loading state), компонент `AuthErrorState` рендерится и его `useEffect` автоматически вызывает `onLoginRequired()`, что открывает модалку.

**Правильные состояния сессии**:

- `session === undefined` → данные загружаются, сессия еще не получена
- `session !== undefined && session.user === null` → данные загружены, пользователь НЕ залогинен
- `session !== undefined && session.user === {...}` → данные загружены, пользователь залогинен

**Решение**: Различать "загрузка" от "не залогинен" через проверку `session !== undefined`

```typescript
// ❌ НЕПРАВИЛЬНО (модалка открывается во время загрузки)
export function MyProtectedPage() {
  const { data: session } = trpc.auth.getSession.useQuery();
  const { onAuthRequired } = useAuthProtectedPage({ ... });

  // ❌ ОШИБКА: !session?.user === true когда session === undefined
  if (!session?.user) {
    return (
      <AuthErrorState
        error={{ data: { code: 'UNAUTHORIZED' } }}
        onLoginRequired={onAuthRequired} // ← Вызовется во время загрузки!
      />
    );
  }

  return <div>Protected content</div>;
}

// ✅ ПРАВИЛЬНО (модалка открывается только для не залогиненных)
export function MyProtectedPage() {
  const { data: session } = trpc.auth.getSession.useQuery();
  const { onAuthRequired } = useAuthProtectedPage({ ... });

  // ✅ Проверяем что session !== undefined (данные загружены)
  // И только потом проверяем !session?.user (пользователь отсутствует)
  if (session !== undefined && !session?.user) {
    return (
      <AuthErrorState
        error={{ data: { code: 'UNAUTHORIZED' } }}
        onLoginRequired={onAuthRequired}
      />
    );
  }

  // Опционально: можно показать loading state
  if (session === undefined) {
    return <div>Loading...</div>;
  }

  return <div>Protected content</div>;
}
```

**Альтернатива (более явная)**:

```typescript
// ✅ Явная проверка всех состояний
if (session === undefined) {
  // Загрузка - ничего не рендерим или показываем loader
  return null; // или <LoadingSpinner />
}

if (!session.user) {
  // Данные загружены, но пользователь не залогинен - показываем AuthErrorState
  return <AuthErrorState ... />;
}

// Пользователь залогинен - показываем контент
return <div>Protected content</div>;
```

**Реальные примеры из кода**:

- ✅ `apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx` (строка 143)
- ✅ `apps/web/src/components/orders/OrdersContainer.tsx` (строка 273)

**Важно**: Эта проверка должна быть на ВСЕХ защищенных страницах, где используется паттерн `if (!session?.user) return <AuthErrorState />`.

---

### Ошибка #1: "Rendered more hooks than during the previous render"

**Симптом**: React ошибка при изменении состояния авторизации

**Причина**: Условный вызов хуков (хук после `if` с `return`)

**Решение**: Перенести все хуки ДО условного return, использовать `enabled` опцию

```typescript
// ❌ ДО (НЕПРАВИЛЬНО)
if (!session?.user) return <AuthErrorState />;
const { data } = useQuery(); // ← Условный вызов

// ✅ ПОСЛЕ (ПРАВИЛЬНО)
const { data } = useQuery({ enabled: !!session?.user }); // ← Всегда вызывается
if (session !== undefined && !session?.user) return <AuthErrorState />; // ← После хуков, правильная проверка
```

### Ошибка #2: Модалка открывается дважды

**Симптом**: При UNAUTHORIZED модалка появляется 2 раза

**Причина**: `AuthErrorState` создан внутри `useAuthProtectedPage` через `useCallback`, что создает замыкание на устаревший `authModal` объект

**Решение**: `AuthErrorState` - **отдельный компонент**, получает `onLoginRequired` как **prop**

```typescript
// ❌ НЕПРАВИЛЬНО (создает замыкание)
export function useAuthProtectedPage() {
  const authModal = useAuthModal();

  const AuthErrorState = React.useCallback(
    ({ error }) => {
      React.useEffect(() => {
        authModal.openLogin(); // ← Замыкание на старый authModal
      }, [error]);
    },
    [authModal]
  );

  return { AuthErrorState };
}

// ✅ ПРАВИЛЬНО (отдельный компонент)
export function AuthErrorState({ error, onLoginRequired }) {
  React.useEffect(() => {
    if (isUnauthorized(error)) {
      onLoginRequired(); // ← Всегда актуальная функция
    }
  }, [error, onLoginRequired]);
}
```

### Ошибка #3: Page hanging на "Loading..."

**Симптом**: Страница зависает с индикатором загрузки, данные не приходят

**Причина**: Query отправляется БЕЗ проверки авторизации, server возвращает UNAUTHORIZED, но UI не показывает ошибку

**Решение**: Использовать `enabled: !!session?.user` для предотвращения запроса

```typescript
// ❌ НЕПРАВИЛЬНО (запрос всегда идет)
const { data } = trpc.myData.useQuery();

// ✅ ПРАВИЛЬНО (запрос только если авторизован)
const { data } = trpc.myData.useQuery(undefined, {
  enabled: !!session?.user,
});
```

### Ошибка #4: Неправильный ключ локализации

**Симптом**: Error: `MISSING_MESSAGE: Could not resolve server.errors.server.errors.auth.required`

**Причина**: Двойной префикс при использовании `useTranslations('server.errors')` + константа с полным путем

**Решение**: Использовать короткую константу БЕЗ префикса

```typescript
// ❌ НЕПРАВИЛЬНО (двойной префикс)
const UNAUTHORIZED_ERROR_KEY = 'server.errors.auth.required';
const tErrors = useTranslations('server.errors');
tErrors(UNAUTHORIZED_ERROR_KEY); // → server.errors.server.errors.auth.required

// ✅ ПРАВИЛЬНО (короткая константа)
const UNAUTHORIZED_ERROR_KEY = 'auth.required';
const tErrors = useTranslations('server.errors');
tErrors(UNAUTHORIZED_ERROR_KEY); // → server.errors.auth.required
```

### Ошибка #5: Редирект не работает после закрытия модалки

**Симптом**: Пользователь закрывает модалку, но остается на защищенной странице

**Причина**: Не передан `onRedirect` callback или передан неправильный роутер

**Решение**: Использовать правильный роутер и callback

```typescript
// ❌ НЕПРАВИЛЬНО (нет редиректа)
const { onAuthRequired } = useAuthProtectedPage({
  onRedirect: () => {}, // Пустой callback
  session,
});

// ✅ ПРАВИЛЬНО (корректный редирект)
import { useRouter } from '@/src/i18n/navigation'; // Для i18n routing

const router = useRouter();
const { onAuthRequired } = useAuthProtectedPage({
  onRedirect: () => router.push('/'),
  session,
});
```

---

## Примеры из проекта

### Пример 1: Order Detail Page

**Файл**: `apps/web/app/[locale]/order/[orderId]/OrderPageClient.tsx`

**Особенности**:

- Использует `useOrderStatus` хук вместо прямого query
- Передает хук в `OrderStatus` компонент
- Обрабатывает mutations (cancel, markAsPaid)

```typescript
export function OrderPageClient({ orderId }: OrderPageClientProps) {
  const router = useRouter();
  const t = useTranslations('OrdersPage');
  const tErrors = useTranslations('server.errors');

  // 1. ✅ Session check
  const { data: session } = trpc.auth.getSession.useQuery();
  const { onAuthRequired } = useAuthProtectedPage({
    onRedirect: () => router.push('/'),
    session,
  });

  // 2. ✅ Mutations ДО условного return
  const { handleMarkAsPaid, handleCancelOrder } = useOrderMutations(orderId, onAuthRequired);

  // 3. ✅ Hook wrapper ДО условного return
  const orderStatusHook = React.useCallback(
    (id: string, options?) => {
      const result = useOrderStatus(id, {
        ...options,
        enabled: !!session?.user, // ← Запрос только если авторизован
      });

      if (result.error && isUnauthorizedError(result.error)) {
        onAuthRequired();
      }

      return {
        data: result.data as Order | undefined,
        isLoading: result.isLoading,
        error: result.error as Error | null,
      };
    },
    [session?.user, onAuthRequired]
  );

  // 4. ✅ Условный return ПОСЛЕ всех хуков
  // ⚠️ КРИТИЧНО: проверяем session !== undefined чтобы отличить "загружается" от "не залогинен"
  if (session !== undefined && !session?.user) {
    return (
      <AuthErrorState
        error={{
          message: tErrors('auth.required'),
          data: { code: 'UNAUTHORIZED' }
        }}
        translations={{
          fetchFailed: t('errors.fetchFailed'),
          unauthorizedMessage: tErrors('auth.required'),
        }}
        onLoginRequired={onAuthRequired}
      />
    );
  }

  return (
    <OrderStatus
      orderId={orderId}
      useOrderStatusHook={orderStatusHook}
      onMarkAsPaid={handleMarkAsPaid}
      onCancelOrder={handleCancelOrder}
    />
  );
}
```

### Пример 2: Orders List Page

**Файл**: `apps/web/src/components/orders/OrdersContainer.tsx`

**Особенности**:

- Использует tRPC query напрямую
- Фильтрация и пагинация
- Обработка состояний loading/empty/error

```typescript
export function OrdersContainer(props: OrdersContainerProps) {
  const t = useTranslations('OrdersPage');
  const tErrors = useTranslations('server.errors');
  const router = useRouter();

  // 1. ✅ Auth protection
  const { data: session } = trpc.auth.getSession.useQuery();
  const { onAuthRequired } = useAuthProtectedPage({
    onRedirect: () => router.push('/'),
    session,
  });

  // 2. ✅ State management
  const { currentPage, setCurrentPage, searchTerm, setSearchTerm, statusFilter, setStatusFilter, sortBy, setSortBy } = useOrdersState(props);

  const { handleSearch, handlePageChange } = useOrdersHandlers(setSearchTerm, setCurrentPage);

  // 3. ✅ Query с enabled опцией
  const { data, isLoading, error } = trpc.shared.orders.getAll.useQuery({
    filters: {
      status: statusFilter,
      searchQuery: searchTerm || undefined,
    },
    sortBy,
    pagination: { limit: ORDERS_PER_PAGE, offset: (currentPage - 1) * ORDERS_PER_PAGE },
  }, {
    enabled: !!session?.user, // ← Запрос только если авторизован
  });

  // 4. ✅ Проверка авторизации ПОСЛЕ всех хуков
  // ⚠️ КРИТИЧНО: проверяем session !== undefined чтобы отличить "загружается" от "не залогинен"
  if (session !== undefined && !session?.user) {
    return (
      <AuthErrorState
        error={{
          message: tErrors('auth.required'),
          data: { code: 'UNAUTHORIZED' }
        }}
        translations={{
          fetchFailed: t('errors.fetchFailed'),
          unauthorizedMessage: tErrors('auth.required'),
        }}
        onLoginRequired={onAuthRequired}
      />
    );
  }

  // 5. ✅ Обработка ошибок
  if (error) {
    return (
      <AuthErrorState
        error={error as Error & { data?: { code?: string } }}
        translations={{
          fetchFailed: t('errors.fetchFailed'),
          unauthorizedMessage: tErrors('auth.required'),
        }}
        onLoginRequired={onAuthRequired}
      />
    );
  }

  // 6. ✅ Обработка состояний
  if (isLoading) {
    return <div>Loading...</div>;
  }

  const orders = data?.items || [];

  if (orders.length === 0) {
    return <EmptyState searchTerm={searchTerm} t={t} />;
  }

  return (
    <DataTable>
      <OrdersFilters ... />
      <OrdersTable orders={orders} columns={columns} />
      <DataTable.Pagination
        currentPage={currentPage}
        totalItems={data.total}
        pageSize={ORDERS_PER_PAGE}
        onPageChange={handlePageChange}
      />
    </DataTable>
  );
}
```

---

## Интеграция с tRPC

### Server-side: Protected Procedure

**Файл**: `apps/web/src/server/trpc/middleware/auth.ts`

```typescript
import { TRPCError } from '@trpc/server';

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.sessionId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  const session = await sessionRepository.findById(ctx.sessionId);

  if (!session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid session',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: session.user,
    },
  });
});
```

### Client-side: Query с enabled опцией

```typescript
// ✅ ПРАВИЛЬНО: Query с enabled
const { data, error } = trpc.protected.query.useQuery(undefined, {
  enabled: !!session?.user,
});

// ❌ НЕПРАВИЛЬНО: Query без enabled
const { data, error } = trpc.protected.query.useQuery();
// → Запрос идет даже без авторизации → UNAUTHORIZED → зависание
```

### Обработка ошибок в Mutations

```typescript
function useMutations(onAuthRequired: () => void) {
  const mutation = trpc.protected.mutation.useMutation({
    onSuccess: () => {
      // Success logic
    },
    onError: (err: unknown) => {
      // ✅ Проверяем UNAUTHORIZED
      if (
        typeof err === 'object' &&
        err !== null &&
        'data' in err &&
        (err as { data?: { code?: string } }).data?.code === 'UNAUTHORIZED'
      ) {
        onAuthRequired();
        return;
      }

      // Обработка других ошибок
      handleError(err);
    },
  });

  return mutation;
}
```

---

## Тестирование

### Unit Tests: Hook логики

**Файл**: `packages/providers/src/__tests__/use-auth-protected-page.test.tsx`

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthProtectedPage } from '../use-auth-protected-page';

describe('useAuthProtectedPage', () => {
  it('should call onRedirect when modal closed without auth', () => {
    const onRedirect = jest.fn();
    const session = { user: null };

    const { result } = renderHook(() => useAuthProtectedPage({ onRedirect, session }));

    // Открываем модалку
    act(() => {
      result.current.onAuthRequired();
    });

    // Закрываем модалку
    act(() => {
      // Simulate modal close
    });

    expect(onRedirect).toHaveBeenCalled();
  });

  it('should not redirect when user authenticated', () => {
    const onRedirect = jest.fn();
    const session = { user: { id: '123' } };

    renderHook(() => useAuthProtectedPage({ onRedirect, session }));

    expect(onRedirect).not.toHaveBeenCalled();
  });
});
```

### E2E Tests: Full flow

**Файл**: `tests/e2e/auth-protection.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('Protected page shows auth modal for unauthorized user', async ({ page }) => {
  // 1. Переходим на защищенную страницу
  await page.goto('/orders');

  // 2. Проверяем что модалка открылась
  await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();

  // 3. Проверяем сообщение об ошибке
  await expect(page.locator('text=Authentication required')).toBeVisible();
});

test('Protected page redirects when modal closed without auth', async ({ page }) => {
  await page.goto('/orders');

  // Закрываем модалку
  await page.locator('[data-testid="close-modal"]').click();

  // Проверяем редирект на главную
  await expect(page).toHaveURL('/');
});

test('Protected page shows data for authorized user', async ({ page }) => {
  // 1. Авторизуемся
  await page.goto('/');
  await page.locator('[data-testid="login-button"]').click();
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('[type="submit"]');

  // 2. Переходим на защищенную страницу
  await page.goto('/orders');

  // 3. Проверяем что данные загрузились
  await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
  await expect(page.locator('text=Loading...')).not.toBeVisible();
});
```

---

## Troubleshooting

### Проблема: Бесконечный цикл редиректов

**Симптомы**:

- Страница постоянно перезагружается
- Network tab показывает множество запросов к `/`

**Причины**:

1. `onRedirect` не обернут в `useCallback`
2. Зависимости `useEffect` меняются при каждом рендере

**Решение**:

```typescript
// ❌ НЕПРАВИЛЬНО
const { onAuthRequired } = useAuthProtectedPage({
  onRedirect: () => router.push('/'), // Новая функция каждый рендер
  session,
});

// ✅ ПРАВИЛЬНО
const router = useRouter();
const onRedirect = React.useCallback(() => {
  router.push('/');
}, [router]);

const { onAuthRequired } = useAuthProtectedPage({
  onRedirect,
  session,
});
```

### Проблема: Модалка не закрывается после успешной авторизации

**Симптомы**:

- Пользователь авторизовался, но модалка осталась открытой
- Требуется ручное закрытие

**Причины**:

1. Session не обновляется после авторизации
2. Query не инвалидируется

**Решение**:

```typescript
// В auth mutation
const loginMutation = trpc.auth.login.useMutation({
  onSuccess: () => {
    // ✅ Инвалидируем session query
    utils.auth.getSession.invalidate();

    // ✅ Закрываем модалку
    authModal.closeAll();
  },
});
```

### Проблема: Cookie не сохраняется после авторизации

**Симптомы**:

- После авторизации и перезагрузки страницы - снова просит войти
- DevTools показывает что cookie есть, но session query возвращает null

**Причины**:

1. Cookie domain не совпадает с текущим доменом
2. SameSite настройки блокируют cookie
3. Cookie не устанавливается на server-side

**Решение**:

```typescript
// Server-side: apps/web/src/utils/session-cookie.ts
export class SessionCookieUtils {
  static setSessionCookie(res: NextResponse, sessionId: string) {
    res.headers.set(
      'Set-Cookie',
      `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
    );
  }
}
```

### Проблема: TypeScript ошибка "Type instantiation is excessively deep"

**Симптомы**:

- TypeScript compile error
- Ошибка связана с типами tRPC query/mutation

**Причины**:

- Сложная цепочка типов в tRPC
- TypeScript не может вывести тип из-за глубокой вложенности

**Решение**:

```typescript
// ❌ НЕПРАВИЛЬНО (TypeScript не может вывести тип)
const { data } = trpc.complex.deeply.nested.query.useQuery();

// ✅ ПРАВИЛЬНО (явное указание типа)
const { data } = trpc.complex.deeply.nested.query.useQuery() as {
  data: MyDataType | undefined;
};

// Или использовать type assertion
const result = trpc.complex.deeply.nested.query.useQuery();
const data = result.data as MyDataType | undefined;
```

---

## Checklist для новой защищенной страницы

### Перед началом

- [ ] Импортировать `useAuthProtectedPage` и `AuthErrorState` из `@repo/providers`
- [ ] Импортировать `useRouter` из правильного места (`@/src/i18n/navigation` для i18n routing)
- [ ] Импортировать `useTranslations` для сообщений об ошибках

### Setup компонента

- [ ] Вызвать `trpc.auth.getSession.useQuery()` для получения session
- [ ] Настроить `useAuthProtectedPage` с `onRedirect` callback
- [ ] Все queries/mutations с `enabled: !!session?.user` опцией
- [ ] Все хуки (включая `useCallback`) вызываются ДО условного return

### Error Handling

- [ ] Условный return для `!session?.user` с `<AuthErrorState />`
- [ ] Условный return для query `error` с `<AuthErrorState />`
- [ ] Mutations обрабатывают UNAUTHORIZED через `onAuthRequired()`
- [ ] Правильные ключи локализации (БЕЗ двойного префикса)

### Testing

- [ ] Unit тесты для hook логики
- [ ] E2E тесты для auth flow
- [ ] Проверить работу в браузере:
  - Неавторизованный доступ → модалка
  - Успешная авторизация → данные
  - Закрытие модалки → редирект
  - Обновление страницы → session сохраняется

### Code Review

- [ ] Все хуки вызываются безусловно
- [ ] `enabled` опция используется для контроля запросов
- [ ] `AuthErrorState` получает `onLoginRequired` как prop
- [ ] Нет дублирования кода между страницами
- [ ] Следование паттернам из существующих примеров

---

## Связанные документы

- **[SESSION_ARCHITECTURE.md](SESSION_ARCHITECTURE.md)** - архитектура session management
- **[ROLES_ARCHITECTURE.md](ROLES_ARCHITECTURE.md)** - система ролей и доступа
- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - общее руководство для разработчиков
- **[CODE_STYLE_GUIDE.md](CODE_STYLE_GUIDE.md)** - стандарты кода

## Changelog

### 2025-01-18

- ✅ Создан унифицированный гайд по auth protection
- ✅ Добавлены примеры из реальных страниц проекта
- ✅ Документированы все типичные ошибки и их решения
- ✅ Добавлены правила React Hooks с объяснениями
- ✅ Включены чеклисты для разработчиков
