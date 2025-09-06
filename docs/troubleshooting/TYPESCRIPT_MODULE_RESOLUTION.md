# TypeScript Module Resolution в Monorepo

## 🚨 Проблема: Module not found с .js расширениями

### Симптомы

```
Module not found: Can't resolve './factories/user-manager-factory.js'

> 15 | export { UserManagerFactory } from './factories/user-manager-factory.js';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

### Причина

**Конфликт между TypeScript ESM и Next.js webpack:**

- TypeScript с `moduleResolution: "NodeNext"` требует `.js` расширения для ESM импортов
- Next.js webpack ищет реальные `.ts` файлы в файловой системе
- Возникает несоответствие: TypeScript требует `.js`, а webpack ищет `.ts`

## ✅ Решение

### 1. Изменить moduleResolution на "bundler"

```json
// packages/your-package/tsconfig.json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "ES2022",
    "moduleResolution": "bundler" // ← Ключевое изменение
  }
}
```

### 2. Убрать .js расширения из импортов

```typescript
// ❌ Было (с NodeNext)
export { UserManagerFactory } from './factories/user-manager-factory.js';
export { getEnvironment } from './utils/environment.js';

// ✅ Стало (с bundler)
export { UserManagerFactory } from './factories/user-manager-factory';
export { getEnvironment } from './utils/environment';
```

## 🎯 Различия moduleResolution

| Режим        | Расширения    | Совместимость | Использование                   |
| ------------ | ------------- | ------------- | ------------------------------- |
| `"NodeNext"` | Требует `.js` | Node.js ESM   | Server-side пакеты              |
| `"node"`     | Не требует    | Legacy        | Deprecated ⚠️                   |
| `"bundler"`  | Не требует    | Webpack/Vite  | **Рекомендуется** для фронтенда |

## 📋 Когда использовать каждый режим

### moduleResolution: "bundler"

✅ **Используйте для:**

- Пакетов в монорепо
- Next.js приложений
- Библиотек для фронтенда
- Работы с современными bundlers

### moduleResolution: "NodeNext"

✅ **Используйте для:**

- Pure Node.js пакетов
- Server-side библиотек
- Когда нужна полная ESM совместимость

## 🔧 Пример исправления

### До (не работает)

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

```typescript
// Требует .js расширения
export { UserManagerFactory } from './factories/user-manager-factory.js';
```

### После (работает)

```json
{
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "bundler"
  }
}
```

```typescript
// Без расширений
export { UserManagerFactory } from './factories/user-manager-factory';
```

## 📝 Best Practices для Monorepo

1. **Унифицированная конфигурация**: Используйте `"bundler"` для всех фронтенд пакетов
2. **Избегайте .js расширений**: В TypeScript файлах не указывайте `.js`
3. **Тестируйте импорты**: После изменений проверяйте что все импорты работают
4. **Документируйте решения**: Добавляйте комментарии в tsconfig.json

## ⚠️ Частые ошибки

```typescript
// ❌ Неправильно - смешивание стилей
import { something } from './file.js'; // NodeNext style
import { other } from './other'; // bundler style

// ✅ Правильно - единый стиль
import { something } from './file'; // bundler style везде
import { other } from './other';
```

## 🔍 Диагностика проблем

1. **Проверить tsconfig.json**: Убедиться что используется правильный moduleResolution
2. **Проверить импорты**: Все должны быть в едином стиле
3. **Перезапустить dev server**: После изменений tsconfig.json
4. **Очистить кэш**: `rm -rf .next node_modules/.cache`

---

**💡 Запомните:** `moduleResolution: "bundler"` - это современный стандарт для фронтенд проектов с TypeScript!
