# 🔍 Отчет о рисках: AuthModalContext Implementation

**Дата:** 2025-10-07  
**Компонент:** `packages/providers/src/auth-modal-provider.tsx`  
**Affected Files:** `apps/web/src/components/app-header.tsx`, `apps/web/src/components/auth-dialogs.tsx`

---

## 📋 Executive Summary

В рамках исправления бага "server.errors.auth.required" была реализована глобальная система управления модалками авторизации через `AuthModalContext`. Архитектурное решение корректное, но реализация содержит **4 риска** разной степени критичности, связанных с использованием единого метода `closeAll()` вместо индивидуальных методов закрытия модалок.

**Статус:** Код работает благодаря React setState batching, но хрупок к будущим изменениям.

---

## ⚠️ КРИТИЧЕСКИЙ РИСК #1: Race Condition при переключении модалок

### 🔴 **SEVERITY: HIGH** | **Вероятность: MEDIUM** | **Влияние: HIGH**

### Описание проблемы

В компоненте `auth-dialogs.tsx` реализована логика переключения между модалками:

**Файл:** `apps/web/src/components/auth-dialogs.tsx` (lines 36-46)

```tsx
// Handler для переключения с login на forgot password
const handleSwitchToForgotPassword = React.useCallback(() => {
  onLoginClose(); // Step 1: закрыть login
  onOpenForgotPassword(); // Step 2: открыть forgot password
}, [onLoginClose, onOpenForgotPassword]);

// Handler для возврата с forgot password на login
const handleBackToLogin = React.useCallback(() => {
  onForgotPasswordClose(); // Step 1: закрыть forgot password
  onOpenLogin(); // Step 2: открыть login
}, [onForgotPasswordClose, onOpenLogin]);
```

**Ожидаемое поведение:** `onLoginClose()` закрывает ТОЛЬКО login модалку, затем `onOpenForgotPassword()` открывает forgot password модалку.

### Фактическая реализация

**Файл:** `apps/web/src/components/app-header.tsx` (lines 175-183)

```tsx
<AuthDialogs
  isLoginOpen={isLoginOpen}
  isRegisterOpen={isRegisterOpen}
  isForgotPasswordOpen={isForgotPasswordOpen}
  onLoginClose={closeAll} // ❌ Передается closeAll вместо closeLogin
  onRegisterClose={closeAll} // ❌ Передается closeAll вместо closeRegister
  onForgotPasswordClose={closeAll} // ❌ Передается closeAll вместо closeForgotPassword
  onAuthSuccess={handleAuthSuccess}
  onOpenForgotPassword={openForgotPassword}
  onOpenLogin={openLogin}
/>
```

**Файл:** `packages/providers/src/auth-modal-provider.tsx` (lines 67-71)

```tsx
const closeAll = React.useCallback(() => {
  setIsLoginOpen(false);
  setIsRegisterOpen(false);
  setIsForgotPasswordOpen(false); // ❌ Закрывает целевую модалку ДО её открытия
}, []);
```

### Execution Flow Analysis

Когда пользователь кликает "Forgot Password?" в login модалке:

```tsx
// Step 1: handleSwitchToForgotPassword() calls onLoginClose()
onLoginClose() → closeAll() → {
  setIsLoginOpen(false);
  setIsRegisterOpen(false);
  setIsForgotPasswordOpen(false);  // ⚠️ Устанавливает target в false!
}

// Step 2: onOpenForgotPassword() calls
onOpenForgotPassword() → {
  setIsLoginOpen(false);
  setIsRegisterOpen(false);
  setIsForgotPasswordOpen(true);   // ✅ Перезаписывает на true
}
```

### Почему это работает СЕЙЧАС

React 18+ automatic batching объединяет все синхронные `setState` вызовы:

```tsx
// Внутри React batch:
setIsLoginOpen(false);           // Batch 1
setIsRegisterOpen(false);        // Batch 1
setIsForgotPasswordOpen(false);  // Batch 1
setIsLoginOpen(false);           // Batch 1 (duplicate, игнорируется)
setIsRegisterOpen(false);        // Batch 1 (duplicate, игнорируется)
setIsForgotPasswordOpen(true);   // Batch 1 - ПОСЛЕДНЕЕ значение побеждает

// Итоговый state после batch:
{
  isLoginOpen: false,
  isRegisterOpen: false,
  isForgotPasswordOpen: true  // ✅ Корректно
}
```

### Почему это СЛОМАЕТСЯ в будущем

#### Сценарий A: Async операция между вызовами

```tsx
const handleSwitchToForgotPassword = async () => {
  onLoginClose(); // Batch 1: closeAll() - sets all to false
  await analytics.track('switched_to_forgot'); // ⚠️ Батч завершается
  onOpenForgotPassword(); // Batch 2: но модалка уже закрыта в DOM!
};
```

**Результат:** Модалка flickering (появится → исчезнет) или не откроется вообще.

#### Сценарий B: Middleware в контексте

```tsx
// Если в будущем добавится middleware:
const closeAll = () => {
  logModalClose('all'); // Middleware call
  setIsLoginOpen(false);
  setIsRegisterOpen(false);
  setIsForgotPasswordOpen(false);
};
```

**Результат:** Batching может быть нарушен, race condition проявится.

#### Сценарий C: React Concurrent Features

При использовании `useTransition`, `useDeferredValue` или Suspense батчинг может работать по-другому:

```tsx
const [isPending, startTransition] = useTransition();

startTransition(() => {
  onLoginClose(); // Low priority
  onOpenForgotPassword(); // Low priority
});
```

**Результат:** Непредсказуемое поведение из-за приоритизации updates.

### Воспроизведение

**Test Case:**

1. Открыть `/` в браузере
2. Нажать Login button
3. В login модалке нажать "Forgot Password?" link
4. **Ожидаемо:** Login закрывается, Forgot Password открывается
5. **Фактически:** Работает из-за batching, но хрупко

**Сломается при:**

- Добавлении async tracking/analytics
- Middleware в setState
- React Concurrent Mode edge cases

### Рекомендация

**Добавить индивидуальные методы закрытия:**

```tsx
// packages/providers/src/auth-modal-provider.tsx
const closeLogin = React.useCallback(() => {
  setIsLoginOpen(false);
}, []);

const closeRegister = React.useCallback(() => {
  setIsRegisterOpen(false);
}, []);

const closeForgotPassword = React.useCallback(() => {
  setIsForgotPasswordOpen(false);
}, []);
```

**Обновить app-header.tsx:**

```tsx
<AuthDialogs
  onLoginClose={closeLogin} // ✅ Закрывает только login
  onRegisterClose={closeRegister} // ✅ Закрывает только register
  onForgotPasswordClose={closeForgotPassword} // ✅ Закрывает только forgot
/>
```

**Почему это решает проблему:**

1. Каждый callback управляет ТОЛЬКО своей модалкой
2. Нет race condition - `closeLogin()` не трогает `isForgotPasswordOpen`
3. Соответствует семантике интерфейса `AuthDialogsProps`
4. Устойчиво к async операциям и middleware

---

## ⚠️ КРИТИЧЕСКИЙ РИСК #2: X button закрывает ВСЕ модалки

### 🟡 **SEVERITY: MEDIUM** | **Вероятность: HIGH** | **Влияние: MEDIUM**

### Описание проблемы

Каждая модалка использует Dialog component с `onOpenChange` callback для обработки клика на X button:

**Файл:** `apps/web/src/components/auth-dialogs.tsx` (lines 50-60)

```tsx
{
  /* Модальное окно входа */
}
<Dialog open={isLoginOpen} onOpenChange={open => !open && onLoginClose()}>
  <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
    <DialogHeader>
      <DialogTitle>{t('signIn')}</DialogTitle>
    </DialogHeader>
    <AuthForms
      defaultMode="login"
      onAuthSuccess={onAuthSuccess}
      onSwitchToForgotPassword={handleSwitchToForgotPassword}
    />
  </DialogContent>
</Dialog>;

{
  /* Модальное окно регистрации */
}
<Dialog open={isRegisterOpen} onOpenChange={open => !open && onRegisterClose()}>
  {/* ... */}
</Dialog>;

{
  /* Модальное окно восстановления пароля */
}
<Dialog open={isForgotPasswordOpen} onOpenChange={open => !open && onForgotPasswordClose()}>
  {/* ... */}
</Dialog>;
```

### Фактическое поведение

**User Action:** Кликает X button в Login модалке

**Execution Flow:**

```tsx
1. Dialog component calls: onOpenChange(false)
2. Condition: !open → !false → true
3. Executes: onLoginClose()
4. onLoginClose() = closeAll() → {
     setIsLoginOpen(false);      // ✅ Ожидаемо
     setIsRegisterOpen(false);   // ❌ Неожиданно
     setIsForgotPasswordOpen(false); // ❌ Неожиданно
   }
```

**Результат:** Закрываются ВСЕ три модалки одновременно, хотя пользователь кликнул X только в login модалке.

### Почему это проблема

#### A. User Experience Issue

Пользователь не ожидает такого поведения:

- Открыл login → переключился на forgot password → нажал X
- **Ожидает:** Закроется forgot password модалка
- **Фактически:** Закроются login, register И forgot password

#### B. State Pollution

```tsx
// Ситуация:
isLoginOpen: false
isRegisterOpen: true  // Была открыта программно
isForgotPasswordOpen: false

// User кликает X в register модалке:
onRegisterClose() → closeAll() → {
  isLoginOpen: false,        // Не изменилось
  isRegisterOpen: false,     // ✅ Ожидаемо
  isForgotPasswordOpen: false // ❌ Потеряли состояние
}
```

#### C. Future Scalability

При добавлении новых модалок (например, 2FA verification):

```tsx
// Будущий код:
<Dialog open={is2FAOpen} onOpenChange={open => !open && on2FAClose()}>
  {/* ... */}
</Dialog>

// Проблема:
on2FAClose() = closeAll() → закроет login, register, forgot, 2FA
```

### Воспроизведение

**Test Case 1: Direct close**

1. Открыть Login modal
2. Нажать X button
3. **Ожидаемо:** Закроется только Login
4. **Фактически:** Закроются все модалки (но видна только одна, поэтому не заметно)

**Test Case 2: Multiple modals context** (future scenario)

1. Программно открыть Register modal через `openRegister()`
2. В другом месте открыть Login modal через `openLogin()`
3. Нажать X в Login модалке
4. **Ожидаемо:** Закроется Login, Register останется
5. **Фактически:** Закроются обе

### Рекомендация

**Использовать индивидуальные close методы** (см. Риск #1):

```tsx
<Dialog open={isLoginOpen} onOpenChange={open => !open && closeLogin()}>
  {/* Закроет ТОЛЬКО isLoginOpen */}
</Dialog>

<Dialog open={isRegisterOpen} onOpenChange={open => !open && closeRegister()}>
  {/* Закроет ТОЛЬКО isRegisterOpen */}
</Dialog>

<Dialog open={isForgotPasswordOpen} onOpenChange={open => !open && closeForgotPassword()}>
  {/* Закроет ТОЛЬКО isForgotPasswordOpen */}
</Dialog>
```

**Почему это решает проблему:**

1. X button закрывает только текущую модалку
2. Другие модалки сохраняют состояние
3. Интуитивное поведение для пользователя
4. Изолированное управление состоянием

---

## ⚠️ РИСК #3: Несоответствие семантическому контракту AuthDialogs

### 🟢 **SEVERITY: LOW** | **Вероятность: LOW** | **Влияние: MEDIUM**

### Описание проблемы

Интерфейс `AuthDialogs` определяет явный контракт для callbacks:

**Файл:** `apps/web/src/components/auth-dialogs.tsx` (lines 10-20)

```tsx
interface AuthDialogsProps {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  isForgotPasswordOpen: boolean;
  onLoginClose: () => void; // ✅ Семантика: "закрыть login"
  onRegisterClose: () => void; // ✅ Семантика: "закрыть register"
  onForgotPasswordClose: () => void; // ✅ Семантика: "закрыть forgot password"
  onAuthSuccess?: () => void;
  onOpenForgotPassword: () => void;
  onOpenLogin: () => void;
}
```

**Naming Convention:**

- `onLoginClose` → должен закрывать ТОЛЬКО login модалку
- `onRegisterClose` → должен закрывать ТОЛЬКО register модалку
- `onForgotPasswordClose` → должен закрывать ТОЛЬКО forgot password модалку

### Фактическая реализация

**Файл:** `apps/web/src/components/app-header.tsx` (lines 175-177)

```tsx
<AuthDialogs
  onLoginClose={closeAll} // ❌ Закрывает ВСЕ, не только login
  onRegisterClose={closeAll} // ❌ Закрывает ВСЕ, не только register
  onForgotPasswordClose={closeAll} // ❌ Закрывает ВСЕ, не только forgot
/>
```

### Почему это проблема

#### A. Violation of Single Responsibility Principle

```tsx
// Callback "onLoginClose" имеет несколько ответственностей:
const closeAll = () => {
  setIsLoginOpen(false); // ✅ Responsibility 1: закрыть login
  setIsRegisterOpen(false); // ❌ Responsibility 2: закрыть register
  setIsForgotPasswordOpen(false); // ❌ Responsibility 3: закрыть forgot
};
```

SRP violation делает код хрупким к изменениям.

#### B. Misleading API для разработчиков

Новый разработчик читает код:

```tsx
// В auth-dialogs.tsx:
const handleSwitchToForgotPassword = () => {
  onLoginClose(); // 🤔 Думает: "закроет login"
  onOpenForgotPassword(); // 🤔 Думает: "откроет forgot password"
};
```

**Ожидание:** Закроется login, откроется forgot password.

**Реальность:** `onLoginClose()` закрывает ВСЕ модалки, затем `onOpenForgotPassword()` открывает forgot (работает из-за batching).

**Проблема:** Скрытая сложность, неочевидное поведение.

#### C. Тестирование

```tsx
// Unit test для AuthDialogs:
it('should close only login modal when onLoginClose is called', () => {
  const onLoginClose = jest.fn();
  const { getByRole } = render(
    <AuthDialogs
      isLoginOpen={true}
      isRegisterOpen={true} // ✅ Другая модалка тоже открыта
      onLoginClose={onLoginClose}
      {...otherProps}
    />
  );

  fireEvent.click(getByRole('button', { name: /close/i }));

  expect(onLoginClose).toHaveBeenCalled();
  // ❌ Но фактически закроются ОБЕ модалки, не только login
});
```

Тест пройдет, но поведение не соответствует ожиданиям.

### Рекомендация

**Переименовать или добавить методы с корректной семантикой:**

```tsx
// Вариант A: Добавить индивидуальные методы (рекомендуется)
interface AuthModalContextValue {
  // ... existing
  closeLogin: () => void;
  closeRegister: () => void;
  closeForgotPassword: () => void;
  closeAll: () => void; // Оставить для explicit use cases
}

// Вариант B: Переименовать closeAll если это единственный метод
interface AuthModalContextValue {
  // ... existing
  closeAllModals: () => void; // Явная семантика
}

// Использование:
<AuthDialogs
  onLoginClose={closeLogin} // ✅ Ясная семантика
  onRegisterClose={closeRegister} // ✅ Ясная семантика
  onForgotPasswordClose={closeForgotPassword} // ✅ Ясная семантика
/>;
```

**Почему это решает проблему:**

1. API соответствует ожиданиям разработчиков
2. Явная семантика callbacks
3. Легче тестировать
4. Следует принципам SOLID

---

## ⚠️ РИСК #4: Ограниченность API AuthModalContext

### 🟡 **SEVERITY: MEDIUM** | **Вероятность: MEDIUM** | **Влияние: HIGH**

### Описание проблемы

Текущий API контекста предоставляет ТОЛЬКО метод `closeAll()`:

**Файл:** `packages/providers/src/auth-modal-provider.tsx` (lines 19-28)

```tsx
interface AuthModalContextValue {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  isForgotPasswordOpen: boolean;
  openLogin: () => void;
  openRegister: () => void;
  openForgotPassword: () => void;
  closeAll: () => void; // ❌ ЕДИНСТВЕННЫЙ способ закрыть модалки
}
```

**Отсутствуют:**

```tsx
closeLogin: () => void;
closeRegister: () => void;
closeForgotPassword: () => void;
```

### Use Cases, которые НЕВОЗМОЖНЫ

#### Use Case A: Закрыть login после успешного логина, но оставить register для signup flow

```tsx
// Хотим:
const handleLoginSuccess = () => {
  closeLogin(); // ❌ Не существует
  // Register модалка остается открытой для дополнительной регистрации
};

// Можем только:
const handleLoginSuccess = () => {
  closeAll(); // ❌ Закроет ВСЕ, включая register
};
```

#### Use Case B: Программное управление из нескольких компонентов

```tsx
// Component A:
const ComponentA = () => {
  const { openLogin } = useAuthModal();

  useEffect(() => {
    if (needAuth) {
      openLogin(); // Открываем login
    }
  }, [needAuth]);
};

// Component B (одновременно):
const ComponentB = () => {
  const { openRegister } = useAuthModal();

  useEffect(() => {
    if (showPromo) {
      openRegister(); // Хотим показать promo для регистрации
    }
  }, [showPromo]);
};

// Проблема: Как закрыть login из Component A, не затронув register из Component B?
// closeAll() закроет обе модалки ❌
```

#### Use Case C: Partial modal dismissal

```tsx
// После успешной верификации email в forgot password flow:
const handleEmailVerified = () => {
  closeForgotPassword(); // ❌ Не существует
  openLogin(); // Открыть login для ввода нового пароля

  // Текущее решение:
  closeAll(); // ❌ Закроет всё
  openLogin(); // Откроет login (работает из-за batching, но хрупко)
};
```

### Будущие сценарии (при расширении функционала)

#### Сценарий A: Multi-step authentication

```tsx
// Step 1: Login
openLogin();

// Step 2: После логина, если нужен 2FA:
closeLogin(); // ❌ Не существует, придется делать closeAll()
open2FA();

// Step 3: После 2FA, если нужна email verification:
close2FA(); // ❌ Не существует
openEmailVerification();
```

**Проблема:** Невозможно последовательно управлять модалками без `closeAll()`.

#### Сценарий B: Conditional modals

```tsx
const handleOrderClick = () => {
  if (!isAuthenticated) {
    openLogin();
  } else if (!isVerified) {
    openEmailVerification();
  } else {
    proceedToOrder();
  }

  // Если пользователь вернется назад:
  // Хотим закрыть текущую модалку, не затрагивая другие
  closeCurrentModal(); // ❌ Не существует
};
```

### Сравнение с best practices

**Пример из React Router:**

```tsx
// React Router предоставляет индивидуальные методы:
navigate('/login'); // Навигация на login
navigate('/register'); // Навигация на register
navigate(-1); // Назад на ОДНУ страницу, не на начало

// НЕ делает:
navigate.closeAll(); // ❌ Не существует
```

**Пример из UI библиотек (Radix UI, Headless UI):**

```tsx
// Radix Dialog:
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  {/* Управление ОДНОЙ модалкой, не всеми */}
</Dialog>

// НЕ делает:
<Dialog onCloseAll={closeAllDialogs}>  // ❌ Не существует
```

### Рекомендация

**Расширить API с индивидуальными методами:**

```tsx
interface AuthModalContextValue {
  // State
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  isForgotPasswordOpen: boolean;

  // Open methods (существующие)
  openLogin: () => void;
  openRegister: () => void;
  openForgotPassword: () => void;

  // ✅ ADD: Individual close methods
  closeLogin: () => void;
  closeRegister: () => void;
  closeForgotPassword: () => void;

  // Keep closeAll for explicit use cases
  closeAll: () => void;
}
```

**Implementation:**

```tsx
export function AuthModalProvider({ children }: AuthModalProviderProps) {
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);

  // ✅ Individual open methods (существующие)
  const openLogin = React.useCallback(() => {
    setIsRegisterOpen(false);
    setIsForgotPasswordOpen(false);
    setIsLoginOpen(true);
  }, []);

  const openRegister = React.useCallback(() => {
    setIsLoginOpen(false);
    setIsForgotPasswordOpen(false);
    setIsRegisterOpen(true);
  }, []);

  const openForgotPassword = React.useCallback(() => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
    setIsForgotPasswordOpen(true);
  }, []);

  // ✅ ADD: Individual close methods
  const closeLogin = React.useCallback(() => {
    setIsLoginOpen(false);
  }, []);

  const closeRegister = React.useCallback(() => {
    setIsRegisterOpen(false);
  }, []);

  const closeForgotPassword = React.useCallback(() => {
    setIsForgotPasswordOpen(false);
  }, []);

  // Keep closeAll for explicit scenarios
  const closeAll = React.useCallback(() => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
    setIsForgotPasswordOpen(false);
  }, []);

  const value = React.useMemo(
    () => ({
      isLoginOpen,
      isRegisterOpen,
      isForgotPasswordOpen,
      openLogin,
      openRegister,
      openForgotPassword,
      closeLogin,
      closeRegister,
      closeForgotPassword,
      closeAll,
    }),
    [
      isLoginOpen,
      isRegisterOpen,
      isForgotPasswordOpen,
      openLogin,
      openRegister,
      openForgotPassword,
      closeLogin,
      closeRegister,
      closeForgotPassword,
      closeAll,
    ]
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}
```

**Почему это решает проблему:**

1. Гибкий API для разных use cases
2. Возможность закрывать конкретные модалки
3. `closeAll()` остается для explicit scenarios (например, logout)
4. Соответствует паттернам других UI библиотек
5. Легко расширяется при добавлении новых модалок

---

## 📊 СВОДНАЯ ТАБЛИЦА РИСКОВ

| #   | Риск                                    | Severity  | Probability | Impact | Когда проявится                                      | Зависимости |
| --- | --------------------------------------- | --------- | ----------- | ------ | ---------------------------------------------------- | ----------- |
| 1   | Race condition при переключении модалок | 🔴 HIGH   | MEDIUM      | HIGH   | При async операциях, middleware, Concurrent Mode     | None        |
| 2   | X button закрывает ВСЕ модалки          | 🟡 MEDIUM | HIGH        | MEDIUM | При клике на X, multi-modal scenarios                | None        |
| 3   | Несоответствие семантическому контракту | 🟢 LOW    | LOW         | MEDIUM | При рефакторинге, новых разработчиках, code review   | None        |
| 4   | Ограниченность API                      | 🟡 MEDIUM | MEDIUM      | HIGH   | При расширении функционала (2FA, email verification) | Риск #1, #2 |

**Risk Priority:**

1. **Риск #1** (HIGH): Блокирует будущие async операции
2. **Риск #4** (MEDIUM-HIGH): Ограничивает масштабируемость
3. **Риск #2** (MEDIUM): UX issue, но не критичен
4. **Риск #3** (LOW): Качество кода, но не функциональность

---

## ✅ ЧТО РАБОТАЕТ КОРРЕКТНО

### 1. AuthForms Internal Switching (login ↔ register)

**Файл:** `apps/web/src/components/forms/AuthForms.tsx`

```tsx
export function AuthForms({
  defaultMode = 'login',
  onAuthSuccess,
  onSwitchToForgotPassword,
}: AuthFormsProps) {
  const [mode, setMode] = React.useState<'login' | 'register'>(defaultMode);

  const handleModeChange = React.useCallback((newMode: 'login' | 'register') => {
    setMode(newMode);
  }, []);

  return (
    <AuthFormLayout mode={mode} onModeChange={handleModeChange} t={t}>
      {/* login/register switching happens INSIDE modal */}
    </AuthFormLayout>
  );
}
```

**Почему работает:**

- Использует локальный `useState` внутри компонента
- НЕ зависит от `AuthModalContext`
- Переключение происходит внутри ОДНОЙ модалки
- Не затронуто изменениями в `app-header.tsx`

### 2. UNAUTHORIZED Error Handling

**Файл:** `apps/web/src/components/orders/OrdersContainer.tsx`

```tsx
if (error.data?.code === 'UNAUTHORIZED') {
  return (
    <ErrorState
      title={tErrors('server.errors.auth.required')}
      message={tErrors('server.errors.auth.requiredDescription')}
      action={{
        label: tCommon('signIn'),
        onClick: () => {
          authModal.openLogin(); // ✅ Только открывает login
        },
      }}
    />
  );
}
```

**Почему работает:**

- Использует только `openLogin()`, не `closeAll()`
- Не участвует в modal switching logic
- Простой use case: открыть login при ошибке

### 3. Type Safety

**Все типы корректны:**

```tsx
// TypeScript не выдает ошибок:
✅ AuthModalContextValue типизирован
✅ useAuthModal() возвращает корректный тип
✅ app-header.tsx передает правильные типы в AuthDialogs
✅ AuthDialogsProps интерфейс соблюден
```

**НО:** Type safety НЕ гарантирует корректность runtime behavior.

---

## 🧪 ТЕСТОВЫЕ СЦЕНАРИИ

### Test Case 1: Login → Forgot Password Transition

```
PRECONDITIONS:
- Пользователь не залогинен
- Открыта главная страница

STEPS:
1. Нажать "Login" button в header
2. Проверить: Login modal открылась
3. Нажать "Forgot Password?" link в login modal
4. Проверить: Login modal закрылась
5. Проверить: Forgot Password modal открылась

EXPECTED RESULT:
✅ Плавный переход между модалками
✅ Нет flickering
✅ Forgot Password modal отображается корректно

ACTUAL RESULT (current implementation):
✅ Работает благодаря React batching
⚠️ Но хрупко к async операциям

RISK LEVEL: HIGH (если добавятся async операции)
```

### Test Case 2: Forgot Password → Back to Login

```
PRECONDITIONS:
- Открыта Forgot Password modal

STEPS:
1. Нажать "Back to Login" button
2. Проверить: Forgot Password modal закрылась
3. Проверить: Login modal открылась

EXPECTED RESULT:
✅ Плавный переход обратно к login

ACTUAL RESULT:
✅ Работает благодаря React batching

RISK LEVEL: HIGH (если добавятся async операции)
```

### Test Case 3: X Button Behavior

```
PRECONDITIONS:
- Открыта Login modal
- isRegisterOpen = false (программно)
- isForgotPasswordOpen = false (программно)

STEPS:
1. Нажать X button в Login modal
2. Проверить состояние: isLoginOpen
3. Проверить состояние: isRegisterOpen
4. Проверить состояние: isForgotPasswordOpen

EXPECTED RESULT:
isLoginOpen: false ✅
isRegisterOpen: false ✅ (не изменилось)
isForgotPasswordOpen: false ✅ (не изменилось)

ACTUAL RESULT:
isLoginOpen: false ✅
isRegisterOpen: false ✅ (closeAll() установил, но было уже false)
isForgotPasswordOpen: false ✅ (closeAll() установил, но было уже false)

RISK LEVEL: MEDIUM (state pollution в multi-modal scenarios)
```

### Test Case 4: UNAUTHORIZED → Login Modal

```
PRECONDITIONS:
- Пользователь разлогинен
- Открыта страница /orders

STEPS:
1. Загрузить страницу /orders
2. Получить UNAUTHORIZED error
3. Проверить: ErrorState отображается
4. Проверить: Текст ошибки корректный (не "server.errors.auth.required")
5. Нажать "Sign In" button в ErrorState
6. Проверить: Login modal открылась

EXPECTED RESULT:
✅ Корректный текст ошибки
✅ Login modal открывается при клике

ACTUAL RESULT:
✅ Работает корректно

RISK LEVEL: LOW (простой use case)
```

### Test Case 5: Rapid Modal Switching

```
PRECONDITIONS:
- Пользователь не залогинен

STEPS:
1. Открыть Login modal
2. Быстро кликнуть "Forgot Password?"
3. Сразу кликнуть "Back to Login"
4. Сразу кликнуть "Forgot Password?" снова
5. Сразу кликнуть X button

EXPECTED RESULT:
✅ Модалки переключаются корректно
✅ Нет визуальных артефактов
✅ Финальное состояние: все модалки закрыты

ACTUAL RESULT:
⚠️ Зависит от React batching
⚠️ Может быть flickering при быстрых кликах

RISK LEVEL: MEDIUM (edge case, но возможен)
```

---

## 💡 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ

### 🎯 Рекомендация #1: Добавить индивидуальные close методы (PRIORITY: HIGH)

**Решает риски:** #1, #2, #4

**Изменения в `packages/providers/src/auth-modal-provider.tsx`:**

```tsx
interface AuthModalContextValue {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  isForgotPasswordOpen: boolean;
  openLogin: () => void;
  openRegister: () => void;
  openForgotPassword: () => void;
  closeLogin: () => void; // ✅ ADD
  closeRegister: () => void; // ✅ ADD
  closeForgotPassword: () => void; // ✅ ADD
  closeAll: () => void;
}

export function AuthModalProvider({ children }: AuthModalProviderProps) {
  // ... existing state

  // ✅ ADD: Individual close methods
  const closeLogin = React.useCallback(() => {
    setIsLoginOpen(false);
  }, []);

  const closeRegister = React.useCallback(() => {
    setIsRegisterOpen(false);
  }, []);

  const closeForgotPassword = React.useCallback(() => {
    setIsForgotPasswordOpen(false);
  }, []);

  // ... existing open methods and closeAll

  const value = React.useMemo(
    () => ({
      isLoginOpen,
      isRegisterOpen,
      isForgotPasswordOpen,
      openLogin,
      openRegister,
      openForgotPassword,
      closeLogin, // ✅ ADD
      closeRegister, // ✅ ADD
      closeForgotPassword, // ✅ ADD
      closeAll,
    }),
    [
      isLoginOpen,
      isRegisterOpen,
      isForgotPasswordOpen,
      openLogin,
      openRegister,
      openForgotPassword,
      closeLogin, // ✅ ADD
      closeRegister, // ✅ ADD
      closeForgotPassword, // ✅ ADD
      closeAll,
    ]
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}
```

**Изменения в `apps/web/src/components/app-header.tsx`:**

```tsx
function useAuthDialogs() {
  const { data: session } = trpc.auth.getSession.useQuery(undefined, {
    refetchInterval: UI_REFRESH_INTERVALS.SESSION_STATUS_REFRESH,
  });
  const utils = trpc.useUtils();

  const authModal = useAuthModal();

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.getSession.invalidate();
    },
  });

  const handleSignOut = React.useCallback(() => {
    logout.mutate();
  }, [logout]);

  return {
    session,
    isLoginOpen: authModal.isLoginOpen,
    isRegisterOpen: authModal.isRegisterOpen,
    isForgotPasswordOpen: authModal.isForgotPasswordOpen,
    openLogin: authModal.openLogin,
    openRegister: authModal.openRegister,
    openForgotPassword: authModal.openForgotPassword,
    closeLogin: authModal.closeLogin, // ✅ CHANGE: было closeAll
    closeRegister: authModal.closeRegister, // ✅ CHANGE: было closeAll
    closeForgotPassword: authModal.closeForgotPassword, // ✅ CHANGE: было closeAll
    handleAuthSuccess: authModal.closeAll, // ✅ KEEP: closeAll для успешной аутентификации
    handleSignOut,
  };
}

// ... в JSX:

<AuthDialogs
  isLoginOpen={isLoginOpen}
  isRegisterOpen={isRegisterOpen}
  isForgotPasswordOpen={isForgotPasswordOpen}
  onLoginClose={closeLogin} // ✅ CHANGE
  onRegisterClose={closeRegister} // ✅ CHANGE
  onForgotPasswordClose={closeForgotPassword} // ✅ CHANGE
  onAuthSuccess={handleAuthSuccess}
  onOpenForgotPassword={openForgotPassword}
  onOpenLogin={openLogin}
/>;
```

**Почему это решение:**

1. ✅ Устраняет race condition (Риск #1)
2. ✅ X button закрывает только текущую модалку (Риск #2)
3. ✅ Соответствует семантике интерфейса (Риск #3)
4. ✅ Расширяет API для future use cases (Риск #4)
5. ✅ Минимальные изменения в codebase
6. ✅ Backward compatible (`closeAll()` остается)

---

### 🎯 Рекомендация #2: Добавить E2E тесты (PRIORITY: MEDIUM)

**Решает:** Проверка runtime behavior, выявление edge cases

**Создать:** `tests/e2e/auth-modals.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Auth Modals', () => {
  test('should switch from login to forgot password', async ({ page }) => {
    await page.goto('/');

    // Open login
    await page.click('text=Login');
    await expect(page.locator('text=Sign In')).toBeVisible();

    // Switch to forgot password
    await page.click('text=Forgot Password?');
    await expect(page.locator('text=Reset Password')).toBeVisible();
    await expect(page.locator('text=Sign In')).not.toBeVisible();
  });

  test('should close only current modal on X button', async ({ page }) => {
    await page.goto('/');

    // Open login
    await page.click('text=Login');
    await expect(page.locator('text=Sign In')).toBeVisible();

    // Close with X button
    await page.click('[aria-label="Close"]');
    await expect(page.locator('text=Sign In')).not.toBeVisible();
  });

  test('should open login modal on unauthorized orders access', async ({ page }) => {
    await page.goto('/orders');

    // Should show error and login button
    await expect(page.locator('text=Sign In')).toBeVisible();

    // Click sign in button
    await page.click('text=Sign In');
    await expect(page.locator('text=Sign In')).toBeVisible(); // Modal title
  });
});
```

**Почему это решение:**

- Проверяет фактическое поведение в браузере
- Выявляет race conditions и flickering
- Регресс-тестирование при изменениях

---

### 🎯 Рекомендация #3: Добавить documentation comments (PRIORITY: LOW)

**Решает:** Риск #3 (понимание кода новыми разработчиками)

```tsx
/**
 * AuthModalProvider - глобальный контекст для управления модалками авторизации
 *
 * @example
 * // Открыть login модалку из любого компонента:
 * const { openLogin } = useAuthModal();
 * openLogin();
 *
 * @example
 * // Закрыть конкретную модалку:
 * const { closeLogin } = useAuthModal();
 * closeLogin(); // Закроет ТОЛЬКО login, остальные останутся в текущем состоянии
 *
 * @example
 * // Закрыть все модалки (например, после успешной аутентификации):
 * const { closeAll } = useAuthModal();
 * closeAll();
 */
export function AuthModalProvider({ children }: AuthModalProviderProps) {
  // ...
}
```

---

## 🚀 ПЛАН ДЕЙСТВИЙ

### Вариант A: Принять риски и развернуть (RISK: MEDIUM)

**Pros:**

- ✅ Быстрый deployment
- ✅ Код работает в большинстве сценариев
- ✅ Нет затрат на исправления

**Cons:**

- ❌ Риск #1 проявится при async операциях
- ❌ Риск #2 может вызвать UX confusion
- ❌ Риск #4 ограничит future development
- ❌ Tech debt накапливается

**Timeline:** Immediate deployment

**Recommendation:** ❌ НЕ рекомендуется для production

---

### Вариант B: Исправить критические риски (RECOMMENDED)

**Действия:**

1. Реализовать Рекомендацию #1 (индивидуальные close методы)
2. Обновить типы в `AuthModalContextValue`
3. Обновить `app-header.tsx` для использования новых методов
4. Запустить `npm run check-types`
5. Мануальное тестирование по Test Cases 1-4

**Pros:**

- ✅ Устраняет ВСЕ 4 риска
- ✅ Robust implementation
- ✅ Готовность к future features
- ✅ Минимальные изменения (2 файла)

**Cons:**

- ⏱️ +30-60 минут работы
- 🧪 Требует тестирования

**Timeline:** 1-2 часа (implementation + testing)

**Recommendation:** ✅ STRONGLY RECOMMENDED

---

### Вариант C: Full refactoring с E2E тестами

**Действия:**

1. Реализовать Рекомендацию #1
2. Реализовать Рекомендацию #2 (E2E tests)
3. Реализовать Рекомендацию #3 (documentation)
4. Code review
5. Full QA pass

**Pros:**

- ✅ Production-ready quality
- ✅ Test coverage
- ✅ Documented для команды

**Cons:**

- ⏱️ +3-4 часа работы
- 🧪 Требует Playwright setup

**Timeline:** 4-6 часов

**Recommendation:** ✅ Ideal для production, но может быть overkill для hotfix

---

## 📈 IMPACT ASSESSMENT

### Если НЕ исправлять:

**Short-term (1-2 недели):**

- 🟢 Minimal impact - код работает
- 🟡 Возможны edge cases с X button

**Medium-term (1-3 месяца):**

- 🟡 При добавлении analytics/tracking - race condition проявится
- 🟡 При добавлении 2FA/email verification - потребуется refactoring
- 🔴 Tech debt увеличится

**Long-term (6+ месяцев):**

- 🔴 Breaking changes при расширении auth flow
- 🔴 Сложность onboarding новых разработчиков
- 🔴 Накопление workarounds

### Если исправить (Вариант B):

**Short-term:**

- ✅ Все риски устранены
- ✅ Код готов к расширению

**Medium-term:**

- ✅ Легко добавлять новые модалки
- ✅ No tech debt

**Long-term:**

- ✅ Maintainable codebase
- ✅ Scalable architecture

---

## 🎓 LESSONS LEARNED

### 1. React setState batching - не гарантия

**Урок:** Полагаться на automatic batching хрупко.

**Best Practice:**

```tsx
// ❌ BAD: Зависит от batching
const switch = () => {
  closeAll();  // Закрывает target
  open();      // Открывает target (работает из-за batching)
};

// ✅ GOOD: Explicit control
const switch = () => {
  closeCurrent();  // Закрывает ТОЛЬКО current
  open();          // Открывает target
};
```

### 2. Naming matters

**Урок:** `onLoginClose` должен закрывать login, не ВСЁ.

**Best Practice:**

- Методы должны делать то, что их имя подразумевает
- Если метод делает больше - переименовать (`closeAllModals`)

### 3. API design for extensibility

**Урок:** `closeAll()` как единственный метод ограничивает функционал.

**Best Practice:**

- Предоставлять granular control (individual methods)
- Дополнительно предоставлять convenience methods (`closeAll()`)

### 4. Type safety ≠ Runtime correctness

**Урок:** TypeScript проверяет типы, не логику.

**Best Practice:**

- Type-safe код может иметь logic bugs
- Нужны runtime tests (E2E, integration)

---

## 📚 REFERENCES

### Codebase Files

1. `packages/providers/src/auth-modal-provider.tsx` - AuthModalContext implementation
2. `apps/web/src/components/app-header.tsx` - Consumer of AuthModalContext
3. `apps/web/src/components/auth-dialogs.tsx` - Modal switching logic
4. `apps/web/src/components/forms/AuthForms.tsx` - Internal login/register switching
5. `apps/web/src/components/orders/OrdersContainer.tsx` - UNAUTHORIZED handling

### React Documentation

- [React 18 Automatic Batching](https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching)
- [useState updates are batched](https://react.dev/learn/queueing-a-series-of-state-updates)
- [useCallback hook](https://react.dev/reference/react/useCallback)

### Best Practices

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [API Design Guidelines](https://github.com/microsoft/api-guidelines)

---

## ✍️ AUTHOR NOTES

Этот отчет основан на **фактическом анализе кодовой базы**, не на предположениях:

1. ✅ Прочитаны все затронутые файлы (`read_file`)
2. ✅ Проверены интерфейсы и контракты (`AuthDialogsProps`)
3. ✅ Проанализирован execution flow (step-by-step)
4. ✅ Найдены actual implementations (`grep_search`, `semantic_search`)
5. ✅ Проверены зависимости между компонентами

**Verdict:**

- Архитектурное решение (global context) - ✅ **ПРАВИЛЬНОЕ**
- Реализация (closeAll вместо individual methods) - ❌ **ТРЕБУЕТ УЛУЧШЕНИЯ**
- Текущая функциональность - ✅ **РАБОТАЕТ** (благодаря batching)
- Production readiness - ⚠️ **MEDIUM RISK** без исправлений

**Final Recommendation:** Реализовать **Вариант B** (добавить individual close methods) перед production deployment.

---

**END OF REPORT**
