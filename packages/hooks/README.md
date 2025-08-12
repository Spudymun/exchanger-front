# `@repo/hooks`

Централизованная система состояния и бизнес-логики для ExchangeGO монорепозитория с SSR-safe архитектурой.

## 📋 Последние изменения

**v2.0.0** (Декабрь 2024) - **BREAKING CHANGES**

- ✅ **Удалены deprecated файлы**: `useAuth.ts`, `useForm.ts`
- ✅ **Современная архитектура**: Только `useFormWithNextIntl` с полной i18n поддержкой
- ✅ **Обратная совместимость**: Типы сохранены через `useFormTypes.ts`
- ✅ **SSR-safe**: Все hooks корректно работают с Next.js 15
- ✅ **Миграция завершена**: Все компоненты используют современные API

## 🎯 Обзор

Пакет предоставляет:

- ✅ **SSR-safe архитектура** - правильное разделение server/client кода
- ✅ **Zustand stores** - централизованное управление состоянием
- ✅ **Business hooks** - бизнес-логика обменов, форм, аутентификации
- ✅ **UI hooks** - управление интерфейсом и уведомлениями
- ✅ **TypeScript типизация** - полная типизация всех хуков и stores

## 🏗️ Архитектура пакета

### SSR-safe структура

```
packages/hooks/
├── src/
│   ├── index.ts                    # SSR-safe exports (только типы)
│   ├── client-hooks.ts             # Client-only hooks
│   ├── state/                      # Zustand stores
│   │   ├── ui-store.ts            # UI состояние
│   │   ├── exchange-store.ts      # Бизнес-логика обменов
│   │   ├── notification-store.ts  # Система уведомлений
│   │   └── trading-store.ts       # Торговые операции
│   ├── business/                   # Бизнес-логика
│   │   ├── useFormWithNextIntl.ts # Современные формы с i18n
│   │   ├── useFormTypes.ts        # Типы для совместимости
│   │   ├── useMathCaptcha.ts      # CAPTCHA функциональность
│   │   ├── useExchange.ts         # Логика обменов
│   │   ├── useOrderTracking.ts    # Отслеживание заказов
│   │   └── authMessages.ts        # Сообщения аутентификации
│   └── ui/                        # UI хуки
│       └── useScrollVisibility.ts # Управление видимостью
└── README.md                      # Документация
```

## 🚀 Использование

### В Server Components (только типы)

```typescript
// ✅ Безопасно в Server Components
import type { UseFormReturn, NotificationType, ExchangeStore } from '@repo/hooks';

interface MyComponentProps {
  form: UseFormReturn<LoginForm>;
  notifications: NotificationType[];
}
```

### В Client Components (полная функциональность)

```typescript
// ✅ Правильно в Client Components
'use client';
import {
  useUIStore,
  useExchangeStore,
  useNotifications,
  useFormWithNextIntl
} from '@repo/hooks/src/client-hooks';

export function ExchangeForm() {
  const exchange = useExchangeStore();
  const notifications = useNotifications();

  return (
    <div>
      <button onClick={() => exchange.nextStep()}>
        Next Step
      </button>
    </div>
  );
}
```

### Современные формы с i18n

```typescript
'use client';
import { useFormWithNextIntl } from '@repo/hooks/src/client-hooks';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function LoginForm() {
  const t = useTranslations('auth');

  const form = useFormWithNextIntl({
    initialValues: { email: '', password: '' },
    validationSchema: LoginSchema,
    t,
    onSubmit: async (values) => {
      await api.login(values);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input {...form.getFieldProps('email')} />
      <input {...form.getFieldProps('password')} type="password" />
      <button type="submit" disabled={!form.isValid}>
        {t('login')}
      </button>
    </form>
  );
}
```

## 📊 Основные модули

### Активно используемые

| Модуль                            | Назначение                      | Использование           |
| --------------------------------- | ------------------------------- | ----------------------- |
| `state/ui-store.ts`               | Глобальное UI состояние         | ✅ Активно используется |
| `state/exchange-store.ts`         | Бизнес-логика обменов           | ✅ Активно используется |
| `state/notification-store.ts`     | Система уведомлений             | ✅ Активно используется |
| `business/useFormWithNextIntl.ts` | Современные формы с i18n        | ✅ Рекомендуется        |
| `business/useFormTypes.ts`        | Типы для обратной совместимости | ✅ Поддержка типов      |
| `business/useMathCaptcha.ts`      | CAPTCHA защита                  | ✅ Активно используется |
| `business/useExchange.ts`         | Логика обменов                  | ✅ Активно используется |
| `business/useOrderTracking.ts`    | Отслеживание заказов            | ✅ Активно используется |
| `business/authMessages.ts`        | Сообщения аутентификации        | ✅ Типы и константы     |
| `client-hooks.ts`                 | SSR-safe экспорты               | ✅ Критически важен     |

## 🔧 State Management

### UI Store

```typescript
'use client';
import { useUIStore } from '@repo/hooks/src/client-hooks';

export function ThemeToggle() {
  const { theme, setTheme, sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div>
      <button onClick={() => setTheme('dark')}>
        Current: {theme}
      </button>
      <button onClick={toggleSidebar}>
        Sidebar: {sidebarOpen ? 'Open' : 'Closed'}
      </button>
    </div>
  );
}
```

### Exchange Store

```typescript
'use client';
import { useExchangeStore } from '@repo/hooks/src/client-hooks';

export function ExchangeForm() {
  const {
    formData,
    calculation,
    updateFormData,
    calculateExchange,
    nextStep,
    currentStep
  } = useExchangeStore();

  return (
    <div>
      <input
        value={formData.fromAmount}
        onChange={(e) => updateFormData({ fromAmount: e.target.value })}
      />
      <div>Rate: {calculation?.rate}</div>
      <button onClick={nextStep}>Next ({currentStep + 1})</button>
    </div>
  );
}
```

### Notification System

```typescript
'use client';
import { useNotifications } from '@repo/hooks/src/client-hooks';

export function NotificationExample() {
  const notifications = useNotifications();

  const handleSuccess = () => {
    notifications.success('Success!', 'Operation completed');
  };

  const handleError = () => {
    notifications.error('Error!', 'Something went wrong');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

## 🎨 CAPTCHA Protection

```typescript
'use client';
import { useMathCaptcha, CAPTCHA_CONFIGS } from '@repo/hooks/src/client-hooks';

export function CaptchaForm() {
  const captcha = useMathCaptcha(CAPTCHA_CONFIGS.medium);

  return (
    <div>
      <label>Solve: {captcha.challenge.question} = ?</label>
      <input
        type="number"
        value={captcha.userAnswer}
        onChange={(e) => captcha.setUserAnswer(e.target.value)}
        onBlur={captcha.onBlur}
      />
      {captcha.isValid && <span>✓ Correct!</span>}
      {captcha.hasError && <span>✗ Wrong answer</span>}
      <button onClick={captcha.refreshChallenge}>New Question</button>
    </div>
  );
}
```

## ⚠️ SSR Guidelines

### DO ✅

```typescript
// Server Components - только типы
import type { UseFormReturn } from '@repo/hooks';

// Client Components - полная функциональность
('use client');
import { useUIStore } from '@repo/hooks/src/client-hooks';
```

### DON'T ❌

```typescript
// ❌ НЕ импортируйте hooks в Server Components
import { useUIStore } from '@repo/hooks'; // SSR error!

// ❌ НЕ забывайте 'use client' директиву
import { useUIStore } from '@repo/hooks/src/client-hooks'; // SSR error!
```

## 🔄 Обратная совместимость

Для поддержания совместимости с существующим кодом сохранены типы:

```typescript
// ✅ Типы доступны для обратной совместимости
import type { UseFormReturn, UseFormOptions, FormField } from '@repo/hooks';

// ✅ Современный подход для новых компонентов
import { useFormWithNextIntl } from '@repo/hooks/src/client-hooks';
import { useTranslations } from 'next-intl';

const t = useTranslations('forms');
const form = useFormWithNextIntl({
  initialValues,
  validationSchema,
  t,
  onSubmit,
});
```

### Аутентификация

```typescript
// ✅ Современный подход
import { useTranslations } from 'next-intl';
import { useNotifications } from '@repo/hooks/src/client-hooks';
import type { AuthMessages } from '@repo/hooks';

const t = useTranslations('auth');
const notifications = useNotifications();

const handleLogin = async () => {
  try {
    await login();
    notifications.success(t('loginSuccess'));
  } catch (error) {
    notifications.error(t('loginError'));
  }
};
```

## 📚 Связанная документация

- **[DEVELOPER_GUIDE.md](../../docs/DEVELOPER_GUIDE.md)** - State Management архитектура
- **[MODULE_RESOLUTION_TROUBLESHOOTING.md](../../docs/troubleshooting/MODULE_RESOLUTION_TROUBLESHOOTING.md)** - Решение проблем с импортами
- **[Constants Package](../constants/README.md)** - Бизнес-константы и лимиты
- **[Utils Package](../utils/README.md)** - Валидационные схемы

## 🎯 Best Practices

### ✅ Рекомендуется

- Используйте `useFormWithNextIntl` для всех форм с i18n поддержкой
- Импортируйте hooks через `@repo/hooks/src/client-hooks` в client компонентах
- Используйте только типы в server компонентах
- Применяйте `useMathCaptcha` для защиты форм
- Централизуйте состояние через stores
- Используйте `useTranslations` для локализации

### ❌ Не рекомендуется

- Не импортируйте hooks в server компонентах без 'use client'
- Не дублируйте логику состояния в компонентах
- Не создавайте локальные копии hooks (используйте централизованные)
- Не забывайте передавать параметр `t` в `useFormWithNextIntl`

## 🔧 Development

### Добавление нового store

1. Создайте файл в `src/state/new-store.ts`
2. Используйте `createStore` из `@repo/utils`
3. Добавьте типы в `src/index.ts`
4. Экспортируйте в `src/client-hooks.ts`
5. Обновите exports в `package.json`

### Добавление нового business hook

1. Создайте файл в `src/business/useNewFeature.ts`
2. Используйте существующие stores и utilities
3. Добавьте типы в `src/index.ts`
4. Экспортируйте в `src/client-hooks.ts`
5. Обновите exports в `package.json`

Пакет является **критически важным** для всей архитектуры состояния проекта!
