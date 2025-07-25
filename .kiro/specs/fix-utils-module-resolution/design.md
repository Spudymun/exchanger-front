# Дизайн: Исправление разрешения модуля @repo/utils

## Обзор

Проблема с разрешением модуля `@repo/utils` в веб-приложении ExchangeGO вызвана несколькими факторами:

1. **Отсутствующая зависимость**: В `apps/web/package.json` не объявлена зависимость `@repo/utils`
2. **Неполная конфигурация TypeScript**: В `tsconfig.json` веб-приложения отсутствуют пути для разрешения `@repo/utils`
3. **Несогласованность с другими пакетами**: Другие внутренние пакеты имеют специальные пути в TypeScript, но `@repo/utils` их не имеет

Решение должно обеспечить корректное разрешение модуля как на уровне npm workspaces, так и на уровне TypeScript, следуя существующим паттернам в проекте.

## Архитектура

### Текущее состояние

```mermaid
graph TD
    A[apps/web] -->|❌ Отсутствует| B[@repo/utils]
    A -->|✅ Работает| C[@repo/ui]
    A -->|✅ Работает| D[@repo/constants]
    A -->|✅ Работает| E[@repo/hooks]

    F[TypeScript paths] -->|✅ Настроено| D
    F -->|❌ Отсутствует| B
```

### Целевое состояние

```mermaid
graph TD
    A[apps/web] -->|✅ Зависимость добавлена| B[@repo/utils]
    A -->|✅ Работает| C[@repo/ui]
    A -->|✅ Работает| D[@repo/constants]
    A -->|✅ Работает| E[@repo/hooks]

    F[TypeScript paths] -->|✅ Настроено| D
    F -->|✅ Добавлено| B
```

### Структура разрешения модулей

1. **npm workspaces** - обеспечивает связывание пакетов на уровне Node.js
2. **TypeScript paths** - обеспечивает разрешение типов и автодополнение в IDE
3. **Next.js bundler** - использует оба механизма для сборки

## Компоненты и интерфейсы

### 1. Конфигурация зависимостей

**Файл**: `apps/web/package.json`

```json
{
  "dependencies": {
    "@repo/constants": "*",
    "@repo/exchange-core": "*",
    "@repo/hooks": "*",
    "@repo/providers": "*",
    "@repo/ui": "*",
    "@repo/utils": "*" // ← Добавить эту строку
  }
}
```

### 2. Конфигурация TypeScript

**Файл**: `apps/web/tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@repo/constants": ["../../packages/constants/dist"],
      "@repo/constants/*": ["../../packages/constants/dist/*"],
      "@repo/utils": ["../../packages/utils/src"],
      "@repo/utils/*": ["../../packages/utils/src/*"]
    }
  }
}
```

### 3. Проверка экспортов пакета utils

**Файл**: `packages/utils/package.json`

Текущая конфигурация корректна:

```json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

### 4. Проверка экспортов в индексном файле

**Файл**: `packages/utils/src/index.ts`

Должен содержать экспорт `input-validation`:

```typescript
export * from './input-validation'; // ← Уже присутствует
```

## Модели данных

### Структура импорта

```typescript
// В компоненте SendingCard.tsx
import { useNumericInput } from '@repo/utils';

// Разрешается в:
// packages/utils/src/index.ts → export * from './input-validation'
// packages/utils/src/input-validation.ts → export function useNumericInput
```

### Типы функции useNumericInput

```typescript
interface NumericInputHook {
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>, currentValue: string) => void;
  formatValue: (value: string) => string;
}

function useNumericInput(currency?: string): NumericInputHook;
```

## Обработка ошибок

### Возможные ошибки и решения

1. **Module not found: Can't resolve '@repo/utils'**
   - **Причина**: Отсутствует зависимость в package.json
   - **Решение**: Добавить `"@repo/utils": "*"` в dependencies

2. **TypeScript cannot find module '@repo/utils'**
   - **Причина**: Отсутствуют пути в tsconfig.json
   - **Решение**: Добавить пути для @repo/utils

3. **Cannot find module '@repo/utils' or its corresponding type declarations**
   - **Причина**: Неправильная конфигурация экспортов
   - **Решение**: Проверить exports в package.json пакета utils

4. **Circular dependency warnings**
   - **Причина**: Неправильная структура зависимостей
   - **Решение**: Убедиться, что utils не зависит от веб-приложения

### Стратегия отката

Если возникнут проблемы:

1. Временно закомментировать импорт в SendingCard.tsx
2. Откатить изменения в package.json и tsconfig.json
3. Проверить работоспособность других пакетов
4. Повторить настройку пошагово

## Стратегия тестирования

### 1. Тестирование разрешения модулей

```bash
# Проверка установки зависимостей
npm install

# Проверка TypeScript
npm run check-types --workspace=web

# Проверка сборки
npm run build --workspace=web

# Проверка запуска в режиме разработки
npm run dev --workspace=web
```

### 2. Тестирование функциональности

```typescript
// Тест импорта
import { useNumericInput } from '@repo/utils';

// Тест использования
const { handleKeyDown, formatValue } = useNumericInput('BTC');
```

### 3. Тестирование автодополнения IDE

- Проверить, что IDE предлагает автодополнение для `@repo/utils`
- Проверить, что Ctrl+Click переходит к определению функции
- Проверить, что отображаются типы при наведении

### 4. Интеграционное тестирование

- Запустить веб-приложение
- Открыть форму обмена криптовалют
- Проверить работу поля ввода суммы
- Убедиться, что валидация работает корректно

## Критерии успеха

### Технические критерии

1. ✅ Команда `npm run dev --workspace=web` запускается без ошибок
2. ✅ TypeScript не выдает ошибок при проверке типов
3. ✅ Сборка проекта проходит успешно
4. ✅ IDE корректно разрешает импорты и предоставляет автодополнение

### Функциональные критерии

1. ✅ Компонент SendingCard.tsx успешно импортирует useNumericInput
2. ✅ Функция useNumericInput работает в форме обмена
3. ✅ Валидация числового ввода функционирует корректно
4. ✅ Форматирование значений работает для всех поддерживаемых валют

### Критерии качества

1. ✅ Решение следует существующим паттернам в проекте
2. ✅ Не нарушается работа других пакетов
3. ✅ Конфигурация совместима с Turborepo
4. ✅ Производительность сборки не ухудшается

## Альтернативные подходы

### Подход 1: Использование workspace: протокола

```json
{
  "dependencies": {
    "@repo/utils": "workspace:*"
  }
}
```

**Плюсы**: Более явное указание на workspace зависимость
**Минусы**: Не соответствует существующему паттерну в проекте

### Подход 2: Компиляция пакета utils

Изменить `packages/utils/package.json`:

```json
{
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc"
  }
}
```

**Плюсы**: Более стандартный подход для npm пакетов
**Минусы**: Требует дополнительного шага сборки, не соответствует текущей архитектуре

### Подход 3: Прямые импорты

```typescript
import { useNumericInput } from '../../packages/utils/src/input-validation';
```

**Плюсы**: Работает без дополнительной настройки
**Минусы**: Нарушает абстракцию пакетов, усложняет рефакторинг

## Рекомендуемое решение

Использовать **основной подход** с добавлением зависимости в package.json и настройкой путей TypeScript, так как:

1. Соответствует существующим паттернам в проекте
2. Минимально инвазивен
3. Обеспечивает корректную работу всех инструментов
4. Легко поддерживается и понимается командой

## Влияние на производительность

- **Время сборки**: Минимальное влияние, так как пакет уже существует
- **Размер бандла**: Не изменится, функция уже используется
- **Время разработки**: Улучшится благодаря корректному автодополнению
- **Кэширование Turborepo**: Не повлияет на существующие кэши

## Безопасность

- Изменения не влияют на безопасность приложения
- Все изменения касаются только внутренних зависимостей
- Не добавляются внешние зависимости
- Не изменяется логика валидации или обработки данных
