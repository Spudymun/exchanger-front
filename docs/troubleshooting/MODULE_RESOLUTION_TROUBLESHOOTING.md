# Module Resolution Troubleshooting

## 🚨 Типичные ошибки модульности

### Ошибка 1: Module not found

**Симптомы:**

```
Module not found: Can't resolve '@repo/hooks/src/state/ui-store'
```

**Причина:** Отсутствует export в package.json

**Решение:**

```json
// packages/hooks/package.json
{
  "exports": {
    ".": "./src/index.ts",
    "./src/state/ui-store": "./src/state/ui-store.ts" // ← Добавить
  }
}
```

### Ошибка 2: SSR Hydration Mismatch

**Симптомы:**

```
Error: useUIStore is not a function
TypeError: (0, o.createStore) is not a function
```

**Причина:** Zustand store импортируется на сервере

**Решение:**

```typescript
// ❌ Неправильно
import { useUIStore } from '@repo/hooks';

// ✅ Правильно
('use client');
import { useUIStore } from '@repo/hooks/src/client-hooks';
```

### Ошибка 3: Rules of Hooks нарушены

**Симптомы:**

```
React has detected a change in the order of Hooks called
```

**Причина:** Условные вызовы хуков

**Решение:**

```typescript
// ❌ Неправильно
if (storeHook) {
  return storeHook(); // Условный вызов хука
}

// ✅ Правильно
const storeData = storeHook ? storeHook() : defaultData;
return storeData;
```

## 🎯 Архитектурные принципы

### 1. SSR-safe vs Client-only разделение

**SSR-safe (основной index.ts):**

- Типы и интерфейсы
- Константы и схемы валидации
- Чистые функции без состояния

**Client-only (client-hooks.ts):**

- Zustand stores
- Хуки с побочными эффектами
- Browser-specific код

### 2. Правильная настройка exports

```json
{
  "exports": {
    ".": "./src/index.ts", // SSR-safe
    "./src/client-hooks": "./src/client-hooks.ts", // Client-only
    "./src/state/ui-store": "./src/state/ui-store.ts", // Прямой доступ
    "./state": "./src/state/index.ts" // Подмодули
  }
}
```

### 3. Паттерн использования

```typescript
// В Server Components - только типы
import type { UseFormReturn } from '@repo/hooks';

// В Client Components - полная функциональность
('use client');
import { useUIStore, useForm } from '@repo/hooks/src/client-hooks';
```

## 🔧 Диагностика проблем

### Шаг 1: Проверить exports

```bash
# Проверить что экспортируется
cat packages/hooks/package.json | grep -A 10 "exports"
```

### Шаг 2: Проверить SSR/Client разделение

```typescript
// Если ошибка в production build - проблема с SSR
// Добавить 'use client' и использовать client-hooks
```

### Шаг 3: Проверить порядок хуков

```typescript
// Все хуки должны вызываться в одном порядке
// Избегать условных вызовов хуков
```

## 📋 Чеклист решения проблем

- [ ] Добавлен нужный export в package.json
- [ ] Используется правильный путь импорта
- [ ] Client компоненты помечены 'use client'
- [ ] Хуки вызываются без условий
- [ ] SSR/Client разделение соблюдено
