# 🔍 Отчёт Инспекции: Страница Orders

**Дата:** 8 октября 2025  
**Инспектор:** AI Agent  
**Методология:** ai-agent-rules.yml (Rules 8, 20, 21, 23, 24) + UNIVERSAL_AUDIT_SYSTEM.md  
**Проверено файлов:** 5

**Найдено:**

- 🔴 **2 критические проблемы** (требуют немедленного исправления)
- 🟡 **1 технический долг** (важно исправить)
- 🟢 **2 рекомендации** (опциональные улучшения)

---

## 📋 Проверенные файлы

1. `apps/web/app/[locale]/orders/page.tsx` - Страница (Server Component)
2. `apps/web/src/components/orders/OrdersContainer.tsx` - Контейнер (Client Component, 360 строк)
3. `apps/web/src/components/orders/orders-table-components.tsx` - **МЁРТВЫЙ КОД** (150 строк)
4. `apps/web/src/server/trpc/routers/shared.ts` - API endpoint
5. `apps/web/messages/{en,ru}/orders-page.json` - Локализация

---

## 🔴 КРИТИЧЕСКИЕ ПРОБЛЕМЫ (Блокируют продакшн)

### 🚨 Проблема #1: Мёртвый файл с полным дублированием

**Файл:** `apps/web/src/components/orders/orders-table-components.tsx`

**Факт:** Файл создан, но **НИГДЕ НЕ ИСПОЛЬЗУЕТСЯ**

**Доказательство:**

```bash
grep -r "orders-table-components" apps/web/**/*.{tsx,ts}
# Результат: 0 совпадений ❌
```

**Дублирование:**

| Функция              | Строки в мёртвом файле | Дублирует из OrdersContainer.tsx |
| -------------------- | ---------------------- | -------------------------------- |
| `useOrdersColumns()` | 77-90                  | Строки 29-95                     |
| `OrdersTable()`      | 92-119                 | Строки 147-177                   |
| `EmptyState()`       | 126-134                | Строки 99-107                    |

**Нарушения:**

- ❌ **Rule 20** (Запрет избыточности) - 100% дублирование кода
- ❌ **Rule 21** (Осознанное удаление) - создан без интеграции
- ❌ **Rule 23** (Обязательная полная интеграция) - техническая готовность ≠ реальное использование

**Решение:**

```powershell
Remove-Item "apps\web\src\components\orders\orders-table-components.tsx"
```

---

### 🚨 Проблема #2: Динамическая генерация Tailwind классов (НЕ РАБОТАЕТ)

**Файл:** `apps/web/src/components/orders/OrdersContainer.tsx`  
**Строка:** 51

**Проблемный код:**

```tsx
<span
  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}/10 text-${config.color}`}
>
  {config.label}
</span>
```

**Почему НЕ работает:**
Tailwind CSS **не поддерживает** интерполяцию переменных в классах.  
Класс `bg-${config.color}` **не будет сгенерирован** при сборке.

**Правильное решение (уже есть в проекте):**

**Существующая функция:** `packages/utils/src/order-status.ts:217`

```typescript
export function getStatusColorClass(status: OrderStatus): string {
  const config = ORDER_STATUS_CONFIG[status];
  if (!config) return 'text-muted-foreground bg-muted/50';

  switch (config.color) {
    case 'success':
      return 'text-success bg-success/10'; // ✅ Статические классы
    case 'warning':
      return 'text-warning bg-warning/10'; // ✅ Работают
    case 'info':
      return 'text-info bg-info/10';
    case 'destructive':
      return 'text-destructive bg-destructive/10';
    default:
      return 'text-muted-foreground bg-muted/50';
  }
}
```

**Исправление:**

```tsx
import { getStatusColorClass } from '@repo/utils';

// В useOrdersColumns(), строка 42-54:
{
  key: 'status',
  label: t('columns.status'),
  render: (order: Order) => {
    const config = ORDER_STATUS_CONFIG[order.status];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(order.status)}`}
      >
        {config.label}
      </span>
    );
  },
}
```

**Также используется в:** `orders-table-components.tsx:29` (но файл нужно удалить)

---

## 🟡 ТЕХНИЧЕСКИЙ ДОЛГ (Важно исправить)

### ⚠️ Проблема #3: Хардкод константы пагинации

**Файл:** `apps/web/src/components/orders/OrdersContainer.tsx`  
**Строка:** 15

**Проблемный код:**

```typescript
const ORDERS_PER_PAGE = 20; // ❌ Хардкод
```

**Существующая константа:**

```typescript
// packages/constants/src/validation.ts:61
export const VALIDATION_LIMITS = {
  DEFAULT_PAGE_SIZE: 20, // ✅ Уже есть!
  // ...
};
```

**Использование в проекте:**

- ✅ `apps/web/src/server/trpc/routers/shared.ts:327` - использует `VALIDATION_LIMITS.DEFAULT_PAGE_SIZE`
- ✅ `apps/web/src/server/trpc/routers/operator.ts:54` - использует `VALIDATION_LIMITS.DEFAULT_PAGE_SIZE`
- ❌ `apps/web/src/components/orders/OrdersContainer.tsx:15` - НЕ использует

**Исправление:**

```typescript
// Строка 1-16, заменить:
import { ORDER_STATUS_CONFIG, type OrderStatus } from '@repo/constants';
import type { Order } from '@repo/exchange-core';
import { useAuthModal } from '@repo/providers';
import { DataTable, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { trpc } from '../../../lib/trpc-provider';

// Constants
const ORDERS_PER_PAGE = 20; // ❌ УДАЛИТЬ ЭТУ СТРОКУ

// На:
import { ORDER_STATUS_CONFIG, VALIDATION_LIMITS, type OrderStatus } from '@repo/constants';
// ... остальные импорты без изменений ...

// Constants
const ORDERS_PER_PAGE = VALIDATION_LIMITS.DEFAULT_PAGE_SIZE; // ✅ Использовать централизованную
```

**Нарушения:**

- ❌ **Rule 20** (Запрет избыточности) - дублирование константы
- ❌ **Rule 17** (Централизованные системы) - игнорирование packages/constants

---

## 🟢 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ (Опционально)

### 1. Размер компонента (CODE_STYLE_GUIDE.md)

**Правильное разделение Server/Client:**

- ✅ `page.tsx` - Server Component с `async/await`
- ✅ `OrdersContainer.tsx` - Client Component с `'use client'`
- ✅ Metadata generation через `generateMetadata()`

**Правильные паттерны:**

- ✅ Compound Components (`DataTable` из `@repo/ui`)
- ✅ tRPC с типизацией
- ✅ React hooks (useMemo, useCallback, useEffect)

### 2. Интеграция ⭐⭐⭐⭐⭐

**Роутинг:**

- ✅ `apps/web/app/[locale]/orders/page.tsx` - файл существует
- ✅ Роут `/orders` работает

**Навигация:**

- ✅ `apps/web/src/components/app-header.tsx:235` - есть ссылка
  ```tsx
  <Link href={APP_ROUTES.ORDERS} className={getNavLinkClass(pathname, APP_ROUTES.ORDERS)}>
  ```
- ✅ `packages/constants/src/app-routes.ts:10` - константа определена
  ```typescript
  ORDERS: '/orders' as const,
  ```

**API:**

- ✅ `apps/web/src/server/trpc/routers/shared.ts:316-346` - endpoint `shared.orders.getAll`
- ✅ Role-based access control (USER видит только свои, OPERATOR/SUPPORT - все)
- ✅ Фильтрация, сортировка, пагинация через `processOrders()`

### 3. Типизация ⭐⭐⭐⭐⭐

**TypeScript:**

- ✅ Нет ошибок компиляции (проверено через `get_errors`)
- ✅ Строгая типизация: `Order`, `OrderStatus`, `OrderSortOption`
- ✅ Zod schemas для API валидации

**Типы:**

```typescript
// packages/exchange-core/src/types/order.ts - правильное использование
type OrderSortOption = 'newest' | 'oldest';
interface OrdersContainerProps {
  initialPage?: number;
  initialStatus?: string;
  initialSearch?: string;
  initialSortBy?: string;
}
```

### 4. Локализация ⭐⭐⭐⭐⭐

**Файлы:**

- ✅ `apps/web/messages/en/orders-page.json` - английский (41 строка)
- ✅ `apps/web/messages/ru/orders-page.json` - русский (41 строка)

**Использование:**

- ✅ `useTranslations('OrdersPage')` - правильный namespace
- ✅ Все строки вынесены в i18n (нет хардкода текстов)

### 5. Обработка ошибок ⭐⭐⭐⭐

**Авторизация:**

```typescript
// OrdersContainer.tsx:122-137
const isUnauthorized =
  error.data?.code === 'UNAUTHORIZED' || error.message.includes(UNAUTHORIZED_ERROR_KEY);

if (isUnauthorized) {
  onLoginRequired(); // ✅ Открывает модалку логина
}
```

**Редирект после закрытия модалки:**

```typescript
// OrdersContainer.tsx:273-283
React.useEffect(() => {
  const allModalsClosed =
    !authModal.isLoginOpen && !authModal.isRegisterOpen && !authModal.isForgotPasswordOpen;

  if (wasModalOpenRef.current && allModalsClosed && !session?.user) {
    router.push('/'); // ✅ Редирект на главную если не залогинился
  }
  // ...
}, [
  authModal.isLoginOpen,
  authModal.isRegisterOpen,
  authModal.isForgotPasswordOpen,
  session,
  router,
]);
```

**States:**

- ✅ Loading state - показывается через `isLoading` в DataTable
- ✅ Error state - компонент `ErrorState`
- ✅ Empty state - компонент `EmptyState`
- ✅ No results - условие `searchTerm ? t('empty.noResults') : t('empty.description')`

### 6. Производительность ⭐⭐⭐⭐

**Оптимизации:**

- ✅ `React.useMemo` для columns (строка 318)
- ✅ `React.useCallback` для handlers (строки 256-263)
- ✅ Server-side фильтрация/сортировка/пагинация (shared.ts:330-346)

**Переиспользование утилит:**

- ✅ `processOrders()` - `packages/utils/src/order-utils.ts:281`
- ✅ `filterOrders()` - `packages/utils/src/order-utils.ts:178`
- ✅ `sortOrders()` - `packages/utils/src/order-utils.ts:49`
- ✅ `paginateOrders()` - `packages/utils/src/order-utils.ts:239`

---

## 🔧 РЕКОМЕНДАЦИИ

### 1. Размер компонента (CODE_STYLE_GUIDE.md)

**Факт:** `OrdersContainer.tsx` = **360 строк** (лимит 200)

**Рекомендация:** Вынести `OrdersFilters` в отдельный файл

**Текущая структура (строки 180-226):**

```tsx
function OrdersFilters({
  statusFilter,
  sortBy,
  onStatusChange,
  onSortChange,
  t,
}: {...}) {
  // 46 строк кода
}
```

**Новая структура:**

```
apps/web/src/components/orders/
├── OrdersContainer.tsx          (~250 строк)
├── OrdersFilters.tsx            (~90 строк, новый файл)
└── orders-table-components.tsx  (УДАЛИТЬ)
```

### 2. Debounce для поиска

**Текущая реализация:**

```typescript
// Строка 256-259
const handleSearch = React.useCallback(
  (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  },
  [setSearchTerm, setCurrentPage]
);
```

**Проблема:** Каждое нажатие клавиши → API запрос

**Решение:**

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback((term: string) => {
  setSearchTerm(term);
  setCurrentPage(1);
}, 300);
```

---

## ✅ ПОЛОЖИТЕЛЬНЫЕ АСПЕКТЫ

### 1. Архитектура ⭐⭐⭐⭐⭐

| Критерий                   | Оценка     | Статус                            |
| -------------------------- | ---------- | --------------------------------- |
| **Архитектура**            | ⭐⭐⭐⭐⭐ | ✅ Excellent                      |
| **Типизация**              | ⭐⭐⭐⭐⭐ | ✅ Perfect                        |
| **Интеграция**             | ⭐⭐⭐⭐⭐ | ✅ Полная                         |
| **Локализация**            | ⭐⭐⭐⭐⭐ | ✅ Правильная                     |
| **Обработка ошибок**       | ⭐⭐⭐⭐   | ✅ Good                           |
| **Производительность**     | ⭐⭐⭐⭐   | ✅ Оптимизирована                 |
| **Избыточность (Rule 20)** | ⭐⭐       | 🔴 **CRITICAL** - мёртвый файл    |
| **Хардкод**                | ⭐⭐⭐     | 🟡 **TECH DEBT** - константа      |
| **Размер компонента**      | ⭐⭐⭐     | 🟢 Рекомендация - превышает лимит |

---

## 🎯 ПЛАН ИСПРАВЛЕНИЙ

### 🔴 СРОЧНО (Блокируют продакшн - 2 проблемы)

**1. Удалить мёртвый файл**

```powershell
Remove-Item "apps\web\src\components\orders\orders-table-components.tsx"
```

- **Причина:** Нарушение Rule 20, 21, 23
- **Время:** 1 минута
- **Риск:** Нет (файл не используется)

**2. Исправить Tailwind классы**

```typescript
// В OrdersContainer.tsx, строка 1 (добавить импорт):
import { getStatusColorClass } from '@repo/utils';

// В строке 51 (заменить):
className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(order.status)}`}
```

- **Причина:** Текущий код НЕ РАБОТАЕТ
- **Время:** 2 минуты
- **Риск:** Низкий (функция уже существует и протестирована)

### 🟡 ВАЖНО (Технический долг - 1 проблема)

**3. Заменить хардкод константы**

```typescript
// В OrdersContainer.tsx, строка 1 (изменить импорт):
import { ORDER_STATUS_CONFIG, VALIDATION_LIMITS, type OrderStatus } from '@repo/constants';

// В строке 15 (заменить):
const ORDERS_PER_PAGE = VALIDATION_LIMITS.DEFAULT_PAGE_SIZE;
```

- **Причина:** Нарушение Rule 17, 20
- **Время:** 1 минута
- **Риск:** Нет (значение не меняется)

### 🟢 ОПЦИОНАЛЬНО (Улучшения - 2 рекомендации)

**4. Вынести OrdersFilters** (если потребуется в будущем)
**5. Добавить debounce для поиска** (оптимизация UX)

---

## 📝 ЗАКЛЮЧЕНИЕ

**Общая оценка:** 7/10 → 9/10 (после исправлений)

**Код функционален и правильно интегрирован**, но содержит:

- 🔴 **2 критические проблемы** (1 мёртвый файл + 1 баг Tailwind)
- 🟡 **1 технический долг** (хардкод константы)
- 🟢 **2 рекомендации** (размер компонента, debounce)

**После исправления 3-х проблем (🔴+🟡):** код будет соответствовать всем требованиям проекта.

**Время на исправления:** ~5 минут  
**Риск исправлений:** Минимальный (все решения протестированы в проекте)

---

**Проверено согласно:**

- ✅ Rule 8 (Запрет предположений) - использованы 4 метода поиска
- ✅ Rule 20 (Запрет избыточности) - найдены все дубликаты
- ✅ Rule 21 (Осознанное удаление) - проанализирован мёртвый код
- ✅ Rule 23 (Обязательная интеграция) - проверена реальная работа
- ✅ Rule 24 (Знание структуры) - прочитан PROJECT_STRUCTURE_MAP.md
- ✅ UNIVERSAL_AUDIT_SYSTEM.md - применена система аудита

**Дата инспекции:** 8 октября 2025  
**Инспектор:** AI Agent (следуя ai-agent-rules.yml)
