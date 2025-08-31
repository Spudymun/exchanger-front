# Урок 8.1: Zod - Runtime валидация типов

> **Цель урока**: Понять принципы runtime валидации с Zod и ее интеграцию с TypeScript в реальном проекте

## 📖 Теория

### Что такое Runtime валидация?

В TypeScript типы существуют только во время компиляции. После сборки проекта вся информация о типах исчезает. Но что если данные приходят извне (API, пользовательский ввод) и нужно проверить их корректность в runtime?

**Проблема:**

```typescript
interface User {
  email: string;
  age: number;
}

// Во время компиляции все хорошо
const user: User = { email: 'test@example.com', age: 25 };

// Но что если данные приходят от пользователя?
const userInput = JSON.parse(formData); // any
const processedUser: User = userInput; // ❌ Опасно! Нет проверки
```

**Решение через Zod:**

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
});

type User = z.infer<typeof UserSchema>; // TypeScript тип из схемы

// Runtime проверка
const result = UserSchema.safeParse(userInput);
if (result.success) {
  const user: User = result.data; // ✅ Безопасно!
} else {
  console.log(result.error); // Детальная информация об ошибках
}
```

### Преимущества Zod

1. **Синхронизация типов и валидации** - один источник истины
2. **Runtime безопасность** - проверка данных во время выполнения
3. **Подробные ошибки** - точные сообщения о проблемах
4. **Композиция схем** - переиспользование и комбинирование
5. **Трансформация данных** - очистка и преобразование значений

## 🔍 Анализ кода проекта

### Базовые схемы валидации

Рассмотрим файл `packages/utils/src/validation/schemas-basic.ts`:

```typescript
import { VALIDATION_LIMITS } from '@repo/constants';
import { z } from 'zod';

/**
 * EMAIL VALIDATION SCHEMA
 */
export const emailSchema = z
  .string()
  .min(1, 'EMAIL_REQUIRED')
  .email('EMAIL_INVALID_FORMAT')
  .max(VALIDATION_LIMITS.EMAIL_MAX_LENGTH, 'EMAIL_TOO_LONG');

/**
 * PASSWORD VALIDATION SCHEMA
 */
export const passwordSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH, 'PASSWORD_TOO_SHORT')
  .max(VALIDATION_LIMITS.PASSWORD_MAX_LENGTH, 'PASSWORD_TOO_LONG')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'PASSWORD_WEAK');
```

**Что здесь происходит:**

1. **Константы из @repo/constants** - единый источник истины для лимитов
2. **Строковые ключи ошибок** - для интеграции с next-intl
3. **Композиция валидаторов** - от простого к сложному

### Архитектура валидации в проекте

Файл `packages/utils/src/validation/core.ts` показывает интеграцию с next-intl:

```typescript
/**
 * Главная функция обработки всех типов ошибок валидации
 */
function handleValidationIssue(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  // Проверяем специальные случаи формы в порядке приоритета
  return handleFormFieldValidation(issue, t) || handleGeneralValidation(issue, t);
}

/**
 * Создает Zod error map интегрированный с next-intl
 */
export function createNextIntlZodErrorMap(config: NextIntlValidationConfig): z.ZodErrorMap {
  const { t } = config;

  return (issue, ctx) => {
    return handleValidationIssue(issue, t) || { message: ctx.defaultError };
  };
}
```

**Архитектурное решение:**

- **Единый error map** для всех форм
- **Локализация через next-intl** - переводы ошибок
- **Специализированные handlers** для разных типов полей

## 💻 Практическое задание

### Задание 1: Создание базовой Zod схемы

Создайте файл `practice-schemas.ts` и реализуйте схему для пользователя:

```typescript
import { z } from 'zod';

// TODO: Создайте схему для пользователя с полями:
// - name: строка, минимум 2 символа, максимум 50
// - email: валидный email
// - age: число от 18 до 100
// - phone: опциональная строка

export const userSchema = z.object({
  // Ваш код здесь
});

// TODO: Создайте TypeScript тип из схемы
export type User = // Ваш код здесь

// TODO: Функция валидации пользователя
export function validateUser(data: unknown): { success: boolean; data?: User; errors?: string[] } {
  // Ваш код здесь
}
```

### Задание 2: Анализ схемы из проекта

Откройте файл `packages/utils/src/validation/schemas-crypto.ts` и ответьте на вопросы:

1. Какие валидаторы применяются к полю `currency`?
2. Почему используется `.transform()` в некоторых схемах?
3. Как обеспечивается безопасность в crypto схемах?

### Задание 3: Композиция схем

Изучите как в проекте комбинируются базовые схемы:

```typescript
// Из security-enhanced-auth-schemas.ts
export const fullySecurityEnhancedRegisterSchema = z
  .object({
    email: xssProtectedEmailSchema, // Расширенная email схема
    password: xssProtectedPasswordSchema, // Расширенная password схема
    confirmPassword: z.string(),
    captcha: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'PASSWORDS_DO_NOT_MATCH',
    path: ['confirmPassword'],
  });
```

**Вопросы для анализа:**

1. Что такое `xssProtectedEmailSchema` и чем отличается от `emailSchema`?
2. Зачем нужен `.refine()` для проверки паролей?
3. Почему ошибка привязывается к `path: ['confirmPassword']`?

## ✅ Проверка знаний

### Теоретические вопросы

1. **В чем разница между compile-time и runtime валидацией?**
   - a) Compile-time проверяет синтаксис, runtime - логику
   - b) Compile-time работает при сборке, runtime - при выполнении
   - c) Разницы нет, это одно и то же

2. **Что возвращает `schema.safeParse(data)`?**
   - a) Валидные данные или `null`
   - b) Объект с `success` флагом и `data` или `error`
   - c) `true` или `false`

3. **Зачем в проекте используются строковые ключи ошибок?**
   - a) Для экономии памяти
   - b) Для интеграции с системой переводов
   - c) Для лучшей производительности

### Практические задания

1. **Создайте схему для номера телефона** с проверкой украинского формата (+380...)

2. **Объясните код:**

   ```typescript
   const schema = z.string().transform(val => val.trim().toLowerCase());
   ```

3. **Найдите ошибку:**
   ```typescript
   const userSchema = z.object({
     email: z.string().email(),
     age: z.string().min(18), // ❌ Что не так?
   });
   ```

## 🔧 Отладка и типичные ошибки

### Ошибка 1: Неправильное использование типов

```typescript
// ❌ Неправильно
const schema = z.object({
  count: z.string().min(1), // count должен быть числом
});

// ✅ Правильно
const schema = z.object({
  count: z.number().min(1),
});
```

### Ошибка 2: Забыли про async операции

```typescript
// ❌ Неправильно для async валидации
const schema = z.string().refine(async val => {
  const exists = await checkExists(val);
  return !exists;
});

// ✅ Правильно
const schema = z.string().refine(async val => {
  const exists = await checkExists(val);
  return !exists;
});

// Использование:
await schema.parseAsync(data); // Не .parse()!
```

### Ошибка 3: Неправильная обработка ошибок

```typescript
// ❌ Неправильно
try {
  const data = schema.parse(input);
} catch (error) {
  console.log(error.message); // Может быть неинформативно
}

// ✅ Правильно
const result = schema.safeParse(input);
if (!result.success) {
  result.error.errors.forEach(err => {
    console.log(`${err.path.join('.')}: ${err.message}`);
  });
}
```

## 📚 Дополнительные материалы

### Полезные Zod паттерны

1. **Условная валидация:**

   ```typescript
   const schema = z
     .object({
       type: z.enum(['individual', 'company']),
       taxId: z.string().optional(),
     })
     .refine(
       data => {
         if (data.type === 'company') {
           return data.taxId !== undefined;
         }
         return true;
       },
       {
         message: 'Tax ID required for companies',
         path: ['taxId'],
       }
     );
   ```

2. **Трансформация данных:**

   ```typescript
   const dateSchema = z.string().transform(str => new Date(str));
   const numberSchema = z.string().transform(str => parseInt(str, 10));
   ```

3. **Переиспользование схем:**

   ```typescript
   const baseUserSchema = z.object({
     name: z.string(),
     email: z.string().email(),
   });

   const adminUserSchema = baseUserSchema.extend({
     permissions: z.array(z.string()),
   });
   ```

### Ресурсы для изучения

- [Официальная документация Zod](https://zod.dev/)
- [Zod GitHub Repository](https://github.com/colinhacks/zod)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🎯 Резюме урока

В этом уроке вы изучили:

1. **Концепцию runtime валидации** и ее важность в современных приложениях
2. **Основы работы с Zod** - создание схем, валидация, получение типов
3. **Архитектуру валидации в проекте** - интеграция с next-intl и константами
4. **Практические паттерны** использования Zod в реальном приложении

**Следующий урок**: [Урок 8.2: Security-Enhanced схемы валидации](./lesson-8.2-security-enhanced-schemas.md) - изучим как обеспечить безопасность в финансовом приложении через специализированные схемы валидации.

---

[← README](./README.md) | [Урок 8.2 →](./lesson-8.2-security-enhanced-schemas.md)
