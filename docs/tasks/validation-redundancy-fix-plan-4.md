# План устранения ИЗБЫТОЧНОСТИ #4: Дублирование ValidationResult подходов

**Дата создания:** 23 августа 2025  
**Приоритет:** КРИТИЧЕСКИЙ (нарушение Rule 20 - Запрет избыточности)  
**Основание:** Фактический анализ кода + архитектурная документация проекта

## 🎯 ПРОБЛЕМА (подтверждена фактами)

### Обнаруженное дублирование:

**СИСТЕМА A (централизованная):** `ValidationResult` с массивом ошибок

```typescript
// packages/utils/src/validation-helpers.ts
interface ValidationResult {
  isValid: boolean;
  errors: string[]; // МАССИВ
}
```

**СИСТЕМА B (альтернативная):** `{isValid, error}` с одиночной ошибкой

```typescript
// packages/utils/src/validation/zod-helpers.ts + apps/web/src/hooks/
{
  isValid: boolean;
  error: string | null;
} // ОДИНОЧНАЯ
```

### Нарушения архитектурных принципов (из VALIDATION_ARCHITECTURE_GUIDE.md):

❌ **Single Source of Truth** - два источника истины для результатов валидации  
❌ **Централизация** - альтернативная система обходит централизованную  
❌ **Антипаттерн**: "Дублирование схем валидации в разных частях проекта"

## 📊 АНАЛИЗ ИСПОЛЬЗОВАНИЯ (100% факты)

### СИСТЕМА A (ValidationResult) - активное использование:

- ✅ `packages/exchange-core/src/utils/composite-validators.ts` - 4 использования
- ✅ `packages/utils/src/validation/zod-helpers.ts` - в `validateWithZodSchema`
- ✅ Экспортируется через `@repo/utils`

### СИСТЕМА B ({isValid, error}) - ограниченное использование:

- ❌ `validateWithZodSchemaUI` - **МЁРТВЫЙ КОД** (0 использований по grep)
- ❌ `useExchangeStoreWithTranslations.ts` - создает паттерн напрямую

### Статус по grep-анализу:

```bash
# validateWithZodSchemaUI - 0 использований в .tsx/.ts файлах
# { isValid: boolean; error: string | null } - только 1 место определения
# ValidationResult - 23 активных использования
```

## 🏗️ АРХИТЕКТУРНОЕ ОБОСНОВАНИЕ

### Принципы из VALIDATION_ARCHITECTURE_GUIDE.md:

#### 1. **Single Source of Truth**

> "Каждый тип валидации имеет одно место определения"

**ValidationResult** является каноническим подходом:

- Определен в централизованном месте
- Используется в core business logic
- Имеет полный набор helper функций

#### 2. **Централизация**

> "packages/utils/src/validation/ - обязательное место размещения"

**ValidationResult** соответствует принципу:

- Размещен в `packages/utils/src/validation-helpers.ts`
- Экспортируется через централизованный пакет
- Используется cross-package

#### 3. **Композитная архитектура**

> "Security-enhanced schemas композируют базовые building blocks"

**ValidationResult** поддерживает композицию:

- `mergeValidationResults` для объединения
- `createValidationResult` для стандартизации
- Совместим с Zod через адаптеры

## 📋 ПЛАН РЕАЛИЗАЦИИ

### **ЭТАП 1: Очистка мёртвого кода**

#### 1.1. Удалить неиспользуемую функцию

**Файл:** `packages/utils/src/validation/zod-helpers.ts`

**Удаляемый код (строки 22-40):**

```typescript
/**
 * Упрощенная версия для UI валидации
 * Совместима с существующими паттернами в input-validation.ts
 */
export function validateWithZodSchemaUI<T>(
  schema: z.ZodSchema<T>,
  value: unknown
): { isValid: boolean; error: string | null } {
  const result = schema.safeParse(value);

  if (result.success) {
    return { isValid: true, error: null };
  }

  const firstError = result.error.errors[0];
  return {
    isValid: false,
    error: firstError?.message || 'Validation failed',
  };
}
```

**Обоснование удаления:**

- **Факт:** 0 использований в кодовой базе
- **VALIDATION_ARCHITECTURE_GUIDE.md:** "Избегать дублирования схем валидации"
- **Rule 20:** Запрет избыточности

#### 1.2. Проверить экспорты

**Файл:** `packages/utils/src/validation/index.ts`

- Убедиться, что `validateWithZodSchemaUI` НЕ экспортируется
- Если экспортируется - удалить из экспортов

### **ЭТАП 2: Создание адаптера для обратной совместимости**

#### 2.1. Добавить адаптер в validation-helpers.ts

**Файл:** `packages/utils/src/validation-helpers.ts`

**Добавляемый код:**

```typescript
/**
 * Adapter pattern for UI components requiring single error format
 * Converts ValidationResult to { isValid, error } format
 *
 * @see VALIDATION_ARCHITECTURE_GUIDE.md - "Композитная архитектура"
 */
export function adaptValidationResultForUI(result: ValidationResult): {
  isValid: boolean;
  error: string | null;
} {
  return {
    isValid: result.isValid,
    error: result.errors.length > 0 ? result.errors[0] : null,
  };
}

/**
 * Helper for Zod schema validation with UI-compatible output
 * Uses centralized ValidationResult internally, adapts output format
 */
export function validateWithZodForUI<T>(
  schema: z.ZodSchema<T>,
  value: unknown
): { isValid: boolean; error: string | null } {
  const result = validateWithZodSchema(schema, value);
  return adaptValidationResultForUI(result);
}
```

**Обоснование:**

- **VALIDATION_ARCHITECTURE_GUIDE.md:** "Композитная архитектура"
- **CODE_STYLE_GUIDE.md:** Adapter pattern для совместимости
- **Single Source of Truth:** Использует ValidationResult внутри

### **ЭТАП 3: Обновление зависимых мест**

#### 3.1. Обновить useExchangeStoreWithTranslations.ts

**Файл:** `apps/web/src/hooks/useExchangeStoreWithTranslations.ts`

**Текущий код (строки 122-137):**

```typescript
const validateFieldImpl = (
  fieldName: string,
  value: unknown,
  validationT: (key: string, values?: Record<string, string | number>) => string
) => {
  if (fieldName === 'unknown') return { isValid: true, error: null as string | null };

  const schema = getFieldSchema(fieldName);
  const errorMap = createNextIntlZodErrorMap({ t: validationT, locale: 'current' });
  const result = schema.safeParse(value, { errorMap });

  if (result.success) return { isValid: true, error: null as string | null };

  const firstError = result.error.errors[0];
  return { isValid: false, error: firstError ? firstError.message : validationT('invalid') };
};
```

**Новый код:**

```typescript
const validateFieldImpl = (
  fieldName: string,
  value: unknown,
  validationT: (key: string, values?: Record<string, string | number>) => string
) => {
  if (fieldName === 'unknown') return { isValid: true, error: null as string | null };

  const schema = getFieldSchema(fieldName);
  const errorMap = createNextIntlZodErrorMap({ t: validationT, locale: 'current' });

  // Используем централизованную систему ValidationResult + адаптер
  const validationResult = validateWithZodSchema(schema.safeParse(value, { errorMap }));
  return adaptValidationResultForUI(validationResult);
};
```

**Требуемые импорты:**

```typescript
import { validateWithZodForUI } from '@repo/utils';
```

### **ЭТАП 4: Проверка интеграции**

#### 4.1. Контрольные точки:

- ✅ TypeScript компиляция без ошибок
- ✅ Все тесты проходят
- ✅ Обратная совместимость сохранена
- ✅ Интерфейс `{ isValid: boolean; error: string | null }` не изменился

#### 4.2. Проверка архитектурной целостности:

- ✅ ValidationResult остается единственным источником истины
- ✅ Адаптер обеспечивает композитную архитектуру
- ✅ Мёртвый код удален

## 🔍 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

### **Устранение нарушений:**

- ✅ **Single Source of Truth** восстановлен
- ✅ **Дублирование подходов** устранено
- ✅ **Мёртвый код** удален

### **Архитектурные улучшения:**

- ✅ Централизация через `@repo/utils`
- ✅ Adapter pattern для совместимости
- ✅ Композитная архитектура сохранена

### **Метрики:**

- **Удалено:** 1 дублированная функция (~20 строк)
- **Добавлено:** 2 адаптера (~15 строк)
- **Изменено:** 1 место использования
- **Чистая экономия:** ~5 строк + устранение архитектурного долга

## 📚 ССЫЛКИ НА ДОКУМЕНТАЦИЮ

1. **VALIDATION_ARCHITECTURE_GUIDE.md** - архитектурные принципы
2. **CODE_STYLE_GUIDE.md** - Adapter pattern
3. **ai-agent-rules.yml Rule 20** - запрет избыточности
4. **PROJECT_STRUCTURE_MAP.md** - централизация в packages/utils

## ✅ КРИТЕРИИ ГОТОВНОСТИ

### Обязательные проверки:

- [ ] Функция `validateWithZodSchemaUI` удалена
- [ ] Адаптеры добавлены в `validation-helpers.ts`
- [ ] `useExchangeStoreWithTranslations.ts` обновлен
- [ ] TypeScript компиляция успешна
- [ ] Тесты проходят
- [ ] Обратная совместимость сохранена

### Архитектурная валидация:

- [ ] ValidationResult - единственный источник истины
- [ ] Мёртвый код отсутствует
- [ ] Централизация через `@repo/utils` соблюдена
- [ ] Принципы VALIDATION_ARCHITECTURE_GUIDE.md выполнены

**СТАТУС:** ✅ **ПЛАН ГОТОВ К РЕАЛИЗАЦИИ** (основан на фактах документации и кода)
